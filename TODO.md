# Upgrade to Prompt-Only NLP Interior Design System

## Current Status

- [x] Analyzed full codebase
- [x] Confirmed plan with user

## Implementation Steps (Approved Plan)

### Phase 1: NLP Parser (main.py)

- [x] Install spaCy deps (execute commands)
- [x] Add parse_prompt() function w/ examples
- [x] Update OptimizeRequest to prompt-only
- [x] Integrate: extracted = parse_prompt(req.prompt)
- [ ] Test standalone

### Phase 2: Schema/API Updates

- [ ] Update types/layout.ts (add NLPExtracted, slim OptimizeRequest)
- [ ] Update api.ts Zod
- [ ] Update backend/index.js Zod

### Phase 2: Schema/API Updates

- [ ] Update types/layout.ts (add NLPExtracted, slim OptimizeRequest)
- [ ] Update api.ts Zod
- [ ] Update backend/index.js Zod

### Phase 3: UI Simplify (Prompt-Only)

- [x] PromptStudioPage.tsx: textarea + generate only (+ color sliders)
- [x] useStudioStore.ts: prompt only
- [ ] WorkspacePage.tsx: minor

### Phase 4: GA Enhancements

- [ ] Add prompt_match_score to fitness
- [ ] Logical rules (TV-sofa facing)

### Phase 5: 3D Polish

- [ ] Real GLTF models
- [ ] Decouple style colors

## Testing

- [ ] curl engine /optimize
- [ ] Full e2e npm dev + uvicorn
- [ ] Defaults/edge cases

Next: Phase 1 Step 1 (spaCy install + parser)
