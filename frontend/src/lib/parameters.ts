/** Keep intermediate keystrokes editable; enforce limits on blur or submission. */
export function optionalNumber(value:string){if(!value.trim())return null;const n=Number(value);return Number.isFinite(n)?n:null}
export function boundedNumber(value:number|null|undefined,min:number,max:number){return value===null||value===undefined||!Number.isFinite(value)?null:Math.max(min,Math.min(max,value))}
