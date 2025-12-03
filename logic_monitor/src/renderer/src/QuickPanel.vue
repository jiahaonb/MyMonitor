<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const monitors = ref([])
const loading = ref(true) // 仅首次加载显示 loading
const isVisible = ref(false)

// 快捷亮度预设值
const quickPresets = [0, 25, 50, 100]

const fetchMonitors = async (silent = false) => {
  if (!silent && monitors.value.length === 0) {
    loading.value = true
  }
  
  try {
    const res = await window.api.getMonitors()
    if (res.status === 'success') {
      monitors.value = res.data
    }
  } catch (err) { 
    console.error(err) 
  } finally { 
    loading.value = false 
  }
}

const setBrightness = async (index, value) => {
  // 立即更新本地状态，实现"跟手"效果
  if (monitors.value[index]) {
    monitors.value[index].brightness = parseInt(value)
  }
  await window.api.setBrightness(index, parseInt(value))
}

// 监听显示/隐藏命令
const handleShow = () => {
  isVisible.value = true
  // 静默刷新数据，不显示 loading
  fetchMonitors(true)
}

const handleHide = () => {
  isVisible.value = false
  // 等待动画结束后通知主进程隐藏窗口
  setTimeout(() => {
    window.electron?.ipcRenderer?.send('quick-panel-hide-finished')
  }, 300) // 对应 CSS transition 时间
}

onMounted(() => {
  // 初始加载
  fetchMonitors()
  
  // 监听主进程消息
  window.electron?.ipcRenderer?.on('show-quick-panel', handleShow)
  window.electron?.ipcRenderer?.on('hide-quick-panel', handleHide)
  
  // 稍微延迟显示以触发初始动画（如果是首次加载）
  setTimeout(() => { isVisible.value = true }, 100)
})

onUnmounted(() => {
  window.electron?.ipcRenderer?.off('show-quick-panel', handleShow)
  window.electron?.ipcRenderer?.off('hide-quick-panel', handleHide)
})
</script>

<template>
  <div class="quick-panel-wrapper">
    <Transition name="slide-fade">
      <div v-if="isVisible" class="quick-panel">
        <div class="panel-header">
          <span class="icon">☀️</span>
          <h2>亮度</h2>
        </div>
        
        <div v-if="loading" class="loading">
          <div class="spinner"></div>
        </div>
        
        <div v-else class="monitors-list">
          <div v-for="(m, idx) in monitors" :key="idx" class="monitor-item">
            <div class="monitor-info">
              <span class="monitor-name">{{ m.name }}</span>
              <span class="brightness-value">{{ m.brightness }}%</span>
            </div>
            
            <!-- 快捷按钮 -->
            <div class="quick-buttons">
              <button 
                v-for="preset in quickPresets" 
                :key="preset"
                :class="['quick-btn', { 'active': m.brightness === preset }]"
                @click="setBrightness(idx, preset)"
              >
                {{ preset }}%
              </button>
            </div>
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
</style>

<style scoped>
/* 动画样式 */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(15px) scale(0.96);
}

/* 外层包装，确保完全透明 */
.quick-panel-wrapper {
  width: 100%;
  height: 100%;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px; /* 添加内边距防止圆角被裁切 */
}

.quick-panel {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(60px) saturate(150%);
  -webkit-backdrop-filter: blur(60px) saturate(150%);
  border-radius: 16px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  color: #1d1d1f;
  box-shadow: 
    inset 0 0 0 1px rgba(255, 255, 255, 0.6); /* 仅保留内部高光边框，移除外部阴影 */
  border: 1px solid rgba(255, 255, 255, 0.3);
  transform-origin: bottom center; /* 动画原点 */
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.panel-header .icon {
  font-size: 18px;
  opacity: 0.8;
}

.panel-header h2 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.3px;
  opacity: 0.8;
}

.loading {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(139, 92, 246, 0.2);
  border-radius: 50%;
  border-top-color: #8B5CF6;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.monitors-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.monitor-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.monitor-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.monitor-name {
  flex: 1;
  font-size: 12px;
  font-weight: 500;
  opacity: 0.6;
  letter-spacing: -0.1px;
}

.brightness-value {
  font-size: 13px;
  font-weight: 700;
  color: #8B5CF6;
  min-width: 40px;
  text-align: right;
  letter-spacing: -0.3px;
}

/* 快捷按钮 */
.quick-buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.quick-btn {
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  height: 36px;
  color: #374151;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
  letter-spacing: -0.2px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quick-btn:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.quick-btn.active {
  background: linear-gradient(135deg, #A78BFA 0%, #C084FC 100%);
  color: white;
  border: none;
  box-shadow: 
    0 4px 12px rgba(167, 139, 250, 0.3),
    0 2px 6px rgba(167, 139, 250, 0.2);
  font-weight: 600;
}

.quick-btn:active {
  transform: scale(0.96);
}

/* 暗色模式 */
@media (prefers-color-scheme: dark) {
  .quick-panel {
    background: rgba(40, 40, 45, 0.9);
    color: #f5f5f7;
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .monitor-name {
    opacity: 0.7;
  }
  
  .quick-btn {
    background: rgba(60, 60, 65, 0.6);
    color: #e5e5e7;
    border-color: rgba(255, 255, 255, 0.08);
  }
  
  .quick-btn:hover {
    background: rgba(80, 80, 85, 0.9);
  }
}
</style>
