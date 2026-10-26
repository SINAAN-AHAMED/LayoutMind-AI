import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
const files=['editor.test.ts','scene.test.tsx','api.test.ts','exports.test.ts','pets.test.ts','companions.test.tsx','doors-contrast.test.tsx','camera.test.tsx']
const result=spawnSync(process.execPath,['--import','tsx','--test',...files.map(f=>fileURLToPath(new URL(f,import.meta.url)))],{
 stdio:'inherit',env:{...process.env,TSX_TSCONFIG_PATH:fileURLToPath(new URL('../tsconfig.app.json',import.meta.url))}
})
process.exit(result.status??1)
