"""
Fix furniture going outside room:
1. Increase WALL_GAP to 0.35 
2. Fix sofa DIMS to realistic size (2.2, 0.95)
3. Add stricter clamp margins per-item type
4. Fix TvUnitComposite screen to face room (positive Z) in all variants
"""
import sys, re
sys.stdout.reconfigure(encoding='utf-8')

# ─── FIX 1: Backend - increase margins, fix sofa size ────────────────────────
path_be = r'softcomputing-service\main_fixed.py'
with open(path_be, 'r', encoding='utf-8') as f:
    be = f.read()

# Fix 1a: WALL_GAP from 0.20 to 0.35
be = be.replace('WALL_GAP = 0.20  # Generous gap', 'WALL_GAP = 0.35  # Generous gap')
be = be.replace("WALL_GAP = 0.20  # Generous gap from wall to prevent mesh clipping outside room",
                "WALL_GAP = 0.35  # Generous gap from wall to prevent mesh clipping outside room")
print("WALL_GAP increased" if 'WALL_GAP = 0.35' in be else "WARNING: WALL_GAP not replaced")

# Fix 1b: Sofa DIMS - was 3.5 x 1.6 (way too large), now 2.2 x 0.95
be = be.replace('"sofa":      (3.5, 1.6),   # L-sectional actual footprint',
                '"sofa":      (2.2, 0.95),   # 3-seater sofa actual footprint')
print("Sofa DIMS fixed" if '(2.2, 0.95)' in be else "WARNING: Sofa DIMS not replaced")

# Fix 1c: Add stronger per-item margin in clamp_item
old_clamp = """        def clamp_item(item):
            fw, fd = get_dims_rotated(item)
            hw, hd = fw / 2.0, fd / 2.0
            margin = WALL_GAP + 0.08  # Extra 8cm safety margin
            item[\"x\"] = max(-halfW + hw + margin, min(halfW - hw - margin, item[\"x\"]))
            item[\"z\"] = max(-halfL + hd + margin, min(halfL - hd - margin, item[\"z\"]))"""
new_clamp = """        def clamp_item(item):
            fw, fd = get_dims_rotated(item)
            hw, hd = fw / 2.0, fd / 2.0
            # Extra per-type safety margin so 3D meshes don't clip through walls
            item_type = item.get("type", "").lower() if isinstance(item, dict) else ""
            extra = {"sofa": 0.25, "bed": 0.15, "wardrobe": 0.15, "tvunit": 0.12}.get(item_type, 0.08)
            margin = WALL_GAP + extra
            item["x"] = max(-halfW + hw + margin, min(halfW - hw - margin, item["x"]))
            item["z"] = max(-halfL + hd + margin, min(halfL - hd - margin, item["z"]))"""
partially_updated_clamp = """        def clamp_item(item):
            fw, fd = get_dims_rotated(item)
            hw, hd = fw / 2.0, fd / 2.0
            # Extra per-type safety margin so 3D meshes don't clip through walls
            extra = {"sofa": 0.25, "bed": 0.15, "wardrobe": 0.15, "tvUnit": 0.12}.get(item["type"], 0.08)
            margin = WALL_GAP + extra
            item["x"] = max(-halfW + hw + margin, min(halfW - hw - margin, item["x"]))
            item["z"] = max(-halfL + hd + margin, min(halfL - hd - margin, item["z"]))"""

if old_clamp in be:
    be = be.replace(old_clamp, new_clamp)
    print("clamp_item updated")
elif partially_updated_clamp in be:
    be = be.replace(partially_updated_clamp, new_clamp)
    print("clamp_item updated from partially updated version")
elif new_clamp in be:
    print("clamp_item already updated")
else:
    old_clamp_crlf = old_clamp.replace('\n', '\r\n')
    new_clamp_crlf = new_clamp.replace('\n', '\r\n')
    partially_updated_crlf = partially_updated_clamp.replace('\n', '\r\n')
    if old_clamp_crlf in be:
        be = be.replace(old_clamp_crlf, new_clamp_crlf)
        print("clamp_item updated (CRLF)")
    elif partially_updated_crlf in be:
        be = be.replace(partially_updated_crlf, new_clamp_crlf)
        print("clamp_item updated from partially updated version (CRLF)")
    elif new_clamp_crlf in be:
        print("clamp_item already updated (CRLF)")
    else:
        print("ERROR: clamp_item not found in backend file")
        sys.exit(1)

# Fix 1d: Also tighten mutate clamp from 0.4 to 0.55 margin
be = be.replace('individual[base + 0] = clamp(individual[base + 0], -half_w + 0.4, half_w - 0.4)',
                'individual[base + 0] = clamp(individual[base + 0], -half_w + 0.55, half_w - 0.55)')
be = be.replace('individual[base + 1] = clamp(individual[base + 1], -half_l + 0.4, half_l - 0.4)',
                'individual[base + 1] = clamp(individual[base + 1], -half_l + 0.55, half_l - 0.55)')
print("Mutate clamp bounds tightened" if '-half_w + 0.55' in be else "WARNING: mutate clamp not found")

with open(path_be, 'w', encoding='utf-8') as f:
    f.write(be)
print("Backend updated")

# ─── FIX 2: Frontend - TV unit screen faces INTO room for all variants ─────────
path_fi = r'frontend\src\three\FurnitureInstance.tsx'
with open(path_fi, 'r', encoding='utf-8') as f:
    content = f.read()

# Find all TvUnitComposite and check all screen positions
# The screen mesh has `boxGeometry args={[1.5, ...]}` or similar - typically labeled by screen comment
# We want to change z=-0.12 positions for the TV screen to z=+0.12

replacements = [
    # Modern/default TV screen
    ('<mesh position={[0, 0.9, -0.12]} castShadow>\n          <boxGeometry args={[1.5, 0.85, 0.04]} />',
     '<mesh position={[0, 0.9, 0.12]} castShadow>\n          <boxGeometry args={[1.5, 0.85, 0.04]} />'),
    # Modern glow
    ('<mesh position={[0, 0.9, -0.09]}>\n          <boxGeometry args={[1.45, 0.8, 0.01]} />',
     '<mesh position={[0, 0.9, 0.15]}>\n          <boxGeometry args={[1.45, 0.8, 0.01]} />'),
    # Luxury screen
    ('<mesh position={[0, 1.0, -0.14]} castShadow>\n          <boxGeometry args={[2.1, 1.15, 0.04]} />',
     '<mesh position={[0, 1.0, 0.14]} castShadow>\n          <boxGeometry args={[2.1, 1.15, 0.04]} />'),
    # Luxury glow
    ('<mesh position={[0, 1.0, -0.11]}>\n          <boxGeometry args={[2.04, 1.1, 0.01]} />',
     '<mesh position={[0, 1.0, 0.17]}>\n          <boxGeometry args={[2.04, 1.1, 0.01]} />'),
    # Compact screen
    ('<mesh position={[0, 0.7, -0.1]} castShadow>\n          <boxGeometry args={[1.1, 0.65, 0.04]} />',
     '<mesh position={[0, 0.7, 0.1]} castShadow>\n          <boxGeometry args={[1.1, 0.65, 0.04]} />'),
]

count = 0
for old, new in replacements:
    if old in content:
        content = content.replace(old, new)
        count += 1
        print(f"Fixed TV screen position ({count})")
    else:
        # Try CRLF
        old_crlf = old.replace('\n', '\r\n')
        new_crlf = new.replace('\n', '\r\n')
        if old_crlf in content:
            content = content.replace(old_crlf, new_crlf)
            count += 1
            print(f"Fixed TV screen position (CRLF) ({count})")

# No generic fallback needed as exact-pattern replacements are already handled above.

with open(path_fi, 'w', encoding='utf-8') as f:
    f.write(content)
print(f"\nFurnitureInstance.tsx updated ({len(content)} chars)")
print("\nAll bounds fixes applied!")
