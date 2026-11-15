/**
 * ZUVI 设计令牌 — TypeScript 常量导出
 *
 * 值均为 CSS 变量引用（'var(--zuvi-…)'），供文档站点 / 内联样式（style={{…}}）使用，
 * 与 base.css / semantic.css / dark.css 保持一致（换肤自动生效，无 DOM API）。
 */

/** 语义层令牌（组件消费入口）——与 semantic.css 逐字对应 */
export const tokens = {
  color: {
    bg: 'var(--zuvi-color-bg)',
    bgSubtle: 'var(--zuvi-color-bg-subtle)',
    bgMuted: 'var(--zuvi-color-bg-muted)',
    bgElevated: 'var(--zuvi-color-bg-elevated)',
    bgInverse: 'var(--zuvi-color-bg-inverse)',
    fg: 'var(--zuvi-color-fg)',
    fgMuted: 'var(--zuvi-color-fg-muted)',
    fgSubtle: 'var(--zuvi-color-fg-subtle)',
    fgInverse: 'var(--zuvi-color-fg-inverse)',
    fgOnPrimary: 'var(--zuvi-color-fg-on-primary)',
    border: 'var(--zuvi-color-border)',
    borderSubtle: 'var(--zuvi-color-border-subtle)',
    borderStrong: 'var(--zuvi-color-border-strong)',
    borderFocus: 'var(--zuvi-color-border-focus)',
    primary: 'var(--zuvi-color-primary)',
    primaryHover: 'var(--zuvi-color-primary-hover)',
    primaryActive: 'var(--zuvi-color-primary-active)',
    primaryFg: 'var(--zuvi-color-primary-fg)',
    primarySubtle: 'var(--zuvi-color-primary-subtle)',
    primarySubtleFg: 'var(--zuvi-color-primary-subtle-fg)',
    danger: 'var(--zuvi-color-danger)',
    dangerHover: 'var(--zuvi-color-danger-hover)',
    dangerFg: 'var(--zuvi-color-danger-fg)',
    dangerSubtle: 'var(--zuvi-color-danger-subtle)',
    dangerSubtleFg: 'var(--zuvi-color-danger-subtle-fg)',
    success: 'var(--zuvi-color-success)',
    successHover: 'var(--zuvi-color-success-hover)',
    successFg: 'var(--zuvi-color-success-fg)',
    successSubtle: 'var(--zuvi-color-success-subtle)',
    successSubtleFg: 'var(--zuvi-color-success-subtle-fg)',
    warning: 'var(--zuvi-color-warning)',
    warningHover: 'var(--zuvi-color-warning-hover)',
    warningFg: 'var(--zuvi-color-warning-fg)',
    warningSubtle: 'var(--zuvi-color-warning-subtle)',
    warningSubtleFg: 'var(--zuvi-color-warning-subtle-fg)',
    info: 'var(--zuvi-color-info)',
    infoHover: 'var(--zuvi-color-info-hover)',
    infoFg: 'var(--zuvi-color-info-fg)',
    infoSubtle: 'var(--zuvi-color-info-subtle)',
    infoSubtleFg: 'var(--zuvi-color-info-subtle-fg)',
    link: 'var(--zuvi-color-link)',
    linkHover: 'var(--zuvi-color-link-hover)',
    focusRing: 'var(--zuvi-color-focus-ring)',
    overlay: 'var(--zuvi-color-overlay)',
    disabledBg: 'var(--zuvi-color-disabled-bg)',
    disabledFg: 'var(--zuvi-color-disabled-fg)',
    disabledBorder: 'var(--zuvi-color-disabled-border)',
  },
  radius: {
    default: 'var(--zuvi-radius)',
    sm: 'var(--zuvi-radius-sm)',
    md: 'var(--zuvi-radius-md)',
    lg: 'var(--zuvi-radius-lg)',
    xl: 'var(--zuvi-radius-xl)',
    full: 'var(--zuvi-radius-full)',
  },
  space: {
    1: 'var(--zuvi-space-1)',
    2: 'var(--zuvi-space-2)',
    3: 'var(--zuvi-space-3)',
    4: 'var(--zuvi-space-4)',
    5: 'var(--zuvi-space-5)',
    6: 'var(--zuvi-space-6)',
    7: 'var(--zuvi-space-7)',
    8: 'var(--zuvi-space-8)',
    9: 'var(--zuvi-space-9)',
    10: 'var(--zuvi-space-10)',
    11: 'var(--zuvi-space-11)',
    12: 'var(--zuvi-space-12)',
  },
  text: {
    xs: 'var(--zuvi-text-xs)',
    sm: 'var(--zuvi-text-sm)',
    md: 'var(--zuvi-text-md)',
    lg: 'var(--zuvi-text-lg)',
    xl: 'var(--zuvi-text-xl)',
    '2xl': 'var(--zuvi-text-2xl)',
    leadingTight: 'var(--zuvi-leading-tight)',
    leadingNormal: 'var(--zuvi-leading-normal)',
    leadingRelaxed: 'var(--zuvi-leading-relaxed)',
    weightRegular: 'var(--zuvi-weight-regular)',
    weightMedium: 'var(--zuvi-weight-medium)',
    weightSemibold: 'var(--zuvi-weight-semibold)',
  },
  font: {
    sans: 'var(--zuvi-font-sans)',
    mono: 'var(--zuvi-font-mono)',
  },
  shadow: {
    xs: 'var(--zuvi-shadow-xs)',
    sm: 'var(--zuvi-shadow-sm)',
    md: 'var(--zuvi-shadow-md)',
    lg: 'var(--zuvi-shadow-lg)',
  },
  duration: {
    fast: 'var(--zuvi-duration-fast)',
    normal: 'var(--zuvi-duration-normal)',
    slow: 'var(--zuvi-duration-slow)',
    easeStandard: 'var(--zuvi-ease-standard)',
    easeEntrance: 'var(--zuvi-ease-entrance)',
    easeExit: 'var(--zuvi-ease-exit)',
  },
  z: {
    base: 'var(--zuvi-z-base)',
    sticky: 'var(--zuvi-z-sticky)',
    dropdown: 'var(--zuvi-z-dropdown)',
    overlay: 'var(--zuvi-z-overlay)',
    modal: 'var(--zuvi-z-modal)',
    toast: 'var(--zuvi-z-toast)',
  },
} as const;

/** 令牌路径字面量联合（可选使用，便于文档/工具做键名校验） */
export type TokenPath = {
  [K in keyof typeof tokens]: {
    [P in keyof (typeof tokens)[K]]: `${K & string}.${P & string}`;
  }[keyof (typeof tokens)[K]];
}[keyof typeof tokens];

/** 色阶刻度（50..950 / 50..900） */
type NeutralScaleStep =
  | '50' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | '950';
type StatusScaleStep =
  | '50' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';

/**
 * 原始色阶（primitive 层）var() 引用，供文档画色板：
 * 每个色系的 50..950（状态色 50..900）。
 */
export const colorScales = {
  neutral: {
    50: 'var(--zuvi-neutral-50)',
    100: 'var(--zuvi-neutral-100)',
    200: 'var(--zuvi-neutral-200)',
    300: 'var(--zuvi-neutral-300)',
    400: 'var(--zuvi-neutral-400)',
    500: 'var(--zuvi-neutral-500)',
    600: 'var(--zuvi-neutral-600)',
    700: 'var(--zuvi-neutral-700)',
    800: 'var(--zuvi-neutral-800)',
    900: 'var(--zuvi-neutral-900)',
    950: 'var(--zuvi-neutral-950)',
  },
  brand: {
    50: 'var(--zuvi-brand-50)',
    100: 'var(--zuvi-brand-100)',
    200: 'var(--zuvi-brand-200)',
    300: 'var(--zuvi-brand-300)',
    400: 'var(--zuvi-brand-400)',
    500: 'var(--zuvi-brand-500)',
    600: 'var(--zuvi-brand-600)',
    700: 'var(--zuvi-brand-700)',
    800: 'var(--zuvi-brand-800)',
    900: 'var(--zuvi-brand-900)',
    950: 'var(--zuvi-brand-950)',
  },
  danger: {
    50: 'var(--zuvi-danger-50)',
    100: 'var(--zuvi-danger-100)',
    200: 'var(--zuvi-danger-200)',
    300: 'var(--zuvi-danger-300)',
    400: 'var(--zuvi-danger-400)',
    500: 'var(--zuvi-danger-500)',
    600: 'var(--zuvi-danger-600)',
    700: 'var(--zuvi-danger-700)',
    800: 'var(--zuvi-danger-800)',
    900: 'var(--zuvi-danger-900)',
  },
  success: {
    50: 'var(--zuvi-success-50)',
    100: 'var(--zuvi-success-100)',
    200: 'var(--zuvi-success-200)',
    300: 'var(--zuvi-success-300)',
    400: 'var(--zuvi-success-400)',
    500: 'var(--zuvi-success-500)',
    600: 'var(--zuvi-success-600)',
    700: 'var(--zuvi-success-700)',
    800: 'var(--zuvi-success-800)',
    900: 'var(--zuvi-success-900)',
  },
  warning: {
    50: 'var(--zuvi-warning-50)',
    100: 'var(--zuvi-warning-100)',
    200: 'var(--zuvi-warning-200)',
    300: 'var(--zuvi-warning-300)',
    400: 'var(--zuvi-warning-400)',
    500: 'var(--zuvi-warning-500)',
    600: 'var(--zuvi-warning-600)',
    700: 'var(--zuvi-warning-700)',
    800: 'var(--zuvi-warning-800)',
    900: 'var(--zuvi-warning-900)',
  },
  info: {
    50: 'var(--zuvi-info-50)',
    100: 'var(--zuvi-info-100)',
    200: 'var(--zuvi-info-200)',
    300: 'var(--zuvi-info-300)',
    400: 'var(--zuvi-info-400)',
    500: 'var(--zuvi-info-500)',
    600: 'var(--zuvi-info-600)',
    700: 'var(--zuvi-info-700)',
    800: 'var(--zuvi-info-800)',
    900: 'var(--zuvi-info-900)',
  },
} as const satisfies {
  neutral: Record<NeutralScaleStep, string>;
  brand: Record<NeutralScaleStep, string>;
  danger: Record<StatusScaleStep, string>;
  success: Record<StatusScaleStep, string>;
  warning: Record<StatusScaleStep, string>;
  info: Record<StatusScaleStep, string>;
};

export type ColorScaleName = keyof typeof colorScales;
