<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import TitleBar from './components/TitleBar.vue'
import BrightnessPanel from './components/BrightnessPanel.vue'
import InputPanel from './components/InputPanel.vue'
import PowerPanel from './components/PowerPanel.vue'
import ConfigPanel from './components/ConfigPanel.vue'
import VcpPanel from './components/VcpPanel.vue'
import { configManager } from './utils/config.js'

const currentTab = ref('brightness')
const panelOpacity = ref(0.9) // 初始透明度90%
const isVisible = ref(false) // 控制动画显示

const tabs = [
  { id: 'brightness', label: '亮度', icon: '☀️' },
  { id: 'input', label: '输入源', icon: '📺' },
  { id: 'power', label: '电源', icon: '⚡' },
  { id: 'config', label: '配置', icon: '⚙️' },
  { id: 'vcp', label: '说明', icon: '📖' }
]

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
  // 等待动画结束后通知主进程隐藏窗口
  setTimeout(() => {
    window.electron?.ipcRenderer?.send('settings-window-hide-finished')
  }, 350)
}

onMounted(async () => {
  const config = await configManager.loadConfig()
  panelOpacity.value = config.panelOpacity
  window.addEventListener('config-updated', handleConfigUpdate)
  window.addEventListener('switch-tab', handleSwitchTab)
  
  // 监听主进程消息
  window.electron?.ipcRenderer?.on('show-settings-window', handleShow)
  window.electron?.ipcRenderer?.on('hide-settings-window', handleHide)
  
  // 稍微延迟显示以触发初始动画
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
      <!-- 主玻璃面板 -->
      <div v-if="isVisible" class="liquid-card" :style="{ background: `rgba(255, 255, 255, ${panelOpacity})` }">
        
        <!-- 自定义标题栏 -->
        <TitleBar />
        
        <!-- 顶部标题 -->
        <div class="header">
          <div class="header-text">
            <h1>显示器<span class="highlight">控制中心</span></h1>
            <p class="status-badge">已连接</p>
          </div>
        </div>

        <!-- 主要内容区 -->
        <div class="main-content">
          <!-- 左侧导航栏 -->
          <div class="sidebar">
            <button 
              v-for="tab in tabs" 
              :key="tab.id"
              :class="['nav-item', { active: currentTab === tab.id }]"
              @click="currentTab = tab.id"
            >
              <span class="nav-icon">{{ tab.icon }}</span>
              <span class="nav-label">{{ tab.label }}</span>
            </button>
          </div>

          <!-- 右侧内容区 -->
          <div class="content-area">
            <BrightnessPanel v-if="currentTab === 'brightness'" />
            <InputPanel v-if="currentTab === 'input'" />
            <PowerPanel v-if="currentTab === 'power'" />
            <ConfigPanel v-if="currentTab === 'config'" />
            <VcpPanel v-if="currentTab === 'vcp'" />
          </div>
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
}

#app {
  background: transparent !important;
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
/* --- 宇宙背景层 (Universe) --- */
.universe {
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: transparent; 
}

/* --- 核心：液态玻璃卡片 (Liquid Card) - macOS 风格 --- */
.liquid-card {
  position: relative; /* 为调整大小手柄定位 */
  width: 100vw; /* 完全匹配窗口宽度 */
  height: 100vh; /* 完全匹配窗口高度 */
  margin: 0; /* 移除所有边距 */
  backdrop-filter: blur(60px) saturate(150%); 
  -webkit-backdrop-filter: blur(60px) saturate(150%);
  
  border-radius: 24px; /* 保持圆角 */
  /* 移除边框 */
  border: none;
  
  /* 调整后的阴影：更细、更深 */
  box-shadow: 
    0 8px 24px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  
  display: flex;
  flex-direction: column;
  padding: 0; /* 移除 padding，由子元素自己控制 */
  color: #1d1d1f;
  transition: background 0.3s ease;
  overflow: hidden; /* 确保内容不超出圆角 */
}

/* --- 头部设计 --- */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 0 24px 16px 24px; /* 添加左右内边距 */
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

h1 {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.6px;
  color: #1d1d1f;
}

.highlight {
  background: linear-gradient(135deg, #A18CD1 0%, #FBC2EB 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-left: 4px;
}

.status-badge {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.45);
  background: rgba(0, 0, 0, 0.04);
  padding: 3px 10px;
  border-radius: 12px;
  display: inline-block;
  margin-top: 6px;
  font-weight: 600;
  letter-spacing: 0.3px;
}

/* --- 主要内容区 --- */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: row; /* 横向布局：左侧导航栏，右侧内容 */
  gap: 16px;
  min-height: 0; /* 重要：允许flex子元素正确计算高度 */
  padding: 0 24px 24px 24px; /* 添加内边距 */
}

/* --- 侧边栏（竖向排列，按钮横向）--- */
.sidebar {
  display: flex;
  flex-direction: column; /* 竖向排列按钮 */
  gap: 8px;
  width: 140px; /* 固定宽度以适配横向矩形按钮 */
  flex-shrink: 0;
}

.nav-item {
  display: flex;
  flex-direction: row; /* 横向排列：左emoji右汉字 */
  align-items: center;
  justify-content: center;
  gap: 8px; /* emoji和文字之间的间距 */
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.3);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
  color: #374151;
  white-space: nowrap; /* 防止文字换行 */
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.6);
  transform: translateX(2px); /* 向右移动效果 */
}

.nav-item.active {
  background: linear-gradient(135deg, #A78BFA 0%, #C084FC 100%);
  color: white;
  border: none;
  box-shadow: 0 4px 12px rgba(167, 139, 250, 0.3);
}

.nav-icon {
  font-size: 20px; /* 稍微缩小以适配横向布局 */
}

.nav-label {
  font-size: 13px; /* 稍微增大文字 */
  font-weight: 600;
  letter-spacing: 0.2px;
}

/* --- 内容区域 --- */
.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0; /* 重要：允许overflow生效 */
  overflow-y: auto; /* 启用垂直滚动 */
  /* 美观的滚动条样式 */
  scrollbar-width: thin;
  scrollbar-color: rgba(167, 139, 250, 0.3) transparent;
}

/* WebKit浏览器滚动条美化 */
.content-area::-webkit-scrollbar {
  width: 8px;
}

.content-area::-webkit-scrollbar-track {
  background: transparent;
}

.content-area::-webkit-scrollbar-thumb {
  background: rgba(167, 139, 250, 0.3);
  border-radius: 4px;
}

.content-area::-webkit-scrollbar-thumb:hover {
  background: rgba(167, 139, 250, 0.5);
}

/* --- 暗色模式 --- */
@media (prefers-color-scheme: dark) {
  .liquid-card {
    border-color: rgba(255, 255, 255, 0.12);
  }
  
  h1 {
    color: #f5f5f7;
  }
  
  .status-badge {
    color: rgba(255, 255, 255, 0.45);
    background: rgba(255, 255, 255, 0.08);
  }
  
  .nav-item {
    background: rgba(60, 60, 65, 0.4);
    color: #e5e5e7;
    border-color: rgba(255, 255, 255, 0.08);
  }
  
  .nav-item:hover {
    background: rgba(80, 80, 85, 0.6);
  }
}
</style>