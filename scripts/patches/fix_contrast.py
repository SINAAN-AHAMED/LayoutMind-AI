"""
Fix two issues:
1. Wall textures - increase contrast: mortar should be darker, faces lighter (more visible)
"""
import sys, re
sys.stdout.reconfigure(encoding='utf-8')

# ─── FIX 1: Wall texture contrast ───────────────────────────────────────────────
path = r'frontend\src\three\Room.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

def safe_replace(content, old, new, label):
    if old in content:
        content = content.replace(old, new)
        print(f"{label} updated (LF)")
        return content, True
    
    old_crlf = old.replace('\n', '\r\n')
    new_crlf = new.replace('\n', '\r\n')
    if old_crlf in content:
        content = content.replace(old_crlf, new_crlf)
        print(f"{label} updated (CRLF)")
        return content, True
    
    print(f"WARNING: {label} not found")
    return content, False

# BRICK: Make bricks LIGHTER than mortar for clear contrast
# Base plane = dark mortar grey; bricks = warm terracotta/red
old_brick_plane = """            <meshStandardMaterial color={wallColor !== '#f5f5f4' ? wallColor : '#6a3828'} roughness={0.95} />
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
          })}"""

new_brick_plane = """            <meshStandardMaterial color="#3d1a10" roughness={0.98} />
          </mesh>
          {Array.from({ length: Math.min(22, Math.ceil(wallH / 0.11)) }).map((_, row) => {
            const y = -wallH / 2 + row * 0.11 + 0.055
            const offset = row % 2 === 0 ? 0 : 0.125
            return Array.from({ length: Math.min(16, Math.ceil(width / 0.25)) + 1 }).map((_, col) => {
              const x = -width / 2 + col * 0.25 + offset - 0.1
              if (Math.abs(x) > width / 2 + 0.15) return null
              const shade = (row * 3 + col) % 4 === 0 ? '#c45028' : (row + col) % 3 === 0 ? '#b84422' : '#a83820'
              const tint = wallColor !== '#f5f5f4' ? wallColor : shade
              return (
                <mesh key={`br-${row}-${col}`} position={[x, y, 0.009]}>
                  <boxGeometry args={[0.22, 0.085, 0.012]} />
                  <meshStandardMaterial color={tint} roughness={0.92} />
                </mesh>
              )
            })
          })}"""

content, _ = safe_replace(content, old_brick_plane, new_brick_plane, "Brick colors")

# STONE: Light stones on dark mortar
old_stone_material = '            <meshStandardMaterial color={wallColor !== \'#f5f5f4\' ? wallColor : \'#7a7068\'} roughness={0.92} />'
new_stone_material = '            <meshStandardMaterial color="#3a3630" roughness={0.95} />'
content, _ = safe_replace(content, old_stone_material, new_stone_material, "Stone base color")

old_stone_face = "                  <meshStandardMaterial color={(row + col) % 3 === 0 ? '#888070' : '#6a6258'} roughness={0.95} />"
new_stone_face = "                  <meshStandardMaterial color={(row + col) % 3 === 0 ? '#b0a898' : '#c8bdb0'} roughness={0.88} />"
content, _ = safe_replace(content, old_stone_face, new_stone_face, "Stone face colors")

# CERAMIC: Dark grout + light tiles — high contrast
old_ceramic_base = '            <meshStandardMaterial color={wallColor !== \'#f5f5f4\' ? wallColor : \'#d4d0cc\'} roughness={0.15} metalness={0.06} />'
new_ceramic_base = '            <meshStandardMaterial color="#444" roughness={0.9} />'
content, _ = safe_replace(content, old_ceramic_base, new_ceramic_base, "Ceramic grout color")

old_ceramic_tile = "                <meshStandardMaterial color={(col+row)%2===0?'#dcd8d4':'#ccc8c4'} roughness={0.12} metalness={0.08} />"
new_ceramic_tile = """                <meshStandardMaterial
                  color={wallColor !== '#f5f5f4' ? wallColor : ((col+row)%2===0 ? '#f0ece8' : '#e4e0dc')}
                  roughness={0.1} metalness={0.05} />"""
content, _ = safe_replace(content, old_ceramic_tile, new_ceramic_tile, "Ceramic tile colors")

# CONCRETE: stronger horizontal lines
old_concrete_line = '              <meshStandardMaterial color="#707070" roughness={1} transparent opacity={0.5} />'
new_concrete_line = '              <meshStandardMaterial color="#505050" roughness={1} transparent opacity={0.8} />'
content, _ = safe_replace(content, old_concrete_line, new_concrete_line, "Concrete lines")

# FABRIC: More contrast between panels
old_fabric_tile = "                <meshStandardMaterial color={(col+row)%2===0?'#ccc0b0':'#d8ccbc'} roughness={0.99} />"
new_fabric_tile = "                <meshStandardMaterial color={(col+row)%2===0?'#b8a898':'#e8ddd0'} roughness={0.99} />"
content, _ = safe_replace(content, old_fabric_tile, new_fabric_tile, "Fabric panel contrast")

# FLUTED: higher contrast strips
old_fluted_strips = "                <meshStandardMaterial color={i%3===0?'#3a4048':'#2d333b'} roughness={0.55} />"
new_fluted_strips = "                <meshStandardMaterial color={i%2===0?'#4a5260':'#1e2228'} roughness={0.45} metalness={0.1} />"
content, _ = safe_replace(content, old_fluted_strips, new_fluted_strips, "Fluted strips")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print(f"Room.tsx updated ({len(content)} chars)")
