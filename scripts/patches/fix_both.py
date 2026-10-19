"""
Fix both issues:
1. extraItems missing from useMemo dependency array -> suggestions don't show in 3D
2. Wall texture overlay z-position too close (1cm) -> z-fighting -> only color shows
"""
import sys, re
sys.stdout.reconfigure(encoding='utf-8')

# ─── FIX 1: Add extraItems to useMemo deps ────────────────────────────────────
path_wp = r'frontend\src\routes\WorkspacePage.tsx'
with open(path_wp, 'r', encoding='utf-8') as f:
    wp = f.read()

old_deps = "  }, [sol, activeStep, isViewingFinal, swappedItems])"
new_deps  = "  }, [sol, activeStep, isViewingFinal, swappedItems, extraItems])"

wp_before = wp
replaced = False

if old_deps in wp:
    wp = wp.replace(old_deps, new_deps)
    replaced = True
    print("extraItems added to useMemo deps")
elif new_deps in wp:
    replaced = True
    print("extraItems already present in useMemo deps")
else:
    old_crlf = old_deps.replace('\n', '\r\n')
    new_crlf  = new_deps.replace('\n', '\r\n')
    if old_crlf in wp:
        wp = wp.replace(old_crlf, new_crlf)
        replaced = True
        print("extraItems added to useMemo deps (CRLF)")
    elif new_crlf in wp:
        replaced = True
        print("extraItems already present in useMemo deps (CRLF)")
    else:
        print("WARNING: useMemo deps not found - current dep line:")
        for line in wp.splitlines():
            if 'swappedItems' in line and ']' in line:
                print(' ', repr(line))

if not replaced:
    print("ERROR: No replacement occurred in WorkspacePage.tsx!")
    sys.exit(1)

with open(path_wp, 'w', encoding='utf-8') as f:
    f.write(wp)
print("WorkspacePage.tsx saved\n")

# ─── FIX 2: Increase wall texture z-offset to eliminate z-fighting ─────────────
path_room = r'frontend\src\three\Room.tsx'
with open(path_room, 'r', encoding='utf-8') as f:
    content = f.read()

# Each texture group is at -halfL + 0.01 or -halfL + 0.012
# Move them to -halfL + 0.05 (5cm in front = clearly in front, no z-fight)
fixes = [
    # Stone
    ('<group position={[0, wallH / 2, -halfL + 0.012]}>',
     '<group position={[0, wallH / 2, -halfL + 0.05]}>'),
    # Brick, Ceramic, Concrete, Fabric, Fluted (all at 0.01)
    # Need to do multiple - one at a time won't work since all same string
]

# Count occurrences
count_012 = content.count('-halfL + 0.012]}>')
count_01  = content.count('-halfL + 0.01]}>')
print(f"Found {count_012} occurrences of '-halfL + 0.012' and {count_01} of '-halfL + 0.01'")

# Replace all wall-texture group positions within WallDecorations
# Find WallDecorations function boundaries
wd_start = content.find('\nfunction WallDecorations(')
wd_end   = content.find('\n// ====', wd_start + 10)
print(f"WallDecorations: lines {content[:wd_start].count(chr(10))+1} to {content[:wd_end].count(chr(10))+1}")

wd_section = content[wd_start:wd_end]

# Replace positions in WallDecorations section only
wd_fixed = wd_section
wd_fixed = wd_fixed.replace('-halfL + 0.012]}>', '-halfL + 0.05]}>')
wd_fixed = wd_fixed.replace('-halfL + 0.01]}>', '-halfL + 0.05]}>')

changes = sum([
    wd_section.count('-halfL + 0.012]}>'),
    wd_section.count('-halfL + 0.01]}>'),
])
print(f"Replacing {changes} group positions in WallDecorations")

content = content[:wd_start] + wd_fixed + content[wd_end:]

# Also fix the inner brick/stone meshes to sit proportionally further out
# The individual brick meshes are at z=0.007 or z=0.009 within the group
# Keep them at same relative positions (they'll still be on top of the background plane)

with open(path_room, 'w', encoding='utf-8') as f:
    f.write(content)
print(f"Room.tsx saved ({len(content)} chars)")
print("\nBoth fixes applied!")
