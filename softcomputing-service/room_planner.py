"""Semantic furniture planning. Local +Z is the front of every asset.

Hard constraints preserve fixture-to-wall and chair-to-table relationships;
optional furniture is omitted instead of moving essentials into an aisle.
"""
from __future__ import annotations
from pathlib import Path
import json
import math

CATALOG = json.loads(Path(__file__).with_name('catalog.json').read_text())
TAU = math.tau
WALL_GAP = .045

def dimensions(item):
    size=CATALOG[item['type']]['targetSizeM']; scale=item.get('scale',1)
    return item.get('widthM',size['x'])*scale, item.get('depthM',size['z'])*scale, item.get('heightM',size['y'])*scale

def bounds(item):
    w,d,_=dimensions(item); c,s=abs(math.cos(item['rot'])),abs(math.sin(item['rot']))
    return (w*c+d*s)/2,(w*s+d*c)/2

def intersects(a,b,gap=.012):
    if a['type']=='rug' or b['type']=='rug':return False
    ay=a.get('y',0);by=b.get('y',0)
    ah=a.get('heightM',CATALOG[a['type']].get('collisionHeightM',CATALOG[a['type']]['targetSizeM']['y']))*a.get('scale',1)
    bh=b.get('heightM',CATALOG[b['type']].get('collisionHeightM',CATALOG[b['type']]['targetSizeM']['y']))*b.get('scale',1)
    if ay+ah <= by+.005 or by+bh <= ay+.005:return False
    ax,az=bounds(a);bx,bz=bounds(b)
    return abs(a['x']-b['x'])<ax+bx+gap-1e-6 and abs(a['z']-b['z'])<az+bz+gap-1e-6

class Plan:
    def __init__(self,width,length,room,style):
        self.w,self.l=width,length;self.hw,self.hl=width/2,length/2
        self.room,self.style=room,style;self.items=[];self.omitted=[]
        # Reserve a real entry route rather than placing a cabinet over a doorway.
        self.entry={'type':'desk','x':0,'z':self.hl-.30,'y':0,'rot':0,'scale':1,'widthM':.80,'depthM':.60,'heightM':2.05}
    def add(self,kind,x,z,rot=0,width=None,depth=None,y=None,group=None,entry=True):
        spec=CATALOG[kind]
        item={'type':kind,'x':float(x),'z':float(z),'rot':rot%TAU,'scale':1.,'y':spec['mountY'] if y is None else y}
        if width is not None:item['widthM']=float(width)
        if depth is not None:item['depthM']=float(depth)
        if group:item['groupId']=group
        hx,hz=bounds(item)
        if abs(x)+hx>self.hw-.025+1e-6 or abs(z)+hz>self.hl-.025+1e-6:return None
        if any(intersects(item,other) for other in self.items):return None
        if entry and item['y']<2.05 and intersects(item,self.entry,0):return None
        self.items.append(item);return item
    def wall(self,kind,wall,along=0,width=None,depth=None,y=None,group=None):
        size=CATALOG[kind]['targetSizeM']; d=depth or size['z']; offset=d/2+WALL_GAP
        coords={'back':(along,-self.hl+offset,0),'front':(-along,self.hl-offset,math.pi),
                'left':(-self.hw+offset,-along,math.pi/2),'right':(self.hw-offset,along,3*math.pi/2)}
        return self.add(kind,*coords[wall],width=width,depth=depth,y=y,group=group)
    def wall_search(self,kind,walls=('back','left','right'),preferred=0,width=None):
        for wall in walls:
            span=self.w if wall in ('back','front') else self.l
            half=(width or CATALOG[kind]['targetSizeM']['x'])/2
            limit=span/2-half-.06
            if limit<0:continue
            points=[max(-limit,min(limit,preferred))]
            points += sorted([(-limit+i*.08) for i in range(int(2*limit/.08)+1)],key=lambda a:abs(a-preferred))
            for along in points:
                result=self.wall(kind,wall,along,width=width)
                if result:return result
        return None
    def loose(self,kind,preferred=(0,0),rot=0):
        # Only genuinely freestanding accessories use a floor search.
        points=[preferred]+sorted([(x*.15,z*.15) for x in range(-int(self.hw/.15),int(self.hw/.15)+1)
                                  for z in range(-int(self.hl/.15),int(self.hl/.15)+1)],key=lambda p:(p[0]-preferred[0])**2+(p[1]-preferred[1])**2)
        for x,z in points:
            result=self.add(kind,x,z,rot)
            if result:return result
        return None
    def missing(self,kind,reason):self.omitted.append({'type':kind,'reason':reason})


def kitchen(plan,requested,plants,variant=0):
    p=plan; available=p.w-.12
    group='kitchen-run'
    # A connected back-wall run: fridge / sink / prep / cooker / dishwasher.
    # In compact rooms the tall fridge goes on the return wall, never in the aisle.
    fridge_in_run=available>=2.95
    dishwasher=available>=3.65 and p.style not in ('Minimal','Compact')
    sink_w=.90 if available>=2.5 else .72
    stove_w=.64
    fixed=sink_w+stove_w+(.76 if fridge_in_run else 0)+(.60 if dishwasher else 0)
    seam=.018; count=3+int(fridge_in_run)+int(dishwasher)
    counter_w=max(.32,available-fixed-seam*(count-1))
    modules=([('refrigerator',.76)] if fridge_in_run else [])+[('sink',sink_w),('kitchenCounter',counter_w),('stove',stove_w)]+([('dishwasher',.6)] if dishwasher else [])
    total=sum(w for _,w in modules)+seam*(len(modules)-1)
    start=-total/2
    bases=[]
    for kind,width in modules:
        x=start+width/2
        item=p.wall(kind,'back',x,width=width,group=group)
        if item:bases.append(item)
        else:p.missing(kind,'The connected appliance run could not fit this room.')
        start+=width+seam
    if not fridge_in_run:
        if not p.wall_search('refrigerator',('left','right'),preferred=-p.hl+.48,width=.60 if p.w<2.5 and p.l<2.5 else None):
            p.missing('refrigerator','No tall-appliance position leaves a clear entrance.')
    for base in bases:
        kind=base['type'];width=base.get('widthM',CATALOG[kind]['targetSizeM']['x'])
        if kind=='stove':
            p.wall('rangeHood','back',base['x'],width=min(width+.01,.7),group=group)
        elif kind in ('sink','kitchenCounter'):
            if p.style=='Minimal' and kind=='sink':continue
            count=max(1,math.ceil(width/1.05)); cabinet_w=(width-(count-1)*.016)/count
            for index in range(count):
                p.wall('wallCabinet','back',base['x']-width/2+cabinet_w/2+index*(cabinet_w+.016),width=cabinet_w,group=group)
    counter=next((item for item in bases if item['type']=='kitchenCounter'),None)
    if counter and counter.get('widthM',1.2)>=.64 and p.style not in ('Minimal','Compact'):
        p.add('microwave',counter['x']+min(.25,(counter.get('widthM',1.2)-.54)/2),counter['z']-.04,group=group)
    want_island='kitchenIsland' in requested or (variant==0 and p.style in ('Luxury','Modern','Cozy','Bohemian'))
    if want_island and p.w>=3.6 and p.l>=3.85:
        island=p.add('kitchenIsland',0,.16,group='island')
        if island and p.l>=4.35:
            for x in (-.5,.5):p.add('barStool',x,1.04,math.pi,group='island')
    elif 'kitchenIsland' in requested:p.missing('kitchenIsland','An island needs room for clear circulation around the worktop; the perimeter kitchen is retained.')
    # Real alternatives: a connected return or an opposing preparation run.
    # Both retain the existing appliance run and a clear central entrance.
    if 'kitchenIsland' not in requested and variant==1 and p.l>=3.4 and p.w>=2.8:
        z=-p.hl+WALL_GAP+.64+.018+.60
        p.wall('kitchenCounter','right',z,width=1.2,group='kitchen-return')
    if 'kitchenIsland' not in requested and variant==2 and p.l>=3.2 and p.w>=3.5:
        for sign in (-1,1):
            p.wall('kitchenCounter','front',sign*(p.hw-.045-.60),width=1.2,group='kitchen-galley')
    if 'tallCabinet' in requested:p.wall_search('tallCabinet',('left','right'),preferred=0)
    if plants:p.wall_search('plant',('left','right'),preferred=-p.hl+.35)


def bathroom(plan,requested,plants):
    p=plan
    # Every essential is backed by a wall. Its modeled front points into the room.
    shower=p.wall('shower','back',-p.hw+.045+.49)
    if not shower:p.missing('shower','No wall corner can accommodate the shower enclosure.')
    toilet=p.wall('toilet','back',-p.hw+1.34)
    if not toilet:p.missing('toilet','No wall position can accommodate the toilet.')
    vanity_w=min(1.,max(.65,p.l-1.3))
    vanity=p.wall('vanity','left',-p.hl+.07+vanity_w/2,width=vanity_w)
    if not vanity:
        vanity=p.wall_search('vanity',('right','front'),preferred=-p.hw+.6,width=vanity_w)
    if not vanity:p.missing('vanity','The vanity cannot fit without obstructing another fixture or the entry.')
    want_tub='bathtub' in requested or (p.w>=2.8 and p.l>=2.8 and p.style!='Compact')
    if want_tub:
        tub=p.add('bathtub',p.hw-.045-.41,p.hl-.065-.85,0)
        if not tub:
            tub=p.wall('bathtub','front',p.hw-.93,width=.82,depth=1.7) if p.w>=3.6 else None
        if not tub:p.missing('bathtub','A bathtub cannot fit while preserving the shower, basin, toilet and entrance.')
    # This is wall-mounted, with an explicit mount height rather than a floating cupboard.
    p.wall_search('towelRack',('left','right'),preferred=-p.hl+.42)
    if plants and p.w*p.l>=11:p.wall_search('plant',('left','front'),preferred=p.hw-.35)


def dining(plan,requested,plants,rugs):
    p=plan
    # Table stays full height; compact rooms change top dimensions, never chair scale.
    if p.w<2.5 or p.l<2.6:
        table_w=min(1.20,p.l-.80);table_d=max(.52,min(.68,p.w-1.28))
        table=p.add('diningTable',0,-.30,math.pi/2,width=table_w,depth=table_d,group='dining-set')
        if table:
            offset=table_d/2+.57/2+.05
            for sign in (-1,1):p.add('diningChair',sign*offset,-.30,math.pi/2 if sign<0 else 3*math.pi/2,group='dining-set')
        if plants and p.w*p.l>6:p.wall_search('plant',('back','left'),preferred=-p.hw+.3)
        return
    table_w=min(1.8,max(1.0,p.w-1.40))
    table_d=min(.95,max(.55,p.l-1.42))
    table_z=-.30 if p.l<3.5 else -.08
    table=p.add('diningTable',0,table_z,width=table_w,depth=table_d,group='dining-set')
    if not table:return
    seat_gap=.08
    side_z=table_d/2+.57/2+seat_gap
    count=2 if table_w>=1.45 else 1
    xs=[-.45,.45] if count==2 else [0]
    for x in xs:
        p.add('diningChair',x,table['z']-side_z,0,group='dining-set')
        p.add('diningChair',x,table['z']+side_z,math.pi,group='dining-set')
    if p.w>=3.6 and p.l>=3.2:
        for sign in (-1,1):
            p.add('diningChair',sign*(table_w/2+.57/2+seat_gap),table['z'],math.pi/2 if sign<0 else 3*math.pi/2,group='dining-set')
    if p.w>=3.4 or p.l>=3.8:p.wall_search('sideboard',('back','left','right'))
    if rugs and p.w>=3.5 and p.l>=3.3:p.add('rug',0,-.08,width=2.7,depth=2.3)
    if plants:p.wall_search('plant',('left','right'),preferred=p.hl-.38)


def bedroom(plan,requested,plants,rugs):
    p=plan
    narrow=p.w<2.8 or p.w*p.l<7
    bed_w=1.0 if narrow else 1.9
    bed_x=-p.hw+bed_w/2+.05 if narrow else 0
    bed=p.wall('bed','back',bed_x,width=bed_w,depth=min(2.1,p.l-.14))
    if bed:
        for sign in (-1,1):p.wall('sideTable','back',bed['x']+sign*(bed_w/2+.33))
    else:p.missing('bed','A standard bed does not fit the selected room dimensions.')
    # Explicit study requests take precedence over optional storage/decorations.
    if 'desk' in requested:
        desk=p.wall_search('desk',('right','left','front'),preferred=p.hl-1.,width=min(1.3,max(.85,p.l-2.2)))
        if desk:
            distance=dimensions(desk)[1]/2+.40
            seat=p.add('officeChair',desk['x']+math.sin(desk['rot'])*distance,desk['z']+math.cos(desk['rot'])*distance,desk['rot']+math.pi,group='study-set')
            if not seat:p.missing('officeChair','The desk fits, but its task chair needs more clear floor space.')
        else:p.missing('desk','No study position fits beside the bed while keeping the entrance clear. Try a larger room or add a smaller desk manually.')
    if not p.wall_search('wardrobe',('left','right','front'),preferred=-p.hl+1.):p.missing('wardrobe','Requested study space takes priority over additional storage.')
    if p.w>=3.4 and p.l>=3.6 and p.style not in ('Minimal','Compact'):p.wall_search('dresser',('right','front','left'),preferred=0)
    if rugs:p.add('rug',0,.5,width=min(2.5,p.w-.25),depth=min(1.5,p.l-.25))
    if plants:p.wall_search('plant',('left','right'),preferred=p.hl-.35)


def living(plan,requested,plants,rugs):
    p=plan
    group='lounge-set'
    sofa_w=min(2.3,p.w-.14);sofa_d=.85 if p.l<3.4 else 1.
    # One viewing axis and one seating zone. Never search an unrelated wall
    # for the television, or push the seating to the far end of a large room.
    tv_front=-p.hl+WALL_GAP+.5
    sofa_limit=p.hl-.64-sofa_d/2
    available=sofa_limit-sofa_d/2-tv_front
    if available<.72:
        sofa=p.wall('sofa','back',0,width=sofa_w,depth=sofa_d,group=group)
        p.missing('tvUnit','A facing TV and sofa cannot fit while keeping the entrance clear. Increase the room length for a proper viewing zone.')
        if sofa and p.l>=2.4:p.add('table',0,sofa['z']+sofa_d/2+.42,width=.72,depth=.44,group=group)
        return
    tv=p.wall('tvUnit','back',0,width=min(1.8,p.w-.14),group=group)
    viewing_gap=min(2.35,available)
    sofa_z=tv_front+viewing_gap+sofa_d/2
    sofa=p.add('sofa',0,sofa_z,math.pi,width=sofa_w,depth=sofa_d,group=group)
    if not sofa:
        p.missing('sofa','The viewing zone could not fit while keeping the entrance clear.')
        return
    table_d=.8 if viewing_gap>=1.75 else .44
    table_w=min(1.2,sofa_w*.60)
    gap=.38 if viewing_gap>=1.75 else .22
    table_z=sofa_z-sofa_d/2-gap-table_d/2
    table=p.add('table',0,table_z,width=table_w,depth=table_d,group=group)
    if not tv:p.missing('tvUnit','No TV position fits on the viewing axis.')
    if table and p.w>=3.6 and viewing_gap>=1.5:
        for sign in (-1,1):
            kind='ottoman' if sign<0 and p.style in ('Cozy','Bohemian') else 'chair'
            seat_x=sign*max(sofa_w/2+.45,table_w/2+.75)
            seat_z=table_z+.12
            p.add(kind,seat_x,seat_z,math.atan2(-seat_x,table_z-seat_z),group=group)
    if p.w>=3.5:
        p.add('sideTable',sofa_w/2+.36,sofa_z-.10,group=group)
        if p.style not in ('Minimal','Compact') or 'floorLamp' in requested:
            p.add('floorLamp',-sofa_w/2-.36,sofa_z+.05,group=group)
    if rugs and table:
        p.add('rug',0,table_z+.35,width=min(sofa_w+.65,p.w-.16),depth=min(2.05,p.l-.16),group=group)
    if 'bookshelf' in requested:p.wall_search('bookshelf',('left','right'),preferred=-p.hl+.6)
    if plants:p.wall_search('plant',('left','right'),preferred=max(-p.hl+.4,sofa_z+.8))


def office(plan,requested,plants,rugs):
    p=plan
    desk=p.wall('desk','back',0,width=min(1.3,p.w-.15))
    if desk:p.add('officeChair',desk['x'],desk['z']+.89,math.pi,group='desk-set')
    p.wall_search('bookshelf',('left','right'),preferred=-p.hl+.6)
    if plants:p.wall_search('plant',('left','right'),preferred=p.hl-.35)
    if rugs and p.w>=3:p.add('rug',0,.3,width=min(2.5,p.w-.2),depth=1.4)


def decorate(p,requested):
    if p.room=='Kitchen':
        # A real extractor is already above the hob; add a high wall vent.
        p.wall_search('kitchenVent',('left','right','back'),preferred=-p.hl+.55)
        if p.style not in ('Minimal','Compact'):
            p.wall_search('wallShelf',('left','right'),preferred=-p.hl+1.3)
    elif p.room=='Bathroom':
        if p.w*p.l>=8 or 'bathroomCabinet' in requested:
            p.wall_search('bathroomCabinet',('right','back'),preferred=.4)
        if p.style not in ('Minimal','Compact'):
            p.wall_search('wallSconce',('left','right'),preferred=0)
    else:
        if p.style not in ('Minimal','Compact') or 'wallArt' in requested:
            p.wall_search('wallArt',('back','left','right'),preferred=0)
        if p.room in ('Dining Room','Home Office') and p.w*p.l>=9:
            p.wall_search('wallSconce',('left','right'),preferred=.7)
    if p.room in ('Bedroom','Living Room') and p.style not in ('Minimal','Compact'):
        if not any(i['type']=='floorLamp' for i in p.items):p.wall_search('floorLamp',('left','right'),preferred=-p.hl+.45)
    for kind in ('wallArt','wallSconce','wallShelf','kitchenVent','bathroomCabinet'):
        if kind in requested and not any(i['type']==kind for i in p.items):
            if not p.wall_search(kind):p.missing(kind,'No free wall space at its mounting height.')


def kitchen_family(items):
    groups={i.get('groupId') for i in items}
    return 'Island' if 'island' in groups else 'L-shaped' if 'kitchen-return' in groups else 'Galley' if 'kitchen-galley' in groups else 'Single-wall'


def make_plan(width,length,room,style='Modern',requested=(),plants=False,rugs=False,variant=0):
    # Rotate an entire valid arrangement, including the door and every fixture.
    # Independent random rotations would destroy the furniture's relationships.
    angle=[0,math.pi/2,math.pi,3*math.pi/2][variant%4]
    local_w,local_l=(length,width) if variant%2 else (width,length)
    p=Plan(local_w,local_l,room,style)
    functions={'Kitchen':kitchen,'Bathroom':bathroom,'Dining Room':dining,'Bedroom':bedroom,'Living Room':living,'Home Office':office}
    if room=='Kitchen':kitchen(p,requested,plants,variant%4)
    elif room=='Bathroom':bathroom(p,requested,plants)
    else:functions[room](p,requested,plants,rugs)
    decorate(p,requested)
    for item in p.items:
        x,z=item['x'],item['z'];item['x']=x*math.cos(angle)+z*math.sin(angle);item['z']=-x*math.sin(angle)+z*math.cos(angle)
        item['rot']=(item['rot']+angle)%TAU
    return p.items,p.omitted,['front','right','back','left'][variant%4]
