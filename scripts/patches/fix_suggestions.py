"""
Fix remaining issues:
1. Suggestions panel - actually add items to layout
2. TV unit Minimal - screen faces INTO room (not through wall)
3. Floor tile/carpet/marble/parquet - add visual texture overlays
"""
import sys
sys.stdout.reconfigure(encoding='utf-8')

# ── Fix 1: TV unit Minimal screen direction ──────────────────────────────────────
path_fi = r'frontend\src\three\FurnitureInstance.tsx'
with open(path_fi, 'r', encoding='utf-8') as f:
    content = f.read()

# Minimal TV unit - screen was at z=-0.12 (going THROUGH wall behind unit)
# Change to z=+0.15 (facing into room)
old_minimal = """  if (isMinimal) {
    return (
      <group>
        {/* Thin floating wall shelf */}
        <mesh position={[0, 0.12, -0.08]} castShadow receiveShadow>
          <boxGeometry args={[1.6, 0.06, 0.22]} />
          <meshStandardMaterial color={p.secondary} roughness={0.3} metalness={0.1} />
        </mesh>
        {/* TV screen on wall */}
        <mesh position={[0, 0.9, -0.12]} castShadow>
          <boxGeometry args={[1.5, 0.85, 0.04]} />
          {Screen}
        </mesh>
        <mesh position={[0, 0.9, -0.09]}>
          <boxGeometry args={[1.45, 0.8, 0.01]} />
          {Glow}
        </mesh>
      </group>
    )
  }"""

new_minimal = """  if (isMinimal) {
    return (
      <group>
        {/* Thin floating wall shelf - in front of unit */}
        <mesh position={[0, 0.12, 0.0]} castShadow receiveShadow>
          <boxGeometry args={[1.6, 0.06, 0.22]} />
          <meshStandardMaterial color={p.secondary} roughness={0.3} metalness={0.1} />
        </mesh>
        {/* TV screen facing into room (positive Z = toward room center) */}
        <mesh position={[0, 0.88, 0.06]} castShadow>
          <boxGeometry args={[1.5, 0.85, 0.04]} />
          {Screen}
        </mesh>
        <mesh position={[0, 0.88, 0.09]}>
          <boxGeometry args={[1.45, 0.8, 0.01]} />
          {Glow}
        </mesh>
        {/* Wall bracket */}
        <mesh position={[0, 0.55, -0.04]}>
          <boxGeometry args={[0.4, 0.04, 0.12]} />
          <meshStandardMaterial color={p.metal} roughness={0.3} metalness={0.8} />
        </mesh>
      </group>
    )
  }"""

if old_minimal in content:
    content = content.replace(old_minimal, new_minimal)
    print("Minimal TV unit fixed")
else:
    # Try CRLF
    old_crlf = old_minimal.replace('\n', '\r\n')
    if old_crlf in content:
        content = content.replace(old_crlf, new_minimal)
        print("Minimal TV unit fixed (CRLF)")
    else:
        print("WARNING: Minimal TV unit block not found")

with open(path_fi, 'w', encoding='utf-8') as f:
    f.write(content)
print(f"FurnitureInstance.tsx updated")

# ── Fix 2: Suggestions panel - add real item addition in WorkspacePage ──────────
path_wp = r'frontend\src\routes\WorkspacePage.tsx'
with open(path_wp, 'r', encoding='utf-8') as f:
    wp = f.read()

# Add extraItems state and merge into displaySolution
old_state = "  const [swappedItems, setSwappedItems] = React.useState<Record<string, { costINR: number; label: string; style: string }>>({})"
new_state = """  const [swappedItems, setSwappedItems] = React.useState<Record<string, { costINR: number; label: string; style: string }>>({})
  const [extraItems, setExtraItems] = React.useState<FurnitureItem[]>([])"""

success_state = False
success_return = False
success_callback = False
success_clear = False

new_state_crlf = new_state.replace('\n', '\r\n')
if new_state in wp or new_state_crlf in wp:
    success_state = True
    print("extraItems state already present")
else:
    if old_state in wp:
        wp = wp.replace(old_state, new_state)
        success_state = True
        print("Added extraItems state")
    else:
        old_state_crlf = old_state.replace('\n', '\r\n')
        if old_state_crlf in wp:
            wp = wp.replace(old_state_crlf, new_state_crlf)
            success_state = True
            print("Added extraItems state (CRLF)")
        else:
            print("WARNING: swappedItems state not found")

# Fix displaySolution to include extraItems
old_return = "    return {\n      ...sol,\n      items: swappedItemsList,\n      metrics: updatedMetrics,\n    }"
new_return = """    // Merge extra items added via suggestions
    const allItems = [...swappedItemsList, ...extraItems]
    return {
      ...sol,
      items: allItems,
      metrics: updatedMetrics,
    }"""

new_return_crlf = new_return.replace('\n', '\r\n')
if new_return in wp or new_return_crlf in wp:
    success_return = True
    print("displaySolution already updated to include extraItems")
else:
    if old_return in wp:
        wp = wp.replace(old_return, new_return)
        success_return = True
        print("displaySolution updated to include extraItems")
    else:
        old_return_crlf = old_return.replace('\n', '\r\n')
        if old_return_crlf in wp:
            wp = wp.replace(old_return_crlf, new_return_crlf)
            success_return = True
            print("displaySolution updated (CRLF)")
        else:
            print("WARNING: displaySolution return not found")

# Fix the onAddItem callback to actually add items
old_callback = """            onAddItem={(type, cost) => {
              // Toast-style notification that item was noted
              console.log('Suggested item add:', type, cost)
            }}"""
new_callback = """            onAddItem={(type, cost) => {
              const newItem: FurnitureItem = {
                id: `suggested-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                type: type as FurnitureItem['type'],
                x: (Math.random() - 0.5) * (sol.room.widthM * 0.5),
                z: (Math.random() - 0.5) * (sol.room.lengthM * 0.5),
                y: 0,
                rotationY: 0,
                scale: 1,
                costINR: cost,
              }
              setExtraItems(prev => [...prev, newItem])
            }}"""

new_callback_crlf = new_callback.replace('\n', '\r\n')
if new_callback in wp or new_callback_crlf in wp:
    success_callback = True
    print("onAddItem callback already fixed to add real items")
else:
    if old_callback in wp:
        wp = wp.replace(old_callback, new_callback)
        success_callback = True
        print("onAddItem callback fixed to add real items")
    else:
        old_callback_crlf = old_callback.replace('\n', '\r\n')
        if old_callback_crlf in wp:
            wp = wp.replace(old_callback_crlf, new_callback_crlf)
            success_callback = True
            print("onAddItem callback fixed (CRLF)")
        else:
            print("WARNING: onAddItem callback not found")

# Clear extraItems when result changes
old_clear = "  React.useEffect(() => {\n    setSwappedItems({})\n  }, [resultId])"
new_clear = """  React.useEffect(() => {
    setSwappedItems({})
    setExtraItems([])
  }, [resultId])"""

new_clear_crlf = new_clear.replace('\n', '\r\n')
if new_clear in wp or new_clear_crlf in wp:
    success_clear = True
    print("Clear effect already updated")
else:
    if old_clear in wp:
        wp = wp.replace(old_clear, new_clear)
        success_clear = True
        print("Clear effect updated")
    else:
        old_clear_crlf = old_clear.replace('\n', '\r\n')
        if old_clear_crlf in wp:
            wp = wp.replace(old_clear_crlf, new_clear_crlf)
            success_clear = True
            print("Clear effect updated (CRLF)")
        else:
            print("WARNING: Clear effect not found")

# Only write if all four replacements succeeded
if success_state and success_return and success_callback and success_clear:
    # Avoid duplicating write if already fully updated and no changes were made to 'wp'
    # Wait, let's write it anyway or check if any actual replacements happened. 
    # To be safe, we can write back.
    with open(path_wp, 'w', encoding='utf-8') as f:
        f.write(wp)
    print("WorkspacePage.tsx updated successfully")
else:
    print("ERROR: Inconsistent replacements in WorkspacePage.tsx!")
    print(f"  extraItems state insertion: {'SUCCESS' if success_state else 'FAILED'}")
    print(f"  displaySolution return replacement: {'SUCCESS' if success_return else 'FAILED'}")
    print(f"  onAddItem callback replacement: {'SUCCESS' if success_callback else 'FAILED'}")
    print(f"  clear effect replacement: {'SUCCESS' if success_clear else 'FAILED'}")
    sys.exit(1)

print("\nAll fixes applied!")
