import { useState } from 'react';
import { Checkbox } from '@zuvi/react';

import ApiTable from '../../components/ApiTable';
import CustomizeOutlet from '../../components/CustomizeOutlet';
import Demo from '../../components/Demo';
import { usePageTitle } from '../../components/usePageTitle';

const BASIC_CODE = `<Checkbox label="记住我" />
<Checkbox />`;

const MIXED_CODE = `<Checkbox label="全选（半选态）" indeterminate onChange={...} />`;

const CONTROLLED_CODE = `const [checked, setChecked] = useState(true);

<Checkbox
  checked={checked}
  onChange={setChecked}
  label={checked ? '已订阅' : '未订阅'}
/>`;

const DISABLED_CODE = `<Checkbox label="禁用（未选）" disabled />
<Checkbox label="禁用（已选）" disabled defaultChecked />
<Checkbox label="禁用（半选）" disabled indeterminate />`;

export default function CheckboxPage(): React.ReactNode {
  usePageTitle('Checkbox 复选框');
  const [checked, setChecked] = useState(true);

  return (
    <div className="doc-page">
      <h1 className="doc-h1">Checkbox 复选框</h1>
      <p className="doc-lead">
        基于原生 input 的复选框：隐藏原生控件保留无障碍语义，视觉层由 control 插槽绘制，支持半选（indeterminate）态。
      </p>

      <h2 className="doc-h2">示例</h2>

      <Demo title="基础用法" description="label 与输入框一体点击；不传 label 时渲染纯控件。" code={BASIC_CODE}>
        <Checkbox label="记住我" />
        <Checkbox />
      </Demo>

      <Demo
        title="半选态"
        description="indeterminate 设置 DOM input.indeterminate 并渲染横线图标，aria-checked=“mixed”。"
        code={MIXED_CODE}
      >
        <Checkbox label="全选（半选态）" indeterminate />
      </Demo>

      <Demo
        title="受控模式"
        description="checked + onChange(checked: boolean) 组成受控契约；也支持 defaultChecked 非受控。"
        code={CONTROLLED_CODE}
      >
        <Checkbox checked={checked} onChange={setChecked} label={checked ? '已订阅' : '未订阅'} />
      </Demo>

      <Demo title="禁用" description="禁用覆盖三种视觉态。" code={DISABLED_CODE}>
        <Checkbox label="禁用（未选）" disabled />
        <Checkbox label="禁用（已选）" disabled defaultChecked />
        <Checkbox label="禁用（半选）" disabled indeterminate />
      </Demo>

      <h2 className="doc-h2">API</h2>
      <ApiTable
        rows={[
          {
            name: 'checked',
            type: 'boolean',
            description: '受控选中态。',
          },
          {
            name: 'defaultChecked',
            type: 'boolean',
            description: '非受控初始选中态。',
          },
          {
            name: 'onChange',
            type: '(checked: boolean) => void',
            description: '选中态变化回调（注意参数是布尔值，不是事件对象）。',
          },
          {
            name: 'label',
            type: 'React.ReactNode',
            description: '标签内容（label 元素包裹，点击标签可切换）。',
          },
          {
            name: 'indeterminate',
            type: 'boolean',
            defaultValue: 'false',
            description: '半选态：设置 DOM input.indeterminate + aria-checked="mixed"。',
          },
          {
            name: 'classNames',
            type: '{ root?; control?; label? }',
            description: 'slot 级类名追加（root / control / label）。',
          },
          {
            name: '...rest',
            type: "React.ComponentPropsWithRef<'input'>",
            description:
              "原生 input 属性透传（'type'、'onChange'、'checked'、'defaultChecked'、'size' 除外）。",
          },
        ]}
      />

      <CustomizeOutlet
        name="Checkbox"
        parts={['root', 'control', 'label']}
        vars={[
          '--zuvi-checkbox-size',
          '--zuvi-checkbox-radius',
          '--zuvi-checkbox-gap',
          '--zuvi-checkbox-bg',
          '--zuvi-checkbox-border',
          '--zuvi-checkbox-border-width',
          '--zuvi-checkbox-checked-bg',
          '--zuvi-checkbox-checked-border',
          '--zuvi-checkbox-check-color',
          '--zuvi-checkbox-mixed-color',
          '--zuvi-checkbox-label-color',
          '--zuvi-checkbox-label-font-size',
          '--zuvi-checkbox-disabled-bg',
          '--zuvi-checkbox-disabled-fg',
          '--zuvi-checkbox-disabled-border',
          '--zuvi-checkbox-transition',
        ]}
      />
    </div>
  );
}
