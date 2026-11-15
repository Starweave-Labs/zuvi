'use client';

import * as React from 'react';
import { useZuviConfig } from '../../config';
import { cx } from '../../utils';
import './List.css';

/* ---------------------------------- 类型 ---------------------------------- */

export interface ListProps {
  items: Array<{
    key: string;
    title: React.ReactNode;
    description?: React.ReactNode;
    extra?: React.ReactNode;
    avatar?: React.ReactNode;
  }>;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  bordered?: boolean; // 默认 true
  size?: 'sm' | 'md'; // 默认 'md'
  loading?: boolean;
  className?: string;
  classNames?: { root?: string; item?: string; meta?: string; extra?: string };
}

/* ---------------------------------- List ---------------------------------- */

/**
 * 列表：ul/li 语义 + 头像/标题/描述/右侧 extra，支持 bordered/size/loading。
 */
export function List({
  items,
  header,
  footer,
  bordered = true,
  size = 'md',
  loading = false,
  className,
  classNames,
}: ListProps) {
  const { locale } = useZuviConfig();
  return (
    <div
      data-part="root"
      className={cx('zuvi-list', className, classNames?.root)}
      data-bordered={bordered ? 'true' : 'false'}
      data-size={size}
      data-loading={loading ? 'true' : undefined}
      aria-busy={loading ? true : undefined}
    >
      {header != null ? (
        <div data-part="header" className="zuvi-list-header">
          {header}
        </div>
      ) : null}

      {loading ? (
        <div data-part="loading" className="zuvi-list-loading" role="status" aria-label={locale.accessibility.loading}>
          <span className="zuvi-list-spinner" aria-hidden="true" />
        </div>
      ) : (
        <ul data-part="body" className="zuvi-list-body">
          {items.map((item) => (
            <li key={item.key} data-part="item" className={cx('zuvi-list-item', classNames?.item)}>
              {item.avatar != null ? (
                <div data-part="avatar" className="zuvi-list-item-avatar">
                  {item.avatar}
                </div>
              ) : null}

              <div data-part="meta" className={cx('zuvi-list-item-meta', classNames?.meta)}>
                <div data-part="title" className="zuvi-list-item-title">
                  {item.title}
                </div>
                {item.description != null ? (
                  <div data-part="description" className="zuvi-list-item-description">
                    {item.description}
                  </div>
                ) : null}
              </div>

              {item.extra != null ? (
                <div data-part="extra" className={cx('zuvi-list-item-extra', classNames?.extra)}>
                  {item.extra}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {footer != null ? (
        <div data-part="footer" className="zuvi-list-footer">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
