<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const monitors = ref([])
const currentMonitorIndex = ref(0)  // 当前选中的显示器
const loading = ref(true)
const isVisible = ref(false)
const isDragging = ref(false)
const activeSliderIndex = ref(null)

// VCP 代码常量
const VCP_CODES = {
  POWER: 0xD6,
  INPUT_SOURCE: 0x60,
  BRIGHTNESS: 0x10
}

// 快捷亮度预设值
const quickPresets = [0, 25, 50, 100]

// 下拉菜单状态
const isDropdownOpen = ref(false)
const dropdownRef = ref(null)

// 当前显示器
const currentMonitor = computed(() => {
  return monitors.value[currentMonitorIndex.value] || null
})

// 检查当前显示器是否支持特定功能
const supportsFeature = (vcp_code) => {
  if (!currentMonitor.value || !currentMonitor.value.supported_codes) {
    return false
  }
  return currentMonitor.value.supported_codes.includes(vcp_code)
}

// 切换下拉菜单
const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}

// 选择显示器
const selectMonitor = (index) => {
  currentMonitorIndex.value = index
  isDropdownOpen.value = false
}

// 点击外部关闭下拉
const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    isDropdownOpen.value = false
  }
}

const fetchMonitors = async (silent = false) => {
  if (!silent && monitors.value.length === 0) {
    loading.value = true
  }
  
  try {
    const res = await window.api.getMonitors()
    if (res.status === 'success') {
      monitors.value = res.data
      // 确保当前索引有效
      if (currentMonitorIndex.value >= monitors.value.length) {
        currentMonitorIndex.value = 0
      }
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

// 电源控制（示例：切换开/关）
const handlePower = async () => {
  if (!supportsFeature(VCP_CODES.POWER)) return
  
  // TODO: 实现电源菜单或状态切换
  // 1=On, 4=Standby, 5=Off
  // 这里简单示例设置为待机
  try {
    await window.api.setPower(currentMonitorIndex.value, 4)
  } catch (err) {
    console.error('Power control error:', err)
  }
}

// 输入源控制
const handleInputSource = async () => {
  if (!supportsFeature(VCP_CODES.INPUT_SOURCE)) return
  
  // TODO: 显示输入源选择菜单
  console.log('Input source clicked')
}

// 滑块拖动逻辑
const startDrag = (e) => {
  isDragging.value = true
  updateSlider(e)
  
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)
}

const handleMouseMove = (e) => {
  if (isDragging.value) {
    updateSlider(e)
  }
}

const handleMouseUp = () => {
  isDragging.value = false
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)
}

const updateSlider = (e) => {
  const slider = document.getElementById('brightness-slider')
  if (!slider || !currentMonitor.value) return
  
  const rect = slider.getBoundingClientRect()
  const percentage = (e.clientX - rect.left) / rect.width
  const value = Math.max(0, Math.min(100, percentage * 100))
  
  setBrightness(currentMonitorIndex.value, value)
}

// 监听显示/隐藏命令
const handleShow = async () => {
  isVisible.value = true
  
  // 检查是否需要刷新显示器列表
  const needsRefresh = await window.api.checkNeedsRefresh()
  
  if (needsRefresh === 1) {
    // 需要刷新：切换了输入源
    await fetchMonitors(true)
    // 重置刷新标志
    await window.api.resetRefreshFlag()
  } else if (monitors.value.length === 0) {
    // 第一次加载，必须刷新
    await fetchMonitors(true)
  }
  // 否则不刷新，使用缓存的数据
}

const handleHide = () => {
  isVisible.value = false
  setTimeout(() => {
    window.electron?.ipcRenderer?.send('quick-panel-hide-finished')
  }, 300)
}

onMounted(() => {
  fetchMonitors()
  
  window.electron?.ipcRenderer?.on('show-quick-panel', handleShow)
  window.electron?.ipcRenderer?.on('hide-quick-panel', handleHide)
  
  // 添加点击外部关闭下拉菜单
  document.addEventListener('click', handleClickOutside)
  
  setTimeout(() => { isVisible.value = true }, 100)
})

onUnmounted(() => {
  window.electron?.ipcRenderer?.off('show-quick-panel', handleShow)
  window.electron?.ipcRenderer?.off('hide-quick-panel', handleHide)
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="quick-panel-wrapper">
    <Transition name="slide-fade">
      <div v-if="isVisible" class="quick-panel">
        <!-- 显示器选择下拉菜单 - 左上角 -->
        <div class="monitor-selector" ref="dropdownRef">
          <button class="selector-btn" @click="toggleDropdown">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="opacity: 0.6;">
              <path d="M20 3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h3l-1 1v2h12v-2l-1-1h3c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 13H4V5h16v11z"/>
            </svg>
            <span class="monitor-name">{{ currentMonitor?.name || '选择显示器' }}</span>
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              style="opacity: 0.5;"
              :style="{ transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }"
            >
              <path d="M7 10l5 5 5-5z"/>
            </svg>
          </button>
          
          <!-- 下拉列表 -->
          <Transition name="dropdown-fade">
            <div v-if="isDropdownOpen" class="dropdown-list">
              <button
                v-for="(monitor, index) in monitors"
                :key="index"
                class="dropdown-item"
                :class="{ 'active': index === currentMonitorIndex }"
                @click="selectMonitor(index)"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="opacity: 0.5;">
                  <path d="M20 3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h3l-1 1v2h12v-2l-1-1h3c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 13H4V5h16v11z"/>
                </svg>
                <span>{{ monitor.name }}</span>
                <svg v-if="index === currentMonitorIndex" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="opacity: 0.7;">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              </button>
            </div>
          </Transition>
        </div>
        
        <!-- Liquid Glass 快捷功能区 -->
        <div class="quick-actions-grid">
          <button 
            class="liquid-glass-btn power-btn" 
            @click="handlePower"
            :disabled="!supportsFeature(VCP_CODES.POWER)"
            :class="{ 'disabled': !supportsFeature(VCP_CODES.POWER) }"
          >
            <svg class="btn-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2v10M18.36 5.64a9 9 0 1 1-12.73 0"/>
            </svg>
            <span class="btn-label">电源</span>
          </button>
          
          <button 
            class="liquid-glass-btn input-btn"
            @click="handleInputSource"
            :disabled="!supportsFeature(VCP_CODES.INPUT_SOURCE)"
            :class="{ 'disabled': !supportsFeature(VCP_CODES.INPUT_SOURCE) }"
          >
            <svg class="btn-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h3l-1 1v2h12v-2l-1-1h3c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 13H4V5h16v11z"/>
            </svg>
            <span class="btn-label">输入源</span>
          </button>
        </div>
        
        <!-- Liquid Glass 显示器控制卡片 -->
        <div v-if="currentMonitor" class="liquid-glass-card">
          <div class="card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="opacity: 0.6;">
              <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 2c1.65 0 3 1.35 3 3s-1.35 3-3 3-3-1.35-3-3 1.35-3 3-3zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36a.996.996 0 000 1.41.996.996 0 001.41 0l1.06-1.06c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0l-1.06 1.06z"/>
            </svg>
            <span>亮度</span>
          </div>
          
          <div v-if="loading" class="loading">
            <div class="spinner"></div>
          </div>
          
          <div v-else class="brightness-control">
            <div class="brightness-header">
              <!-- 迷你快捷按钮组 -->
              <div class="mini-actions">
                <button 
                  v-for="preset in quickPresets" 
                  :key="preset"
                  :class="['mini-btn', { 'active': Math.abs(currentMonitor.brightness - preset) < 5 }]"
                  @click="setBrightness(currentMonitorIndex, preset)"
                  :title="`设置亮度为 ${preset}%`"
                >
                  {{ preset }}
                </button>
              </div>

              <span class="value">{{ currentMonitor.brightness }}%</span>
            </div>
            
            <!-- macOS 风格滑块 -->
            <div 
              id="brightness-slider"
              class="macos-slider" 
              @mousedown="startDrag"
            >
              <!-- 背景层 -->
              <div class="slider-bg"></div>
              <!-- 填充层 -->
              <div class="slider-fill" :style="{ width: currentMonitor.brightness + '%' }"></div>
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

/* 外层包装，确保完全透明 */
.quick-panel-wrapper {
  width: 100%;
  height: 100%;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px; /* 移除 padding，让面板紧贴窗口边缘，避免阴影被截断 */
}

.quick-panel {
  width: 100%;
  height: 100%;
  /* macOS 风格材质背景 - 在白色背景下也能清晰可见 */
  background: rgba(245, 245, 247, 0.85);
  backdrop-filter: blur(60px) saturate(180%);
  -webkit-backdrop-filter: blur(60px) saturate(180%);
  border-radius: 18px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  color: #1d1d1f;
  /* 只保留内部高光，外部阴影由窗口系统阴影提供 */
  box-shadow: 
    inset 0 0 0 1px rgba(255, 255, 255, 0.6),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.08);
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
  opacity: 0.5;
  letter-spacing: -0.2px;
  color: #1d1d1f;
}

/* 显示器选择下拉菜单 */
.monitor-selector {
  position: relative;
  margin-bottom: 12px;
}

.selector-btn {
  width: 100%;
  height: 32px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  border: none;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: all 0.2s;
}

.selector-btn:hover {
  background: rgba(0, 0, 0, 0.06);
}

.selector-btn .monitor-name {
  flex: 1;
  text-align: left;
  font-size: 13px;
  font-weight: 500;
  color: #1d1d1f;
  opacity: 0.85;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 下拉列表 */
.dropdown-list {
  position: absolute;
  top: 36px;
  left: 0;
  right: 0;
  z-index: 1000;
  
  /* Liquid Glass 效果 */
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.45) 0%,
    rgba(255, 255, 255, 0.3) 100%
  );
  backdrop-filter: blur(40px) saturate(160%);
  -webkit-backdrop-filter: blur(40px) saturate(160%);
  
  border-radius: 12px;
  padding: 4px;
  box-shadow: 
    0 4px 16px rgba(0, 0, 0, 0.12),
    0 2px 4px rgba(0, 0, 0, 0.08),
    inset 0 1px 1px rgba(255, 255, 255, 0.5),
    0 0 0 0.5px rgba(0, 0, 0, 0.06);
  
  max-height: 200px;
  overflow-y: auto;
}

.dropdown-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: none;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  transition: all 0.15s;
  font-size: 12px;
  font-weight: 500;
  color: #1d1d1f;
  text-align: left;
}

.dropdown-item span {
  flex: 1;
}

.dropdown-item:hover {
  background: rgba(0, 0, 0, 0.06);
}

.dropdown-item.active {
  background: rgba(0, 0, 0, 0.08);
}

/* 下拉动画 */
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}

/* Liquid Glass 快捷功能区 */
.quick-actions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
}

/* Liquid Glass 按钮 - macOS Sequoia 风格 */
.liquid-glass-btn {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 16px 12px;
  border-radius: 14px;
  border: none;
  cursor: pointer;
  
  /* Liquid Glass 核心效果 */
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.4) 0%,
    rgba(255, 255, 255, 0.25) 100%
  );
  backdrop-filter: blur(30px) saturate(150%);
  -webkit-backdrop-filter: blur(30px) saturate(150%);
  
  /* 微妙的边框和阴影 */
  box-shadow: 
    inset 0 1px 1px rgba(255, 255, 255, 0.5),
    inset 0 -1px 1px rgba(0, 0, 0, 0.03),
    0 2px 8px rgba(0, 0, 0, 0.05),
    0 0 0 0.5px rgba(0, 0, 0, 0.06);
  
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.liquid-glass-btn:hover {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.5) 0%,
    rgba(255, 255, 255, 0.35) 100%
  );
  transform: scale(1.02);
  box-shadow: 
    inset 0 1px 1px rgba(255, 255, 255, 0.6),
    inset 0 -1px 1px rgba(0, 0, 0, 0.03),
    0 4px 12px rgba(0, 0, 0, 0.08),
    0 0 0 0.5px rgba(0, 0, 0, 0.08);
}

.liquid-glass-btn:active {
  transform: scale(0.98);
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.35) 0%,
    rgba(255, 255, 255, 0.2) 100%
  );
}

/* 禁用状态 */
.liquid-glass-btn.disabled,
.liquid-glass-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

.btn-icon {
  color: #1d1d1f;
  opacity: 0.8;
}

.btn-label {
  font-size: 11px;
  font-weight: 500;
  color: #1d1d1f;
  opacity: 0.7;
  letter-spacing: -0.1px;
}

/* Liquid Glass 卡片 */
.liquid-glass-card {
  position: relative;
  padding: 14px;
  border-radius: 14px;
  
  /* Liquid Glass 效果 - 更透明更流畅 */
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.35) 0%,
    rgba(255, 255, 255, 0.2) 100%
  );
  backdrop-filter: blur(40px) saturate(160%);
  -webkit-backdrop-filter: blur(40px) saturate(160%);
  
  /* 柔和的边框和内阴影 */
  box-shadow: 
    inset 0 1px 1px rgba(255, 255, 255, 0.4),
    inset 0 -1px 1px rgba(0, 0, 0, 0.02),
    0 1px 6px rgba(0, 0, 0, 0.04),
    0 0 0 0.5px rgba(0, 0, 0, 0.05);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  padding-left: 2px;
  font-size: 12px;
  font-weight: 500;
  color: #1d1d1f;
  opacity: 0.65;
  letter-spacing: -0.1px;
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

/* 亮度控制区域 */
.brightness-control {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.brightness-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2px;
  height: 20px;
}

.name {
  font-size: 13px;
  font-weight: 500;
  opacity: 0.85;
  letter-spacing: -0.1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px; /* 防止名称过长挤压按钮 */
  color: #1d1d1f;
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
  /* 微妙阴影 */
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.mini-btn:hover {
  background: rgba(255, 255, 255, 0.8);
  transform: scale(1.05);
  box-shadow: 
    0 2px 6px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.mini-btn.active {
  background: #333;
  color: white;
  border-color: transparent;
  box-shadow: 
    0 1px 4px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.value {
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  opacity: 0.65;
  min-width: 32px;
  text-align: right;
  color: #1d1d1f;
}

/* macOS 风格滑块 */
.macos-slider {
  position: relative;
  width: 100%;
  height: 28px;
  border-radius: 14px;
  cursor: pointer;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.08);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
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
    background: rgba(40, 40, 45, 0.7);
    color: #fff;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.05);
  }
  
  /* Liquid Glass 按钮 - 暗色模式 */
  .liquid-glass-btn {
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.15) 0%,
      rgba(255, 255, 255, 0.08) 100%
    );
    box-shadow: 
      inset 0 1px 1px rgba(255, 255, 255, 0.15),
      inset 0 -1px 1px rgba(0, 0, 0, 0.1),
      0 2px 8px rgba(0, 0, 0, 0.2),
      0 0 0 0.5px rgba(255, 255, 255, 0.08);
  }
  
  .liquid-glass-btn:hover {
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.2) 0%,
      rgba(255, 255, 255, 0.12) 100%
    );
    box-shadow: 
      inset 0 1px 1px rgba(255, 255, 255, 0.2),
      inset 0 -1px 1px rgba(0, 0, 0, 0.1),
      0 4px 12px rgba(0, 0, 0, 0.25),
      0 0 0 0.5px rgba(255, 255, 255, 0.1);
  }
  
  .btn-icon,
  .btn-label {
    color: #fff;
  }
  
  /* Liquid Glass 卡片 - 暗色模式 */
  .liquid-glass-card {
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.12) 0%,
      rgba(255, 255, 255, 0.06) 100%
    );
    box-shadow: 
      inset 0 1px 1px rgba(255, 255, 255, 0.12),
      inset 0 -1px 1px rgba(0, 0, 0, 0.1),
      0 1px 6px rgba(0, 0, 0, 0.15),
      0 0 0 0.5px rgba(255, 255, 255, 0.08);
  }
  
  .card-title {
    color: #fff;
  }
  
  /* 下拉菜单选择器 - 暗色模式 */
  .selector-btn {
    background: rgba(255, 255, 255, 0.08);
  }
  
  .selector-btn:hover {
    background: rgba(255, 255, 255, 0.12);
  }
  
  .selector-btn .monitor-name {
    color: #fff;
  }
  
  .dropdown-list {
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.15) 0%,
      rgba(255, 255, 255, 0.08) 100%
    );
    box-shadow: 
      0 4px 16px rgba(0, 0, 0, 0.3),
      0 2px 4px rgba(0, 0, 0, 0.2),
      inset 0 1px 1px rgba(255, 255, 255, 0.15),
      0 0 0 0.5px rgba(255, 255, 255, 0.1);
  }
  
  .dropdown-item {
    color: #fff;
  }
  
  .dropdown-item:hover {
    background: rgba(255, 255, 255, 0.12);
  }
  
  .dropdown-item.active {
    background: rgba(255, 255, 255, 0.18);
  }
  
  /* 显示器切换器 - 暗色模式 */
  .monitor-name {
    color: #fff;
  }
  
  .switch-btn {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
  
  .switch-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
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
  
  .value {
    color: #fff;
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
