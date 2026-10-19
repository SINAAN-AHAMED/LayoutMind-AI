"""
Comprehensive fix script for FurnitureInstance.tsx:
1. Replace FloorLampComposite with rich style variants
2. Add OttomanComposite and DresserComposite
3. Update render switch to handle new types
"""

path = r'frontend\src\three\FurnitureInstance.tsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

content = ''.join(lines)

# ─── 1. Replace FloorLampComposite ────────────────────────────────────────────
# Find the FloorLampComposite function start and end
start_marker = '// FLOOR LAMP VARIANT\n'
# Find start line index
lamp_start = None
lamp_end = None
for i, line in enumerate(lines):
    if '// FLOOR LAMP VARIANT' in line:
        lamp_start = i - 1  # include the separator comment before
        break

if lamp_start is None:
    print("ERROR: FloorLamp block not found")
    exit(1)

# Find end: next function definition after FloorLampComposite
for i in range(lamp_start + 1, len(lines)):
    if lines[i].startswith('// -------'):
        lamp_end = i
        break

if lamp_end is None:
    print("ERROR: FloorLampComposite end marker not found")
    exit(1)

print(f"FloorLamp block: lines {lamp_start+1} to {lamp_end}")

new_lamp = '''// -------------------------------------------------------------
// FLOOR LAMP VARIANT — rich per-style geometry
// -------------------------------------------------------------
function FloorLampComposite({ styleKey }: { styleKey: DominantStyle }) {
  const p = STYLE_PALETTES[styleKey]
  const isLuxury = styleKey === 'Luxury'
  const isIndustrial = styleKey === 'Industrial'
  const isModern = styleKey === 'Modern'
  const isBohemian = styleKey === 'Bohemian'
  const isCoastal = styleKey === 'Coastal'
  const isCozy = styleKey === 'Cozy'

  if (isLuxury) {
    return (
      <group>
        <mesh position={[0, 0.02, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.22, 0.04, 20]} />
          <meshStandardMaterial color={p.metal} roughness={0.2} metalness={0.9} />
        </mesh>
        <mesh position={[0, 0.85, 0]} castShadow>
          <cylinderGeometry args={[0.018, 0.018, 1.66, 8]} />
          <meshStandardMaterial color={p.metal} roughness={0.2} metalness={0.9} />
        </mesh>
        <mesh position={[0, 1.72, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.04, 0.28, 20, 1, true]} />
          <meshStandardMaterial color={p.secondary} roughness={0.5} side={2} />
        </mesh>
        <mesh position={[0, 1.72, 0]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#fff8e0" emissive="#ffdd88" emissiveIntensity={3} />
        </mesh>
        <pointLight position={[0, 1.75, 0]} intensity={1.2} color="#ffeedd" distance={5} />
      </group>
    )
  }

  if (isBohemian) {
    return (
      <group>
        {[-0.18, 0.18, 0].map((x, i) => (
          <mesh key={i} position={[x, 0.7, i === 2 ? 0.22 : 0]}
            rotation={[i === 2 ? 0.35 : -0.22, (i * Math.PI * 2) / 3, 0]} castShadow>
            <cylinderGeometry args={[0.018, 0.018, 1.44, 6]} />
            <meshStandardMaterial color="#8b6540" roughness={0.9} />
          </mesh>
        ))}
        <mesh position={[0, 1.4, 0]} castShadow>
          <sphereGeometry args={[0.22, 10, 10]} />
          <meshStandardMaterial color="#c49a5a" roughness={0.9} transparent opacity={0.45} />
        </mesh>
        <mesh position={[0, 1.4, 0]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color="#fff4e0" emissive="#ffcc66" emissiveIntensity={2.2} />
        </mesh>
        <pointLight position={[0, 1.4, 0]} intensity={1.0} color="#ffeecc" distance={5} castShadow />
      </group>
    )
  }

  if (isCoastal) {
    return (
      <group>
        {[0, 1, 2].map(i => {
          const ang = (i / 3) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.cos(ang) * 0.15, 0.72, Math.sin(ang) * 0.15]}
              rotation={[Math.cos(ang) * 0.32, ang, 0]} castShadow>
              <cylinderGeometry args={[0.02, 0.03, 1.44, 6]} />
              <meshStandardMaterial color="#c8a882" roughness={0.95} />
            </mesh>
          )
        })}
        <mesh position={[0, 1.42, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.18, 0.24, 16, 1, true]} />
          <meshStandardMaterial color="#e8f0f4" roughness={0.7} side={2} />
        </mesh>
        <mesh position={[0, 1.38, 0]}>
          <sphereGeometry args={[0.038, 8, 8]} />
          <meshStandardMaterial color="#fff8f0" emissive="#ffeecc" emissiveIntensity={2.5} />
        </mesh>
        <pointLight position={[0, 1.4, 0]} intensity={0.9} color="#f0f8ff" distance={4} />
      </group>
    )
  }

  if (isCozy) {
    return (
      <group>
        <mesh position={[0, 0.08, 0]} castShadow>
          <cylinderGeometry args={[0.16, 0.2, 0.16, 12]} />
          <meshStandardMaterial color="#c9a227" roughness={0.4} metalness={0.7} />
        </mesh>
        <mesh position={[0, 0.82, 0]} castShadow>
          <cylinderGeometry args={[0.022, 0.022, 1.32, 8]} />
          <meshStandardMaterial color="#c9a227" roughness={0.4} metalness={0.7} />
        </mesh>
        <mesh position={[0, 1.55, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.22, 0.3, 16, 1, true]} />
          <meshStandardMaterial color={p.secondary} roughness={0.85} side={2} />
        </mesh>
        <mesh position={[0, 1.5, 0]}>
          <sphereGeometry args={[0.042, 8, 8]} />
          <meshStandardMaterial color="#fff4e0" emissive="#ffcc66" emissiveIntensity={2.2} />
        </mesh>
        <pointLight position={[0, 1.5, 0]} intensity={0.9} color="#ffedcc" distance={4.5} />
      </group>
    )
  }

  if (isIndustrial) {
    return (
      <group>
        <mesh position={[0, 0.02, 0]} castShadow>
          <cylinderGeometry args={[0.14, 0.16, 0.04, 8]} />
          <meshStandardMaterial color="#555" roughness={0.4} metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.8, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 1.55, 8]} />
          <meshStandardMaterial color="#8a8a8a" roughness={0.4} metalness={0.8} />
        </mesh>
        <mesh position={[0, 1.55, 0]} castShadow>
          <sphereGeometry args={[0.16, 6, 6]} />
          <meshStandardMaterial color={p.metal} roughness={0.4} metalness={0.8} transparent opacity={0.35} />
        </mesh>
        <mesh position={[0, 1.55, 0]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color="#fff4e0" emissive="#ffcc44" emissiveIntensity={3} />
        </mesh>
        <pointLight position={[0, 1.55, 0]} intensity={0.8} color="#ffeecc" distance={4} />
      </group>
    )
  }

  // Modern: arc floor lamp (default)
  return (
    <group>
      <mesh position={[0, 0.02, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.15, 0.18, 0.04, 16]} />
        <meshStandardMaterial color={p.metal} roughness={0.3} metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.8, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 1.55, 8]} />
        <meshStandardMaterial color="#333333" roughness={0.4} metalness={0.7} />
      </mesh>
      <mesh position={[0.3, 1.4, 0]} rotation={[0, 0, -0.6]} castShadow>
        <cylinderGeometry args={[0.015, 0.015, 0.5, 8]} />
        <meshStandardMaterial color={p.metal} roughness={0.3} metalness={0.8} />
      </mesh>
      <mesh position={[0.52, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.18, 0.25, 16, 1, true]} />
        <meshStandardMaterial color="#f5f0e8" roughness={0.8} side={2} />
      </mesh>
      <mesh position={[0.52, 1.18, 0]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#fff4e0" emissive="#ffcc66" emissiveIntensity={2.5} />
      </mesh>
      <pointLight position={[0.52, 1.2, 0]} intensity={0.8} color="#ffedcc" distance={4} />
    </group>
  )
}

// -------------------------------------------------------------
// OTTOMAN COMPOSITE
// -------------------------------------------------------------
function OttomanComposite({ styleKey }: { styleKey: DominantStyle }) {
  const p = STYLE_PALETTES[styleKey]
  const isLuxury = styleKey === 'Luxury'
  const isModern = styleKey === 'Modern'
  const segs = isModern ? 32 : 12
  return (
    <group>
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[isModern ? 0.38 : 0.42, isModern ? 0.36 : 0.4, 0.28, segs]} />
        <meshStandardMaterial color={p.primary} roughness={isLuxury ? 0.3 : 0.85} />
      </mesh>
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[isModern ? 0.36 : 0.40, isModern ? 0.34 : 0.38, 0.06, segs]} />
        <meshStandardMaterial color={p.secondary} roughness={0.8} />
      </mesh>
      {[0, 1, 2, 3].map(i => {
        const ang = (i / 4) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(ang) * 0.32, 0.06, Math.sin(ang) * 0.32]} castShadow>
            <cylinderGeometry args={[0.02, 0.015, 0.12, 8]} />
            <meshStandardMaterial color={isLuxury ? p.metal : p.wood}
              roughness={isLuxury ? 0.2 : 0.6} metalness={isLuxury ? 0.8 : 0} />
          </mesh>
        )
      })}
    </group>
  )
}

// -------------------------------------------------------------
// DRESSER COMPOSITE
// -------------------------------------------------------------
function DresserComposite({ styleKey }: { styleKey: DominantStyle }) {
  const p = STYLE_PALETTES[styleKey]
  const isLuxury = styleKey === 'Luxury'
  const isCozy = styleKey === 'Cozy'
  return (
    <group>
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.1, 1.0, 0.48]} />
        <meshStandardMaterial color={p.wood} roughness={0.7} />
      </mesh>
      {[0.12, 0.5, 0.88].map((y, row) =>
        [-0.27, 0.27].map((x, col) => (
          <mesh key={`d-${row}-${col}`} position={[x, y, 0.25]} castShadow>
            <boxGeometry args={[0.5, 0.28, 0.02]} />
            <meshStandardMaterial color={p.secondary} roughness={0.75} />
          </mesh>
        ))
      )}
      {[0.12, 0.5, 0.88].map((y, row) =>
        [-0.27, 0.27].map((x, col) => (
          <mesh key={`h-${row}-${col}`} position={[x, y, 0.27]}>
            <boxGeometry args={[0.12, 0.02, 0.025]} />
            <meshStandardMaterial color={isLuxury ? '#c9a227' : '#888'}
              roughness={0.3} metalness={0.7} />
          </mesh>
        ))
      )}
      <mesh position={[0, 1.02, 0]} castShadow>
        <boxGeometry args={[1.12, 0.04, 0.5]} />
        <meshStandardMaterial color={p.wood} roughness={0.6} />
      </mesh>
      {(isLuxury || isCozy) && (
        <>
          <mesh position={[0, 1.55, -0.06]} castShadow>
            <boxGeometry args={[0.7, 1.0, 0.03]} />
            <meshStandardMaterial color={p.wood} roughness={0.65} />
          </mesh>
          <mesh position={[0, 1.55, -0.045]}>
            <boxGeometry args={[0.62, 0.9, 0.01]} />
            <meshStandardMaterial color="#c8d0d8" roughness={0.02} metalness={0.9} />
          </mesh>
        </>
      )}
    </group>
  )
}

'''

# Build new file by replacing the FloorLamp block
new_lines = lines[:lamp_start]
new_lines.append(new_lamp)
new_lines += lines[lamp_end:]

content = ''.join(new_lines)

# ─── 2. Update the render switch to include ottoman and dresser ────────────────
old_switch = """      case 'sideTable':  return <SideTableComposite styleKey={dominantStyle} />
      default:           return null"""
new_switch = """      case 'sideTable':  return <SideTableComposite styleKey={dominantStyle} />
      case 'ottoman':    return <OttomanComposite styleKey={dominantStyle} />
      case 'dresser':    return <DresserComposite styleKey={dominantStyle} />
      default:           return null"""

if old_switch in content:
    content = content.replace(old_switch, new_switch)
    print('Render switch updated')
elif new_switch in content:
    print('Render switch already updated')
else:
    old_switch_crlf = old_switch.replace('\n', '\r\n')
    new_switch_crlf = new_switch.replace('\n', '\r\n')
    if old_switch_crlf in content:
        content = content.replace(old_switch_crlf, new_switch_crlf)
        print('Render switch updated (CRLF)')
    elif new_switch_crlf in content:
        print('Render switch already updated (CRLF)')
    else:
        print('ERROR: Render switch pattern not found in FurnitureInstance.tsx')
        exit(1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f'Done! File written ({len(content)} bytes)')
