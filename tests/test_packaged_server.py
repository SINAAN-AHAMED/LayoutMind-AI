"""Smoke tests for the bundled web build and same-origin API."""
import importlib.util
from pathlib import Path
from fastapi.testclient import TestClient
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('launcher',ROOT/'start.py')
launcher=importlib.util.module_from_spec(spec)
spec.loader.exec_module(launcher)
client=TestClient(launcher.create_app())

def test_bundled_index_and_assets():
    import re
    page=client.get('/')
    assert page.status_code==200
    assert '<div id="root">' in page.text
    assets=re.findall(r'(?:src|href)="(\./assets/[^\"]+)"',page.text)
    assert len(assets)>=2
    for asset in assets:
        response=client.get('/'+asset.removeprefix('./'))
        assert response.status_code==200
        assert len(response.content)>100

def test_same_origin_api():
    assert client.get('/api/health').json()=={'ok':True}
    response=client.post('/api/optimize',json={'prompt':'Modern kitchen 5x4m under 2 lakh'})
    assert response.status_code==200
    assert response.json()['solutions'][0]['room']['type']=='Kitchen'

def test_current_revision_is_visible_and_entry_is_not_cached():
    import json
    expected=json.loads((ROOT/'build-info.json').read_text())
    response=client.get('/api/version')
    assert response.json()==expected
    assert response.headers['cache-control']=='no-store'
    assert client.get('/').headers['cache-control']=='no-store'

def test_delivered_javascript_contains_current_companions_ui():
    import re,json
    expected=json.loads((ROOT/'build-info.json').read_text())['revision']
    page=client.get('/').text
    scripts=re.findall(r'src="(\./assets/[^\"]+\.js)"',page)
    code='\n'.join(client.get('/'+script.removeprefix('./')).text for script in scripts)
    for marker in (expected,'btn-companions','Invite Aira','pet-choices','btn-camera-view','Move camera up','Move camera down','Reset view'):
        assert marker in code, f'Bundled frontend is out of date: missing {marker}'

def test_architectural_blueprint_is_bundled():
    response=client.get('/images/architectural-blueprint.svg')
    assert response.status_code==200
    assert '<svg' in response.text
    assert '<text' not in response.text
    assert 'Minimal architectural floor plan' in response.text

def test_optional_guest_artwork_is_bundled_with_alpha():
    import json
    views=[]
    for name in ('airaViews.json','airaEvaViews.json'):
        outfit=json.loads((ROOT/'frontend/src/lib'/name).read_text());assert len(outfit)==8;views.extend(outfit)
    for i,view in enumerate(views):
        response=client.get('/'+view['url'])
        assert response.status_code==200
        assert response.content[:4]==b'RIFF' and response.content[8:12]==b'WEBP'
        assert response.headers['content-type'].startswith('image/webp')
        assert len(response.content)>10000
        offset=response.content.index(b'VP8L')+8
        assert response.content[offset]==0x2f
        bits=int.from_bytes(response.content[offset+1:offset+5],'little')
        width,height=1+(bits&0x3fff),1+((bits>>14)&0x3fff)
        assert (bits>>28)&1  # Lossless alpha channel is present.
        assert (width,height)==(view['width'],view['height'])
        assert 0<=view['left']<view['right']<=width and 0<=view['top']<view['bottom']<=height
    assert not (ROOT/'frontend/src/three/GuestModel.tsx').exists()
    assert not (ROOT/'frontend/dist/images/aira-model.png').exists()
    assert not (ROOT/'frontend/dist/images/aira-views.png').exists()

def test_factory_is_independent_and_does_not_mutate_engine_routes():
    import main_fixed
    count=len(main_fixed.app.routes)
    first=launcher.create_app()
    second=launcher.create_app()
    assert first is not second
    assert len(first.routes)==len(second.routes)
    assert len(main_fixed.app.routes)==count
    for app in (first,second):
        fresh=TestClient(app)
        assert fresh.get('/api/health').json()=={'ok':True}
        assert fresh.get('/health').json()=={'ok':True}
        assert fresh.get('/assets/nonexistent.js').status_code==404
