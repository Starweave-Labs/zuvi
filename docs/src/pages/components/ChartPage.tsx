'use client';

import { useState, type CSSProperties, type ReactNode } from 'react';
import {
  Button,
  Chart,
  Collapse,
  Segmented,
  Switch,
  type ChartDatum,
  type ChartScatterSeries,
  type ChartSeries,
  type ChartSlice,
} from '@zuvi/react';
import ApiTable from '../../components/ApiTable';
import CodeBlock from '../../components/CodeBlock';
import CustomizeOutlet from '../../components/CustomizeOutlet';
import Demo from '../../components/Demo';
import { usePageTitle } from '../../components/usePageTitle';
import './chart-page.css';

type TrendType = 'line' | 'area' | 'bar';
type PlotStyle = 'clear' | 'soft' | 'bold';
const MONTHS = ['1 月', '2 月', '3 月', '4 月', '5 月', '6 月'];
// Synthetic fixtures for learning the component, not observations or business telemetry.
const TREND_SERIES: ChartSeries[] = [
  {
    id: 'design',
    name: '设计项目',
    color: 'var(--zuvi-chart-series-1)',
    values: [28, 36, 32, 48, 54, 64],
  },
  {
    id: 'development',
    name: '研发项目',
    color: 'var(--zuvi-chart-series-2)',
    values: [20, 28, 38, 34, 46, 52],
  },
];
const SLICES: ChartSlice[] = [
  { id: 'design', label: '产品设计', value: 42, color: 'var(--zuvi-color-primary)' },
  { id: 'development', label: '技术开发', value: 28, color: 'var(--zuvi-color-success)' },
  { id: 'content', label: '内容运营', value: 18, color: 'var(--zuvi-color-warning)' },
  { id: 'other', label: '其他', value: 12, color: 'var(--zuvi-color-info)' },
];
const SCATTER_SERIES: ChartScatterSeries[] = [
  {
    id: 'group-a',
    name: '方案 A',
    color: 'var(--zuvi-color-primary)',
    points: [
      { id: 'a1', x: 2, y: 12, label: 'A · 试点' },
      { id: 'a2', x: 4, y: 24, label: 'A · 小组' },
      { id: 'a3', x: 7, y: 32, label: 'A · 团队' },
      { id: 'a4', x: 9, y: 46, label: 'A · 扩展' },
    ],
  },
  {
    id: 'group-b',
    name: '方案 B',
    color: 'var(--zuvi-color-success)',
    points: [
      { id: 'b1', x: 3, y: 18, label: 'B · 试点' },
      { id: 'b2', x: 5, y: 20, label: 'B · 小组' },
      { id: 'b3', x: 6, y: 36, label: 'B · 团队' },
      { id: 'b4', x: 8, y: 40, label: 'B · 扩展' },
    ],
  },
];
const TREND_TYPES = [
  { value: 'line', label: '折线' },
  { value: 'area', label: '面积' },
  { value: 'bar', label: '柱状' },
];
const STYLE_OPTIONS = [
  { value: 'clear', label: '清晰' },
  { value: 'soft', label: '柔和' },
  { value: 'bold', label: '强调' },
];
const PLOT_STYLES: Record<PlotStyle, CSSProperties> = {
  clear: {
    '--zuvi-chart-bg': 'transparent',
    '--zuvi-chart-series-1': 'var(--zuvi-color-primary)',
    '--zuvi-chart-series-2': 'var(--zuvi-color-success)',
    '--zuvi-chart-line-width': '2.5',
    '--zuvi-chart-point-radius': '4px',
  } as CSSProperties,
  soft: {
    '--zuvi-chart-bg': 'var(--zuvi-color-bg-muted)',
    '--zuvi-chart-grid-color': 'var(--zuvi-color-border-subtle)',
    '--zuvi-chart-series-1': 'var(--zuvi-color-info)',
    '--zuvi-chart-series-2': 'var(--zuvi-color-primary)',
    '--zuvi-chart-line-width': '2',
    '--zuvi-chart-point-radius': '3px',
  } as CSSProperties,
  bold: {
    '--zuvi-chart-bg': 'transparent',
    '--zuvi-chart-series-1': 'var(--zuvi-color-primary)',
    '--zuvi-chart-series-2': 'var(--zuvi-color-warning)',
    '--zuvi-chart-line-width': '4',
    '--zuvi-chart-point-radius': '5px',
  } as CSSProperties,
};
const TREND_CODE = `import { useState } from 'react';
import { Chart, type ChartDatum } from '@zuvi/react';

const categories = ['1 月', '2 月', '3 月', '4 月', '5 月', '6 月'];
const series = [
  { id: 'design', name: '设计项目', values: [28, 36, 32, 48, 54, 64] },
  { id: 'development', name: '研发项目', values: [20, 28, 38, 34, 46, 52] },
]; // 合成示例数据

function Trend() {
  const [value, setValue] = useState<string | null>(null);
  const [hidden, setHidden] = useState<string[]>([]);
  const [lastClick, setLastClick] = useState<ChartDatum | null>(null);
  return <>
    <Chart type="line" aria-label="半年项目趋势示例"
      title="半年项目趋势（示例）" categories={categories} series={series}
      value={value} onChange={setValue}
      hiddenSeries={hidden} onHiddenSeriesChange={setHidden}
      onDataClick={setLastClick} />
    <output>{lastClick ? lastClick.label + '：' + lastClick.value : '等待点击'}</output>
  </>;
}`;
const RADIAL_CODE = `<Chart type="donut" aria-label="项目组成示例"
  title="项目组成（示例）" height={240}
  data={[
    { id: 'design', label: '产品设计', value: 42 },
    { id: 'development', label: '技术开发', value: 28 },
    { id: 'content', label: '内容运营', value: 18 },
    { id: 'other', label: '其他', value: 12 },
  ]} /> // 改为 type="pie" 使用相同切片数据`;
const SCATTER_CODE = `<Chart type="scatter" aria-label="投入与完成项数示例"
  title="投入与结果（示例）" height={240}
  xLabel="投入（人日）" yLabel="完成项数"
  series={[
    { id: 'a', name: '方案 A', points: [
      { id: 'a1', x: 2, y: 12, label: '试点' },
      { id: 'a2', x: 7, y: 32, label: '团队' },
    ] },
    { id: 'b', name: '方案 B', points: [
      { id: 'b1', x: 3, y: 18, label: '试点' },
      { id: 'b2', x: 6, y: 36, label: '团队' },
    ] },
  ]} />`;
const GAP_CODE = `<Chart type="line" aria-label="正负值与数据缺口示例"
  categories={['周一', '周二', '周三', '周四', '周五']}
  series={[
    { id: 'change', name: '净变化', values: [12, -8, null, 0, 16] },
    { id: 'reference', name: '对照', values: [6, 4, -4, 8, 10] },
  ]} /> // null 留下缺口，0 是真实零值，负值在零基线下方`;
const STATE_CODE = `<Chart type="line" aria-label="数据状态示例"
  categories={categories} series={series}
  loading={loading} error={error}
  labels={{ dataTable: '查看示例数据', empty: '还没有示例记录' }} />
// loading / error 由应用提供；空数组显示空状态。
// 外部 error 不会把已有数据伪装为成功，也不会清空其数据表。`;
const BUILDER_CODE = `// line / area / bar：category 为文字，数值列通过 valueKey 关联
rowsJson: [{ category: '1 月', design: 28, development: 20 }]
seriesJson: [
  { id: 'design', name: '设计项目', valueKey: 'design', color: 'var(--zuvi-color-primary)' },
  { id: 'development', name: '研发项目', valueKey: 'development' },
]

// pie / donut：seriesJson 不参与绘制
rowsJson: [{ id: 'design', label: '产品设计', value: 42 }]

// scatter：seriesId 关联系列；同一系列内的点位 id 必须唯一
rowsJson: [{ id: 'a1', seriesId: 'a', x: 2, y: 12, label: '试点' }]
seriesJson: [{ id: 'a', name: '方案 A', color: 'var(--zuvi-color-primary)' }]`;

function findTrendDatum(id: string | null, type: TrendType): ChartDatum | null {
  for (const series of TREND_SERIES) {
    const index = series.values.findIndex((_, i) => `${encodeURIComponent(series.id)}:${i}` === id);
    const value = series.values[index];
    if (index >= 0 && typeof value === 'number')
      return {
        id: id!,
        type,
        seriesId: series.id,
        seriesName: series.name,
        index,
        label: MONTHS[index],
        value,
        color: series.color!,
      };
  }
  return null;
}

function TrendExample() {
  const [type, setType] = useState<TrendType>('line');
  const [plotStyle, setPlotStyle] = useState<PlotStyle>('clear');
  const [hiddenSeries, setHiddenSeries] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>('design:5');
  const [lastClick, setLastClick] = useState<ChartDatum | null>(null);
  const [settings, setSettings] = useState({
    legend: true,
    grid: true,
    tooltip: true,
    table: true,
    disabled: false,
  });
  const selected = findTrendDatum(selectedId, type);
  const latestTotal = TREND_SERIES.reduce(
    (total, series) => total + (series.values.at(-1) ?? 0),
    0
  );
  return (
    <div
      className="chart-trend"
      role="region"
      aria-label="半年项目趋势示例"
      data-chart-demo="trend"
      data-chart-style={plotStyle}
    >
      <div className="chart-trend-heading">
        <div>
          <span className="chart-eyebrow">系列对比 / 半年视图</span>
          <p className="chart-sample-note">合成示例 · 非实时</p>
        </div>
        <div className="chart-trend-total">
          <strong>{latestTotal}</strong>
          <span>6 月两系列合计 / 项目数</span>
        </div>
      </div>
      <div className="chart-toolbar" role="group" aria-label="趋势图工具栏">
        <div className="chart-control">
          <span>图表类型</span>
          <Segmented
            aria-label="趋势图类型"
            size="sm"
            options={TREND_TYPES}
            value={type}
            onChange={(value) => {
              if (value === 'line' || value === 'area' || value === 'bar') setType(value);
            }}
          />
        </div>
        <div className="chart-control">
          <span>绘图样式</span>
          <Segmented
            aria-label="绘图样式"
            size="sm"
            options={STYLE_OPTIONS}
            value={plotStyle}
            onChange={(value) => {
              if (value === 'clear' || value === 'soft' || value === 'bold') setPlotStyle(value);
            }}
          />
        </div>
      </div>
      <Chart
        type={type}
        aria-label="半年项目趋势图"
        title="半年项目趋势（示例）"
        description="设计与研发项目数；切换图表类型，不改变数据。"
        categories={MONTHS}
        series={TREND_SERIES}
        height={300}
        xLabel="月份"
        yLabel="项目数"
        value={selectedId}
        onChange={setSelectedId}
        onDataClick={setLastClick}
        hiddenSeries={hiddenSeries}
        onHiddenSeriesChange={setHiddenSeries}
        legend={settings.legend}
        grid={settings.grid}
        tooltip={settings.tooltip}
        showDataTable={settings.table}
        disabled={settings.disabled}
        style={PLOT_STYLES[plotStyle]}
      />
      <div className="chart-trend-details">
        <section className="chart-selection" aria-label="所选数据详情">
          <span className="chart-eyebrow">所选数据</span>
          {selected ? (
            <>
              <strong>
                {selected.seriesName} · {selected.label}
              </strong>
              <span className="chart-selection-value">
                {selected.value}
                <small> 项目</small>
              </span>
              <code>{selected.id}</code>
              {hiddenSeries.includes(selected.seriesId) && (
                <small>所选系列已隐藏，完整数据仍保留在表中。</small>
              )}
            </>
          ) : (
            <p>选择一个数据点，查看系列与数值。</p>
          )}
        </section>
        <section className="chart-event" aria-label="点击事件示例">
          <span className="chart-eyebrow">onDataClick / 事件输出</span>
          <output aria-live="polite" data-chart-event>
            {lastClick
              ? JSON.stringify(
                  {
                    id: lastClick.id,
                    type: lastClick.type,
                    seriesId: lastClick.seriesId,
                    label: lastClick.label,
                    value: lastClick.value,
                  },
                  null,
                  2
                )
              : '等待 onDataClick 事件。点击图中的数据点后，这里显示实际回调内容。'}
          </output>
        </section>
      </div>
      <details className="chart-settings">
        <summary>显示与交互设置</summary>
        <div className="chart-settings-controls">
          {(
            [
              ['legend', '显示图例'],
              ['grid', '显示网格'],
              ['tooltip', '显示提示'],
              ['table', '显示数据表'],
              ['disabled', '禁用交互'],
            ] as const
          ).map(([key, label]) => (
            <Switch
              key={key}
              label={label}
              checked={settings[key]}
              onChange={(checked) => setSettings((current) => ({ ...current, [key]: checked }))}
            />
          ))}
        </div>
      </details>
    </div>
  );
}

function RadialExample() {
  const [type, setType] = useState<'pie' | 'donut'>('donut');
  const [value, setValue] = useState<string | null>(null);
  const [clicked, setClicked] = useState<ChartDatum | null>(null);
  return (
    <div className="chart-compact" data-chart-demo="radial">
      <Segmented
        aria-label="组成图类型"
        size="sm"
        options={[
          { value: 'donut', label: '环形' },
          { value: 'pie', label: '饼图' },
        ]}
        value={type}
        onChange={(next) => {
          if (next === 'pie' || next === 'donut') setType(next);
        }}
      />
      <Chart
        type={type}
        aria-label="项目组成图"
        title="项目组成（示例）"
        description="四类合成数据；点击图例改变可见组成。"
        height={240}
        data={SLICES}
        value={value}
        onChange={setValue}
        onDataClick={setClicked}
      />
      <output className="chart-compact-note" aria-live="polite">
        {clicked && value === clicked.id
          ? `${clicked.label} · ${clicked.value} · 点击时可见占比 ${((clicked.percent ?? 0) * 100).toFixed(1)}%`
          : '点击扇区查看数值与可见占比；占比不是全数据总量的固定比例。'}
      </output>
    </div>
  );
}

function ScatterExample() {
  const [value, setValue] = useState<string | null>(null);
  const [clicked, setClicked] = useState<ChartDatum | null>(null);
  return (
    <div className="chart-compact" data-chart-demo="scatter">
      <p className="chart-compact-intro">两组方案 · 8 个合成示例点</p>
      <Chart
        type="scatter"
        aria-label="投入与结果散点图"
        title="投入与结果（示例）"
        description="横轴与纵轴都是连续数值；示例不用于推断因果。"
        height={240}
        xLabel="投入（人日）"
        yLabel="完成项数"
        series={SCATTER_SERIES}
        value={value}
        onChange={setValue}
        onDataClick={setClicked}
      />
      <output className="chart-compact-note" aria-live="polite">
        {clicked && value === clicked.id
          ? `${clicked.label} · x = ${clicked.x} / y = ${clicked.y}`
          : '点击散点查看两维数据，或展开数据表阅读每个点位。'}
      </output>
    </div>
  );
}

function SignedExample() {
  const [type, setType] = useState<TrendType>('line');
  return (
    <Demo
      title="正负值与缺口"
      description="负值保留符号；null 是缺口而非零值。折线和面积不会跨缺口连接。"
      code={GAP_CODE}
      stack
    >
      <Segmented
        aria-label="缺口图类型"
        size="sm"
        options={TREND_TYPES}
        value={type}
        onChange={(value) => {
          if (value === 'line' || value === 'area' || value === 'bar') setType(value);
        }}
      />
      <Chart
        type={type}
        aria-label="正负值与数据缺口图"
        title="净变化（示例）"
        height={240}
        categories={['周一', '周二', '周三', '周四', '周五']}
        series={[
          { id: 'change', name: '净变化', values: [12, -8, null, 0, 16] },
          { id: 'reference', name: '对照', values: [6, 4, -4, 8, 10] },
        ]}
      />
    </Demo>
  );
}

function StateExample() {
  const [state, setState] = useState<'ready' | 'loading' | 'empty' | 'error'>('loading');
  return (
    <Demo
      title="应用数据状态"
      description="本地开关模拟状态，不请求服务。外部错误或加载期间，已有数据仍可通过数据表阅读。"
      code={STATE_CODE}
      stack
    >
      <div className="chart-state-toolbar">
        <Segmented
          aria-label="图表数据状态"
          size="sm"
          value={state}
          options={[
            { value: 'ready', label: '就绪' },
            { value: 'loading', label: '加载' },
            { value: 'empty', label: '空数据' },
            { value: 'error', label: '错误' },
          ]}
          onChange={(value) => {
            if (value === 'ready' || value === 'loading' || value === 'empty' || value === 'error')
              setState(value);
          }}
        />
        {state === 'error' && (
          <Button variant="outline" size="sm" onClick={() => setState('ready')}>
            重试示例
          </Button>
        )}
      </div>
      <Chart
        type="line"
        aria-label="应用数据状态图"
        title="数据状态（示例）"
        height={240}
        categories={state === 'empty' ? [] : MONTHS}
        series={state === 'empty' ? [] : TREND_SERIES}
        loading={state === 'loading'}
        error={state === 'error' ? '示例数据请求失败。请使用“重试示例”恢复。' : undefined}
        labels={{ dataTable: '查看示例数据', empty: '还没有示例记录' }}
      />
    </Demo>
  );
}

export default function ChartPage(): ReactNode {
  usePageTitle('Chart 数据图表');
  const [expanded, setExpanded] = useState<string[]>([]);
  return (
    <div className="doc-page chart-doc-page">
      <h1 className="doc-h1">Chart 数据图表</h1>
      <p className="doc-lead">
        Chart 提供 13 种类型、17 种 SVG 形式，共享图例、数据提示、可选择数据点与完整数据表。
        本页保留折线、面积、柱状、饼图、环形与散点六种基础示例；完整形式与进阶交互见独立图表专区。
      </p>
      <p className="doc-p">
        <a href="#/charts">图表画廊 · 17 种形式</a> ·{' '}
        <a href="#/charts/interactions">交互与联动</a> ·{' '}
        <a href="#/charts/playground">可视化实验室</a>
      </p>

      <h2 className="doc-h2">趋势与系列对比</h2>
      <Demo
        title="从趋势到对比，一份数据三种视图"
        description="六个月、两个系列的合成示例。图例控制可见系列；点击数据点同步下方详情和实际事件输出。"
        code={TREND_CODE}
        stack
      >
        <TrendExample />
      </Demo>

      <h2 className="doc-h2">组成与两维关系</h2>
      <div className="chart-gallery">
        <Demo
          title="组成 · 饼图与环形图"
          description="切换类型复用切片数据；图例隐藏的切片不参与可见占比。"
          code={RADIAL_CODE}
          stack
        >
          <RadialExample />
        </Demo>
        <Demo
          title="关系 · 散点图"
          description="每个系列包含独立 x / y 坐标和稳定点位 id。以下数值均为合成示例。"
          code={SCATTER_CODE}
          stack
        >
          <ScatterExample />
        </Demo>
      </div>

      <h2 className="doc-h2">数据边界与应用状态</h2>
      <p className="doc-p">
        常用视图保持紧凑；展开下方示例检查负值、缺口与应用状态。收起时不挂载额外绘图实例。
      </p>
      <Collapse
        value={expanded}
        onChange={setExpanded}
        items={[
          {
            key: 'signed',
            label: '正负值与数据缺口',
            children: expanded.includes('signed') ? <SignedExample /> : null,
          },
          {
            key: 'states',
            label: '加载、空数据与错误',
            children: expanded.includes('states') ? <StateExample /> : null,
          },
        ]}
      />

      <h2 className="doc-h2">数据与交互约定</h2>
      <ul className="doc-ul">
        <li>
          折线 / 面积 / 柱状使用文字 categories 和对齐的 series.values；有限数字保留正负与零，null
          表示缺口，不自动转换数字字符串。
        </li>
        <li>
          饼 / 环形使用 data 切片，value
          必须是非负有限数字。零值仍出现在图例和数据表中，不生成扇区。
        </li>
        <li>
          散点使用 series.points；x / y 是有限数字，同一系列内的点位 id
          唯一。空数据与结构错误是不同状态。
        </li>
        <li>
          数据 id：分类点为 encodeURIComponent(series.id) + ':' + index；散点为编码后的系列 id + ':'
          + 编码后的点位 id；切片直接使用 slice.id。
        </li>
        <li>
          hiddenSeries / value 支持受控与非受控用法；图例隐藏系列不删除原始数据。Tab
          定位图例和数据点，Enter / Space 操作原生按钮；数据表可独立展开。
        </li>
      </ul>

      <h2 className="doc-h2">搭建器与按需加载</h2>
      <p className="doc-p">
        搭建器新增独立的 Chart 节点，原有 DataChart 业务区块保持不变。rowsJson 与 seriesJson
        只接受扁平标量行；切换类型后需使用相应的数据结构，不把嵌套图表对象或函数写入页面 JSON。
      </p>
      <details className="chart-data-contract">
        <summary>查看搭建器的三类扁平数据结构</summary>
        <CodeBlock code={BUILDER_CODE} language="tsx" />
      </details>
      <p className="doc-p">
        npm / ESM 在 Chart
        挂载后按需加载绘图模块；标题与说明先呈现，模块加载后提供绘图、图例和可展开数据表。应用
        loading / error 期间仍可查看已有数据；模块本身加载失败时显示重试入口。CDN / IIFE
        和搭建器的离线 HTML 内嵌 SVG 运行时，不需要外部图表引擎或数据服务。
      </p>

      <h2 className="doc-h2">API</h2>
      <p className="doc-p">
        13 个 type 判别值对应 17 种形式：area / bar 的 stack、bar 的 horizontal 与 scatter 的 bubble
        扩展现有类型，不增加新的判别值。新动画、缩放、框选与 CSV 均显式开启，默认关闭。
      </p>
      <ApiTable
        rows={[
          {
            name: 'type',
            type: "'line' | 'area' | 'bar' | 'pie' | 'donut' | 'scatter' | 'radar' | 'heatmap' | 'treemap' | 'funnel' | 'gauge' | 'waterfall' | 'sparkline'",
            defaultValue: "'line'",
            description: '13 个判别类型；分类系列、切片、单元格、增量与散点 props 不可混用。',
          },
          {
            name: 'categories / series',
            type: 'readonly string[] / readonly ChartSeries[]',
            description:
              'line / area / bar / radar / sparkline 必填。ChartSeries 为 { id, name, color?, values: readonly (number | null)[] }；radar 至少三个分类且所有值为非负有限数字、无 null。',
          },
          {
            name: 'data',
            type: 'readonly ChartSlice[] | readonly ChartHeatmapCell[] | readonly ChartWaterfallStep[]',
            description:
              'pie / donut / treemap / funnel 使用非负有限切片；gauge 仅一条有限任意符号值且在 min/max 内；waterfall 为有符号增量 { id, label, value, color? }；heatmap 为 { id, row, col, value, color? }，value 任意有限符号、坐标不重复。',
          },
          {
            name: 'series (scatter)',
            type: 'readonly ChartScatterSeries[]',
            description:
              '仅 scatter：{ id, name, color?, points: readonly { id, x, y, label?, value? }[] }；x/y 有限、点位 id 在系列内唯一，提供的 value 必须非负有限。',
          },
          {
            name: 'stack / orientation',
            type: "boolean / 'horizontal'",
            defaultValue: 'false / —',
            description: 'stack 仅 area/bar 开启堆叠且保留 null 缺口；orientation 仅 bar 设置水平柱状，省略时保持垂直。',
          },
          {
            name: 'bubble / bubbleDomain',
            type: 'boolean / readonly [number, number]',
            defaultValue: 'false / —',
            description: '仅 scatter：可选点位 value 映射气泡面积，有限递增 bubbleDomain 省略时取完整原始数值域。',
          },
          {
            name: 'min / max (gauge)',
            type: 'number',
            defaultValue: '0 / max(100, value)',
            description: '仪表有限上下界且 min < max；仅一条数据值、任意符号、必须位于闭区间 [min, max]。',
          },
          {
            name: 'title / description',
            type: 'ReactNode',
            description: '可选的标题与说明；可通过原生 aria-label 提供明确的图表名称。',
          },
          {
            name: 'height',
            type: 'number',
            defaultValue: '300',
            description: '绘图区高度，单位 CSS px，范围 180–800；宽度随容器响应。',
          },
          {
            name: 'legend / grid / tooltip / showDataTable',
            type: 'boolean',
            defaultValue: 'true',
            description: '显示图例、网格、数据提示与完整数据表；隐藏与缩放不裁剪原始表格。网格不用于径向图。',
          },
          {
            name: 'tooltipMode',
            type: "'datum' | 'crosshair'",
            defaultValue: "'datum'",
            description: '逐项提示为默认；分类图可显式开启十字准线。悬停不改变选择回调。',
          },
          {
            name: 'animated / zoom / brush / csv',
            type: 'boolean',
            defaultValue: 'false',
            description: '显式开启过渡、分类/散点 X 范围缩放、框选缩放与 CSV；减少动态效果设置优先，CSV 使用完整规范数据、UTF-8 BOM、CRLF 与文本公式防护。',
          },
          {
            name: 'viewRange / defaultViewRange / onViewRangeChange',
            type: 'readonly [number, number] | null / (range: readonly [number, number] | null) => void',
            description: '受控/初始可见 X 范围与独立范围回调；有限升序且位于轴域内，null 恢复完整域。不改变选择、隐藏集合或 CSV。',
          },
          {
            name: 'disabled',
            type: 'boolean',
            defaultValue: 'false',
            description: '禁用数据点和图例交互，保留只读图表与数据表。',
          },
          {
            name: 'loading / loadingContent',
            type: 'boolean / ReactNode',
            defaultValue: 'false / —',
            description: '应用控制的加载状态与可选占位内容。',
          },
          {
            name: 'error / emptyContent',
            type: 'ReactNode',
            description: '应用数据错误与自定义空状态；外部错误不会清空已有数据表。',
          },
          {
            name: 'hiddenSeries / defaultHiddenSeries / onHiddenSeriesChange',
            type: 'readonly string[] / (ids: string[]) => void',
            description: '受控 / 初始隐藏的系列 id（data 类型为项 id）与普通图例切换回调；Shift 激活只强调并淡化其他系列，不改写 hiddenSeries。',
          },
          {
            name: 'value / defaultValue / onChange',
            type: 'string | null / (id: string | null) => void',
            description: '受控 / 初始选中数据 id 与选择变化回调；默认未选择。',
          },
          {
            name: 'onDataClick',
            type: '(datum: ChartDatum, event: React.MouseEvent<Element>) => void',
            description:
              '实际数据点激活事件；datum 包含 id、type、seriesId、seriesName、index、label、value、color；散点带 x/y，径向图带当前可见 percent。',
          },
          {
            name: 'renderTooltip',
            type: '(datum: ChartDatum) => ReactNode',
            description: '自定义提示内容，不改变原始数据。',
          },
          {
            name: 'valueFormatter',
            type: "(value: number, context: 'x' | 'y' | 'value') => string",
            description: '格式化数值文本；根据坐标 / 数值上下文返回文字。',
          },
          {
            name: 'xLabel / yLabel / xDomain / yDomain',
            type: 'string / readonly [number, number]',
            description: '轴名称与可选有限递增数值域；径向图不使用数值域。',
          },
          {
            name: 'labels',
            type: 'Partial<ChartLabels>',
            description:
              '21 个公开文案键，含 zoomHint、brushHint、resetZoom、downloadCsv；局部覆盖，默认随 ConfigProvider.locale.chart。',
          },
          {
            name: 'onReady / onStatusChange / onError',
            type: '() => void / (status: ChartStatus) => void / (error: ChartError) => void',
            description: '就绪、loading / ready / empty / error 状态与加载 / 数据错误通知。',
          },
          {
            name: 'classNames',
            type: '{ root?; header?; title?; description?; plot?; svg?; legend?; legendItem?; tooltip?; dataTable?; loading?; empty?; error?; crosshair?; brush?; actions? }',
            description: '公开 slot 级类名追加；其余原生 div 属性与 ref 传递到根节点。',
          },
        ]}
      />
      <CustomizeOutlet
        name="Chart"
        parts={[
          'root',
          'header',
          'title',
          'description',
          'plot',
          'svg',
          'legend',
          'legend-item',
          'datum',
          'mark',
          'tooltip',
          'data-table',
          'loading',
          'empty',
          'error',
        ]}
        vars={[
          '--zuvi-chart-bg',
          '--zuvi-chart-border-radius',
          '--zuvi-chart-grid-color',
          '--zuvi-chart-axis-color',
          '--zuvi-chart-text-color',
          ...Array.from({ length: 8 }, (_, index) => `--zuvi-chart-series-${index + 1}`),
          '--zuvi-chart-line-width',
          '--zuvi-chart-point-radius',
        ]}
        note="趋势示例的绘图样式只覆盖本实例 CSS 变量，不改写全局主题或数据。datum 是可操作的原生按钮，mark 是对应的 SVG 视觉标记；请优先依赖公开出口而非内部路径结构。"
      />
    </div>
  );
}
