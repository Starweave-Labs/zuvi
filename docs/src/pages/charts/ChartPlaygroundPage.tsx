import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Chart, Tabs, type ChartProps } from '@zuvi/react';
import ChartSection, { CodeSnippet } from './ChartSection';
import {
  CHART_FORMS,
  chartExampleCode,
  getChartForm,
  getChartInput,
  type ChartFormId,
} from './chart-fixtures';
import { chartInputHint, MAX_JSON_CHARS, parseChartInput } from './chart-input';

type PlotStyle = 'clear' | 'soft' | 'bold';
type Palette = 'categorical' | 'cool' | 'warm';
type LocalTheme = 'inherit' | 'light' | 'dark';
type InspectorPanel = 'data' | 'appearance' | 'code';
const STYLE_OPTIONS: readonly { id: PlotStyle; label: string }[] = [
  { id: 'clear', label: '清晰' },
  { id: 'soft', label: '柔和' },
  { id: 'bold', label: '强调' },
];
const PALETTES: Record<Palette, readonly string[]> = {
  categorical: ['primary', 'success', 'info', 'warning', 'danger', 'primary', 'success', 'info'],
  cool: ['info', 'primary', 'success', 'info', 'primary', 'success', 'info', 'primary'],
  warm: ['warning', 'danger', 'primary', 'warning', 'danger', 'primary', 'warning', 'danger'],
};
const PALETTE_OPTIONS: readonly { id: Palette; label: string }[] = [
  { id: 'categorical', label: '语义分色' },
  { id: 'cool', label: '清凉色序' },
  { id: 'warm', label: '暖色强调' },
];
function plotStyles(style: PlotStyle, palette: Palette): CSSProperties {
  const colors = Object.fromEntries(
    PALETTES[palette].map((token, index) => [
      `--zuvi-chart-series-${index + 1}`,
      `var(--zuvi-color-${token})`,
    ])
  );
  return {
    ...colors,
    '--zuvi-chart-bg': 'var(--zuvi-color-bg)',
    '--zuvi-chart-text-color': 'var(--zuvi-color-fg-muted)',
    '--zuvi-chart-axis-color': 'var(--zuvi-color-border)',
    '--zuvi-chart-grid-color': 'var(--zuvi-color-border-subtle)',
    '--zuvi-chart-line-width': style === 'bold' ? '4' : style === 'soft' ? '2' : '2.5',
    '--zuvi-chart-point-radius': style === 'bold' ? '5px' : style === 'soft' ? '3px' : '4px',
  } as CSSProperties;
}
const FIRST_FORM = getChartForm('line')!;
const presetJSON = (id: ChartFormId) => JSON.stringify(getChartInput(getChartForm(id)!), null, 2);
const initialResult = parseChartInput('line', presetJSON('line'));
const FIRST_COUNT = initialResult.ok ? initialResult.count : 0;

export default function ChartPlaygroundPage() {
  const [draftForm, setDraftForm] = useState<ChartFormId>('line');
  const [draft, setDraft] = useState(presetJSON('line'));
  const [applied, setApplied] = useState<{
    formId: ChartFormId;
    config: ChartProps;
    json: string;
    count: number;
    revision: number;
  }>({
    formId: 'line',
    config: FIRST_FORM.config,
    json: presetJSON('line'),
    count: FIRST_COUNT,
    revision: 0,
  });
  const [panel, setPanel] = useState<InspectorPanel>('data');
  const [validationError, setValidationError] = useState('');
  const [applyStatus, setApplyStatus] = useState('示例已就绪。编辑数据后，校验并应用到左侧预览。');
  const [customData, setCustomData] = useState(false);
  const [style, setStyle] = useState<PlotStyle>('clear');
  const [palette, setPalette] = useState<Palette>('categorical');
  const [theme, setTheme] = useState<LocalTheme>('inherit');
  const [legend, setLegend] = useState(true);
  const [grid, setGrid] = useState(true);
  const [table, setTable] = useState(true);
  const [animated, setAnimated] = useState(true);
  const [height, setHeight] = useState(300);
  const [renderError, setRenderError] = useState('');
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const committedForm = getChartForm(applied.formId)!;
  const dirty = draftForm !== applied.formId || draft !== applied.json;
  const chartStyle = plotStyles(style, palette);
  const displayConfig: ChartProps = {
    ...applied.config,
    title: `${committedForm.label} · ${customData ? '用户输入数据（非实时）' : '教学示例（非实时）'}`,
    description: customData ? '已通过结构校验；请补充实际来源与单位。' : committedForm.description,
    'aria-label': `${committedForm.label}实验室预览（${customData ? '用户输入' : '教学示例'}）`,
  };
  const code = chartExampleCode(committedForm, displayConfig, {
    height,
    legend,
    grid,
    showDataTable: table,
    animated,
    csv: true,
    style: chartStyle,
    ...(theme === 'inherit' ? {} : { theme }),
  });
  useEffect(() => {
    if (validationError && panel === 'data') editorRef.current?.focus({ preventScroll: true });
  }, [validationError, panel]);

  function loadPreset(id: ChartFormId) {
    setDraftForm(id);
    setDraft(presetJSON(id));
    setValidationError('');
    setPanel('data');
    setApplyStatus(`已载入${getChartForm(id)!.label}草稿；校验并应用后才替换预览。`);
  }
  function restoreApplied() {
    setDraftForm(applied.formId);
    setDraft(applied.json);
    setValidationError('');
    setApplyStatus('已还原为上一份有效数据，预览未改变。');
  }
  function applyDraft() {
    const result = parseChartInput(draftForm, draft);
    if (!result.ok) {
      setValidationError(result.error);
      setPanel('data');
      setApplyStatus('应用未提交。上一份有效数据、预览和可复制代码保持不变。');
      return;
    }
    setApplied((current) => ({
      formId: draftForm,
      config: result.config,
      json: draft,
      count: result.count,
      revision: current.revision + 1,
    }));
    if (draftForm !== 'sparkline' && height < 180) setHeight(180);
    setCustomData(draft !== presetJSON(draftForm));
    setValidationError('');
    setRenderError('');
    setApplyStatus(`已应用${getChartForm(draftForm)!.label}：${result.count} 个非空数据点。`);
  }
  function resetAppearance() {
    setStyle('clear');
    setPalette('categorical');
    setTheme('inherit');
    setHeight(300);
    setLegend(true);
    setGrid(true);
    setTable(true);
    setAnimated(true);
  }

  return (
    <ChartSection
      active="/charts/playground"
      title="可视化实验室"
      lead="先看图，再调数据、外观与代码。让每一次变化都清楚可见。"
      workbench
    >
      <div className="viz-lab-workbench" data-chart-workbench data-motion={animated ? 'on' : 'off'}>
        <div className="viz-lab-toolbar" role="group" aria-label="图表工作台操作">
          <label className="viz-field viz-lab-type-field">
            <span>图表形式</span>
            <select
              className="viz-input"
              value={draftForm}
              onChange={(event) => {
                if (getChartForm(event.target.value)) loadPreset(event.target.value as ChartFormId);
              }}
            >
              {CHART_FORMS.map((form) => (
                <option key={form.id} value={form.id}>
                  {form.label}
                </option>
              ))}
            </select>
          </label>
          <span className="viz-lab-draft-state" data-dirty={dirty ? 'true' : 'false'}>
            <span aria-hidden="true" />
            {dirty ? '草稿待应用' : '预览已同步'}
          </span>
          <button
            type="button"
            className="viz-button viz-button--primary viz-lab-apply"
            onClick={applyDraft}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m5 12 4 4L19 6" />
            </svg>
            校验并应用
          </button>
        </div>

        <div className="viz-lab-layout">
          <section className="viz-lab-preview" aria-labelledby="viz-lab-preview-title">
            <header className="viz-lab-preview-heading">
              <div>
                <span className="viz-eyebrow">绘图预览</span>
                <h2 id="viz-lab-preview-title">
                  {customData ? '你的数据视图' : committedForm.exampleTitle}
                </h2>
              </div>
              <div className="viz-lab-preview-meta">
                <span className="viz-lab-form-badge">{committedForm.label}</span>
                <span data-chart-applied-revision={applied.revision}>{applied.count} 数据点</span>
              </div>
            </header>
            <div
              className="viz-preview-surface"
              data-theme={theme === 'inherit' ? undefined : theme}
              data-chart-applied-form={applied.formId}
              data-chart-local-theme={theme}
            >
              <Chart
                key={applied.formId}
                {...displayConfig}
                height={height}
                legend={legend}
                grid={grid}
                showDataTable={table}
                animated={animated}
                style={chartStyle}
                csv
                labels={{ dataTable: '查看已应用数据', downloadCsv: '下载已应用数据 CSV' }}
                onError={(error) => setRenderError(error.message)}
              />
            </div>
            {renderError && (
              <p className="viz-error" role="alert">
                绘图组件报告：{renderError}。数据草稿未被自动提交。
              </p>
            )}
            <div className="viz-lab-preview-caption">
              <span className="viz-sample-dot" aria-hidden="true" />
              <span>{customData ? '用户输入数据 · 非实时' : '教学示例 · 非实时'}</span>
              <span>{customData ? '请补充实际来源与单位' : committedForm.description}</span>
            </div>
          </section>

          <aside className="viz-lab-inspector" aria-label="图表配置面板">
            <Tabs
              value={panel}
              onValueChange={(next) => {
                if (next === 'data' || next === 'appearance' || next === 'code') setPanel(next);
              }}
              className="viz-lab-inspector-tabs"
            >
              <Tabs.List aria-label="实验室配置标签">
                <Tabs.Trigger value="data">
                  数据
                  {dirty ? <span className="viz-lab-tab-dot" aria-label="有未应用草稿" /> : null}
                </Tabs.Trigger>
                <Tabs.Trigger value="appearance">外观</Tabs.Trigger>
                <Tabs.Trigger value="code">代码</Tabs.Trigger>
              </Tabs.List>

              <Tabs.Panel value="data" className="viz-lab-panel">
                <div className="viz-lab-panel-intro">
                  <h3>编辑数据</h3>
                  <p>只修改草稿，应用成功后才更新图表。</p>
                </div>
                <label className="viz-field viz-lab-json-field">
                  <span>数据 JSON · {getChartForm(draftForm)!.label}</span>
                  <textarea
                    ref={editorRef}
                    className="viz-editor"
                    value={draft}
                    onChange={(event) => {
                      setDraft(event.target.value);
                      setValidationError('');
                    }}
                    onKeyDown={(event) => {
                      if (
                        event.key === 'Enter' &&
                        (event.ctrlKey || event.metaKey) &&
                        !event.nativeEvent.isComposing
                      ) {
                        event.preventDefault();
                        applyDraft();
                      }
                    }}
                    rows={14}
                    maxLength={MAX_JSON_CHARS}
                    spellCheck={false}
                    autoCapitalize="off"
                    autoCorrect="off"
                    wrap="off"
                    aria-describedby="viz-json-schema viz-json-limits viz-json-error"
                    aria-invalid={Boolean(validationError)}
                  />
                </label>
                <div className="viz-lab-editor-meta">
                  <span>JSON</span>
                  <span>{draft.length.toLocaleString()} / 60,000 字符</span>
                </div>
                <p
                  id="viz-json-error"
                  className="viz-error"
                  role={validationError ? 'alert' : undefined}
                >
                  {validationError}
                </p>
                <div className="viz-lab-data-actions">
                  <button
                    type="button"
                    className="viz-lab-text-action"
                    onClick={() => loadPreset(draftForm)}
                  >
                    载入当前形式预设
                  </button>
                  <button type="button" className="viz-lab-text-action" onClick={restoreApplied}>
                    还原已应用数据
                  </button>
                </div>
                <details className="viz-lab-hint">
                  <summary>数据结构与校验规则</summary>
                  <p id="viz-json-schema" className="viz-schema">
                    {chartInputHint(draftForm)}
                  </p>
                  <p id="viz-json-limits" className="viz-help">
                    仅数据，不执行表达式或函数。最多 60,000 字符、256 个数据点、8
                    个系列；拒绝原型键、深层对象、数字字符串与非有限值。颜色仅接受允许的令牌。
                  </p>
                </details>
                <span className="viz-lab-key-hint">⌘ / Ctrl + Enter 应用数据</span>
              </Tabs.Panel>

              <Tabs.Panel value="appearance" className="viz-lab-panel">
                <div className="viz-lab-panel-intro">
                  <h3>调整外观</h3>
                  <p>即时预览，只改变此图表的样式。</p>
                </div>
                <fieldset className="viz-fieldset">
                  <legend>绘图样式</legend>
                  <div className="viz-style-buttons">
                    {STYLE_OPTIONS.map((option) => (
                      <button
                        type="button"
                        className="viz-filter"
                        key={option.id}
                        aria-pressed={style === option.id}
                        onClick={() => setStyle(option.id)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <fieldset className="viz-fieldset">
                  <legend>系列配色</legend>
                  <div className="viz-lab-palettes">
                    {PALETTE_OPTIONS.map((option) => (
                      <button
                        type="button"
                        key={option.id}
                        aria-pressed={palette === option.id}
                        className="viz-lab-palette"
                        onClick={() => setPalette(option.id)}
                      >
                        <span className="viz-lab-palette-swatches" aria-hidden="true">
                          {PALETTES[option.id].slice(0, 3).map((token, index) => (
                            <span
                              key={index}
                              style={{ background: `var(--zuvi-color-${token})` }}
                            />
                          ))}
                        </span>
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                </fieldset>
                <div className="viz-lab-appearance-fields">
                  <label className="viz-field">
                    <span>预览主题（仅此实例）</span>
                    <select
                      className="viz-input"
                      value={theme}
                      onChange={(event) => {
                        const next = event.target.value;
                        if (next === 'inherit' || next === 'light' || next === 'dark')
                          setTheme(next);
                      }}
                    >
                      <option value="inherit">跟随文档</option>
                      <option value="light">浅色</option>
                      <option value="dark">暗色</option>
                    </select>
                  </label>
                  <label className="viz-field">
                    <span>绘图区高度</span>
                    <select
                      className="viz-input"
                      value={height}
                      onChange={(event) => setHeight(Number(event.target.value))}
                    >
                      {applied.formId === 'sparkline' && (
                        <option value={64}>64 px · 迷你趋势</option>
                      )}
                      <option value={180}>180 px · 紧凑</option>
                      <option value={300}>300 px · 标准</option>
                      <option value={420}>420 px · 舒展</option>
                    </select>
                  </label>
                </div>
                <fieldset className="viz-fieldset viz-lab-toggles">
                  <legend>显示与过渡</legend>
                  <label className="viz-toggle">
                    <span>显示图例</span>
                    <input
                      type="checkbox"
                      checked={legend}
                      onChange={(event) => setLegend(event.target.checked)}
                    />
                  </label>
                  <label className="viz-toggle">
                    <span>显示网格</span>
                    <input
                      type="checkbox"
                      checked={grid}
                      onChange={(event) => setGrid(event.target.checked)}
                    />
                  </label>
                  <label className="viz-toggle">
                    <span>保留数据表入口</span>
                    <input
                      type="checkbox"
                      checked={table}
                      onChange={(event) => setTable(event.target.checked)}
                    />
                  </label>
                  <label className="viz-toggle">
                    <span>启用平滑过渡</span>
                    <input
                      type="checkbox"
                      checked={animated}
                      onChange={(event) => setAnimated(event.target.checked)}
                    />
                  </label>
                </fieldset>
                <p className="viz-help">配色通过 CSS 变量应用；系统减少动态效果设置优先。</p>
                <button type="button" className="viz-lab-text-action" onClick={resetAppearance}>
                  重置外观
                </button>
              </Tabs.Panel>

              <Tabs.Panel value="code" className="viz-lab-panel viz-lab-code-panel">
                <div className="viz-lab-panel-intro">
                  <h3>带走配置</h3>
                  <p>代码来自已应用数据与当前外观，未提交草稿不会写入。</p>
                </div>
                <CodeSnippet code={code} label="当前有效配置" inline />
              </Tabs.Panel>
            </Tabs>
            <output className="viz-lab-status" role="status" data-chart-apply-status>
              {applyStatus}
            </output>
          </aside>
        </div>
      </div>
      <details className="viz-lab-notes">
        <summary>
          数据来源与使用边界<span>{customData ? '用户输入数据' : '教学示例 · 非实时'}</span>
        </summary>
        <div>
          <p>
            {customData
              ? '实验室只校验结构与数值边界，不验证事实性。请在业务页面注明来源、单位与口径。'
              : committedForm.source}
          </p>
          <p>
            图表仍为 13 个 API 类型、17 种形态；堆叠、横向与气泡通过 props 表达。高度支持 180–800
            px，sparkline 额外支持 64 px。数据、外观与代码在各自标签中维护，不改写全局主题。
          </p>
          <div className="viz-variable-list">
            <code>--zuvi-chart-series-1 … 8</code>
            <code>--zuvi-chart-line-width</code>
            <code>--zuvi-chart-point-radius</code>
            <code>--zuvi-chart-bg</code>
            <code>--zuvi-chart-axis-color</code>
            <code>--zuvi-chart-grid-color</code>
            <code>--zuvi-chart-text-color</code>
          </div>
        </div>
      </details>
    </ChartSection>
  );
}
