import { useState } from 'react';
import { Chart, type ChartDatum } from '@zuvi/react';
import Demo from '../../components/Demo';
import ChartSection, { SampleNote } from './ChartSection';
import { TREND_CATEGORIES, TREND_ROWS, TREND_SERIES } from './chart-fixtures';

const CHOICES = TREND_SERIES.flatMap((series) =>
  series.values.map((value, index) => ({
    id: `${encodeURIComponent(series.id)}:${index}`,
    label: `${series.name} · ${TREND_CATEGORIES[index]}`,
    value,
  }))
);
const LINK_CODE = `import { useState } from 'react';
import { Chart, type ChartDatum } from '@zuvi/react';

// categories 与 series 为同一份数据，两个图共享稳定的数据 id。
const [selectedId, setSelectedId] = useState<string | null>(null);
const [lastClick, setLastClick] = useState<ChartDatum | null>(null);
const shared = {
  categories, series, value: selectedId, onChange: setSelectedId,
  onDataClick: (datum: ChartDatum) => {
    setSelectedId(datum.id);
    setLastClick(datum);
  },
};
// 不访问 Chart ref，不模拟鼠标事件。
<Chart {...shared} type="line" tooltipMode="crosshair" />
<Chart {...shared} type="bar" />`;
const RANGE_CODE = `const [range, setRange] = useState<readonly [number, number] | null>(null);
<Chart type="line" categories={categories} series={series}
  tooltipMode="crosshair" zoom brush
  xDomain={[0, categories.length - 1]}
  viewRange={range} onViewRangeChange={setRange}
  csv labels={{ downloadCsv: '下载完整示例 CSV' }} />
// 同一 onViewRangeChange 接收手势变更；原生表单提供无手势的范围选择。
// setRange(null) 复原全域；CSV 导出完整数据，不随缩放裁剪。
// 非受控用法可改为 defaultViewRange={[1, 4]}，不要同时传 viewRange。`;
const LEGEND_CODE = `const [hiddenSeries, setHiddenSeries] = useState<string[]>([]);
const [animated, setAnimated] = useState(false);
<Chart type="line" categories={categories} series={series}
  hiddenSeries={hiddenSeries} onHiddenSeriesChange={setHiddenSeries}
  animated={animated} />
// 普通图例激活切换可见性。
// Shift + 图例激活进行高亮，不覆写 hiddenSeries。
// animated 显式开启；系统减少动态效果设置优先。`;

export default function ChartInteractionsPage() {
  const [selectedId, setSelectedId] = useState<string | null>('sin:3');
  const [lastClick, setLastClick] = useState<ChartDatum | null>(null);
  const [animated, setAnimated] = useState(false);
  const [range, setRange] = useState<readonly [number, number] | null>(null);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(TREND_CATEGORIES.length - 1);
  const [rangeMessage, setRangeMessage] = useState('完整范围；可以用下方控件代替缩放手势。');
  const [zoom, setZoom] = useState(true);
  const [brush, setBrush] = useState(true);
  const [hiddenSeries, setHiddenSeries] = useState<string[]>([]);
  const [hiddenSnapshot, setHiddenSnapshot] = useState<string | null>(null);
  const selected = CHOICES.find((choice) => choice.id === selectedId);
  const hiddenKey = [...hiddenSeries].sort().join(',');
  function changeSelection(id: string | null) {
    if (id === null || CHOICES.some((choice) => choice.id === id)) setSelectedId(id);
  }
  function activateDatum(datum: ChartDatum) {
    changeSelection(datum.id);
    setLastClick(datum);
  }
  function changeRange(next: readonly [number, number] | null) {
    setRange(next);
    setStart(next ? Math.max(0, Math.floor(next[0])) : 0);
    setEnd(
      next ? Math.min(TREND_CATEGORIES.length - 1, Math.ceil(next[1])) : TREND_CATEGORIES.length - 1
    );
    setRangeMessage(
      next
        ? `实际可见 X 范围：[${next[0].toFixed(2)}, ${next[1].toFixed(2)}]。`
        : '已恢复完整范围。'
    );
  }
  const sharedSelection = {
    categories: TREND_CATEGORIES,
    series: TREND_SERIES,
    value: selectedId,
    onChange: changeSelection,
    onDataClick: activateDatum,
    animated,
  };
  return (
    <ChartSection
      active="/charts/interactions"
      title="交互与联动"
      lead="从看见一个点，到理解一段数据。用公开的受控状态连接图表，让选择、范围与可见性各自清楚，也让键盘操作与手势同样有效。"
    >
      <aside className="viz-interaction-intro">
        <div>
          <span className="viz-eyebrow">同一份数据 · 三种交互</span>
          <p>以下全部由正弦与余弦公式计算，不请求接口，不模拟实时业务。</p>
          <SampleNote />
        </div>
        <label className="viz-toggle">
          <input
            type="checkbox"
            checked={animated}
            onChange={(event) => setAnimated(event.target.checked)}
          />
          <span>启用图表过渡</span>
        </label>
      </aside>
      <p className="viz-caption">过渡默认关闭；系统设置“减少动态效果”时，即使开启也应保持静态。</p>

      <h2 className="doc-h2">01 · 一个选择，两个视角</h2>
      <Demo
        title="十字准线与双图联动"
        description="左图开启 crosshair 提示；激活任一图的数据点后，两个图共享同一个 value。悬停本身不改变共享选择。"
        code={LINK_CODE}
        stack
      >
        <div className="viz-linked-grid" data-chart-interaction="linked">
          <Chart
            {...sharedSelection}
            type="line"
            height={240}
            tooltipMode="crosshair"
            aria-label="正弦与余弦十字准线联动图（示例）"
            title="先读趋势（示例）"
            xLabel="角度"
            yLabel="函数值"
            showDataTable={false}
          />
          <Chart
            {...sharedSelection}
            type="bar"
            height={240}
            aria-label="正弦与余弦柱状联动图（示例）"
            title="再比较大小（示例）"
            xLabel="角度"
            yLabel="函数值"
            showDataTable={false}
          />
        </div>
        <div className="viz-linked-controls">
          <label className="viz-field">
            <span>键盘等价选择</span>
            <select
              className="viz-input"
              value={selectedId ?? ''}
              onChange={(event) => changeSelection(event.target.value || null)}
            >
              <option value="">不选择数据点</option>
              {CHOICES.map((choice) => (
                <option key={choice.id} value={choice.id}>
                  {choice.label}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="viz-button" onClick={() => setSelectedId(null)}>
            清除共享选择
          </button>
        </div>
        <div className="viz-readout-grid">
          <div className="viz-readout">
            <span className="viz-eyebrow">共享选择 / value</span>
            <output aria-live="polite" data-chart-linked-selection>
              {selected ? (
                <>
                  <strong>{selected.label}</strong>
                  <span className="viz-readout-number">{selected.value}</span>
                  <code>{selected.id}</code>
                </>
              ) : (
                '尚未选择数据点。'
              )}
            </output>
          </div>
          <div className="viz-readout">
            <span className="viz-eyebrow">最近一次 / onDataClick</span>
            <output aria-live="polite" className="viz-event-output">
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
                : '只有实际图表激活回调才写入此处；页面下拉框不会伪造点击事件。'}
            </output>
          </div>
        </div>
        <p className="viz-help">
          Tab 定位图例或数据点，Enter / Space
          激活；也可使用“键盘等价选择”。十字准线只负责读数，联动选择通过 onChange / onDataClick
          完成。
        </p>
        <details className="viz-data">
          <summary>阅读双图共用的原始数据</summary>
          <div
            className="viz-table-wrap"
            role="region"
            aria-label="联动示例数据，可横向滚动"
            tabIndex={0}
          >
            <table>
              <caption>公式取样：θ 从 0° 到 180°，步长 30°</caption>
              <thead>
                <tr>
                  <th scope="col">角度</th>
                  <th scope="col">正弦 × 10</th>
                  <th scope="col">余弦 × 10</th>
                </tr>
              </thead>
              <tbody>
                {TREND_ROWS.map((row) => (
                  <tr key={row.category}>
                    <th scope="row">{row.category}</th>
                    <td>{row.sin}</td>
                    <td>{row.cos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </Demo>

      <h2 className="doc-h2">02 · 选择一个阅读范围</h2>
      <Demo
        title="缩放、框选与受控范围"
        description="zoom / brush 都显式开启。手势与下方表单更新同一个 viewRange；范围不是数据过滤，也不会改变 CSV 的原始数据。"
        code={RANGE_CODE}
        stack
      >
        <div className="viz-toolbar" role="group" aria-label="范围交互开关">
          <label className="viz-toggle">
            <input
              type="checkbox"
              checked={zoom}
              onChange={(event) => setZoom(event.target.checked)}
            />
            <span>允许滚轮 / 双指缩放</span>
          </label>
          <label className="viz-toggle">
            <input
              type="checkbox"
              checked={brush}
              onChange={(event) => setBrush(event.target.checked)}
            />
            <span>允许拖拽框选</span>
          </label>
        </div>
        <Chart
          type="line"
          categories={TREND_CATEGORIES}
          series={TREND_SERIES}
          height={280}
          animated={animated}
          title="放大一段函数曲线（示例）"
          aria-label="支持缩放与框选的函数图（示例）"
          tooltipMode="crosshair"
          zoom={zoom}
          brush={brush}
          xDomain={[0, TREND_CATEGORIES.length - 1]}
          viewRange={range}
          onViewRangeChange={changeRange}
          csv
          labels={{
            dataTable: '查看未裁剪的示例数据',
            downloadCsv: '下载完整示例 CSV',
            resetZoom: '恢复完整图表范围',
          }}
        />
        <form
          className="viz-range-controls"
          aria-label="无需手势的范围选择"
          onSubmit={(event) => {
            event.preventDefault();
            if (start >= end) {
              setRangeMessage('起点必须在终点之前；当前图表范围未改变。');
              return;
            }
            changeRange([start, end]);
          }}
        >
          <label className="viz-field">
            <span>范围起点</span>
            <select
              className="viz-input"
              value={start}
              onChange={(event) => setStart(Number(event.target.value))}
            >
              {TREND_CATEGORIES.map((category, index) => (
                <option value={index} key={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label className="viz-field">
            <span>范围终点</span>
            <select
              className="viz-input"
              value={end}
              onChange={(event) => setEnd(Number(event.target.value))}
            >
              {TREND_CATEGORIES.map((category, index) => (
                <option value={index} key={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="viz-button viz-button--primary">
            应用范围
          </button>
          <button type="button" className="viz-button" onClick={() => changeRange(null)}>
            复原全域
          </button>
        </form>
        <output className="viz-status" role="status" data-chart-view-range>
          {rangeMessage}
        </output>
        <p className="viz-help">
          支持的手势为 X 方向滚轮 / 双指缩放与拖拽框选；键盘用户可 Tab 到原生起止选择器，选择后
          Enter 应用，或激活“复原全域”。CSV 使用 Chart 原生 csv 按钮，无需额外导出库。
        </p>
      </Demo>

      <h2 className="doc-h2">03 · 隐藏不等于高亮</h2>
      <Demo
        title="图例、Shift 高亮与动画"
        description="普通图例激活改变 hiddenSeries；Shift 激活只强调系列，不覆写已经隐藏的集合。可通过状态快照核对两种操作的差别。"
        code={LEGEND_CODE}
        stack
      >
        <Chart
          type="line"
          categories={TREND_CATEGORIES}
          series={TREND_SERIES}
          height={260}
          animated={animated}
          title="系列可见性与强调（示例）"
          aria-label="图例隐藏与 Shift 高亮示例图"
          hiddenSeries={hiddenSeries}
          onHiddenSeriesChange={setHiddenSeries}
        />
        <div className="viz-toolbar" role="group" aria-label="无需图例的可见性控制">
          {TREND_SERIES.map((series) => (
            <button
              type="button"
              className="viz-button"
              key={series.id}
              aria-pressed={!hiddenSeries.includes(series.id)}
              onClick={() =>
                setHiddenSeries((current) =>
                  current.includes(series.id)
                    ? current.filter((id) => id !== series.id)
                    : [...current, series.id]
                )
              }
            >
              {hiddenSeries.includes(series.id) ? '显示' : '隐藏'}
              {series.name}
            </button>
          ))}
          <button type="button" className="viz-button" onClick={() => setHiddenSnapshot(hiddenKey)}>
            记录隐藏状态
          </button>
          <button
            type="button"
            className="viz-button"
            onClick={() => {
              setHiddenSeries([]);
              setHiddenSnapshot(null);
            }}
          >
            显示全部并清除快照
          </button>
        </div>
        <div className="viz-source-note">
          <strong>当前 hiddenSeries</strong>
          <output className="viz-event-output" aria-live="polite">
            {JSON.stringify(hiddenSeries)}
          </output>
          <p role="status">
            {hiddenSnapshot === null
              ? '先隐藏一个系列，再记录隐藏状态，然后 Shift 激活另一个可见系列的图例。'
              : hiddenSnapshot === hiddenKey
                ? '当前隐藏集合与快照一致。Shift 高亮应保留 hiddenSeries，不把隐藏系列重新显示。'
                : '隐藏集合已改变；普通图例激活或可见性按钮会改变该集合。'}
          </p>
        </div>
        <p className="viz-help">
          Tab 定位图例，Enter / Space 切换可见性；Shift + 点击或 Shift + Enter / Space
          高亮。也可用上方原生按钮显示 /
          隐藏系列。动画通过页首开关显式开启，系统减少动态效果设置优先。
        </p>
      </Demo>

      <aside className="viz-principles" aria-label="交互状态的边界">
        <div>
          <span className="viz-eyebrow">选择</span>
          <p>value 是一个稳定数据 id；悬停不替代选择，页面控件不伪造图表事件。</p>
        </div>
        <div>
          <span className="viz-eyebrow">范围</span>
          <p>viewRange 表示可见 X 区间，null 复原；缩放与框选都通过同一回调同步。</p>
        </div>
        <div>
          <span className="viz-eyebrow">可见性</span>
          <p>hiddenSeries 只改变展示，不删除原数据；Shift 强调与隐藏集合保持独立。</p>
        </div>
      </aside>
    </ChartSection>
  );
}
