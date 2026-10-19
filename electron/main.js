/**
 * LayoutMind Desktop — Electron Main Process
 *
 * Responsibilities:
 *  1. Show a splash screen immediately on launch (instant feedback)
 *  2. Start the Python FastAPI engine (softcomputing-service)
 *  3. Start the Node.js Express proxy (backend)
 *  4. Poll until both services are healthy
 *  5. Load the React UI from bundled dist/
 *  6. On window close, kill all child processes cleanly
 */

import { app, BrowserWindow, shell, ipcMain, dialog, session } from 'electron'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import path from 'path'
import { spawn } from 'child_process'
import fs from 'fs'
import http from 'http'

const require = createRequire(import.meta.url)
const treeKill = require('tree-kill')

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ─── Path resolution ──────────────────────────────────────────────────────────
// In production (packaged), extra resources land in process.resourcesPath
// In development, they are relative to this file
const IS_PACKAGED = app.isPackaged

function resourcePath(...segments) {
  if (IS_PACKAGED) {
    return path.join(process.resourcesPath, ...segments)
  }
  return path.join(__dirname, '..', ...segments)
}

const FRONTEND_DIST = resourcePath('frontend', 'dist', 'index.html')
const BACKEND_DIR   = resourcePath('backend')
const PY_DIR        = resourcePath('softcomputing-service')

// ─── Ports ────────────────────────────────────────────────────────────────────
const PY_PORT   = 8000
const NODE_PORT = 3001

// ─── Child process handles ────────────────────────────────────────────────────
let pyProc   = null
let nodeProc = null
let mainWin  = null
let splashWin = null

// ─── Logging ──────────────────────────────────────────────────────────────────
const logPath = path.join(app.getPath('userData'), 'layoutmind.log')
const logStream = fs.createWriteStream(logPath, { flags: 'a' })

if (logStream) {
  logStream.on('error', (err) => {
    console.error('Log stream error:', err)
    try {
      logStream.destroy()
    } catch (e) {}
  })
}

function closeLogStream() {
  if (logStream && !logStream.destroyed) {
    try {
      logStream.end()
    } catch (e) {}
  }
}

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`
  console.log(line)
  logStream.write(line + '\n')
}

// ─── Health check ─────────────────────────────────────────────────────────────
function checkHealth(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      resolve(res.statusCode === 200)
    })
    
    req.on('error', () => {
      resolve(false)
    })
    
    req.setTimeout(3000, () => {
      req.destroy()
      resolve(false)
    })
  })
}

async function waitForService(url, label, maxWaitMs = 60000) {
  const start = Date.now()
  log(`Waiting for ${label} at ${url} …`)
  while (Date.now() - start < maxWaitMs) {
    const ok = await checkHealth(url)
    if (ok) {
      log(`✓ ${label} is ready`)
      return true
    }
    await new Promise(r => setTimeout(r, 500))
  }
  log(`✗ ${label} did not become ready in ${maxWaitMs / 1000}s`)
  return false
}

// ─── Python service ──────────────────────────────────────────────────────────
function startPython() {
  log(`Starting Python engine in: ${PY_DIR}`)

  // Priority order:
  //  1. Project .venv (most reliable — has all required packages)
  //  2. Windows py launcher
  //  3. system python / python3
  const venvPython = path.join(__dirname, '..', '.venv', 'Scripts', 'python.exe')
  const candidates = [venvPython, 'py', 'python', 'python3']
  let pythonBin = 'python'
  const { execSync } = require('child_process')
  for (const bin of candidates) {
    try {
      execSync(`"${bin}" --version`, { stdio: 'pipe' })
      pythonBin = bin
      log(`Using Python binary: ${bin}`)
      break
    } catch { /* try next */ }
  }

  pyProc = spawn(
    pythonBin,
    ['-m', 'uvicorn', 'main_fixed:app', '--host', '127.0.0.1', '--port', String(PY_PORT), '--log-level', 'warning'],
    {
      cwd: PY_DIR,
      env: { ...process.env, PYTHONUNBUFFERED: '1' },
      windowsHide: true,
    }
  )

  pyProc.stdout.on('data', d => log(`[python] ${d.toString().trim()}`))
  pyProc.stderr.on('data', d => log(`[python:err] ${d.toString().trim()}`))
  pyProc.on('exit', (code) => log(`[python] exited with code ${code}`))
}

// ─── Node.js proxy ────────────────────────────────────────────────────────────
function startNode() {
  log(`Starting Node proxy in: ${BACKEND_DIR}`)

  // Use the node binary that ships with Electron
  const nodeBin = process.execPath  // Electron's node
  // In packaged mode we need real node, not electron
  // Check if real node is available:
  let realNode = 'node'
  try {
    const { execSync } = require('child_process')
    execSync('node --version', { stdio: 'pipe' })
    realNode = 'node'
  } catch {
    // node not on PATH — try to find it next to electron
    realNode = process.execPath
  }

  nodeProc = spawn(
    realNode,
    ['index.js'],
    {
      cwd: BACKEND_DIR,
      env: {
        ...process.env,
        PORT: String(NODE_PORT),
        SOFT_ENGINE_URL: `http://127.0.0.1:${PY_PORT}`,
      },
      windowsHide: true,
    }
  )

  nodeProc.stdout.on('data', d => log(`[node] ${d.toString().trim()}`))
  nodeProc.stderr.on('data', d => log(`[node:err] ${d.toString().trim()}`))
  nodeProc.on('exit', (code) => log(`[node] exited with code ${code}`))
}

// ─── Kill all children ────────────────────────────────────────────────────────
function killAll() {
  log('Killing child processes…')
  if (pyProc && !pyProc.killed) {
    treeKill(pyProc.pid, 'SIGTERM', (err) => {
      if (err) pyProc.kill()
    })
  }
  if (nodeProc && !nodeProc.killed) {
    treeKill(nodeProc.pid, 'SIGTERM', (err) => {
      if (err) nodeProc.kill()
    })
  }
}

// ─── Splash window ───────────────────────────────────────────────────────────
function createSplash() {
  splashWin = new BrowserWindow({
    width: 480,
    height: 320,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  })
  splashWin.loadFile(path.join(__dirname, 'splash.html'))
  splashWin.center()
}

// ─── Main window ─────────────────────────────────────────────────────────────
function createMainWindow() {
  mainWin = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    show: false,
    title: 'LayoutMind',
    icon: path.join(__dirname, 'build', 'icon.ico'),
    backgroundColor: '#FAF8F5',
    frame: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  // Open external links in system browser, not Electron
  mainWin.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWin.loadFile(FRONTEND_DIST)

  mainWin.once('ready-to-show', () => {
    if (splashWin && !splashWin.isDestroyed()) {
      splashWin.close()
      splashWin = null
    }
    mainWin.show()
    mainWin.focus()
  })

  mainWin.on('closed', () => { mainWin = null })
}

// ─── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  log('=== LayoutMind Desktop starting ===')

  // 1. Show splash immediately
  createSplash()

  // 2. Start services
  startPython()
  startNode()

  // Configure secure selective CORS bypass for local APIs since webSecurity is enabled
  if (session.defaultSession) {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      const responseHeaders = { ...details.responseHeaders }
      if (details.url.includes('127.0.0.1') || details.url.includes('localhost')) {
        responseHeaders['Access-Control-Allow-Origin'] = ['*']
        responseHeaders['Access-Control-Allow-Headers'] = ['*']
        responseHeaders['Access-Control-Allow-Methods'] = ['*']
      }
      callback({ responseHeaders })
    })
  }

  // 3. Wait for Python engine (required for layout generation)
  const pyOk = await waitForService(`http://127.0.0.1:${PY_PORT}/health`, 'Python engine', 90_000)

  if (!pyOk) {
    const choice = dialog.showMessageBoxSync({
      type: 'warning',
      title: 'LayoutMind — Service Warning',
      message: 'The AI engine (Python) did not start in time.',
      detail: `Please ensure Python and the required packages are installed.\n\nInstall with:\n  pip install -r softcomputing-service/requirements.txt\n\nLog file: ${logPath}\n\nContinue loading the app anyway?`,
      buttons: ['Continue Anyway', 'Quit'],
      defaultId: 0,
      cancelId: 1,
    })
    if (choice === 1) {
      killAll()
      app.quit()
      return
    }
  }

  // 4. Wait for Node proxy (quicker, less critical — UI can retry)
  await waitForService(`http://127.0.0.1:${NODE_PORT}/api/health`, 'Node proxy', 20_000)

  // 5. Open main window
  createMainWindow()
})

app.on('window-all-closed', () => {
  killAll()
  app.quit()
})

app.on('before-quit', () => {
  killAll()
  closeLogStream()
})

app.on('will-quit', () => {
  closeLogStream()
})

process.on('SIGINT', () => {
  killAll()
  closeLogStream()
  process.exit(0)
})

process.on('SIGTERM', () => {
  killAll()
  closeLogStream()
  process.exit(0)
})

process.on('uncaughtException', (err) => {
  log(`Uncaught Exception: ${err.message}\n${err.stack}`)
  killAll()
  if (logStream && !logStream.destroyed) {
    try {
      logStream.destroy()
    } catch (e) {}
  }
  process.exit(1)
})

// Prevent multiple instances
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWin) {
      if (mainWin.isMinimized()) mainWin.restore()
      mainWin.focus()
    }
  })
}

// IPC: open log file location
ipcMain.handle('open-log', () => shell.showItemInFolder(logPath))

// IPC: get application version
ipcMain.handle('get-version', () => {
  try {
    return app.getVersion()
  } catch (err) {
    log(`Error getting app version: ${err.message}`)
    return '1.0.0'
  }
})

// IPC: frameless window controls
ipcMain.on('window-minimize', () => { if (mainWin) mainWin.minimize() })
ipcMain.on('window-maximize', () => {
  if (mainWin) {
    if (mainWin.isMaximized()) mainWin.unmaximize()
    else mainWin.maximize()
  }
})
ipcMain.on('window-close', () => { if (mainWin) mainWin.close() })

