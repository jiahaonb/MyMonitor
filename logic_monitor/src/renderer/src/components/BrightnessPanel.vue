<script setup>
import { ref, onMounted } from 'vue'

const monitors = ref([])
const loading = ref(false)
const showFineTune = ref(false)

// 生成 5% - 100% 的预设值
const presets = Array.from({ length: 20 }, (_, i) => (i + 1) * 5)

function debounce(fn, delay) {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

const fetchMonitors = async (silent = false) => {
  if (!silent && monitors.value.length === 0) {
    loading.value = true
  }
  try {
    const res = await window.api.getMonitors()
    if (res.status === 'success') monitors.value = res.data
  } catch (err) { console.error(err) } 
  finally { loading.value = false }
}

const setBrightness = async (index, value) => {
  monitors.value[index].brightness = parseInt(value)
  await window.api.setBrightness(index, parseInt(value))
}

const debouncedSetBrightness = debounce((index, value) => {
  setBrightness(index, value)
}, 300)

const onSliderInput = (index, value) => {
  monitors.value[index].brightness = parseInt(value)
  debouncedSetBrightness(index, value)
}

onMounted(() => {
  fetchMonitors()
})
</script>

<template>
  <div class="brightness-panel">
    <!-- 头部刷新按钮 -->
    <div class="panel-actions">
      <button @click="fetchMonitors" class="refresh-btn" title="刷新显示器列表">
        <span class="refresh-icon" :class="{ spinning: loading }">↻</span>
        刷新
      </button>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="loading-zone">
      <div class="loader"></div>
      <p class="loading-text">正在加载显示器...</p>
    </div>
    
    <!-- 列表内容 -->
    <div v-else class="monitors-container">
      <div v-for="(m, idx) in monitors" :key="idx" class="monitor-section">
        
        <div class="monitor-label">
          <span class="monitor-icon">🖥</span>
          <span class="name">{{ m.name }}</span>
          <span class="value-tag">{{ m.brightness }}%</span>
        </div>

        <!-- 液态按钮网格 -->
        <div class="grid-system">
          <button 
            v-for="p in presets" 
            :key="p"
            class="liquid-chip"
            :class="{ 'active': m.brightness === p || (m.brightness > p - 5 && m.brightness < p) }"
            @click="setBrightness(idx, p)"
          >
            {{ p }}
          </button>
        </div>

        <!-- 微调触发器 -->
        <div class="expander" @click="showFineTune = !showFineTune">
          <span>精确控制</span>
          <span class="chevron" :class="{ rotated: showFineTune }">›</span>
        </div>

        <!-- 隐藏式滑动条 -->
        <div class="slider-drawer" :class="{ open: showFineTune }">
          <div class="slider-track-container">
            <input 
              type="range" 
              min="0" 
              max="100" 
              :value="m.brightness" 
              @input="e => onSliderInput(idx, e.target.value)"
            />
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.brightness-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 8px;
  overflow-y: auto;
  /* 透明无框滚动条 */
  scrollbar-width: thin;
  scrollbar-color: rgba(139, 92, 246, 0.3) transparent;
}

/* WebKit 滚动条样式 */
.brightness-panel::-webkit-scrollbar {
  width: 6px;
}

.brightness-panel::-webkit-scrollbar-track {
  background: transparent; /* 完全透明 */
}

.brightness-panel::-webkit-scrollbar-thumb {
  background: rgba(139, 92, 246, 0.3); /* 半透明紫色 */
  border-radius: 3px;
  border: none; /* 无边框 */
}

.brightness-panel::-webkit-scrollbar-thumb:hover {
  background: rgba(139, 92, 246, 0.5);
}

.panel-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 10px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover {
  background: rgba(255, 255, 255, 0.7);
  transform: translateY(-1px);
}

.refresh-icon {
  font-size: 16px;
  transition: transform 0.3s;
}

.refresh-icon.spinning {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-zone {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 12px;
}

.loader {
  width: 44px;
  height: 44px;
  border: 3px solid rgba(139, 92, 246, 0.12);
  border-radius: 50%;
  border-top-color: #8B5CF6;
  animation: spin 0.8s linear infinite;
}

.loading-text {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.4);
  margin: 0;
}

.monitors-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.monitor-section {
  margin-bottom: 0;
}

.monitor-label {
  display: flex;
  align-items: center;
  margin-bottom: 14px;
  padding: 0 2px;
}

.monitor-icon { 
  font-size: 22px; 
  margin-right: 10px; 
  opacity: 0.7;
  filter: grayscale(0.2);
}

.name { 
  font-weight: 600; 
  font-size: 15px; 
  opacity: 0.75; 
  flex: 1; 
  letter-spacing: -0.2px;
}

.value-tag {
  font-weight: 700;
  font-size: 15px;
  color: #8B5CF6;
  background: rgba(139, 92, 246, 0.08);
  padding: 5px 12px;
  border-radius: 10px;
  letter-spacing: -0.3px;
}

.grid-system {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.liquid-chip {
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 11px;
  height: 40px;
  color: #374151;
  font-size: 13.5px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  backdrop-filter: blur(10px);
  letter-spacing: -0.2px;
}

.liquid-chip:hover {
  background: rgba(255, 255, 255, 0.85);
  transform: translateY(-2px) scale(1.04);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: rgba(0, 0, 0, 0.12);
}

.liquid-chip.active {
  background: linear-gradient(135deg, #A78BFA 0%, #C084FC 100%);
  color: white;
  border: none;
  box-shadow: 
    0 6px 20px rgba(167, 139, 250, 0.3),
    0 2px 8px rgba(167, 139, 250, 0.2);
  transform: scale(1.03);
  font-weight: 600;
}

.expander {
  margin-top: 14px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.35);
  cursor: pointer;
  padding: 8px;
  transition: color 0.2s;
  letter-spacing: 0.2px;
}

.expander:hover { color: #8B5CF6; }

.chevron { 
  font-size: 18px; 
  font-weight: 700; 
  transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.chevron.rotated { transform: rotate(90deg); }

.slider-drawer {
  height: 0;
  opacity: 0;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.slider-drawer.open {
  height: 44px;
  opacity: 1;
  margin-top: 8px;
}

input[type=range] {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  width: 100%;
  background: transparent;
}

input[type=range]::-webkit-slider-runnable-track {
  width: 100%;
  height: 6px;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 3px;
}

input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 24px;
  width: 24px;
  border-radius: 50%;
  background: white;
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.15),
    0 1px 3px rgba(0, 0, 0, 0.1);
  margin-top: -9px;
  cursor: grab;
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
  border: 0.5px solid rgba(0, 0, 0, 0.04);
}

input[type=range]::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.2),
    0 2px 6px rgba(0, 0, 0, 0.15);
}

input[type=range]::-webkit-slider-thumb:active {
  transform: scale(1.15);
  cursor: grabbing;
}

/* 暗色模式 */
@media (prefers-color-scheme: dark) {
  .refresh-btn {
    background: rgba(60, 60, 65, 0.5);
    color: #e5e5e7;
    border-color: rgba(255, 255, 255, 0.08);
  }
  
  .loading-text {
    color: rgba(255, 255, 255, 0.4);
  }
  
  .name {
    color: #f5f5f7;
  }
  
  .liquid-chip {
    background: rgba(60, 60, 65, 0.5);
    color: #e5e5e7;
    border-color: rgba(255, 255, 255, 0.08);
  }
  
  .liquid-chip:hover {
    background: rgba(80, 80, 85, 0.8);
  }
}
</style>
