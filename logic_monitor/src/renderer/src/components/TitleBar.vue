<script setup>
import { ref } from 'vue'

const isPinned = ref(false)
const isMaximized = ref(false)

const minimize = () => {
  window.api.windowMinimize()
}

const toggleMaximize = () => {
  // 尚未实现最大化功能，但添加按钮
  console.log('Maximize/Restore')
}

const togglePin = () => {
  isPinned.value = !isPinned.value
  window.api.windowToggleAlwaysOnTop(isPinned.value)
}

const close = () => {
  window.api.windowClose()
}
</script>

<template>
  <div class="titlebar">
    <div class="titlebar-drag-region"></div>
    
    <!-- 左侧：标题 -->
    <div class="titlebar-title">显示器控制中心</div>
    
    <!-- 右侧：窗口控制按钮 - Windows 11风格 -->
    <div class="window-controls">
      <button class="control-btn pin-btn" @click.stop="togglePin" :class="{ active: isPinned }" :title="isPinned ? '取消置顶' : '固定在最前'">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
          <path d="M9.828 3l.682.682-3.182 3.182 3.828 3.828L10 12l-4-4 3.182-3.182L8.5 4.136 4.136 8.5 6 10.364v2.828L2.672 9.844l-.672.672 4 4 .672-.672L4.828 12h2.828L10 9.656l3.844 3.844.672-.672-4-4 .672-.672 3.828-3.828.682.682v-6h-6z"/>
        </svg>
      </button>
      
      <button class="control-btn minimize-btn" @click.stop="minimize" title="最小化">
        <svg width="12" height="12" viewBox="0 0 12 12">
          <path d="M 2 6 H 10" stroke="currentColor" stroke-width="1.5"/>
        </svg>
      </button>
      
      <button class="control-btn maximize-btn" @click.stop="toggleMaximize" title="最大化">
        <svg width="12" height="12" viewBox="0 0 12 12">
          <rect x="2" y="2" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
        </svg>
      </button>
      
      <button class="control-btn close-btn" @click.stop="close" title="关闭">
        <svg width="12" height="12" viewBox="0 0 12 12">
          <path d="M 3 3 L 9 9 M 3 9 L 9 3" stroke="currentColor" stroke-width="1.5"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.titlebar {
  position: relative;
  height: 40px;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  -webkit-app-region: drag;
  user-select: none;
  /* 添加上圆角 - 配合窗口圆角 */
  border-radius: 12px 12px 0 0;
}

.titlebar-drag-region {
  position: absolute;
  top: 0;
  left: 0;
  right: 140px; /* 为按钮留空间 */
  bottom: 0;
  -webkit-app-region: drag;
}

.titlebar-title {
  font-size: 12px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.6);
  letter-spacing: 0.3px;
}

.window-controls {
  display: flex;
  gap: 0;
  z-index: 10;
  -webkit-app-region: no-drag;
  margin-left: auto;
}

.control-btn {
  width: 46px;
  height: 32px;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.15s ease;
  color: rgba(0, 0, 0, 0.7);
}

.control-btn svg {
  opacity: 1;
}

.control-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.pin-btn.active {
  background: rgba(102, 126, 234, 0.15);
  color: rgb(102, 126, 234);
}

.close-btn:hover {
  background: #e81123;
  color: white;
}

/* 暗色模式 */
@media (prefers-color-scheme: dark) {
  .titlebar {
    background: rgba(40, 40, 45, 0.6);
    border-bottom-color: rgba(255, 255, 255, 0.08);
  }
  
  .titlebar-title {
    color: rgba(255, 255, 255, 0.7);
  }
  
  .control-btn {
    color: rgba(255, 255, 255, 0.8);
  }
  
  .control-btn:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .close-btn:hover {
    background: #e81123;
    color: white;
  }
}
</style>
