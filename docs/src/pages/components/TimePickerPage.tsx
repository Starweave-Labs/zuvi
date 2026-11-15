import { TimePicker } from '@zuvi/react';

import ApiTable from '../../components/ApiTable';
import CustomizeOutlet from '../../components/CustomizeOutlet';
import Demo from '../../components/Demo';
import { usePageTitle } from '../../components/usePageTitle';

const BASIC_CODE = `<TimePicker />
<TimePicker defaultValue="09:30" />`;

const SECONDS_CODE = `<TimePicker format="HH:mm:ss" defaultValue="09:30:45" />`;

const SIZE_CODE = `<TimePicker size="sm" defaultValue="08:00" />
<TimePicker size="md" defaultValue="09:00" />
<TimePicker size="lg" defaultValue="10:00" />`;

export default function TimePickerPage(): React.ReactNode {
  usePageTitle('TimePicker 时间选择');

  return (
    <div className="doc-page">
      <h1 className="doc-h1">TimePicker 时间选择</h1>
      <p className="doc-lead">
        弹出面板内以时 / 分 / 秒三列滚动列表选时间点，当前值高亮；↑↓ 滚动当前列（循环）、
        ←→ 切换列、Enter 确认、Esc 关闭。format 决定输出格式与是否显示秒列。
      </p>

      <h2 className="doc-h2">示例</h2>

      <Demo
        title="基础用法"
        description="默认 format='HH:mm'，面板为时 / 分两列；点击选项只改草稿，Enter 才确认输出。"
        code={BASIC_CODE}
        stack
      >
        <TimePicker />
        <TimePicker defaultValue="09:30" />
      </Demo>

      <Demo
        title="带秒"
        description="format='HH:mm:ss' 追加秒列，onChange 输出同样带秒。"
        code={SECONDS_CODE}
        stack
      >
        <TimePicker format="HH:mm:ss" defaultValue="09:30:45" />
      </Demo>

      <Demo title="尺寸" description="size 提供 sm / md / lg 三档，默认 md。" code={SIZE_CODE} stack>
        <TimePicker size="sm" defaultValue="08:00" />
        <TimePicker size="md" defaultValue="09:00" />
        <TimePicker size="lg" defaultValue="10:00" />
      </Demo>

      <h2 className="doc-h2">API</h2>
      <ApiTable
        rows={[
          {
            name: 'value',
            type: 'string',
            description: "受控时间串，'HH:mm' 或 'HH:mm:ss'。",
          },
          {
            name: 'defaultValue',
            type: 'string',
            description: '非受控初始时间。',
          },
          {
            name: 'onChange',
            type: '(time: string) => void',
            description: '确认回调，按 format 输出（不足补零）。',
          },
          {
            name: 'format',
            type: "'HH:mm' | 'HH:mm:ss'",
            defaultValue: "'HH:mm'",
            description: '输出格式，决定是否显示秒列。',
          },
          {
            name: 'disabled',
            type: 'boolean',
            defaultValue: 'false',
            description: '禁用。',
          },
          {
            name: 'size',
            type: "'sm' | 'md' | 'lg'",
            defaultValue: "'md'",
            description: '尺寸。',
          },
          {
            name: 'classNames',
            type: '{ root?; trigger?; panel?; column?; item? }',
            description: 'slot 级类名追加（root / trigger / panel / column / item）。',
          },
        ]}
      />
      <p className="doc-p">
        交互约定：每列 <code className="doc-code-inline">role=&quot;listbox&quot;</code>（时/分/秒），
        项 <code className="doc-code-inline">role=&quot;option&quot;</code> +{' '}
        <code className="doc-code-inline">aria-selected</code>；↑↓ 循环滚动当前列、←→ 切换列、
        Enter 确认、Esc 关闭并归还焦点到触发器。非法输入解析为 00:00:00。
      </p>

      <CustomizeOutlet
        name="TimePicker"
        parts={['root', 'trigger', 'panel', 'column', 'item']}
        vars={[
          '--zuvi-time-picker-trigger-height',
          '--zuvi-time-picker-trigger-padding-x',
          '--zuvi-time-picker-trigger-font-size',
          '--zuvi-time-picker-trigger-bg',
          '--zuvi-time-picker-trigger-fg',
          '--zuvi-time-picker-trigger-border',
          '--zuvi-time-picker-placeholder-fg',
          '--zuvi-time-picker-panel-bg',
          '--zuvi-time-picker-panel-border',
          '--zuvi-time-picker-panel-radius',
          '--zuvi-time-picker-panel-shadow',
          '--zuvi-time-picker-panel-height',
          '--zuvi-time-picker-column-width',
          '--zuvi-time-picker-column-border',
          '--zuvi-time-picker-item-height',
          '--zuvi-time-picker-item-fg',
          '--zuvi-time-picker-item-hover-bg',
          '--zuvi-time-picker-item-active-bg',
          '--zuvi-time-picker-item-active-fg',
        ]}
      />
    </div>
  );
}
