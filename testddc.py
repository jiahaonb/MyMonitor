from monitorcontrol import get_monitors

def list_supported_vcp_codes():
    for i, monitor in enumerate(get_monitors()):
        print(f"=== 显示器 {i+1} 信息 ===")
        with monitor:
            # 1. 获取能力对象
            # 这会自动发送 DDC 指令获取字符串并解析为 Python 字典
            cap_dict = monitor.get_vcp_capabilities()
            
            # 2. 提取 'vcp' 字段，这里面是支持的代码列表
            # 注意：有些显示器返回的格式可能略有不同，需要做容错处理
            vcp_codes = cap_dict.get('vcp')

            # print(vcp_codes)
            
            if vcp_codes:
                print("【该显示器声明支持的 VCP 代码列表】:")
                
                # vcp_codes 通常是一个字典或列表，我们把它整理成 Hex 格式 (如 0x10)
                # 能够支持的代码通常作为 key 存在
                sorted_codes = sorted(list(vcp_codes.keys()), key=lambda x: int(str(x), 16) if isinstance(x, str) else x)
                
                # 格式化输出，每行打印 10 个
                display_list = []
                for code in sorted_codes:
                    # 确保格式是漂亮的 16 进制
                    if isinstance(code, int):
                        hex_code = f"{code:02X}"
                    else:
                        hex_code = str(code).upper()
                    display_list.append(hex_code)
                
                print(" ".join(display_list))
                
                # 打印详细结构（有些代码带有允许的参数值，比如输入源）
                print("\n【详细参数结构 (部分代码包含可选值)】:")
                print(vcp_codes)
            else:
                print("未能解析到 VCP 代码列表，可能是显示器未正确声明 Capabilities String。")
            
            # 3. 打印原始字符串（用于调试）
            print("\n【原始能力字符串】:")
            print(monitor.vcp.get_capabilities())

if __name__ == "__main__":
    try:
        list_supported_vcp_codes()
    except Exception as e:
        print(f"发生错误: {e}")