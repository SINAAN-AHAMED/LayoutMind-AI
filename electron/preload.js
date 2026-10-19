/**
 * Electron Preload Script
 *
 * Runs in an isolated context bridging the main process and the renderer.
 * Kept minimal — exposes only safe, non-privileged APIs to the React app.
 */

import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // Expose app version to the React UI (e.g., for an About page)
  getVersion: () => ipcRenderer.invoke('get-version'),

  // Allow the React UI to open the log file location in Explorer
  openLog: () => ipcRenderer.invoke('open-log'),

  // Flag so React code can detect it's running inside Electron
  isElectron: true,

  // Window controls for frameless window
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close:    () => ipcRenderer.send('window-close'),
})
