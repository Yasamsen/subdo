const { cf } = require("./_cloudflare");

async function addActivity(req, action, details) {
  const item={id:Date.now().toString(36)+Math.random().toString(36).slice(2,7), action, details, at:new Date().toISOString()};
  const account=process.env.CLOUDFLARE_ACCOUNT_ID, ns=process.env.CLOUDFLARE_KV_NAMESPACE_ID, token=process.env.CLOUDFLARE_API_TOKEN;
  if (account && ns && token) {
    try {
      const key=`activity:${item.id}`;
      const url=`https://api.cloudflare.com/client/v4/accounts/${account}/storage/kv/namespaces/${ns}/values/${encodeURIComponent(key)}`;
      await fetch(url,{method:"PUT",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify(item)});
    } catch {}
  }
  return item;
}
async function listActivities(limit=100) {
  const account=process.env.CLOUDFLARE_ACCOUNT_ID, ns=process.env.CLOUDFLARE_KV_NAMESPACE_ID, token=process.env.CLOUDFLARE_API_TOKEN;
  if (!account || !ns || !token) return [];
  try {
    const u=`https://api.cloudflare.com/client/v4/accounts/${account}/storage/kv/namespaces/${ns}/keys?prefix=activity:&limit=${Math.min(limit,1000)}`;
    const r=await fetch(u,{headers:{Authorization:`Bearer ${token}`}});
    if(!r.ok) return [];
    const j=await r.json();
    const keys=j.result||[];
    const values=await Promise.all(keys.map(async k=>{
      const x=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/storage/kv/namespaces/${ns}/values/${encodeURIComponent(k.name)}`,{headers:{Authorization:`Bearer ${token}`}});
      return x.ok?x.json():null;
    }));
    return values.filter(Boolean).sort((a,b)=>b.at.localeCompare(a.at)).slice(0,limit);
  } catch { return []; }
}
module.exports={addActivity,listActivities};
