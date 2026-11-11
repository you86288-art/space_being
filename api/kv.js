const URL=process.env.KV_REST_API_URL,TOK=process.env.KV_REST_API_TOKEN;
export const live=!!(URL&&TOK);
export async function r(cmd){const res=await fetch(URL,{method:'POST',headers:{Authorization:'Bearer '+TOK,'Content-Type':'application/json'},body:JSON.stringify(cmd)});return (await res.json()).result;}
export async function pipe(cmds){const res=await fetch(URL+'/pipeline',{method:'POST',headers:{Authorization:'Bearer '+TOK,'Content-Type':'application/json'},body:JSON.stringify(cmds)});return (await res.json()).map(x=>x.result);}
export const BAD=['시발','씨발','ㅅㅂ','ㅆㅂ','병신','ㅂㅅ','좆','지랄','개새','새끼','ㅈㄹ','섹스','야동','보지','자지','창녀','걸레','자살','죽고싶','죽을래','죽어라','죽여','http','www.','.com','.kr','카톡','오픈채팅','텔레그램','대출','코인','리딩','투자문의','fuck','shit','bitch','cunt','nigg','suicide','porn','sex'];
export function clean(line){line=String(line||'').replace(/\s+/g,' ').trim().slice(0,40);if(!line)return '';const l=line.toLowerCase();for(const w of BAD)if(l.includes(w))return '';return line;}
