import {live,r,pipe,clean} from './kv.js';
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST')return res.status(405).end();
  if(!live)return res.status(503).json({error:'no-kv'});
  const b=req.body||{};
  // TODO(toss): b.paymentKey + b.orderId + b.amt 를 토스 승인 API로 검증한 뒤 아래 진행
  const n=await r(['INCR','space:wishes']);
  // 띄워보기(무료)는 서버에 오지 않는다. 오면 거부.
  if(b.free)return res.status(400).json({err:'free_is_local'});
  const free=0;const amt=Math.max(0,Math.min(9999999,Number(b.amt)||0));
  const nm=String(b.name||'').replace(/[<>"'&]/g,'').slice(0,6);
  await r(['INCRBY','space:revenue',amt]);
  const pub=clean(b.pub);
  if(pub){const id='w'+n;await pipe([
    ['HSET','space:w:'+id,'line',pub,'n',0,'t',Date.now(),'amt',amt,'nm',nm],
    ['LPUSH','space:feed',id],['LTRIM','space:feed',0,199]]);
}
  res.status(200).json({idx:Number(n)-1,wishes:Number(n)});
}
