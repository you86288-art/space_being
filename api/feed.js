import {live,r,pipe} from './_kv.js';
export default async function handler(req,res){
  res.setHeader('Cache-Control','public, max-age=20');
  if(!live)return res.status(200).json({items:[]});
  const ids=await r(['LRANGE','space:feed',0,59]);
  if(!ids||!ids.length)return res.status(200).json({items:[]});
  const rows=await pipe(ids.map(id=>['HMGET','space:w:'+id,'line','n','hidden']));
  const items=[];ids.forEach((id,i)=>{const [line,n,hidden]=rows[i]||[];if(line&&!hidden)items.push({id,line,n:Number(n)||0});});
  // 최신 20 + 랜덤 20 섞기 → 오래된 소원도 계속 돈다
  const recent=items.slice(0,20),rest=items.slice(20).sort(()=>Math.random()-.5).slice(0,20);
  res.status(200).json({items:[...recent,...rest]});
}
