import { furnitureCatalog } from '../three/catalog'
import type { LayoutSolution } from '../types/layout'

/** Export the currently displayed layout, including edited prices and variants. */
export async function exportLayoutPDF(solution: LayoutSolution): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  let y = 22
  const money = (n: number) => `INR ${Math.round(n).toLocaleString('en-IN')}`
  const background = () => {
    pdf.setFillColor(250,247,242); pdf.rect(0,0,210,297,'F')
    pdf.setTextColor(45,58,47); pdf.setFont('helvetica','bold'); pdf.setFontSize(22)
    pdf.text('LayoutMind',16,22)
    pdf.setDrawColor(201,169,110); pdf.line(16,28,194,28); y=39
  }
  const space = (h:number) => {if(y+h>276){pdf.addPage(); background()}}
  const text = (value:string,size=10,bold=false) => {
    pdf.setFont('helvetica',bold?'bold':'normal'); pdf.setFontSize(size)
    // Standard PDF fonts do not contain the rupee symbol or every Unicode glyph.
    const lines: string[] = pdf.splitTextToSize(value.replace(/₹/g,'INR ').replace(/[^\x20-\x7E\n]/g,' '),178)
    for(const line of lines){space(size*.45+2);pdf.text(line,16,y);y+=size*.45+2}
  }
  background()
  text(`${solution.room.type} | ${solution.room.widthM} x ${solution.room.lengthM} m`,14,true)
  text(solution.selectedStyles.join(' / '));text(solution.edited?'Customized design':'Generated design')
  const canvas = document.querySelector<HTMLCanvasElement>('.workspace-page canvas')
  if(canvas && canvas.width>0 && canvas.height>0){
    try{
      const h=Math.min(100,178*canvas.height/canvas.width),w=h*canvas.width/canvas.height
      space(h+8);pdf.addImage(canvas.toDataURL('image/png'),'PNG',16+(178-w)/2,y,w,h);y+=h+8
    }catch{ text('3D preview unavailable on this device.') }
  }
  text('Design brief',12,true);text(solution.prompt)
  y+=4;text('Estimated budget',12,true)
  const total=solution.items.reduce((sum,it)=>sum+it.costINR,0)
  text(`Furniture total: ${money(total)} | Budget: ${money(solution.metrics.budgetINR)}`)
  text(total>solution.metrics.budgetINR?`Over budget by ${money(total-solution.metrics.budgetINR)}`:`Remaining: ${money(solution.metrics.budgetINR-total)}`)
  text('Planning estimates only; prices exclude installation, delivery and taxes.',9)
  y+=4;text('Furniture & fixtures',12,true)
  const groups=new Map<string,{label:string,count:number,unit:number,total:number}>()
  for(const item of solution.items){
    const label=item._swapLabel || furnitureCatalog[item.type].label
    const key=JSON.stringify([item.type,label,item.costINR])
    const group=groups.get(key)??{label,count:0,unit:item.costINR,total:0}
    group.count++;group.total+=item.costINR;groups.set(key,group)
  }
  for(const row of groups.values())text(`${row.label} x ${row.count} | ${money(row.unit)} each | ${money(row.total)}`)
  y+=4;text('Layout notes',12,true);text(solution.explanation)
  if(solution.removedItems?.length){text('Items omitted',12,true);for(const item of solution.removedItems)text(`${item.type}: ${item.reason}`)}
  for(let page=1;page<=pdf.getNumberOfPages();page++){
    pdf.setPage(page);pdf.setFontSize(8);pdf.setTextColor(107,101,96)
    pdf.text(`LayoutMind | ${page} / ${pdf.getNumberOfPages()}`,16,288)
  }
  pdf.save(`LayoutMind_${solution.room.type.replace(/\s+/g,'_')}.pdf`)
}
