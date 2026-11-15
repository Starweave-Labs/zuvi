# -*- coding: utf-8 -*-
"""最终渲染脚本：Cycles GPU 高质量出图
运行: blender cake.blend --background --python render_final.py
产出: cake_render.png（1920x1440，只读项目不回写）
"""
import bpy, os

try:
    HERE = os.path.dirname(os.path.abspath(__file__))
except NameError:
    HERE = os.path.abspath(".")

OUT = os.path.join(HERE, "cake_render.png")

scene = bpy.context.scene

# ---------- Cycles GPU（Apple Silicon → Metal） ----------
scene.render.engine = 'CYCLES'
try:
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'METAL'
    prefs.get_devices()
    for d in prefs.devices:
        d.use = True
    scene.cycles.device = 'GPU'
    print("[render] 使用 Metal GPU")
except Exception as e:
    scene.cycles.device = 'CPU'
    print("[render] GPU 不可用，改用 CPU:", e)

scene.cycles.samples = 192
scene.cycles.use_denoising = True

# ---------- 输出设置 ----------
scene.render.resolution_x = 1920
scene.render.resolution_y = 1440
scene.render.filepath = OUT

print("[render] 开始 Cycles 渲染 ...", flush=True)
bpy.ops.render.render(write_still=True)
print("[render] 渲染完成: " + OUT, flush=True)
print("RENDER_DONE")
