<script setup>
import { ref, onMounted, computed } from 'vue'
import { vcpCodes } from '../utils/vcp_codes.js'

const monitors = ref([])
const selectedMonitorIndex = ref(0)
const supportedCodes = ref([])
const loading = ref(false)
const searchQuery = ref('')

// 将 vcpCodes 转换为数组以便显示，并按重要性排序
const allFeatures = computed(() => {
  const list = Object.entries(vcpCodes).map(([code, info]) => ({
    code: parseInt(code),
    hex: '0x' + parseInt(code).toString(16).toUpperCase().padStart(2, '0'),
    ...info
  })).filter(item => {
    if (!searchQuery.value) return true
    const query = searchQuery.value.toLowerCase()
    return (
      item.name.toLowerCase().includes(query) || 
      item.desc.toLowerCase().includes(query) || 
      item.hex.toLowerCase().includes(query)
    )
  })

  // 排序：按 priority 降序，然后按代码升序
  return list.sort((a, b) => {
    const pA = a.priority || 0
    const pB = b.priority || 0
    if (pA !== pB) return pB - pA // 优先级高的在前
    return a.code - b.code
  })
})

const supportedFeatures = computed(() => {
  return allFeatures.value.filter(item => supportedCodes.value.includes(item.code))
})

// 功能跳转映射
const featureTabMap = {
  0x10: 'brightness', // 亮度
  0x60: 'input',      // 输入源
  0xD6: 'power'       // 电源
}

const jumpToFeature = (code) => {
  const tabId = featureTabMap[code]
  if (tabId) {
    window.dispatchEvent(new CustomEvent('switch-tab', { detail: { tabId } }))
  }
}

const fetchMonitors = async () => {
  try {
    const res = await window.api.getMonitors()
    if (res.status === 'success') {
      monitors.value = res.data
      if (monitors.value.length > 0) {
        fetchSupportedFeatures(0)
      }
    }
  } catch (err) {
    console.error(err)
  }
}

const fetchSupportedFeatures = async (index) => {
  selectedMonitorIndex.value = index
  loading.value = true
  supportedCodes.value = [] // 清空旧数据
  
  try {
    const res = await window.api.getSupportedFeatures(index)
    if (res.status === 'success') {
      supportedCodes.value = res.data
    }
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchMonitors()
})
</script>

<template>
  <div class="vcp-panel">
    <!-- 顶部控制栏 -->
    <div class="control-bar">
      <div class="monitor-selector">
        <label>选择显示器:</label>
        <select 
          :value="selectedMonitorIndex" 
          @change="e => fetchSupportedFeatures(parseInt(e.target.value))"
          class="macos-select"
        >
          <option v-for="(m, idx) in monitors" :key="idx" :value="idx">
            {{ m.name }} (Monitor {{ idx + 1 }})
          </option>
        </select>
      </div>
      
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="搜索功能..." 
          class="macos-input"
        >
      </div>
    </div>

    <!-- 主要内容区 -->
    <div class="content-grid">
      <!-- 左侧：所有功能 -->
      <div class="column">
        <div class="column-header">
          <h3>📚 所有功能字典</h3>
          <span class="badge">{{ allFeatures.length }}</span>
        </div>
        <div class="list-container">
          <div v-for="item in allFeatures" :key="item.code" :class="['list-item', { important: item.important }]">
            <div class="item-header">
              <span class="code-badge">{{ item.hex }}</span>
              <span class="item-name">{{ item.name }}</span>
            </div>
            <p class="item-desc">{{ item.desc }}</p>
            <div v-if="item.values" class="item-values">
              <span v-for="(val, key) in item.values" :key="key" class="value-tag">
                {{ key }}: {{ val }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：当前支持 -->
      <div class="column highlight-column">
        <div class="column-header">
          <h3>✨ 当前屏幕支持</h3>
          <span class="badge success">{{ loading ? '检测中...' : supportedFeatures.length }}</span>
        </div>
        
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>正在读取 VCP 代码...</p>
        </div>
        
        <div v-else-if="supportedFeatures.length === 0" class="empty-state">
          <p>未检测到支持的功能，或显示器不支持 DDC/CI。</p>
        </div>

        <div v-else class="list-container">
          <div 
            v-for="item in supportedFeatures" 
            :key="item.code" 
            :class="['list-item', 'supported', { clickable: featureTabMap[item.code] }]"
            @click="jumpToFeature(item.code)"
          >
            <div class="item-header">
              <span class="code-badge active">{{ item.hex }}</span>
              <span class="item-name">{{ item.name }}</span>
              <span v-if="featureTabMap[item.code]" class="jump-icon">↗</span>
            </div>
            <p class="item-desc">{{ item.desc }}</p>
            <div class="status-indicator">
              <span class="dot"></span> 已支持
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.vcp-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px;
}

.control-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.monitor-selector {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #555;
}

.macos-select {
  padding: 4px 24px 4px 10px;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.8);
  font-size: 13px;
  color: #333;
  outline: none;
  cursor: pointer;
}

.search-box {
  position: relative;
  width: 200px;
}

.search-icon {
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  opacity: 0.5;
}

.macos-input {
  width: 100%;
  padding: 6px 10px 6px 28px;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.8);
  font-size: 13px;
  outline: none;
  transition: all 0.2s;
}

.macos-input:focus {
  border-color: #007AFF;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.content-grid {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  overflow: hidden; /* 防止溢出 */
}

.column {
  background: rgba(255, 255, 255, 0.4);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.highlight-column {
  background: rgba(255, 255, 255, 0.6);
  border-color: rgba(0, 122, 255, 0.1);
}

.column-header {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.3);
}

.column-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.badge {
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  color: #666;
  font-weight: 500;
}

.badge.success {
  background: rgba(52, 199, 89, 0.1);
  color: #34C759;
}

.list-container {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.list-item {
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  padding: 10px;
  border: 1px solid rgba(0, 0, 0, 0.03);
  transition: all 0.2s;
}

.list-item:hover {
  background: rgba(255, 255, 255, 0.8);
  transform: translateY(-1px);
}

.list-item.important {
  background: rgba(255, 59, 48, 0.05);
  border-left: 3px solid #FF3B30;
}

.list-item.supported {
  background: rgba(255, 255, 255, 0.8);
  border-left: 3px solid #34C759;
}

.list-item.clickable {
  cursor: pointer;
}

.list-item.clickable:hover {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.jump-icon {
  font-size: 12px;
  color: #007AFF;
  margin-left: auto;
  opacity: 0.6;
}

.list-item.clickable:hover .jump-icon {
  opacity: 1;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.code-badge {
  font-family: monospace;
  font-size: 11px;
  background: #eee;
  padding: 2px 6px;
  border-radius: 4px;
  color: #555;
}

.code-badge.active {
  background: #34C759;
  color: white;
}

.item-name {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.item-desc {
  margin: 4px 0;
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.item-values {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}

.value-tag {
  font-size: 10px;
  background: rgba(0, 122, 255, 0.05);
  color: #007AFF;
  padding: 2px 6px;
  border-radius: 4px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #34C759;
  margin-top: 6px;
  font-weight: 500;
}

.dot {
  width: 6px;
  height: 6px;
  background: #34C759;
  border-radius: 50%;
}

.loading-state, .empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #888;
  font-size: 13px;
  gap: 12px;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-top-color: #007AFF;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 滚动条美化 */
.list-container::-webkit-scrollbar {
  width: 6px;
}
.list-container::-webkit-scrollbar-track {
  background: transparent;
}
.list-container::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}
.list-container::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
}
</style>
