import SwiftUI

@main
struct MyBetterDisplayApp: App {
    var body: some Scene {
        // MenuBarExtra 是 macOS 13.0+ 的新特性，非常适合做这种工具
        // "display" 是系统自带的显示器小图标
        MenuBarExtra("MyDisplay", systemImage: "display") {
            ContentView()
                .frame(width: 300, height: 180) // 设定一下小窗口的大小
        }
        .menuBarExtraStyle(.window) // 关键点：设置为 .window 样式，才能显示复杂的 UI
    }
}
