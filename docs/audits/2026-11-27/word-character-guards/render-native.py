from argparse import ArgumentParser
from pathlib import Path
from tempfile import TemporaryDirectory
import os
import subprocess
import sys


def main():
    parser = ArgumentParser()
    parser.add_argument('--renderer', type=Path, required=True)
    parser.add_argument('--documents', type=Path, nargs='+')
    args = parser.parse_args()
    base = Path(__file__).resolve().parent
    dependencies = Path(sys.executable).parent.parent.parent
    native_fonts = dependencies / 'native/libreoffice-headless/libreoffice/LibreOfficeDev.app/Contents/Resources/fonts/truetype'
    if not native_fonts.is_dir():
        raise RuntimeError('Use the Codex bundled Python and LibreOffice runtimes.')
    documents = args.documents or [base / f'{name}.docx' for name in ['source', 'roundtrip-1', 'roundtrip-2']]
    for document in documents:
        with TemporaryDirectory(prefix='zuvi-word-character-fonts-') as task:
            task = Path(task)
            configuration = task / 'fontconfig.xml'
            configuration.write_text(f'<?xml version="1.0"?><fontconfig><dir>{native_fonts}</dir><dir>{base.parent / "word-basic-format/fonts"}</dir><cachedir>{task / "cache"}</cachedir></fontconfig>\n')
            env = os.environ.copy()
            env['FONTCONFIG_FILE'] = str(configuration)
            subprocess.run([sys.executable, str(args.renderer), str(document), '--output_dir',
                            str(document.with_name(document.stem + '-render')), '--emit_pdf'], env=env, check=True)


if __name__ == '__main__':
    main()
