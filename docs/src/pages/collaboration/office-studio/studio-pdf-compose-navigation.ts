import {
  PDFArray,
  PDFDict,
  PDFName,
  PDFNumber,
  PDFRef,
  PDFString,
  PDFHexString,
  PDFNull,
  type PDFObject,
  type PDFDocument,
} from 'pdf-lib';
import { fail, name, text, read, resolve } from './studio-pdf-compose-utils';

import type {
  PdfComposeSourceState,
  PdfPageResolver,
  StudioPdfComposeReport,
} from './studio-pdf-compose-types';
import type { ClosedPdfCopier } from './studio-pdf-compose-utils';
const DESTINATION_KINDS = new Set(['XYZ', 'Fit', 'FitH', 'FitV', 'FitR', 'FitB', 'FitBH', 'FitBV']);
const NAMED_ACTIONS = new Set(['NextPage', 'PrevPage', 'FirstPage', 'LastPage']);
const URI_SCHEMES = new Set(['http', 'https', 'mailto', 'tel', 'ftp', 'file']);
function requireString(
  source: PdfComposeSourceState,
  value: PDFObject | undefined,
  path: string,
  code: string
): string {
  const object = resolve(source, value);
  if (!(object instanceof PDFString || object instanceof PDFHexString))
    fail(code, source.id, path, 'Expected a PDF text string');
  return object.decodeText();
}
function validateURI(
  source: PdfComposeSourceState,
  value: PDFObject | undefined,
  path: string
): void {
  const uri = requireString(source, value, path, 'URI_TYPE'),
    scheme = /^([a-z][a-z\d+.-]*):/i.exec(uri)?.[1]?.toLowerCase();
  if (!scheme)
    fail(
      'RELATIVE_URI',
      source.id,
      path,
      'Relative URI links cannot be rebased without the original source location'
    );
  if (!URI_SCHEMES.has(scheme))
    fail('OPAQUE_URI_SCHEME', source.id, path, `URI scheme ${scheme} cannot be migrated safely`);
}
function validateRemoteFile(
  source: PdfComposeSourceState,
  value: PDFObject | undefined,
  path: string
): void {
  const object = resolve(source, value),
    absolute = (text: string): boolean =>
      text.startsWith('/') || /^[a-z]:[\\/]/i.test(text) || /^(?:https?|ftp|file):/i.test(text);
  if (object instanceof PDFString || object instanceof PDFHexString) {
    if (!absolute(object.decodeText()))
      fail(
        'RELATIVE_REMOTE_FILE',
        source.id,
        path,
        'Remote file links require an absolute file path or URL'
      );
    return;
  }
  if (!(object instanceof PDFDict))
    fail(
      'REMOTE_FILE_TYPE',
      source.id,
      path,
      'Remote file must be a text path or file specification'
    );
  const allowed = new Set(['Type', 'FS', 'F', 'UF', 'DOS', 'Mac', 'Unix', 'ID', 'V', 'Desc']);
  for (const [key] of object.entries())
    if (!allowed.has(key.decodeText()))
      fail(
        'OPAQUE_FILE_SPEC',
        source.id,
        `${path}/${key.decodeText()}`,
        'Embedded and private file-specification semantics cannot be rebased safely'
      );
  const type = read(source, object, 'Type'),
    fileSystem = read(source, object, 'FS');
  if ((type && type !== name('Filespec')) || (fileSystem && fileSystem !== name('URL')))
    fail('OPAQUE_FILE_SPEC', source.id, path, 'Unknown file-specification type or file system');
  let count = 0;
  for (const key of ['F', 'UF', 'DOS', 'Mac', 'Unix'])
    if (object.has(name(key))) {
      count++;
      if (
        !absolute(
          requireString(source, object.get(name(key)), `${path}/${key}`, 'REMOTE_FILE_TYPE')
        )
      )
        fail(
          'RELATIVE_REMOTE_FILE',
          source.id,
          `${path}/${key}`,
          'Every platform file name must be absolute'
        );
    }
  if (!count) fail('REMOTE_FILE_TYPE', source.id, path, 'File specification has no file name');
}
function validateRemoteDestination(
  source: PdfComposeSourceState,
  value: PDFObject | undefined,
  path: string
): void {
  const object = resolve(source, value);
  if (object instanceof PDFName || object instanceof PDFString || object instanceof PDFHexString)
    return;
  if (!(object instanceof PDFArray))
    fail('REMOTE_DESTINATION', source.id, path, 'Remote destination must be a name or array');
  const first = resolve(source, object.get(0)),
    kind = text(resolve(source, object.get(1)));
  if (
    object.size() < 2 ||
    !(first instanceof PDFNumber) ||
    !Number.isSafeInteger(first.asNumber()) ||
    first.asNumber() < 0 ||
    !DESTINATION_KINDS.has(kind ?? '')
  )
    fail(
      'REMOTE_DESTINATION',
      source.id,
      path,
      'Remote destinations require a remote page number or name, never a local page reference'
    );
  for (let index = 2; index < object.size(); index++)
    if (
      !(resolve(source, object.get(index)) instanceof PDFNumber) &&
      resolve(source, object.get(index)) !== PDFNull
    )
      fail(
        'REMOTE_DESTINATION',
        source.id,
        `${path}[${index}]`,
        'Remote destination coordinate must be numeric or null'
      );
}

export interface PdfNavigationOptions {
  source: PdfComposeSourceState;
  target: PDFDocument;
  copier: ClosedPdfCopier;
  resolvePage: PdfPageResolver;
  fieldNames: Map<string, string>;
  fieldRefs?: Map<string, PDFRef>;
  annotationRefs?: Map<string, PDFRef>;
  annotationNames?: Map<string, string[]>;
  report: StudioPdfComposeReport;
}
export class PdfNavigation {
  readonly source: PdfComposeSourceState;
  readonly target: PDFDocument;
  readonly copier: ClosedPdfCopier;
  readonly resolvePage: PdfPageResolver;
  readonly fieldNames: Map<string, string>;
  readonly fieldRefs: Map<string, PDFRef>;
  readonly annotationRefs: Map<string, PDFRef>;
  readonly report: StudioPdfComposeReport;
  private readonly cache = new Map<PDFObject, PDFObject | undefined>();
  private readonly visiting = new Set<PDFObject>();
  constructor({
    source,
    target,
    copier,
    resolvePage,
    fieldNames,
    fieldRefs = copier.mapping,
    annotationRefs = copier.mapping,
    report,
  }: PdfNavigationOptions) {
    this.source = source;
    this.target = target;
    this.copier = copier;
    this.resolvePage = resolvePage;
    this.fieldNames = fieldNames;
    this.fieldRefs = fieldRefs;
    this.annotationRefs = annotationRefs;
    this.report = report;
  }
  prune(path: string, reason: string): void {
    this.report.prunedNavigation.push({ sourceId: this.source.id, path, reason });
  }
  destination(
    value: PDFObject | undefined,
    path: string,
    seen = new Set<PDFObject | string>()
  ): PDFObject | undefined {
    const object = resolve(this.source, value);
    if (!object) fail('DESTINATION_MISSING', this.source.id, path, 'Destination object is missing');
    const named = text(object);
    if (named !== undefined) {
      if (!this.source.names.has(named))
        fail('DESTINATION_NAME', this.source.id, path, `Unknown named destination ${named}`);
      if (seen.has(named))
        fail('DESTINATION_CYCLE', this.source.id, path, `Cyclic named destination ${named}`);
      seen.add(named);
      const result = this.destination(this.source.names.get(named), `${path}(${named})`, seen);
      seen.delete(named);
      return result;
    }
    if (object instanceof PDFDict) {
      if (seen.has(object))
        fail('DESTINATION_CYCLE', this.source.id, path, 'Cyclic destination dictionary');
      seen.add(object);
      const destination = this.destination(object.get(name('D')), `${path}/D`, seen);
      seen.delete(object);
      if (!destination) return undefined;
      const dict = this.target.context.obj({});
      for (const [key, entry] of object.entries())
        if (key !== name('D'))
          dict.set(key, this.copier.copy(entry, `${path}/${key.decodeText()}`));
      dict.set(name('D'), destination);
      return dict;
    }
    if (!(object instanceof PDFArray) || object.size() < 2)
      fail(
        'DESTINATION_TYPE',
        this.source.id,
        path,
        'Local destination is not a valid page destination array'
      );
    const first = object.get(0),
      nativePage = first instanceof PDFNumber ? this.source.pages[first.asNumber()]?.ref : first;
    if (
      !(nativePage instanceof PDFRef) ||
      !this.source.pages.some((page) => page.ref.toString() === nativePage.toString())
    )
      fail(
        'DESTINATION_PAGE',
        this.source.id,
        `${path}[0]`,
        'Destination does not refer to a source page'
      );
    const page = this.resolvePage(nativePage);
    if (!page) {
      this.prune(path, `target page ${nativePage.toString()} is not selected`);
      return undefined;
    }
    const kind = text(resolve(this.source, object.get(1)));
    if (!DESTINATION_KINDS.has(kind ?? ''))
      fail(
        'DESTINATION_KIND',
        this.source.id,
        `${path}[1]`,
        `Unsupported destination fit mode ${kind}`
      );
    const result = this.target.context.obj([page]);
    for (let index = 1; index < object.size(); index++) {
      const entry = resolve(this.source, object.get(index));
      if (index > 1 && !(entry instanceof PDFNumber) && entry !== PDFNull)
        fail(
          'DESTINATION_COORDINATE',
          this.source.id,
          `${path}[${index}]`,
          'Destination coordinate is not numeric or null'
        );
      result.push(this.copier.copy(object.get(index), `${path}[${index}]`));
    }
    return result;
  }
  fieldTargets(value: PDFObject | undefined, path: string, hide = false): PDFObject[] {
    const object = resolve(this.source, value);
    if (object instanceof PDFArray)
      return object
        .asArray()
        .flatMap((entry, index) => this.fieldTargets(entry, `${path}[${index}]`, hide));
    const rawName = text(object);
    if (rawName !== undefined) {
      const field =
        this.source.fields.find((record) => record.fullName === rawName) ??
        this.source.groups.find((record) => record.fullName === rawName);
      if (field) {
        const mapped = this.fieldNames.get(rawName);
        if (mapped !== undefined) return [PDFHexString.fromText(mapped)];
        this.prune(path, `field ${rawName} has no retained widgets`);
        return [];
      }
      fail(
        'ACTION_FIELD_NAME',
        this.source.id,
        path,
        `Cannot resolve static field or annotation name ${rawName}`
      );
    }
    if (value instanceof PDFRef) {
      const key = value.toString();
      if (!this.source.fieldRefs.has(key) && !(hide && this.source.annotations.has(key)))
        fail(
          'ACTION_FIELD_REFERENCE',
          this.source.id,
          path,
          'Action refers to an object that is not a canonical field or annotation'
        );
      if (hide && this.source.annotations.has(key)) {
        if (this.annotationRefs.has(key)) return [this.annotationRefs.get(key)!];
        this.prune(path, `annotation ${key} is not retained`);
        return [];
      }
      if (hide)
        fail(
          'HIDE_FIELD_REFERENCE',
          this.source.id,
          path,
          'Hide accepts a fully qualified field name or an annotation reference; an unmerged field reference is ambiguous'
        );
      const mapping = this.source.fieldRefs.has(key) ? this.fieldRefs : this.copier.mapping;
      if (mapping.has(key)) return [mapping.get(key)!];
      this.prune(path, `field or annotation ${key} is not retained`);
      return [];
    }
    fail(
      'ACTION_FIELD_TARGET',
      this.source.id,
      path,
      'Action target must be a static name or field/annotation reference'
    );
  }
  action(value: PDFObject | undefined, path: string): PDFObject | undefined {
    const object = resolve(this.source, value);
    if (!object) fail('ACTION_MISSING', this.source.id, path, 'Action object is missing');
    if (this.visiting.has(object))
      fail('ACTION_CYCLE', this.source.id, path, 'Action /Next graph is cyclic');
    if (this.cache.has(object)) return this.cache.get(object);
    this.visiting.add(object);
    let result: PDFObject | undefined | null;
    if (object instanceof PDFArray) {
      const actions = object.asArray().flatMap((entry, index) => {
        const action = this.action(entry, `${path}[${index}]`);
        return action ? [action] : [];
      });
      result = actions.length ? this.target.context.obj(actions) : undefined;
    } else {
      if (!(object instanceof PDFDict))
        fail('ACTION_TYPE', this.source.id, path, 'Action is not a dictionary');
      const kind = text(read(this.source, object, 'S'));
      if (
        !['GoTo', 'URI', 'GoToR', 'Named', 'Hide', 'ResetForm', 'SubmitForm'].includes(kind ?? '')
      )
        fail(
          'OPAQUE_ACTION',
          this.source.id,
          `${path}/S`,
          `Action ${kind} cannot be migrated without changing its semantics`
        );
      const next = object.has(name('Next'))
        ? this.action(object.get(name('Next')), `${path}/Next`)
        : undefined;
      const dict = this.target.context.obj({}),
        excluded = new Set(['Next']);
      if (kind === 'GoTo') {
        excluded.add('D');
        const destination = this.destination(object.get(name('D')), `${path}/D`);
        if (destination) dict.set(name('D'), destination);
        else result = next ?? null;
      } else if (kind === 'Named') {
        if (!NAMED_ACTIONS.has(text(read(this.source, object, 'N')) ?? ''))
          fail(
            'OPAQUE_NAMED_ACTION',
            this.source.id,
            `${path}/N`,
            'Only static viewer page-navigation named actions are supported'
          );
      } else if (kind === 'URI') {
        validateURI(this.source, object.get(name('URI')), `${path}/URI`);
      } else if (kind === 'GoToR') {
        validateRemoteFile(this.source, object.get(name('F')), `${path}/F`);
        validateRemoteDestination(this.source, object.get(name('D')), `${path}/D`);
      } else if (kind === 'Hide') {
        excluded.add('T');
        const targets = this.fieldTargets(object.get(name('T')), `${path}/T`, true);
        if (targets.length)
          dict.set(name('T'), targets.length === 1 ? targets[0] : this.target.context.obj(targets));
        else result = next ?? null;
      } else if (kind === 'ResetForm' || kind === 'SubmitForm') {
        if (kind === 'SubmitForm')
          validateRemoteFile(this.source, object.get(name('F')), `${path}/F`);
        excluded.add('Fields');
        excluded.add('Flags');
        const rawFlags = read(this.source, object, 'Flags');
        if (
          rawFlags !== undefined &&
          (!(rawFlags instanceof PDFNumber) ||
            !Number.isInteger(rawFlags.asNumber()) ||
            rawFlags.asNumber() < 0 ||
            rawFlags.asNumber() > 0xffffffff)
        )
          fail(
            'ACTION_FLAGS',
            this.source.id,
            `${path}/Flags`,
            'Form action flags must be an unsigned integer'
          );
        const flags = rawFlags instanceof PDFNumber ? rawFlags.asNumber() : 0,
          all = [
            ...new Set(
              this.source.fields.flatMap((record) => {
                const mapped = this.fieldNames.get(record.fullName ?? '');
                return mapped === undefined ? [] : [mapped];
              })
            ),
          ];
        const refNames = new Map(
          [...this.source.fields, ...this.source.groups].flatMap((record) => {
            const mapped = this.fieldNames.get(record.fullName ?? ''),
              ref = this.fieldRefs.get(record.ref.toString());
            return mapped === undefined || !ref ? [] : [[ref.toString(), mapped]];
          })
        );
        const specified = object.has(name('Fields'))
          ? this.fieldTargets(object.get(name('Fields')), `${path}/Fields`)
              .map((entry) =>
                entry instanceof PDFRef ? refNames.get(entry.toString()) : text(entry)
              )
              .filter((entry): entry is string => entry !== undefined)
          : [];
        const matches = (entry: string): boolean =>
          specified.some((selector) => entry === selector || entry.startsWith(`${selector}.`));
        const mappedFields =
          flags & 1
            ? all.filter((entry) => !matches(entry))
            : object.has(name('Fields'))
              ? all.filter(matches)
              : all;
        if (mappedFields.length) {
          dict.set(
            name('Fields'),
            this.target.context.obj(mappedFields.map((entry) => PDFHexString.fromText(entry)))
          );
          dict.set(name('Flags'), PDFNumber.of(flags & ~1));
        } else {
          this.prune(path, 'action has no retained source fields');
          result = next ?? null;
        }
      }
      if (result === undefined) {
        for (const [key, entry] of object.entries())
          if (!excluded.has(key.decodeText()))
            dict.set(key, this.copier.copy(entry, `${path}/${key.decodeText()}`));
        if (next) dict.set(name('Next'), next);
        result = value instanceof PDFRef ? this.target.context.register(dict) : dict;
      } else if (result === null) result = undefined;
    }
    this.visiting.delete(object);
    this.cache.set(object, result);
    return result;
  }
  additional(
    value: PDFObject | undefined,
    path: string,
    events?: ReadonlySet<string>
  ): PDFDict | undefined {
    const object = resolve(this.source, value);
    if (!(object instanceof PDFDict))
      fail('ADDITIONAL_ACTIONS', this.source.id, path, 'Additional actions are not a dictionary');
    const result = this.target.context.obj({});
    for (const [event, entry] of object.entries()) {
      if (events && !events.has(event.decodeText())) continue;
      const action = this.action(entry, `${path}/${event.decodeText()}`);
      if (action) result.set(event, action);
    }
    return result.entries().length ? result : undefined;
  }
  copyKeys(
    sourceDict: PDFDict,
    targetDict: PDFDict,
    path: string,
    {
      events,
      includeAction = true,
      includeDest = true,
    }: { events?: ReadonlySet<string>; includeAction?: boolean; includeDest?: boolean } = {}
  ): void {
    if (includeDest && sourceDict.has(name('Dest'))) {
      const destination = this.destination(sourceDict.get(name('Dest')), `${path}/Dest`);
      if (destination) targetDict.set(name('Dest'), destination);
    }
    if (includeAction && sourceDict.has(name('A'))) {
      const action = this.action(sourceDict.get(name('A')), `${path}/A`);
      if (action) targetDict.set(name('A'), action);
    }
    if (sourceDict.has(name('AA'))) {
      const additional = this.additional(sourceDict.get(name('AA')), `${path}/AA`, events);
      if (additional) targetDict.set(name('AA'), additional);
    }
  }
}
