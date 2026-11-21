'use client';

import * as React from 'react';
import { useZuviConfig } from '../../config';
import { cx } from '../../utils';
import type { DataGridProps, DataGridStatus } from './data-grid-types';
import './DataGrid.css';

const dataGridProperties = new Set(
  'columns rows rowKey height rowHeight overscan sort defaultSort onSortChange filters defaultFilters onFiltersChange selectedKeys defaultSelectedKeys onSelectedKeysChange isRowSelectable loading emptyContent loadingContent labels onReady onStatusChange onError classNames'.split(
    ' '
  )
);

let viewPromise: Promise<typeof import('./DataGridView')> | null = null;
function loadDataGridView() {
  if (!viewPromise) {
    viewPromise = import('./DataGridView').catch((error: unknown) => {
      viewPromise = null;
      throw error;
    });
  }
  return viewPromise;
}

/** Interactive virtualized grid with a lazily loaded implementation layer. */
export function DataGrid<T>({ ref, ...props }: DataGridProps<T>): React.ReactNode {
  const { locale } = useZuviConfig();
  const labels = { ...locale.dataGrid, ...props.labels };
  const nativeProps: Record<string, unknown> = { ...props };
  dataGridProperties.forEach((key) => delete nativeProps[key]);
  const [View, setView] = React.useState<React.ComponentType<DataGridViewPropsOf<T>> | null>(null);
  const [status, setStatus] = React.useState<DataGridStatus>('loading');
  const [attempt, setAttempt] = React.useState(0);
  const callbacks = React.useRef(props);
  callbacks.current = props;
  React.useEffect(() => {
    callbacks.current.onStatusChange?.(status);
    if (status === 'ready') callbacks.current.onReady?.();
  }, [status]);
  React.useEffect(() => {
    let active = true;
    setStatus('loading');
    loadDataGridView().then(
      (module) => {
        if (active)
          setView(() => module.DataGridView as React.ComponentType<DataGridViewPropsOf<T>>);
      },
      (cause: unknown) => {
        if (!active) return;
        setStatus('error');
        callbacks.current.onError?.({
          code: 'load',
          message: 'DataGrid module unavailable.',
          cause,
        });
      }
    );
    return () => {
      active = false;
    };
  }, [attempt]);

  return (
    <div
      {...nativeProps}
      ref={ref}
      data-part="root"
      data-status={status}
      aria-busy={status === 'loading'}
      className={cx('zuvi-datagrid', props.classNames?.root, props.className)}
      style={props.style}
    >
      {View ? (
        <View {...props} labels={labels} onViewStatus={setStatus} />
      ) : (
        <div
          data-part={status === 'error' ? 'error' : 'loading'}
          role="status"
          className={cx(
            'zuvi-datagrid-state',
            status === 'error' ? (props.classNames?.error ?? undefined) : props.classNames?.loading
          )}
          style={{ height: Number.isFinite(props.height) ? props.height : 320 }}
        >
          {status === 'error' ? (
            <>
              <span>{labels.error}</span>
              <button
                type="button"
                onClick={() => setAttempt((current) => current + 1)}
                disabled={props.loading}
              >
                {labels.retry}
              </button>
            </>
          ) : props.loadingContent !== undefined ? (
            props.loadingContent
          ) : (
            labels.loading
          )}
        </div>
      )}
    </div>
  );
}

type DataGridViewPropsOf<T> = DataGridProps<T> & { onViewStatus: (status: DataGridStatus) => void };
