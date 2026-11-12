import {live,r,pipe} from './kv.js';
export default async function handler(req,res){
  res.setHeader('Cache-Control','public, max-age=20');
  if(!live)return res.status(200).json({items:[]});
  const ids=await r(['LRANGE','space:feed',0,199]);
  if(!ids||!ids.length)return res.status(200).json({items:[]});
  const rows=await pipe(ids.map(id=>['HMGET','space:w:'+id,'line','n','hidden','amt','nm']));
  const all=[];ids.forEach((id,i)=>{const [line,n,hidden,amt,nm]=rows[i]||[];if(line&&!hidden)all.push({id,line,n:Number(n)||0,amt:Number(amt)||0,nm:nm||''});});
  // 자막(ticker): 🙏 많은 순 8 + 큰 별 순 5, 중복 제거
  const byN=[...all].sort((a,b)=>b.n-a.n).slice(0,8),byA=[...all].sort((a,b)=>b.amt-a.amt).slice(0,5);
  const seen={},ticker=[];[...byN,...byA].forEach(x=>{if(!seen[x.id]){seen[x.id]=1;ticker.push(x);}});
  const items=all.slice(0,60).map(x=>({id:x.id,line:x.line,n:x.n}));
  // 최신 20 + 랜덤 20 섞기 → 오래된 소원도 계속 돈다
  const recent=items.slice(0,20),rest=items.slice(20).sort(()=>Math.random()-.5).slice(0,20);
  res.status(200).json({items:[...recent,...rest],ticker});
}
