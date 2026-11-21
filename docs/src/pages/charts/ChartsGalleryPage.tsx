import { useRef, useState } from 'react';
import { Chart } from '@zuvi/react';
import ChartSection, { ChartThumbnail, CodeSnippet, SampleNote } from './ChartSection';
import {
  CHART_FAMILIES,
  CHART_FORMS,
  chartExampleCode,
  getChartForm,
  type ChartFamilyId,
  type ChartFormId,
} from './chart-fixtures';

const FEATURED_IDS: readonly ChartFormId[] = ['donut', 'bubble', 'heatmap'];
const heroForm = getChartForm('line')!;

export default function ChartsGalleryPage() {
  const [family, setFamily] = useState<ChartFamilyId | 'all'>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<ChartFormId>('line');
  const [showDetail, setShowDetail] = useState(false);
  const detailHeading = useRef<HTMLHeadingElement>(null);
  const chosen = getChartForm(selected)!;
  const search = query.trim().toLocaleLowerCase();
  const filtered = CHART_FORMS.filter((form) => {
    const category = CHART_FAMILIES.find((item) => item.id === form.family)!;
    return (
      (family === 'all' || form.family === family) &&
      `${form.label} ${form.id} ${form.config.type} ${form.exampleTitle} ${form.description} ${category.label}`
        .toLocaleLowerCase()
        .includes(search)
    );
  });
  function inspect(id: ChartFormId) {
    setSelected(id);
    setShowDetail(true);
    requestAnimationFrame(() => {
      detailHeading.current?.focus({ preventScroll: true });
      detailHeading.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
    });
  }
  return (
    <ChartSection
      active="/charts"
      title="图表画廊"
      lead="先决定想回答的问题，再选择图表。17 种形式，共享一套数据、交互与设计令牌，从一个清楚的视角开始。"
    >
      <section className="viz-hero" aria-labelledby="viz-gallery-hero">
        <div className="viz-hero-copy">
          <span className="viz-eyebrow">让数据有一个好视角</span>
          <h2 id="viz-gallery-hero" className="viz-hero-title">
            看见变化，
            <br />
            也读懂关系。
          </h2>
          <p>从两条数学曲线出发：同一角度、不同函数，不夸大变化，也不隐藏零点。</p>
          <SampleNote>公式可复算</SampleNote>
          <div className="viz-hero-actions">
            <a className="viz-button viz-button--primary" href="#/charts/playground">
              打开实验室 <span aria-hidden="true">↗</span>
            </a>
            <button type="button" className="viz-button" onClick={() => inspect('line')}>
              查看完整示例
            </button>
          </div>
          <dl className="viz-hero-facts">
            <div>
              <dt>API 类型</dt>
              <dd>13</dd>
            </div>
            <div>
              <dt>图表形式</dt>
              <dd>17</dd>
            </div>
            <div>
              <dt>阅读目的</dt>
              <dd>7</dd>
            </div>
          </dl>
        </div>
        <div className="viz-hero-plot">
          <div className="viz-plot-caption">
            <span>01 / 趋势</span>
            <span>θ → sin / cos</span>
          </div>
          <Chart {...heroForm.config} height={260} animated={false} showDataTable={false} />
          <p className="viz-caption">{heroForm.source}</p>
        </div>
      </section>

      <section aria-labelledby="viz-featured-title" className="viz-section">
        <div className="viz-section-heading">
          <div>
            <h2 className="doc-h2" id="viz-featured-title">
              三个不同的问题
            </h2>
            <p className="viz-caption">组成、关系、分布。让视觉编码服务于问题，而不是装饰。</p>
          </div>
          <span className="viz-meta">精选 / 03</span>
        </div>
        <div className="viz-featured-grid">
          {FEATURED_IDS.map((id, index) => {
            const form = getChartForm(id)!;
            const category = CHART_FAMILIES.find((item) => item.id === form.family)!;
            return (
              <article
                className="viz-featured-card"
                key={id}
                aria-labelledby={`viz-featured-${id}`}
              >
                <div className="viz-card-kicker">
                  <span>{category.label}</span>
                  <span className="viz-meta">0{index + 1}</span>
                </div>
                <h3 id={`viz-featured-${id}`}>{form.exampleTitle}</h3>
                <Chart
                  {...form.config}
                  title={undefined}
                  description={undefined}
                  xLabel={undefined}
                  yLabel={undefined}
                  height={180}
                  animated={false}
                  legend={false}
                  showDataTable={false}
                />
                <p className="viz-caption">{category.question}</p>
                <button type="button" className="viz-text-button" onClick={() => inspect(id)}>
                  探索{form.label} <span aria-hidden="true">→</span>
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="viz-section" aria-labelledby="viz-collection-title">
        <div className="viz-section-heading">
          <div>
            <h2 className="doc-h2" id="viz-collection-title">
              找到合适的图表
            </h2>
            <p className="viz-caption">预览进入视口才挂载；只有选中的形式展开完整数据与代码。</p>
          </div>
          <span className="viz-meta">17 FORMS</span>
        </div>
        <div className="viz-filter-toolbar">
          <label className="viz-field viz-search-field">
            <span>搜索图表</span>
            <input
              type="search"
              className="viz-input"
              value={query}
              maxLength={128}
              placeholder="名称、类型或问题…"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label className="viz-field">
            <span>按形式定位</span>
            <select
              className="viz-input"
              value={selected}
              onChange={(event) => {
                if (getChartForm(event.target.value)) inspect(event.target.value as ChartFormId);
              }}
            >
              {CHART_FORMS.map((form) => (
                <option key={form.id} value={form.id}>
                  {form.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="viz-family-filters" role="group" aria-label="按阅读目的筛选">
          <button
            type="button"
            className="viz-filter"
            aria-pressed={family === 'all'}
            onClick={() => setFamily('all')}
          >
            全部 <span>{CHART_FORMS.length}</span>
          </button>
          {CHART_FAMILIES.map((category) => (
            <button
              type="button"
              key={category.id}
              className="viz-filter"
              aria-pressed={family === category.id}
              onClick={() => setFamily(category.id)}
            >
              {category.label}
              <span>{CHART_FORMS.filter((form) => form.family === category.id).length}</span>
            </button>
          ))}
        </div>
        <p className="viz-filter-status" role="status">
          找到 {filtered.length} / {CHART_FORMS.length} 种形式{query ? ` · “${query}”` : ''}
        </p>
        {filtered.length ? (
          <div className="viz-gallery-grid">
            {filtered.map((form) => (
              <article
                className="viz-gallery-card"
                key={form.id}
                data-chart-form={form.id}
                data-chart-family={form.family}
                aria-labelledby={`viz-card-${form.id}`}
              >
                <div className="viz-card-heading">
                  <h3 id={`viz-card-${form.id}`}>{form.label}</h3>
                  <code>{form.config.type}</code>
                </div>
                <ChartThumbnail form={form} />
                <p>{form.description}</p>
                <button
                  type="button"
                  className="viz-button viz-card-action"
                  aria-expanded={showDetail && selected === form.id}
                  aria-controls="viz-gallery-detail"
                  onClick={() => inspect(form.id)}
                >
                  查看{form.label}示例 <span aria-hidden="true">→</span>
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="viz-empty">
            <h3>没有匹配的形式</h3>
            <p>试试“面积”“scatter”，或返回全部阅读目的。</p>
            <button
              type="button"
              className="viz-button"
              onClick={() => {
                setQuery('');
                setFamily('all');
              }}
            >
              清除筛选
            </button>
          </div>
        )}
      </section>

      <section
        id="viz-gallery-detail"
        className={`viz-detail${showDetail ? ' viz-detail--open' : ''}`}
        aria-labelledby="viz-detail-title"
        data-chart-detail={showDetail ? chosen.id : undefined}
      >
        <div className="viz-section-heading">
          <div>
            <span className="viz-eyebrow">{showDetail ? '选中的形式' : '深入一个例子'}</span>
            <h2 id="viz-detail-title" className="doc-h2" ref={detailHeading} tabIndex={-1}>
              {showDetail ? chosen.label : '从预览到完整示例'}
            </h2>
          </div>
          {showDetail && (
            <button
              type="button"
              className="viz-button"
              onClick={() => {
                setShowDetail(false);
                document.getElementById('viz-collection-title')?.scrollIntoView({ block: 'start' });
              }}
            >
              收起示例
            </button>
          )}
        </div>
        {showDetail ? (
          <>
            <SampleNote>{chosen.exampleTitle}</SampleNote>
            <Chart
              key={chosen.id}
              {...chosen.config}
              height={300}
              animated={false}
              csv
              labels={{ dataTable: '查看完整示例数据', downloadCsv: '下载完整示例 CSV' }}
            />
            <div className="viz-source-note">
              <strong>数据从哪里来</strong>
              <p>{chosen.source}</p>
            </div>
            <CodeSnippet
              code={chartExampleCode(chosen, chosen.config, { height: 300, csv: true })}
            />
            <p className="viz-caption">
              试着修改数据、配色与线条，或比较同一形式的变化。
              <a href="#/charts/playground">进入可视化实验室</a>
            </p>
          </>
        ) : (
          <p className="viz-caption">
            选择任意卡片的“查看示例”，这里会挂载一个完整图表，附可展开数据表、CSV 与可复制代码。
          </p>
        )}
      </section>

      <aside className="viz-principles" aria-label="选择图表的三个原则">
        <div>
          <span className="viz-eyebrow">01 / 先问问题</span>
          <p>趋势用顺序，比较用共同基线；一个图只回答一个核心问题。</p>
        </div>
        <div>
          <span className="viz-eyebrow">02 / 不混淆编码</span>
          <p>气泡以面积编码；树图使用扁平切片；雷达面积不是综合评分。</p>
        </div>
        <div>
          <span className="viz-eyebrow">03 / 让数据可读</span>
          <p>明确单位与来源，保留零、负数和缺口；不要让颜色成为唯一线索。</p>
        </div>
      </aside>
    </ChartSection>
  );
}
