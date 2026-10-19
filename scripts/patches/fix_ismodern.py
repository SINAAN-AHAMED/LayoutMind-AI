# WARNING: This script depends on fix_furniture.py to have already inserted the '// OTTOMAN COMPOSITE' marker (used as the lamp_end boundary).
# The required marker strings are '// FLOOR LAMP VARIANT' and '// OTTOMAN COMPOSITE'.

"""Remove unused isModern from FloorLampComposite"""
import sys
sys.stdout.reconfigure(encoding='utf-8')

path = r'frontend\src\three\FurnitureInstance.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find FloorLampComposite and remove the isModern line from it
# The function starts at '// FLOOR LAMP VARIANT'
# We need to remove 'const isModern = styleKey === \'Modern\'\n' only from FloorLampComposite

lamp_start = content.find('// FLOOR LAMP VARIANT')
if lamp_start < 0:
    print("ERROR: FloorLampComposite ('// FLOOR LAMP VARIANT') not found")
    exit(1)

lamp_end = content.find('// -------------------------------------------------------------\n// OTTOMAN COMPOSITE', lamp_start)
if lamp_end < 0:
    # Try CRLF version of the marker
    lamp_end = content.find('// -------------------------------------------------------------\r\n// OTTOMAN COMPOSITE', lamp_start)

if lamp_end < 0 or lamp_end <= lamp_start:
    print("ERROR: FloorLampComposite end marker ('// OTTOMAN COMPOSITE') not found")
    exit(1)

lamp_section = content[lamp_start:lamp_end]
print(f"FloorLamp section chars: {len(lamp_section)}")

# Remove 'const isModern' line from the lamp section
old_line = "  const isModern = styleKey === 'Modern'\n"
if old_line in lamp_section:
    lamp_section = lamp_section.replace(old_line, '')
    print('Removed isModern from FloorLampComposite')
else:
    old_line_crlf = "  const isModern = styleKey === 'Modern'\r\n"
    if old_line_crlf in lamp_section:
        lamp_section = lamp_section.replace(old_line_crlf, '')
        print('Removed isModern from FloorLampComposite (CRLF)')
    else:
        print('isModern line not found in FloorLampComposite block')

content = content[:lamp_start] + lamp_section + content[lamp_end:]

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
