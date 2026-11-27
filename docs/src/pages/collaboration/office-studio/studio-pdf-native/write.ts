import { PDFDocument, PDFDict, PDFRef, PDFHexString, PDFNumber, PDFPage } from 'pdf-lib';
import type { AnnotationRecord, SourceAnnotation } from './types';
import { required, num, pdfDate, writeText } from './objects';
import { translatedGeometry, changedFields } from './model-edit';
import { appearance } from './appearance';
import { name, APPLICATION_ID, KINDS, MARKERS } from './constants';
import { textPaint, paintOperator } from './colors';

export async function writeAnnotation(pdf: PDFDocument, annotation: AnnotationRecord, dict: PDFDict, sourceAnnotation: SourceAnnotation | undefined, sourcePage: PDFPage, fonts: ReadonlyMap<string, Uint8Array>, refById: Map<string, PDFRef>): Promise<void> {
  const fresh = !sourceAnnotation;
  dict.set(APPLICATION_ID, PDFHexString.fromText(annotation.id));
  dict.set(name('P'), pdf.getPages()[annotation.page].ref);
  if (fresh) {
    dict.set(name('Type'), name('Annot'));
    dict.set(name('Subtype'), name(required([...KINDS].find(([, value]) => value === annotation.kind), 'native subtype')[0]));
    dict.set(name('NM'), PDFHexString.fromText(annotation.id));
    dict.set(name('F'), PDFNumber.of(annotation.flags ?? 4));
    writeText(dict, 'T', annotation.author);
    writeText(dict, 'CreationDate', annotation.creationPdf ?? pdfDate(required(annotation.createdAt, 'creation timestamp')));
  }
  writeText(dict, 'M', annotation.modificationPdf ?? (annotation.modifiedAt === undefined ? undefined : pdfDate(annotation.modifiedAt)));
  writeText(dict, 'Contents', annotation.contents);
  dict.set(name('Rect'), pdf.context.obj(annotation.rect));
  if (annotation.inReplyTo) {
    const parentRef = refById.get(annotation.inReplyTo);
    if (!parentRef || annotation.replyType !== 'R') throw new Error('Invalid editable IRT target.');
    dict.set(name('IRT'), parentRef); dict.set(name('RT'), name('R'));
  }
  if (annotation.review) { writeText(dict, 'StateModel', annotation.review.model); writeText(dict, 'State', annotation.review.state); }
  const fields = fresh ? [] : changedFields(sourceAnnotation, annotation);
  if (MARKERS.has(annotation.kind)) dict.set(name('QuadPoints'), pdf.context.obj(required(annotation.quadPoints, 'QuadPoints')));
  if (annotation.kind === 'ink') dict.set(name('InkList'), pdf.context.obj(required(annotation.inkList, 'InkList')));
  if (annotation.kind === 'line') dict.set(name('L'), pdf.context.obj(required(annotation.line, 'line coordinates')));
  if (['polygon', 'polyLine'].includes(annotation.kind)) dict.set(name('Vertices'), pdf.context.obj(required(annotation.vertices, 'vertices')));
  const sameSize = sourceAnnotation && annotation.rect[2] - annotation.rect[0] === required(sourceAnnotation, 'source annotation').rect[2] - required(sourceAnnotation, 'source annotation').rect[0] && annotation.rect[3] - annotation.rect[1] === required(sourceAnnotation, 'source annotation').rect[3] - required(sourceAnnotation, 'source annotation').rect[1];
  const translatedPoints = (points: number[] | undefined): number[] | undefined => points?.map((value, index) => value + (index % 2 ? annotation.rect[1] - required(sourceAnnotation, 'source annotation').rect[1] : annotation.rect[0] - required(sourceAnnotation, 'source annotation').rect[0]));
  const pointsOnlyTranslated = sourceAnnotation && JSON.stringify(annotation.quadPoints) === JSON.stringify(translatedPoints(sourceAnnotation.quadPoints)) && JSON.stringify(annotation.inkList) === JSON.stringify(sourceAnnotation.inkList?.map(translatedPoints));
  const movesOnly = !fresh && fields.every((key) => ['rect', 'quadPoints', 'inkList', 'line', 'vertices', 'modificationPdf', 'modifiedAt', 'contents'].includes(key)) && annotation.kind !== 'freeText' && sameSize && pointsOnlyTranslated && translatedGeometry(sourceAnnotation, annotation);
  const onlyContentsOrMove = !fresh && fields.every((key) => ['rect', 'modificationPdf', 'modifiedAt'].includes(key)) && sameSize;
  // Rect changes translate/scale a retained appearance. Contents-only shape comments do not repaint source AP.
  const repaint = fresh || !(movesOnly || onlyContentsOrMove);
  if (!repaint) return;
  if (fresh || JSON.stringify(annotation.color) !== JSON.stringify(sourceAnnotation?.color)) {
    dict.set(name('C'), pdf.context.obj(annotation.color ?? []));
  }
  if (fresh || JSON.stringify(annotation.fill) !== JSON.stringify(sourceAnnotation?.fill)) {
    dict.set(name('IC'), pdf.context.obj(annotation.fill ?? []));
  }
  dict.set(name('CA'), PDFNumber.of(annotation.opacity));
  dict.set(name('BS'), pdf.context.obj({ W: annotation.border.width, S: annotation.border.style, ...(annotation.border.style === 'D' ? { D: annotation.border.dash ?? [3, 3] } : {}) }));
  if (['square', 'circle'].includes(annotation.kind)) dict.set(name('RD'), pdf.context.obj(required(annotation.rectDifferences, 'rectangle differences')));
  if (['line', 'polyLine'].includes(annotation.kind)) dict.set(name('LE'), pdf.context.obj(required(annotation.lineEnds, 'line endings').map((ending) => name(ending))));
  if (MARKERS.has(annotation.kind)) dict.set(name('QuadPoints'), pdf.context.obj(required(annotation.quadPoints, 'QuadPoints')));
  if (annotation.kind === 'ink') dict.set(name('InkList'), pdf.context.obj(required(annotation.inkList, 'InkList')));
  if (annotation.kind === 'freeText') {
    writeText(dict, 'DA', '/FT ' + num(required(annotation.font, 'font').size) + ' Tf ' + paintOperator(textPaint(annotation, sourceAnnotation), false));
    dict.set(name('Q'), PDFNumber.of(required(annotation.align, 'text alignment'))); dict.set(name('RD'), pdf.context.obj(required(annotation.rectDifferences, 'rectangle differences')));
  }
  dict.set(name('AP'), pdf.context.obj({ N: await appearance(pdf, annotation, dict, sourceAnnotation, sourcePage, fonts) }));
}
