import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { formatINR } from '../lib/inr'
import type { FurnitureItem, Metrics } from '../types/layout'
import { furnitureCatalog } from '../three/catalog'

const COLORS = ['#38BDF8','#8B5CF6','#F59E0B','#10B981','#F43F5E','#6366F1','#14B8A6','#EC4899','#84CC16','#A855F7']

const SHOP_LINKS: Record<string,string> = {
  sofa:'https://www.amazon.in/s?k=sofa', bed:'https://www.amazon.in/s?k=bed+frame',
  table:'https://www.amazon.in/s?k=table', chair:'https://www.amazon.in/s?k=chair',
  wardrobe:'https://www.amazon.in/s?k=wardrobe', tvUnit:'https://www.amazon.in/s?k=tv+unit',
  plant:'https://www.amazon.in/s?k=indoor+plant', floorLamp:'https://www.amazon.in/s?k=floor+lamp',
  sideTable:'https://www.amazon.in/s?k=side+table', bookshelf:'https://www.amazon.in/s?k=bookshelf',
}

const BUDGET_ALT: Record<string,{label:string;savings:number}> = {
  sofa:{label:'Fabric 2-Seater',savings:0.30}, bed:{label:'Platform Frame',savings:0.25},
  table:{label:'Folding Table',savings:0.40}, chair:{label:'Plastic Chair',savings:0.55},
  wardrobe:{label:'Open Rack',savings:0.35}, tvUnit:{label:'Wall-Mount Shelf',savings:0.45},
  plant:{label:'Artificial Plant',savings:0.50}, floorLamp:{label:'LED Clip Lamp',savings:0.60},
  sideTable:{label:'Stool Table',savings:0.40}, bookshelf:{label:'Wall Shelf',savings:0.35},
}

type CostItem = { name:string; type:string; cost:number; pct:number }

export function CostBreakdown({ items, metrics, onClose }: { items:FurnitureItem[]; metrics:Metrics; onClose:()=>void }) {
  const [showBudget, setShowBudget] = React.useState(false)

  const costByType = React.useMemo(() => {
    const map = new Map<string,number>()
    items.forEach(it => map.set(it.type, (map.get(it.type)??0)+it.costINR))
    const total = metrics.totalCostINR||1
    const r: CostItem[] = []
    map.forEach((cost,type) => {
      const spec = furnitureCatalog[type as keyof typeof furnitureCatalog]
      r.push({ name: spec?.label??type, type, cost, pct: (cost/total)*100 })
    })
    r.sort((a,b) => b.cost - a.cost)
    return r
  }, [items, metrics])

  const budgetTotal = React.useMemo(() =>
    items.reduce((s,it) => { const a=BUDGET_ALT[it.type]; return s+(a?it.costINR*(1-a.savings):it.costINR) }, 0)
  , [items])

  const savings = metrics.totalCostINR - budgetTotal

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{scale:0.9,opacity:0,y:30}} animate={{scale:1,opacity:1,y:0}} exit={{scale:0.9,opacity:0,y:30}} transition={{type:'spring',damping:25,stiffness:300}} onClick={e=>e.stopPropagation()} className="relative w-full max-w-2xl mx-4 max-h-[85vh] overflow-y-auto rounded-2xl" style={{background:'rgba(10,10,18,0.92)',backdropFilter:'blur(40px)',border:'1px solid rgba(255,255,255,0.08)',boxShadow:'0 24px 80px rgba(0,0,0,0.6)'}} id="cost-breakdown-panel">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06] sticky top-0 z-10" style={{background:'rgba(10,10,18,0.95)'}}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-wide">Cost Breakdown</h2>
              <p className="text-[10px] text-white/30 font-medium">{items.length} items · Budget {formatINR(metrics.budgetINR)}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Total cost hero */}
        <div className="p-5 border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-white/30 font-semibold mb-1">Total Cost</div>
              <div className="text-4xl font-light text-white tracking-tight tabular-nums">{formatINR(metrics.totalCostINR)}</div>
              <div className={`text-xs font-medium mt-1 ${metrics.budgetCompliancePct>=100?'text-emerald-400/80':'text-red-400/80'}`}>
                {metrics.budgetCompliancePct>=100 ? `✓ Under budget by ${formatINR(metrics.budgetINR-metrics.totalCostINR)}` : `✗ Over budget by ${formatINR(metrics.totalCostINR-metrics.budgetINR)}`}
              </div>
            </div>
            <button onClick={()=>setShowBudget(!showBudget)} className={`px-3 py-2 rounded-xl text-[11px] font-semibold transition-all ${showBudget?'bg-emerald-500/15 border border-emerald-500/25 text-emerald-400':'bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-white/70'}`}>
              {showBudget ? '✓ Budget Mode' : '💡 Budget Alt.'}
            </button>
          </div>
          <AnimatePresence>
            {showBudget && (
              <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden">
                <div className="mt-4 p-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/10">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-emerald-400/60 font-semibold uppercase tracking-wider">Budget Alternative</span>
                    <span className="text-sm font-medium text-emerald-400">{formatINR(budgetTotal)}</span>
                  </div>
                  <div className="text-xs text-emerald-400/80 font-medium">Save {formatINR(savings)} ({((savings/metrics.totalCostINR)*100).toFixed(0)}% less)</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Pie chart + item list */}
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-[9px] uppercase tracking-[0.25em] text-white/30 font-bold mb-3">Spending Distribution</div>
            <div className="h-48" style={{ minWidth: 120, minHeight: 120 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
                <PieChart>
                  <Pie data={costByType} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="cost" nameKey="name" stroke="none">
                    {costByType.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{background:'rgba(10,10,18,0.95)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',fontSize:'12px',color:'#fff'}} formatter={(v)=>formatINR(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-2 justify-center">
              {costByType.map((item,i)=>(
                <div key={item.type} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{background:COLORS[i%COLORS.length]}} />
                  <span className="text-[9px] text-white/40 font-medium">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[9px] uppercase tracking-[0.25em] text-white/30 font-bold mb-3">Shopping List</div>
            <div className="space-y-2.5">
              {costByType.map((item,i) => {
                const alt = BUDGET_ALT[item.type]
                const altCost = alt ? item.cost*(1-alt.savings) : item.cost
                return (
                  <div key={item.type} className="flex items-center gap-3 group">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{background:COLORS[i%COLORS.length]}} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/80 font-medium truncate">{item.name}</span>
                        <span className="text-xs text-white/60 tabular-nums font-medium">{formatINR(showBudget?altCost:item.cost)}</span>
                      </div>
                      {showBudget && alt && <div className="text-[10px] text-emerald-400/60 mt-0.5">↳ {alt.label} (−{(alt.savings*100).toFixed(0)}%)</div>}
                      <div className="flex items-center justify-between mt-0.5">
                        <div className="h-[2px] flex-1 bg-white/[0.04] rounded-full overflow-hidden mr-2">
                          <div className="h-full rounded-full" style={{width:`${item.pct}%`,background:COLORS[i%COLORS.length],opacity:0.6}} />
                        </div>
                        <span className="text-[9px] text-white/25 tabular-nums">{item.pct.toFixed(0)}%</span>
                      </div>
                    </div>
                    <a href={SHOP_LINKS[item.type]??'#'} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} className="flex-shrink-0 w-6 h-6 rounded bg-white/[0.04] flex items-center justify-center text-white/20 hover:text-[#FF9900] hover:bg-[#FF9900]/10 transition-all opacity-0 group-hover:opacity-100" title="Shop on Amazon">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M21 12l-4-4v3H7V8l-4 4 4 4v-3h10v3l4-4z" /></svg>
                    </a>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
