# 窗口控制和配置存储升级

## ✅ 完成的功能

### 1. 配置文件存储 📂

#### 存储位置
配置现在保存为 **JSON 文件**：

**Windows:**
```
C:\Users\<用户名>\AppData\Roaming\logic_monitor\config.json
```

**macOS:**
```
~/Library/Application Support/logic_monitor/config.json
```

**Linux:**
```
~/.config/logic_monitor/config.json
```

#### 配置文件格式
```json
{
  "panelOpacity": 0.85,
  "language": "zh-CN",
  "version": "1.0"
}
```

#### 远程修改
✅ **是的，可以远程修改！**

1. 找到配置文件位置
2. 直接编辑 JSON 文件
3. 重启应用或重新加载

**示例（PowerShell）：**
```powershell
# 查看配置文件
$configPath = "$env:APPDATA\logic_monitor\config.json"
Get-Content $configPath

# 修改透明度为 0.5
$config = Get-Content $configPath | ConvertFrom-Json
$config.panelOpacity = 0.5
$config | ConvertTo-Json | Set-Content $configPath
```

### 2. 设置窗口改进 🪟

#### 新特性
- ✅ **显示在任务栏** - 不再隐藏
- ✅ **可调整大小** - 最小 450x600，可自由缩放
- ✅ **macOS 风格标题栏** - 红/黄/绿三个控制按钮
- ✅ **拖动窗口** - 点击标题栏可拖动
- ✅ **最小化/最大化/关闭** - 完整窗口控制

#### 窗口尺寸
- 默认：500x700
- 最小：450x600
- 可调整大小：是

### 3. 自定义标题栏 🎨

#### macOS 风格控制按钮
```
🔴 红色 - 关闭窗口
🟡 黄色 - 最小化
🟢 绿色 - 最大化/还原
```

#### 特点
- 悬停显示图标
- 平滑动画
- 支持拖动窗口
- 完全自定义样式

## 📋 API 使用

### 配置管理
```javascript
import { configManager } from './utils/config.js'

// 加载配置
const config = await configManager.loadConfig()

// 获取单个值
const opacity = configManager.get('panelOpacity')

// 设置值（自动保存）
await configManager.set('panelOpacity', 0.7)

// 获取配置文件路径
const path = await configManager.getConfigPath()
console.log('配置文件位置:', path)
```

### 窗口控制
```javascript
import { ipcRenderer } from 'electron'

// 最小化
ipcRenderer.send('window-minimize')

// 最大化/还原
ipcRenderer.send('window-maximize')

// 关闭
ipcRenderer.send('window-close')
```

## 🎯 使用指南

### 打开设置窗口
右键托盘图标 → 设置

### 窗口操作
- **拖动**: 点击标题栏拖动
- **调整大小**: 拖动窗口边缘
- **最小化**: 点击黄色按钮（或任务栏）
- **最大化**: 点击绿色按钮
- **关闭**: 点击红色按钮

### 修改配置
1. 找到配置文件（见上方路径）
2. 用文本编辑器打开
3. 修改 JSON 值
4. 保存并重启应用

## 🔄 配置同步

可以通过以下方式实现远程同步：

1. **云盘同步**: 将配置文件放到云盘文件夹
2. **版本控制**: Git 管理配置文件
3. **脚本部署**: 批量修改多台设备的配置

**示例脚本：**
```bash
#!/bin/bash
# 批量更新配置文件
for server in server1 server2 server3; do
  scp config.json user@$server:~/.config/logic_monitor/
done
```

---

**现在你的应用更加灵活和易于管理了！** 🎉
