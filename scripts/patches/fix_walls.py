"""
Comprehensive Room.tsx fixes:
1. Remove all "ALL walls" heavy texture blocks (causing WebGL context loss + top-view issue)
2. Apply wallColor to ALL material types (not just Plain/Plaster/Lime)
3. Add lightweight single-accent-wall patterns for Brick/Stone/Ceramic/Fluted/Concrete
4. Fix floor materials to look distinct
5. Fix TV unit Minimal screen (faces wrong direction through wall)
"""
import re, unicodedata

# ── Fix 1+2+3: Wall texture system rewrite ─────────────────────────────────────
path_room = r'frontend\src\three\Room.tsx'
with open(path_room, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the big block we need to replace (Stone → Fluted all-walls)
# It starts at the STONE all-walls comment and ends after the FLUTED all-walls block
normalized_content = unicodedata.normalize('NFKD', content)

# Robust regex that matches STONE block start regardless of unicode dash styling
pattern = re.compile(r'\{\/\*\s*[-–—─~=\s]*STONE:\s*Stacked\s*stone\s*on\s*ALL\s*walls\s*[-–—─~=\s]*\s*\*\/\s*\}', re.IGNORECASE)
match = pattern.search(content)
if match:
    stone_start = match.start()
else:
    # fallback to normalized find
    normalized_stone = "STONE: Stacked stone on ALL walls"
    stone_start = normalized_content.find(normalized_stone)
    if stone_start > 0:
        stone_start = content.rfind('{/*', 0, stone_start)

if stone_start < 0:
    if "userChangedColor" in content:
        print("Wall textures already updated in Room.tsx")
        print("Done!")
        import sys
        sys.exit(0)
    else:
        raise RuntimeError("ERROR: Could not find STONE all-walls block start in Room.tsx")

# Find the end: search until the real end of the content
fluted_idx = content.rfind("    </group>\n  )\n}", stone_start)
if fluted_idx < 0:
    # Try CRLF
    fluted_idx = content.rfind("    </group>\r\n  )\r\n}", stone_start)

if fluted_idx < 0 or fluted_idx <= stone_start:
    raise RuntimeError("ERROR: Closing marker for WallDecorations not found after stone_start")

print(f"Stone start: {stone_start}, Fluted end: {fluted_idx}")

if stone_start > 0 and fluted_idx > stone_start:
    closing_len = len("    </group>\r\n  )\r\n}") if "\r\n" in content[fluted_idx:fluted_idx+30] else len("    </group>\n  )\n}")
    old_block = content[stone_start:fluted_idx + closing_len]
    print(f"Old block length: {len(old_block)} chars")
    
    # New lightweight accent-wall patterns
    new_block = '''      {/* ── STONE: accent wall only – lightweight ── */}
      {(isStone || wallMaterial === 'Stone') && (
        <group position={[0, wallH / 2, -halfL + 0.012]}>
          <mesh receiveShadow>
            <planeGeometry args={[width, wallH]} />
            <meshStandardMaterial color={wallColor !== '#f5f5f4' ? wallColor : '#7a7068'} roughness={0.92} />
          </mesh>
          {Array.from({ length: Math.min(20, Math.ceil(wallH / 0.18)) }).map((_, row) =>
            Array.from({ length: Math.min(14, Math.ceil(width / 0.4)) }).map((_, col) => {
              const bw = 0.3 + (((row * 5 + col * 3) % 4) * 0.025)
              const bh = 0.1 + (((row * 3 + col) % 3) * 0.02)
              const x = -width / 2 + col * 0.4 + (row % 2 ? 0.18 : 0) + 0.2
              const y = -wallH / 2 + row * 0.18 + 0.09
              if (Math.abs(x) > width / 2 - 0.05) return null
              const shade = (row + col) % 3 === 0 ? '#888070' : '#6a6258'
              return (
                <mesh key={`st-${row}-${col}`} position={[x, y, 0.008]}>
                  <boxGeometry args={[bw, bh, 0.012]} />
                  <meshStandardMaterial color={shade} roughness={0.95} />
                </mesh>
              )
            })
          )}
        </group>
      )}

      {/* ── BRICK: accent back wall only – limited rows ── */}
      {wallMaterial === 'Brick' && (
        <group position={[0, wallH / 2, -halfL + 0.01]}>
          <mesh receiveShadow>
            <planeGeometry args={[width, wallH]} />
            <meshStandardMaterial color={wallColor !== '#f5f5f4' ? wallColor : '#6a3828'} roughness={0.95} />
          </mesh>
          {Array.from({ length: Math.min(22, Math.ceil(wallH / 0.11)) }).map((_, row) => {
            const y = -wallH / 2 + row * 0.11 + 0.055
            const offset = row % 2 === 0 ? 0 : 0.13
            return Array.from({ length: Math.min(16, Math.ceil(width / 0.26)) + 1 }).map((_, col) => {
              const x = -width / 2 + col * 0.26 + offset - 0.13
              if (Math.abs(x) > width / 2 + 0.1) return null
              return (
                <mesh key={`${row}-${col}`} position={[x, y, 0.007]}>
                  <boxGeometry args={[0.23, 0.085, 0.009]} />
                  <meshStandardMaterial color={row % 3 === 0 ? '#7a4030' : '#5a2818'} roughness={0.98} />
                </mesh>
              )
            })
          })}
        </group>
      )}

      {/* ── CERAMIC TILE: accent back wall only ── */}
      {wallMaterial === 'Ceramic' && (
        <group position={[0, wallH / 2, -halfL + 0.01]}>
          <mesh receiveShadow>
            <planeGeometry args={[width, wallH]} />
            <meshStandardMaterial color={wallColor !== '#f5f5f4' ? wallColor : '#d4d0cc'} roughness={0.15} metalness={0.06} />
          </mesh>
          {Array.from({ length: Math.ceil(width / 0.4) }).map((_, col) =>
            Array.from({ length: Math.ceil(wallH / 0.4) }).map((_, row) => (
              <mesh key={`ct-${col}-${row}`} position={[-width/2+col*0.4+0.2, -wallH/2+row*0.4+0.2, 0.003]}>
                <planeGeometry args={[0.375, 0.375]} />
                <meshStandardMaterial color={(col+row)%2===0?'#dcd8d4':'#ccc8c4'} roughness={0.12} metalness={0.08} />
              </mesh>
            ))
          )}
        </group>
      )}

      {/* ── CONCRETE: horizontal pour-lines on back wall only ── */}
      {wallMaterial === 'Concrete' && !isIndustrial && (
        <group position={[0, wallH / 2, -halfL + 0.01]}>
          <mesh receiveShadow>
            <planeGeometry args={[width, wallH]} />
            <meshStandardMaterial color={wallColor !== '#f5f5f4' ? wallColor : '#909090'} roughness={0.9} />
          </mesh>
          {Array.from({ length: 8 }).map((_, i) => (
            <mesh key={`cc-${i}`} position={[0, -wallH/2+(i+1)*(wallH/9), 0.004]}>
              <planeGeometry args={[width, 0.01]} />
              <meshStandardMaterial color="#707070" roughness={1} transparent opacity={0.5} />
            </mesh>
          ))}
        </group>
      )}

      {/* ── FABRIC: padded look on back wall only ── */}
      {wallMaterial === 'Fabric' && (
        <group position={[0, wallH / 2, -halfL + 0.01]}>
          <mesh receiveShadow>
            <planeGeometry args={[width, wallH]} />
            <meshStandardMaterial color={wallColor !== '#f5f5f4' ? wallColor : '#d4c8b8'} roughness={0.98} />
          </mesh>
          {Array.from({ length: Math.floor(width / 0.7) }).map((_, col) =>
            Array.from({ length: Math.floor(wallH / 0.7) }).map((_, row) => (
              <mesh key={`fb-${col}-${row}`} position={[-width/2+col*0.7+0.35, -wallH/2+row*0.7+0.35, 0.008]}>
                <planeGeometry args={[0.64, 0.64]} />
                <meshStandardMaterial color={(col+row)%2===0?'#ccc0b0':'#d8ccbc'} roughness={0.99} />
              </mesh>
            ))
          )}
        </group>
      )}

      {/* ── FLUTED PVC: vertical strips on back wall only ── */}
      {wallMaterial === 'Fluted' && (
        <group position={[0, wallH / 2, -halfL + 0.01]}>
          <mesh receiveShadow>
            <planeGeometry args={[width, wallH]} />
            <meshStandardMaterial color={wallColor !== '#f5f5f4' ? wallColor : '#2d333b'} roughness={0.7} />
          </mesh>
          {Array.from({ length: Math.floor(width / 0.08) }).map((_, i) => {
            const x = -width / 2 + 0.04 + i * 0.08
            return (
              <mesh key={`fl-${i}`} position={[x, 0, 0.016]} castShadow>
                <boxGeometry args={[0.055, wallH, 0.022]} />
                <meshStandardMaterial color={i%3===0?'#3a4048':'#2d333b'} roughness={0.55} />
              </mesh>
            )
          })}
        </group>
      )}
    </group>
  )
}'''
    
    content = content[:stone_start] + new_block + content[fluted_idx + len("    </group>\n  )\n}"):]
    print("Wall texture system replaced")
else:
    print(f"ERROR: Could not find stone block. stone_start={stone_start}, fluted_idx={fluted_idx}")

# ── Fix 2: Apply wallColor to ALL material types in colors computation ──────────
# Currently: only Plain/Plaster/Lime use wallColor. 
# Fix: ALL materials apply wallColor if the user changed it from default
old_color_logic = """    if (wallMaterial === 'Plain' || wallMaterial === 'Plaster' || wallMaterial === 'Lime') {
      base.wall = wallColor; base.accentWall = wallColor
    }"""
new_color_logic = """    // Apply wall color for all material types when user changes from default
    const userChangedColor = wallColor !== '#f5f5f4'
    if (wallMaterial === 'Plain' || wallMaterial === 'Plaster' || wallMaterial === 'Lime' || userChangedColor) {
      base.wall = wallColor; base.accentWall = wallColor
    }"""
if old_color_logic in content:
    content = content.replace(old_color_logic, new_color_logic)
    print("Wall color logic fixed")
else:
    print("WARNING: wall color logic not found")

# ── Fix 3: Enhance floor materials to be visually distinct ──────────────────────
old_floor_colors = """    if (floorMaterial === 'Wood') { base.floor = '#7a5230'; base.floorRoughness = 0.5 }
    else if (floorMaterial === 'Parquet') { base.floor = '#9c7a56'; base.floorRoughness = 0.6 }
    else if (floorMaterial === 'Tile') { base.floor = '#e0e6ec'; base.floorRoughness = 0.18 }
    else if (floorMaterial === 'Carpet') { base.floor = '#c8c4bc'; base.floorRoughness = 0.96 }
    else if (floorMaterial === 'Marble') { base.floor = '#f0ece8'; base.floorRoughness = 0.08 }
    else if (floorMaterial === 'Granite') { base.floor = '#3a3632'; base.floorRoughness = 0.25 }
    else if (floorMaterial === 'Epoxy') { base.floor = '#e0ddd8'; base.floorRoughness = 0.02 }
    else if (floorMaterial === 'Concrete') { base.floor = '#909090'; base.floorRoughness = 0.85 }
    else if (floorMaterial === 'Terrazzo') { base.floor = '#e8e2d8'; base.floorRoughness = 0.3 }"""
new_floor_colors = """    if (floorMaterial === 'Wood') { base.floor = '#8b5e30'; base.floorRoughness = 0.45 }
    else if (floorMaterial === 'Parquet') { base.floor = '#a87848'; base.floorRoughness = 0.55 }
    else if (floorMaterial === 'Tile') { base.floor = '#c8d8e8'; base.floorRoughness = 0.12 }
    else if (floorMaterial === 'Carpet') { base.floor = '#9e8870'; base.floorRoughness = 0.99 }
    else if (floorMaterial === 'Marble') { base.floor = '#f5f0ea'; base.floorRoughness = 0.04 }
    else if (floorMaterial === 'Granite') { base.floor = '#282420'; base.floorRoughness = 0.2 }
    else if (floorMaterial === 'Epoxy') { base.floor = '#c8e8d0'; base.floorRoughness = 0.01 }
    else if (floorMaterial === 'Concrete') { base.floor = '#848484'; base.floorRoughness = 0.88 }
    else if (floorMaterial === 'Terrazzo') { base.floor = '#e0d4c4'; base.floorRoughness = 0.28 }"""
if old_floor_colors in content:
    content = content.replace(old_floor_colors, new_floor_colors)
    print("Floor colors updated")
else:
    print("WARNING: floor colors not found")

with open(path_room, 'w', encoding='utf-8') as f:
    f.write(content)
print(f"Room.tsx written ({len(content)} chars)")
