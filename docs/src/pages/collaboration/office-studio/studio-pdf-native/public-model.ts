import type { AnnotationRecord, AnnotationPatch, NativeDeviceColor, NewAnnotation, UnknownReview } from './types';
import type {
  PdfAnnotation, PdfAnnotationIdentity, PdfAnnotationPatch, PdfDeviceColor, PdfInsets,
  PdfLineEnding, PdfNewAnnotation, PdfPaint, PdfRect, PdfReviewState, PdfRgb,
} from './public-types';
import { finiteArray, plain, rectangleValid, required } from './objects';
import { validateAnnotation } from './model-edit';

function tuple4(values: number[] | undefined, description: string): PdfRect {
  if (!finiteArray(values, 4)) throw new Error('Invalid ' + description + '.');
  return [values[0], values[1], values[2], values[3]];
}
function rgb(values: number[] | null): PdfRgb | null {
  if (values === null) return null;
  if (!finiteArray(values, 3)) throw new Error('Invalid public display color.');
  return [values[0], values[1], values[2]];
}
function sourceDeviceColor(value: NativeDeviceColor | undefined): PdfDeviceColor | undefined {
  if (!value) return;
  const components = value.components;
  if (value.space === 'none' && components.length === 0) return { space: 'none', components: [] };
  if (value.space === 'gray' && finiteArray(components, 1)) return { space: 'gray', components: [components[0]] };
  if (value.space === 'rgb' && finiteArray(components, 3)) return { space: 'rgb', components: [components[0], components[1], components[2]] };
  if (value.space === 'cmyk' && finiteArray(components, 4)) return { space: 'cmyk', components: [components[0], components[1], components[2], components[3]] };
}
function publicReview(value: UnknownReview | undefined): PdfReviewState | undefined {
  if (!value) return;
  const state = value.state;
  if (value.model === 'Marked' && (state === 'Marked' || state === 'Unmarked')) return { model: 'Marked', state };
  if (value.model === 'Review' && (state === 'Accepted' || state === 'Rejected' || state === 'Cancelled'
    || state === 'Completed' || state === 'None')) return { model: 'Review', state };
}
function identity(annotation: AnnotationRecord, signed: boolean): PdfAnnotationIdentity {
  const native = annotation._native;
  const reasons = [...(annotation.passiveReasons ?? []), ...(native?.appearanceRestrictions ?? [])];
  if (annotation.kind === 'freeText' && native?.font && !native.font.standard && !native.font.fullTrueType) {
    reasons.push('Native font cannot be reconstructed; translation retains its source appearance.');
  }
  if (signed) reasons.push('Signed PDF permits unchanged source bytes only.');
  return {
    id: annotation.id, pageId: annotation.pageId, contents: annotation.contents, author: annotation.author,
    ...(annotation.originId === undefined ? {} : { originId: annotation.originId }),
    ...(annotation.createdAt === undefined ? {} : { createdAt: annotation.createdAt }),
    ...(annotation.modifiedAt === undefined ? {} : { modifiedAt: annotation.modifiedAt }),
    ...(annotation.creationPdf === undefined ? {} : { creationPdf: annotation.creationPdf }),
    ...(annotation.modificationPdf === undefined ? {} : { modificationPdf: annotation.modificationPdf }),
    ...(annotation.inReplyTo === undefined ? {} : { inReplyTo: annotation.inReplyTo }),
    ...(annotation.replyType === undefined ? {} : { replyType: annotation.replyType }),
    ...(annotation.popupId === undefined ? {} : { popupId: annotation.popupId }),
    ...(annotation.popupOf === undefined ? {} : { popupOf: annotation.popupOf }),
    ...(native ? { native: {
      key: native.key, subtype: native.subtype, flags: native.flags, baselineHash: native.hash,
      hasAppearance: native.hasAppearance,
      ...(native.name === undefined ? {} : { nativeName: native.name }),
      ...(native.appearanceHash === undefined ? {} : { appearanceHash: native.appearanceHash }),
      ...(native.font?.embeddedHash === undefined ? {} : { fontHash: native.font.embeddedHash }),
      sourceColors: {
        stroke: sourceDeviceColor(native.colors?.stroke),
        fill: sourceDeviceColor(native.colors?.fill),
        text: sourceDeviceColor(native.font?.deviceColor),
      },
    } } : {}),
    capabilities: {
      move: !signed && annotation.capabilities.geometry,
      resize: !signed && annotation.capabilities.resize,
      reshape: !signed && annotation.capabilities.geometry && annotation.capabilities.appearance,
      contents: !signed && annotation.capabilities.contents,
      appearance: !signed && annotation.capabilities.appearance,
      remove: !signed && annotation.capabilities.remove,
      reply: !signed && annotation.capabilities.reply,
      ...(reasons.length ? { reasons: [...new Set(reasons)] } : {}),
    },
  };
}
function paint(annotation: AnnotationRecord): PdfPaint {
  if (annotation.border.style !== 'S' && annotation.border.style !== 'D') throw new Error('Unsupported public stroke.');
  return {
    color: rgb(annotation.color), fill: rgb(annotation.fill), opacity: annotation.opacity,
    stroke: {
      width: annotation.border.width, style: annotation.border.style,
      ...(annotation.border.dash === undefined ? {} : { dash: [...annotation.border.dash] }),
      lineCap: annotation.lineCap, lineJoin: annotation.lineJoin, miterLimit: annotation.miterLimit,
    },
  };
}
function endings(values: PdfLineEnding[] | undefined): readonly [PdfLineEnding, PdfLineEnding] {
  if (!values || values.length !== 2) throw new Error('Invalid native line endings.');
  return [values[0], values[1]];
}

/** Projection does not expose internal page ordinals, source parser details, or editable provenance. */
export function toPdfAnnotation(annotation: AnnotationRecord, signed = false): PdfAnnotation {
  const base = identity(annotation, signed);
  let passiveReason = (annotation.passiveReasons ?? []).join(' ') || 'Unsupported native subtype.';
  try {
    if (annotation.kind === 'opaque') throw new Error(passiveReason);
    validateAnnotation(annotation);
    const common = { ...base, rect: tuple4(annotation.rect, 'native rectangle'), ...paint(annotation) };
    switch (annotation.kind) {
      case 'freeText': {
        const font = required(annotation.font, 'FreeText font'), align = annotation.align;
        if (align !== 0 && align !== 1 && align !== 2) throw new Error('Invalid FreeText alignment.');
        return {
          ...common, kind: 'freeText', font: {
            family: font.family, size: font.size, color: required(rgb(font.color), 'font color'),
            ...(annotation._native?.font?.family === font.family ? { sourceFontKey: annotation._native.font.nativeKey } : {}),
          }, align, rectDifferences: tuple4(annotation.rectDifferences, 'rectangle differences'),
          ...(annotation.padding === undefined ? {} : { textPadding: tuple4(annotation.padding, 'text padding') }),
          lineHeight: required(annotation.lineHeight, 'line height'),
        };
      }
      case 'note': return { ...common, kind: 'note', iconName: annotation._native?.iconName ?? 'Note',
        ...(annotation.review ? { review: publicReview(annotation.review) } : {}) };
      case 'highlight': case 'underline': case 'strikeOut': case 'squiggly':
        return { ...common, kind: annotation.kind, quadPoints: [...required(annotation.quadPoints, 'QuadPoints')] };
      case 'square': case 'circle': return { ...common, kind: annotation.kind, rectDifferences: tuple4(annotation.rectDifferences, 'rectangle differences') };
      case 'line': return { ...common, kind: 'line', line: tuple4(annotation.line, 'line endpoints'), lineEnds: endings(annotation.lineEnds) };
      case 'polygon': return { ...common, kind: 'polygon', vertices: [...required(annotation.vertices, 'vertices')] };
      case 'polyLine': return { ...common, kind: 'polyLine', vertices: [...required(annotation.vertices, 'vertices')], lineEnds: endings(annotation.lineEnds) };
      case 'ink': return { ...common, kind: 'ink', inkList: required(annotation.inkList, 'InkList').map((stroke) => [...stroke]) };
    }
  } catch (error) {
    if (!(error instanceof Error)) throw error;
    passiveReason = error.message;
  }
  return {
    ...base, kind: 'opaque',
    ...(rectangleValid(annotation.rect, true) ? { rect: tuple4(annotation.rect, 'opaque rectangle') } : {}),
    nativeRect: [...annotation.rect], passiveReason,
    capabilities: { ...base.capabilities, move: false, resize: false, reshape: false, contents: false, appearance: false },
  };
}

const COMMON_PATCH = ['kind', 'rect', 'contents', 'color', 'fill', 'opacity', 'stroke'];
function kindKeys(kind: PdfAnnotationPatch['kind']): string[] {
  switch (kind) {
    case 'freeText': return ['font', 'align', 'rectDifferences', 'textPadding', 'lineHeight'];
    case 'highlight': case 'underline': case 'strikeOut': case 'squiggly': return ['quadPoints'];
    case 'square': case 'circle': return ['rectDifferences'];
    case 'line': return ['line', 'lineEnds'];
    case 'polygon': return ['vertices'];
    case 'polyLine': return ['vertices', 'lineEnds'];
    case 'ink': return ['inkList'];
    case 'note': return [];
  }
}
function assertKeys(value: object, allowed: readonly string[]): void {
  for (const key of Object.keys(value)) if (!allowed.includes(key)) {
    throw new Error('Unexpected public annotation property: ' + key + '.');
  }
}
function putCommon(target: AnnotationPatch, patch: PdfAnnotationPatch): void {
  if (patch.rect !== undefined) target.rect = [...patch.rect];
  if (patch.contents !== undefined) target.contents = patch.contents;
  if (patch.color !== undefined) target.color = patch.color === null ? null : [...patch.color];
  if (patch.fill !== undefined) target.fill = patch.fill === null ? null : [...patch.fill];
  if (patch.opacity !== undefined) target.opacity = patch.opacity;
}
function putStroke(target: AnnotationPatch, annotation: AnnotationRecord, patch: PdfAnnotationPatch): void {
  if (patch.stroke === undefined) return;
  assertKeys(patch.stroke, ['width', 'style', 'dash', 'lineCap', 'lineJoin', 'miterLimit']);
  const stroke = patch.stroke;
  if (stroke.width !== undefined || stroke.style !== undefined || stroke.dash !== undefined) {
    const border = { ...annotation.border };
    if (stroke.width !== undefined) border.width = stroke.width;
    if (stroke.style !== undefined) border.style = stroke.style;
    if (stroke.dash === null) delete border.dash;
    else if (stroke.dash !== undefined) border.dash = [...stroke.dash];
    target.border = border;
  }
  if (stroke.lineCap !== undefined) target.lineCap = stroke.lineCap;
  if (stroke.lineJoin !== undefined) target.lineJoin = stroke.lineJoin;
  if (stroke.miterLimit !== undefined) target.miterLimit = stroke.miterLimit;
}

/** Runtime keys are checked too: JSON input cannot smuggle identity/capabilities/native metadata. */
export function toNativeAnnotationPatch(annotation: AnnotationRecord, patch: PdfAnnotationPatch): AnnotationPatch {
  if (patch.kind !== annotation.kind || toPdfAnnotation(annotation).kind === 'opaque') throw new Error('Annotation patch kind does not match an editable source.');
  assertKeys(patch, [...COMMON_PATCH, ...kindKeys(patch.kind)]);
  const result: AnnotationPatch = {};
  putCommon(result, patch);
  putStroke(result, annotation, patch);
  switch (patch.kind) {
    case 'freeText':
      if (patch.font !== undefined) {
        assertKeys(patch.font, ['family', 'size', 'color', 'sourceFontKey']);
        const original = required(annotation.font, 'FreeText font');
        if (patch.font.sourceFontKey !== undefined) {
          const nativeFont = annotation._native?.font;
          if (!nativeFont || patch.font.sourceFontKey !== nativeFont.nativeKey
            || (patch.font.family ?? original.family) !== nativeFont.family) {
            throw new Error('Source font identity cannot be replaced by a property patch.');
          }
        }
        const font = { ...original, color: [...original.color] };
        if (patch.font.family !== undefined) font.family = patch.font.family;
        if (patch.font.size !== undefined) font.size = patch.font.size;
        if (patch.font.color !== undefined) font.color = [...patch.font.color];
        if (JSON.stringify(font) !== JSON.stringify(original)) result.font = font;
      }
      if (patch.align !== undefined) result.align = patch.align;
      if (patch.rectDifferences !== undefined) result.rectDifferences = [...patch.rectDifferences];
      if (patch.textPadding !== undefined) result.padding = [...patch.textPadding];
      if (patch.lineHeight !== undefined) result.lineHeight = patch.lineHeight;
      break;
    case 'highlight': case 'underline': case 'strikeOut': case 'squiggly':
      if (patch.quadPoints !== undefined) result.quadPoints = [...patch.quadPoints];
      break;
    case 'square': case 'circle':
      if (patch.rectDifferences !== undefined) result.rectDifferences = [...patch.rectDifferences];
      break;
    case 'line':
      if (patch.line !== undefined) result.line = [...patch.line];
      if (patch.lineEnds !== undefined) result.lineEnds = [...patch.lineEnds];
      break;
    case 'polygon':
      if (patch.vertices !== undefined) result.vertices = [...patch.vertices];
      break;
    case 'polyLine':
      if (patch.vertices !== undefined) result.vertices = [...patch.vertices];
      if (patch.lineEnds !== undefined) result.lineEnds = [...patch.lineEnds];
      break;
    case 'ink':
      if (patch.inkList !== undefined) result.inkList = patch.inkList.map((stroke) => [...stroke]);
      break;
    case 'note': break;
  }
  return result;
}

/** Creation accepts only the public kind-specific editor properties, never source metadata. */
export function toNativeNewAnnotation(value: PdfNewAnnotation, id: string): NewAnnotation {
  assertKeys(value, [...COMMON_PATCH.filter((key) => key !== 'contents'), ...kindKeys(value.kind), 'id', 'pageId', 'contents', 'author']);
  const result: NewAnnotation = { id, kind: value.kind, pageId: value.pageId, rect: [...value.rect] };
  if (value.contents !== undefined) result.contents = value.contents;
  if (value.author !== undefined) result.author = value.author;
  if (value.color !== undefined) result.color = value.color === null ? null : [...value.color];
  if (value.fill !== undefined) result.fill = value.fill === null ? null : [...value.fill];
  if (value.opacity !== undefined) result.opacity = value.opacity;
  if (value.stroke !== undefined) {
    assertKeys(value.stroke, ['width', 'style', 'dash', 'lineCap', 'lineJoin', 'miterLimit']);
    result.border = {
      width: value.stroke.width ?? (value.kind === 'freeText' || value.kind === 'note' ? 0 : 1),
      style: value.stroke.style ?? 'S',
      ...(value.stroke.dash == null ? {} : { dash: [...value.stroke.dash] }),
    };
    if (value.stroke.lineCap !== undefined) result.lineCap = value.stroke.lineCap;
    if (value.stroke.lineJoin !== undefined) result.lineJoin = value.stroke.lineJoin;
    if (value.stroke.miterLimit !== undefined) result.miterLimit = value.stroke.miterLimit;
  }
  switch (value.kind) {
    case 'freeText':
      assertKeys(value.font, ['family', 'size', 'color']);
      result.font = { family: value.font.family, size: value.font.size, color: [...value.font.color] };
      if (value.align !== undefined) result.align = value.align;
      if (value.rectDifferences !== undefined) result.rectDifferences = [...value.rectDifferences];
      if (value.textPadding !== undefined) result.padding = [...value.textPadding];
      if (value.lineHeight !== undefined) result.lineHeight = value.lineHeight;
      break;
    case 'highlight': case 'underline': case 'strikeOut': case 'squiggly': result.quadPoints = [...value.quadPoints]; break;
    case 'square': case 'circle':
      if (value.rectDifferences !== undefined) result.rectDifferences = [...value.rectDifferences];
      break;
    case 'line':
      result.line = [...value.line];
      if (value.lineEnds !== undefined) result.lineEnds = [...value.lineEnds];
      break;
    case 'polygon': result.vertices = [...value.vertices]; break;
    case 'polyLine':
      result.vertices = [...value.vertices];
      if (value.lineEnds !== undefined) result.lineEnds = [...value.lineEnds];
      break;
    case 'ink': result.inkList = value.inkList.map((stroke) => [...stroke]); break;
    case 'note': break;
  }
  return plain(result);
}

/** Native RD and editor textPadding are separate four-side identities. */
export function pdfInsets(values: readonly number[]): PdfInsets {
  return tuple4([...values], 'insets');
}
