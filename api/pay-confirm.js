// 토스페이먼츠 결제 승인. 환경변수: TOSS_SECRET_KEY (test_sk_... 또는 live_sk_...)
import {live,r,pipe,clean} from './kv.js';
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST')return res.status(405).end();
  const SK=process.env.TOSS_SECRET_KEY;if(!SK)return res.status(503).json({error:'no-toss-key'});
  const {paymentKey,orderId,amount,u,pub,tier}=req.body||{};
  if(!paymentKey||!orderId||!(Number(amount)>=990))return res.status(400).json({error:'bad-request'});
  // 중복 승인 방지
  if(live){const dup=await r(['SET','space:order:'+orderId,'1','NX','EX',86400]);if(!dup)return res.status(409).json({error:'already'});}
  const auth='Basic '+Buffer.from(SK+':').toString('base64');
  const tr=await fetch('https://api.tosspayments.com/v1/payments/confirm',{method:'POST',headers:{Authorization:auth,'Content-Type':'application/json'},body:JSON.stringify({paymentKey,orderId,amount:Number(amount)})});
  const tj=await tr.json();
  if(!tr.ok){if(live)await r(['DEL','space:order:'+orderId]);return res.status(402).json({error:tj.code||'confirm-failed',message:tj.message});}
  // 승인 성공 → 소원 등록 (wish.js와 동일 로직)
  if(!live)return res.status(200).json({idx:0,wishes:1,paid:true});
  const n=await r(['INCR','space:wishes']);await r(['INCRBY','space:revenue',Number(amount)]);
  const line=clean(pub);
  if(line){const id='w'+n;await pipe([['HSET','space:w:'+id,'line',line,'n',0,'t',Date.now(),'amt',Number(amount)],['LPUSH','space:feed',id],['LTRIM','space:feed',0,199]]);}
  res.status(200).json({idx:Number(n)-1,wishes:Number(n),paid:true});
}
