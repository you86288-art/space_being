import {live,r,pipe,clean} from './kv.js';
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST')return res.status(405).end();
  if(!live)return res.status(503).json({error:'no-kv'});
  const b=req.body||{};
  // TODO(toss): b.paymentKey + b.orderId + b.amt 를 토스 승인 API로 검증한 뒤 아래 진행
  const n=await r(['INCR','space:wishes']);
  const free=b.free?1:0;const amt=free?0:Math.max(0,Math.min(9999999,Number(b.amt)||0));
  // 무료 별: 서버에서 7🙏 확인 (기도 7회당 1개). 'space:pc:{u}' = 누적 기도 수, 'space:fu:{u}' = 사용한 무료 별 수
  if(free){const u=String(b.u||'').slice(0,40);if(!u)return res.status(400).json({});
    const pc=Number(await r(['GET','space:pc:'+u]))||0;const used=Number(await r(['GET','space:fu:'+u]))||0;
    if(Math.floor(pc/7)-used<1)return res.status(402).json({err:'no_free'});
    await r(['INCR','space:fu:'+u]);}
  await r(['INCRBY','space:revenue',amt]);
  const pub=clean(b.pub);
  if(pub){const id='w'+n;await pipe([
    ['HSET','space:w:'+id,'line',pub,'n',0,'t',Date.now(),'amt',amt,'free',free],
    ['LPUSH','space:feed',id],['LTRIM','space:feed',0,199]]);
    if(free)await r(['EXPIRE','space:w:'+id,7*86400]);}
  res.status(200).json({idx:Number(n)-1,wishes:Number(n)});
}
