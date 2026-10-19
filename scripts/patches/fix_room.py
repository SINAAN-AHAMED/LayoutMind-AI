import re

path = r'frontend\src\three\Room.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Clock — replace old broken clock with correct one
old_clock = '''      {/* Industrial wall clock */}
      {isIndustrial && (
        <group position={[-halfW + 0.025, wallH * 0.65, 0]} rotation={[0, Math.PI / 2, 0]}>
          <mesh>
            <cylinderGeometry args={[0.28, 0.28, 0.04, 32]} />
            <meshStandardMaterial color="#2a2a2a" roughness={0.5} metalness={0.7} />
          </mesh>
          <mesh position={[0, 0.025, 0]}>
            <cylinderGeometry args={[0.26, 0.26, 0.01, 32]} />
            <meshStandardMaterial color="#e0d8c8" roughness={0.8} />
          </mesh>
          {/* Clock hands */}
          <mesh position={[0.06, 0.04, 0]} rotation={[Math.PI / 2, 0, 0.5]}>
            <boxGeometry args={[0.01, 0.16, 0.01]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
          <mesh position={[0.02, 0.04, 0]} rotation={[Math.PI / 2, 0, 1.2]}>
            <boxGeometry args={[0.01, 0.1, 0.01]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
        </group>
      )}'''

new_clock = '''      {/* Industrial wall clock — face flat against left wall */}
      {isIndustrial && (
        <group position={[-halfW + 0.025, wallH * 0.65, 0]} rotation={[0, Math.PI / 2, 0]}>
          {/* Cylinder rotated so its flat face looks into the room (local +Z) */}
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.28, 0.28, 0.04, 32]} />
            <meshStandardMaterial color="#2a2a2a" roughness={0.5} metalness={0.7} />
          </mesh>
          {/* Clock face disc */}
          <mesh position={[0, 0, 0.022]}>
            <circleGeometry args={[0.265, 32]} />
            <meshStandardMaterial color="#e8e0cc" roughness={0.8} />
          </mesh>
          {/* Hour hand — in XY plane with Z-axis rotation */}
          <mesh position={[0, 0.055, 0.034]} rotation={[0, 0, 0.5]} castShadow>
            <boxGeometry args={[0.014, 0.13, 0.009]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
          {/* Minute hand */}
          <mesh position={[0, 0.085, 0.034]} rotation={[0, 0, 1.2]} castShadow>
            <boxGeometry args={[0.009, 0.19, 0.007]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
          {/* Center pin */}
          <mesh position={[0, 0, 0.038]}>
            <sphereGeometry args={[0.018, 8, 8]} />
            <meshStandardMaterial color="#c75000" roughness={0.3} metalness={0.5} />
          </mesh>
        </group>
      )}'''

if old_clock in content:
    content = content.replace(old_clock, new_clock)
    print('Clock fixed!')
elif new_clock in content:
    print('Clock already fixed!')
else:
    print('Clock pattern not found, trying normalized...')
    # normalize line endings
    old_norm = old_clock.replace('\n', '\r\n')
    new_norm = new_clock.replace('\n', '\r\n')
    if old_norm in content:
        content = content.replace(old_norm, new_norm)
        print('Clock fixed (CRLF)!')
    elif new_norm in content:
        print('Clock already fixed (CRLF)!')
    else:
        print('ERROR: Clock pattern still not found')
        import sys
        sys.exit(1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
