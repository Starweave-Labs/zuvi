'use client';

import * as React from 'react';
import { zhCN, type ZuviLocale } from './locale';
import type { TranslateConfig } from './translate';

/** ZUVI 全局配置（当前仅 locale，后续可扩展） */
export interface ZuviConfig {
  locale: ZuviLocale;
  /** 原始文案供嵌套 Provider 合并，避免重复翻译。 */
  sourceLocale?: ZuviLocale;
  /** 当前 ConfigProvider 的可选运行时翻译配置。 */
  translate?: TranslateConfig;
}

/** 默认配置即 zh-CN 文案；作为 Context 默认值，无 Provider 时不 throw */
const defaultConfig: ZuviConfig = { locale: zhCN };

/**
 * 全局配置 Context。
 * 默认值 = defaultConfig，因此 useZuviConfig 在无 ConfigProvider 时返回默认、不抛错。
 */
export const ZuviConfigContext = React.createContext<ZuviConfig>(defaultConfig);

/** 读取当前生效的 ZUVI 配置；无需 Provider（缺省返回默认 zh-CN 文案，不 throw）。 */
export function useZuviConfig(): ZuviConfig {
  return React.useContext(ZuviConfigContext);
}
