import re, sys

path = r'frontend\src\components\FurnitureSwapPanel.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix tvUnit variants to use distinct styles mapping to distinct 3D geometry
old = """  tvUnit: [
    { label: 'TV Console', costINR: 22000, style: 'Modern', delta: 'Default' },
    { label: 'Wall-Mount Shelf', costINR: 8000, style: 'Minimal', delta: '+Budget +Space' },
    { label: 'Entertainment Center', costINR: 45000, style: 'Luxury', delta: '+Storage -Budget' },
    { label: 'Floating TV Panel', costINR: 15000, style: 'Modern', delta: '+Style +Budget' },
    { label: 'Walnut Wood Finish', costINR: 28000, style: 'Modern', delta: '+Warmth', isMaterial: true },
    { label: 'High Gloss White', costINR: 20000, style: 'Minimal', delta: '+Clean Look', isMaterial: true },
    { label: 'PVC Fluted Panel Back', costINR: 32000, style: 'Luxury', delta: '+Premium', isMaterial: true },
  ],"""

new = """  tvUnit: [
    { label: 'Modern TV Console', costINR: 22000, style: 'Modern', delta: 'Default' },
    { label: 'Wall-Mount Floating Shelf', costINR: 8000, style: 'Minimal', delta: '+Budget +Space — Slim wall mount only' },
    { label: 'Luxury Entertainment Centre', costINR: 45000, style: 'Luxury', delta: '+Storage — Full unit with LED lighting' },
    { label: 'Compact Lowboard', costINR: 12000, style: 'Compact', delta: '+Budget — Small cubby unit with slim legs' },
    { label: 'Vintage Wood Credenza', costINR: 28000, style: 'Cozy', delta: '+Warmth — Panelled doors & tapered legs' },
    { label: 'Rattan Coastal Console', costINR: 18000, style: 'Coastal', delta: '+Natural — Woven front panel' },
    { label: 'Industrial Pipe Unit', costINR: 20000, style: 'Industrial', delta: '+Raw — Metal pipe legs' },
    { label: 'Walnut Wood Finish', costINR: 28000, style: 'Modern', delta: '+Warmth', isMaterial: true },
    { label: 'High Gloss White', costINR: 20000, style: 'Minimal', delta: '+Clean Look', isMaterial: true },
    { label: 'PVC Fluted Panel Back', costINR: 32000, style: 'Luxury', delta: '+Premium', isMaterial: true },
  ],"""

# Try direct replace
if old in content:
    content = content.replace(old, new)
    print('tvUnit variants fixed (LF)')
else:
    old_crlf = old.replace('\n', '\r\n')
    if old_crlf in content:
        content = content.replace(old_crlf, new)
        print('tvUnit variants fixed (CRLF)')
    else:
        # Try with regex ignoring whitespace differences
        import re
        pattern = r"tvUnit: \[.*?\],"
        match = re.search(pattern, content, re.DOTALL)
        if match:
            content = content[:match.start()] + new.strip() + content[match.end():]
            print('tvUnit variants fixed (regex)')
        else:
            print('ERROR: could not find tvUnit block')
            sys.exit(1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
