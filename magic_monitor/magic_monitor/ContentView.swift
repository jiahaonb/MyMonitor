import SwiftUI

struct ContentView: View {
    // 这里的 @State 就像是临时的记事本，用来记录滑块当前的数值
    // 0.5 代表 50% 的亮度
    @State private var brightness: Double = 0.5
    @State private var volume: Double = 0.3
    
    var body: some View {
        VStack(spacing: 20) {
            // 标题部分
            HStack {
                Text("显示器控制")
                    .font(.headline)
                    .foregroundColor(.secondary)
                Spacer()
                // 一个假的设置按钮
                Image(systemName: "gearshape")
                    .foregroundColor(.gray)
            }
            
            // --- 亮度控制模块 ---
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(systemName: "sun.max.fill") // 小太阳图标
                        .foregroundColor(.gray)
                    Text("亮度: \(Int(brightness * 100))%")
                        .font(.caption)
                        .monospacedDigit() // 让数字跳动时不抖动
                }
                
                // 滑块控件
                Slider(value: $brightness, in: 0...1)
                    .tint(.white) // 滑条颜色，你可以改成 .blue 或其他
            }
            
            // --- 音量控制模块 ---
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(systemName: "speaker.wave.2.fill") // 小喇叭图标
                        .foregroundColor(.gray)
                    Text("音量: \(Int(volume * 100))%")
                        .font(.caption)
                        .monospacedDigit()
                }
                
                Slider(value: $volume, in: 0...1)
                    .tint(.white)
            }
        }
        .padding(20) // 给内容留点呼吸空间
        // ------------------------------------------------
        // 【核心魔法】下面这行代码实现了你要的“毛玻璃”效果
        // .ultraThinMaterial 是最薄的磨砂，透视感最强
        // ------------------------------------------------
        .background(.ultraThinMaterial)
    }
}

// 这是预览代码，让你不用运行就能在右边看到效果
#Preview {
    ContentView()
        .frame(width: 300, height: 200)
}
