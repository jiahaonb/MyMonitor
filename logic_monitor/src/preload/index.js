import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // 显示器控制
  getMonitors: () => ipcRenderer.invoke('get-monitors'),
  setBrightness: (index, value) => ipcRenderer.invoke('set-brightness', index, value),
  setInput: (index, source) => ipcRenderer.invoke('set-input', index, source),
  getSupportedFeatures: (index) => ipcRenderer.invoke('get-supported-features', index),

  // 配置管理
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  getConfigPath: () => ipcRenderer.invoke('get-config-path'),

  // 窗口控制
  windowMinimize: () => ipcRenderer.send('window-minimize'),
  windowToggleAlwaysOnTop: (flag) => ipcRenderer.send('window-toggle-always-on-top', flag),
  windowClose: () => ipcRenderer.send('window-close')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
