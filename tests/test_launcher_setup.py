"""Regression: cached setup must still detect missing runtime imports."""
import hashlib
import importlib.util
import os
from pathlib import Path
from subprocess import CompletedProcess
import pytest

spec=importlib.util.spec_from_file_location('setup_launcher',Path(__file__).resolve().parents[1]/'start.py')
launcher=importlib.util.module_from_spec(spec)
spec.loader.exec_module(launcher)

@pytest.mark.parametrize('broken', [False, True])
def test_cached_setup_checks_runtime(tmp_path,monkeypatch,broken):
    monkeypatch.setattr(launcher,'ROOT',tmp_path)
    python=tmp_path/'.venv'/('Scripts/python.exe' if os.name=='nt' else 'bin/python')
    python.parent.mkdir(parents=True);python.touch()
    req=tmp_path/'softcomputing-service/requirements.txt'
    req.parent.mkdir();req.write_text('packaging==26.3\n')
    stamp=tmp_path/'.venv/layoutmind-requirements.sha256'
    stamp.write_text(hashlib.sha256(req.read_bytes()).hexdigest())
    calls=[]
    def run(args,**kwargs):
        calls.append(args)
        failed=broken and len(calls)==1
        return CompletedProcess(args,1 if failed else 0,stdout='',stderr='missing packaging' if failed else '')
    monkeypatch.setattr(launcher.subprocess,'run',run)
    assert launcher.prepare_environment()==python
    assert any('pip' in args for args in calls)==broken
    assert calls[0][1]=='-c'

def test_failed_import_does_not_mark_setup_complete(tmp_path,monkeypatch):
    monkeypatch.setattr(launcher,'ROOT',tmp_path)
    python=tmp_path/'.venv'/('Scripts/python.exe' if os.name=='nt' else 'bin/python')
    python.parent.mkdir(parents=True);python.touch()
    req=tmp_path/'softcomputing-service/requirements.txt'
    req.parent.mkdir();req.write_text('packaging==26.3\n')
    monkeypatch.setattr(launcher.subprocess,'run',lambda args,**kwargs: CompletedProcess(args,0 if 'pip' in args else 1,stdout='',stderr='missing module'))
    with pytest.raises(RuntimeError,match='engine imports failed'):launcher.prepare_environment()
    assert not (tmp_path/'.venv/layoutmind-requirements.sha256').exists()

@pytest.mark.parametrize('value',['0','-1','65536','abc'])
def test_invalid_ports_fail_before_setup(monkeypatch,value):
    monkeypatch.setattr(launcher.sys,'argv',['start.py','--port',value])
    monkeypatch.setattr(launcher,'prepare_environment',lambda: pytest.fail('Invalid port must not trigger setup'))
    with pytest.raises(SystemExit) as error:launcher.main()
    assert error.value.code==2

def test_valid_port_range():
    assert launcher.port_number('1')==1
    assert launcher.port_number('65535')==65535

def test_occupied_default_port_uses_a_fresh_address(monkeypatch):
    import socket
    occupied=set([8000,8001])
    class Probe:
        def __enter__(self):return self
        def __exit__(self,*args):pass
        def bind(self,address):
            if address[1] in occupied:raise OSError('busy')
    monkeypatch.setattr(socket,'socket',lambda:Probe())
    assert launcher.available_port()==8002
    with pytest.raises(RuntimeError,match='busy'):launcher.available_port(8000)
    assert launcher.available_port(9000)==9000

def test_no_free_default_port_reports_a_clear_error(monkeypatch):
    import socket
    class Probe:
        def __enter__(self):return self
        def __exit__(self,*args):pass
        def bind(self,address):raise OSError('busy')
    monkeypatch.setattr(socket,'socket',lambda:Probe())
    with pytest.raises(RuntimeError,match='8000–8010'):launcher.available_port()
