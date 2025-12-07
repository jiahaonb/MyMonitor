<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import BrightnessPanel from './components/BrightnessPanel.vue'
import InputPanel from './components/InputPanel.vue'
import PowerPanel from './components/PowerPanel.vue'
import ConfigPanel from './components/ConfigPanel.vue'
import VcpPanel from './components/VcpPanel.vue'
import { configManager } from './utils/config.js'

const currentTab = ref('brightness')
const panelOpacity = ref(0.9)
const isVisible = ref(false)
const isPinned = ref(false)
const isMaximized = ref(false)

const tabs = [
  { id: 'brightness', label: '亮度', icon: '☀️' },
  { id: 'input', label: '输入源', icon: '📺' },
  { id: 'power', label: '电源', icon: '⚡' },
  { id: 'config', label: '配置', icon: '⚙️' },
  { id: 'vcp', label: '说明', icon: '📖' }
]

// 窗口控制
const minimize = () => window.api.windowMinimize()
const togglePin = () => {
  isPinned.value = !isPinned.value
  window.api.windowToggleAlwaysOnTop(isPinned.value)
}
const toggleMaximize = () => {
  window.api.windowToggleMaximize()
  // 切换状态（下次渲染时会更新）
  setTimeout(() => {
    isMaximized.value = !isMaximized.value
  }, 100)
}
const close = () => window.api.windowClose()

// 窗口调整大小
const startResize = (direction) => {
  window.api.windowResizeStart(direction)
  
  // 监听全局 mouseup 事件来停止调整
  const stopResize = () => {
    window.api.windowResizeStop()
    window.removeEventListener('mouseup', stopResize)
  }
  window.addEventListener('mouseup', stopResize)
}

// 监听配置更新
const handleConfigUpdate = (event) => {
  if (event.detail.panelOpacity !== undefined) {
    panelOpacity.value = event.detail.panelOpacity
  }
}

// 监听标签切换请求
const handleSwitchTab = (event) => {
  if (event.detail && event.detail.tabId) {
    currentTab.value = event.detail.tabId
  }
}

// 监听显示/隐藏命令
const handleShow = () => {
  isVisible.value = true
}

const handleHide = () => {
  isVisible.value = false
  setTimeout(() => {
    window.electron?.ipcRenderer?.send('settings-window-hide-finished')
  }, 350)
}

onMounted(async () => {
  const config = await configManager.loadConfig()
  panelOpacity.value = config.panelOpacity
  window.addEventListener('config-updated', handleConfigUpdate)
  window.addEventListener('switch-tab', handleSwitchTab)
  
  window.electron?.ipcRenderer?.on('show-settings-window', handleShow)
  window.electron?.ipcRenderer?.on('hide-settings-window', handleHide)
  
  setTimeout(() => { isVisible.value = true }, 100)
})

onUnmounted(() => {
  window.removeEventListener('config-updated', handleConfigUpdate)
  window.removeEventListener('switch-tab', handleSwitchTab)
  window.electron?.ipcRenderer?.off('show-settings-window', handleShow)
  window.electron?.ipcRenderer?.off('hide-settings-window', handleHide)
})
</script>

<template>
  <div class="universe">
    <Transition name="zoom">
      <div v-if="isVisible" class="liquid-card" :style="{ background: `rgba(255, 255, 255, ${panelOpacity})` }">
        
        <!-- 窗口调整大小热区 -->
        <div class="resize-handle resize-top" @mousedown="startResize('top')"></div>
        <div class="resize-handle resize-right" @mousedown="startResize('right')"></div>
        <div class="resize-handle resize-bottom" @mousedown="startResize('bottom')"></div>
        <div class="resize-handle resize-left" @mousedown="startResize('left')"></div>
        <div class="resize-handle resize-top-left" @mousedown="startResize('top-left')"></div>
        <div class="resize-handle resize-top-right" @mousedown="startResize('top-right')"></div>
        <div class="resize-handle resize-bottom-left" @mousedown="startResize('bottom-left')"></div>
        <div class="resize-handle resize-bottom-right" @mousedown="startResize('bottom-right')"></div>
        
        <!-- macOS 风格顶部栏 -->
        <div class="top-bar">
          <!-- 左侧：水平导航标签 -->
          <div class="tabs-nav">
            <button 
              v-for="tab in tabs" 
              :key="tab.id"
              :class="['tab-item', { active: currentTab === tab.id }]"
              @click="currentTab = tab.id"
            >
              <span class="tab-icon">{{ tab.icon }}</span>
              <span class="tab-label">{{ tab.label }}</span>
            </button>
          </div>

          <!-- 右侧：窗口控制按钮 -->
          <div class="window-controls">
            <button class="control-btn" @click.stop="togglePin" :class="{ active: isPinned }" :title="isPinned ? '取消置顶' : '固定在最前'">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M9.828 3l.682.682-3.182 3.182 3.828 3.828L10 12l-4-4 3.182-3.182L8.5 4.136 4.136 8.5 6 10.364v2.828L2.672 9.844l-.672.672 4 4 .672-.672L4.828 12h2.828L10 9.656l3.844 3.844.672-.672-4-4 .672-.672 3.828-3.828.682.682v-6h-6z"/>
              </svg>
            </button>
            <button class="control-btn" @click.stop="minimize" title="最小化">
              <svg width="12" height="12" viewBox="0 0 12 12">
                <path d="M 2 6 H 10" stroke="currentColor" stroke-width="1.5"/>
              </svg>
            </button>
            <button class="control-btn close-btn" @click.stop="close" title="关闭">
              <svg width="12" height="12" viewBox="0 0 12 12">
                <path d="M 3 3 L 9 9 M 3 9 L 9 3" stroke="currentColor" stroke-width="1.5"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- 内容区域 -->
        <div class="content-wrapper">
          <BrightnessPanel v-if="currentTab === 'brightness'" />
          <InputPanel v-if="currentTab === 'input'" />
          <PowerPanel v-if="currentTab === 'power'" />
          <ConfigPanel v-if="currentTab === 'config'" />
          <VcpPanel v-if="currentTab === 'vcp'" />
        </div>
      </div>
    </Transition>
  </div>
</template>

<style>
/* 全局样式 - 确保完全透明背景 */
html, body {
  margin: 0 !important;
  padding: 0 !important;
  background: transparent !important;
  overflow: hidden !important;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  background: transparent !important;
  width: 100%;
  height: 100%;
}

/* 缩放动画 */
.zoom-enter-active,
.zoom-leave-active {
  transition: all 0.35s cubic-bezier(0.19, 1, 0.22, 1);
}

.zoom-enter-from,
.zoom-leave-to {
  opacity: 0;
  transform: scale(0.92);
}
</style>

<style scoped>
/* --- 宇宙背景层 --- */
.universe {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: transparent;
  overflow: hidden;
}

/* --- macOS 风格液态玻璃卡片：无阴影，高对比度边框 --- */
.liquid-card {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  
  /* 毛玻璃背景 */
  background: rgba(245, 245, 250, 0.80);
  backdrop-filter: blur(60px) saturate(180%);
  -webkit-backdrop-filter: blur(60px) saturate(180%);
  
  /* macOS 标准圆角 */
  border-radius: 16px;
  
  /* 高对比度边框 - 模仿 macOS，无阴影 */
  border: 0.5px solid rgba(0, 0, 0, 0.18);
  
  display: flex;
  flex-direction: column;
  color: #1d1d1f;
  overflow: hidden;
}

/* --- 窗口调整大小热区 --- */
.resize-handle {
  position: absolute;
  z-index: 100;
  -webkit-app-region: no-drag;
}

/* 四边热区 */
.resize-top {
  top: 0;
  left: 8px;
  right: 8px;
  height: 6px;
  cursor: ns-resize;
}

.resize-bottom {
  bottom: 0;
  left: 8px;
  right: 8px;
  height: 6px;
  cursor: ns-resize;
}

.resize-left {
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 6px;
  cursor: ew-resize;
}

.resize-right {
  right: 0;
  top: 8px;
  bottom: 8px;
  width: 6px;
  cursor: ew-resize;
}

/* 四角热区 */
.resize-top-left {
  top: 0;
  left: 0;
  width: 12px;
  height: 12px;
  cursor: nwse-resize;
}

.resize-top-right {
  top: 0;
  right: 0;
  width: 12px;
  height: 12px;
  cursor: nesw-resize;
}

.resize-bottom-left {
  bottom: 0;
  left: 0;
  width: 12px;
  height: 12px;
  cursor: nesw-resize;
}

.resize-bottom-right {
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  cursor: nwse-resize;
}

/* --- macOS 风格顶部栏 --- */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.10);
  background: rgba(255, 255, 255, 0.3);
  -webkit-app-region: drag;
  user-select: none;
}

/* --- 水平标签导航 --- */
.tabs-nav {
  display: flex;
  gap: 4px;
  -webkit-app-region: no-drag;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
  color: rgba(0, 0, 0, 0.65);
  font-size: 13px;
  font-weight: 500;
}

.tab-item:hover {
  background: rgba(0, 0, 0, 0.05);
  color: rgba(0, 0, 0, 0.85);
}

.tab-item.active {
  background: rgba(0, 0, 0, 0.08);
  color: #1d1d1f;
  font-weight: 600;
}

.tab-icon {
  font-size: 16px;
  line-height: 1;
}

.tab-label {
  font-size: 13px;
  letter-spacing: 0.2px;
}

/* --- 窗口控制按钮 --- */
.window-controls {
  display: flex;
  gap: 8px;
  -webkit-app-region: no-drag;
}

.control-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  color: rgba(0, 0, 0, 0.6);
}

.control-btn:hover {
  background: rgba(0, 0, 0, 0.06);
  color: rgba(0, 0, 0, 0.85);
}

.control-btn.active {
  background: rgba(102, 126, 234, 0.12);
  color: rgb(102, 126, 234);
}

.control-btn.close-btn:hover {
  background: #ff3b30;
  color: white;
}

/* --- 内容区域 --- */
.content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow-y: auto;
  min-height: 0;
  
  /* 透明滚动条 */
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}

.content-wrapper::-webkit-scrollbar {
  width: 10px;
}

.content-wrapper::-webkit-scrollbar-track {
  background: transparent;
}

.content-wrapper::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 5px;
  border: 2px solid transparent;
  background-clip: content-box;
}

.content-wrapper::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.25);
  background-clip: content-box;
}

/* --- 暗色模式 --- */
@media (prefers-color-scheme: dark) {
  .liquid-card {
    background: rgba(30, 30, 35, 0.85);
    border: 0.5px solid rgba(255, 255, 255, 0.20);
  }
  
  .top-bar {
    background: rgba(60, 60, 65, 0.3);
    border-bottom-color: rgba(255, 255, 255, 0.12);
  }
  
  .tab-item {
    color: rgba(255, 255, 255, 0.65);
  }
  
  .tab-item:hover {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.90);
  }
  
  .tab-item.active {
    background: rgba(255, 255, 255, 0.12);
    color: #f5f5f7;
  }
  
  .control-btn {
    color: rgba(255, 255, 255, 0.6);
  }
  
  .control-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.9);
  }
  
  .control-btn.close-btn:hover {
    background: #ff3b30;
    color: white;
  }
  
  .content-wrapper {
    scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
  }
  
  .content-wrapper::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    background-clip: content-box;
  }
  
  .content-wrapper::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.25);
    background-clip: content-box;
  }
}
</style>
