import { formatINR } from './inr'
import { furnitureCatalog } from '../three/catalog'

/**
 * Generates a professional PDF report for the layout.
 * Uses jsPDF with dynamic import to avoid ESM bundling issues.
 */
export async function exportLayoutPDF(solution: any): Promise<void> {
  // Dynamic import to avoid any ESM/CJS issues
  const jspdfModule = await import('jspdf')
  const JsPDF = jspdfModule.jsPDF || jspdfModule.default

  if (!JsPDF) {
    alert('PDF library failed to load. Please try again.')
    return
  }

  const pdf = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = 210
  const margin = 16
  const contentW = pageW - margin * 2
  let y = margin

  const dark: [number, number, number] = [10, 10, 18]
  const white: [number, number, number] = [255, 255, 255]
  const primary: [number, number, number] = [56, 189, 248]
  const gold: [number, number, number] = [212, 175, 55]
  const muted: [number, number, number] = [148, 163, 184]

  // Background
  pdf.setFillColor(...dark)
  pdf.rect(0, 0, 210, 297, 'F')

  // Header
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(28)
  pdf.setTextColor(...white)
  pdf.text('RoomCraft', margin, y + 8)

  pdf.setFontSize(8)
  pdf.setTextColor(...muted)
  pdf.text('AI-Powered Interior Layout Report', margin, y + 14)

  pdf.setFontSize(7)
  const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  pdf.text(dateStr, pageW - margin, y + 8, { align: 'right' })
  y += 22

  // Divider
  pdf.setDrawColor(...primary)
  pdf.setLineWidth(0.5)
  pdf.line(margin, y, pageW - margin, y)
  y += 8

  // Room Info
  const roomType = solution.room?.type || 'Room'
  const lengthM = solution.room?.lengthM || 0
  const widthM = solution.room?.widthM || 0
  const styles = solution.selectedStyles?.join(', ') || 'Modern'

  pdf.setFontSize(10)
  pdf.setTextColor(...white)
  pdf.setFont('helvetica', 'bold')
  pdf.text(String(roomType), margin, y)

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.setTextColor(...muted)
  pdf.text(`${lengthM}m x ${widthM}m  |  ${styles}`, margin, y + 5)
  y += 14

  // 3D Canvas screenshot — wait a frame so the canvas is rendered with preserveDrawingBuffer
  try {
    // Short delay to ensure the canvas has rendered the current frame
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // Target the R3F canvas specifically — falls back to first canvas if not found
    const canvasEl = (document.querySelector('.bg-transparent canvas') ?? document.querySelector('canvas')) as HTMLCanvasElement | null
    if (canvasEl) {
      const imgData = canvasEl.toDataURL('image/png', 0.92)
      if (imgData && imgData.length > 200 && !imgData.startsWith('data:image/png;base64,AAAA')) {
        const aspect = canvasEl.width / canvasEl.height
        const maxH = 80
        const imgH = contentW / aspect
        const finalH = Math.min(imgH, maxH)
        const finalW = finalH * aspect
        const imgX = margin + (contentW - finalW) / 2

        pdf.setDrawColor(40, 40, 60)
        pdf.setLineWidth(0.3)
        pdf.roundedRect(imgX - 1, y - 1, finalW + 2, finalH + 2, 2, 2, 'S')
        pdf.addImage(imgData, 'PNG', imgX, y, finalW, finalH)
        y += finalH + 8
      }
    }
  } catch (e) {
    console.warn('Canvas capture failed:', e)
    y += 4
  }

  // Fitness Scores
  const m = solution.metrics || {}
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(...primary)
  pdf.text('FITNESS SCORES', margin, y)
  y += 6

  const scores = [
    { label: 'Space Utilization', value: m.spaceUtilizationPct || 0 },
    { label: 'Style Alignment', value: m.styleAlignmentPct || 0 },
    { label: 'Clearance Score', value: m.clearanceScorePct || 0 },
    { label: 'Comfort Index', value: m.comfortIndexPct || 0 },
    { label: 'Budget Compliance', value: m.budgetCompliancePct || 0 },
  ]

  for (const s of scores) {
    pdf.setFontSize(7)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(...muted)
    pdf.text(s.label, margin, y)

    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(...white)
    pdf.text(`${s.value.toFixed(1)}%`, margin + 55, y)

    const barX = margin + 70
    const barW = contentW - 70
    pdf.setFillColor(30, 30, 45)
    pdf.roundedRect(barX, y - 2.5, barW, 3, 1.5, 1.5, 'F')

    const fillW = (s.value / 100) * barW
    pdf.setFillColor(...primary)
    pdf.roundedRect(barX, y - 2.5, Math.max(fillW, 2), 3, 1.5, 1.5, 'F')
    y += 7
  }
  y += 4

  // Cost Breakdown
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(...gold)
  pdf.text('COST BREAKDOWN', margin, y)
  y += 6

  // Table header
  pdf.setFillColor(20, 20, 32)
  pdf.roundedRect(margin, y - 3, contentW, 6, 1, 1, 'F')
  pdf.setFontSize(6.5)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(...muted)
  pdf.text('Item', margin + 3, y)
  pdf.text('Qty', margin + 80, y)
  pdf.text('Unit Price', margin + 100, y)
  pdf.text('Total', pageW - margin - 3, y, { align: 'right' })
  y += 7

  // Items — use _swapLabel if the item was swapped, else use catalog label
  const items = solution.items || []
  const typeMap = new Map<string, { count: number; unitCost: number; label: string }>()
  for (const it of items) {
    const existing = typeMap.get(it.type)
    const swapLabel = (it as any)._swapLabel
    const spec = furnitureCatalog[it.type as keyof typeof furnitureCatalog]
    const displayLabel = swapLabel || spec?.label || it.type
    if (existing) {
      existing.count++
      existing.unitCost = it.costINR || existing.unitCost  // use latest swapped cost
    } else {
      typeMap.set(it.type, { count: 1, unitCost: it.costINR || 0, label: displayLabel })
    }
  }

  typeMap.forEach((data) => {
    const total = data.count * data.unitCost

    pdf.setFontSize(7)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(...white)
    pdf.text(data.label, margin + 3, y)

    pdf.setTextColor(...muted)
    pdf.text(String(data.count), margin + 83, y)
    pdf.text(formatINR(data.unitCost), margin + 100, y)

    pdf.setTextColor(...white)
    pdf.text(formatINR(total), pageW - margin - 3, y, { align: 'right' })
    y += 6
  })

  // Total
  y += 2
  pdf.setDrawColor(40, 40, 60)
  pdf.line(margin, y, pageW - margin, y)
  y += 5
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(...gold)
  pdf.text('TOTAL', margin + 3, y)
  pdf.text(formatINR(m.totalCostINR || 0), pageW - margin - 3, y, { align: 'right' })
  y += 4
  pdf.setFontSize(7)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(...muted)

  const budgetLabel = m.budgetCompliancePct >= 100
    ? `Budget: ${formatINR(m.budgetINR || 0)}  |  ✓ Under budget by ${formatINR((m.budgetINR || 0) - (m.totalCostINR || 0))}`
    : `Budget: ${formatINR(m.budgetINR || 0)}  |  ✗ Over budget by ${formatINR((m.totalCostINR || 0) - (m.budgetINR || 0))}`
  pdf.text(budgetLabel, margin + 3, y)
  y += 10

  // AI Explanation
  const explanation = solution.explanation || 'Layout optimized by RoomCraft AI engine.'
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(...primary)
  pdf.text('AI ANALYSIS', margin, y)
  y += 5
  pdf.setFontSize(7)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(...muted)
  const lines = pdf.splitTextToSize(explanation, contentW - 4)
  pdf.text(lines, margin + 2, y)

  // Footer
  pdf.setFontSize(6)
  pdf.setTextColor(60, 60, 80)
  pdf.text('Generated by RoomCraft AI | LayoutMind Soft Computing Engine', pageW / 2, 290, { align: 'center' })

  // Save
  const safeName = String(roomType).replace(/[^a-zA-Z0-9]/g, '_')
  pdf.save(`RoomCraft_${safeName}_${lengthM}x${widthM}m.pdf`)
}
