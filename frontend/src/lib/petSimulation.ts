import type {FurnitureItem,LayoutSolution,PetInstance,PetKind} from '../types/layout'
import {furnitureCatalog} from '../three/catalog'
import {PetNavigation,PET_RADIUS,type Point,type Occupant,type PetPose} from './petNavigation'
import {livePetPose,rememberPetPose} from './petRuntime'
export type PetMode='idle'|'walking'|'sniffing'|'resting'
export type PetMotion={speed:number;phase:number;time:number;mode:PetMode}
export type PetAgent=PetPose&PetMotion&{pet:PetInstance;path:Point[];wait:number;blocked:number;arrival:PetMode;oneShot:boolean;random:()=>number}
function generator(id:string){let n=2166136261;for(const c of id)n=Math.imul(n^c.charCodeAt(0),16777619);return()=>{n=(Math.imul(1664525,n)+1013904223)>>>0;return n/4294967296}}
export class PetWorld{
 readonly agents=new Map<string,PetAgent>();readonly navigation=new Map<PetKind,PetNavigation>()
 readonly layoutId:string;readonly room:LayoutSolution['room'];readonly items:FurnitureItem[]
 constructor(layoutId:string,room:LayoutSolution['room'],items:FurnitureItem[],pets:PetInstance[]){
  this.layoutId=layoutId;this.room=room;this.items=items
  for(const pet of pets){
   if(!this.navigation.has(pet.kind))this.navigation.set(pet.kind,new PetNavigation(room,items,PET_RADIUS[pet.kind]))
   const p=this.nav(pet.kind).nearest(livePetPose(layoutId,pet),this.occupants());if(!p)continue
   const random=generator(pet.id),pose=livePetPose(layoutId,pet)
   const agent:PetAgent={...p,rotationY:pose.rotationY,pet,path:[],wait:1+random()*2.5,blocked:0,arrival:'idle',oneShot:false,random,speed:0,phase:0,time:random()*10,mode:'idle'}
   this.agents.set(pet.id,agent);rememberPetPose(layoutId,pet,agent)
  }
 }
 nav(kind:PetKind){return this.navigation.get(kind)!}
 occupants(except?:string):Occupant[]{return [...this.agents.values()].filter(a=>a.pet.id!==except).map(a=>({id:a.pet.id,x:a.x,z:a.z,radius:PET_RADIUS[a.pet.kind]}))}
 place(id:string,point:Point){const a=this.agents.get(id);if(!a)return null;const p=this.nav(a.pet.kind).nearest(point,this.occupants(id));if(!p)return null;Object.assign(a,p,{path:[],mode:'idle',wait:2.5,blocked:0,speed:0,oneShot:false});rememberPetPose(this.layoutId,a.pet,a);return {x:a.x,z:a.z,rotationY:a.rotationY}}
 sendTo(id:string,target:Point){const a=this.agents.get(id);if(!a)return false;const path=this.nav(a.pet.kind).route(a,target,this.occupants(id));if(!path.length)return false;a.path=path;a.mode='walking';a.arrival='idle';a.blocked=0;a.oneShot=true;return true}
 choose(a:PetAgent){
  const nav=this.nav(a.pet.kind),others=this.occupants(a.pet.id)
  const accessories=this.items.filter(it=>['petBed','petBowls','catTree','scratchingPost','petToyBasket'].includes(it.type)&&((a.pet.kind==='cat')||!['catTree','scratchingPost'].includes(it.type)))
  for(let attempt=0;attempt<12;attempt++){
   let goal:Point,arrival:PetMode='idle'
   if(accessories.length&&a.random()<.5){
    const item=accessories[Math.floor(a.random()*accessories.length)],size=furnitureCatalog[item.type].targetSizeM
    const offset=(item.depthM??size.z)*item.scale/2+PET_RADIUS[a.pet.kind]+.10
    goal={x:item.x+Math.sin(item.rotationY)*offset,z:item.z+Math.cos(item.rotationY)*offset}
    arrival=item.type==='petBed'?'resting':'sniffing'
   }else goal={x:(a.random()-.5)*(this.room.widthM-.7),z:(a.random()-.5)*(this.room.lengthM-.7)}
   if(Math.hypot(goal.x-a.x,goal.z-a.z)<.5)continue
   const path=nav.route(a,goal,others)
   if(path.length&&Math.hypot(path.at(-1)!.x-a.x,path.at(-1)!.z-a.z)>.35){a.path=path;a.arrival=arrival;a.mode='walking';a.blocked=0;return}
  }
  a.wait=2+a.random()*3;a.mode='idle';a.path=[]
 }
 step(delta:number,paused=false){
  const dt=Math.min(.05,Math.max(0,delta));if(!dt)return
  for(const a of this.agents.values()){
   a.time+=dt;a.speed=0
   if(paused)continue
   if(!a.pet.roaming&&!a.oneShot){a.mode='idle';a.path=[];continue}
   if(!a.path.length){a.wait-=dt;if(a.wait<=0)this.choose(a);continue}
   const goal=a.path[0],dx=goal.x-a.x,dz=goal.z-a.z,d=Math.hypot(dx,dz)
   if(d<.025){a.path.shift();if(!a.path.length){a.mode=a.arrival;a.wait=a.mode==='resting'?6+a.random()*6:2+a.random()*3;a.oneShot=false}continue}
   const desired=Math.atan2(dx,dz),difference=Math.atan2(Math.sin(desired-a.rotationY),Math.cos(desired-a.rotationY));a.rotationY+=Math.max(-dt*4,Math.min(dt*4,difference))
   const speed=(a.pet.kind==='cat'?.28:.34)*Math.max(.22,Math.cos(difference)),move=Math.min(d,speed*dt),p={x:a.x+dx/d*move,z:a.z+dz/d*move}
   if(this.nav(a.pet.kind).segment(a,p,this.occupants(a.pet.id))){a.x=p.x;a.z=p.z;a.speed=speed;a.phase+=move*19;a.blocked=0;a.mode='walking'}
   else{
    a.blocked+=dt
    if(a.blocked>.65){const path=this.nav(a.pet.kind).route(a,a.path.at(-1)!,this.occupants(a.pet.id));a.path=path;a.blocked=0;if(!path.length){a.mode='idle';a.wait=1+a.random()*2;a.oneShot=false}}
   }
   rememberPetPose(this.layoutId,a.pet,a)
  }
 }
}
