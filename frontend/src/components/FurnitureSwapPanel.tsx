import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatINR } from '../lib/inr'
import type { FurnitureItem } from '../types/layout'
import { furnitureCatalog } from '../three/catalog'

type Variant = { label: string; costINR: number; style: string; delta: string; isMaterial?: boolean }

// Generate purchase search URL for furniture variants
function getShopUrl(label: string, type: string): string {
  const query = encodeURIComponent(`${label} ${type} furniture India`)
  return `https://www.amazon.in/s?k=${query}`
}

const VARIANTS: Record<string, Variant[]> = {
  sofa: [
    { label: 'L-Shape Sectional', costINR: 48000, style: 'Modern', delta: '+Comfort' },
    { label: 'Compact Loveseat', costINR: 22000, style: 'Minimal', delta: '-Space +Budget' },
    { label: 'Chesterfield Sofa', costINR: 72000, style: 'Luxury', delta: '+Style -Budget' },
    { label: 'Futon Sofa Bed', costINR: 18000, style: 'Compact', delta: '+Budget +Utility' },
    { label: 'Modular Cloud Sofa', costINR: 65000, style: 'Bohemian', delta: '+Comfort -Budget' },
    { label: 'Velvet Fabric Finish', costINR: 52000, style: 'Luxury', delta: '+Premium Feel', isMaterial: true },
    { label: 'Linen Cotton Finish', costINR: 42000, style: 'Coastal', delta: '+Breathable', isMaterial: true },
    { label: 'Genuine Leather', costINR: 85000, style: 'Luxury', delta: '+Durability -Budget', isMaterial: true },
    { label: 'Rexine / Faux Leather', costINR: 35000, style: 'Modern', delta: '+Budget +Easy Clean', isMaterial: true },
  ],
  bed: [
    { label: 'King Platform Bed', costINR: 52000, style: 'Modern', delta: 'Default' },
    { label: 'Queen Storage Bed', costINR: 38000, style: 'Compact', delta: '+Storage +Budget' },
    { label: 'Upholstered Frame', costINR: 68000, style: 'Luxury', delta: '+Style -Budget' },
    { label: 'Folding Murphy Bed', costINR: 45000, style: 'Minimal', delta: '+Space +Budget' },
    { label: 'Low Floor Bed', costINR: 25000, style: 'Bohemian', delta: '+Budget -Height' },
    { label: 'Sheesham Solid Wood', costINR: 62000, style: 'Cozy', delta: '+Durability', isMaterial: true },
    { label: 'Engineered Wood (MDF)', costINR: 28000, style: 'Modern', delta: '+Budget', isMaterial: true },
    { label: 'Teak Wood Premium', costINR: 95000, style: 'Luxury', delta: '+Premium -Budget', isMaterial: true },
    { label: 'Metal Frame + Wood', costINR: 32000, style: 'Industrial', delta: '+Budget +Sturdy', isMaterial: true },
  ],
  table: [
    { label: 'Coffee Table', costINR: 18000, style: 'Modern', delta: 'Default' },
    { label: 'Nesting Tables (Set)', costINR: 12000, style: 'Minimal', delta: '+Flex +Budget' },
    { label: 'Marble Top Table', costINR: 35000, style: 'Luxury', delta: '+Style -Budget' },
    { label: 'Folding Study Desk', costINR: 8000, style: 'Compact', delta: '+Budget +Utility' },
    { label: 'Live Edge Wood Table', costINR: 28000, style: 'Bohemian', delta: '+Style -Budget' },
    { label: 'Glass Top + Metal Base', costINR: 15000, style: 'Modern', delta: '+Airy +Budget', isMaterial: true },
    { label: 'White Marble Top', costINR: 42000, style: 'Luxury', delta: '+Premium -Budget', isMaterial: true },
    { label: 'Solid Oak Wood', costINR: 22000, style: 'Cozy', delta: '+Warmth', isMaterial: true },
    { label: 'Bamboo Eco Table', costINR: 10000, style: 'Coastal', delta: '+Eco +Budget', isMaterial: true },
  ],
  chair: [
    { label: 'Accent Chair', costINR: 12000, style: 'Modern', delta: 'Default' },
    { label: 'Bean Bag', costINR: 3500, style: 'Compact', delta: '+Budget +Casual' },
    { label: 'Wingback Chair', costINR: 22000, style: 'Luxury', delta: '+Style -Budget' },
    { label: 'Ergonomic Office Chair', costINR: 15000, style: 'Modern', delta: '+Comfort' },
    { label: 'Rattan Peacock Chair', costINR: 18000, style: 'Bohemian', delta: '+Style' },
    { label: 'Mesh Fabric (Breathable)', costINR: 14000, style: 'Modern', delta: '+Comfort', isMaterial: true },
    { label: 'Wooden + Cushion', costINR: 8000, style: 'Cozy', delta: '+Budget', isMaterial: true },
    { label: 'Plastic Moulded', costINR: 2500, style: 'Compact', delta: '+Budget +Light', isMaterial: true },
  ],
  wardrobe: [
    { label: 'Sliding Door Wardrobe', costINR: 35000, style: 'Modern', delta: 'Default' },
    { label: 'Open Clothing Rack', costINR: 8000, style: 'Industrial', delta: '+Budget +Space' },
    { label: 'Walk-in Closet System', costINR: 65000, style: 'Luxury', delta: '+Storage -Budget' },
    { label: 'Foldable Fabric Wardrobe', costINR: 4500, style: 'Compact', delta: '+Budget' },
    { label: 'Chest of Drawers', costINR: 18000, style: 'Minimal', delta: '+Budget' },
    { label: 'Plywood + Laminate', costINR: 28000, style: 'Modern', delta: '+Budget', isMaterial: true },
    { label: 'Solid Teak Wood', costINR: 75000, style: 'Luxury', delta: '+Premium -Budget', isMaterial: true },
    { label: 'Metal + Glass Doors', costINR: 40000, style: 'Industrial', delta: '+Style', isMaterial: true },
  ],
  tvUnit: [
    { label: 'Modern TV Console', costINR: 22000, style: 'Modern', delta: 'Default' },
    { label: 'Wall-Mount Floating Shelf', costINR: 8000, style: 'Minimal', delta: '+Budget +Space — Slim wall mount only' },
    { label: 'Luxury Entertainment Centre', costINR: 45000, style: 'Luxury', delta: '+Storage — Full unit with LED lighting' },
    { label: 'Compact Lowboard', costINR: 12000, style: 'Compact', delta: '+Budget — Small cubby unit with slim legs' },
    { label: 'Vintage Wood Credenza', costINR: 28000, style: 'Cozy', delta: '+Warmth — Panelled doors & tapered legs' },
    { label: 'Rattan Coastal Console', costINR: 18000, style: 'Coastal', delta: '+Natural — Woven front panel' },
    { label: 'Industrial Pipe Unit', costINR: 20000, style: 'Industrial', delta: '+Raw — Metal pipe legs' },
    { label: 'Walnut Wood Finish', costINR: 28000, style: 'Modern', delta: '+Warmth', isMaterial: true },
    { label: 'High Gloss White', costINR: 20000, style: 'Minimal', delta: '+Clean Look', isMaterial: true },
    { label: 'PVC Fluted Panel Back', costINR: 32000, style: 'Luxury', delta: '+Premium', isMaterial: true },
  ],
  plant: [
    { label: 'Snake Plant', costINR: 4500, style: 'Modern', delta: 'Default' },
    { label: 'Fiddle Leaf Fig', costINR: 8000, style: 'Luxury', delta: '+Style -Budget' },
    { label: 'Artificial Monstera', costINR: 2000, style: 'Compact', delta: '+Budget' },
    { label: 'Money Plant (Hanging)', costINR: 1500, style: 'Bohemian', delta: '+Budget +Vastu', isMaterial: true },
    { label: 'Ceramic Pot Upgrade', costINR: 6000, style: 'Luxury', delta: '+Style', isMaterial: true },
  ],
  floorLamp: [
    { label: 'Arc Floor Lamp', costINR: 6000, style: 'Modern', delta: 'Default' },
    { label: 'Tripod Floor Lamp', costINR: 9000, style: 'Bohemian', delta: '+Style' },
    { label: 'LED Smart Lamp', costINR: 4500, style: 'Minimal', delta: '+Budget +Tech' },
    { label: 'Brass Finish Lamp', costINR: 12000, style: 'Luxury', delta: '+Premium', isMaterial: true },
    { label: 'Rattan Shade Lamp', costINR: 7500, style: 'Coastal', delta: '+Warmth', isMaterial: true },
  ],
  sideTable: [
    { label: 'Side Table', costINR: 4000, style: 'Modern', delta: 'Default' },
    { label: 'C-Shape Laptop Table', costINR: 3500, style: 'Compact', delta: '+Utility +Budget' },
    { label: 'Marble Accent Table', costINR: 12000, style: 'Luxury', delta: '+Style -Budget' },
    { label: 'Metal + Wood Combo', costINR: 5500, style: 'Industrial', delta: '+Style', isMaterial: true },
  ],
  bookshelf: [
    { label: 'Bookshelf', costINR: 15000, style: 'Modern', delta: 'Default' },
    { label: 'Floating Wall Shelves', costINR: 5000, style: 'Minimal', delta: '+Budget +Space' },
    { label: 'Cube Storage Unit', costINR: 10000, style: 'Modern', delta: '+Flex +Budget' },
    { label: 'Solid Wood Bookcase', costINR: 25000, style: 'Cozy', delta: '+Durability -Budget', isMaterial: true },
    { label: 'Metal Wire Shelf', costINR: 6000, style: 'Industrial', delta: '+Budget +Style', isMaterial: true },
  ],
  rug: [
    { label: 'Woven Cotton Rug', costINR: 8000, style: 'Modern', delta: 'Default' },
    { label: 'Persian Style Rug', costINR: 18000, style: 'Luxury', delta: '+Style -Budget' },
    { label: 'Jute Natural Rug', costINR: 5000, style: 'Bohemian', delta: '+Budget +Eco' },
    { label: 'Shag Fluffy Rug', costINR: 12000, style: 'Cozy', delta: '+Comfort' },
    { label: 'Anti-slip Kitchen Mat', costINR: 2000, style: 'Compact', delta: '+Budget +Utility' },
  ],
}

export function FurnitureSwapPanel({
  items,
  onSwap,
  onClose,
}: {
  items: FurnitureItem[]
  onSwap: (itemId: string, newCostINR: number, variantLabel: string, variantStyle: string) => void
  onClose: () => void
}) {
  const [selectedItemId, setSelectedItemId] = React.useState<string | null>(null)
  const [swappedItems, setSwappedItems] = React.useState<Record<string,string>>({})
  const [pendingVariant, setPendingVariant] = React.useState<{ itemId: string; variant: Variant } | null>(null)

  const selectedItem = items.find(it => it.id === selectedItemId)
  const variants = selectedItem ? (VARIANTS[selectedItem.type] ?? []) : []

  const handleSelectVariant = (item: FurnitureItem, variant: Variant) => {
    setPendingVariant({ itemId: item.id, variant })
  }

  const handleConfirmSwap = () => {
    if (!pendingVariant) return
    const { itemId, variant } = pendingVariant
    onSwap(itemId, variant.costINR, variant.label, variant.style)
    setSwappedItems(prev => ({ ...prev, [itemId]: variant.label }))
    setPendingVariant(null)
  }

  const handleCancelPending = () => {
    setPendingVariant(null)
  }

  // Dedupe items by type for the list
  const uniqueTypes = React.useMemo(() => {
    const seen = new Set<string>()
    return items.filter(it => { if (seen.has(it.type)) return false; seen.add(it.type); return true })
  }, [items])

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{scale:0.9,opacity:0,y:30}} animate={{scale:1,opacity:1,y:0}} exit={{scale:0.9,opacity:0,y:30}} transition={{type:'spring',damping:25,stiffness:300}} onClick={e=>e.stopPropagation()} className="relative w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden rounded-2xl" style={{background:'rgba(10,10,18,0.92)',backdropFilter:'blur(40px)',border:'1px solid rgba(255,255,255,0.08)',boxShadow:'0 24px 80px rgba(0,0,0,0.6)'}}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-wide">Furniture Swap</h2>
              <p className="text-[10px] text-white/30 font-medium">Select variant → Confirm swap</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Pending swap confirmation bar */}
        <AnimatePresence>
          {pendingVariant && (
            <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden border-b border-white/[0.06]">
              <div className="p-4 bg-violet-500/[0.08] flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-white/60">Swap to:</div>
                  <div className="text-sm font-semibold text-white truncate">{pendingVariant.variant.label}</div>
                  <div className="text-[10px] text-white/40">{formatINR(pendingVariant.variant.costINR)} · {pendingVariant.variant.style}</div>
                </div>
                <button onClick={handleCancelPending} className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-white/[0.06] text-white/50 hover:text-white/80 hover:bg-white/10 transition-all">
                  Cancel
                </button>
                <button onClick={handleConfirmSwap} className="px-4 py-1.5 rounded-lg text-[11px] font-bold bg-violet-500 text-white hover:bg-violet-400 active:scale-95 transition-all shadow-lg shadow-violet-500/25">
                  ✓ Swap Now
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Item list */}
        <div className="overflow-y-auto max-h-[65vh] p-3">
          {uniqueTypes.map(item => {
            const spec = furnitureCatalog[item.type as keyof typeof furnitureCatalog]
            const isSelected = selectedItemId === item.id
            const wasSwapped = swappedItems[item.id]
            const isPending = pendingVariant?.itemId === item.id
            return (
              <div key={item.id}>
                <button onClick={() => setSelectedItemId(isSelected ? null : item.id)} className={`w-full flex items-center gap-3 p-3 rounded-xl mb-1 text-left transition-all ${isSelected ? 'bg-violet-500/10 border border-violet-500/20' : 'bg-white/[0.02] border border-transparent hover:bg-white/[0.04] hover:border-white/[0.08]'}`}>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg ${isSelected ? 'bg-violet-500/20' : 'bg-white/[0.04]'}`}>
                    {item.type === 'sofa' ? '🛋️' : item.type === 'bed' ? '🛏️' : item.type === 'table' ? '🪑' : item.type === 'chair' ? '💺' : item.type === 'wardrobe' ? '🚪' : item.type === 'tvUnit' ? '📺' : item.type === 'plant' ? '🌿' : item.type === 'floorLamp' ? '💡' : item.type === 'sideTable' ? '🪟' : '📚'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-white/80">{wasSwapped || spec?.label || item.type}</span>
                      {wasSwapped && <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-semibold">SWAPPED ✓</span>}
                    </div>
                    <span className="text-[10px] text-white/30">{formatINR(item.costINR)}</span>
                  </div>
                  <svg className={`w-4 h-4 text-white/30 transition-transform ${isSelected ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </button>

                {/* Variants dropdown */}
                <AnimatePresence>
                  {isSelected && selectedItem && (
                    <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden mb-2">
                      <div className="pl-4 pr-2 py-2 space-y-1.5">
                        {/* Alternative Furniture */}
                        {variants.filter(v => !v.isMaterial).length > 0 && (
                          <div className="text-[8px] uppercase tracking-[0.2em] text-white/20 font-bold px-2.5 pt-1 pb-0.5 flex items-center gap-1.5">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>
                            Alternatives
                          </div>
                        )}
                        {variants.filter(v => !v.isMaterial).map((v, vi) => {
                          const costDiff = v.costINR - selectedItem.costINR
                          const isThisPending = isPending && pendingVariant?.variant.label === v.label
                          return (
                            <button key={`alt-${vi}`} onClick={() => handleSelectVariant(selectedItem, v)} className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all text-left group ${isThisPending ? 'bg-violet-500/15 border-violet-500/30 ring-1 ring-violet-500/20' : 'bg-white/[0.02] border-white/[0.04] hover:bg-violet-500/[0.06] hover:border-violet-500/15'}`}>
                              <div className="flex-1 min-w-0">
                                <div className="text-[11px] font-medium text-white/70 group-hover:text-white/90">{v.label}</div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] text-white/35">{formatINR(v.costINR)}</span>
                                  {costDiff !== 0 && (
                                    <span className={`text-[9px] font-semibold ${costDiff > 0 ? 'text-red-400/70' : 'text-emerald-400/70'}`}>
                                      {costDiff > 0 ? '+' : ''}{formatINR(costDiff)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/[0.04] text-white/30 font-medium">{v.style}</span>
                                <span className="text-[8px] text-primary/50 font-medium">{v.delta}</span>
                                <a href={getShopUrl(v.label, selectedItem.type)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-[9px] px-2 py-0.5 rounded-md bg-teal-500/15 text-teal-400 font-bold hover:bg-teal-500/25 transition-colors" title="Buy online">Buy →</a>
                              </div>
                              {isThisPending && <span className="text-violet-400 text-xs">●</span>}
                            </button>
                          )
                        })}

                        {/* Materials & Finishes */}
                        {variants.filter(v => v.isMaterial).length > 0 && (
                          <div className="text-[8px] uppercase tracking-[0.2em] text-amber-400/30 font-bold px-2.5 pt-3 pb-0.5 flex items-center gap-1.5 border-t border-white/[0.04] mt-2">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" /></svg>
                            Materials &amp; Finishes
                          </div>
                        )}
                        {variants.filter(v => v.isMaterial).map((v, vi) => {
                          const costDiff = v.costINR - selectedItem.costINR
                          const isThisPending = isPending && pendingVariant?.variant.label === v.label
                          return (
                            <button key={`mat-${vi}`} onClick={() => handleSelectVariant(selectedItem, v)} className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all text-left group ${isThisPending ? 'bg-amber-500/15 border-amber-500/30 ring-1 ring-amber-500/20' : 'bg-amber-500/[0.02] border-amber-500/[0.04] hover:bg-amber-500/[0.06] hover:border-amber-500/15'}`}>
                              <div className="flex-1 min-w-0">
                                <div className="text-[11px] font-medium text-white/70 group-hover:text-white/90">{v.label}</div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] text-white/35">{formatINR(v.costINR)}</span>
                                  {costDiff !== 0 && (
                                    <span className={`text-[9px] font-semibold ${costDiff > 0 ? 'text-red-400/70' : 'text-emerald-400/70'}`}>
                                      {costDiff > 0 ? '+' : ''}{formatINR(costDiff)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/[0.06] text-amber-400/40 font-medium">{v.style}</span>
                                <span className="text-[8px] text-amber-400/40 font-medium">{v.delta}</span>
                                <a href={getShopUrl(v.label, selectedItem.type)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-[9px] px-2 py-0.5 rounded-md bg-teal-500/15 text-teal-400 font-bold hover:bg-teal-500/25 transition-colors" title="Buy online">Buy →</a>
                              </div>
                              {isThisPending && <span className="text-amber-400 text-xs">●</span>}
                            </button>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}
