from argparse import ArgumentParser
from pathlib import Path
from docx import Document
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Mm, Pt, RGBColor


def run(paragraph, text, font='Arial', size=12, **flags):
    value = paragraph.add_run(text)
    value.font.name = font
    value.font.size = Pt(size)
    value.font.color.rgb = RGBColor(0, 0, 0)
    for name, enabled in flags.items():
        setattr(value.font, name, enabled)
    return value


def shading(value, color):
    entry = OxmlElement('w:shd')
    entry.set(qn('w:val'), 'clear')
    entry.set(qn('w:fill'), color)
    value._r.get_or_add_rPr().append(entry)


def create(destination):
    document = Document()
    section = document.sections[0]
    section.page_width, section.page_height = Mm(210), Mm(297)
    section.top_margin = section.bottom_margin = section.left_margin = section.right_margin = Mm(20)
    normal = document.styles['Normal']
    normal.font.name, normal.font.size = 'Arial', Pt(12)
    normal.font.color.rgb = RGBColor(0, 0, 0)
    normal.paragraph_format.space_after = Pt(8)
    title = document.styles['Title']
    title.font.name, title.font.size = 'Arial', Pt(18)
    title.font.color.rgb = RGBColor(0, 0, 0)
    title.paragraph_format.space_after = Pt(12)
    for border in title.element.xpath('./w:pPr/w:pBdr'):
        border.getparent().remove(border)
    run(document.add_paragraph(style='Title'), 'Word basic formatting sample', size=18)
    paragraph = document.add_paragraph()
    run(paragraph, 'Mixed plain ')
    formatted = run(paragraph, 'Mixed rich', font='Times New Roman', size=14.5,
                    bold=True, italic=True, underline=True, strike=True)
    shading(formatted, 'FFFF00')
    run(document.add_paragraph(), 'Clear styles', bold=True, italic=True, underline=True, strike=True)
    for text in ['Caret base', 'Script 23', 'Highlight target', 'Highlight caret']:
        run(document.add_paragraph(), text)
    paragraph = document.add_paragraph()
    relationship = paragraph.part.relate_to(
        'https://example.com/kept-link',
        'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink',
        is_external=True,
    )
    link = OxmlElement('w:hyperlink')
    link.set(qn('r:id'), relationship)
    linked_run = run(paragraph, 'Untouched link')
    link.append(linked_run._r)
    paragraph._p.append(link)
    chinese = run(document.add_paragraph(), '中文小数字号样本', font='Noto Sans SC', size=12.5)
    chinese._r.get_or_add_rPr().rFonts.set(qn('w:eastAsia'), 'Noto Sans SC')
    document.core_properties.title = 'Word basic formatting sample'
    document.core_properties.author = 'OfficeStudio verification'
    destination.parent.mkdir(parents=True, exist_ok=True)
    document.save(destination)


if __name__ == '__main__':
    parser = ArgumentParser()
    parser.add_argument('--out', type=Path, required=True)
    create(parser.parse_args().out)
