import { sha256 as pureSha256 } from '../studio-pdf-compose-sha256';
import type { EditOptions } from './types';

export function sha256(value: Uint8Array | string): string {
  return pureSha256(typeof value === 'string' ? new TextEncoder().encode(value) : value);
}
export function sourceIdentity(prefix: string, value: string): string {
  return prefix + ':' + sha256(value).slice(0, 32);
}
/** One byte maps to exactly one code unit; TextDecoder latin1 would use Windows-1252. */
export function latin1(bytes: Uint8Array): string {
  let output = '';
  for (let offset = 0; offset < bytes.length; offset += 8192) {
    output += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  }
  return output;
}
export function editTime(options: EditOptions = {}): string {
  return options.now ?? options.clock?.() ?? new Date().toISOString();
}
