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
            if (result) {
                this.config = { ...this.defaultConfig, ...result }
            }
        } catch (e) {
            console.error('加载配置失败:', e)
            this.config = { ...this.defaultConfig }
        }
        return this.config
    }

    async saveConfig() {
        try {
            // 转换为纯 JSON 对象，避免 IPC 序列化错误
            const pureConfig = JSON.parse(JSON.stringify(this.config))
            await window.api.saveConfig(pureConfig)
        } catch (e) {
            console.error('保存配置失败:', e)
        }
    }

    get(key) {
        return this.config[key]
    }

    async set(key, value) {
        this.config[key] = value
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
