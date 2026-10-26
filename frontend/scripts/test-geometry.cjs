const {spawnSync}=require('node:child_process')
const path=require('node:path')
const result=spawnSync(process.execPath,[path.join(__dirname,'../tests/run.mjs')],{cwd:path.join(__dirname,'..'),stdio:'inherit'})
process.exit(result.status??1)
