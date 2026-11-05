// Vercel Serverless + Upstash Redis (KV). 환경변수: KV_REST_API_URL, KV_REST_API_TOKEN
import {live,r,pipe} from './_kv.js';
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(!live)return res.status(200).json({here:1,total:0,wishes:0,live:false});
  const u=String(req.query.u||'').slice(0,40);if(!u)return res.status(400).json({});
  const now=Date.now(),cut=now-60000;
  const [,,,here,isNew]=await pipe([
    ['ZADD','space:here',now,u],
    ['ZREMRANGEBYSCORE','space:here','-inf',cut],
    ['EXPIRE','space:here',300],
    ['ZCARD','space:here'],
    ['SADD','space:seen',u]]);
  if(isNew)await r(['INCR','space:total']);
  const [total,wishes]=await pipe([['GET','space:total'],['GET','space:wishes']]);
  res.status(200).json({here:Number(here)||1,total:Number(total)||0,wishes:Number(wishes)||0,live:true});
}
