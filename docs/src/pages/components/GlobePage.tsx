'use client';

import { useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import {
  Button,
  Collapse,
  Descriptions,
  Globe,
  Segmented,
  Skeleton,
  Slider,
  Spin,
  Switch,
  Tag,
  type GlobeArc,
  type GlobeCategory,
  type GlobeFocusRequest,
  type GlobePoint,
  type GlobeView,
} from '@zuvi/react';
import { ArrowRight, Globe as GlobeIcon, MapPin } from '@zuvi/icons';
import ApiTable from '../../components/ApiTable';
import CodeBlock from '../../components/CodeBlock';
import CustomizeOutlet from '../../components/CustomizeOutlet';
import Demo from '../../components/Demo';
import { usePageTitle } from '../../components/usePageTitle';
import './globe-page.css';

interface City extends GlobePoint {
  region: string;
  timeZone: string;
}

const REGIONS: readonly GlobeCategory[] = [
  { id: 'east-asia', name: '东亚', color: 'var(--zuvi-color-primary)' },
  { id: 'southeast-asia', name: '东南亚', color: 'var(--zuvi-color-success)' },
  { id: 'west-asia', name: '西亚', color: 'var(--zuvi-color-warning)' },
  { id: 'europe', name: '欧洲', color: 'var(--zuvi-color-danger)' },
  {
    id: 'north-america',
    name: '北美',
    color: 'color-mix(in srgb, var(--zuvi-color-primary) 60%, var(--zuvi-color-danger))',
  },
  {
    id: 'oceania',
    name: '大洋洲',
    color: 'color-mix(in srgb, var(--zuvi-color-primary) 50%, var(--zuvi-color-success))',
  },
  {
    id: 'south-america',
    name: '南美',
    color: 'color-mix(in srgb, var(--zuvi-color-warning) 65%, var(--zuvi-color-danger))',
  },
  {
    id: 'africa',
    name: '非洲',
    color: 'color-mix(in srgb, var(--zuvi-color-success) 55%, var(--zuvi-color-warning))',
  },
];

// Approximate WGS84 city centers. Connections and all derived metrics are sample data.
const CITIES: readonly City[] = [
  {
    id: 'shanghai',
    name: '上海 Shanghai',
    latitude: 31.2304,
    longitude: 121.4737,
    category: 'east-asia',
    region: '东亚',
    timeZone: 'Asia/Shanghai',
  },
  {
    id: 'tokyo',
    name: '东京 Tokyo',
    latitude: 35.6762,
    longitude: 139.6503,
    category: 'east-asia',
    region: '东亚',
    timeZone: 'Asia/Tokyo',
  },
  {
    id: 'singapore',
    name: '新加坡 Singapore',
    latitude: 1.3521,
    longitude: 103.8198,
    category: 'southeast-asia',
    region: '东南亚',
    timeZone: 'Asia/Singapore',
  },
  {
    id: 'dubai',
    name: '迪拜 Dubai',
    latitude: 25.2048,
    longitude: 55.2708,
    category: 'west-asia',
    region: '西亚',
    timeZone: 'Asia/Dubai',
  },
  {
    id: 'london',
    name: '伦敦 London',
    latitude: 51.5074,
    longitude: -0.1278,
    category: 'europe',
    region: '欧洲',
    timeZone: 'Europe/London',
  },
  {
    id: 'new-york',
    name: '纽约 New York',
    latitude: 40.7128,
    longitude: -74.006,
    category: 'north-america',
    region: '北美',
    timeZone: 'America/New_York',
  },
  {
    id: 'san-francisco',
    name: '旧金山 San Francisco',
    latitude: 37.7749,
    longitude: -122.4194,
    category: 'north-america',
    region: '北美',
    timeZone: 'America/Los_Angeles',
  },
  {
    id: 'sydney',
    name: '悉尼 Sydney',
    latitude: -33.8688,
    longitude: 151.2093,
    category: 'oceania',
    region: '大洋洲',
    timeZone: 'Australia/Sydney',
  },
];
const PARIS: City = {
  id: 'paris',
  name: '巴黎 Paris',
  latitude: 48.8566,
  longitude: 2.3522,
  category: 'europe',
  region: '欧洲',
  timeZone: 'Europe/Paris',
};
const ROUTES: readonly GlobeArc[] = [
  { id: 'shanghai-tokyo', from: 'shanghai', to: 'tokyo', altitude: 0.12 },
  { id: 'shanghai-singapore', from: 'shanghai', to: 'singapore', altitude: 0.18 },
  { id: 'shanghai-sydney', from: 'shanghai', to: 'sydney', altitude: 0.24 },
  { id: 'singapore-dubai', from: 'singapore', to: 'dubai', altitude: 0.2 },
  { id: 'dubai-london', from: 'dubai', to: 'london', altitude: 0.24 },
  { id: 'london-new-york', from: 'london', to: 'new-york', altitude: 0.3 },
  { id: 'new-york-san-francisco', from: 'new-york', to: 'san-francisco', altitude: 0.18 },
  { id: 'tokyo-san-francisco', from: 'tokyo', to: 'san-francisco', altitude: 0.38 },
  { id: 'singapore-sydney', from: 'singapore', to: 'sydney', altitude: 0.28 },
].map((arc, index) => ({
  ...arc,
  name: `${CITIES.find((city) => city.id === arc.from)!.name} → ${CITIES.find((city) => city.id === arc.to)!.name}`,
  value: `示例路径 ${index + 1}`,
}));

function withConnectionCounts(cities: readonly City[], arcs: readonly GlobeArc[]): City[] {
  const degrees = new Map(cities.map((city) => [city.id, 0]));
  for (const arc of arcs) {
    if (!degrees.has(arc.from) || !degrees.has(arc.to)) continue;
    degrees.set(arc.from, degrees.get(arc.from)! + 1);
    degrees.set(arc.to, degrees.get(arc.to)! + 1);
  }
  return cities.map((city) => ({ ...city, value: degrees.get(city.id)! }));
}

// A dense fixture with real city names and approximate coordinates; routes are illustrative.
const DENSE_CITY_ROWS: readonly [string, string, number, number, string][] = [
  ['beijing', '北京 Beijing', 39.9042, 116.4074, 'east-asia'],
  ['seoul', '首尔 Seoul', 37.5665, 126.978, 'east-asia'],
  ['osaka', '大阪 Osaka', 34.6937, 135.5023, 'east-asia'],
  ['hong-kong', '香港 Hong Kong', 22.3193, 114.1694, 'east-asia'],
  ['taipei', '台北 Taipei', 25.033, 121.5654, 'east-asia'],
  ['chengdu', '成都 Chengdu', 30.5728, 104.0668, 'east-asia'],
  ['bangkok', '曼谷 Bangkok', 13.7563, 100.5018, 'southeast-asia'],
  ['hanoi', '河内 Hanoi', 21.0278, 105.8342, 'southeast-asia'],
  ['ho-chi-minh-city', '胡志明市 Ho Chi Minh City', 10.8231, 106.6297, 'southeast-asia'],
  ['kuala-lumpur', '吉隆坡 Kuala Lumpur', 3.139, 101.6869, 'southeast-asia'],
  ['jakarta', '雅加达 Jakarta', -6.2088, 106.8456, 'southeast-asia'],
  ['manila', '马尼拉 Manila', 14.5995, 120.9842, 'southeast-asia'],
  ['doha', '多哈 Doha', 25.2854, 51.531, 'west-asia'],
  ['riyadh', '利雅得 Riyadh', 24.7136, 46.6753, 'west-asia'],
  ['istanbul', '伊斯坦布尔 Istanbul', 41.0082, 28.9784, 'west-asia'],
  ['abu-dhabi', '阿布扎比 Abu Dhabi', 24.4539, 54.3773, 'west-asia'],
  ['muscat', '马斯喀特 Muscat', 23.588, 58.3829, 'west-asia'],
  ['amman', '安曼 Amman', 31.9539, 35.9106, 'west-asia'],
  ['berlin', '柏林 Berlin', 52.52, 13.405, 'europe'],
  ['amsterdam', '阿姆斯特丹 Amsterdam', 52.3676, 4.9041, 'europe'],
  ['madrid', '马德里 Madrid', 40.4168, -3.7038, 'europe'],
  ['rome', '罗马 Rome', 41.9028, 12.4964, 'europe'],
  ['stockholm', '斯德哥尔摩 Stockholm', 59.3293, 18.0686, 'europe'],
  ['helsinki', '赫尔辛基 Helsinki', 60.1699, 24.9384, 'europe'],
  ['warsaw', '华沙 Warsaw', 52.2297, 21.0122, 'europe'],
  ['lisbon', '里斯本 Lisbon', 38.7223, -9.1393, 'europe'],
  ['vienna', '维也纳 Vienna', 48.2082, 16.3738, 'europe'],
  ['zurich', '苏黎世 Zurich', 47.3769, 8.5417, 'europe'],
  ['vancouver', '温哥华 Vancouver', 49.2827, -123.1207, 'north-america'],
  ['toronto', '多伦多 Toronto', 43.6532, -79.3832, 'north-america'],
  ['chicago', '芝加哥 Chicago', 41.8781, -87.6298, 'north-america'],
  ['los-angeles', '洛杉矶 Los Angeles', 34.0522, -118.2437, 'north-america'],
  ['seattle', '西雅图 Seattle', 47.6062, -122.3321, 'north-america'],
  ['mexico-city', '墨西哥城 Mexico City', 19.4326, -99.1332, 'north-america'],
  ['boston', '波士顿 Boston', 42.3601, -71.0589, 'north-america'],
  ['miami', '迈阿密 Miami', 25.7617, -80.1918, 'north-america'],
  ['sao-paulo', '圣保罗 São Paulo', -23.5505, -46.6333, 'south-america'],
  ['rio-de-janeiro', '里约热内卢 Rio de Janeiro', -22.9068, -43.1729, 'south-america'],
  ['buenos-aires', '布宜诺斯艾利斯 Buenos Aires', -34.6037, -58.3816, 'south-america'],
  ['santiago', '圣地亚哥 Santiago', -33.4489, -70.6693, 'south-america'],
  ['lima', '利马 Lima', -12.0464, -77.0428, 'south-america'],
  ['bogota', '波哥大 Bogotá', 4.711, -74.0721, 'south-america'],
  ['cairo', '开罗 Cairo', 30.0444, 31.2357, 'africa'],
  ['nairobi', '内罗毕 Nairobi', -1.2921, 36.8219, 'africa'],
  ['cape-town', '开普敦 Cape Town', -33.9249, 18.4241, 'africa'],
  ['johannesburg', '约翰内斯堡 Johannesburg', -26.2041, 28.0473, 'africa'],
  ['lagos', '拉各斯 Lagos', 6.5244, 3.3792, 'africa'],
  ['casablanca', '卡萨布兰卡 Casablanca', 33.5731, -7.5898, 'africa'],
  ['melbourne', '墨尔本 Melbourne', -37.8136, 144.9631, 'oceania'],
  ['brisbane', '布里斯班 Brisbane', -27.4698, 153.0251, 'oceania'],
  ['auckland', '奥克兰 Auckland', -36.8485, 174.7633, 'oceania'],
];
const DENSE_CITIES: readonly City[] = [
  ...CITIES,
  PARIS,
  ...DENSE_CITY_ROWS.map(([id, name, latitude, longitude, category]) => ({
    id,
    name,
    latitude,
    longitude,
    category,
    region: REGIONS.find((region) => region.id === category)!.name,
    timeZone: '',
  })),
];
const DENSE_ROUTES: readonly GlobeArc[] = DENSE_CITIES.map((city, index) => {
  const destination = DENSE_CITIES[(index + 7) % DENSE_CITIES.length];
  return {
    id: `${city.id}-${destination.id}`,
    from: city.id,
    to: destination.id,
    name: `${city.name} → ${destination.name}`,
    value: `示例路径 ${index + 1}`,
    animated: false,
  };
});
const DENSE_POINTS = withConnectionCounts(DENSE_CITIES, DENSE_ROUTES);
const ASIA_VIEW: GlobeView = { latitude: 20, longitude: 105, zoom: 1 };
const coordinate = (value: number, positive: string, negative: string) =>
  `${Math.abs(value).toFixed(4)}° ${value < 0 ? negative : positive}`;

const NETWORK_CODE = `import { useRef, useState } from 'react';
import { Globe, type GlobePoint, type GlobeArc, type GlobeFocusRequest } from '@zuvi/react';
import '@zuvi/react/styles.css';

const categories = [
  { id: 'east-asia', name: '东亚', color: 'var(--zuvi-color-primary)' },
  { id: 'southeast-asia', name: '东南亚', color: 'var(--zuvi-color-success)' },
];
const cities: GlobePoint[] = [
  { id: 'shanghai', name: '上海', latitude: 31.2304, longitude: 121.4737, category: 'east-asia' },
  { id: 'tokyo', name: '东京', latitude: 35.6762, longitude: 139.6503, category: 'east-asia' },
  { id: 'singapore', name: '新加坡', latitude: 1.3521, longitude: 103.8198, category: 'southeast-asia' },
];
// 示例连接；name / value 是展示元数据，from / to 始终引用实际点位 id。
const arcs: GlobeArc[] = [
  { id: 'shanghai-tokyo', from: 'shanghai', to: 'tokyo', name: '上海 → 东京', value: '示例路径 1' },
  { id: 'shanghai-singapore', from: 'shanghai', to: 'singapore', name: '上海 → 新加坡', value: '示例路径 2' },
];
const points = cities.map((city) => ({
  ...city,
  value: arcs.filter((arc) => arc.from === city.id || arc.to === city.id).length,
})); // 点位面积映射到本地示例连接数；时区请单独保存。

function CityNetwork() {
  const [selectedId, setSelectedId] = useState<string | null>('shanghai');
  const [arcId, setArcId] = useState<string | null>(null);
  const [focus, setFocus] = useState<GlobeFocusRequest | null>(null);
  const focusKey = useRef(0);
  return (
    <>
      <Globe
        points={points}
        arcs={arcs}
        categories={categories}
        pointLabels="auto"
        maxLabels={12}
        valueScale
        searchable
        value={selectedId}
        onChange={setSelectedId}
        focus={focus}
        transitionDuration={700}
        arcValue={arcId}
        onArcChange={setArcId}
        showArcList
        renderArcDetails={(arc, { from, to }) => (
          <p>{from.name} → {to.name} · {arc.value} · id: {arc.id}</p>
        )}
        defaultView={{ latitude: 20, longitude: 105, zoom: 1 }}
        height={380}
        labels={{ label: '全球城市网络', points: '城市列表', value: '示例连接数' }}
      />
      <button onClick={() => setFocus({ pointId: 'tokyo', key: ++focusKey.current })}>
        飞至东京（保留所选城市）
      </button>
    </>
  );
}`;

const VIEW_CODE = `const [view, setView] = useState<GlobeView>({
  latitude: 20, longitude: 105, zoom: 1,
});

<Globe
  points={points}
  view={view}
  onViewChange={(next, { reason }) => {
    setView(next); // 受控相机必须回写，才会响应拖拽、缩放和键盘。
    console.log(reason); // drag / zoom / keyboard / reset / point / focus
  }}
  autoRotate={false}
/>;
// 若希望自动旋转，使用 defaultView，不要传受控 view。
// onViewChange 报告交互请求，不逐帧报告自动旋转。`;

const CUSTOM_CODE = `import type { CSSProperties } from 'react';

<Globe
  points={points}
  arcs={arcs}
  style={{
    '--zuvi-globe-bg': 'transparent',
    '--zuvi-globe-ocean-color': 'var(--zuvi-color-bg)',
    '--zuvi-globe-land-color': 'var(--zuvi-color-primary-subtle)',
    '--zuvi-globe-point-color': 'var(--zuvi-color-success)',
    '--zuvi-globe-arc-color': 'var(--zuvi-color-warning)',
  } as CSSProperties}
  classNames={{ stage: 'my-globe-stage', pointList: 'my-city-list' }}
  renderTooltip={(point) => <strong>{point.name ?? point.id}</strong>}
/>;`;

const FALLBACK_CODE = `// loading 是占位内容，不是 boolean 加载开关。
// 宿主的数据请求尚未完成时，可以先显示同一个占位组件。
function CityPreview({ pending }: { pending: boolean }) {
  return pending ? <LoadingPreview /> : (
    <Globe
      points={points}
      arcs={arcs}
      renderMode="2d"
      defaultView={{ latitude: 20, longitude: 105, zoom: 1 }}
      autoRotate={false}
      height={280}
      loading={<LoadingPreview />}
      labels={{ label: '二维城市视图', points: '城市列表' }}
    />
  );
}`;

function LoadingPreview(): ReactNode {
  return (
    <div className="globe-loading-preview" role="status" aria-label="自定义加载占位">
      <Skeleton circle width={96} active />
      <div>
        <Spin size="sm" />
        <strong>正在准备地理视图</strong>
        <span>点位就绪后显示城市与连线</span>
      </div>
    </div>
  );
}

function SampleRouteDetails({
  arc,
  from,
  to,
}: {
  arc: GlobeArc;
  from: GlobePoint;
  to: GlobePoint;
}): ReactNode {
  return (
    <div className="globe-route-details" data-globe-route-id={arc.id}>
      <strong>{arc.name ?? `${from.name ?? from.id} → ${to.name ?? to.id}`}</strong>
      <span>
        {from.name ?? from.id} → {to.name ?? to.id}
      </span>
      <span>{arc.value ?? '本地示例连接'} · 非实时</span>
      <code>{arc.id}</code>
      <small>
        端点 id：{arc.from} → {arc.to}
      </small>
    </div>
  );
}

function DenseExample(): ReactNode {
  const [selectedId, setSelectedId] = useState<string | null>('shanghai');
  return (
    <div className="globe-compact-panel" data-globe-demo="dense">
      <div className="globe-compact-heading">
        <Tag>60 座城市 · 60 条示例路径</Tag>
        <Tag>SVG · 按需挂载</Tag>
      </div>
      <Globe
        points={DENSE_POINTS}
        arcs={DENSE_ROUTES}
        categories={REGIONS}
        value={selectedId}
        onChange={setSelectedId}
        pointLabels="auto"
        maxLabels={12}
        valueScale
        searchable
        showArcList
        defaultView={ASIA_VIEW}
        renderMode="2d"
        autoRotate={false}
        animateArcs={false}
        transitionDuration={700}
        height={320}
        labels={{
          label: '密集城市网络地球',
          points: '密集城市列表',
          legend: '密集城市地区',
          search: '搜索密集城市',
          value: '示例连接数',
          arcs: '密集示例路径列表',
        }}
        renderArcDetails={(arc, { from, to }) => (
          <SampleRouteDetails arc={arc} from={from} to={to} />
        )}
      />
      <p className="globe-demo-note" aria-live="polite">
        当前选择：{DENSE_POINTS.find((point) => point.id === selectedId)?.name ?? '未选择'}
      </p>
      <p className="globe-demo-note">
        名称与近似经纬度对应真实城市，60 条路径为演示组合。所有点的示例连接数均为 2，
        同值映射为中间面积；自动标签仅保留正面且不重叠的最多 12 个，不代表只加载 12 座城市。
        搜索只缩小展开的列表，分类才会筛选地图与路径。
      </p>
    </div>
  );
}

function TwoDExample(): ReactNode {
  const [preview, setPreview] = useState('map');
  const [selectedId, setSelectedId] = useState<string | null>('singapore');
  const points = CITIES.slice(0, 4);
  const arcs = ROUTES.filter(
    (arc) =>
      points.some((point) => point.id === arc.from) && points.some((point) => point.id === arc.to)
  );
  return (
    <div className="globe-compact-panel">
      <div className="globe-compact-heading">
        <Tag>SVG · 无 WebGL</Tag>
        <Segmented
          size="sm"
          aria-label="二维示例内容"
          value={preview}
          onChange={setPreview}
          options={[
            { value: 'map', label: '二维视图' },
            { value: 'loading', label: '加载占位' },
          ]}
        />
      </div>
      {preview === 'loading' ? (
        <LoadingPreview />
      ) : (
        <>
          <Globe
            points={points}
            arcs={arcs}
            value={selectedId}
            onChange={setSelectedId}
            defaultView={ASIA_VIEW}
            renderMode="2d"
            autoRotate={false}
            animateArcs={false}
            height={280}
            loading={<LoadingPreview />}
            labels={{
              label: '二维城市坐标地球',
              points: '二维城市列表',
              zoomIn: '放大二维地球',
              zoomOut: '缩小二维地球',
              reset: '重置二维视角',
            }}
          />
          <p className="globe-demo-note" aria-live="polite">
            当前选择：{points.find((point) => point.id === selectedId)?.name ?? '未选择'}
          </p>
        </>
      )}
      <p className="globe-demo-note">
        加载占位仅预览宿主等待数据的界面，不人为延迟渲染，也不伪造 Globe 的加载状态。
      </p>
    </div>
  );
}

export default function GlobePage(): ReactNode {
  usePageTitle('Globe 3D 地球');
  const rootRef = useRef<HTMLDivElement>(null);
  const focusKey = useRef(0);
  const [selectedId, setSelectedId] = useState<string | null>('shanghai');
  const [focus, setFocus] = useState<GlobeFocusRequest | null>(null);
  const [hiddenCategories, setHiddenCategories] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [arcId, setArcId] = useState<string | null>('shanghai-tokyo');
  const [includeParis, setIncludeParis] = useState(false);
  const [palette, setPalette] = useState('dark');
  const [renderMode, setRenderMode] = useState<'auto' | '2d'>('auto');
  const [autoRotate, setAutoRotate] = useState(true);
  const [animateArcs, setAnimateArcs] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [rotationSpeed, setRotationSpeed] = useState(6);
  const [lastView, setLastView] = useState<GlobeView>(ASIA_VIEW);
  const [status, setStatus] = useState<'loading' | 'ready' | 'fallback' | 'error'>('loading');
  const [renderer, setRenderer] = useState<'webgl' | '2d' | null>(null);
  const [openExamples, setOpenExamples] = useState<string[]>([]);
  const cities = useMemo(() => (includeParis ? [...CITIES, PARIS] : CITIES), [includeParis]);
  const arcs = useMemo(
    () =>
      includeParis
        ? [
            ...ROUTES,
            {
              id: 'london-paris',
              from: 'london',
              to: 'paris',
              name: '伦敦 London → 巴黎 Paris',
              value: '示例路径 10',
              altitude: 0.1,
            },
          ]
        : ROUTES,
    [includeParis]
  );
  const points = useMemo(() => withConnectionCounts(cities, arcs), [cities, arcs]);
  const categories = useMemo(
    () => REGIONS.filter((region) => points.some((point) => point.category === region.id)),
    [points]
  );
  const visibleIds = new Set(
    points
      .filter((point) => !hiddenCategories.includes(point.category ?? ''))
      .map((point) => point.id)
  );
  const visibleArcs = arcs.filter((arc) => visibleIds.has(arc.from) && visibleIds.has(arc.to));
  const selected = points.find((point) => point.id === selectedId);
  const connections = visibleArcs.filter((arc) => arc.from === selectedId || arc.to === selectedId);
  const focusCity = (pointId: string) => {
    setFocus({ pointId, key: ++focusKey.current });
  };
  const globeStyle = {
    '--zuvi-globe-bg': 'transparent',
    '--zuvi-globe-ocean-color':
      'color-mix(in srgb, var(--zuvi-color-primary) 12%, var(--zuvi-color-bg))',
    '--zuvi-globe-land-color':
      'color-mix(in srgb, var(--zuvi-color-primary) 26%, var(--zuvi-color-bg-muted))',
    '--zuvi-globe-coast-color':
      'color-mix(in srgb, var(--zuvi-color-primary) 46%, var(--zuvi-color-fg-muted))',
    '--zuvi-globe-grid-color': 'var(--zuvi-color-border-strong)',
    '--zuvi-globe-atmosphere-color': 'var(--zuvi-color-primary)',
    '--zuvi-globe-point-color': 'var(--zuvi-color-success)',
    '--zuvi-globe-arc-color': 'var(--zuvi-color-warning)',
  } as CSSProperties;
  const rendererText =
    status === 'loading'
      ? '准备视图中'
      : renderer === 'webgl'
        ? 'WebGL · 3D'
        : renderer === '2d'
          ? status === 'fallback'
            ? '2D · 自动回退'
            : 'SVG · 2D'
          : '视图暂不可用';

  return (
    <div className="doc-page globe-page">
      <h1 className="doc-h1">Globe 3D 地球</h1>
      <p className="doc-lead">
        把经纬度、城市和连接放在同一个地球上。点位选择、旋转与缩放有完整键盘入口； 无法使用 WebGL
        时回退到二维投影，数据与可访问的城市列表仍然可用。
      </p>
      <div className="globe-page-tags">
        <Tag color="primary">地理可视化</Tag>
        <Tag>按需加载</Tag>
        <Tag>本地地理数据</Tag>
        <Tag>2D 回退</Tag>
      </div>
      <h2 className="doc-h2">示例</h2>
      <Demo
        title="全球城市网络"
        description="从亚洲视角开始，按地区筛选、搜索城市、飞至邻居并查看示例路径。颜色区分地区，点位面积来自示例连接数；不是实时网络、航线或运营看板。"
        code={NETWORK_CODE}
        stack
      >
        <details className="globe-demo-settings" open>
          <summary>显示、渲染与交互设置</summary>
          <div className="globe-demo-toolbar" role="group" aria-label="网络演示设置">
            <div className="globe-demo-setting">
              <span>面板与背景</span>
              <Segmented
                size="sm"
                aria-label="地球面板样式"
                value={palette}
                onChange={setPalette}
                options={[
                  { value: 'dark', label: '深色' },
                  { value: 'light', label: '浅色' },
                  { value: 'transparent', label: '透明' },
                ]}
              />
            </div>
            <div className="globe-demo-setting">
              <span>渲染方式</span>
              <Segmented
                size="sm"
                aria-label="地球渲染方式"
                value={renderMode}
                onChange={(value) => setRenderMode(value === '2d' ? '2d' : 'auto')}
                options={[
                  { value: 'auto', label: '自动 3D' },
                  { value: '2d', label: '2D 投影' },
                ]}
              />
            </div>
          </div>
          <div className="globe-live-controls" role="group" aria-label="地球交互设置">
            <Switch size="sm" label="自动旋转" checked={autoRotate} onChange={setAutoRotate} />
            <Switch
              size="sm"
              label="WebGL 连线动画"
              checked={animateArcs}
              onChange={setAnimateArcs}
              disabled={renderer !== 'webgl'}
            />
            <Switch size="sm" label="禁用交互" checked={disabled} onChange={setDisabled} />
            <div className="globe-speed-control">
              <span>转速 {rotationSpeed}°/s</span>
              <Slider
                aria-label="地球旋转速度"
                min={0}
                max={18}
                step={1}
                value={rotationSpeed}
                onChange={setRotationSpeed}
                disabled={!autoRotate}
                tooltip={false}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (includeParis && selectedId === PARIS.id) setSelectedId(null);
                if (includeParis && focus?.pointId === PARIS.id) setFocus(null);
                if (includeParis && arcId === 'london-paris') setArcId(null);
                setIncludeParis(!includeParis);
              }}
            >
              {includeParis ? '移除巴黎' : '加入巴黎'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={() =>
                rootRef.current?.querySelector<HTMLElement>('[data-part="stage"]')?.focus()
              }
            >
              聚焦地球
            </Button>
          </div>
        </details>
        <div
          className="globe-network"
          data-globe-demo="network"
          data-palette={palette}
          data-theme={palette === 'transparent' ? undefined : palette}
        >
          <div className="globe-network-heading">
            <div>
              <span className="globe-network-eyebrow">
                <GlobeIcon size={14} aria-hidden="true" /> GLOBAL CONNECTIONS
              </span>
              <h3>从亚洲，连接世界</h3>
              <p>近似城市中心 · 按地区分类 · 示例路径探索</p>
            </div>
            <Tag>示例数据 · 非实时</Tag>
          </div>
          <div className="globe-network-stats" aria-label="示例数据概览">
            <div>
              <span>参考城市 · 示例数据</span>
              <strong>
                {points.length}
                <small>座</small>
              </strong>
            </div>
            <div>
              <span>示例连线</span>
              <strong>
                {arcs.length}
                <small>条</small>
              </strong>
            </div>
            <div>
              <span>上次交互缩放</span>
              <strong>
                {lastView.zoom.toFixed(2)}
                <small>×</small>
              </strong>
            </div>
          </div>
          <p className="globe-network-summary" aria-live="polite" data-globe-visible-counts>
            当前分类显示 {visibleIds.size} / {points.length} 座城市、{visibleArcs.length} /{' '}
            {arcs.length} 条示例路径。搜索仅缩小列表；点位面积代表完整数据中的示例连接数。
          </p>
          <div className="globe-network-body">
            <div className="globe-network-map">
              <Globe
                ref={rootRef}
                points={points}
                arcs={arcs}
                categories={categories}
                hiddenCategories={hiddenCategories}
                onHiddenCategoriesChange={setHiddenCategories}
                pointLabels="auto"
                maxLabels={12}
                valueScale
                searchable
                searchValue={searchValue}
                onSearchValueChange={setSearchValue}
                focus={focus}
                transitionDuration={700}
                arcValue={arcId}
                onArcChange={setArcId}
                showArcList
                renderArcDetails={(arc, { from, to }) => (
                  <SampleRouteDetails arc={arc} from={from} to={to} />
                )}
                value={selectedId}
                onChange={setSelectedId}
                defaultView={ASIA_VIEW}
                onViewChange={setLastView}
                autoRotate={autoRotate}
                rotationSpeed={rotationSpeed}
                animateArcs={animateArcs}
                disabled={disabled}
                renderMode={renderMode}
                height="clamp(260px, 42vw, 390px)"
                style={globeStyle}
                loading={<Spin size="sm" tip="正在准备地球…" />}
                labels={{
                  label: '全球城市网络地球',
                  points: '网络城市列表',
                  legend: '城市地区分类',
                  search: '搜索网络城市',
                  searchPlaceholder: '城市名、id 或地区…',
                  value: '示例连接数',
                  arcs: '网络示例路径列表',
                  selectedArc: '所选示例路径',
                  zoomIn: '放大网络地球',
                  zoomOut: '缩小网络地球',
                  reset: '重置亚洲视角',
                }}
                renderTooltip={(point) => (
                  <div className="globe-city-tooltip">
                    <strong>{point.name ?? point.id}</strong>
                    <span>
                      {coordinate(point.latitude, 'N', 'S')} ·{' '}
                      {coordinate(point.longitude, 'E', 'W')}
                    </span>
                    <span>示例连接数：{point.value ?? 0}</span>
                    <small>近似城市中心 · 非实时</small>
                  </div>
                )}
                onReady={({ renderer: actual }) => setRenderer(actual)}
                onStatusChange={setStatus}
              />
              <div className="globe-map-caption">
                <span>{rendererText}</span>
                <span>滚轮默认保留页面滚动</span>
              </div>
            </div>
            <section className="globe-city-details" aria-label="所选城市详情" aria-live="polite">
              <span className="globe-details-eyebrow">
                <MapPin size={14} aria-hidden="true" /> 所选城市
              </span>
              {selected ? (
                <>
                  <h3>{selected.name}</h3>
                  <Tag color="primary">{selected.region}</Tag>
                  <Descriptions column={1} size="sm">
                    <Descriptions.Item label="点位 id">{selected.id}</Descriptions.Item>
                    <Descriptions.Item label="示例连接数">{selected.value}</Descriptions.Item>
                    <Descriptions.Item label="纬度">
                      {coordinate(selected.latitude, 'N', 'S')}
                    </Descriptions.Item>
                    <Descriptions.Item label="经度">
                      {coordinate(selected.longitude, 'E', 'W')}
                    </Descriptions.Item>
                    <Descriptions.Item label="时区标识">{selected.timeZone}</Descriptions.Item>
                  </Descriptions>
                  <h4>{connections.length} 条当前分类内的示例连接</h4>
                  {!visibleIds.has(selected.id) ? (
                    <p>所选城市已被分类隐藏，选择仍保留。重新勾选地区可恢复显示。</p>
                  ) : null}
                  <div className="globe-city-connections">
                    {connections.map((arc) => {
                      const destination = points.find(
                        (point) => point.id === (arc.from === selected.id ? arc.to : arc.from)
                      );
                      return destination ? (
                        <div className="globe-city-connection" key={arc.id}>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={disabled}
                            data-globe-neighbor-id={destination.id}
                            aria-label={`飞至${destination.name}`}
                            onClick={() => focusCity(destination.id)}
                            iconEnd={<ArrowRight size={14} aria-hidden="true" />}
                          >
                            {destination.name}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={disabled}
                            data-globe-select-route-id={arc.id}
                            aria-label={`查看示例路径 ${arc.name}`}
                            aria-pressed={arcId === arc.id}
                            onClick={() => setArcId(arc.id)}
                          >
                            查看示例路径
                          </Button>
                        </div>
                      ) : null;
                    })}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={disabled || !visibleIds.has(selected.id)}
                    onClick={() => focusCity(selected.id)}
                  >
                    飞回所选城市
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                    onClick={() => setSelectedId(null)}
                  >
                    清除选择
                  </Button>
                </>
              ) : (
                <>
                  <h3>选择一座城市</h3>
                  <p>点击地球上的点位，或展开城市列表后用键盘选择。</p>
                </>
              )}
            </section>
          </div>
          <p className="globe-network-footnote">
            坐标为近似城市中心，连线与连接数仅用于演示。时区标识单独展示，时区标签不计算夏令时。
            飞至邻居保留所选城市；重复点击会重新请求相机聚焦。
          </p>
        </div>
        <p className="globe-demo-note">
          旋转和 WebGL
          连线动画遵循减少动态效果偏好；二维模式显示静态连接。悬停或聚焦时会暂停动态效果，数据更新不会替换整个地球组件。
        </p>
      </Demo>

      <Demo
        title="二维视图与按需挂载"
        description="只在展开后挂载一个轻量二维示例，不增加 WebGL 上下文。选择与坐标数据仍沿用同一套 API。"
        code={FALLBACK_CODE}
        stack
      >
        <Collapse
          value={openExamples}
          onChange={setOpenExamples}
          items={[
            {
              key: '2d',
              label: '展开二维与加载示例',
              children: openExamples.includes('2d') ? <TwoDExample /> : null,
            },
          ]}
        />
      </Demo>

      <Demo
        title="密集城市网络"
        description="60 座真实城市的近似坐标与 60 条示例路径，验证分类、列表搜索和自动标签预算。收起时不创建场景。"
        stack
      >
        <Collapse
          value={openExamples}
          onChange={setOpenExamples}
          items={[
            {
              key: 'dense',
              label: '展开 60 城市网络',
              children: openExamples.includes('dense') ? <DenseExample /> : null,
            },
          ]}
        />
      </Demo>

      <h2 className="doc-h2">选择、视角与数据更新</h2>
      <p className="doc-p">
        <code>value / defaultValue</code> 保存点位的 <code>id</code>，不是坐标或整个对象。
        点击已经选中的点位会请求取消选择；点位列表选择还会将相机移到该城市。 更新{' '}
        <code>points</code> 与 <code>arcs</code> 时保留稳定 id；若删除受控选中项，宿主也应更新{' '}
        <code>value</code>。
      </p>
      <p className="doc-p">
        <code>defaultView</code> 是初始视角，也是 Home / 重置按钮返回的位置。 使用受控{' '}
        <code>view</code> 时必须回写 <code>onViewChange</code>，且不会隐式自动旋转。
        回调只报告交互请求，不逐帧回报自动旋转；上方的缩放统计因此标为「上次交互」。
      </p>
      <p className="doc-p">
        <code>categories</code> 定义地区名称与颜色，<code>point.category</code> 引用分类 id。
        图例勾选决定地图、点位列表和路径的可见性；任一端点隐藏时路径也隐藏，受控选中 id 不被清空。
        <code>searchable</code> 只在展开的点位列表内搜索，不筛选地图。分类和搜索状态分别通过{' '}
        <code>hiddenCategories</code> 与 <code>searchValue</code> 控制。
      </p>
      <p className="doc-p">
        <code>{'focus={{ pointId, key, zoom }}'}</code> 是独立的相机请求，不更改 <code>value</code>
        。改变 <code>key</code> 可以重复飞至同一点；<code>transitionDuration</code> 缺省为
        0，本演示设为 700ms，减少动态效果时立即到达。受控 <code>view</code>{' '}
        只收到目标视角请求，由宿主决定是否过渡。
      </p>
      <p className="doc-p">
        <code>pointLabels="auto"</code> 在正面选择不重叠的标签，默认预算 12 个；组件默认{' '}
        <code>none</code> 保持旧版视觉。<code>valueScale</code> 对有限数字值进行面积感知映射，
        使用完整数据的范围，筛选不会让相同点位忽大忽小；显式 <code>point.size</code> 优先。
        <code>arcValue</code> 保存实际连接 id，<code>renderArcDetails</code> 同时获得两个有效端点，
        可展示路径名称与自定义示例指标。
      </p>
      <CodeBlock code={VIEW_CODE} language="tsx" />

      <h2 className="doc-h2">键盘与无障碍</h2>
      <ul className="globe-doc-list">
        <li>Tab 聚焦地球舞台，方向键调整经纬度，每次 5°；按住 Shift 为 15°。</li>
        <li>
          <kbd>+</kbd> / <kbd>=</kbd> 放大 0.1，<kbd>−</kbd> / <kbd>_</kbd> 缩小 0.1；Home
          返回初始视角。按钮每次缩放 0.15。
        </li>
        <li>
          展开原生城市列表，Tab 到城市按钮后用 Enter / Space 选择。按钮的 <code>aria-pressed</code>{' '}
          表达当前选中项。
        </li>
        <li>
          Escape
          关闭当前提示或取消正在进行的指针操作；只有实际消费按键时才停止冒泡，不拦截宿主的普通
          Escape。
        </li>
        <li>
          Canvas 是装饰层。名称、坐标、控件和提示用 DOM
          提供；不要为了只保留视觉效果而隐藏唯一的可访问城市入口。
        </li>
        <li>
          滚轮缩放需要显式开启 <code>wheelZoom</code>。默认保留页面滚动，自动动画遵循{' '}
          <code>prefers-reduced-motion</code>。
        </li>
      </ul>

      <h2 className="doc-h2">API</h2>
      <ApiTable
        rows={[
          {
            name: 'points',
            type: 'readonly GlobePoint[]',
            defaultValue: '[]',
            description: '点位数据。有效且唯一的 id 标识城市；坐标用角度表示，不是弧度。',
          },
          {
            name: 'arcs',
            type: 'readonly GlobeArc[]',
            defaultValue: '[]',
            description:
              '用 from / to 引用点位 id 的示例连接。不存在的端点、自连接或重复 id 不绘制。',
          },
          {
            name: 'categories / legend',
            type: 'readonly GlobeCategory[] / boolean',
            defaultValue: '[] / 有分类时 true',
            description: '分类 id、名称与可选颜色。图例勾选筛选点位及其连接，未分类点位保持可见。',
          },
          {
            name: 'hiddenCategories / defaultHiddenCategories / onHiddenCategoriesChange',
            type: 'readonly string[] / readonly string[] / (ids: string[]) => void',
            defaultValue: '[]',
            description: '受控隐藏分类 / 初始隐藏分类 / 修改请求。不清空被隐藏点位的选中 id。',
          },
          {
            name: 'pointLabels / maxLabels',
            type: "'none' | 'selected' | 'auto' / number",
            defaultValue: "'none' / 12",
            description: '可视标签模式与自动标签预算（1…40）。auto 只放置正面且不重叠的标签。',
          },
          {
            name: 'valueScale',
            type: 'boolean | GlobeValueScale',
            defaultValue: 'false',
            description:
              '将有限数字 value 映射为点位面积；可设 domain、range，完整数据范围不随分类或搜索改变。',
          },
          {
            name: 'searchable / searchValue / defaultSearchValue / onSearchValueChange',
            type: 'boolean / string / string / (value: string) => void',
            defaultValue: "false / ''",
            description: '展开列表内的本地搜索与受控状态。只缩小列表，不改变地图或连接。',
          },
          {
            name: 'focus / transitionDuration',
            type: 'GlobeFocusRequest | null / number',
            defaultValue: 'null / 0',
            description:
              '独立相机聚焦请求与飞行时间 ms。key 触发同一点重复请求；不更改选择，减少动态效果时立即到达。',
          },
          {
            name: 'arcValue / defaultArcValue / onArcChange',
            type: 'string | null / string | null / (id: string | null) => void',
            defaultValue: 'null',
            description: '受控连接 id / 初始连接 id / 选择请求。再次点击同一连接请求 null。',
          },
          {
            name: 'showArcList / onArcClick / renderArcDetails',
            type: 'boolean / (arc, event) => void / (arc, { from, to }) => ReactNode',
            defaultValue: 'false',
            description:
              '可访问的原生连接列表、点击回调与所选路径详情。preventDefault 可阻止默认选择，端点是有效 GlobePoint。',
          },
          {
            name: 'value / defaultValue',
            type: 'string | null',
            defaultValue: 'null',
            description: '受控选中 id / 非受控初始选中 id。null 表示未选择。',
          },
          {
            name: 'onChange',
            type: '(id: string | null) => void',
            description: '请求切换选择。再次点击当前点位请求 null；受控模式需宿主回写。',
          },
          {
            name: 'onPointClick',
            type: '(point: GlobePoint, event: React.MouseEvent<HTMLElement>) => void',
            description: '点位点击事件；event.preventDefault() 可以阻止默认选择与相机居中。',
          },
          {
            name: 'view / defaultView',
            type: 'GlobeView / Partial<GlobeView>',
            defaultValue: '{ latitude: 20, longitude: 105, zoom: 1 }',
            description:
              '受控相机 / 初始相机。受控 view 不进行隐式自动旋转；重置回到初始 defaultView。',
          },
          {
            name: 'onViewChange',
            type: '(view: GlobeView, details: { reason }) => void',
            description:
              'reason 为 drag、zoom、keyboard、reset、point 或 focus；报告目标交互请求，不是飞行或自动旋转逐帧事件。',
          },
          {
            name: 'autoRotate',
            type: 'boolean',
            defaultValue: 'true',
            description: '非受控相机的自动旋转；聚焦、悬停、交互和减少动态效果偏好会暂停动画。',
          },
          {
            name: 'rotationSpeed',
            type: 'number',
            defaultValue: '6',
            description: '每秒旋转角度，限于 −60 到 60。负值反向，0 静止。',
          },
          {
            name: 'animateArcs',
            type: 'boolean',
            defaultValue: 'true',
            description:
              '启用 WebGL 连接上的移动亮点；也受 arc.animated 与减少动态效果偏好约束。二维模式绘制静态连接。',
          },
          {
            name: 'interactive / disabled',
            type: 'boolean / boolean',
            defaultValue: 'true / false',
            description: '开启交互 / 禁用交互。禁用时保留数据展示，但舞台、点位与控件不响应操作。',
          },
          {
            name: 'controls',
            type: 'boolean',
            defaultValue: 'true',
            description: '显示暂停 / 旋转、缩放与重置按钮。隐藏时仍应为用户提供等价操作入口。',
          },
          {
            name: 'wheelZoom',
            type: 'boolean',
            defaultValue: 'false',
            description: '显式启用舞台滚轮缩放；默认不阻止页面滚动。',
          },
          {
            name: 'showPointList',
            type: 'boolean',
            defaultValue: 'true',
            description: '原生 details 城市列表，默认收起；二维或 WebGL 不可用时依然提供数据入口。',
          },
          {
            name: 'renderMode',
            type: "'auto' | '2d'",
            defaultValue: "'auto'",
            description:
              'auto 尝试 WebGL，不可用时回退二维；2d 显式使用 SVG 投影，不初始化 Three.js。',
          },
          {
            name: 'height',
            type: 'number | string',
            defaultValue: '420px',
            description: '舞台高度。数字按 px；可用 clamp() 或百分比（百分比需要确定的父高度）。',
          },
          {
            name: 'loading',
            type: 'ReactNode',
            description:
              '模块 / 场景准备期间的占位内容，不是加载开关；默认使用语言包的 loading 文案。',
          },
          {
            name: 'renderTooltip',
            type: '(point: GlobePoint) => ReactNode',
            description: '覆盖点位提示内容；默认显示名称、value（若有）和经纬度。',
          },
          {
            name: 'labels',
            type: 'Partial<GlobeLabels>',
            description:
              '覆盖名称、加载、操作、提示和坐标文案；缺省从 ConfigProvider 的 locale.globe 读取。',
          },
          {
            name: 'onReady',
            type: "(details: { renderer: 'webgl' | '2d' }) => void",
            description:
              '实际视图就绪，包括可用的二维回退；以 renderer 判断实际模式，不假设 auto 一定得到 WebGL。',
          },
          {
            name: 'onError',
            type: '(error: GlobeError) => void',
            description:
              '错误对象包含 code、message 与可选 cause；code 为 load、unsupported、render 或 context-lost。显式 2d 不是错误。',
          },
          {
            name: 'onStatusChange',
            type: "(status: 'loading' | 'ready' | 'fallback' | 'error') => void",
            description:
              '准备、就绪、自动回退或模块错误。根元素同时提供 data-status 与 data-renderer。',
          },
          {
            name: 'classNames',
            type: '{ root?; stage?; canvas?; controls?; control?; point?; tooltip?; pointList?; pointItem?; loading?; fallback?; error?; label?; legend?; legendItem?; search?; arcList?; arcItem?; arcDetails? }',
            description: '语义 slot 的追加类名，不覆盖基础样式。',
          },
          {
            name: 'ref / ...rest',
            type: 'React.Ref<HTMLDivElement> / 原生 div 属性',
            description:
              'ref 指向根 div，不暴露 Three.js 实例；className、style、aria-*、data-* 与原生事件透传。children、color 与同名状态事件不属于透传项。',
          },
        ]}
      />
      <h3 className="doc-h3">GlobePoint</h3>
      <ApiTable
        rows={[
          {
            name: 'id',
            type: 'string',
            description: '必填稳定非空 id，第一条有效的重复 id 保留。arcs 的 from / to 引用此值。',
          },
          {
            name: 'latitude / longitude',
            type: 'number / number',
            description:
              '必填有限数字；纬度须在 −90 到 90，越界点位忽略。建议经度在 −180 到 180；有限经度会归一化到 [−180, 180)。',
          },
          {
            name: 'name / value',
            type: 'string / number | string',
            description:
              '可选名称与展示值；name 未提供时用 id。value 不是选择状态；valueScale 开启后仅有限数字参与尺寸映射。',
          },
          {
            name: 'category',
            type: 'string',
            description: '可选分类 id，引用 categories 中的 id；未配置分类的点位始终保留。',
          },
          {
            name: 'color',
            type: 'string',
            description:
              '可选浏览器 CSS 颜色，包括语义令牌 var()；显式颜色优先于分类颜色，最后回退 --zuvi-globe-point-color。',
          },
          {
            name: 'size',
            type: 'number',
            defaultValue: '0.016',
            description:
              '相对地球半径的点位半径，限于 0.008 到 0.06，不是 CSS px；显式 size 优先于 valueScale。',
          },
        ]}
      />
      <h3 className="doc-h3">GlobeCategory、GlobeValueScale 与 GlobeFocusRequest</h3>
      <ApiTable
        rows={[
          {
            name: 'GlobeCategory.id / name / color',
            type: 'string / string / string',
            description: '稳定分类 id、可访问名称与可选 CSS 颜色；图例不只依赖颜色区分分类。',
          },
          {
            name: 'GlobeValueScale.domain / range',
            type: 'readonly [number, number]',
            defaultValue: '完整数字值范围 / [0.012, 0.036]',
            description:
              'domain 是数值范围，range 是相对点位半径（0.008…0.06）；面积线性插值，同值使用中间面积。',
          },
          {
            name: 'GlobeFocusRequest.pointId / key / zoom',
            type: 'string / string | number / number',
            description:
              '目标点位 id、可选重复请求 key、可选目标缩放（0.75…2）；缺省保持当前缩放。',
          },
        ]}
      />
      <h3 className="doc-h3">GlobeArc 与 GlobeView</h3>
      <ApiTable
        rows={[
          {
            name: 'GlobeArc.id / from / to',
            type: 'string',
            description: '必填连接 id 和两端点位 id；不是嵌套坐标对象。',
          },
          {
            name: 'GlobeArc.name / value',
            type: 'string / number | string',
            description:
              '可选路径名称与展示值，用于连接列表及详情；不改变 from / to 的 id 引用，也不宣称实时指标。',
          },
          {
            name: 'GlobeArc.color',
            type: 'string',
            description: '可选 CSS 颜色；默认使用 --zuvi-globe-arc-color。',
          },
          {
            name: 'GlobeArc.width',
            type: 'number',
            defaultValue: '0.0025',
            description: '相对地球半径的管线半径，限于 0.001 到 0.02。',
          },
          {
            name: 'GlobeArc.altitude',
            type: 'number',
            description: '弧线相对地球半径的抬升高度，限于 0.02 到 0.8；缺省由连接距离决定。',
          },
          {
            name: 'GlobeArc.animated',
            type: 'boolean',
            defaultValue: 'true',
            description:
              '是否允许本条 WebGL 连接的亮点动画；false 可以单独关闭。二维模式保持静态。',
          },
          {
            name: 'GlobeView.latitude / longitude',
            type: 'number',
            description: '相机中心纬度 / 经度；纬度限制到 −90…90，经度归一化到 [−180, 180)。',
          },
          {
            name: 'GlobeView.zoom',
            type: 'number',
            defaultValue: '1',
            description: '缩放倍率，限于 0.75 到 2。',
          },
        ]}
      />
      <p className="doc-p">
        <code>labels</code>{' '}
        字段：label、loading、rotate、pause、zoomIn、zoomOut、reset、points、noPoints、instructions、fallback、error、retry、latitude、longitude、value、search、searchPlaceholder、clearSearch、searchResults、noResults、legend、showAll、hiddenSelection、focusPoint、arcs、noArcs、selectedArc。设置
        label 为具体业务名称，instructions 用于舞台的键盘说明。
      </p>

      <CustomizeOutlet
        name="Globe"
        parts={[
          'root',
          'stage',
          'canvas',
          'controls',
          'control',
          'point',
          'tooltip',
          'point-list',
          'point-item',
          'label',
          'legend',
          'legend-item',
          'search',
          'arc-list',
          'arc-item',
          'arc-details',
          'loading',
          'fallback',
          'error',
        ]}
        vars={[
          '--zuvi-globe-height',
          '--zuvi-globe-bg',
          '--zuvi-globe-border-radius',
          '--zuvi-globe-ocean-color',
          '--zuvi-globe-land-color',
          '--zuvi-globe-coast-color',
          '--zuvi-globe-grid-color',
          '--zuvi-globe-atmosphere-color',
          '--zuvi-globe-point-color',
          '--zuvi-globe-arc-color',
        ]}
        note="将变量覆盖在 Globe 根元素上；透明背景可以融入品牌面板。root 上的 data-renderer 使用 webgl / 2d，不使用 3d；颜色不是点位状态的唯一表达方式。"
      />
      <CodeBlock code={CUSTOM_CODE} language="tsx" />

      <h2 className="doc-h2">数据来源与运行方式</h2>
      <p className="doc-p">
        内置陆地与海岸线来自 Natural Earth{' '}
        <a
          href="https://naturalearth.s3.amazonaws.com/110m_physical/ne_110m_land.zip"
          target="_blank"
          rel="noreferrer"
        >
          ne_110m_land 4.1.0 · 1:110m physical land
        </a>
        ， 依照其{' '}
        <a
          href="https://www.naturalearthdata.com/about/terms-of-use/"
          target="_blank"
          rel="noreferrer"
        >
          Public domain 使用条款
        </a>
        预处理并内嵌，保留原始环与洞，坐标四舍五入到
        0.01°。不绘制国家边界，不应作为导航、测量或行政区划依据。
      </p>
      <p className="doc-p">
        本页点位是近似 WGS84 城市中心参考坐标；连线手工组合，连接数由本地示例图的度数计算，路径
        value 仅为示例序号。 时区使用独立的 IANA
        标识，没有计算当前时间或夏令时。没有真实吞吐量、在线率或延迟数据，也不发起这些指标的网络请求。
      </p>
      <div className="globe-delivery-grid">
        <section>
          <h3>ESM / npm</h3>
          <p>
            从 <code>@zuvi/react</code> 导入 Globe 和类型，并加载{' '}
            <code>@zuvi/react/styles.css</code>。挂载后按需加载场景；auto 模式再加载 Three.js
            渲染器。仅导入组件不会创建 WebGL 上下文，显式 2d 不加载 Three.js。
          </p>
        </section>
        <section>
          <h3>CDN / IIFE 与离线 HTML</h3>
          <p>
            全局 <code>ZUVI.Globe</code> 沿用同一 API。单文件 IIFE 会包含渲染代码，不承诺 ESM
            的分包体积收益；地理数据本地内嵌，不依赖远程纹理或地图服务。首次取得 CDN
            文件仍需网络，搭建器导出则将脚本和样式直接内联。
          </p>
        </section>
      </div>
      <h3 className="doc-h3">页面搭建器</h3>
      <p className="doc-p">
        <a href="#/builder">页面搭建器</a>的内容与数据展示分组提供 Globe。点位使用{' '}
        <code>rowsJson</code> 的扁平行：id、lat、lng、name、value、category、color、size；连接使用{' '}
        <code>arcsJson</code>：id、from、to、name、value、color、width、altitude、animated；分类使用{' '}
        <code>categoriesJson</code>：id、name、color。适配器将 lat / lng 转成 latitude / longitude，
        不保存函数、Three.js 对象或嵌套坐标。标签、列表搜索、数值尺寸、路径列表和过渡时长均可配置。
      </p>
      <p className="doc-p">
        编辑画布使用轻量二维，交互预览和导出使用配置的 2d / auto 模式；默认 2d。搭建器行数据要求 lat
        在 −90…90、lng 在 −180…180，与组件直接接收有限经度后归一化的规则不同。越界坐标、重复 id
        或找不到端点的连接会提示被忽略。导出的 HTML
        保留选择、列表与控件，并可在阻断网络的环境中使用。
      </p>
    </div>
  );
}
