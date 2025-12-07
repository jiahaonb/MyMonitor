// 基于文件系统的配置管理
class FileConfigManager {
    constructor() {
        this.defaultConfig = {
            panelOpacity: 0.9, // 初始透明度90%
            language: 'zh-CN',
            version: '1.0'
        }
        this.config = { ...this.defaultConfig }
    }

    async loadConfig() {
        try {
            const result = await window.api.getConfig()
            console.log('📂 [ConfigManager] 从文件加载配置:', result)
            if (result) {
                this.config = { ...this.defaultConfig, ...result }
            }
            console.log('📂 [ConfigManager] 合并后的config:', this.config)
        } catch (e) {
            console.error('加载配置失败:', e)
            this.config = { ...this.defaultConfig }
        }
        return this.config
    }

    async saveConfig() {
        try {
            const configStr = JSON.stringify(this.config, null, 2)
            console.log('💾 [ConfigManager] 准备保存配置到文件:', configStr)
            if (window.api?.debugLog) {
                window.api.debugLog('💾 [ConfigManager] 准备保存配置到文件:', configStr)
            }

            // 🔥 关键修复：将 this.config 转换为纯 JSON 对象，避免 IPC 序列化错误
            // "An object could not be cloned" 错误是因为 Electron IPC 无法序列化某些对象
            const pureConfig = JSON.parse(JSON.stringify(this.config))

            if (window.api?.debugLog) {
                window.api.debugLog('💾 [ConfigManager] 转换后的纯JSON对象:', JSON.stringify(pureConfig))
            }

            await window.api.saveConfig(pureConfig)
            console.log('✅ [ConfigManager] 配置保存成功')
            if (window.api?.debugLog) {
                window.api.debugLog('✅ [ConfigManager] 配置保存成功')
            }
        } catch (e) {
            console.error('保存配置失败:', e)
            if (window.api?.debugLog) {
                window.api.debugLog('❌ [ConfigManager] 保存配置失败:', e.toString())
            }
        }
    }

    get(key) {
        return this.config[key]
    }

    async set(key, value) {
        console.log(`🔧 [ConfigManager] 设置配置 ${key}:`, value)
        if (window.api?.debugLog) {
            window.api.debugLog(`🔧 [ConfigManager] 设置配置 ${key}:`, JSON.stringify(value))
        }
        this.config[key] = value
        console.log('🔧 [ConfigManager] 更新后的完整config:', this.config)
        if (window.api?.debugLog) {
            window.api.debugLog('🔧 [ConfigManager] 更新后的完整config:', JSON.stringify(this.config))
        }
        await this.saveConfig()
    }

    getAll() {
        return { ...this.config }
    }

    // 获取配置文件路径（用于远程修改）
    async getConfigPath() {
        try {
            return await window.api.getConfigPath()
        } catch (e) {
            console.error('获取配置路径失败:', e)
            return null
        }
    }
}

export const configManager = new FileConfigManager()
