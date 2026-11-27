from argparse import ArgumentParser
from pathlib import Path
from tempfile import TemporaryDirectory
import os
import subprocess
import sys


def main():
    parser = ArgumentParser()
    parser.add_argument('--renderer', type=Path, required=True)
    args = parser.parse_args()
    base = Path(__file__).resolve().parent
    dependencies = Path(sys.executable).parent.parent.parent
    native_fonts = dependencies / 'native/libreoffice-headless/libreoffice/LibreOfficeDev.app/Contents/Resources/fonts/truetype'
    if not native_fonts.is_dir():
        raise RuntimeError('Run this helper with the Codex bundled Python runtime; bundled LibreOffice fonts are required.')
    for name in ['source', 'roundtrip-1', 'roundtrip-2', 'after-cancel']:
        with TemporaryDirectory(prefix='zuvi-word-basic-fonts-') as task:
            task = Path(task)
            configuration = task / 'fontconfig.xml'
            configuration.write_text(f'<?xml version="1.0"?><fontconfig><dir>{native_fonts}</dir><dir>{base / "fonts"}</dir><cachedir>{task / "cache"}</cachedir></fontconfig>\n')
            env = os.environ.copy()
            env['FONTCONFIG_FILE'] = str(configuration)
            subprocess.run([sys.executable, str(args.renderer), str(base / f'{name}.docx'),
                            '--output_dir', str(base / f'{name}-render'), '--emit_pdf'], env=env, check=True)


if __name__ == '__main__':
    main()
