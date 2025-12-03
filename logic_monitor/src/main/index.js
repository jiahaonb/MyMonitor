import { app, shell, BrowserWindow, ipcMain, Tray, Menu, nativeImage, screen } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { execFile, spawn } from 'child_process'

let quickPanel = null // 快捷面板窗口
let settingsWindow = null // 设置窗口
let tray = null // 托盘

// 创建快捷亮度面板（左键点击托盘显示）
function createQuickPanel() {
  quickPanel = new BrowserWindow({
    width: 320,
    height: 180,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: true, // 始终在最前
    hasShadow: true,
    roundedCorners: true,
    ...(process.platform === 'darwin' ? { vibrancy: 'popover' } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  // 点击外部时隐藏窗口
  quickPanel.on('blur', () => {
    quickPanel.hide()
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
    width: 420,
    height: 650,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    resizable: false,
    skipTaskbar: true,
    hasShadow: true,
    roundedCorners: true,
    ...(process.platform === 'darwin' ? { vibrancy: 'sidebar' } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  settingsWindow.on('ready-to-show', () => {
    settingsWindow.show()
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
        } else {
          settingsWindow.show()
        }
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
      quickPanel.hide()
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
        // Windows: 托盘在底部，窗口显示在托盘图标上方
        posX = Math.round(x + trayWidth / 2 - panelWidth / 2)
        posY = Math.round(y - panelHeight - 10)
      } else {
        // Linux
        posX = Math.round(x - panelWidth / 2)
        posY = Math.round(y - panelHeight - 10)
      }

      // 确保窗口不会超出屏幕边界
      posX = Math.max(0, Math.min(posX, screenWidth - panelWidth))
      posY = Math.max(0, Math.min(posY, screenHeight - panelHeight))

      quickPanel.setPosition(posX, posY)
      quickPanel.show()
    }
  })
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))

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
  return await runPython(['set_input', index, source]);
});

