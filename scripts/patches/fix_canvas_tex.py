"""
Replace the fragile "stacked meshes" wall texture approach with canvas-drawn textures.
Each wallMaterial now generates a CanvasTexture drawn programmatically — single mesh, 
zero z-fighting, visible from any angle, works for ALL materials.
"""
import sys
sys.stdout.reconfigure(encoding='utf-8')

# ── Read Room.tsx ────────────────────────────────────────────────────────────────
path = r'frontend\src\three\Room.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# The new WallTextureCanvas component replaces ALL the individual mesh blocks.
# It uses a <canvas> to draw the pattern and applies it via THREE.CanvasTexture
# We'll inject this component before the WallDecorations function.

# Find where WallDecorations starts so we insert BEFORE it
inject_before = '\nfunction WallDecorations('
inject_pos = content.find(inject_before)
print(f"WallDecorations at char {inject_pos}")

new_component = '''
// ============================================================
// WALL CANVAS TEXTURE — draws rich material patterns on canvas
// Applied directly to wall planes, no z-fighting possible.
// ============================================================
function useWallCanvasTexture(wallMaterial: string, wallColor: string, wallW: number, wallH: number) {
  return React.useMemo(() => {
    const W = 512, H = Math.round(512 * (wallH / wallW))
    const canvas = document.createElement('canvas')
    canvas.width = W; canvas.height = H
    const ctx = canvas.getContext('2d')!

    const bg = (wallColor && wallColor !== '#f5f5f4') ? wallColor : null

    if (wallMaterial === 'Brick') {
      const mortar = bg || '#2a1208'
      ctx.fillStyle = mortar
      ctx.fillRect(0, 0, W, H)
      const brickW = 68, brickH = 28, gap = 5
      const rows = Math.ceil(H / (brickH + gap)) + 1
      const cols = Math.ceil(W / (brickW + gap)) + 2
      for (let r = 0; r < rows; r++) {
        const offset = r % 2 === 0 ? 0 : (brickW + gap) / 2
        for (let c = 0; c < cols; c++) {
          const x = c * (brickW + gap) - offset
          const y = r * (brickH + gap)
          const shade = [
            '#c05828', '#b84820', '#d06030', '#a83818', '#cc5425',
          ][Math.floor(Math.abs(Math.sin(r * 7.3 + c * 3.7) * 100)) % 5]
          ctx.fillStyle = shade
          ctx.fillRect(x + 1, y + 1, brickW - 2, brickH - 2)
          // subtle highlight on top edge
          ctx.fillStyle = 'rgba(255,200,160,0.15)'
          ctx.fillRect(x + 1, y + 1, brickW - 2, 3)
        }
      }
    } else if (wallMaterial === 'Stone') {
      const mortar = bg || '#1e1c18'
      ctx.fillStyle = mortar
      ctx.fillRect(0, 0, W, H)
      let y = 0
      let rowIdx = 0
      while (y < H) {
        const stH = 30 + (rowIdx % 3) * 8
        const offset = rowIdx % 2 === 0 ? 0 : 70
        let x = -offset
        while (x < W) {
          const stW = 80 + ((rowIdx * 5 + Math.floor(x / 80)) % 4) * 20
          const shade = ['#a09888','#b0a898','#8a8278','#c0b4a8','#988e82'][
            Math.floor(Math.abs(Math.sin(rowIdx * 13 + x) * 100)) % 5]
          ctx.fillStyle = shade
          ctx.fillRect(x + 2, y + 2, stW - 4, stH - 4)
          ctx.fillStyle = 'rgba(255,255,255,0.08)'
          ctx.fillRect(x + 2, y + 2, stW - 4, 4)
          x += stW
        }
        y += stH; rowIdx++
      }
    } else if (wallMaterial === 'Ceramic') {
      const grout = bg ? shadeHexCanvas(bg, 0.4) : '#333'
      ctx.fillStyle = grout
      ctx.fillRect(0, 0, W, H)
      const tileW = 80, tileH = 80, gap = 5
      const rows = Math.ceil(H / (tileH + gap)) + 1
      const cols = Math.ceil(W / (tileW + gap)) + 1
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * (tileW + gap), y = r * (tileH + gap)
          const base = bg || ((r + c) % 2 === 0 ? '#f0ece8' : '#e4e0dc')
          ctx.fillStyle = base
          ctx.fillRect(x + 1, y + 1, tileW - 2, tileH - 2)
          ctx.fillStyle = 'rgba(255,255,255,0.3)'
          ctx.fillRect(x + 1, y + 1, tileW - 2, 6)
          // subtle reflection line
          ctx.fillStyle = 'rgba(255,255,255,0.12)'
          ctx.fillRect(x + 1, y + tileH * 0.3, tileW - 2, 3)
        }
      }
    } else if (wallMaterial === 'Panel') {
      // Wood Panel — vertical planks with wood grain
      ctx.fillStyle = bg || '#8b5e30'
      ctx.fillRect(0, 0, W, H)
      const plankW = 64
      const planks = Math.ceil(W / plankW) + 1
      for (let p = 0; p < planks; p++) {
        const x = p * plankW
        const hue = 25 + (p % 3) * 4
        const sat = 45 + (p % 5) * 3
        const lig = 28 + (p % 4) * 4
        ctx.fillStyle = bg || `hsl(${hue}, ${sat}%, ${lig}%)`
        ctx.fillRect(x + 2, 0, plankW - 4, H)
        // wood grain lines
        for (let g = 0; g < 12; g++) {
          const gx = x + 4 + (g * 5) % (plankW - 8)
          ctx.strokeStyle = 'rgba(0,0,0,0.12)'
          ctx.lineWidth = 1
          ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx + Math.sin(g * 0.8) * 6, H); ctx.stroke()
        }
        // edge shadow
        ctx.fillStyle = 'rgba(0,0,0,0.25)'
        ctx.fillRect(x, 0, 2, H)
        ctx.fillRect(x + plankW - 2, 0, 2, H)
      }
    } else if (wallMaterial === 'Fluted') {
      const base = bg || '#2d333b'
      ctx.fillStyle = base
      ctx.fillRect(0, 0, W, H)
      const fluteW = 20
      const flutes = Math.ceil(W / fluteW) + 1
      for (let f = 0; f < flutes; f++) {
        const x = f * fluteW
        // gradient from light edge to dark body to light edge
        const grad = ctx.createLinearGradient(x, 0, x + fluteW, 0)
        grad.addColorStop(0,    'rgba(255,255,255,0.22)')
        grad.addColorStop(0.25, bg || '#3a4150')
        grad.addColorStop(0.75, bg ? 'rgba(0,0,0,0.3)' : '#1e2228')
        grad.addColorStop(1,    'rgba(255,255,255,0.18)')
        ctx.fillStyle = grad
        ctx.fillRect(x, 0, fluteW, H)
      }
    } else if (wallMaterial === 'Fabric') {
      const base = bg || '#c8bca8'
      ctx.fillStyle = base
      ctx.fillRect(0, 0, W, H)
      const panelW = 120, panelH = 120, gap = 8
      const cols = Math.ceil(W / (panelW + gap)) + 1
      const rows = Math.ceil(H / (panelH + gap)) + 1
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * (panelW + gap), y = r * (panelH + gap)
          const shade = bg || ((r + c) % 2 === 0 ? '#d4c8b4' : '#c0b4a0')
          // Padded panel
          ctx.fillStyle = shade
          ctx.fillRect(x + 2, y + 2, panelW - 4, panelH - 4)
          // Diamond stitch pattern
          ctx.strokeStyle = 'rgba(0,0,0,0.18)'
          ctx.lineWidth = 1
          const cx2 = x + panelW / 2, cy2 = y + panelH / 2
          ctx.beginPath(); ctx.moveTo(x + 4, cy2); ctx.lineTo(cx2, y + 4); ctx.lineTo(x + panelW - 4, cy2); ctx.lineTo(cx2, y + panelH - 4); ctx.closePath(); ctx.stroke()
          // Button dot at center
          ctx.fillStyle = 'rgba(0,0,0,0.3)'
          ctx.beginPath(); ctx.arc(cx2, cy2, 3, 0, Math.PI * 2); ctx.fill()
        }
      }
    } else if (wallMaterial === 'Wallpaper') {
      const base = bg || '#e8dfd4'
      ctx.fillStyle = base
      ctx.fillRect(0, 0, W, H)
      // Damask-style repeating pattern
      const motifW = 80, motifH = 100
      const cols = Math.ceil(W / motifW) + 1
      const rows = Math.ceil(H / motifH) + 1
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cx2 = c * motifW + (r % 2 === 0 ? 0 : motifW / 2)
          const cy2 = r * motifH
          ctx.fillStyle = 'rgba(0,0,0,0.07)'
          // Oval center
          ctx.beginPath(); ctx.ellipse(cx2 + motifW/2, cy2 + motifH/2, 16, 24, 0, 0, Math.PI*2); ctx.fill()
          // Four petals
          for (let a = 0; a < 4; a++) {
            const angle = a * Math.PI / 2
            const px = cx2 + motifW/2 + Math.cos(angle) * 22
            const py = cy2 + motifH/2 + Math.sin(angle) * 28
            ctx.beginPath(); ctx.ellipse(px, py, 8, 14, angle, 0, Math.PI*2); ctx.fill()
          }
        }
      }
      // Horizontal chair rail line
      ctx.fillStyle = 'rgba(160,128,80,0.4)'
      ctx.fillRect(0, H * 0.38, W, 4)
    } else if (wallMaterial === 'Textured' || wallMaterial === 'Plaster') {
      const base = bg || '#d8d0c4'
      ctx.fillStyle = base
      ctx.fillRect(0, 0, W, H)
      // Random stucco bumps
      for (let i = 0; i < 300; i++) {
        const sx = Math.random() * W, sy = Math.random() * H
        const sr = 4 + Math.random() * 10
        const brightness = 0.92 + Math.random() * 0.12
        ctx.globalAlpha = 0.15 + Math.random() * 0.15
        ctx.fillStyle = brightness > 1 ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)'
        ctx.beginPath(); ctx.ellipse(sx, sy, sr, sr * 0.5, Math.random() * Math.PI, 0, Math.PI*2); ctx.fill()
      }
      ctx.globalAlpha = 1
    } else if (wallMaterial === 'Concrete') {
      const base = bg || '#888'
      ctx.fillStyle = base
      ctx.fillRect(0, 0, W, H)
      // Horizontal pour marks
      for (let i = 0; i < 10; i++) {
        const y2 = (i / 10) * H
        ctx.fillStyle = 'rgba(0,0,0,0.18)'
        ctx.fillRect(0, y2, W, 2)
        ctx.fillStyle = 'rgba(255,255,255,0.06)'
        ctx.fillRect(0, y2 + 2, W, 1)
      }
      // Subtle pitting
      for (let i = 0; i < 60; i++) {
        ctx.fillStyle = 'rgba(0,0,0,0.12)'
        ctx.beginPath(); ctx.arc(Math.random()*W, Math.random()*H, 1+Math.random()*3, 0, Math.PI*2); ctx.fill()
      }
    } else if (wallMaterial === 'Lime') {
      const base = bg || '#e4dcc8'
      ctx.fillStyle = base
      ctx.fillRect(0, 0, W, H)
      // Limewash brush strokes
      for (let i = 0; i < 60; i++) {
        const sx = Math.random() * W, sy = Math.random() * H
        const sw = 30 + Math.random() * 80
        ctx.globalAlpha = 0.08 + Math.random() * 0.12
        ctx.fillStyle = Math.random() > 0.5 ? 'white' : '#c0b898'
        ctx.save()
        ctx.translate(sx, sy)
        ctx.rotate(Math.random() * 0.4 - 0.2)
        ctx.fillRect(-sw/2, -3, sw, 5 + Math.random() * 6)
        ctx.restore()
      }
      ctx.globalAlpha = 1
    } else {
      // Plain / default
      ctx.fillStyle = bg || '#f5f5f4'
      ctx.fillRect(0, 0, W, H)
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    // Repeat based on room dimension so bricks stay proportional
    texture.repeat.set(wallW / 2.5, wallH / 2.5)
    texture.needsUpdate = true
    return texture
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallMaterial, wallColor, wallW, wallH])
}

function shadeHexCanvas(hex: string, amount: number): string {
  const r = Math.min(255, Math.round(parseInt(hex.slice(1,3),16)*(1-amount)))
  const g = Math.min(255, Math.round(parseInt(hex.slice(3,5),16)*(1-amount)))
  const b = Math.min(255, Math.round(parseInt(hex.slice(5,7),16)*(1-amount)))
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`
}

// ── WallTextureOverlay: applies canvas texture on all 4 walls ──────────────────
function WallTextureOverlay({ widthM, lengthM, wallH }: { widthM: number; lengthM: number; wallH: number }) {
  const wallMaterial = useStudioStore(s => s.wallMaterial)
  const wallColor    = useStudioStore(s => s.wallColor)

  // Skip for Plain/default — base wall material is enough
  if (wallMaterial === 'Plain') return null

  // Back wall texture (widthM wide)
  const backTex  = useWallCanvasTexture(wallMaterial, wallColor, widthM, wallH)
  // Side wall texture (lengthM wide)
  const sideTex  = useWallCanvasTexture(wallMaterial, wallColor, lengthM, wallH)

  const halfW = widthM / 2, halfL = lengthM / 2

  return (
    <group>
      {/* Back wall */}
      <mesh position={[0, wallH / 2, -halfL + 0.04]}>
        <planeGeometry args={[widthM, wallH]} />
        <meshStandardMaterial map={backTex} roughness={0.85} />
      </mesh>
      {/* Front wall */}
      <mesh position={[0, wallH / 2, halfL - 0.04]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[widthM, wallH]} />
        <meshStandardMaterial map={backTex} roughness={0.85} />
      </mesh>
      {/* Left wall */}
      <mesh position={[-halfW + 0.04, wallH / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[lengthM, wallH]} />
        <meshStandardMaterial map={sideTex} roughness={0.85} />
      </mesh>
      {/* Right wall */}
      <mesh position={[halfW - 0.04, wallH / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[lengthM, wallH]} />
        <meshStandardMaterial map={sideTex} roughness={0.85} />
      </mesh>
    </group>
  )
}

'''

if inject_pos > 0:
    content = content[:inject_pos] + new_component + content[inject_pos:]
    print("WallTextureOverlay + useWallCanvasTexture injected")
else:
    print("ERROR: WallDecorations function not found")
    exit(1)

# Now add THREE import check — CanvasTexture and RepeatWrapping need to be imported
# Check what's imported from three
import re
three_import = re.search(r"import \* as THREE from 'three'", content)
if three_import:
    print("THREE already imported as namespace")
else:
    # Check for named imports
    named = re.search(r"import \{([^}]+)\} from 'three'", content)
    if named:
        existing = named.group(1)
        print(f"Existing three imports: {existing}")
        # We use THREE namespace in new code, but file might use named imports
        # Add namespace import before the named one
        old_import = named.group(0)
        new_imports = "import * as THREE from 'three'\n" + old_import
        content = content.replace(old_import, new_imports, 1)
        print("Added THREE namespace import")

# Add WallTextureOverlay call in Room component, after WallDecorations
old_wall_deco_call = '<WallDecorations width={widthM} length={lengthM} wallH={wallH} styleSliders={styleSliders} />'
new_wall_deco_calls = '''<WallDecorations width={widthM} length={lengthM} wallH={wallH} styleSliders={styleSliders} />
      <WallTextureOverlay widthM={widthM} lengthM={lengthM} wallH={wallH} />'''

if old_wall_deco_call in content:
    content = content.replace(old_wall_deco_call, new_wall_deco_calls)
    print("WallTextureOverlay added to Room render")
else:
    print("WARNING: WallDecorations call not found in Room")

# Now REMOVE the old geometry-based pattern blocks from WallDecorations
# They're still there causing redundant draw calls. Remove the stone/brick/ceramic/concrete/fabric/fluted blocks.
# Find the new WallTextureOverlay section inside WallDecorations
old_stone_block_start = '      {/* \u2500\u2500 STONE: accent wall only (lightweight) \u2500\u2500 */}'
old_fluted_block_end  = "          })}\n        </group>\n      )}\n    </group>\n  )\n}"

stone_idx = content.find(old_stone_block_start)
if stone_idx == -1:
    # Check if CRLF variant is present
    old_stone_block_crlf = old_stone_block_start.replace('\n', '\r\n')
    stone_idx = content.find(old_stone_block_crlf)

if stone_idx == -1:
    print("Old geometry blocks already removed or not found")
else:
    fluted_idx = content.rfind(old_fluted_block_end, stone_idx, stone_idx + 15000)
    if fluted_idx <= stone_idx:
        # Try CRLF for fluted block end
        old_fluted_block_end_crlf = old_fluted_block_end.replace('\n', '\r\n')
        fluted_idx = content.rfind(old_fluted_block_end_crlf, stone_idx, stone_idx + 15000)
        
    if fluted_idx <= stone_idx:
        raise RuntimeError(f"ERROR: Old geometry blocks not cleanly found. stone_idx={stone_idx}, fluted_idx={fluted_idx}")

    old_geom_blocks = content[stone_idx:fluted_idx + (len(old_fluted_block_end) if '\r\n' not in content[fluted_idx:fluted_idx+20] else len(old_fluted_block_end.replace('\n', '\r\n')))]
    print(f"Removing old geometry blocks ({len(old_geom_blocks)} chars)")
    content = content.replace(old_geom_blocks, '    </group>\n  )\n}')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print(f"\nRoom.tsx written ({len(content)} chars)")
print("Done!")
