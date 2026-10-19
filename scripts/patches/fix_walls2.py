"""Find exact markers in Room.tsx and do targeted replacement"""
path_room = r'frontend\src\three\Room.tsx'
with open(path_room, 'r', encoding='utf-8') as f:
    content = f.read()

# Find stone block start
stone_start = content.find('      {/* \u2500\u2500 STONE: Stacked stone on ALL walls \u2500\u2500 */}')
if stone_start < 0:
    # Try with different dash character
    stone_start = content.find('STONE: Stacked stone on ALL walls')
    if stone_start > 0:
        # Back up to find the start of the comment block
        stone_start = content.rfind('{/*', 0, stone_start)
        print(f"Found STONE at adjusted position: {stone_start}")
    else:
        print("ERROR: Cannot find STONE block")
        exit(1)

# Find the end: look for the closing of WallDecorations function after stone_start
# WallDecorations ends with "    </group>\n  )\n}"
# Find the last "    </group>" before "  )\n}" pattern after stone_start
search_area = content[stone_start:stone_start+12000]
print(f"Search area (first 200 chars): {repr(search_area[:200])}")

# Try both line ending variants
for ending in ['\r\n', '\n']:
    end_marker = f'    </group>{ending}  ){ending}}}'
    idx = search_area.rfind(end_marker)
    if idx >= 0:
        total_end = stone_start + idx + len(end_marker)
        print(f"Found ending with {'CRLF' if ending=='\\r\\n' else 'LF'} at relative idx {idx}")
        print(f"Total end position: {total_end}")
        print(f"Block length: {total_end - stone_start}")
        old_block = content[stone_start:total_end]
        print(f"First 100 chars: {repr(old_block[:100])}")
        print(f"Last 100 chars: {repr(old_block[-100:])}")
        
        new_block = '''      {/* \u2500\u2500 STONE: accent wall only (lightweight) \u2500\u2500 */}
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

      {/* \u2500\u2500 BRICK: accent back wall only (limited meshes) \u2500\u2500 */}
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

      {/* \u2500\u2500 CERAMIC TILE: accent back wall only \u2500\u2500 */}
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

      {/* \u2500\u2500 CONCRETE: pour-lines on back wall only \u2500\u2500 */}
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

      {/* \u2500\u2500 FABRIC: padded panels on back wall only \u2500\u2500 */}
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

      {/* \u2500\u2500 FLUTED PVC: vertical strips on back wall only \u2500\u2500 */}
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
        
        content = content[:stone_start] + new_block + content[total_end:]
        print(f"Block replaced. New content length: {len(content)}")
        break
else:
    print("ERROR: Could not find ending pattern")
    # Show the end of search area to diagnose
    print(f"End of search area: {repr(search_area[-200:])}")

with open(path_room, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done writing Room.tsx")
