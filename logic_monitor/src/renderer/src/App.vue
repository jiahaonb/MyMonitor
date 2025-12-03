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

const fetchMonitors = async () => {
  loading.value = true
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
  <div class="universe">
    <!-- 主玻璃面板 -->
    <div class="liquid-card">
      
      <!-- 顶部 -->
      <div class="header">
        <div class="header-text">
          <h1>Display<span class="highlight">OS</span></h1>
          <p v-if="!loading" class="status-badge">Connected</p>
        </div>
        <button @click="fetchMonitors" class="glass-btn icon-btn">
          <span class="spin-icon">↻</span>
        </button>
      </div>

      <!-- 加载中 -->
      <div v-if="loading" class="loading-zone">
        <div class="loader"></div>
      </div>
      
      <!-- 列表内容 -->
      <div v-else class="scroll-container">
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
            <span>Precise Control</span>
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
  </div>
</template>

<style>
/* --- 全局重置 --- */
* { box-sizing: border-box; }
body, html {
  margin: 0; padding: 0;
  height: 100vh;
  /* 确保这里绝对透明，不要有任何颜色 */
  background: transparent; 
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif;
  overflow: hidden;
  user-select: none;
}

/* --- 宇宙背景层 (Universe) --- */
.universe {
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  /* 完全透明背景 */
  background: transparent; 
}

/* 移除了背景光球 - 用户不需要 */

/* --- 核心：液态玻璃卡片 (Liquid Card) - macOS 风格 --- */
.liquid-card {
  width: 88%;
  max-width: 420px;
  height: 85%; /* 减少高度确保圆角不被裁切 */
  max-height: 580px;
  margin: 20px 0; /* 添加上下边距确保圆角完整显示 */
  /* macOS 风格的玻璃背景 - 更多白色，更少颜色 */
  background: rgba(255, 255, 255, 0.65);
  /* 增强模糊效果，减少饱和度 */
  backdrop-filter: blur(60px) saturate(150%); 
  -webkit-backdrop-filter: blur(60px) saturate(150%);
  
  border-radius: 28px; /* 稍微减少圆角，更接近 macOS */
  border: 1.5px solid rgba(255, 255, 255, 0.6);
  /* 柔和的阴影 */
  box-shadow: 
    0 24px 60px rgba(0, 0, 0, 0.08),
    0 8px 16px rgba(0, 0, 0, 0.04),
    inset 0 0 0 1px rgba(255, 255, 255, 0.5),
    0 0 0 0.5px rgba(0, 0, 0, 0.03);
  
  display: flex;
  flex-direction: column;
  padding: 24px;
  color: #1d1d1f;
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

/* --- 头部设计 --- */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
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
  background: linear-gradient(135deg, #A18CD1 0%, #FBC2EB 100%); /* 柔和紫粉渐变 */
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-left: 4px;
}
.status-badge {
  font-size: 11px;
  color: rgba(0,0,0,0.45);
  background: rgba(0,0,0,0.04);
  padding: 3px 10px;
  border-radius: 12px;
  display: inline-block;
  margin-top: 6px;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.glass-btn {
  background: rgba(255,255,255,0.4);
  border: 1px solid rgba(0,0,0,0.06);
  width: 38px; height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  color: #1d1d1f;
}
.glass-btn:hover {
  background: rgba(255,255,255,0.9);
  transform: rotate(90deg) scale(1.08);
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  border-color: rgba(0,0,0,0.1);
}

/* --- 列表容器 --- */
.scroll-container {
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
  /* 自定义滚动条 - macOS 风格 */
  scrollbar-width: thin;
  scrollbar-color: rgba(0,0,0,0.15) transparent;
}
.scroll-container::-webkit-scrollbar { 
  width: 6px; 
}
.scroll-container::-webkit-scrollbar-track { 
  background: transparent; 
}
.scroll-container::-webkit-scrollbar-thumb { 
  background: rgba(0,0,0,0.15); 
  border-radius: 3px;
}
.scroll-container::-webkit-scrollbar-thumb:hover { 
  background: rgba(0,0,0,0.25); 
}

/* --- 显示器条目 --- */
.monitor-section {
  margin-bottom: 28px;
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
  color: #8B5CF6; /* 柔和的紫色 */
  background: rgba(139, 92, 246, 0.08);
  padding: 5px 12px;
  border-radius: 10px;
  letter-spacing: -0.3px;
}

/* --- 液态芯片按钮 (Liquid Chips) - macOS 风格 --- */
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
  /* 激活态：柔和的紫色渐变 */
  background: linear-gradient(135deg, #A78BFA 0%, #C084FC 100%);
  color: white;
  border: none;
  box-shadow: 
    0 6px 20px rgba(167, 139, 250, 0.3),
    0 2px 8px rgba(167, 139, 250, 0.2);
  transform: scale(1.03);
  font-weight: 600;
}

/* --- 折叠微调区 --- */
.expander {
  margin-top: 14px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: rgba(0,0,0,0.35);
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

/* --- 滑动条美化 (macOS 风格) --- */
input[type=range] {
  -webkit-appearance: none;
  width: 100%;
  background: transparent;
}
input[type=range]::-webkit-slider-runnable-track {
  width: 100%;
  height: 6px;
  background: rgba(0,0,0,0.08);
  border-radius: 3px;
}
input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 24px; width: 24px;
  border-radius: 50%;
  background: white;
  box-shadow: 
    0 2px 8px rgba(0,0,0,0.15),
    0 1px 3px rgba(0,0,0,0.1);
  margin-top: -9px;
  cursor: grab;
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
  border: 0.5px solid rgba(0,0,0,0.04);
}
input[type=range]::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 
    0 4px 12px rgba(0,0,0,0.2),
    0 2px 6px rgba(0,0,0,0.15);
}
input[type=range]::-webkit-slider-thumb:active {
  transform: scale(1.15);
  cursor: grabbing;
}

/* --- 加载动画 - macOS 风格 --- */
.loading-zone {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}
.loader {
  width: 44px; height: 44px;
  border: 3px solid rgba(139, 92, 246, 0.12);
  border-radius: 50%;
  border-top-color: #8B5CF6;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* --- Windows 特定优化 --- */
@media (prefers-color-scheme: dark) {
  .liquid-card {
    background: rgba(30, 30, 35, 0.7);
    border-color: rgba(255, 255, 255, 0.12);
  }
  h1, .name, .glass-btn {
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