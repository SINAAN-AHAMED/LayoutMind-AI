"""Behavioral regressions for connected kitchens, wall fixtures and oriented seating."""
import math
import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from main_fixed import app,parse_prompt
from room_planner import CATALOG,make_plan,bounds,intersects,dimensions
client=TestClient(app)
STYLES=['Modern','Luxury','Minimal','Cozy','Compact','Bohemian','Industrial','Coastal']
ROOMS=['Kitchen','Bathroom','Dining Room','Bedroom','Living Room','Home Office']
SIZES=[(2,2),(2.5,3),(3,3),(4,5),(5,4),(7,6),(12,8)]

@pytest.mark.parametrize('alias',['study table','study desk','computer table','workstation'])
def test_explicit_bedroom_study_is_prioritized(alias):
    extracted,requested=parse_prompt(f'Modern bedroom 4x4m with a {alias}')
    assert extracted.roomType=='Bedroom'
    assert 'desk' in requested
    assert 'table' not in requested
    response=client.post('/optimize',json={'prompt':f'Modern bedroom 4x4m with a {alias}'})
    assert response.status_code==200
    for sol in response.json()['solutions']:
        assert {'bed','desk','officeChair'}<={it['type'] for it in sol['items']}

def test_unfittable_requested_study_has_an_explanation():
    items,omitted,_=make_plan(2,2,'Bedroom','Modern',requested=['desk'])
    assert any(i['type']=='desk' for i in items) or any(o['type']=='desk' for o in omitted)

def test_kitchens_have_different_configurations_not_only_rotated_runs():
    from room_planner import kitchen_family
    families=set()
    for variant in range(4):
        items,_,_=make_plan(5,5,'Kitchen','Modern',variant=variant)
        verify(items,5,5)
        families.add(kitchen_family(items))
    assert families=={'Island','L-shaped','Galley','Single-wall'}
    data=client.post('/optimize',json={'prompt':'Modern kitchen 5x5m'}).json()
    assert len({s['room']['layoutKind'] for s in data['solutions']})==3

@pytest.mark.parametrize('style,configuration',[('Luxury','Island'),('Modern','L-shaped'),('Minimal','Single-wall'),('Industrial','Galley')])
def test_style_selects_an_affordable_kitchen_configuration(style,configuration):
    data=client.post('/optimize',json={'prompt':'Kitchen 5x5m under 8 lakh','explicitStyle':style}).json()
    assert data['solutions'][0]['room']['layoutKind']==configuration

@pytest.mark.parametrize('size',[(4,5),(6,7),(12,8)])
def test_living_room_is_a_facing_compact_seating_group(size):
    for style in STYLES:
        for variant in range(4):
            items,_,_=make_plan(*size,'Living Room',style,plants=True,rugs=True,variant=variant)
            verify(items,*size)
            tv=next(i for i in items if i['type']=='tvUnit')
            sofa=next(i for i in items if i['type']=='sofa')
            table=next(i for i in items if i['type']=='table')
            dx,dz=sofa['x']-tv['x'],sofa['z']-tv['z']
            distance=math.hypot(dx,dz)
            assert 2.0<distance<3.11
            assert abs(dx*math.cos(tv['rot'])-dz*math.sin(tv['rot']))<1e-8
            assert (dx*math.sin(tv['rot'])+dz*math.cos(tv['rot']))/distance>.999
            assert (-dx*math.sin(sofa['rot'])-dz*math.cos(sofa['rot']))/distance>.999
            front_gap=math.hypot(table['x']-sofa['x'],table['z']-sofa['z'])-dimensions(sofa)[1]/2-dimensions(table)[1]/2
            assert .36<front_gap<.40
            for seat in (i for i in items if i['type']=='chair'):
                sx,sz=table['x']-seat['x'],table['z']-seat['z'];d=math.hypot(sx,sz)
                assert d<1.8
                assert (sx*math.sin(seat['rot'])+sz*math.cos(seat['rot']))/d>.999
            rug=next(i for i in items if i['type']=='rug')
            assert math.hypot(rug['x']-table['x'],rug['z']-table['z'])<.4

def test_tiny_living_room_explains_a_tv_omission_instead_of_using_a_random_wall():
    items,notes,_=make_plan(2,2,'Living Room')
    assert any(i['type']=='sofa' for i in items)
    assert not any(i['type']=='tvUnit' for i in items)
    assert any(n['type']=='tvUnit' and 'facing TV' in n['reason'] for n in notes)

def as_plan(item):
    return {**{k:v for k,v in item.items() if v is not None},'rot':item['rotationY']}

def verify(items,w,l):
    for index,it in enumerate(items):
        hx,hz=bounds(it)
        assert abs(it['x'])+hx<=w/2-.0249,(it['type'],'width')
        assert abs(it['z'])+hz<=l/2-.0249,(it['type'],'depth')
        assert it['scale']==1,'Room fitting must not shrink fixture/chair heights'
        assert it['y']==CATALOG[it['type']]['mountY']
        for other in items[index+1:]:assert not intersects(it,other,0),(it['type'],other['type'])
        if CATALOG[it['type']]['wallAnchored']:
            distance=min(w/2-abs(it['x'])-hx,l/2-abs(it['z'])-hz)
            assert distance<=.046,(it['type'],'detached from wall',distance)
            inward=(-it['x']*math.sin(it['rot'])-it['z']*math.cos(it['rot']))
            assert inward>0,(it['type'],'faces away from room')

@pytest.mark.parametrize('room',ROOMS)
@pytest.mark.parametrize('style',STYLES)
def test_semantic_plans_across_sizes_styles_and_orientations(room,style):
    for w,l in SIZES:
        for variant in range(4):
            items,notes,door=make_plan(w,l,room,style,[],True,True,variant)
            assert items,(room,w,l)
            assert door in ('front','right','back','left')
            verify(items,w,l)
            if room=='Bathroom':assert {'toilet','vanity','shower'}<={i['type'] for i in items}
            if room=='Kitchen':assert {'sink','stove','refrigerator','kitchenCounter'}<={i['type'] for i in items}

def test_kitchen_modules_form_a_connected_run():
    items,_,_=make_plan(4,5,'Kitchen','Luxury')
    modules=sorted([i for i in items if i['type'] in ('kitchenCounter','sink','stove','dishwasher','refrigerator')],key=lambda i:i['x'])
    assert len(modules)==5
    for a,b in zip(modules,modules[1:]):
        gap=b['x']-dimensions(b)[0]/2-(a['x']+dimensions(a)[0]/2)
        assert .017<gap<.019
    for upper in (i for i in items if i['type'] in ('wallCabinet','rangeHood')):
        assert upper['y']==1.5
        assert any(abs(upper['x']-base['x'])<(dimensions(base)[0]+dimensions(upper)[0])/2 for base in modules)
    microwave=next(i for i in items if i['type']=='microwave')
    counter=next(i for i in items if i['type']=='kitchenCounter')
    assert abs(microwave['x']-counter['x'])+dimensions(microwave)[0]/2<=dimensions(counter)[0]/2+.01
    assert microwave['y']==.94

def ray_hits_table(chair,table):
    # Transform the chair's forward ray to the table's local frame.
    r=table['rot'];c,s=math.cos(r),math.sin(r)
    dx,dz=chair['x']-table['x'],chair['z']-table['z']
    origin=(dx*c-dz*s,dx*s+dz*c)
    direction=(math.sin(chair['rot'])*c-math.cos(chair['rot'])*s,math.sin(chair['rot'])*s+math.cos(chair['rot'])*c)
    half=(dimensions(table)[0]/2,dimensions(table)[1]/2)
    lo,hi=0,float('inf')
    for o,d,h in zip(origin,direction,half):
        if abs(d)<1e-9:
            if abs(o)>h:return False
        else:
            t1,t2=(-h-o)/d,(h-o)/d
            lo=max(lo,min(t1,t2));hi=min(hi,max(t1,t2))
    return hi>=lo

@pytest.mark.parametrize('size',[(2,2),(3,3),(4,5),(5,4)])
def test_every_dining_chair_faces_its_table(size):
    for variant in range(4):
        items,_,_=make_plan(*size,'Dining Room','Modern',variant=variant)
        table=next(i for i in items if i['type']=='diningTable')
        chairs=[i for i in items if i['type']=='diningChair']
        assert len(chairs)>=2
        for chair in chairs:
            assert chair['groupId']==table['groupId']
            assert ray_hits_table(chair,table),(size,variant,chair)

@pytest.mark.parametrize('room,essentials',[
 ('Kitchen',{'kitchenCounter','sink','stove','refrigerator','rangeHood','wallCabinet'}),
 ('Bathroom',{'toilet','shower','vanity','bathtub','towelRack'}),
 ('Dining Room',{'diningTable','diningChair','sideboard'})])
def test_api_exposes_actual_room_assets_and_honest_costs(room,essentials):
    response=client.post('/optimize',json={'prompt':'Design a modern living room 7x6','roomType':room,'widthM':4,'lengthM':5,'budgetINR':30000,'explicitStyle':'Luxury'})
    assert response.status_code==200,response.text
    data=response.json();assert len(data['solutions'])==3
    signatures=[]
    for sol in data['solutions']:
        assert sol['room']['type']==room
        assert sol['room']['widthM']==4 and sol['room']['lengthM']==5
        assert sol['selectedStyles'][0]=='Luxury'
        assert essentials<={i['type'] for i in sol['items']}
        assert sol['metrics']['totalCostINR']==sum(CATALOG[i['type']]['costINR'] for i in sol['items'])
        assert sol['metrics']['budgetCompliancePct']<100
        verify([as_plan(i) for i in sol['items']],4,5)
        signatures.append([(i['type'],round(i['x'],3),round(i['z'],3),round(i['rotationY'],3)) for i in sol['items']])
    assert signatures[0]!=signatures[1]
    for step in data['history_steps']:
        assert step['doorWall'] in ('front','right','back','left')
        verify([as_plan(i) for i in step['items']],4,5)

def test_prompt_feet_budgets_and_compound_names():
    parsed,items=parse_prompt('A kitchen 12ft x 10ft under 80k with a side table and refrigerator')
    assert parsed.lengthM==pytest.approx(3.6576)
    assert parsed.budgetINR==80000
    assert 'sideTable' in items and 'table' not in items
    assert 'refrigerator' in items

def test_no_living_room_cupboards_in_a_bathroom():
    sol=client.post('/optimize',json={'prompt':'Bathroom 3x3 with a sink and cupboard'}).json()['solutions'][0]
    assert not {'wardrobe','kitchenCounter','sink','sofa'}&{it['type'] for it in sol['items']}
    assert 'vanity' in {it['type'] for it in sol['items']}

def test_impossible_optional_island_is_explained():
    sol=client.post('/optimize',json={'prompt':'Kitchen 2x2 with an island'}).json()['solutions'][0]
    assert 'kitchenIsland' not in {i['type'] for i in sol['items']}
    assert any(i['type']=='kitchenIsland' for i in sol['removedItems'])

def test_request_validation():
    assert client.post('/optimize',json={'prompt':'x'}).status_code==422
    assert client.post('/optimize',json={'prompt':'Kitchen','widthM':1}).status_code==422

@pytest.mark.parametrize('room,decor',[
 ('Kitchen',{'rangeHood','kitchenVent','wallShelf'}),
 ('Bathroom',{'bathroomCabinet','wallSconce'}),
 ('Dining Room',{'wallArt','wallSconce'}),
 ('Home Office',{'officeChair','wallArt','wallSconce'})])
def test_room_accessories_are_supported_editable_assets(room,decor):
    items,_,_=make_plan(4,5,room,'Luxury')
    assert decor<={i['type'] for i in items}
    verify(items,4,5)
    for it in items:
        assert it['y']+CATALOG[it['type']]['targetSizeM']['y']<=3.2

def test_prompt_recognizes_chimney_ventilation_art_and_wall_lights():
    _,requested=parse_prompt('Kitchen 4x5 with a chimney, air vent, painting and wall lights')
    assert {'rangeHood','kitchenVent','wallArt','wallSconce'}<=set(requested)
