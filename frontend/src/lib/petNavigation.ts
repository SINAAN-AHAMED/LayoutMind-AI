import type {FurnitureItem,LayoutSolution,PetKind} from '../types/layout'
import {furnitureCatalog} from '../three/catalog'
export type Point={x:number;z:number}
export type PetPose=Point&{rotationY:number}
export type Occupant=Point&{radius:number;id?:string}
export const PET_RADIUS:Record<PetKind,number>={cat:.31,pug:.36}
export const MAX_PETS=4
export type RoomSize=Pick<LayoutSolution['room'],'widthM'|'lengthM'>
type Obstacle=Point&{c:number;s:number;hw:number;hd:number}
/** Circular pet footprints against exact rotated furniture rectangles, at animal height. */
export class PetNavigation{
 readonly step:number;readonly cols:number;readonly rows:number;readonly free:Uint8Array;readonly obstacles:Obstacle[]
 readonly room:RoomSize;readonly items:FurnitureItem[];readonly radius:number
 constructor(room:RoomSize,items:FurnitureItem[],radius:number){
  this.room=room;this.items=items;this.radius=radius
  this.step=Math.max(.14,Math.max(room.widthM,room.lengthM)/160)
  this.cols=Math.max(1,Math.floor(room.widthM/this.step));this.rows=Math.max(1,Math.floor(room.lengthM/this.step))
  this.obstacles=items.filter(it=>it.type!=='rug'&&it.y<.57&&(furnitureCatalog[it.type].collisionHeightM??furnitureCatalog[it.type].targetSizeM.y)*it.scale+it.y>.035).map(it=>({x:it.x,z:it.z,c:Math.cos(it.rotationY),s:Math.sin(it.rotationY),hw:(it.widthM??furnitureCatalog[it.type].targetSizeM.x)*it.scale/2,hd:(it.depthM??furnitureCatalog[it.type].targetSizeM.z)*it.scale/2}))
  this.free=new Uint8Array(this.cols*this.rows)
  for(let i=0;i<this.free.length;i++)this.free[i]=this.clear(this.point(i))?1:0
 }
 point(i:number):Point{return {x:-this.room.widthM/2+(i%this.cols+.5)*this.room.widthM/this.cols,z:-this.room.lengthM/2+(Math.floor(i/this.cols)+.5)*this.room.lengthM/this.rows}}
 index(p:Point){return Math.max(0,Math.min(this.rows-1,Math.floor((p.z+this.room.lengthM/2)/this.room.lengthM*this.rows)))*this.cols+Math.max(0,Math.min(this.cols-1,Math.floor((p.x+this.room.widthM/2)/this.room.widthM*this.cols)))}
 clear(p:Point,others:Occupant[]=[]){
  if(!Number.isFinite(p.x)||!Number.isFinite(p.z)||Math.abs(p.x)+this.radius>this.room.widthM/2-.035||Math.abs(p.z)+this.radius>this.room.lengthM/2-.035)return false
  for(const b of this.obstacles){const dx=p.x-b.x,dz=p.z-b.z,x=dx*b.c-dz*b.s,z=dx*b.s+dz*b.c;if(Math.max(0,Math.abs(x)-b.hw)**2+Math.max(0,Math.abs(z)-b.hd)**2<(this.radius+.025)**2)return false}
  return !others.some(o=>(o.x-p.x)**2+(o.z-p.z)**2<(this.radius+o.radius+.025)**2)
 }
 segment(a:Point,b:Point,others:Occupant[]=[]){const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/(this.step*.4)));for(let i=0;i<=n;i++)if(!this.clear({x:a.x+(b.x-a.x)*i/n,z:a.z+(b.z-a.z)*i/n},others))return false;return true}
 nearest(p:Point,others:Occupant[]=[]):Point|null{
  if(this.clear(p,others))return {...p}
  const start=this.index(p),cx=start%this.cols,cz=Math.floor(start/this.cols)
  for(let ring=0;ring<Math.max(this.cols,this.rows);ring++){
   let best:Point|null=null,distance=Infinity
   for(let z=Math.max(0,cz-ring);z<=Math.min(this.rows-1,cz+ring);z++)for(let x=Math.max(0,cx-ring);x<=Math.min(this.cols-1,cx+ring);x++){
    if(ring&&Math.max(Math.abs(x-cx),Math.abs(z-cz))!==ring)continue
    const i=z*this.cols+x;if(!this.free[i])continue
    const q=this.point(i),d=(q.x-p.x)**2+(q.z-p.z)**2;if(d<distance&&this.clear(q,others)){best=q;distance=d}
   }
   if(best)return best
  }
  return null
 }
 route(from:Point,to:Point,others:Occupant[]=[]):Point[]{
  const start=this.nearest(from,others),goal=this.nearest(to,others);if(!start||!goal)return []
  if(this.segment(start,goal,others))return [goal]
  const anchor=(p:Point)=>{const i=this.index(p),x=i%this.cols,z=Math.floor(i/this.cols);for(let ring=0;ring<6;ring++){let best=-1,d=Infinity;for(let dz=-ring;dz<=ring;dz++)for(let dx=-ring;dx<=ring;dx++){const nx=x+dx,nz=z+dz;if(nx<0||nz<0||nx>=this.cols||nz>=this.rows)continue;const n=nz*this.cols+nx;if(!this.free[n])continue;const q=this.point(n),dist=(q.x-p.x)**2+(q.z-p.z)**2;if(dist<d&&this.segment(p,q,others)){best=n;d=dist}}if(best>=0)return best}return -1}
  const a=anchor(start),b=anchor(goal);if(a<0||b<0)return []
  const scores=new Float64Array(this.free.length).fill(Infinity),parent=new Int32Array(this.free.length).fill(-1),closed=new Uint8Array(this.free.length)
  const heap:{id:number;f:number}[]=[]
  const push=(id:number,f:number)=>{heap.push({id,f});let i=heap.length-1;while(i>0){const p=(i-1)>>1;if(heap[p].f<=f)break;[heap[p],heap[i]]=[heap[i],heap[p]];i=p}}
  const pop=()=>{const first=heap[0],last=heap.pop()!;if(heap.length){heap[0]=last;let i=0;for(;;){const l=i*2+1,r=l+1;let small=i;if(l<heap.length&&heap[l].f<heap[small].f)small=l;if(r<heap.length&&heap[r].f<heap[small].f)small=r;if(small===i)break;[heap[i],heap[small]]=[heap[small],heap[i]];i=small}}return first.id}
  const heuristic=(i:number)=>Math.hypot(i%this.cols-b%this.cols,Math.floor(i/this.cols)-Math.floor(b/this.cols))
  scores[a]=0;push(a,heuristic(a))
  while(heap.length){
   const i=pop();if(closed[i])continue;closed[i]=1
   if(i===b){const path:Point[]=[goal];let at=b;while(at!==a&&at>=0){path.push(this.point(at));at=parent[at]}path.push(this.point(a),start);path.reverse();const smooth:Point[]=[];let cursor=0;while(cursor<path.length-1){let next=path.length-1;while(next>cursor+1&&!this.segment(path[cursor],path[next],others))next--;if(!this.segment(path[cursor],path[next],others))return [];smooth.push(path[next]);cursor=next}return smooth}
   const x=i%this.cols,z=Math.floor(i/this.cols)
   for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){
    if(!dx&&!dz)continue;const nx=x+dx,nz=z+dz;if(nx<0||nz<0||nx>=this.cols||nz>=this.rows)continue
    const ni=nz*this.cols+nx;if(!this.free[ni]||closed[ni])continue
    if(dx&&dz&&(!this.free[z*this.cols+nx]||!this.free[nz*this.cols+x]))continue
    if(!this.segment(this.point(i),this.point(ni),others))continue
    const g=scores[i]+(dx&&dz?Math.SQRT2:1);if(g>=scores[ni])continue;scores[ni]=g;parent[ni]=i;push(ni,g+heuristic(ni))
   }
  }
  return []
 }
}
