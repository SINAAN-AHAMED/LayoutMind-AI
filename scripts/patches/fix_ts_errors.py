"""Fix the 3 TypeScript errors in Room.tsx after canvas texture injection"""
import sys, re
sys.stdout.reconfigure(encoding='utf-8')

path = r'frontend\src\three\Room.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: useWallCanvasTexture uses React.useMemo but React may not be imported.
# Change to use useMemo directly (which IS imported from react in R3F files)
content = content.replace(
    '  return React.useMemo(() => {',
    '  return useMemo(() => {'
)
print("React.useMemo -> useMemo" if 'return useMemo(() => {' in content else "WARNING: useMemo fix not applied")

# Check if useMemo is imported
if 'import { useMemo' not in content and "import React" not in content:
    # Find react import
    react_import = re.search(r"import \{([^}]+)\} from 'react'", content)
    if react_import:
        old_imp = react_import.group(0)
        new_imp = old_imp.replace('} from', ', useMemo } from') if 'useMemo' not in old_imp else old_imp
        # Actually just ensure useMemo is there
        if 'useMemo' not in old_imp:
            content = content.replace(old_imp, new_imp)
            print(f"Added useMemo to react import")
    else:
        # Add useMemo import before first line
        content = "import { useMemo } from 'react'\n" + content
        print("Added useMemo import")
else:
    print("useMemo already available")

def count_occurrences_cleaned(section_text, symbol, decl_pattern):
    # Locate and extract the declaration line to exclude it from count
    decl_match = re.search(decl_pattern, section_text)
    if not decl_match:
        return -1, None # Declaration not found
    
    decl_line = decl_match.group(0)
    
    # Remove comments
    # Single-line comments
    text_no_comments = re.sub(r'//.*', '', section_text)
    # Multi-line comments
    text_no_comments = re.sub(r'/\*.*?\*/', '', text_no_comments, flags=re.DOTALL)
    
    # Remove string literals
    # Single quote strings
    text_no_strings = re.sub(r"'[^']*'", '', text_no_comments)
    # Double quote strings
    text_no_strings = re.sub(r'"[^"]*"', '', text_no_strings)
    # Backtick strings
    text_no_strings = re.sub(r'`[^`]*`', '', text_no_strings, flags=re.DOTALL)
    
    # Clean the declaration line similarly to count its internal occurrences
    decl_clean = re.sub(r'//.*', '', decl_line)
    decl_clean = re.sub(r'/\*.*?\*/', '', decl_clean)
    decl_clean = re.sub(r"'[^']*'", '', decl_clean)
    decl_clean = re.sub(r'"[^"]*"', '', decl_clean)
    decl_clean = re.sub(r'`[^`]*`', '', decl_clean)
    
    all_occurrences = len(re.findall(rf'\b{symbol}\b', text_no_strings))
    decl_occurrences = len(re.findall(rf'\b{symbol}\b', decl_clean))
    
    cleaned_count = max(0, all_occurrences - decl_occurrences)
    return cleaned_count, decl_line

# Fix 2: Remove unused 'wallColor' and 'isStone' in WallDecorations (after removing geometry blocks)
wd_start = content.find('function WallDecorations(')
wd_end   = content.find('\n// ====', wd_start + 10)

if wd_start > 0 and wd_end > wd_start:
    wd_section = content[wd_start:wd_end]
    
    # 1. wallColor
    wallcolor_pattern = r'const\s+wallColor\s*=\s*useStudioStore\([^)]*\)'
    wc_count, wc_decl = count_occurrences_cleaned(wd_section, 'wallColor', wallcolor_pattern)
    print(f"wallColor used {wc_count} times in WallDecorations (excluding declaration)")
    if wc_count == 0 and wc_decl:
        content = content.replace(wc_decl + '\n', '', 1)
        content = content.replace(wc_decl, '', 1) # fallback without newline
        print("Removed unused wallColor from WallDecorations")
        
    # Recalculate section boundaries in case content size changed
    wd_start = content.find('function WallDecorations(')
    wd_end   = content.find('\n// ====', wd_start + 10)
    wd_section = content[wd_start:wd_end]
    
    # 2. isStone
    isstone_pattern = r"const\s+isStone\s*=\s*wallMaterial\s*==+\s*['\"]Stone['\"]"
    is_count, is_decl = count_occurrences_cleaned(wd_section, 'isStone', isstone_pattern)
    print(f"isStone used {is_count} times in WallDecorations (excluding declaration)")
    if is_count == 0 and is_decl:
        content = content.replace(is_decl + '\n', '', 1)
        content = content.replace(is_decl, '', 1) # fallback
        print("Removed unused isStone from WallDecorations")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print(f"Room.tsx saved ({len(content)} chars)")
