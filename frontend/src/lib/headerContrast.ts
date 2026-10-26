/** Luminance of the actual rendered backdrop, not a style-name guess. */
const linear=(n:number)=>{const v=n/255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4)}
export function surfaceIsDark(hex:string){const s=/^#[0-9a-f]{6}$/i.test(hex)?hex:'#f2ede8';return .2126*linear(parseInt(s.slice(1,3),16))+.7152*linear(parseInt(s.slice(3,5),16))+.0722*linear(parseInt(s.slice(5,7),16))<.20}
export function backdropIsDark(pixels:ArrayLike<number>,previous:boolean|null=null){
 let light=0,count=0
 for(let i=0;i+3<pixels.length;i+=4){if(pixels[i+3]<240)continue;light+=.2126*linear(pixels[i])+.7152*linear(pixels[i+1])+.0722*linear(pixels[i+2]);count++}
 if(!count)return previous
 const average=light/count
 const threshold=previous===null?0.20:previous?0.23:0.17
 return average<threshold
}
