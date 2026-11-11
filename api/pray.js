import {live,r,pipe} from './kv.js';
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST')return res.status(405).end();
  if(!live)return res.status(503).json({});
  const {id,u,report}=req.body||{};
  if(!/^w\d+$/.test(String(id)))return res.status(400).json({});
  if(report){const c=await r(['HINCRBY','space:w:'+id,'rep',1]);if(Number(c)>=3)await r(['HSET','space:w:'+id,'hidden',1]);return res.status(200).json({ok:1});}
  const first=await r(['SADD','space:p:'+id,String(u||'').slice(0,40)]);
  let prays=0;
  if(first){const uk='space:pc:'+String(u||'').slice(0,40);const out=await pipe([['HINCRBY','space:w:'+id,'n',1],['EXPIRE','space:p:'+id,60*60*24*400],['INCR',uk],['EXPIRE',uk,60*60*24*400]]);prays=Number(out[2])||0;}
  const n=await r(['HGET','space:w:'+id,'n']);
  res.status(200).json({n:Number(n)||0,prays});
}
