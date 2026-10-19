"""Find exact markers in Room.tsx and do targeted replacement"""
import sys
sys.stdout.reconfigure(encoding='utf-8')

path_room = r'frontend\src\three\Room.tsx'
with open(path_room, 'r', encoding='utf-8') as f:
    content = f.read()

# Find stone block start by looking for unique substrings
import re

# Compiled regex patterns capturing structural parts (type and "ALL walls")
patterns = [
    re.compile(r'STONE:.*ALL\s+walls', re.IGNORECASE),
    re.compile(r'BRICK:.*ALL\s+walls', re.IGNORECASE),
    re.compile(r'CERAMIC.*ALL\s+walls', re.IGNORECASE),
    re.compile(r'CONCRETE:.*ALL\s+walls', re.IGNORECASE),
    re.compile(r'FABRIC:.*ALL\s+walls', re.IGNORECASE),
    re.compile(r'FLUTED.*ALL\s+walls', re.IGNORECASE),
]

positions = {}
for p in patterns:
    match = p.search(content)
    idx = match.start() if match else -1
    
    # Map back to original marker keys that the script references later
    if 'STONE' in p.pattern:
        positions['STONE: Stacked stone on ALL walls'] = idx
    elif 'BRICK' in p.pattern:
        positions['BRICK: Exposed brick on ALL walls'] = idx
    elif 'CERAMIC' in p.pattern:
        positions['CERAMIC TILE: on ALL walls'] = idx
    elif 'CONCRETE' in p.pattern:
        positions['CONCRETE: poured lines on ALL walls'] = idx
    elif 'FABRIC' in p.pattern:
        positions['FABRIC: padded panels on ALL walls'] = idx
    elif 'FLUTED' in p.pattern:
        positions['FLUTED PVC: fluted strips on ALL walls'] = idx
        
    print(f"  Pattern '{p.pattern}': {idx}")

stone_pos = positions['STONE: Stacked stone on ALL walls']
fluted_pos = positions['FLUTED PVC: fluted strips on ALL walls']

if stone_pos < 0:
    if "userChangedColor" in content:
        print("Wall textures already updated in Room.tsx")
        print("Done!")
        import sys
        sys.exit(0)
    else:
        print("ERROR: STONE block not found")
        exit(1)
if fluted_pos < 0:
    print("ERROR: FLUTED block not found")
    exit(1)

# Find the comment start before STONE
comment_start = content.rfind('{/*', stone_pos - 20, stone_pos)
print(f"Comment start: {comment_start}")

# Find the end of the FLUTED block - look for the WallDecorations closing
# After the fluted block, the closing pattern is:
#       ))}\n    </group>\n  )\n}
# or with CRLF
fluted_section_start = content.rfind('{/*', fluted_pos - 20, fluted_pos)
print(f"Fluted section start: {fluted_section_start}")

# Find end of WallDecorations after fluted block
# Search for "    </group>" followed by newline and "  )\n}"
search_from = fluted_pos
closing_patterns = [
    '      ))}\n    </group>\n  )\n}',
    '      ))}\r\n    </group>\r\n  )\r\n}',
    '    </group>\n  )\n}',
    '    </group>\r\n  )\r\n}',
]
block_end = -1
for pat in closing_patterns:
    idx = content.find(pat, search_from)
    if idx >= 0:
        block_end = idx + len(pat)
        print(f"Found closing pattern at {idx}: {repr(pat[:30])}")
        print(f"Block end: {block_end}")
        break

if block_end < 0:
    # Show what's after fluted_pos
    snippet = content[fluted_pos:fluted_pos+500]
    print(f"After fluted pos: {repr(snippet[-200:])}")
    exit(1)

old_block = content[comment_start:block_end]
print(f"Block to replace: {len(old_block)} chars, starts with: {repr(old_block[:60])}")
print(f"Block ends with: {repr(old_block[-60:])}")

# Determine line ending
lf = '\r\n' if '\r\n' in content[:1000] else '\n'

new_block = '''{/* ── STONE: accent wall only (lightweight) ── */}
      {(isStone || wallMaterial === 'Stone') && (
        <group position={[0, wallH / 2, -halfL + 0.012]}>
          <mesh receiveShadow>
            <planeGeometry args={[width, wallH]} />
            <meshStandardMaterial color={wallColor !== '#f5f5f4' ? wallColor : '#7a7068'} roughness={0.92} />
          </mesh>
          {Array.from({ length: Math.min(18, Math.ceil(wallH / 0.19)) }).map((_, row) =>
            Array.from({ length: Math.min(12, Math.ceil(width / 0.42)) }).map((_, col) => {
              const bw = 0.3 + (((row * 5 + col * 3) % 4) * 0.025)
              const bh = 0.1 + (((row * 3 + col) % 3) * 0.02)
              const x = -width / 2 + col * 0.42 + (row % 2 ? 0.18 : 0) + 0.21
              const y = -wallH / 2 + row * 0.19 + 0.095
              if (Math.abs(x) > width / 2 - 0.04) return null
              return (
                <mesh key={`st-${row}-${col}`} position={[x, y, 0.008]}>
                  <boxGeometry args={[bw, bh, 0.012]} />
                  <meshStandardMaterial color={(row + col) % 3 === 0 ? '#888070' : '#6a6258'} roughness={0.95} />
                </mesh>
              )
            })
          )}
        </group>
      )}

      {/* ── BRICK: accent back wall only (limited meshes) ── */}
      {wallMaterial === 'Brick' && (
        <group position={[0, wallH / 2, -halfL + 0.01]}>
          <mesh receiveShadow>
            <planeGeometry args={[width, wallH]} />
            <meshStandardMaterial color={wallColor !== '#f5f5f4' ? wallColor : '#6a3828'} roughness={0.95} />
          </mesh>
          {Array.from({ length: Math.min(20, Math.ceil(wallH / 0.12)) }).map((_, row) => {
            const y = -wallH / 2 + row * 0.12 + 0.06
            const offset = row % 2 === 0 ? 0 : 0.13
            return Array.from({ length: Math.min(14, Math.ceil(width / 0.26)) + 1 }).map((_, col) => {
              const x = -width / 2 + col * 0.26 + offset - 0.13
              if (Math.abs(x) > width / 2 + 0.1) return null
              return (
                <mesh key={`br-${row}-${col}`} position={[x, y, 0.007]}>
                  <boxGeometry args={[0.23, 0.09, 0.009]} />
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

      {/* ── CONCRETE: pour-lines on back wall only ── */}
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

      {/* ── FABRIC: padded panels on back wall only ── */}
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

content = content[:comment_start] + new_block + content[block_end:]
print(f"Replaced. New length: {len(content)}")

with open(path_room, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done!")
