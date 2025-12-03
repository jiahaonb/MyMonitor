import sys
import json
from monitorcontrol import get_monitors

# 定义输入源的 VCP 代码映射（标准代码）
INPUT_SOURCES = {
    "HDMI1": 5,
    "HDMI2": 6,
    "DP1": 7,
    "TYPE-C": 27
}

def get_monitor_info():
    """获取所有显示器的信息"""
    monitors = get_monitors()
    info = []
    for i, m in enumerate(monitors):
        try:
            with m:
                # 获取亮度 (VCP 0x10)
                bri = m.get_luminance()
                # 尝试获取当前输入源 (VCP 0x60) - 这里的兼容性视显示器而定
                # input_source = m.get_vcp_feature(0x60).value 
                
                info.append({
                    "id": i,
                    "name": f"Monitor {i+1}",
                    "brightness": bri,
                    # "input_code": input_source
                })
        except Exception as e:
            # 即使出错也不要崩溃，返回错误信息给 UI
            info.append({"id": i, "error": str(e)})
    return info

def set_brightness(monitor_index, value):
    """设置亮度"""
    monitors = get_monitors()
    if monitor_index < len(monitors):
        with monitors[monitor_index] as m:
            m.set_luminance(int(value))
            return True
    return False

def set_input(monitor_index, source_name):
    """切换输入源"""
    monitors = get_monitors()
    if monitor_index < len(monitors) and source_name in INPUT_SOURCES:
        with monitors[monitor_index] as m:
            # 使用 monitorcontrol 的 set_input_source 方法更安全
            # 或者直接发送 VCP: m.set_vcp_feature(0x60, INPUT_SOURCES[source_name])
            try:
                m.set_input_source(source_name)
                return True
            except Exception as e:
                return False
    return False

if __name__ == "__main__":
    # 简单的命令行路由
    args = sys.argv[1:]
    result = {"status": "error", "data": None}

    try:
        if len(args) == 0:
            result = {"status": "success", "data": get_monitor_info()}
            
        elif args[0] == "set_brightness" and len(args) >= 3:
            # python api.py set_brightness 0 50
            idx = int(args[1])
            val = int(args[2])
            success = set_brightness(idx, val)
            result = {"status": "success", "data": success}
            
        elif args[0] == "set_input" and len(args) >= 3:
            # python api.py set_input 0 HDMI1
            idx = int(args[1])
            source = args[2]
            success = set_input(idx, source)
            result = {"status": "success", "data": success}
            
    except Exception as e:
        result["message"] = str(e)

    # 最后统一打印 JSON，确保 Electron 能解析
    print(json.dumps(result))