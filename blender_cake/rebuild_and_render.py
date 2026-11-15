# -*- coding: utf-8 -*-
"""恢复重建 + 最终渲染（后台）
运行: blender --background --python rebuild_and_render.py
流程: 以固定种子重建场景(=原 build + adjust 的最终状态) → 保存 cake.blend → Cycles 渲染 cake_render.png
"""
import bpy, math, os, random, colorsys
from mathutils import Vector, Quaternion

random.seed(11)

try:
    HERE = os.path.dirname(os.path.abspath(__file__))
except NameError:
    HERE = os.path.abspath(".")

PROJECT = os.path.join(HERE, "cake.blend")
RENDER_OUT = os.path.join(HERE, "cake_render.png")

def log(msg):
    print("[rebuild]", msg, flush=True)

# =====================================================================
# 阶段 A：重建基础场景（与原 build_cake.py 逐位一致）
# =====================================================================
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene

def principled(m):
    for n in m.node_tree.nodes:
        if n.type == 'BSDF_PRINCIPLED':
            return n
    raise RuntimeError("未找到 Principled BSDF 节点")

def inp(node, ident):
    for s in node.inputs:
        if s.identifier == ident:
            return s
    raise KeyError(f"socket identifier 不存在: {ident}")

def mat(name, color, rough=0.5, metal=0.0, emis=None, emis_str=10.0, coat=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = principled(m)
    inp(b, "Base Color").default_value = (*color, 1.0)
    inp(b, "Roughness").default_value = rough
    inp(b, "Metallic").default_value = metal
    if coat:
        inp(b, "Coat Weight").default_value = coat
    if emis:
        inp(b, "Emission Color").default_value = (*emis, 1.0)
        inp(b, "Emission Strength").default_value = emis_str
    return m

M = {
    "sponge":   mat("海绵蛋糕", (0.86, 0.63, 0.32), 0.85),
    "choco":    mat("巧克力层", (0.23, 0.11, 0.06), 0.5),
    "cream":    mat("奶油", (0.97, 0.93, 0.85), 0.55),
    "frosting": mat("糖霜", (0.99, 0.82, 0.87), 0.42),
    "cherry":   mat("樱桃", (0.55, 0.04, 0.06), 0.15, coat=0.6),
    "plate":    mat("瓷盘", (0.93, 0.93, 0.95), 0.22),
    "ground":   mat("桌面", (0.72, 0.67, 0.60), 0.9),
    "flame":    mat("火苗", (1.0, 0.75, 0.3), 1.0, emis=(1.0, 0.45, 0.08), emis_str=40),
    "candle_pink": mat("蜡烛粉", (1.0, 0.62, 0.72), 0.35),
    "candle_blue": mat("蜡烛蓝", (0.55, 0.72, 0.98), 0.35),
    "candle_mint": mat("蜡烛薄荷", (0.58, 0.95, 0.78), 0.35),
}
candle_mats = [M["candle_pink"], M["candle_blue"], M["candle_mint"]]

def smooth_auto(o, angle_deg=30):
    try:
        bpy.ops.object.shade_auto_smooth(angle=math.radians(angle_deg))
    except Exception:
        for p in o.data.polygons:
            p.use_smooth = True

def cyl(name, r, depth, z, m, verts=64):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth, location=(0, 0, z))
    o = bpy.context.active_object
    o.name = name
    o.data.materials.append(m)
    smooth_auto(o)
    return o

def sphere(name, r, loc, m, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=r, location=loc)
    o = bpy.context.active_object
    o.name = name
    o.scale = scale
    o.data.materials.append(m)
    smooth_auto(o)
    return o

bpy.ops.mesh.primitive_plane_add(size=26, location=(0, 0, -0.001))
ground = bpy.context.active_object
ground.name = "桌面"
ground.data.materials.append(M["ground"])

cyl("瓷盘", 3.0, 0.12, 0.06, M["plate"])

cyl("底层蛋糕", 2.40, 0.90, 0.57, M["sponge"])
cyl("奶油层1",  2.55, 0.18, 1.10, M["cream"])
cyl("中层蛋糕", 2.00, 0.80, 1.58, M["choco"])
cyl("奶油层2",  2.15, 0.16, 2.05, M["cream"])
cyl("顶层蛋糕", 1.70, 0.70, 2.47, M["sponge"])

DOME_Z, DOME_RX, DOME_RZ = 2.82, 1.75, 0.9625
sphere("糖霜穹顶", DOME_RX, (0, 0, DOME_Z), M["frosting"], scale=(1, 1, DOME_RZ / DOME_RX))

def dome_z(r):
    return DOME_Z + DOME_RZ * math.sqrt(max(0.0, 1.0 - (r / DOME_RX) ** 2))

for i in range(9):
    a = random.uniform(0, 2 * math.pi)
    sphere(f"糖霜滴{i}", 0.16, (1.72 * math.cos(a), 1.72 * math.sin(a), 2.80),
           M["frosting"], scale=(0.5, 0.5, 1.5))

for i in range(20):
    a = random.uniform(0, 2 * math.pi)
    r0 = random.uniform(0.10, 0.16)
    sphere(f"奶油珠{i}", r0, (2.48 * math.cos(a), 2.48 * math.sin(a), 1.16), M["cream"])

cherry_pos = [(0.95, 15), (1.30, 80), (1.10, 150), (1.28, 225), (1.00, 300)]
for j, (r0, deg) in enumerate(cherry_pos):
    a = math.radians(deg)
    sphere(f"樱桃{j}", 0.15, (r0 * math.cos(a), r0 * math.sin(a), dome_z(r0) + 0.08), M["cherry"])
for j, deg in enumerate((45, 165, 285)):
    a = math.radians(deg)
    sphere(f"围边樱桃{j}", 0.15, (1.92 * math.cos(a), 1.92 * math.sin(a), 2.26), M["cherry"])

for i in range(30):
    a = random.uniform(0, 2 * math.pi)
    r0 = random.uniform(0.25, 1.45)
    x, y = r0 * math.cos(a), r0 * math.sin(a)
    z = dome_z(r0) + 0.03
    n = Vector((x / DOME_RX ** 2, y / DOME_RX ** 2, (z - DOME_Z) / DOME_RZ ** 2)).normalized()
    q = Vector((0, 0, 1)).rotation_difference(n)
    h = random.random()
    col = colorsys.hsv_to_rgb(h, 0.75, 0.95)
    mkey = f"糖针{int(h * 6)}"
    m = M.get(mkey) or mat(mkey, col, 0.4)
    M[mkey] = m
    o = cyl(f"糖针{i}", 0.018, 0.085, 0, m, verts=12)
    o.location = (x, y, z)
    o.rotation_mode = 'QUATERNION'
    o.rotation_quaternion = q

for j, deg in enumerate((90, 210, 330)):
    a = math.radians(deg)
    x, y = 0.5 * math.cos(a), 0.5 * math.sin(a)
    base = dome_z(0.5)
    tilt = random.uniform(-0.08, 0.08)
    c = cyl(f"蜡烛{j}", 0.06, 0.55, 0, candle_mats[j % 3], verts=24)
    c.location = (x, y, base + 0.22)
    c.rotation_euler = (tilt, tilt * 0.6, 0)
    top = base + 0.495
    sphere(f"火苗{j}", 0.055, (x, y, top + 0.05), M["flame"], scale=(0.7, 0.7, 1.5))

def look_at(loc, target):
    d = Vector(target) - Vector(loc)
    return d.to_track_quat('-Z', 'Y').to_euler()

sun_data = bpy.data.lights.new("阳光", type='SUN')
sun_data.energy = 3.0
sun_data.angle = math.radians(2)
sun = bpy.data.objects.new("阳光", sun_data)
scene.collection.objects.link(sun)
sun.location = (-3, -7, 9)
sun.rotation_euler = look_at(sun.location, (0, 0, 1))

def area(name, loc, size, energy, target=(0, 0, 1.8)):
    d = bpy.data.lights.new(name, type='AREA')
    d.size = size
    d.energy = energy
    o = bpy.data.objects.new(name, d)
    scene.collection.objects.link(o)
    o.location = loc
    o.rotation_euler = look_at(loc, target)
    return o

area("主光", (5.5, -5.5, 6.5), 6.0, 700)
area("辅光", (-6.5, -2.5, 4.0), 8.0, 260)
area("轮廓光", (1.5, 7.0, 5.0), 5.0, 320)

tgt = bpy.data.objects.new("相机目标", None)
scene.collection.objects.link(tgt)
tgt.location = (0, 0, 1.85)

cam_data = bpy.data.cameras.new("相机")
cam_data.lens = 50
cam = bpy.data.objects.new("相机", cam_data)
scene.collection.objects.link(cam)
cam.location = (7.6, -7.6, 5.0)
con = cam.constraints.new(type='TRACK_TO')
con.target = tgt
con.track_axis = 'TRACK_NEGATIVE_Z'
con.up_axis = 'UP_Y'
scene.camera = cam

world = bpy.data.worlds.new("环境")
scene.world = world
world.use_nodes = True
bg = next(n for n in world.node_tree.nodes if n.type == 'BACKGROUND')
inp(bg, "Color").default_value = (0.85, 0.83, 0.80, 1.0)
inp(bg, "Strength").default_value = 0.45

# 项目文件保留 EEVEE 预览配置（与原 cake.blend 一致）
try:
    scene.render.engine = 'BLENDER_EEVEE_NEXT'
except Exception:
    scene.render.engine = 'BLENDER_EEVEE'
scene.eevee.taa_render_samples = 64
scene.render.resolution_x = 1280
scene.render.resolution_y = 960

log("阶段 A 完成：场景重建")
log("对象数: %d" % len(bpy.data.objects))

# =====================================================================
# 阶段 B：应用第 2 轮调整（与原 adjust_cake.py 逐位一致）
# =====================================================================
random.seed(23)

def set_color(mat_name, color, rough=None, emis=None, emis_str=None):
    m = bpy.data.materials.get(mat_name)
    if m is None:
        log(f"警告: 材质 {mat_name} 不存在，跳过")
        return
    b = principled(m)
    inp(b, "Base Color").default_value = (*color, 1.0)
    if rough is not None:
        inp(b, "Roughness").default_value = rough
    if emis is not None:
        inp(b, "Emission Color").default_value = (*emis, 1.0)
    if emis_str is not None:
        inp(b, "Emission Strength").default_value = emis_str

set_color("糖霜", (1.0, 0.70, 0.78), rough=0.38)
set_color("火苗", (1.0, 0.45, 0.10), emis=(1.0, 0.30, 0.02), emis_str=14)
set_color("蜡烛粉", (1.0, 0.50, 0.62))
set_color("蜡烛蓝", (0.42, 0.60, 0.95))
set_color("蜡烛薄荷", (0.45, 0.85, 0.65))
set_color("桌面", (0.78, 0.72, 0.64))

fixed = 0
for o in bpy.data.objects:
    if o.name.startswith("糖霜滴"):
        d = math.atan2(o.location.y, o.location.x)
        o.location = (1.68 * math.cos(d), 1.68 * math.sin(d), 2.74)
        o.scale = (0.45, 0.45, 1.5)
        fixed += 1

fl = 0
for o in bpy.data.objects:
    if o.name.startswith("火苗"):
        o.scale = (0.55, 0.55, 1.2)
        fl += 1

added = 0
for i in range(14):
    a = random.uniform(0, 2 * math.pi)
    r0 = random.uniform(0.30, 1.50)
    x, y = r0 * math.cos(a), r0 * math.sin(a)
    z = dome_z(r0) + 0.035
    n = Vector((x / DOME_RX ** 2, y / DOME_RX ** 2, (z - DOME_Z) / DOME_RZ ** 2)).normalized()
    q = Vector((0, 0, 1)).rotation_difference(n)
    h = random.random()
    col = colorsys.hsv_to_rgb(h, 0.80, 0.95)
    mkey = f"糖针2_{int(h * 6)}"
    m = bpy.data.materials.get(mkey)
    if m is None:
        m = bpy.data.materials.new(mkey)
        m.use_nodes = True
        b = principled(m)
        inp(b, "Base Color").default_value = (*col, 1.0)
        inp(b, "Roughness").default_value = 0.4
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.022, depth=0.10, location=(0, 0, 0))
    o = bpy.context.active_object
    o.name = f"糖针B{i}"
    o.data.materials.append(m)
    smooth_auto(o)
    o.location = (x, y, z)
    o.rotation_mode = 'QUATERNION'
    o.rotation_quaternion = q
    added += 1

log("阶段 B 完成：糖霜滴重定位 %d 个, 火苗缩小 %d 个, 新增糖针 %d 个" % (fixed, fl, added))

# =====================================================================
# 阶段 C：保存项目 + Cycles 高质量渲染
# =====================================================================
log("保存项目: " + PROJECT)
bpy.ops.wm.save_as_mainfile(filepath=PROJECT)

scene.render.engine = 'CYCLES'
try:
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'METAL'
    prefs.get_devices()
    for d in prefs.devices:
        d.use = True
    scene.cycles.device = 'GPU'
    log("使用 Metal GPU")
except Exception as e:
    scene.cycles.device = 'CPU'
    log("GPU 不可用，改用 CPU: %s" % e)

scene.cycles.samples = 192
scene.cycles.use_denoising = True
scene.render.resolution_x = 1920
scene.render.resolution_y = 1440
scene.render.filepath = RENDER_OUT

log("开始 Cycles 渲染 ...")
bpy.ops.render.render(write_still=True)
log("渲染完成: " + RENDER_OUT)
print("RENDER_DONE")
