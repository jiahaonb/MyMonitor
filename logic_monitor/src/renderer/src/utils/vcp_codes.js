export const vcpCodes = {
    // 图像调整
    0x10: { name: '亮度 (Brightness)', desc: '调整屏幕背光亮度', type: 'range', priority: 1 },
    0x12: { name: '对比度 (Contrast)', desc: '调整屏幕对比度', type: 'range' },
    0x13: { name: '背光控制', desc: '直接控制背光硬件', type: 'range' },
    0x14: { name: '颜色选择', desc: '选择预设颜色模式', type: 'enum', values: { 0x01: 'sRGB', 0x02: 'Display Native', 0x03: 'Warm', 0x04: 'Cool', 0x05: 'User', 0x06: 'DCI-P3' } },
    0x16: { name: '视频增益 (红)', desc: '调整红色通道增益', type: 'range' },
    0x18: { name: '视频增益 (绿)', desc: '调整绿色通道增益', type: 'range' },
    0x1A: { name: '视频增益 (蓝)', desc: '调整蓝色通道增益', type: 'range' },
    0x60: { name: '输入源', desc: '选择视频输入接口', type: 'enum', priority: 1, values: { 0x01: 'VGA', 0x03: 'DVI', 0x0F: 'DisplayPort', 0x11: 'HDMI 1', 0x12: 'HDMI 2', 0x15: 'Type-C' } },
    0x62: { name: '音频音量', desc: '调整内置扬声器音量', type: 'range' },
    0x8D: { name: '音频静音', desc: '静音/取消静音', type: 'enum', priority: 2, values: { 0x01: '静音', 0x02: '取消静音' } },
    0xAA: { name: '屏幕方向', desc: '控制屏幕显示方向', type: 'enum', priority: 2, values: { 0x01: '横向', 0x02: '纵向', 0x03: '横向翻转', 0x04: '纵向翻转' } },
    0xD6: { name: '电源状态', desc: '控制显示器电源', type: 'enum', priority: 1, values: { 0x01: '开启', 0x04: '待机', 0x05: '关闭' } },
    // 更多高级功能
    0x1E: { name: '自动设置', desc: '自动调整图像位置和时钟', type: 'action' },
    0x20: { name: '水平位置', desc: '调整图像水平位置', type: 'range' },
    0x30: { name: '垂直位置', desc: '调整图像垂直位置', type: 'range' },
    0x04: { name: '恢复出厂设置', desc: '重置所有设置为默认值', type: 'action' },
    0x05: { name: '恢复亮度/对比度', desc: '重置亮度和对比度', type: 'action' },
    0x08: { name: '恢复颜色设置', desc: '重置颜色相关设置', type: 'action' },
    0xDC: { name: '显示模式', desc: '选择显示预设模式 (Standard, Movie, Game等)', type: 'enum' }
}
