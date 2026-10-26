"""LayoutMind local launcher: isolated Python setup, API and prebuilt web app."""
from pathlib import Path
import argparse
import hashlib
import json
import os
import subprocess
import sys

ROOT = Path(__file__).resolve().parent

def runtime_check(python):
    """Check runtime imports without depending on development/test packages."""
    return subprocess.run(
        [str(python), '-c', 'import packaging, uvicorn, main_fixed'],
        cwd=ROOT / 'softcomputing-service',
        capture_output=True, text=True,
    )

def prepare_environment():
    env = ROOT / '.venv'
    python = env / ('Scripts/python.exe' if os.name == 'nt' else 'bin/python')
    if not python.exists():
        print('Creating the LayoutMind Python environment...', flush=True)
        subprocess.run([sys.executable, '-m', 'venv', str(env)], check=True)
    requirements = ROOT / 'softcomputing-service' / 'requirements.txt'
    fingerprint = hashlib.sha256(requirements.read_bytes()).hexdigest()
    stamp = env / 'layoutmind-requirements.sha256'
    if not stamp.exists() or stamp.read_text() != fingerprint or runtime_check(python).returncode != 0:
        print('Installing LayoutMind dependencies (internet required on first run)...', flush=True)
        subprocess.run([str(python), '-m', 'pip', 'install', '-r', str(requirements)], check=True)
        check = runtime_check(python)
        if check.returncode != 0:
            raise RuntimeError(f'Python dependencies installed but engine imports failed:\n{check.stderr.strip()}')
        stamp.write_text(fingerprint)
    return python

def create_app():
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.staticfiles import StaticFiles
    engine = str(ROOT / 'softcomputing-service')
    if engine not in sys.path:
        sys.path.insert(0, engine)
    from main_fixed import health, optimize_endpoint, OptimizeResponse
    app = FastAPI(title='LayoutMind Spatial Studio', version='2.0.0')
    app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_methods=['*'], allow_headers=['*'])
    app.add_api_route('/health', health, methods=['GET'])
    app.add_api_route('/optimize', optimize_endpoint, methods=['POST'], response_model=OptimizeResponse)
    app.add_api_route('/api/health', health, methods=['GET'])
    app.add_api_route('/api/optimize', optimize_endpoint, methods=['POST'], response_model=OptimizeResponse)
    app.add_api_route('/api/version', lambda: json.loads((ROOT / 'build-info.json').read_text()), methods=['GET'])
    @app.middleware('http')
    async def fresh_entry(request, call_next):
        response = await call_next(request)
        if request.url.path in ('/', '/index.html', '/api/version'):
            response.headers['Cache-Control'] = 'no-store'
        return response
    dist = ROOT / 'frontend' / 'dist'
    if not (dist / 'index.html').is_file():
        raise RuntimeError('Missing frontend build. Run npm ci and npm run build in frontend/.')
    app.mount('/', StaticFiles(directory=dist, html=True), name='web')
    return app

def port_number(value):
    try:
        port = int(value)
    except ValueError:
        raise argparse.ArgumentTypeError('Port must be a number between 1 and 65535.') from None
    if not 1 <= port <= 65535:
        raise argparse.ArgumentTypeError('Port must be between 1 and 65535.')
    return port

def available_port(requested=None):
    """Open this copy on a fresh address rather than sending users to an old server."""
    import socket
    for candidate in ([requested] if requested is not None else range(8000, 8011)):
        with socket.socket() as probe:
            try:
                probe.bind(('127.0.0.1', candidate))
                return candidate
            except OSError:
                continue
    if requested is not None:
        raise RuntimeError(f'Port {requested} is busy. Close that server or choose another --port.')
    raise RuntimeError('Ports 8000–8010 are busy. Close an older studio or specify --port with a free port.')

def main():
    parser = argparse.ArgumentParser(description='Launch LayoutMind in your browser')
    parser.add_argument('--setup-only', action='store_true')
    parser.add_argument('--no-browser', action='store_true')
    parser.add_argument('--port', type=port_number)
    parser.add_argument('--ready', action='store_true', help=argparse.SUPPRESS)
    args = parser.parse_args()
    if sys.version_info < (3,12):
        raise SystemExit('LayoutMind requires Python 3.12 or newer. Run python3.12 start.py on Mac, or py -3.12 start.py on Windows.')
    if not args.ready:
        python = prepare_environment()
        if args.setup_only:
            print(f'Environment ready: {python}')
            return
        raise SystemExit(subprocess.call([str(python), str(Path(__file__).resolve()), *sys.argv[1:], '--ready']))
    args.port = available_port(args.port)
    if args.port != 8000:
        print(f'Opening this studio copy on port {args.port}; use the address below.', flush=True)
    app = create_app()
    url = f'http://127.0.0.1:{args.port}'
    if not args.no_browser:
        import threading
        import time
        import urllib.request
        import webbrowser
        def open_when_ready():
            for _ in range(60):
                try:
                    with urllib.request.urlopen(url+'/api/health',timeout=1) as response:
                        if response.status==200:
                            webbrowser.open(url)
                            return
                except OSError:
                    time.sleep(.5)
        threading.Thread(target=open_when_ready,daemon=True).start()
    revision = json.loads((ROOT / 'build-info.json').read_text())['revision']
    print(f'LayoutMind {revision}: {url} — press Ctrl+C to stop.',flush=True)
    import uvicorn
    uvicorn.run(app,host='127.0.0.1',port=args.port)

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        raise SystemExit(0)
    except (subprocess.CalledProcessError, OSError, RuntimeError) as exc:
        raise SystemExit(f'LayoutMind could not start: {exc}')
