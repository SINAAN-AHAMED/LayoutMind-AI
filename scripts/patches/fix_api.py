"""Fix api.ts to add ottoman and dresser to the FurnitureItem type union"""
path = r'frontend\src\lib\api.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old = """  type: z.union([
    z.literal('sofa'),
    z.literal('bed'),
    z.literal('table'),
    z.literal('chair'),
    z.literal('wardrobe'),
    z.literal('tvUnit'),
    z.literal('plant'),
    z.literal('rug'),
    z.literal('floorLamp'),
    z.literal('sideTable'),
    z.literal('bookshelf'),
  ]),"""

new = """  type: z.union([
    z.literal('sofa'),
    z.literal('bed'),
    z.literal('table'),
    z.literal('chair'),
    z.literal('wardrobe'),
    z.literal('tvUnit'),
    z.literal('plant'),
    z.literal('rug'),
    z.literal('floorLamp'),
    z.literal('sideTable'),
    z.literal('bookshelf'),
    z.literal('ottoman'),
    z.literal('dresser'),
  ]),"""

if old in content:
    content = content.replace(old, new)
    print('api.ts updated (LF)')
else:
    old_crlf = old.replace('\n', '\r\n')
    if old_crlf in content:
        new_crlf = new.replace('\n', '\r\n')
        content = content.replace(old_crlf, new_crlf)
        print('api.ts updated (CRLF)')
    else:
        print('ERROR: pattern not found in api.ts')
        exit(1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
