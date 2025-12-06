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
const panelOpacity = ref(0.9)

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

onMounted(async () => {
  const config = await configManager.loadConfig()
  panelOpacity.value = config.panelOpacity
  window.addEventListener('config-updated', handleConfigUpdate)
  window.addEventListener('switch-tab', handleSwitchTab)
})

onUnmounted(() => {
  window.removeEventListener('config-updated', handleConfigUpdate)
  window.removeEventListener('switch-tab', handleSwitchTab)
})
</script>

<template>
  <!-- 直接在窗口上渲染，无wrapper -->
  <div class="app-root">
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
</template>

<style>
/* 全局样式 - 移除所有默认边距和背景 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  /* 关键！在html/body层设置圆角 */
  border-radius: 12px;
}

#app {
  width: 100%;
  height: 100%;
  /* 确保app也有圆角 */
  border-radius: 12px;
  overflow: hidden;
}
</style>

<style scoped>
/* App根容器 - 直接填充整个窗口 */
.app-root {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  /* 淡雅的浅灰色背景 - Windows 11 风格 */
  background: linear-gradient(135deg, #f5f7fa 0%, #e8ebf0 100%);
  color: #1d1d1f;
  /* 添加圆角 - 配合Windows 11原生圆角 */
  border-radius: 12px;
  overflow: hidden; /* 确保内容不超出圆角 */
}

/* 顶部标题区 */
.header {
  padding: 12px 24px 16px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px);
}

.header-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

h1 {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.5px;
  color: #1d1d1f;
}

.highlight {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.status-badge {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.45);
  background: rgba(0, 0, 0, 0.04);
  padding: 3px 10px;
  border-radius: 10px;
  display: inline-block;
  font-weight: 600;
  letter-spacing: 0.3px;
  align-self: flex-start;
}

/* 主内容区 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: row;
  gap: 16px;
  min-height: 0;
  padding: 16px 24px 24px 24px;
}

/* 侧边栏 - 竖向排列，按钮横向 */
.sidebar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 140px;
  flex-shrink: 0;
}

.nav-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
  color: #374151;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 500;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.85);
  transform: translateX(2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.nav-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  transform: translateX(4px);
}

.nav-icon {
  font-size: 18px;
}

.nav-label {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.2px;
}

/* 内容区域 */
.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 12px;
  padding: 16px;
  /* 美观滚动条 */
  scrollbar-width: thin;
  scrollbar-color: rgba(102, 126, 234, 0.3) transparent;
}

/* WebKit滚动条美化 */
.content-area::-webkit-scrollbar {
  width: 8px;
}

.content-area::-webkit-scrollbar-track {
  background: transparent;
}

.content-area::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.3);
  border-radius: 4px;
}

.content-area::-webkit-scrollbar-thumb:hover {
  background: rgba(102, 126, 234, 0.5);
}

/* 暗色模式 */
@media (prefers-color-scheme: dark) {
  .app-root {
    background: linear-gradient(135deg, #1e1e1e 0%, #2a2a2a 100%);
    color: #f5f5f7;
  }
  
  .header {
    background: rgba(40, 40, 45, 0.6);
    border-bottom-color: rgba(255, 255, 255, 0.1);
  }
  
  h1 {
    color: #f5f5f7;
  }
  
  .status-badge {
    color: rgba(255, 255, 255, 0.6);
    background: rgba(255, 255, 255, 0.1);
  }
  
  .nav-item {
    background: rgba(60, 60, 65, 0.6);
    color: #e5e5e7;
    border-color: rgba(255, 255, 255, 0.08);
  }
  
  .nav-item:hover {
    background: rgba(80, 80, 85, 0.8);
  }
  
  .content-area {
    background: rgba(40, 40, 45, 0.4);
  }
}
</style>
