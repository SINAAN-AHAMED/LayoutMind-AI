import {DoorModel} from './DoorModel'
import type {DoorOptions} from '../lib/doorDesign'
import {useEffect,useMemo,useRef} from 'react'
import {useFrame} from '@react-three/fiber'
import * as THREE from 'three'
import type {RoomType,StyleChip} from '../types/layout'
import {useStudioStore} from '../store/useStudioStore'
import {designThemes} from '../lib/designThemes'
import {seededRandom} from '../lib/seededRandom'
export type StyleSliders=Record<StyleChip,number>
type WallSide='back'|'front'|'left'|'right'
function shade(hex:string,n:number){const c=new THREE.Color(hex);c.multiplyScalar(n);return `#${c.getHexString()}`}

/** Tile colors and pattern are baked into one deterministic, disposable texture. */
function useSurfaceTexture(material:string,color:string,grout:string,pattern:string,size:number,width:number,height:number){
 const texture=useMemo(()=>{
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=pattern==='Hexagon'&&(material==='Tile'||material==='Ceramic')?296:512
  const c=canvas.getContext('2d');if(!c)return null
  const fill=(x:number,y:number,w:number,h:number,tint=1)=>{c.fillStyle=shade(color,tint);c.fillRect(x,y,w,h)}
  c.fillStyle=grout;c.fillRect(0,0,512,512)
  const tile=material==='Tile'||material==='Ceramic'||material==='Brick'
  if(tile){
   if(material==='Brick'||pattern==='Subway'){
    for(let r=0;r<4;r++)for(let col=-1;col<3;col++)fill(col*256+(r%2)*128+2,r*128+2,252,124,.97+seededRandom(r*11+col)*.06)
   }else if(pattern==='Hexagon'){
    const r=512/3
    for(let row=-1;row<6;row++)for(let col=-1;col<5;col++){
     const x=col*r*1.5,y=row*r*Math.sqrt(3)+(col%2)*r*Math.sqrt(3)/2
     c.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3;const px=x+(r-2)*Math.cos(a),py=y+(r-2)*Math.sin(a);if(i===0)c.moveTo(px,py);else c.lineTo(px,py)}c.closePath();c.fillStyle=shade(color,.97+seededRandom(row*17+col)*.05);c.fill()
    }
   }else if(pattern==='Herringbone'){
    for(let row=-2;row<10;row++)for(let col=-2;col<10;col++){
     const phase=((col-row)%4+4)%4
     if(phase===0)fill(col*64+2,row*64+2,124,60,.94+seededRandom(col*31+row)*.12)
     if(phase===3)fill(col*64+2,row*64+2,60,124,.94+seededRandom(col*31+row)*.12)
    }
   }else{
    fill(2,2,508,508)
   }
  }else if(material==='Wood'||material==='Parquet'){
   fill(0,0,512,512)
   if(material==='Parquet'){
    for(let row=-2;row<10;row++)for(let col=-2;col<10;col++){
     const phase=((col-row)%4+4)%4
     if(phase===0)fill(col*64+1,row*64+1,126,62,.83+seededRandom(col*31+row)*.30)
     if(phase===3)fill(col*64+1,row*64+1,62,126,.83+seededRandom(col*31+row)*.30)
    }
   }else{
    for(let x=0;x<512;x+=64){fill(x+1,0,62,512,.85+seededRandom(x)*.25);c.strokeStyle=shade(color,.7);c.lineWidth=1;c.beginPath();c.moveTo(x,(x*7)%512);c.lineTo(x+64,(x*7)%512);c.stroke()}
    for(let i=0;i<160;i++){const x=seededRandom(i*9)*512;c.strokeStyle=`rgba(45,31,17,${.02+seededRandom(i)*.06})`;c.beginPath();c.moveTo(x,0);c.bezierCurveTo(x+6,130,x-8,350,x+2,512);c.stroke()}
   }
  }else{
   fill(0,0,512,512)
   if(material==='Marble'||material==='Stone'||material==='Granite'){
    for(let i=0;i<(material==='Granite'?700:14);i++){
     if(material==='Granite'){c.fillStyle=shade(color,.75+seededRandom(i*5)*.55);c.fillRect(seededRandom(i)*512,seededRandom(i*3)*512,2,2);continue}
     c.strokeStyle=`rgba(80,77,65,${.06+seededRandom(i)*.13})`;c.lineWidth=.5+seededRandom(i*7)*2;c.beginPath();const y=seededRandom(i*11)*680-80;c.moveTo(-20,y);c.bezierCurveTo(160,y-80,310,y+120,540,y+50);c.stroke()
    }
   }else if(material==='Terrazzo'){
    for(let i=0;i<650;i++){c.fillStyle=['#9a9d8a','#b8a386','#e8e1d0','#76887d'][i%4];const x=seededRandom(i*7)*512,y=seededRandom(i*9)*512;c.beginPath();c.ellipse(x,y,2+seededRandom(i)*4,1+seededRandom(i*3)*3,i,0,Math.PI*2);c.fill()}
   }else if(material==='Fluted'||material==='Panel'){
    const step=material==='Fluted'?14:128
    for(let x=0;x<512;x+=step){const g=c.createLinearGradient(x,0,x+step,0);g.addColorStop(0,shade(color,.72));g.addColorStop(.4,color);g.addColorStop(1,shade(color,1.08));c.fillStyle=g;c.fillRect(x+1,0,step-2,512)}
   }else if(material==='Wallpaper'){
    c.strokeStyle=shade(color,.87);c.lineWidth=1
    for(let x=-128;x<640;x+=64)for(let y=-128;y<640;y+=64){c.beginPath();c.ellipse(x,y,20,30,(x+y)%2,0,Math.PI*2);c.stroke()}
   }else{
    const count=material==='Carpet'||material==='Fabric'?6000:1600
    for(let i=0;i<count;i++){c.fillStyle=`rgba(${i%2?'255,255,255':'46,43,33'},${material==='Concrete'?.07:.035})`;c.fillRect(seededRandom(i*17)*512,seededRandom(i*23)*512,1.5,1.5)}
   }
  }
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.wrapS=tex.wrapT=THREE.RepeatWrapping
  const repeat=tile?size:material==='Wood'||material==='Parquet'?2:material==='Fluted'?1.4:2.5
  tex.repeat.set(width/repeat,height/(repeat*canvas.height/canvas.width));if((tile&&pattern==='Herringbone')||material==='Parquet'){tex.center.set(.5,.5);tex.rotation=Math.PI/4}tex.anisotropy=4;return tex
 },[material,color,grout,pattern,size,width,height])
 useEffect(()=>()=>texture?.dispose(),[texture])
 return texture
}
function SurfacePanel({x,y,w,h,length,height,texture,color,roughness,name}:{x:number;y:number;w:number;h:number;length:number;height:number;texture:THREE.Texture|null;color:string;roughness:number;name:string}){
 const geometry=useMemo(()=>{const g=new THREE.PlaneGeometry(w,h),uv=g.getAttribute('uv');for(let i=0;i<uv.count;i++)uv.setXY(i,(x-w/2+uv.getX(i)*w+length/2)/length,(y-h/2+uv.getY(i)*h)/height);return g},[x,y,w,h,length,height])
 useEffect(()=>()=>geometry.dispose(),[geometry])
 return <mesh name={name} position={[x,y,0]} geometry={geometry} receiveShadow castShadow><meshStandardMaterial map={texture} color={texture?'#ffffff':color} roughness={roughness} side={THREE.DoubleSide}/></mesh>
}
function Wall({side,length,height,offset,color,material,door,grout,pattern,tileSize,treatment='none',style='Modern',roomType,doorOptions}:{roomType:RoomType;doorOptions?:DoorOptions;treatment?:'bath'|'kitchen'|'none';style?:StyleChip;side:WallSide;length:number;height:number;offset:number;color:string;material:string;door:boolean;grout:string;pattern:string;tileSize:number}){
 const group=useRef<THREE.Group>(null),wallView=useStudioStore(s=>s.wallView),topView=useStudioStore(s=>s.topView)
 const texture=useSurfaceTexture(material,color,grout,pattern,tileSize,length,height)
 const bandLow=treatment==='kitchen'?.94:0,bandHigh=treatment==='kitchen'?1.62:style==='Luxury'?2.12:1.35
 const accent=useSurfaceTexture(treatment==='bath'&&style==='Luxury'?'Stone':'Ceramic',style==='Industrial'?'#8b958a':style==='Coastal'?'#b5ccc6':style==='Luxury'?'#d5c8b4':'#e5e4db',grout,treatment==='kitchen'?'Subway':pattern,tileSize,length,height)
 const upper=useSurfaceTexture('Plaster',color,grout,pattern,tileSize,length,height)
 const orientations={back:{at:[0,0,-offset] as [number,number,number],r:0,n:new THREE.Vector3(0,0,-1)},front:{at:[0,0,offset] as [number,number,number],r:Math.PI,n:new THREE.Vector3(0,0,1)},left:{at:[-offset,0,0] as [number,number,number],r:Math.PI/2,n:new THREE.Vector3(-1,0,0)},right:{at:[offset,0,0] as [number,number,number],r:-Math.PI/2,n:new THREE.Vector3(1,0,0)}}
 const o=orientations[side]
 useFrame(({camera})=>{if(group.current)group.current.visible=wallView==='full'||(!topView&&camera.position.dot(o.n)<offset)})
 const doorH=Math.min(2.12,height-.04)
 const panel=(x:number,y:number,w:number,h:number,key:string)=>{
  const cuts=treatment==='none'?[y-h/2,y+h/2]:[y-h/2,...[bandLow,bandHigh].filter(v=>v>y-h/2&&v<y+h/2),y+h/2]
  return <group key={key}>{cuts.slice(0,-1).map((low,i)=>{const high=cuts[i+1],middle=(low+high)/2,band=treatment!=='none'&&middle>=bandLow&&middle<=bandHigh;return <SurfacePanel key={i} name={band?'wall-wet-zone':'wall-finish'} x={x} y={middle} w={w} h={high-low} length={length} height={height} texture={band?accent:treatment==='bath'?upper:texture} color={color} roughness={band?.25:.86}/>})}</group>
 }
 return <group name={`wall-${side}`} ref={group} position={o.at} rotation={[0,o.r,0]}>
  {door?<>{panel(-(length+.84)/4,height/2,(length-.84)/2,height,'a')}{panel((length+.84)/4,height/2,(length-.84)/2,height,'b')}{panel(0,doorH+(height-doorH)/2,.84,height-doorH,'c')}
   <DoorModel height={doorH} roomType={roomType} style={style} options={doorOptions}/>
  </>:panel(0,height/2,length,height,'wall')}
 </group>
}
export function Room({lengthM,widthM,wallH=3.2,styleSliders,roomType='Living Room',doorWall='front',doorOptions}:{doorOptions?:DoorOptions;lengthM:number;widthM:number;wallH?:number;styleSliders?:StyleSliders;roomType?:RoomType;doorWall?:WallSide}){
 const s=useStudioStore(),style=(Object.entries(styleSliders??{Modern:1}).sort((a,b)=>b[1]-a[1])[0]?.[0]??'Modern') as StyleChip,palette=designThemes[style]
 const floorColor=s.floorColor||(s.floorMaterial==='Wood'||s.floorMaterial==='Parquet'?palette.wood:palette.floor)
 const texture=useSurfaceTexture(s.floorMaterial,floorColor,s.groutColor,s.tilePattern,s.tileSize,widthM,lengthM)
 const wallColor=s.wallColor==='#f5f5f4'?palette.wall:s.wallColor
 const roughness={Wood:.58,Parquet:.54,Tile:.25,Marble:.18,Granite:.3,Epoxy:.2,Carpet:1,Concrete:.88,Terrazzo:.46}[s.floorMaterial]
 return <group name={`room-${roomType}`}>
  <mesh name="floor-base" position={[0,-.075,0]} receiveShadow><boxGeometry args={[widthM,.15,lengthM]}/><meshStandardMaterial color={shade(floorColor,.70)} roughness={.8}/></mesh>
  <mesh name="floor-surface" rotation={[-Math.PI/2,0,0]} position={[0,.002,0]} receiveShadow><planeGeometry args={[widthM,lengthM]}/><meshStandardMaterial map={texture} color={texture?'#ffffff':floorColor} roughness={roughness} metalness={.015}/></mesh>
  {(['back','front','left','right'] as WallSide[]).map(side=><Wall key={side} roomType={roomType} doorOptions={doorOptions} side={side} length={side==='back'||side==='front'?widthM:lengthM} offset={side==='back'||side==='front'?lengthM/2:widthM/2} height={wallH} style={style} treatment={s.autoSurfaces?(roomType==='Bathroom'?'bath':roomType==='Kitchen'&&side===({front:'back',back:'front',left:'right',right:'left'} as const)[doorWall]?'kitchen':'none'):'none'} color={wallColor} material={s.wallMaterial} door={doorWall===side} grout={s.groutColor} pattern={s.tilePattern} tileSize={s.tileSize}/>)}
 </group>
}
