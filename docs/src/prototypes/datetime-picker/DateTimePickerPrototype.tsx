import { useState } from 'react';
import { DatePicker, TimePicker } from '@zuvi/react';
import { usePageTitle } from '../../components/usePageTitle';

const cardStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 16,
  alignItems: 'flex-start',
  margin: '12px 0 0',
};
/**
 * RFC 路线图「暂不独立立项」的组合验证：DatePicker（ISO 日期）+ TimePicker
 * （HH:mm）能否在调用方拼出可信的 DateTimePicker / TimeRangePicker 语义。
 * 结论回写 docs/COMPONENT-ROADMAP.md。
 */
export default function DateTimePickerPrototype(): React.ReactNode {
  usePageTitle('DateTimePicker 组合验证原型');

  /* 场景 A：单值日期时间。组合值 YYYY-MM-DDTHH:mm；日期为锚——选日期时时间缺省
     00:00；任一子控件清空则组合值失效，但另一个子控件的值保留。 */
  const [dateTime, setDateTime] = useState('2026-03-15T08:30');
  const date = dateTime ? dateTime.slice(0, 10) : '';
  const time = dateTime ? dateTime.slice(11, 16) : '';

  /* 场景 B：同日起止时间。end < start 时自动交换；跨午夜（次日）不在组合方案内。 */
  const [range, setRange] = useState({ start: '08:30', end: '18:00' });

  return (
    <div className="doc-page">
      <h1 className="doc-h1">DateTimePicker 组合验证原型</h1>
      <p className="doc-lead">
        路线图要求先验证 <code>DatePicker + TimePicker</code> 的组合方案，再决定是否立项正式组件。
        本页在两个真实消费场景里用受控状态拼装组合语义，回显组合值与契约决策。
      </p>

      <h2 className="doc-h2">场景 A：日期时间组合（单值）</h2>
      <p className="doc-lead">
        组合值 <code>YYYY-MM-DDTHH:mm</code>；日期为锚：选日期时时间缺省 00:00；清空任一子控件组合值失效，另一个子控件保留。
        日期边界（min/max）由 DatePicker 承担，时间不参与边界。
      </p>
      <div style={cardStyle}>
        <DatePicker
          value={date}
          min="2026-03-01"
          max="2026-03-31"
          aria-label="组合日期"
          onChange={(next) => setDateTime(next ? `${next}T${time || '00:00'}` : '')}
        />
        <TimePicker
          value={time}
          format="HH:mm"
          aria-label="组合时间"
          onChange={(next) => setDateTime(date ? `${date}T${next}` : '')}
        />
      </div>
      <p className="doc-note" role="status">
        组合值：{dateTime ? `"${dateTime}"` : 'null'}
      </p>

      <h2 className="doc-h2">场景 B：时间范围（同日起止）</h2>
      <p className="doc-lead">
        起止均为 <code>HH:mm</code>，end &lt; start 时自动交换（瞬时反转）；跨午夜（次日）不在组合方案内——
        正式组件若立项必须显式支持或显式拒绝该语义。
      </p>
      <div style={cardStyle}>
        <TimePicker
          value={range.start}
          format="HH:mm"
          aria-label="开始时间"
          onChange={(next) =>
            setRange((previous) =>
              next > previous.end
                ? { start: previous.end, end: next }
                : { ...previous, start: next }
            )
          }
        />
        <span aria-hidden="true" style={{ alignSelf: 'center', color: 'var(--zuvi-color-fg-muted)' }}>
          →
        </span>
        <TimePicker
          value={range.end}
          format="HH:mm"
          aria-label="结束时间"
          onChange={(next) =>
            setRange((previous) =>
              next < previous.start
                ? { start: next, end: previous.start }
                : { ...previous, end: next }
            )
          }
        />
      </div>
      <p className="doc-note" role="status">
        范围：{range.start} → {range.end}（{range.end >= range.start ? '有效' : '已交换'}）
      </p>

      <h2 className="doc-h2">组合契约观察点（实测结论）</h2>
      <p className="doc-lead">
        受控值拼装、空值语义（清空任一子控件组合值失效）、边界联动（越界输入由 DatePicker 还原）与范围交换都能在调用方层稳定拼装。
        浮层行为实测：DatePicker 聚焦即开面板且提交后保持开启，TimePicker 面板常驻 DOM 以 <code>data-open</code>
        切换显隐；互斥由各组件的外点关闭兜底（点击另一控件时前一面板自动收起，e2e 已断言），
        组件间没有显式的面板协调层。双触发器的视觉重量、焦点顺序（日期 → 时间 → 提交）与单一输入形态留待正式组件统一。
      </p>
    </div>
  );
}
