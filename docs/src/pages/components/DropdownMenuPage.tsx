import { DropdownMenu } from '@zuvi/react';

import ApiTable from '../../components/ApiTable';
import CustomizeOutlet from '../../components/CustomizeOutlet';
import Demo from '../../components/Demo';
import { usePageTitle } from '../../components/usePageTitle';

const BASIC_CODE = `<DropdownMenu>
  <DropdownMenu.Trigger>操作</DropdownMenu.Trigger>
  <DropdownMenu.Content>
    <DropdownMenu.Item>新建</DropdownMenu.Item>
    <DropdownMenu.Item>重命名</DropdownMenu.Item>
    <DropdownMenu.Separator />
    <DropdownMenu.Item danger>删除</DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu>`;

const DISABLED_CODE = `<DropdownMenu>
  <DropdownMenu.Trigger>带禁用项</DropdownMenu.Trigger>
  <DropdownMenu.Content>
    <DropdownMenu.Label>文件</DropdownMenu.Label>
    <DropdownMenu.Item icon={<span>+</span>}>新建</DropdownMenu.Item>
    <DropdownMenu.Item disabled>打开（禁用）</DropdownMenu.Item>
    <DropdownMenu.Item>保存</DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu>`;

const KEYBOARD_CODE = `<DropdownMenu>
  <DropdownMenu.Trigger>键盘操作</DropdownMenu.Trigger>
  <DropdownMenu.Content>
    <DropdownMenu.Item>复制</DropdownMenu.Item>
    <DropdownMenu.Item>粘贴</DropdownMenu.Item>
    <DropdownMenu.Item disabled>剪切（禁用）</DropdownMenu.Item>
    <DropdownMenu.Item>全选</DropdownMenu.Item>
    <DropdownMenu.Separator />
    <DropdownMenu.Item danger>清空</DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu>`;

export default function DropdownMenuPage(): React.ReactNode {
  usePageTitle('DropdownMenu 下拉菜单');

  return (
    <div className="doc-page">
      <h1 className="doc-h1">DropdownMenu 下拉菜单</h1>
      <p className="doc-lead">
        APG menu-button 模式的下拉菜单：打开焦点进入首项（roving tabindex），↑↓ 跳过 disabled、
        Home/End、Enter/Space 触发并归还焦点、Esc 关闭归还、首字母 typeahead、Tab 关闭。
      </p>

      <h2 className="doc-h2">示例</h2>

      <Demo
        title="基础用法"
        description="DropdownMenu.Trigger 点击开合；菜单项触发 onSelect 后自动关闭并把焦点归还触发器。danger 项以红字呈现（删除类操作）。"
        code={BASIC_CODE}
      >
        <DropdownMenu>
          <DropdownMenu.Trigger>操作</DropdownMenu.Trigger>
          <DropdownMenu.Content>
            <DropdownMenu.Item>新建</DropdownMenu.Item>
            <DropdownMenu.Item>重命名</DropdownMenu.Item>
            <DropdownMenu.Separator />
            <DropdownMenu.Item danger>删除</DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu>
      </Demo>

      <Demo
        title="分组标题、图标与禁用项"
        description="Label 渲染分组标题，Item 支持 icon；disabled 项不可触发，且 ↑↓ 移动时自动跳过。"
        code={DISABLED_CODE}
      >
        <DropdownMenu>
          <DropdownMenu.Trigger>带禁用项</DropdownMenu.Trigger>
          <DropdownMenu.Content>
            <DropdownMenu.Label>文件</DropdownMenu.Label>
            <DropdownMenu.Item icon={<span aria-hidden="true">+</span>}>新建</DropdownMenu.Item>
            <DropdownMenu.Item disabled>打开（禁用）</DropdownMenu.Item>
            <DropdownMenu.Item>保存</DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu>
      </Demo>

      <Demo
        title="键盘操作"
        description="打开（点击 / ↑↓）焦点进首项；↑↓ 移动（跳过 disabled）、Home/End 首尾、Enter/Space 触发 onSelect 并归还焦点、Esc 关闭归还、首字母 typeahead 快速定位、Tab 关闭。"
        code={KEYBOARD_CODE}
        stack
      >
        <DropdownMenu>
          <DropdownMenu.Trigger>键盘操作（Tab 聚焦后按 ↑↓）</DropdownMenu.Trigger>
          <DropdownMenu.Content>
            <DropdownMenu.Item>复制</DropdownMenu.Item>
            <DropdownMenu.Item>粘贴</DropdownMenu.Item>
            <DropdownMenu.Item disabled>剪切（禁用）</DropdownMenu.Item>
            <DropdownMenu.Item>全选</DropdownMenu.Item>
            <DropdownMenu.Separator />
            <DropdownMenu.Item danger>清空</DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu>
      </Demo>

      <h2 className="doc-h2">API</h2>
      <h3 className="doc-h3">DropdownMenu</h3>
      <ApiTable
        rows={[
          {
            name: 'open',
            type: 'boolean',
            description: '受控展开。',
          },
          {
            name: 'defaultOpen',
            type: 'boolean',
            defaultValue: 'false',
            description: '非受控初始展开。',
          },
          {
            name: 'onOpenChange',
            type: '(open: boolean) => void',
            description: '展开状态变更回调。',
          },
          {
            name: 'children',
            type: 'React.ReactNode',
            description: '组合 Trigger / Content / Item / Separator / Label。',
          },
        ]}
      />
      <h3 className="doc-h3">DropdownMenu.Trigger</h3>
      <ApiTable
        rows={[
          {
            name: '...rest',
            type: "React.ComponentPropsWithRef<'button'>",
            description:
              "原生 button 属性透传；内置 aria-haspopup=\"menu\" / aria-expanded，关闭态 ↑↓ 打开菜单。",
          },
        ]}
      />
      <h3 className="doc-h3">DropdownMenu.Content / Item</h3>
      <ApiTable
        rows={[
          {
            name: 'onSelect',
            type: '() => void',
            description: '菜单项触发（点击 / Enter / Space），触发后关闭菜单并归还焦点到 Trigger。',
          },
          {
            name: 'disabled',
            type: 'boolean',
            defaultValue: 'false',
            description: '禁用项：不可触发，键盘移动自动跳过（aria-disabled）。',
          },
          {
            name: 'danger',
            type: 'boolean',
            defaultValue: 'false',
            description: '红色危险项（删除类操作），data-danger 暴露。',
          },
          {
            name: 'icon',
            type: 'React.ReactNode',
            description: '菜单项前置图标。',
          },
          {
            name: 'classNames',
            type: 'DropdownMenu.Content: { content? }；Item: { item?; icon? }',
            description: 'slot 级类名追加。',
          },
          {
            name: 'DropdownMenu.Separator',
            type: '(role="separator")',
            description: '分组分隔线。',
          },
          {
            name: 'DropdownMenu.Label',
            type: 'React.ReactNode',
            description: '分组标题（非交互）。',
          },
        ]}
      />

      <CustomizeOutlet
        name="DropdownMenu"
        parts={['root', 'trigger', 'content', 'item', 'icon', 'separator', 'label']}
        vars={[
          '--zuvi-dropdown-menu-bg',
          '--zuvi-dropdown-menu-fg',
          '--zuvi-dropdown-menu-radius',
          '--zuvi-dropdown-menu-padding',
          '--zuvi-dropdown-menu-shadow',
          '--zuvi-dropdown-menu-min-width',
          '--zuvi-dropdown-menu-z',
          '--zuvi-dropdown-menu-offset',
          '--zuvi-dropdown-menu-item-height',
          '--zuvi-dropdown-menu-item-padding-x',
          '--zuvi-dropdown-menu-item-gap',
          '--zuvi-dropdown-menu-item-radius',
          '--zuvi-dropdown-menu-item-font-size',
          '--zuvi-dropdown-menu-item-hover-bg',
          '--zuvi-dropdown-menu-item-fg',
          '--zuvi-dropdown-menu-item-danger-fg',
          '--zuvi-dropdown-menu-item-disabled-fg',
          '--zuvi-dropdown-menu-label-font-size',
          '--zuvi-dropdown-menu-label-fg',
          '--zuvi-dropdown-menu-separator-color',
          '--zuvi-dropdown-menu-animation',
        ]}
      />
    </div>
  );
}
