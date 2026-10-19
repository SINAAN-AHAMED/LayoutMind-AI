"""
Fix Room.tsx TypeScript errors:
1. Add wallColor from store in WallDecorations
2. Remove redundant `|| wallMaterial === 'Stone'` (already covered by isStone)
"""
import sys
sys.stdout.reconfigure(encoding='utf-8')

path = r'frontend\src\three\Room.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Add wallColor to WallDecorations store reads
old_stores = "  const wallMaterial = useStudioStore(s => s.wallMaterial)\n"
new_stores = ("  const wallMaterial = useStudioStore(s => s.wallMaterial)\n"
              "  const wallColor = useStudioStore(s => s.wallColor)\n")
if old_stores in content:
    # Only replace the FIRST occurrence (in WallDecorations)
    content = content.replace(old_stores, new_stores, 1)
    print("Added wallColor to WallDecorations")
else:
    # Try CRLF
    old_crlf = old_stores.replace('\n', '\r\n')
    new_crlf = new_stores.replace('\n', '\r\n')
    if old_crlf in content:
        content = content.replace(old_crlf, new_crlf, 1)
        print("Added wallColor to WallDecorations (CRLF)")
    else:
        print("WARNING: WallDecorations store read not found")

# Fix 2: Remove redundant `|| wallMaterial === 'Stone'` 
old_stone = "(isStone || wallMaterial === 'Stone') && ("
new_stone = "isStone && ("
if old_stone in content:
    content = content.replace(old_stone, new_stone)
    print("Fixed Stone check")
else:
    print("WARNING: Stone check not found")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done!")
