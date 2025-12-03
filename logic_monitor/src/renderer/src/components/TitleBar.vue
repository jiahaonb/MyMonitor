<script setup>
import { ref } from 'vue'

const isPinned = ref(false)

const minimize = () => {
  window.api.windowMinimize()
}

const togglePin = () => {
  isPinned.value = !isPinned.value
  window.api.windowToggleAlwaysOnTop(isPinned.value)
}

const close = () => {
  window.api.windowClose()
}

// 实现窗口拖动（由 -webkit-app-region自动处理）
const startDrag = (e) => {
  e.preventDefault()
}
</script>

<template>
  <div class="titlebar" @mousedown="startDrag">
    <div class="titlebar-drag-region"></div>
    
    <!-- macOS 风格控制按钮 -->
    <div class="window-controls">
      <button class="control-btn close-btn" @click.stop="close" title="关闭">
        <svg width="10" height="10" viewBox="0 0 10 10">
          <path d="M 0 0 L 10 10 M 0 10 L 10 0" stroke="currentColor" stroke-width="1.5"/>
        </svg>
      </button>
      <button class="control-btn minimize-btn" @click.stop="minimize" title="最小化">
        <svg width="10" height="10" viewBox="0 0 10 10">
          <path d="M 0 5 L 10 5" stroke="currentColor" stroke-width="1.5"/>
        </svg>
      </button>
      <button class="control-btn pin-btn" @click.stop="togglePin" :title="isPinned ? '取消置顶' : '固定在最前'">
        <svg v-if="!isPinned" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <path d="M16 2v4h4v2h-4.5l-2.5 9h-3l-2.5-9H4V6h4V2h8z" />
        </svg>
        <svg v-else width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 2v4h4v2h-4.5l-2.5 9h-3l-2.5-9H4V6h4V2h8z" />
        </svg>
      </button>
    </div>
    
    <div class="titlebar-title">显示器控制中心</div>
  </div>
</template>

<style scoped>
.titlebar {
  position: relative;
  height: 40px;
  background: rgba(255, 255, 255, 0.3);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  padding: 0 16px;
  -webkit-app-region: drag; /* 允许拖动 */
  user-select: none;
  border-radius: 24px 24px 0 0; /* 匹配主窗口圆角 */
}

.titlebar-drag-region {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  -webkit-app-region: drag;
}

.window-controls {
  display: flex;
  gap: 8px;
  z-index: 10;
  -webkit-app-region: no-drag; /* 按钮不可拖动 */
}

.control-btn {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;
  opacity: 0;
}

.titlebar:hover .control-btn {
  opacity: 1;
}

.close-btn {
  background: #FF5F57;
  color: #8f1e17;
}

.close-btn:hover {
  background: #e04640;
}

.minimize-btn {
  background: #FFBD2E;
  color: #995700;
}

.minimize-btn:hover {
  background: #e0a528;
}

.pin-btn {
  background: #8B5CF6; /* 紫色 */
  color: #4c1d95;
}

.pin-btn:hover {
  background: #7c3aed;
}

.control-btn svg {
  display: none;
}

.control-btn:hover svg {
  display: block;
}

.titlebar-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 13px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.6);
  letter-spacing: -0.2px;
  pointer-events: none;
}

/* 暗色模式 */
@media (prefers-color-scheme: dark) {
  .titlebar {
    background: rgba(40, 40, 45, 0.5);
    border-bottom-color: rgba(255, 255, 255, 0.08);
  }
  
  .titlebar-title {
    color: rgba(255, 255, 255, 0.6);
  }
}
</style>
