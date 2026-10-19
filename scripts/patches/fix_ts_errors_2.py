"""Fix unused wallColor in Room.tsx"""
import sys
sys.stdout.reconfigure(encoding='utf-8')

path = r'frontend\src\three\Room.tsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    # Remove the wallColor declaration around line 597 (inside WallDecorations)
    if 'const wallColor = useStudioStore(s => s.wallColor)' in line and 'WallDecorations' in "".join(lines[max(0, i-20):i]):
        print(f"Removed unused wallColor at line {i+1}")
        continue
    new_lines.append(line)

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
print("Done!")
