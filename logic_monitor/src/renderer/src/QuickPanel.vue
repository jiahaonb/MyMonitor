<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const monitors = ref([])
const loading = ref(true)
const isVisible = ref(false)

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
  value = Math.max(0, Math.min(100, Math.round(value)))
  
  if (monitors.value[index]) {
    monitors.value[index].brightness = value
  }
  await window.api.setBrightness(index, value)
}

// 切换输入源
const toggleInputSource = () => {
  console.log('Toggle Input Source')
}

// 切换电源状态
const togglePower = () => {
  console.log('Toggle Power')
}

// 监听显示/隐藏命令
const handleShow = () => {
  isVisible.value = true
  fetchMonitors(true)
}

const handleHide = () => {
  isVisible.value = false
  setTimeout(() => {
    window.electron?.ipcRenderer?.send('quick-panel-hide-finished')
  }, 200)
}

onMounted(() => {
  fetchMonitors()
  window.electron?.ipcRenderer?.on('show-quick-panel', handleShow)
  window.electron?.ipcRenderer?.on('hide-quick-panel', handleHide)
  setTimeout(() => { isVisible.value = true }, 50)
})

onUnmounted(() => {
  window.electron?.ipcRenderer?.off('show-quick-panel', handleShow)
  window.electron?.ipcRenderer?.off('hide-quick-panel', handleHide)
})
</script>

<template>
  <!-- 完全透明的根容器 -->
  <div class="panel-root">
    <Transition name="slide-up">
      <div v-if="isVisible" class="control-center">
        
        <!-- 加载中 -->
        <div v-if="loading" class="loading">
          <div class="spinner"></div>
        </div>
        
        <!-- 控制中心内容 -->
        <div v-else class="control-content">
          
          <!-- 顶部功能按钮组 -->
          <div class="control-grid">
            <!-- 输入源按钮 -->
            <button class="control-card" @click="toggleInputSource">
              <div class="card-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z"/>
                </svg>
              </div>
              <div class="card-label">输入源</div>
            </button>
            
            <!-- 电源按钮 -->
            <button class="control-card" @click="togglePower">
              <div class="card-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z"/>
                </svg>
              </div>
              <div class="card-label">电源</div>
            </button>
          </div>
          
          <!-- 亮度控制 -->
          <div v-for="(m, idx) in monitors" :key="idx" class="brightness-section">
            <div class="section-header">
              <span class="section-title">{{ m.name }}</span>
              <span class="section-value">{{ m.brightness }}%</span>
            </div>
            
            <!-- 亮度滑块 -->
            <div class="brightness-slider-container">
              <div class="slider-icon left">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </div>
              
              <input 
                type="range" 
                class="brightness-slider"
                min="0" 
                max="100" 
                :value="m.brightness" 
                @input="e => setBrightness(idx, e.target.value)"
              />
              
              <div class="slider-icon right">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z"/>
                </svg>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </Transition>
  </div>
</template>

<style>
/* 全局样式 - 确保完全透明 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: transparent !important;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif;
}

#app {
  width: 100%;
  height: 100%;
  background: transparent !important;
}
</style>

<style scoped>
/* 完全透明的根容器 - 无边距 */
.panel-root {
  width: 100%;
  height: 100%;
  background: transparent;
  position: relative;
  display: flex;
  align-items: flex-end;
}

/* Windows 11 风格：从底部滑入动画 */
.slide-up-enter-active {
  animation: slideUpIn 0.25s cubic-bezier(0, 0, 0, 1);
}

.slide-up-leave-active {
  animation: slideUpOut 0.2s cubic-bezier(0.33, 0, 1, 1);
}

@keyframes slideUpIn {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUpOut {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(30px);
  }
}

/* macOS 风格毛玻璃卡片 */
.control-center {
  width: 100%;
  
  /* 适中的透明度 + 强模糊 = 毛玻璃感 */
  background: rgba(248, 248, 250, 0.7) !important;
  backdrop-filter: blur(60px) saturate(180%);
  -webkit-backdrop-filter: blur(60px) saturate(180%);
  
  /* 圆角卡片 */
  border-radius: 18px;
  padding: 16px;
  
  /* macOS 风格边框 - 在白色背景下清晰可见！ */
  border: 0.5px solid rgba(0, 0, 0, 0.12);
  
  /* 多层阴影 - 增强立体感和对比度 */
  box-shadow: 
    0 0 0 1px rgba(255, 255, 255, 0.5) inset,  /* 内部白色高光 */
    0 0 0 0.5px rgba(0, 0, 0, 0.04),           /* 最细外边框 */
    0 8px 32px rgba(0, 0, 0, 0.16),            /* 主阴影 */
    0 2px 8px rgba(0, 0, 0, 0.08);             /* 近处阴影 */
}

.loading {
  padding: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: rgba(0, 0, 0, 0.7);
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.control-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 功能按钮网格 */
.control-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

/* 横向矩形控制按钮 */
.control-card {
  height: 50px; /* 固定高度，横向矩形 */
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  
  /* 明显的边框 */
  border: 0.5px solid rgba(0, 0, 0, 0.12);
  border-radius: 12px;
  padding: 10px 12px;
  
  display: flex;
  flex-direction: row; /* 横向排列：图标在左，文字在右 */
  align-items: center;
  gap: 8px;
  cursor: pointer;
  
  transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  
  /* 立体阴影 */
  box-shadow: 
    0 0 0 1px rgba(255, 255, 255, 0.6) inset,
    0 2px 8px rgba(0, 0, 0, 0.08),
    0 1px 3px rgba(0, 0, 0, 0.06);
}

.control-card:hover {
  background: rgba(255, 255, 255, 0.7);
  transform: translateY(-1px) scale(1.01);
  border-color: rgba(0, 0, 0, 0.15);
  box-shadow: 
    0 0 0 1px rgba(255, 255, 255, 0.7) inset,
    0 4px 12px rgba(0, 0, 0, 0.12),
    0 2px 6px rgba(0, 0, 0, 0.08);
}

.control-card:active {
  transform: translateY(0) scale(0.99);
  background: rgba(255, 255, 255, 0.4);
}

.card-icon {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(0, 0, 0, 0.7);
}

.card-label {
  font-size: 13px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.75);
  letter-spacing: -0.1px;
  flex: 1;
}

/* 亮度控制区域 */
.brightness-section {
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  
  border: 0.5px solid rgba(0, 0, 0, 0.12);
  border-radius: 12px;
  padding: 12px 14px;
  
  box-shadow: 
    0 0 0 1px rgba(255, 255, 255, 0.6) inset,
    0 2px 8px rgba(0, 0, 0, 0.08),
    0 1px 3px rgba(0, 0, 0, 0.06);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.7);
  letter-spacing: -0.1px;
}

.section-value {
  font-size: 12px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.5);
  font-variant-numeric: tabular-nums;
}

/* macOS 风格亮度滑块容器 */
.brightness-slider-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.slider-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(0, 0, 0, 0.45);
  transition: color 0.2s ease;
}

.slider-icon.right {
  color: rgba(0, 0, 0, 0.6);
}

/* macOS Big Sur/Monterey 风格精致滑块 */
.brightness-slider {
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  
  /* 渐变轨道背景 */
  background: linear-gradient(to right, 
    rgba(0, 0, 0, 0.08) 0%,
    rgba(0, 0, 0, 0.12) 100%);
  
  border-radius: 2px;
  outline: none;
  cursor: pointer;
  position: relative;
  
  /* 内嵌阴影 - 凹陷效果 */
  box-shadow: 
    inset 0 0.5px 1px rgba(0, 0, 0, 0.2),
    inset 0 -0.5px 0 rgba(255, 255, 255, 0.5);
}

/* macOS 风格圆形手柄 */
.brightness-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  
  /* 纯白渐变 */
  background: linear-gradient(180deg, 
    #ffffff 0%, 
    #f8f8f8 100%);
  
  cursor: pointer;
  
  /* macOS 风格精致阴影 */
  box-shadow: 
    0 0.5px 1px rgba(0, 0, 0, 0.12),        /* 最细轮廓 */
    0 1px 3px rgba(0, 0, 0, 0.16),           /* 近处阴影 */
    0 2px 6px rgba(0, 0, 0, 0.12),           /* 主阴影 */
    inset 0 0.5px 0 rgba(255, 255, 255, 1), /* 顶部高光 */
    inset 0 -0.5px 0 rgba(0, 0, 0, 0.03);   /* 底部微阴影 */
  
  /* 极细边框 */
  border: 0.5px solid rgba(0, 0, 0, 0.06);
  
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 悬停时轻微放大 */
.brightness-slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 
    0 0.5px 1px rgba(0, 0, 0, 0.14),
    0 2px 4px rgba(0, 0, 0, 0.18),
    0 3px 8px rgba(0, 0, 0, 0.14),
    inset 0 0.5px 0 rgba(255, 255, 255, 1),
    inset 0 -0.5px 0 rgba(0, 0, 0, 0.04);
}

/* 拖动时稍微缩小 */
.brightness-slider::-webkit-slider-thumb:active {
  transform: scale(1.05);
  box-shadow: 
    0 0.5px 1px rgba(0, 0, 0, 0.16),
    0 1px 2px rgba(0, 0, 0, 0.2),
    inset 0 0.5px 1px rgba(0, 0, 0, 0.08);
}

/* 暗色模式 */
@media (prefers-color-scheme: dark) {
  .control-center {
    background: rgba(30, 30, 35, 0.75) !important;
    border-color: rgba(255, 255, 255, 0.15);
    box-shadow: 
      0 0 0 1px rgba(255, 255, 255, 0.1) inset,
      0 0 0 0.5px rgba(255, 255, 255, 0.05),
      0 8px 32px rgba(0, 0, 0, 0.4),
      0 2px 8px rgba(0, 0, 0, 0.3);
  }
  
  .control-card,
  .brightness-section {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.12);
    box-shadow: 
      0 0 0 1px rgba(255, 255, 255, 0.08) inset,
      0 2px 8px rgba(0, 0, 0, 0.3);
  }
  
  .control-card:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.18);
  }
  
  .card-icon,
  .card-label,
  .section-title {
    color: rgba(255, 255, 255, 0.9);
  }
  
  .section-value,
  .slider-icon {
    color: rgba(255, 255, 255, 0.6);
  }
  
  .brightness-slider {
    background: rgba(255, 255, 255, 0.15);
  }
  
  .brightness-slider::-webkit-slider-thumb {
    background: linear-gradient(145deg, #e8e8e8, #d0d0d0);
  }
  
  .spinner {
    border-color: rgba(255, 255, 255, 0.15);
    border-top-color: rgba(255, 255, 255, 0.8);
  }
}
</style>
