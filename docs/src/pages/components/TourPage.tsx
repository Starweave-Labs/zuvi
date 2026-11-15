import { useState } from 'react';
import { Button, Tour } from '@zuvi/react';

import ApiTable from '../../components/ApiTable';
import CustomizeOutlet from '../../components/CustomizeOutlet';
import Demo from '../../components/Demo';
import { usePageTitle } from '../../components/usePageTitle';

const BASIC_CODE = `const [open, setOpen] = useState(false);

<div id="tour-anchor-1">目标元素 A</div>
<div id="tour-anchor-2">目标元素 B</div>

<Button onClick={() => setOpen(true)}>开始引导</Button>

<Tour
  open={open}
  onOpenChange={setOpen}
  steps={[
    {
      title: '第一步：认识 A',
      description: '遮罩会在目标元素处「挖洞」高亮。',
      target: '#tour-anchor-1',
    },
    {
      title: '第二步：看看 B',
      description: '浮层卡片跟随 placement 定位。',
      target: '#tour-anchor-2',
      placement: 'top',
    },
  ]}
/>`;

const CONTROLLED_CODE = `const [open, setOpen] = useState(false);
const [current, setCurrent] = useState(0);

<div id="tour-anchor-3">受控目标 A</div>
<div id="tour-anchor-4">受控目标 B</div>

<Button onClick={() => { setCurrent(0); setOpen(true); }}>开始受控引导</Button>

<Tour
  open={open}
  onOpenChange={setOpen}
  current={current}
  onCurrentChange={setCurrent}
  steps={[
    {
      title: '受控第一步',
      description: '当前步数由外部 current 状态驱动。',
      target: '#tour-anchor-3',
    },
    {
      title: '受控第二步',
      description: 'onCurrentChange 同步步数，可随时跳步。',
      target: '#tour-anchor-4',
      placement: 'right',
    },
  ]}
/>`;

export default function TourPage(): React.ReactNode {
  usePageTitle('Tour 漫游引导');
  const [open, setOpen] = useState(false);
  const [ctrlOpen, setCtrlOpen] = useState(false);
  const [ctrlCurrent, setCtrlCurrent] = useState(0);

  return (
    <div className="doc-page">
      <h1 className="doc-h1">Tour 漫游引导</h1>
      <p className="doc-lead">
        分步高亮页面元素：遮罩用 box-shadow 技巧在目标处挖洞，浮层卡片讲解当前步骤，
        上一步 / 下一步 / 完成逐步推进，Esc 随时关闭。适合新功能上手引导。
      </p>

      <h2 className="doc-h2">示例</h2>

      <Demo
        title="基础用法"
        description="steps 定义每步的标题、说明、目标（CSS 选择器或取元素函数）与浮层位置；点击「开始引导」体验。"
        code={BASIC_CODE}
        stack
      >
        <div className="doc-pg-preview-row">
          <div
            id="tour-anchor-1"
            style={{
              padding: 'var(--zuvi-space-3) var(--zuvi-space-4)',
              border: '1px dashed var(--zuvi-color-border)',
              borderRadius: 'var(--zuvi-radius-sm)',
            }}
          >
            目标元素 A
          </div>
          <div
            id="tour-anchor-2"
            style={{
              padding: 'var(--zuvi-space-3) var(--zuvi-space-4)',
              border: '1px dashed var(--zuvi-color-border)',
              borderRadius: 'var(--zuvi-radius-sm)',
            }}
          >
            目标元素 B
          </div>
        </div>
        <Button onClick={() => setOpen(true)}>开始引导</Button>

        <Tour
          open={open}
          onOpenChange={setOpen}
          steps={[
            {
              title: '第一步：认识 A',
              description: '遮罩会在目标元素处「挖洞」高亮，其余区域暗化。',
              target: '#tour-anchor-1',
            },
            {
              title: '第二步：看看 B',
              description: '浮层卡片跟随 placement 定位，Esc 可随时退出。',
              target: '#tour-anchor-2',
              placement: 'top',
            },
            {
              title: '完成',
              description: 'target 也可以是取元素函数：() => element。',
              target: () => document.getElementById('tour-anchor-1'),
              placement: 'bottom',
            },
          ]}
        />
      </Demo>

      <Demo
        title="受控步骤"
        description="current / onCurrentChange 让步骤进度由外部状态驱动，可配合自定义按钮从指定步开始。"
        code={CONTROLLED_CODE}
        stack
      >
        <div className="doc-pg-preview-row">
          <div
            id="tour-anchor-3"
            style={{
              padding: 'var(--zuvi-space-3) var(--zuvi-space-4)',
              border: '1px dashed var(--zuvi-color-border)',
              borderRadius: 'var(--zuvi-radius-sm)',
            }}
          >
            受控目标 A
          </div>
          <div
            id="tour-anchor-4"
            style={{
              padding: 'var(--zuvi-space-3) var(--zuvi-space-4)',
              border: '1px dashed var(--zuvi-color-border)',
              borderRadius: 'var(--zuvi-radius-sm)',
            }}
          >
            受控目标 B
          </div>
        </div>
        <Button
          onClick={() => {
            setCtrlCurrent(0);
            setCtrlOpen(true);
          }}
        >
          开始受控引导
        </Button>

        <Tour
          open={ctrlOpen}
          onOpenChange={setCtrlOpen}
          current={ctrlCurrent}
          onCurrentChange={setCtrlCurrent}
          steps={[
            {
              title: '受控第一步',
              description: '当前步数由外部 current 状态驱动。',
              target: '#tour-anchor-3',
            },
            {
              title: '受控第二步',
              description: 'onCurrentChange 同步步数，Esc 可随时退出。',
              target: '#tour-anchor-4',
              placement: 'right',
            },
          ]}
        />
      </Demo>

      <h2 className="doc-h2">API</h2>
      <ApiTable
        rows={[
          {
            name: 'steps',
            type: 'TourStep[]',
            description: '步骤：{ title; description?; target; placement? }。',
          },
          {
            name: 'target',
            type: 'string | (() => HTMLElement | null)',
            description: '（TourStep 内）CSS 选择器或取元素函数。',
          },
          {
            name: 'placement',
            type: "'top' | 'bottom' | 'left' | 'right'",
            defaultValue: "'bottom'",
            description: '（TourStep 内）浮层相对目标的位置。',
          },
          {
            name: 'open',
            type: 'boolean',
            description: '受控开关。',
          },
          {
            name: 'defaultOpen',
            type: 'boolean',
            defaultValue: 'false',
            description: '非受控初始开关。',
          },
          {
            name: 'onOpenChange',
            type: '(open: boolean) => void',
            description: '开关变化回调（完成 / Esc 触发）。',
          },
          {
            name: 'current',
            type: 'number',
            description: '受控当前步（从 0 计）。',
          },
          {
            name: 'onCurrentChange',
            type: '(i: number) => void',
            description: '步数变化回调。',
          },
          {
            name: 'classNames',
            type: '{ root?; mask?; card?; title?; description?; footer? }',
            description: 'slot 级类名追加。',
          },
        ]}
      />
      <p className="doc-p">
        卡片 <code className="doc-code-inline">role=&quot;dialog&quot;</code>，标题/描述通过{' '}
        <code className="doc-code-inline">aria-labelledby</code> /{' '}
        <code className="doc-code-inline">aria-describedby</code> 关联；遮罩{' '}
        <code className="doc-code-inline">aria-hidden</code> 且不拦截目标元素交互。
      </p>

      <CustomizeOutlet
        name="Tour"
        parts={['root', 'mask', 'card', 'title', 'description', 'footer']}
        vars={[
          '--zuvi-tour-z',
          '--zuvi-tour-mask-radius',
          '--zuvi-tour-mask-color',
          '--zuvi-tour-card-width',
          '--zuvi-tour-card-bg',
          '--zuvi-tour-card-fg',
          '--zuvi-tour-card-radius',
          '--zuvi-tour-card-shadow',
          '--zuvi-tour-card-padding',
          '--zuvi-tour-title-font-size',
          '--zuvi-tour-title-font-weight',
          '--zuvi-tour-description-font-size',
          '--zuvi-tour-description-fg',
          '--zuvi-tour-button-height',
          '--zuvi-tour-button-padding-x',
          '--zuvi-tour-button-bg',
          '--zuvi-tour-button-fg',
          '--zuvi-tour-button-primary-bg',
          '--zuvi-tour-button-primary-fg',
        ]}
      />
    </div>
  );
}
