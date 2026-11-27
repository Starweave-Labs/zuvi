from pathlib import Path
from docx import Document
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Mm, Pt, RGBColor


def run(paragraph, text, size=12, bold=False, italic=False):
    value = paragraph.add_run(text)
    value.font.name, value.font.size = 'Arial', Pt(size)
    value.font.color.rgb = RGBColor(0, 0, 0)
    value.bold, value.italic = bold, italic
    return value


def create():
    document = Document()
    section = document.sections[0]
    section.page_width, section.page_height = Mm(210), Mm(297)
    section.top_margin = section.bottom_margin = section.left_margin = section.right_margin = Mm(20)
    normal = document.styles['Normal']
    normal.font.name, normal.font.size = 'Arial', Pt(12)
    normal.paragraph_format.space_after = Pt(8)
    title = document.styles['Title']
    title.font.name, title.font.size, title.font.color.rgb = 'Arial', Pt(18), RGBColor(0, 0, 0)
    for border in title.element.xpath('./w:pPr/w:pBdr'):
        border.getparent().remove(border)
    run(document.add_paragraph(style='Title'), 'Word character guard sample', size=18)
    review = document.styles.add_style('Review14', WD_STYLE_TYPE.PARAGRAPH)
    review.base_style = normal
    review.font.name, review.font.size = 'Arial', Pt(14)
    section.header.paragraphs[0].style = review
    source = document.add_paragraph()
    source.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    source.paragraph_format.left_indent = Pt(18)
    source_run = run(source, 'SOURCE', size=18, bold=True)
    source_run.font.color.rgb = RGBColor(0, 85, 170)
    run(document.add_paragraph(), 'target', italic=True)
    for label, prefix, greek in [('lower', 'LOWER ', 'ΟΣ'), ('title', 'tITLE ', 'ΟΣ'),
                                 ('sentence', 'sENTENCE. ', 'ΟΣ'), ('toggle', 'TOGGLE ', 'ΟΣ'),
                                 ('upper', 'upper ', 'ος')]:
        paragraph = document.add_paragraph()
        run(paragraph, prefix + greek[0], bold=True)
        value = run(paragraph, greek[1], size=16, italic=True)
        relation = paragraph.part.relate_to('https://example.com/' + label,
            'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink', is_external=True)
        link = OxmlElement('w:hyperlink'); link.set(qn('r:id'), relation)
        link.append(value._r); paragraph._p.append(link)
    run(document.add_paragraph(), 'Length İΣΟΣ ß', bold=True)
    destination = Path(__file__).resolve().parent / 'source.docx'
    document.save(destination)


if __name__ == '__main__':
    create()
