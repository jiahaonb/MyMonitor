<script setup>
import { ref, onMounted } from 'vue'
import { configManager } from '../utils/config.js'

const panelOpacity = ref(0.9)
const version = ref('1.0')

onMounted(() => {
  const config = configManager.getAll()
  panelOpacity.value = config.panelOpacity
  version.value = config.version
})

const updateOpacity = (value) => {
  panelOpacity.value = value
  configManager.set('panelOpacity', value)
  
  // 触发自定义事件通知父组件更新透明度
  window.dispatchEvent(new CustomEvent('config-updated', { 
    detail: { panelOpacity: value } 
  }))
}

const opacityPercentage = (value) => {
  return Math.round(value * 100)
}
</script>

<template>
  <div class="config-panel">
    <div class="config-section">
      <h3 class="section-title">界面设置</h3>
      
      <div class="config-item">
        <div class="config-label">
          <span class="label-text">面板透明度</span>
          <span class="label-value">{{ opacityPercentage(panelOpacity) }}%</span>
        </div>
        <div class="slider-wrapper">
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01"
            :value="panelOpacity" 
            @input="e => updateOpacity(parseFloat(e.target.value))"
            class="opacity-slider"
          />
        </div>
        <p class="config-hint">调整设置面板的背景透明度</p>
      </div>
    </div>

    <div class="version-info">
      <p class="version-text">DisplayOS v{{ version }}</p>
      <p class="copyright">© 2025 显示器控制中心</p>
    </div>
  </div>
</template>

<style scoped>
.config-panel {
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
.config-panel::-webkit-scrollbar {
  width: 6px;
}

.config-panel::-webkit-scrollbar-track {
  background: transparent;
}

.config-panel::-webkit-scrollbar-thumb {
  background: rgba(139, 92, 246, 0.3);
  border-radius: 3px;
  border: none;
}

.config-panel::-webkit-scrollbar-thumb:hover {
  background: rgba(139, 92, 246, 0.5);
}

.config-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #1d1d1f;
  letter-spacing: -0.3px;
}

.config-item {
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 12px;
}

.config-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.label-text {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.label-value {
  font-size: 14px;
  font-weight: 700;
  color: #8B5CF6;
}

.slider-wrapper {
  margin-bottom: 8px;
}

.opacity-slider {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  width: 100%;
  height: 6px;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 3px;
  outline: none;
  cursor: pointer;
}

.opacity-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: white;
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.15),
    0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
  border: 0.5px solid rgba(0, 0, 0, 0.04);
}

.opacity-slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.2),
    0 2px 6px rgba(0, 0, 0, 0.15);
}

.opacity-slider::-webkit-slider-thumb:active {
  transform: scale(1.15);
}

.opacity-slider::-moz-range-thumb {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: white;
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.15),
    0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  border: 0.5px solid rgba(0, 0, 0, 0.04);
  border: none;
}

.config-hint {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.4);
  margin: 0;
  line-height: 1.4;
}

.version-info {
  margin-top: auto;
  padding: 16px 8px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.version-text {
  font-size: 13px;
  font-weight: 600;
  color: #8B5CF6;
  margin: 0 0 4px 0;
}

.copyright {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.3);
  margin: 0;
}

/* 暗色模式 */
@media (prefers-color-scheme: dark) {
  .section-title {
    color: #f5f5f7;
  }
  
  .config-item {
    background: rgba(60, 60, 65, 0.4);
    border-color: rgba(255, 255, 255, 0.08);
  }
  
  .label-text {
    color: #e5e5e7;
  }
  
  .config-hint {
    color: rgba(255, 255, 255, 0.4);
  }
  
  .copyright {
    color: rgba(255, 255, 255, 0.3);
  }
}
</style>
