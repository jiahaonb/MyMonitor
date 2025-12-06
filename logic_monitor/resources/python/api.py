import sys
import json
from monitorcontrol import get_monitors

# 定义输入源的 VCP 代码映射
INPUT_SOURCES = {
    "HDMI1": 5,
    "HDMI2": 6,
    "DP1": 7,
    "TYPE-C": 27
}

# VCP 代码定义
VCP_CODES = {
    'POWER': 0xD6,        # 电源状态
    'INPUT_SOURCE': 0x60, # 输入源
    'BRIGHTNESS': 0x10    # 亮度
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
                
                # 尝试获取显示器名称和型号
                monitor_name = f"Monitor {i+1}"
                try:
                    cap_dict = m.get_vcp_capabilities()
                    if cap_dict and 'model' in cap_dict:
                        monitor_name = cap_dict['model']
                except:
                    pass
                
                # 获取支持的 VCP 功能代码
                supported_codes = []
                try:
                    cap_dict = m.get_vcp_capabilities()
                    if cap_dict and 'vcp' in cap_dict:
                        vcp_data = cap_dict['vcp']
                        for code in vcp_data.keys():
                            if isinstance(code, int):
                                supported_codes.append(code)
                            elif isinstance(code, str):
                                try:
                                    supported_codes.append(int(code, 16))
                                except:
                                    pass
                except:
                    pass
                
                info.append({
                    "id": i,
                    "name": monitor_name,
                    "brightness": bri,
                    "supported_codes": list(set(supported_codes)) if supported_codes else []
                })
        except Exception as e:
            info.append({"id": i, "error": str(e)})
    return info

def set_brightness(monitor_index, value):
    monitors = get_monitors()
    if monitor_index < len(monitors):
        with monitors[monitor_index] as m:
            m.set_luminance(int(value))
            return True
    return False

def set_input(monitor_index, source_name):
    monitors = get_monitors()
    if monitor_index < len(monitors) and source_name in INPUT_SOURCES:
        with monitors[monitor_index] as m:
            try:
                m.set_input_source(source_name)
                return True
            except Exception as e:
                return False
    return False

def set_power(monitor_index, power_mode):
    """设置显示器电源状态
    power_mode: 1=On, 4=Standby, 5=Off
    """
    monitors = get_monitors()
    if monitor_index < len(monitors):
        with monitors[monitor_index] as m:
            try:
                m.set_vcp_feature(VCP_CODES['POWER'], power_mode)
                return True
            except Exception as e:
                return False
    return False

def get_supported_features(monitor_index):
    """检测显示器支持的 VCP 功能"""
    monitors = get_monitors()
    supported_codes = []
    
    # 回退检测列表 (如果自动检测失败)
    fallback_codes = [
        0x10, 0x12, 0x13, 0x14, 0x16, 0x18, 0x1A, 
        0x60, 0x62, 0x8D, 0xAA, 0xD6, 
        0x1E, 0x20, 0x30, 0xDC
    ]
    
    if monitor_index < len(monitors):
        try:
            with monitors[monitor_index] as m:
                # 方法 1: 使用 monitorcontrol 内置的 get_vcp_capabilities()
                try:
                    cap_dict = m.get_vcp_capabilities()
                    if cap_dict and 'vcp' in cap_dict:
                        vcp_data = cap_dict['vcp']
                        # vcp_data 是一个字典，key 是 VCP 代码 (通常是 int，但也可能是 str)
                        for code in vcp_data.keys():
                            if isinstance(code, int):
                                supported_codes.append(code)
                            elif isinstance(code, str):
                                # 尝试解析十六进制字符串
                                try:
                                    supported_codes.append(int(code, 16))
                                except:
                                    pass
                        
                        # 如果成功获取到代码，直接返回并去重
                        if supported_codes:
                            return list(set(supported_codes))
                except Exception as e:
                    # 记录错误但不崩溃，尝试回退
                    sys.stderr.write(f"get_vcp_capabilities failed: {e}\n")
                    pass

                # 方法 2: 回退到手动遍历检测
                if not supported_codes:
                    sys.stderr.write("Falling back to manual VCP code testing...\n")
                    for code in fallback_codes:
                        try:
                            m.get_vcp_feature(code)
                            supported_codes.append(code)
                        except:
                            pass
                            
        except Exception as e:
            sys.stderr.write(f"Error opening monitor: {e}\n")
            pass
            
    return list(set(supported_codes))

if __name__ == "__main__":
    args = sys.argv[1:]
    result = {"status": "error", "data": None}

    try:
        if len(args) == 0:
            result = {"status": "success", "data": get_monitor_info()}
            
        elif args[0] == "set_brightness" and len(args) >= 3:
            idx = int(args[1])
            val = int(args[2])
            success = set_brightness(idx, val)
            result = {"status": "success", "data": success}
            
        elif args[0] == "set_input" and len(args) >= 3:
            idx = int(args[1])
            source = args[2]
            success = set_input(idx, source)
            result = {"status": "success", "data": success}

        elif args[0] == "set_power" and len(args) >= 3:
            idx = int(args[1])
            mode = int(args[2])
            success = set_power(idx, mode)
            result = {"status": "success", "data": success}

        elif args[0] == "get_supported_features" and len(args) >= 2:
            idx = int(args[1])
            codes = get_supported_features(idx)
            result = {"status": "success", "data": codes}
            
    except Exception as e:
        result["message"] = str(e)

    print(json.dumps(result))