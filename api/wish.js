import {live,r,pipe,clean} from './kv.js';
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST')return res.status(405).end();
  if(!live)return res.status(503).json({error:'no-kv'});
  const b=req.body||{};
  // TODO(toss): b.paymentKey + b.orderId + b.amt 를 토스 승인 API로 검증한 뒤 아래 진행
  const n=await r(['INCR','space:wishes']);
  const amt=Math.max(0,Math.min(9999999,Number(b.amt)||0));
  await r(['INCRBY','space:revenue',amt]);
  const pub=clean(b.pub);
  if(pub){const id='w'+n;await pipe([
    ['HSET','space:w:'+id,'line',pub,'n',0,'t',Date.now(),'amt',amt],
    ['LPUSH','space:feed',id],['LTRIM','space:feed',0,199]]);}
  res.status(200).json({idx:Number(n)-1,wishes:Number(n)});
}
