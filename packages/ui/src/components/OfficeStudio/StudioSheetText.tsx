import * as React from 'react';
import type { SheetTextLayout } from './studio-sheet-text-layout';
import { studioSheetTextFontFamily } from './studio-sheet-text-display';

/** Positions the untransformed lines once; the containing matrix also rotates the glyphs. */
export function StudioSheetText({
  layout,
  width,
  height,
  origin,
}: {
  layout: SheetTextLayout;
  width: number;
  height: number;
  origin?: { left: number; top: number };
}) {
  const { transform, effectiveFont } = layout;
  return (
    <div
      className="zuvi-studio-sheet-text"
      data-text-align={layout.align}
      data-text-rotation={layout.verticalGlyphs ? 'vertical' : undefined}
      data-effective-font-size={effectiveFont.sizePt}
      data-shrink-applied={layout.shrinkApplied || undefined}
      style={{
        width,
        height,
        left: origin?.left,
        top: origin?.top,
        fontFamily: studioSheetTextFontFamily(effectiveFont.family),
        fontSize: `${effectiveFont.sizePt}pt`,
        fontWeight: effectiveFont.bold ? 700 : 400,
        fontStyle: effectiveFont.italic ? 'italic' : 'normal',
      }}
    >
      <div
        className="zuvi-studio-sheet-text-transform"
        style={{
          transform: `matrix(${transform.a},${transform.b},${transform.c},${transform.d},${transform.e},${transform.f})`,
        }}
      >
        {layout.lines.map((line, index) =>
          layout.verticalGlyphs ? (
            <React.Fragment key={index}>
              {line.runs.map((run, runIndex) => (
                <span
                  key={runIndex}
                  style={{ left: run.x, top: run.y, lineHeight: `${run.height}px` }}
                >
                  {run.text}
                </span>
              ))}
            </React.Fragment>
          ) : (
            <span
              key={index}
              dir={layout.direction}
              style={{
                left: line.x,
                top: line.y,
                height: line.height,
                lineHeight: `${line.height}px`,
                letterSpacing: line.gapKind === 'characters' ? line.gap : undefined,
                wordSpacing: line.gapKind === 'words' ? line.gap : undefined,
              }}
            >
              {line.text}
            </span>
          )
        )}
      </div>
    </div>
  );
}
