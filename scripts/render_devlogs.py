"""Render the project's simple Markdown devlogs as portable, local HTML previews."""
from pathlib import Path
import html, re
ROOT=Path(__file__).resolve().parents[1]

def inline(text):
    text=html.escape(text)
    text=re.sub(r'\*\*(.+?)\*\*',r'<strong>\1</strong>',text)
    text=re.sub(r'\*(.+?)\*',r'<em>\1</em>',text)
    return text

for lang in ('EN','DE'):
    path=ROOT/f'docs/itch-io/DEVLOG-{lang}.md'
    output=[]
    for block in path.read_text().strip().split('\n\n'):
        if block.startswith('!['):
            match=re.fullmatch(r'!\[(.*?)\]\((.*?)\)',block)
            if not match: raise ValueError(block)
            output.append(f'<figure><img src="{html.escape(match[2])}" alt="{html.escape(match[1])}"></figure>')
        elif block.startswith('# '): output.append('<h1>'+inline(block[2:])+'</h1>')
        elif block.startswith('## '): output.append('<h2>'+inline(block[3:])+'</h2>')
        else: output.append('<p>'+inline(block.replace('\n',' '))+'</p>')
    page='<!doctype html>\n<html lang="'+lang.lower()+'"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>UFO Cow Hunt — visual update</title><style>body{margin:0;background:#071c24;color:#e6f5f0;font:18px/1.65 system-ui,sans-serif}article{max-width:860px;margin:auto;padding:56px 24px 80px}h1{font-size:clamp(32px,5vw,52px);line-height:1.12;letter-spacing:-.035em}h2{margin-top:2em;color:#80e5c5;font-size:28px}figure{margin:28px 0}img{max-width:100%;height:auto;border-radius:12px}em{color:#afc6c5;font-size:15px}</style><article>'+ '\n'.join(output)+'</article></html>\n'
    path.with_suffix('.html').write_text(page)
