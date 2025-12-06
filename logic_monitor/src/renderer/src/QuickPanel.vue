<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const monitors = ref([])
const loading = ref(true) // 仅首次加载显示 loading
const isVisible = ref(false)
const isDragging = ref(false)
const activeSliderIndex = ref(null)

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
  // 限制范围 0-100
  value = Math.max(0, Math.min(100, Math.round(value)))
  
  // 立即更新本地状态，实现"跟手"效果
  if (monitors.value[index]) {
    monitors.value[index].brightness = value
  }
  await window.api.setBrightness(index, value)
}

// 滑块拖动逻辑
const startDrag = (e, index) => {
  isDragging.value = true
  activeSliderIndex.value = index
  updateSlider(e, index)
  
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)
}

const handleMouseMove = (e) => {
  if (isDragging.value && activeSliderIndex.value !== null) {
    updateSlider(e, activeSliderIndex.value)
  }
}

const handleMouseUp = () => {
  isDragging.value = false
  activeSliderIndex.value = null
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)
}

const updateSlider = (e, index) => {
  const slider = document.getElementById(`slider-${index}`)
  if (!slider) return
  
  const rect = slider.getBoundingClientRect()
  const percentage = (e.clientX - rect.left) / rect.width
  const value = Math.max(0, Math.min(100, percentage * 100))
  
  setBrightness(index, value)
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
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)
})
</script>

<template>
  <div class="quick-panel-wrapper">
    <Transition name="slide-fade">
      <div v-if="isVisible" class="quick-panel">
        <div class="panel-header">
          <h2>显示器</h2>
        </div>
        
        <div v-if="loading" class="loading">
          <div class="spinner"></div>
        </div>
        
        <div v-else class="monitors-list">
          <div v-for="(m, idx) in monitors" :key="idx" class="monitor-item">
            <div class="monitor-header">
              <span class="name">{{ m.name }}</span>
              
              <!-- 迷你快捷按钮组 -->
              <div class="mini-actions">
                <button 
                  v-for="preset in quickPresets" 
                  :key="preset"
                  :class="['mini-btn', { 'active': Math.abs(m.brightness - preset) < 5 }]"
                  @click="setBrightness(idx, preset)"
                  :title="`设置亮度为 ${preset}%`"
                >
                  {{ preset }}
                </button>
              </div>

              <span class="value">{{ m.brightness }}%</span>
            </div>
            
            <!-- macOS 风格滑块 -->
            <div 
              :id="`slider-${idx}`"
              class="macos-slider" 
              @mousedown="e => startDrag(e, idx)"
            >
              <!-- 背景层 -->
              <div class="slider-bg"></div>
              <!-- 填充层 -->
              <div class="slider-fill" :style="{ width: m.brightness + '%' }"></div>
              <!-- 图标层 -->
              <div class="slider-icon-container">
                <div class="slider-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 2c1.65 0 3 1.35 3 3s-1.35 3-3 3-3-1.35-3-3 1.35-3 3-3zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36a.996.996 0 000 1.41.996.996 0 001.41 0l1.06-1.06c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0l-1.06 1.06z"/>
                  </svg>
                </div>
              </div>
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

/* 外层包装，确保完全透明，无边距 */
.quick-panel-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: transparent;
  overflow: hidden; /* 确保圆角边界清晰 */
}

/* macOS 风格快速面板 - 配合原生模糊效果 */
.quick-panel {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  
  /* 增强背景对比度 - 配合原生 vibrancy/acrylic */
  background: rgba(238, 238, 242, 0.8); /* 提高不透明度 */
  /* CSS 模糊效果 */
  backdrop-filter: blur(40px) saturate(160%);
  -webkit-backdrop-filter: blur(40px) saturate(160%);
  
  border-radius: 16px; /* 快速面板使用较小圆角 */
  padding: 16px;
  display: flex;
  flex-direction: column;
  color: #1d1d1f;
  
  /* 增强边框和阴影以提高可见度 */
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 
    0 0 0 1px rgba(0, 0, 0, 0.08),   /* 细边框 */
    0 8px 24px rgba(0, 0, 0, 0.2),   /* 外阴影加强 */
    inset 0 1px 0 rgba(255, 255, 255, 0.8); /* 顶部高光 */
  
  transform-origin: bottom center;
}


.panel-header {
  margin-bottom: 12px;
  padding-left: 4px;
}

.panel-header h2 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  opacity: 0.6;
  letter-spacing: -0.2px;
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
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #000;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.monitors-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.monitor-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.monitor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2px;
  height: 20px;
}

.name {
  font-size: 13px;
  font-weight: 500;
  opacity: 0.8;
  letter-spacing: -0.1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px; /* 防止名称过长挤压按钮 */
}

/* 迷你快捷按钮组 */
.mini-actions {
  display: flex;
  gap: 4px;
  margin: 0 8px;
  flex: 1;
  justify-content: center;
}

.mini-btn {
  width: 28px;
  height: 18px;
  border-radius: 9px; /* 胶囊形 */
  border: 1px solid rgba(0, 0, 0, 0.05);
  background: rgba(255, 255, 255, 0.4);
  color: #333;
  font-size: 10px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;
}

.mini-btn:hover {
  background: rgba(255, 255, 255, 0.8);
  transform: scale(1.05);
}

.mini-btn.active {
  background: #333;
  color: white;
  border-color: transparent;
}

.value {
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  opacity: 0.6;
  min-width: 32px;
  text-align: right;
}

/* macOS 风格滑块 */
.macos-slider {
  position: relative;
  width: 100%;
  height: 28px;
  border-radius: 14px;
  cursor: pointer;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.05);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: transform 0.1s;
}

.macos-slider:active {
  transform: scale(0.99);
}

.slider-bg {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 1;
}

.slider-fill {
  position: absolute;
  top: 0; left: 0; bottom: 0;
  background: white;
  z-index: 2;
  transition: width 0.1s linear;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.05);
}

.slider-icon-container {
  position: absolute;
  top: 0; left: 0; bottom: 0;
  width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3;
  pointer-events: none;
}

.slider-icon {
  color: #333;
  display: flex;
  opacity: 0.7;
  mix-blend-mode: overlay; 
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .quick-panel {
    background: rgba(30, 30, 35, 0.5); /* 更暗的半透明背景 */
    color: #fff;
    box-shadow: 
      0 0 0 0.5px rgba(255, 255, 255, 0.1),
      0 4px 12px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.08);
  }
  
  .mini-btn {
    background: rgba(255, 255, 255, 0.1);
    color: #eee;
    border-color: rgba(255, 255, 255, 0.05);
  }
  
  .mini-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  .mini-btn.active {
    background: #fff;
    color: #000;
  }
  
  .macos-slider {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .slider-fill {
    background: white;
  }
  
  .slider-icon {
    color: #000;
    mix-blend-mode: screen;
  }
  
  .spinner {
    border-color: rgba(255, 255, 255, 0.1);
    border-top-color: #fff;
  }
}
</style>
