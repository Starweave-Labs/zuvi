import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Chart } from '@zuvi/react';
import CodeBlock from '../../components/CodeBlock';
import { usePageTitle } from '../../components/usePageTitle';
import { SAMPLE_NOTICE, type ChartForm } from './chart-fixtures';
import './charts-section.css';

export const CHART_SECTION_LINKS = [
  { path: '/charts', label: '图表画廊' },
  { path: '/charts/interactions', label: '交互与联动' },
  { path: '/charts/playground', label: '可视化实验室' },
] as const;

export default function ChartSection({
  active,
  title,
  lead,
  children,
  workbench = false,
}: {
  active: (typeof CHART_SECTION_LINKS)[number]['path'];
  title: string;
  lead: string;
  children: ReactNode;
  workbench?: boolean;
}) {
  usePageTitle(title);
  const navigation = (
    <nav className="viz-tabs" aria-label="数据可视化章节">
      {CHART_SECTION_LINKS.map((link) => (
        <a
          key={link.path}
          className="viz-tab"
          href={`#${link.path}`}
          aria-current={active === link.path ? 'page' : undefined}
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
  const apiLink = (
    <a className="viz-api-link" href="#/components/chart">
      Chart API <span aria-hidden="true">↗</span>
    </a>
  );
  return (
    <div
      className={`doc-page viz-page${workbench ? ' viz-page--workbench' : ''}`}
      data-chart-section
    >
      <header className="viz-section-header">
        {workbench ? (
          <>
            <div className="viz-workbench-heading">
              <span className="viz-eyebrow">数据可视化 / CHART LAB</span>
              <h1 className="doc-h1">{title}</h1>
              <p className="doc-lead">{lead}</p>
            </div>
            <div className="viz-workbench-navigation">
              {navigation}
              {apiLink}
            </div>
          </>
        ) : (
          <>
            <div className="viz-section-topline">
              <span className="viz-eyebrow">数据可视化</span>
              {apiLink}
            </div>
            <h1 className="doc-h1">{title}</h1>
            <p className="doc-lead">{lead}</p>
            {navigation}
          </>
        )}
      </header>
      {children}
      <footer className="viz-section-footer">
        <span>{SAMPLE_NOTICE} · 原生 SVG · 无外部数据请求</span>
        <a href="#/components/chart">查看数据结构与完整 API</a>
      </footer>
    </div>
  );
}

export function SampleNote({ children }: { children?: ReactNode }) {
  return (
    <p className="viz-sample-note">
      <span className="viz-sample-dot" aria-hidden="true" />
      {SAMPLE_NOTICE}
      {children ? <> · {children}</> : null}
    </p>
  );
}

/** Observe the containing card, not a Chart ref. Offscreen previews never mount a plot. */
export function ChartThumbnail({ form }: { form: ChartForm }) {
  const host = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '120px' }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return (
    <div className="viz-thumbnail" ref={host} data-chart-thumbnail={form.id}>
      {visible ? (
        <Chart
          {...form.config}
          title={undefined}
          description={undefined}
          aria-label={`${form.label}缩略图（示例）`}
          height={180}
          animated={false}
          legend={false}
          grid={false}
          tooltip={false}
          showDataTable={false}
          disabled
        />
      ) : (
        <div className="viz-thumbnail-placeholder" aria-hidden="true">
          <span>{form.label}</span>
        </div>
      )}
    </div>
  );
}

export function CodeSnippet({
  code,
  label = '示例代码',
  inline = false,
}: {
  code: string;
  label?: string;
  inline?: boolean;
}) {
  const [status, setStatus] = useState('');
  const [fallback, setFallback] = useState(false);
  const fallbackRef = useRef<HTMLTextAreaElement>(null);
  const statusId = useId();
  useEffect(() => {
    if (fallback) {
      fallbackRef.current?.focus();
      fallbackRef.current?.select();
    }
  }, [fallback]);
  useEffect(() => {
    setStatus('');
    setFallback(false);
  }, [code]);
  async function copy() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(code);
      setStatus('代码已复制。');
      setFallback(false);
    } catch {
      setStatus('无法访问剪贴板。已选中代码，请按 Ctrl / ⌘ + C 手动复制。');
      setFallback(true);
      fallbackRef.current?.focus();
      fallbackRef.current?.select();
    }
  }
  const content = (
    <>
      <div className="viz-code-toolbar">
        {inline ? <span className="viz-meta">{label} · TSX</span> : null}
        <button type="button" className="viz-button" onClick={copy} aria-describedby={statusId}>
          复制代码
        </button>
        <span id={statusId} role="status">
          {status}
        </span>
      </div>
      {fallback ? (
        <textarea
          ref={fallbackRef}
          className="viz-editor"
          aria-label="可手动复制的示例代码"
          readOnly
          value={code}
          rows={10}
          spellCheck={false}
        />
      ) : (
        <CodeBlock code={code} language="tsx" copyable={!inline} />
      )}
    </>
  );
  return inline ? (
    <div className="viz-code viz-code--inline">{content}</div>
  ) : (
    <details className="viz-code">
      <summary>
        <span aria-hidden="true">&lt;/&gt;</span> {label}
      </summary>
      {content}
    </details>
  );
}
