import { app, shell, BrowserWindow, ipcMain, Tray, Menu, nativeImage, screen } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { execFile, spawn } from 'child_process'
import fs from 'fs'

let quickPanel = null // 快捷面板窗口
let settingsWindow = null // 设置窗口
let tray = null // 托盘
let lastHideTime = 0 // 上次隐藏时间
let needsMonitorRefresh = 0 // 输入源切换后需要刷新显示器列表的标志 (0=不需要, 1=需要)

// 配置文件路径
const configPath = join(app.getPath('userData'), 'config.json')

// 读取配置
function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf-8')
      return JSON.parse(data)
    }
  } catch (e) {
    console.error('读取配置失败:', e)
  }
  return null
}

// 保存配置
function saveConfig(config) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')
    return true
  } catch (e) {
    console.error('保存配置失败:', e)
    return false
  }
}

// 创建快捷亮度面板（左键点击托盘显示）
function createQuickPanel() {
  quickPanel = new BrowserWindow({
    width: 320,
    height: 340,  // 增加高度以适应 Liquid Glass 布局
    show: false,
    frame: false,
    transparent: true, // 必须为true才能完全透明
    backgroundColor: '#00000000',
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    hasShadow: true,
    roundedCorners: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  // macOS 使用 vibrancy
  if (process.platform === 'darwin') {
    quickPanel.setVibrancy('popover')
  }

  // 点击外部时隐藏窗口
  quickPanel.on('blur', () => {
    if (quickPanel && quickPanel.isVisible()) {
      quickPanel.webContents.send('hide-quick-panel')
    }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    quickPanel.loadURL(process.env['ELECTRON_RENDERER_URL'] + '/quick.html')
  } else {
    quickPanel.loadFile(join(__dirname, '../renderer/quick.html'))
  }

  return quickPanel
}

// 创建设置窗口（右键菜单"设置"打开）
function createSettingsWindow() {
  settingsWindow = new BrowserWindow({
    width: 850,
    height: 620,
    minWidth: 850,
    minHeight: 620,
    show: false,
    frame: false, // 无边框
    transparent: true,
    backgroundColor: '#00000000',
    resizable: true,
    skipTaskbar: false,
    hasShadow: true, // 启用系统阴影 - Windows 11会自动添加圆角
    roundedCorners: true, // Windows 11 原生圆角支持
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  // macOS 使用 vibrancy
  if (process.platform === 'darwin') {
    settingsWindow.setVibrancy('under-window')
  }

  // 窗口ready后设置透明背景
  settingsWindow.on('ready-to-show', () => {
    settingsWindow.setBackgroundColor('#00000000')
    settingsWindow.show()
    settingsWindow.focus()
  })

  settingsWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    settingsWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    settingsWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return settingsWindow
}

// 创建托盘
function createTray() {
  const trayIcon = nativeImage.createFromPath(join(__dirname, '../../resources/icon.png'))
  tray = new Tray(trayIcon)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '设置',
      click: () => {
        if (!settingsWindow || settingsWindow.isDestroyed()) {
          createSettingsWindow()
        }
        // 显示窗口并播放动画
        settingsWindow.show()
        settingsWindow.focus()
        settingsWindow.webContents.send('show-settings-window')
      }
    },
    { type: 'separator' },
    { label: '退出', click: () => { app.quit() } }
  ])

  tray.setToolTip('显示器控制中心')
  tray.setContextMenu(contextMenu)

  // 左键点击显示/隐藏快捷面板
  tray.on('click', (event, bounds) => {
    if (!quickPanel || quickPanel.isDestroyed()) {
      createQuickPanel()
    }

    if (quickPanel.isVisible()) {
      // 发送隐藏指令，等待动画结束
      quickPanel.webContents.send('hide-quick-panel')
    } else {
      // 计算窗口位置
      const { x, y, width: trayWidth, height: trayHeight } = bounds
      const { width: panelWidth, height: panelHeight } = quickPanel.getBounds()
      const primaryDisplay = screen.getPrimaryDisplay()
      const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize

      let posX, posY

      if (process.platform === 'darwin') {
        // macOS: 托盘在顶部，窗口显示在托盘图标下方
        posX = Math.round(x + trayWidth / 2 - panelWidth / 2)
        posY = Math.round(y + trayHeight + 5)
      } else if (process.platform === 'win32') {
        // Windows: 托盘在底部，窗口紧贴任务栏上方
        posX = Math.round(x + trayWidth / 2 - panelWidth / 2)
        posY = Math.round(y - panelHeight - 4)  // 减少间距，更贴近任务栏
      } else {
        // Linux
        posX = Math.round(x - panelWidth / 2)
        posY = Math.round(y - panelHeight - 4)
      }

      // 确保窗口不会超出屏幕边界
      posX = Math.max(0, Math.min(posX, screenWidth - panelWidth))
      posY = Math.max(0, Math.min(posY, screenHeight - panelHeight))

      quickPanel.setPosition(posX, posY)
      quickPanel.show()
      // 发送显示指令
      quickPanel.webContents.send('show-quick-panel')
    }
  })
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))

  // 配置文件 IPC 处理
  ipcMain.handle('get-config', () => {
    return loadConfig()
  })

  ipcMain.handle('save-config', (event, config) => {
    return saveConfig(config)
  })

  ipcMain.handle('get-config-path', () => {
    return configPath
  })

  // 窗口控制 IPC 处理
  ipcMain.on('window-minimize', () => {
    if (settingsWindow) settingsWindow.minimize()
  })

  ipcMain.on('window-toggle-always-on-top', (event, flag) => {
    if (settingsWindow) {
      settingsWindow.setAlwaysOnTop(flag)
    }
  })

  ipcMain.on('window-toggle-maximize', () => {
    if (settingsWindow) {
      if (settingsWindow.isMaximized()) {
        settingsWindow.unmaximize()
      } else {
        settingsWindow.maximize()
      }
    }
  })

  // 拦截关闭操作，先播放动画
  ipcMain.on('window-close', () => {
    if (settingsWindow) {
      settingsWindow.webContents.send('hide-settings-window')
    }
  })

  // 动画结束后真正隐藏/关闭
  ipcMain.on('settings-window-hide-finished', () => {
    if (settingsWindow) {
      settingsWindow.hide() // 或者 .close()，取决于需求，这里用 hide 保持后台运行
    }
  })

  ipcMain.on('quick-panel-hide-finished', () => {
    if (quickPanel) {
      quickPanel.hide()
    }
  })

  // 处理窗口调整大小
  let resizeInterval = null
  ipcMain.on('window-resize-start', (event, direction) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return

    const startCursor = screen.getCursorScreenPoint()
    const startBounds = win.getBounds()
    const minWidth = 850
    const minHeight = 620

    // 清除旧的定时器
    if (resizeInterval) clearInterval(resizeInterval)

    resizeInterval = setInterval(() => {
      const currentCursor = screen.getCursorScreenPoint()
      const deltaX = currentCursor.x - startCursor.x
      const deltaY = currentCursor.y - startCursor.y

      let newBounds = { ...startBounds }

      // 处理右边调整
      if (direction.includes('right')) {
        newBounds.width = Math.max(minWidth, startBounds.width + deltaX)
      }

      // 处理左边调整（需要同时调整位置和宽度）
      if (direction.includes('left')) {
        const potentialWidth = startBounds.width - deltaX
        if (potentialWidth >= minWidth) {
          // 只有在不会小于最小宽度时才移动位置
          newBounds.x = startBounds.x + deltaX
          newBounds.width = potentialWidth
        } else {
          // 达到最小宽度，锁定在最小宽度，调整x位置使其保持在右边缘
          newBounds.width = minWidth
          newBounds.x = startBounds.x + startBounds.width - minWidth
        }
      }

      // 处理底部调整
      if (direction.includes('bottom')) {
        newBounds.height = Math.max(minHeight, startBounds.height + deltaY)
      }

      // 处理顶部调整（需要同时调整位置和高度）
      if (direction.includes('top')) {
        const potentialHeight = startBounds.height - deltaY
        if (potentialHeight >= minHeight) {
          // 只有在不会小于最小高度时才移动位置
          newBounds.y = startBounds.y + deltaY
          newBounds.height = potentialHeight
        } else {
          // 达到最小高度，锁定在最小高度，调整y位置使其保持在底边缘
          newBounds.height = minHeight
          newBounds.y = startBounds.y + startBounds.height - minHeight
        }
      }

      win.setBounds(newBounds)
    }, 1000 / 60) // 60fps
  })

  ipcMain.on('window-resize-stop', () => {
    if (resizeInterval) {
      clearInterval(resizeInterval)
      resizeInterval = null
    }
  })

  // 创建快捷面板和托盘
  createQuickPanel()
  createTray()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      createQuickPanel()
    }
  })
})

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})


/**
 * 与python通信---------------
 */


// 定义 Python 脚本的路径
// 开发环境：在 resources/python/api.py
// 生产环境：打包后路径会有变化，这里我们先写死开发路径，后面教你处理打包
const scriptPath = join(__dirname, '../../resources/python/api.py')

// 一个通用的执行 Python 的函数
function runPython(args) {
  return new Promise((resolve, reject) => {
    // 这里的 'python' 依赖于你启动 npm run dev 的终端里是否有 python 环境
    // 如果你在 VSCode 的 Conda 终端里运行，它会自动找到 Conda 的 python
    const pyProcess = spawn('python', [scriptPath, ...args]);

    let dataString = '';
    let errorString = '';

    pyProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });

    pyProcess.stderr.on('data', (data) => {
      errorString += data.toString();
    });

    pyProcess.on('close', (code) => {
      if (code !== 0) {
        reject(`Python process exited with code ${code}: ${errorString}`);
        return;
      }
      try {
        // 解析 Python 返回的 JSON
        const result = JSON.parse(dataString);
        resolve(result);
      } catch (e) {
        reject(`Failed to parse JSON: ${dataString}`);
      }
    });
  });
}

// 监听渲染进程的请求
ipcMain.handle('get-monitors', async () => {
  return await runPython([]);
});

ipcMain.handle('set-brightness', async (event, index, value) => {
  return await runPython(['set_brightness', index, value]);
});

ipcMain.handle('set-input', async (event, index, source) => {
  // 切换输入源后，设置需要刷新标志
  needsMonitorRefresh = 1;
  return await runPython(['set_input', index, source]);
});

ipcMain.handle('get-supported-features', async (event, index) => {
  return await runPython(['get_supported_features', index]);
});

ipcMain.handle('set-power', async (event, index, mode) => {
  return await runPython(['set_power', index, mode]);
});

// 检查是否需要刷新显示器列表
ipcMain.handle('check-needs-refresh', async () => {
  return needsMonitorRefresh;
});

// 重置刷新标志
ipcMain.handle('reset-refresh-flag', async () => {
  needsMonitorRefresh = 0;
  return true;
});
