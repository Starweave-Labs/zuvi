import type { NativeDeviceColor } from './types';
export type AppearanceToken = number | string | { literal: true };
export interface AppearanceProperties {
  fonts: { key: string; size: number }[];
  color?: number[];
  deviceColor?: NativeDeviceColor;
  restrictions: string[];
  lineCap?: 0 | 1 | 2;
  lineJoin?: 0 | 1 | 2;
  miterLimit?: number;
  hasText?: boolean;
  graphicsStates?: string[];
  firstTextPosition?: number[];
  lineHeight?: number;
}
export interface AppearanceInspection {
  properties: AppearanceProperties;
  restrictions: string[];
}
