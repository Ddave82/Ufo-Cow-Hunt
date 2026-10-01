"""Package the Vite build and separate itch.io press kit; run after npm run build."""
from pathlib import Path
import hashlib
import json
import re
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
OUT = ROOT / 'releases'
OUT.mkdir(exist_ok=True)
index = DIST / 'index.html'
if not index.is_file():
    raise SystemExit('Missing dist/index.html. Run npm run build first.')
html = index.read_text()
for url in re.findall(r'(?:src|href)=[\"\']([^\"\']+)', html):
    if url.startswith('/'):
        raise SystemExit(f'Absolute asset path {url}: use npm run build, not build:pages.')
    if url.startswith('./') and not (DIST / url).is_file():
        raise SystemExit(f'Missing entry asset: {url}')
files = sorted(p for p in DIST.rglob('*') if p.is_file())
if len(files) > 1000 or sum(p.stat().st_size for p in files) > 500_000_000:
    raise SystemExit('Build exceeds itch.io HTML5 file or size limits.')
for p in files:
    if p.is_symlink() or len(p.relative_to(DIST).as_posix()) > 240 or p.stat().st_size > 200_000_000:
        raise SystemExit(f'Unsupported archive entry: {p.name}')

def archive(name, root, paths):
    target = OUT / name
    with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for p in paths:
            z.write(p, p.relative_to(root).as_posix())
    with zipfile.ZipFile(target) as z:
        if z.testzip():
            raise SystemExit(f'Archive verification failed: {name}')
    return {'file': name, 'bytes': target.stat().st_size, 'sha256': hashlib.sha256(target.read_bytes()).hexdigest()}

report = {'commit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()}
report['working_tree_dirty'] = bool(subprocess.check_output(['git', 'status', '--porcelain'], cwd=ROOT, text=True).strip())
report['game'] = archive('ufo-cow-hunt-itch.zip', DIST, files)
kit = ROOT / 'docs/itch-io'
report['press_kit'] = archive('ufo-cow-hunt-press-kit.zip', kit, sorted(p for p in kit.rglob('*') if p.is_file() and not p.is_symlink()))
(OUT / 'release-manifest.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
