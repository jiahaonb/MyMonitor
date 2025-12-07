<script setup>
import { ref, onMounted, watch } from 'vue'
import { configManager } from '../utils/config.js'

const monitors = ref([])
const currentMonitorIndex = ref(0)
const loading = ref(false)

// 输入源列表
const inputSources = ref([
  { name: 'HDMI', code: 16 },
  { name: 'DP', code: 17 },
  { name: 'USB-C', code: 18 }
])

// 编辑状态
const editingIndex = ref(-1)
const editForm = ref({ name: '', code: '' })

// 添加状态
const isAdding = ref(false)
const addForm = ref({ name: '', code: '' })

// 获取当前显示器名称
const getCurrentMonitorName = () => {
  if (monitors.value.length > 0 && currentMonitorIndex.value < monitors.value.length) {
    return monitors.value[currentMonitorIndex.value].name || 'Unknown'
  }
  return 'Unknown'
}

// 加载显示器列表
const fetchMonitors = async () => {
  loading.value = true
  try {
    const res = await window.api.getMonitors()
    if (res.status === 'success') {
      monitors.value = res.data
      if (currentMonitorIndex.value >= monitors.value.length) {
        currentMonitorIndex.value = 0
      }
      // 加载完显示器后，加载对应的输入源配置
      await loadInputSourcesForCurrentMonitor()
    }
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

// 加载当前显示器的输入源配置
const loadInputSourcesForCurrentMonitor = async () => {
  const monitorName = getCurrentMonitorName()
  const config = configManager.getAll()
  
  console.log('🔍 [InputPanel] 加载配置 - 显示器名称:', monitorName)
  console.log('🔍 [InputPanel] 当前完整配置:', JSON.stringify(config, null, 2))
  
  // 配置存储格式：monitorInputSources: { "P27H2T": [...], "Monitor 2": [...] }
  if (config.monitorInputSources && config.monitorInputSources[monitorName]) {
    inputSources.value = config.monitorInputSources[monitorName]
    console.log('✅ [InputPanel] 已加载显示器配置:', inputSources.value)
  } else {
    // 使用默认值
    inputSources.value = [
      { name: 'HDMI', code: 16 },
      { name: 'DP', code: 17 },
      { name: 'USB-C', code: 18 }
    ]
    console.log('⚠️ [InputPanel] 未找到配置，使用默认值')
  }
}

// 保存当前显示器的输入源配置
const saveInputSources = async () => {
  const log = (...args) => {
    console.log(...args)
    if (window.api?.debugLog) {
      window.api.debugLog(...args)
    }
  }
  
  log('\n========================================')
  log('🔥🔥🔥 [InputPanel] 保存输入源被调用！！！')
  log('========================================\n')
  
  const monitorName = getCurrentMonitorName()
  
  log('💾 [InputPanel] 准备保存配置')
  log('💾 [InputPanel] 显示器名称:', monitorName)
  log('💾 [InputPanel] 输入源数据:', JSON.stringify(inputSources.value, null, 2))
  
  // 检查显示器名称是否有效
  if (!monitorName || monitorName === 'Unknown') {
    log('\n❌❌❌ [InputPanel] 无效的显示器名称，无法保存配置！')
    log('显示器名称为:', monitorName)
    log('当前monitors列表:', monitors.value)
    alert('错误：无法获取显示器名称，请刷新显示器列表后重试')
    return
  }
  
  // 获取当前配置的引用（注意：这是副本）
  const currentConfig = configManager.getAll()
  
  log('💾 [InputPanel] 当前配置（保存前）:', JSON.stringify(currentConfig, null, 2))
  
  // ⚠️ 关键修复：检查 monitorInputSources 是否为数组（错误格式）
  // 如果是数组，强制重置为对象
  if (Array.isArray(currentConfig.monitorInputSources)) {
    log('\n⚠️⚠️⚠️ [InputPanel] 检测到错误格式（数组），正在重置为对象格式')
    currentConfig.monitorInputSources = {}
  }
  
  // 确保 monitorInputSources 对象存在
  if (!currentConfig.monitorInputSources || typeof currentConfig.monitorInputSources !== 'object') {
    log('[InputPanel] 初始化 monitorInputSources 对象')
    currentConfig.monitorInputSources = {}
  }
  
  // 更新当前显示器的输入源配置
  currentConfig.monitorInputSources[monitorName] = [...inputSources.value]
  
  log('\n💾 [InputPanel] 完整配置对象（准备保存）:')
  log(JSON.stringify(currentConfig, null, 2))
  log('\n特别注意 monitorInputSources:', JSON.stringify(currentConfig.monitorInputSources, null, 2))
  
  // 🔥 测试标记：设置 version = 2
  log('\n🔥🔥🔥 [InputPanel] 设置测试标记 version = "2"')
  await configManager.set('version', '2')
  
  // 重要：保存整个 monitorInputSources 对象
  log('\n💾 [InputPanel] 开始保存 monitorInputSources...')
  log('要保存的值:', JSON.stringify(currentConfig.monitorInputSources, null, 2))
  await configManager.set('monitorInputSources', currentConfig.monitorInputSources)
  
  log('\n✅✅✅ [InputPanel] 配置保存完成！')
  
  // 验证保存结果
  const verifyConfig = configManager.getAll()
  log('\n🔍 [InputPanel] 验证保存结果:')
  log('version:', verifyConfig.version)
  log('monitorInputSources:', JSON.stringify(verifyConfig.monitorInputSources, null, 2))
  log('\n========================================')
  log('保存流程结束')
  log('========================================\n')
}

// 监听显示器切换，加载对应的输入源配置
watch(currentMonitorIndex, async () => {
  await loadInputSourcesForCurrentMonitor()
})

// 切换到指定输入源
const switchToInput = async (code) => {
  if (loading.value || monitors.value.length === 0) return
  
  loading.value = true
  try {
    const monitor = monitors.value[currentMonitorIndex.value]
    if (monitor) {
      const result = await window.api.setInput(currentMonitorIndex.value, code)
      console.log('切换输入源结果:', result)
    }
  } catch (err) {
    console.error('切换输入源失败:', err)
  } finally {
    loading.value = false
  }
}

// 开始编辑
const startEdit = (index) => {
  editingIndex.value = index
  editForm.value = { ...inputSources.value[index] }
}

// 保存编辑
const saveEdit = async () => {
  if (!editForm.value.name || !editForm.value.code) return
  
  inputSources.value[editingIndex.value] = {
    name: editForm.value.name,
    code: parseInt(editForm.value.code)
  }
  editingIndex.value = -1
  await saveInputSources()
}

// 取消编辑
const cancelEdit = () => {
  editingIndex.value = -1
  editForm.value = { name: '', code: '' }
}

// 开始添加
const startAdd = () => {
  isAdding.value = true
  addForm.value = { name: '', code: '' }
}

// 保存新增
const saveAdd = async () => {
  if (!addForm.value.name || !addForm.value.code) return
  
  inputSources.value.push({
    name: addForm.value.name,
    code: parseInt(addForm.value.code)
  })
  isAdding.value = false
  addForm.value = { name: '', code: '' }
  await saveInputSources()
}

// 取消添加
const cancelAdd = () => {
  isAdding.value = false
  addForm.value = { name: '', code: '' }
}

// 删除输入源
const deleteSource = async (index) => {
  if (confirm(`确定要删除 "${inputSources.value[index].name}" 吗？`)) {
    inputSources.value.splice(index, 1)
    await saveInputSources()
  }
}

onMounted(async () => {
  await configManager.loadConfig()
  // 先加载显示器列表，然后自动加载对应的输入源配置
  await fetchMonitors()
})
</script>

<template>
  <div class="input-panel">
    <!-- 头部：显示器选择和添加按钮 -->
    <div class="panel-header">
      <div class="monitor-selector">
        <label>选择显示器：</label>
        <select v-model="currentMonitorIndex" class="monitor-dropdown">
          <option v-for="(m, idx) in monitors" :key="idx" :value="idx">
            {{ m.name }}
          </option>
        </select>
      </div>
      
      <button @click="startAdd" class="add-btn" :disabled="isAdding">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        添加输入源
      </button>
    </div>

    <!-- 添加输入源表单 -->
    <div v-if="isAdding" class="add-form-card">
      <h3>添加新输入源</h3>
      <div class="form-row">
        <label>名称：</label>
        <input v-model="addForm.name" type="text" placeholder="例如：HDMI 2" class="form-input" />
      </div>
      <div class="form-row">
        <label>VCP 代码：</label>
        <input v-model="addForm.code" type="number" placeholder="例如：16" class="form-input" />
      </div>
      <div class="form-actions">
        <button @click="saveAdd" class="btn-primary">保存</button>
        <button @click="cancelAdd" class="btn-secondary">取消</button>
      </div>
    </div>

    <!-- 输入源列表 -->
    <div class="sources-container">
      <div v-for="(source, index) in inputSources" :key="index" class="source-card">
        <!-- 显示模式 -->
        <div v-if="editingIndex !== index" class="source-display">
          <div class="source-info">
            <span class="source-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h3l-1 1v2h12v-2l-1-1h3c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 13H4V5h16v11z"/>
              </svg>
            </span>
            <div class="source-details">
              <span class="source-name">{{ source.name }}</span>
              <span class="source-code">代码: {{ source.code }}</span>
            </div>
          </div>
          
          <div class="source-actions">
            <button @click="switchToInput(source.code)" class="action-btn switch-btn" :disabled="loading">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M7 16V4M7 4L3 8M7 4l4 4M17 8v12M17 20l4-4M17 20l-4-4"/>
              </svg>
              切换
            </button>
            <button @click="startEdit(index)" class="action-btn edit-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              编辑
            </button>
          </div>
        </div>

        <!-- 编辑模式 -->
        <div v-else class="source-edit">
          <div class="form-row">
            <label>名称：</label>
            <input v-model="editForm.name" type="text" class="form-input" />
          </div>
          <div class="form-row">
            <label>代码：</label>
            <input v-model="editForm.code" type="number" class="form-input" />
          </div>
          <div class="form-actions">
            <button @click="saveEdit" class="btn-primary">保存</button>
            <button @click="cancelEdit" class="btn-secondary">取消</button>
            <button @click="deleteSource(index)" class="btn-danger">删除</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部提示 -->
    <div class="hint-box">
      <p class="hint-text">
        ⚠️ 请查看说明，每台显示器的接口代码不同，需要根据显示器说明书进行设置。<br/>
        默认：HDMI-16，DP-17，USB-C-18，可修改为您本身的代码。</br>
        如果您不清楚本身显示器的代码，可以从5-30中的范围尝试，然后修改接口对应代码。</br>
        您可以自定义每个接口名称。
      </p>
    </div>
  </div>
</template>

<style scoped>
.input-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  gap: 16px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(102, 126, 234, 0.3) transparent;
}

.input-panel::-webkit-scrollbar {
  width: 8px;
}

.input-panel::-webkit-scrollbar-track {
  background: transparent;
}

.input-panel::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.3);
  border-radius: 4px;
}

/* 头部 */
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.monitor-selector {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.monitor-selector label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.monitor-dropdown {
  flex: 1;
  max-width: 300px;
  padding: 8px 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  color: #1d1d1f;
  cursor: pointer;
  transition: all 0.2s;
}

.monitor-dropdown:hover {
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(102, 126, 234, 0.3);
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.add-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.add-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 添加表单卡片 */
.add-form-card {
  background: rgba(102, 126, 234, 0.05);
  border: 1px solid rgba(102, 126, 234, 0.2);
  border-radius: 12px;
  padding: 16px;
}

.add-form-card h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #667eea;
}

/* 输入源列表 */
.sources-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.source-card {
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  padding: 14px;
  transition: all 0.2s;
}

.source-card:hover {
  background: rgba(255, 255, 255, 0.7);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.source-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.source-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.source-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 10px;
  color: #667eea;
}

.source-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.source-name {
  font-size: 15px;
  font-weight: 600;
  color: #1d1d1f;
}

.source-code {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.5);
}

.source-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.switch-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.switch-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.switch-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.edit-btn {
  background: rgba(0, 0, 0, 0.05);
  color: #374151;
}

.edit-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

/* 编辑表单 */
.source-edit {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-row label {
  min-width: 70px;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.form-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.8);
  font-size: 13px;
  color: #1d1d1f;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  background: white;
}

.form-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 4px;
}

.btn-primary,
.btn-secondary,
.btn-danger {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5568d3;
}

.btn-secondary {
  background: rgba(0, 0, 0, 0.05);
  color: #374151;
}

.btn-secondary:hover {
  background: rgba(0, 0, 0, 0.1);
}

.btn-danger {
  background: #dc2626;
  color: white;
}

.btn-danger:hover {
  background: #b91c1c;
}

/* 提示框 */
.hint-box {
  margin-top: auto;
  padding: 12px;
  background: rgba(220, 38, 38, 0.05);
  border: 1px solid rgba(220, 38, 38, 0.15);
  border-radius: 10px;
}

.hint-text {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: #991b1b;
}

/* 暗色模式 */
@media (prefers-color-scheme: dark) {
  .monitor-selector label,
  .form-row label {
    color: #e5e5e7;
  }

  .monitor-dropdown,
  .form-input {
    background: rgba(60, 60, 65, 0.6);
    border-color: rgba(255, 255, 255, 0.1);
    color: #f5f5f7;
  }

  .source-card {
    background: rgba(60, 60, 65, 0.4);
    border-color: rgba(255, 255, 255, 0.08);
  }

  .source-name {
    color: #f5f5f7;
  }

  .source-code {
    color: rgba(255, 255, 255, 0.5);
  }

  .edit-btn,
  .btn-secondary {
    background: rgba(255, 255, 255, 0.1);
    color: #e5e5e7;
  }

  .edit-btn:hover,
  .btn-secondary:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  .hint-text {
    color: #fca5a5;
  }
}
</style>
