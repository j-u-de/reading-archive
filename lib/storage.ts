export type ProgressEntry={date:string;page?:number;chapter?:string};
export type StoredBook={id:string;title:string;author:string;status:'WANT_TO_READ'|'READING'|'FINISHED'|'PAUSED';page?:number;chapter?:string;startedAt?:string;finishedAt?:string;logs?:ProgressEntry[]};
export function readBooks():StoredBook[]{if(typeof window==='undefined')return[];try{return JSON.parse(localStorage.getItem('books')||'[]')}catch{return[]}}
export function writeBooks(books:StoredBook[]){if(typeof window!=='undefined')localStorage.setItem('books',JSON.stringify(books))}
export function durationDays(start?:string,end?:string){if(!start||!end)return null;const a=new Date(start),b=new Date(end);return Math.max(1,Math.floor((b.getTime()-a.getTime())/86400000)+1)}
