// 관리자 API. 환경변수 ADMIN_KEY 필요. 헤더 x-admin 으로 전달.
import {live,r,pipe,clean} from './kv.js';
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  const KEY=process.env.ADMIN_KEY;
  if(!KEY||req.headers['x-admin']!==KEY)return res.status(401).json({err:'no'});
  if(!live)return res.status(503).json({err:'no-kv'});
  const b=req.method==='POST'?(req.body||{}):{};
  const act=req.method==='GET'?'list':String(b.act||'');

  if(act==='list'){
    const [here,total,wishes,revenue,ids]=await pipe([['ZCARD','space:here'],['GET','space:total'],['GET','space:wishes'],['GET','space:revenue'],['LRANGE','space:feed',0,199]]);
    const rows=ids&&ids.length?await pipe(ids.map(id=>['HMGET','space:w:'+id,'line','n','hidden','amt','nm','t','rep'])):[];
    const items=(ids||[]).map((id,i)=>{const [line,n,hidden,amt,nm,t,rep]=rows[i]||[];return {id,line,n:Number(n)||0,hidden:!!hidden,amt:Number(amt)||0,nm:nm||'',t:Number(t)||0,rep:Number(rep)||0};});
    return res.status(200).json({here:Number(here)||0,total:Number(total)||0,wishes:Number(wishes)||0,revenue:Number(revenue)||0,items});}

  if(act==='add'){ // 관리자가 직접 띄우는 소원(실제 별로 등록, 매출엔 안 잡힘)
    const line=clean(b.line);if(!line)return res.status(400).json({err:'bad-line'});
    const amt=Math.max(0,Math.min(9999999,Number(b.amt)||0));
    const nm=String(b.nm||'').replace(/[<>"'&]/g,'').slice(0,6);
    const n=await r(['INCR','space:wishes']);const id='w'+n;
    await pipe([['HSET','space:w:'+id,'line',line,'n',0,'t',Date.now(),'amt',amt,'nm',nm,'admin',1],['LPUSH','space:feed',id],['LTRIM','space:feed',0,199]]);
    return res.status(200).json({ok:1,id,idx:Number(n)-1});}

  if(act==='hide'||act==='show'){
    const id=String(b.id||'');if(!/^w\d+$/.test(id))return res.status(400).json({});
    if(act==='hide')await r(['HSET','space:w:'+id,'hidden',1]);else await pipe([['HDEL','space:w:'+id,'hidden'],['HSET','space:w:'+id,'rep',0]]);
    return res.status(200).json({ok:1});}

  if(act==='edit'){
    const id=String(b.id||'');if(!/^w\d+$/.test(id))return res.status(400).json({});
    const line=clean(b.line);if(!line)return res.status(400).json({err:'bad-line'});
    await r(['HSET','space:w:'+id,'line',line]);return res.status(200).json({ok:1});}

  if(act==='del'){
    const id=String(b.id||'');if(!/^w\d+$/.test(id))return res.status(400).json({});
    await pipe([['DEL','space:w:'+id],['DEL','space:p:'+id],['LREM','space:feed',0,id]]);return res.status(200).json({ok:1});}

  return res.status(400).json({err:'unknown'});
}
