import {
  BufferGeometry,
  ClampToEdgeWrapping,
  Color,
  Curve,
  DataTexture,
  DoubleSide,
  DynamicDrawUsage,
  Float32BufferAttribute,
  Group,
  InstancedBufferAttribute,
  InstancedMesh,
  LinearFilter,
  LinearMipmapLinearFilter,
  LineBasicMaterial,
  LineSegments,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  OrthographicCamera,
  PlaneGeometry,
  Quaternion,
  RedFormat,
  RepeatWrapping,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  TubeGeometry,
  UnsignedByteType,
  Vector3,
  WebGLRenderer,
} from 'three';
import {
  buildGlobeArc,
  coordinateToVector,
  globeRadius,
  normalizeGlobeView,
  projectGlobePoint,
  sanitizeArcs,
  sanitizePoints,
} from './globe-geometry';
import type { GlobeVector } from './globe-geometry';
import { GLOBE_COASTLINES, GLOBE_LAND_POLYGONS } from './globe-geography';
import type {
  GlobePalette,
  GlobeProjectedPoint,
  GlobeRenderer,
  GlobeRendererSnapshot,
} from './globe-renderer-types';
import type { GlobeArc, GlobePoint } from './globe-types';

const DEG = Math.PI / 180;
const MASK_WIDTH = 1024;
const MASK_HEIGHT = 512;

const surfaceVertex = /* glsl */ `
  varying vec3 vSphereNormal;
  varying vec3 vViewNormal;
  void main() {
    vSphereNormal = normal;
    vViewNormal = normalMatrix * normal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const surfaceFragment = /* glsl */ `
  uniform sampler2D uLandMask;
  uniform vec3 uOcean;
  uniform vec3 uLand;
  uniform vec3 uAtmosphere;
  varying vec3 vSphereNormal;
  varying vec3 vViewNormal;
  void main() {
    vec3 geographic = normalize(vSphereNormal);
    vec3 n = normalize(vViewNormal);
    vec2 uv = vec2(atan(geographic.x, geographic.z) / 6.28318530718 + 0.5,
                   asin(clamp(geographic.y, -1.0, 1.0)) / 3.14159265359 + 0.5);
    float land = smoothstep(0.18, 0.82, texture2D(uLandMask, uv).r);
    vec3 light = normalize(vec3(-0.45, 0.65, 1.0));
    float diffuse = max(0.0, dot(n, light));
    float facing = max(0.0, n.z);
    float fresnel = pow(1.0 - facing, 3.2);
    float detail = sin(geographic.x * 72.0 + geographic.y * 38.0)
                 * sin(geographic.z * 55.0 - geographic.y * 28.0) * 0.012;
    vec3 ocean = uOcean * (0.58 + 0.40 * diffuse + detail);
    vec3 ground = uLand * (0.68 + 0.32 * diffuse + detail);
    float sheen = pow(max(0.0, dot(reflect(-light, n), vec3(0.0, 0.0, 1.0))), 38.0);
    ocean += mix(uOcean, vec3(1.0), 0.40) * sheen * 0.12;
    vec3 color = mix(ocean, ground, land);
    color = mix(color, uAtmosphere, fresnel * 0.24);
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;
const haloVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const atmosphereFragment = /* glsl */ `
  uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    float r = length(vUv * 2.0 - 1.0) * 1.10;
    float alpha = (1.0 - smoothstep(1.005, 1.075, r)) * smoothstep(0.99, 1.012, r) * 0.34;
    if (alpha < 0.001) discard;
    gl_FragColor = vec4(uColor, alpha);
    #include <colorspace_fragment>
  }
`;
const pointVertex = /* glsl */ `
  varying vec3 vColor;
  varying vec3 vNormal;
  varying float vFront;
  void main() {
    vec3 anchor = instanceMatrix[3].xyz;
    vFront = (mat3(modelViewMatrix) * normalize(anchor)).z;
    vNormal = normalMatrix * mat3(instanceMatrix) * normal;
    vColor = instanceColor;
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  }
`;
const pointFragment = /* glsl */ `
  varying vec3 vColor;
  varying vec3 vNormal;
  varying float vFront;
  void main() {
    if (vFront <= 0.0000001) discard;
    float highlight = pow(max(0.0, normalize(vNormal).z), 3.0);
    gl_FragColor = vec4(mix(vColor, vec3(1.0), 0.25 + highlight * 0.55), 1.0);
    #include <colorspace_fragment>
  }
`;
const ringVertex = /* glsl */ `
  attribute float aSelected;
  varying vec2 vUv;
  varying vec3 vColor;
  varying float vSelected;
  varying float vFront;
  void main() {
    vUv = uv;
    vColor = instanceColor;
    vSelected = aSelected;
    vFront = (mat3(modelViewMatrix) * normalize(instanceMatrix[3].xyz)).z;
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  }
`;
const ringFragment = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vColor;
  varying float vSelected;
  varying float vFront;
  void main() {
    if (vFront <= 0.0000001) discard;
    float r = length(vUv * 2.0 - 1.0);
    float inner = 1.0 - smoothstep(0.028, 0.065, abs(r - 0.46));
    float outer = 1.0 - smoothstep(0.020, 0.054, abs(r - 0.76));
    float glow = exp(-r * r * 5.5) * 0.20;
    float alpha = glow + inner * 0.65 + outer * (0.18 + vSelected * 0.70);
    alpha *= smoothstep(0.0, 0.13, vFront);
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(mix(vColor, vec3(1.0), vSelected * 0.22), alpha);
    #include <colorspace_fragment>
  }
`;
const travelGlowFragment = /* glsl */ `
  uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    float r = length(vUv * 2.0 - 1.0);
    float alpha = exp(-r * r * 5.0) * (1.0 - smoothstep(0.65, 1.0, r)) * 0.62;
    if (alpha < 0.003) discard;
    gl_FragColor = vec4(mix(uColor, vec3(1.0), 0.25), alpha);
    #include <colorspace_fragment>
  }
`;

/** A one-channel land mask, rasterized from actual polygon rings without a 2D context. */
function rasterizeLand(): Uint8Array {
  const mask = new Uint8Array(MASK_WIDTH * MASK_HEIGHT);
  for (const polygon of GLOBE_LAND_POLYGONS) {
    let south = 90;
    let north = -90;
    for (const ring of polygon) {
      for (let i = 1; i < ring.length; i += 2) {
        south = Math.min(south, ring[i]);
        north = Math.max(north, ring[i]);
      }
    }
    const firstRow = Math.max(0, Math.ceil(((south + 90) / 180) * MASK_HEIGHT - 0.5));
    const lastRow = Math.min(MASK_HEIGHT - 1, Math.floor(((north + 90) / 180) * MASK_HEIGHT - 0.5));
    const crossings: number[] = [];
    for (let y = firstRow; y <= lastRow; y++) {
      crossings.length = 0;
      const latitude = ((y + 0.5) / MASK_HEIGHT) * 180 - 90;
      for (const ring of polygon) {
        for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
          const ay = ring[j + 1];
          const by = ring[i + 1];
          if (ay > latitude !== by > latitude) {
            const longitude = ring[j] + ((ring[i] - ring[j]) * (latitude - ay)) / (by - ay);
            crossings.push(((longitude + 180) / 360) * MASK_WIDTH);
          }
        }
      }
      crossings.sort((a, b) => a - b);
      // Even/odd filling preserves holes, including the Caspian Sea.
      for (let i = 0; i + 1 < crossings.length; i += 2) {
        const left = Math.max(0, Math.ceil(crossings[i] - 0.5));
        const right = Math.min(MASK_WIDTH, Math.ceil(crossings[i + 1] - 0.5));
        mask.fill(255, y * MASK_WIDTH + left, y * MASK_WIDTH + right);
      }
    }
  }
  return mask;
}

function geographicLines(kind: 'coast' | 'grid'): BufferGeometry {
  const vertices: number[] = [];
  const radius = kind === 'coast' ? 1.004 : 1.002;
  const segment = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const delta = lon2 - lon1;
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(lat2 - lat1), Math.abs(delta)) / 2));
    let previous = coordinateToVector(lat1, lon1, radius);
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const next = coordinateToVector(lat1 + (lat2 - lat1) * t, lon1 + delta * t, radius);
      vertices.push(...previous, ...next);
      previous = next;
    }
  };
  if (kind === 'coast') {
    for (const ring of GLOBE_COASTLINES) {
      for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
        const lon1 = ring[j],
          lat1 = ring[j + 1],
          lon2 = ring[i],
          lat2 = ring[i + 1];
        // Map closure meridians/polar edges are not physical coastline.
        if ((Math.abs(lon1) === 180 && lon1 === lon2) || (lat1 === -90 && lat2 === -90)) continue;
        if (Math.abs(lon2 - lon1) > 180) continue;
        segment(lat1, lon1, lat2, lon2);
      }
    }
  } else {
    for (let latitude = -60; latitude <= 60; latitude += 30) {
      for (let longitude = -180; longitude < 180; longitude += 2)
        segment(latitude, longitude, latitude, longitude + 2);
    }
    for (let longitude = -180; longitude < 180; longitude += 30) {
      for (let latitude = -90; latitude < 90; latitude += 2)
        segment(latitude, longitude, latitude + 2, longitude);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
  geometry.computeBoundingSphere();
  return geometry;
}

/** No browser globals, contexts, textures, or animation loops are created on module import. */
export function createGlobeRenderer(canvas: HTMLCanvasElement): GlobeRenderer {
  const resources = new Set<{ dispose: () => void }>();
  const own = <T extends { dispose: () => void }>(resource: T): T => {
    resources.add(resource);
    return resource;
  };
  const release = (resource: { dispose: () => void }) => {
    resource.dispose();
    resources.delete(resource);
  };
  let renderer: WebGLRenderer | undefined;
  let disposed = false;
  const cleanup = () => {
    if (disposed) return;
    disposed = true;
    for (const resource of resources) resource.dispose();
    resources.clear();
    if (renderer) {
      // Three removes its canvas/context listeners before intentionally losing
      // the context. Scene, not this renderer, owns context-loss reinitialization.
      renderer.renderLists.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    }
  };

  try {
    renderer = new WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
    });
    const webgl = renderer;
    webgl.outputColorSpace = SRGBColorSpace;
    webgl.setClearColor(0x000000, 0);
    // Three normally logs shader failures and continues with a blank scene.
    // Throw instead so the owner can activate its geographic fallback.
    webgl.debug.onShaderError = (gl, program, vertex, fragment) => {
      const details = [
        gl.getProgramInfoLog(program),
        gl.getShaderInfoLog(vertex),
        gl.getShaderInfoLog(fragment),
      ]
        .filter(Boolean)
        .join('\n');
      throw new Error(`Globe shader compilation failed${details ? `: ${details}` : '.'}`);
    };
    const scene = new Scene();
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 20);
    camera.position.z = 5;
    const world = new Group();
    scene.add(world);
    const rotation = new Matrix4();
    const longitudeRotation = new Matrix4();
    const billboardRotation = new Quaternion();
    const scratchObject = new Object3D();
    const scratchPosition = new Vector3();
    const north = new Vector3(0, 0, 1);
    const colors = new Map<string, Color>();
    const color = (css: string, fallback = '#56b8dd'): Color => {
      const key = typeof css === 'string' && css.trim() ? css : fallback;
      const cached = colors.get(key);
      if (cached) return cached;
      const next = new Color().setStyle(key);
      if (colors.size >= 256) colors.clear();
      colors.set(key, next);
      return next;
    };
    const landMask = own(
      new DataTexture(rasterizeLand(), MASK_WIDTH, MASK_HEIGHT, RedFormat, UnsignedByteType)
    );
    landMask.minFilter = LinearMipmapLinearFilter;
    landMask.magFilter = LinearFilter;
    landMask.wrapS = RepeatWrapping;
    landMask.wrapT = ClampToEdgeWrapping;
    landMask.generateMipmaps = true;
    landMask.needsUpdate = true;
    const surface = own(
      new ShaderMaterial({
        vertexShader: surfaceVertex,
        fragmentShader: surfaceFragment,
        uniforms: {
          uLandMask: { value: landMask },
          uOcean: { value: new Color() },
          uLand: { value: new Color() },
          uAtmosphere: { value: new Color() },
        },
      })
    );
    world.add(new Mesh(own(new SphereGeometry(1, 128, 80)), surface));
    const gridMaterial = own(
      new LineBasicMaterial({
        transparent: true,
        opacity: 0.14,
        depthWrite: false,
        toneMapped: false,
      })
    );
    const grid = new LineSegments(own(geographicLines('grid')), gridMaterial);
    grid.renderOrder = 1;
    world.add(grid);
    const coastMaterial = own(
      new LineBasicMaterial({
        transparent: true,
        opacity: 0.52,
        depthWrite: false,
        toneMapped: false,
      })
    );
    const coasts = new LineSegments(own(geographicLines('coast')), coastMaterial);
    coasts.renderOrder = 2;
    world.add(coasts);
    const atmosphere = own(
      new ShaderMaterial({
        vertexShader: haloVertex,
        fragmentShader: atmosphereFragment,
        uniforms: { uColor: { value: new Color() } },
        transparent: true,
        depthWrite: false,
      })
    );
    const atmosphereMesh = new Mesh(own(new PlaneGeometry(2.2, 2.2)), atmosphere);
    atmosphereMesh.position.z = -1.1;
    atmosphereMesh.renderOrder = 0;
    scene.add(atmosphereMesh);

    const pointGeometry = own(new SphereGeometry(1, 16, 10));
    const pointMaterial = own(
      new ShaderMaterial({ vertexShader: pointVertex, fragmentShader: pointFragment })
    );
    const ringMaterial = own(
      new ShaderMaterial({
        vertexShader: ringVertex,
        fragmentShader: ringFragment,
        transparent: true,
        depthWrite: false,
        side: DoubleSide,
      })
    );
    const travelGeometry = own(new SphereGeometry(1, 12, 8));
    const travelHaloGeometry = own(new PlaneGeometry(2, 2));
    interface PointInstances {
      cores: InstancedMesh;
      rings: InstancedMesh;
      ringGeometry: PlaneGeometry;
      selected: InstancedBufferAttribute;
      capacity: number;
    }
    const createPointInstances = (capacity: number): PointInstances => {
      const ringGeometry = own(new PlaneGeometry(2, 2));
      const selected = new InstancedBufferAttribute(new Float32Array(capacity), 1).setUsage(
        DynamicDrawUsage
      );
      ringGeometry.setAttribute('aSelected', selected);
      const cores = own(new InstancedMesh(pointGeometry, pointMaterial, capacity));
      const rings = own(new InstancedMesh(ringGeometry, ringMaterial, capacity));
      cores.instanceMatrix.setUsage(DynamicDrawUsage);
      rings.instanceMatrix.setUsage(DynamicDrawUsage);
      // Allocate instance colors before the first shader compile.
      cores.setColorAt(0, color('#ffffff'));
      rings.setColorAt(0, color('#ffffff'));
      cores.count = rings.count = 0;
      cores.frustumCulled = rings.frustumCulled = false;
      rings.renderOrder = 4;
      world.add(cores, rings);
      return { cores, rings, ringGeometry, selected, capacity };
    };
    let instances = createPointInstances(1);
    let points: GlobePoint[] = [];
    let pointInput: readonly GlobePoint[] | undefined;
    let arcInput: readonly GlobeArc[] | undefined;
    let selectedId: string | null | undefined;
    let lastPalette: GlobePalette | undefined;
    let width = 0,
      height = 0,
      pixelRatio = 1;
    let projectionWidth = -1,
      projectionHeight = -1;
    let projectionLatitude = NaN,
      projectionLongitude = NaN,
      projectionZoom = NaN;
    let projected: GlobeProjectedPoint[] = [];
    let projectionDirty = true;

    const updatePointInstances = (
      next: GlobePoint[],
      palette: GlobePalette,
      dataChanged: boolean,
      colorChanged: boolean,
      selectionChanged: boolean
    ) => {
      const capacityChanged =
        next.length > instances.capacity || (dataChanged && next.length < instances.capacity / 4);
      if (capacityChanged) {
        world.remove(instances.cores, instances.rings);
        release(instances.cores);
        release(instances.rings);
        release(instances.ringGeometry);
        instances = createPointInstances(2 ** Math.ceil(Math.log2(Math.max(1, next.length))));
        dataChanged = colorChanged = selectionChanged = true;
      }
      instances.cores.count = instances.rings.count = next.length;
      for (let index = 0; index < next.length; index++) {
        const point = next[index];
        // A replacement buffer needs every transform, including unchanged points.
        const previous = capacityChanged ? undefined : points[index];
        if (
          dataChanged &&
          (!previous ||
            previous.latitude !== point.latitude ||
            previous.longitude !== point.longitude ||
            previous.size !== point.size)
        ) {
          const position = coordinateToVector(point.latitude, point.longitude, 1.006);
          scratchObject.position.set(...position);
          scratchObject.quaternion.identity();
          scratchObject.scale.setScalar(point.size!);
          scratchObject.updateMatrix();
          instances.cores.setMatrixAt(index, scratchObject.matrix);
          scratchPosition.set(...coordinateToVector(point.latitude, point.longitude));
          scratchObject.quaternion.setFromUnitVectors(north, scratchPosition);
          scratchObject.scale.setScalar(point.size! * 3);
          scratchObject.updateMatrix();
          instances.rings.setMatrixAt(index, scratchObject.matrix);
        }
        if (colorChanged || !previous || previous.color !== point.color) {
          const tint = color(point.color || palette.point);
          instances.cores.setColorAt(index, tint);
          instances.rings.setColorAt(index, tint);
        }
        if (selectionChanged || dataChanged)
          instances.selected.setX(index, point.id === selectedId ? 1 : 0);
      }
      if (dataChanged) {
        instances.cores.instanceMatrix.needsUpdate = true;
        instances.rings.instanceMatrix.needsUpdate = true;
      }
      if (colorChanged || dataChanged) {
        if (instances.cores.instanceColor) instances.cores.instanceColor.needsUpdate = true;
        if (instances.rings.instanceColor) instances.rings.instanceColor.needsUpdate = true;
      }
      if (selectionChanged || dataChanged) instances.selected.needsUpdate = true;
    };

    class ArcCurve extends Curve<Vector3> {
      constructor(readonly samples: GlobeVector[]) {
        super();
      }
      getPoint(progress: number, target = new Vector3()): Vector3 {
        const t = Math.max(0, Math.min(1, progress)) * (this.samples.length - 1);
        const index = Math.min(this.samples.length - 2, Math.floor(t));
        const a = this.samples[index];
        const b = this.samples[index + 1];
        const fraction = t - index;
        return target
          .set(
            a[0] + (b[0] - a[0]) * fraction,
            a[1] + (b[1] - a[1]) * fraction,
            a[2] + (b[2] - a[2]) * fraction
          )
          .multiplyScalar(1.005);
      }
    }
    interface ArcInstance {
      arc: GlobeArc;
      shape: string;
      curve: ArcCurve;
      tube: Mesh<TubeGeometry, MeshBasicMaterial>;
      light: Mesh<SphereGeometry, MeshBasicMaterial>;
      glow: Mesh<PlaneGeometry, ShaderMaterial>;
      phase: number;
      tint: string;
    }
    const arcs = new Map<string, ArcInstance>();
    const removeArc = (instance: ArcInstance) => {
      world.remove(instance.tube, instance.light, instance.glow);
      release(instance.tube.geometry);
      release(instance.tube.material);
      release(instance.light.material);
      release(instance.glow.material);
    };
    const arcPhase = (id: string) => {
      let hash = 0;
      for (let i = 0; i < id.length; i++) hash = (Math.imul(hash, 31) + id.charCodeAt(i)) | 0;
      return (hash >>> 0) / 0x100000000;
    };
    const reconcileArcs = (
      input: readonly GlobeArc[],
      nextPoints: GlobePoint[],
      palette: GlobePalette
    ) => {
      const endpoints = new Map(nextPoints.map((point) => [point.id, point]));
      const retained = new Set<string>();
      for (const arc of sanitizeArcs(input, nextPoints)) {
        const from = endpoints.get(arc.from)!;
        const to = endpoints.get(arc.to)!;
        const start = coordinateToVector(from.latitude, from.longitude);
        const end = coordinateToVector(to.latitude, to.longitude);
        // Coincident locations have no route, even if their point IDs differ.
        if (Math.hypot(start[0] - end[0], start[1] - end[1], start[2] - end[2]) < 1e-7) continue;
        const shape = `${from.latitude}/${from.longitude}/${to.latitude}/${to.longitude}/${arc.width}/${arc.altitude}`;
        let instance = arcs.get(arc.id);
        if (instance && instance.shape !== shape) {
          removeArc(instance);
          arcs.delete(arc.id);
          instance = undefined;
        }
        if (!instance) {
          const curve = new ArcCurve(buildGlobeArc(start, end, arc.altitude, 80));
          const geometry = own(new TubeGeometry(curve, 80, arc.width!, 6, false));
          const vertexCount = geometry.getAttribute('position').count;
          const brightness = new Float32Array(vertexCount * 3);
          for (let i = 0; i < vertexCount; i++) {
            const t = Math.floor(i / 7) / 80;
            const value = 0.64 + Math.sin(t * Math.PI) * 0.36;
            brightness[i * 3] = brightness[i * 3 + 1] = brightness[i * 3 + 2] = value;
          }
          geometry.setAttribute('color', new Float32BufferAttribute(brightness, 3));
          const tubeMaterial = own(
            new MeshBasicMaterial({
              transparent: true,
              opacity: 0.86,
              vertexColors: true,
              toneMapped: false,
              depthWrite: false,
            })
          );
          const lightMaterial = own(new MeshBasicMaterial({ toneMapped: false }));
          const glowMaterial = own(
            new ShaderMaterial({
              vertexShader: haloVertex,
              fragmentShader: travelGlowFragment,
              uniforms: { uColor: { value: new Color() } },
              transparent: true,
              depthWrite: false,
            })
          );
          const tube = new Mesh(geometry, tubeMaterial);
          const light = new Mesh(travelGeometry, lightMaterial);
          const glow = new Mesh(travelHaloGeometry, glowMaterial);
          light.scale.setScalar(Math.max(0.006, Math.min(0.028, arc.width! * 2.4)));
          glow.scale.setScalar(Math.max(0.025, Math.min(0.085, arc.width! * 8)));
          tube.renderOrder = 3;
          glow.renderOrder = 5;
          world.add(tube, light, glow);
          instance = { arc, shape, curve, tube, light, glow, phase: arcPhase(arc.id), tint: '' };
          arcs.set(arc.id, instance);
        }
        instance.arc = arc;
        const tint = arc.color || palette.arc;
        if (tint !== instance.tint) {
          const base = color(tint);
          instance.tube.material.color.copy(base);
          instance.light.material.color.copy(base).lerp(color('#ffffff'), 0.7);
          instance.glow.material.uniforms.uColor.value.copy(base);
          instance.tint = tint;
        }
        retained.add(arc.id);
      }
      for (const [id, instance] of arcs) {
        if (!retained.has(id)) {
          removeArc(instance);
          arcs.delete(id);
        }
      }
    };
    const updatePalette = (palette: GlobePalette) => {
      surface.uniforms.uOcean.value.copy(color(palette.ocean));
      surface.uniforms.uLand.value.copy(color(palette.land));
      surface.uniforms.uAtmosphere.value.copy(color(palette.atmosphere));
      atmosphere.uniforms.uColor.value.copy(color(palette.atmosphere));
      gridMaterial.color.copy(color(palette.grid));
      coastMaterial.color.copy(color(palette.coast));
    };

    return {
      resize(nextWidth, nextHeight, nextPixelRatio) {
        if (disposed) return;
        const w = Number.isFinite(nextWidth) ? Math.max(0, nextWidth) : 0;
        const h = Number.isFinite(nextHeight) ? Math.max(0, nextHeight) : 0;
        const dpr = Number.isFinite(nextPixelRatio)
          ? Math.max(0.5, Math.min(3, nextPixelRatio))
          : 1;
        if (w === width && h === height && dpr === pixelRatio) return;
        width = w;
        height = h;
        pixelRatio = dpr;
        webgl.setPixelRatio(dpr);
        webgl.setSize(Math.max(1, w), Math.max(1, h), false);
      },
      render(snapshot: GlobeRendererSnapshot) {
        if (disposed) return [];
        const view = normalizeGlobeView(snapshot.view);
        const paletteChanged =
          !lastPalette ||
          (Object.keys(snapshot.palette) as (keyof GlobePalette)[]).some(
            (key) => snapshot.palette[key] !== lastPalette![key]
          );
        const dataChanged = snapshot.points !== pointInput;
        const selectionChanged = snapshot.selectedId !== selectedId;
        const arcDataChanged = snapshot.arcs !== arcInput;
        if (paletteChanged) updatePalette(snapshot.palette);
        selectedId = snapshot.selectedId;
        if (dataChanged || paletteChanged || selectionChanged) {
          const next = dataChanged ? sanitizePoints(snapshot.points) : points;
          updatePointInstances(
            next,
            snapshot.palette,
            dataChanged,
            paletteChanged,
            selectionChanged
          );
          if (dataChanged) projectionDirty = true;
          points = next;
        }
        if (dataChanged || arcDataChanged || paletteChanged)
          reconcileArcs(snapshot.arcs, points, snapshot.palette);
        pointInput = snapshot.points;
        arcInput = snapshot.arcs;
        if (paletteChanged) lastPalette = { ...snapshot.palette };
        if (
          projectionDirty ||
          projectionLatitude !== view.latitude ||
          projectionLongitude !== view.longitude ||
          projectionZoom !== view.zoom ||
          projectionWidth !== width ||
          projectionHeight !== height
        ) {
          projected = points.map((point) => ({
            id: point.id,
            ...projectGlobePoint(point, view, width, height),
          }));
          projectionDirty = false;
          projectionLatitude = view.latitude;
          projectionLongitude = view.longitude;
          projectionZoom = view.zoom;
          projectionWidth = width;
          projectionHeight = height;
        }
        if (width <= 0 || height <= 0) return projected;
        const radius = globeRadius(width, height, view.zoom);
        camera.left = -width / (2 * radius);
        camera.right = width / (2 * radius);
        camera.top = height / (2 * radius);
        camera.bottom = -height / (2 * radius);
        camera.updateProjectionMatrix();
        rotation
          .makeRotationX(view.latitude * DEG)
          .multiply(longitudeRotation.makeRotationY(-view.longitude * DEG));
        world.quaternion.setFromRotationMatrix(rotation);
        billboardRotation.copy(world.quaternion).invert();
        const time = Number.isFinite(snapshot.time) ? Math.max(0, snapshot.time) : 0;
        for (const instance of arcs.values()) {
          const selected = snapshot.selectedArcId === instance.arc.id;
          const related = snapshot.selectedArcId
            ? selected
            : !selectedId || instance.arc.from === selectedId || instance.arc.to === selectedId;
          instance.tube.material.opacity = selected ? 1 : related ? 0.86 : 0.24;
          instance.tube.scale.setScalar(selected ? 1.002 : 1);
          const flowing = snapshot.animateArcs && instance.arc.animated !== false;
          instance.light.visible = instance.glow.visible = flowing;
          if (flowing) {
            instance.curve.getPointAt((time * 0.18 + instance.phase) % 1, scratchPosition);
            instance.light.position.copy(scratchPosition);
            instance.glow.position.copy(scratchPosition);
            instance.glow.quaternion.copy(billboardRotation);
          }
        }
        webgl.render(scene, camera);
        return projected;
      },
      dispose() {
        if (disposed) return;
        world.clear();
        scene.clear();
        arcs.clear();
        points = [];
        projected = [];
        pointInput = arcInput = undefined;
        colors.clear();
        cleanup();
        // Release the retained texture CPU storage as well as its GPU allocation.
        landMask.image.data = null;
      },
    };
  } catch (error) {
    cleanup();
    throw error;
  }
}
