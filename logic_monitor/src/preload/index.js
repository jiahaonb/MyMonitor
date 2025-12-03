import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // 获取显示器列表
  getMonitors: () => ipcRenderer.invoke('get-monitors'),
  // 设置亮度
  setBrightness: (index, value) => ipcRenderer.invoke('set-brightness', index, value),
  // 设置输入源
  setInput: (index, source) => ipcRenderer.invoke('set-input', index, source)
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
