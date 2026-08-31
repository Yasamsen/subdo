const { requireAuth } = require("./_auth");
function validHost(h){return /^[a-z0-9](?:[a-z0-9.-]{0,253}[a-z0-9])?$/i.test(h)&&!h.includes("..");}
module.exports=async function(req,res){
 if(!requireAuth(req,res)) return;
 if(req.method!=="GET") return res.status(405).end();
 const name=String(req.query.name||"").trim().toLowerCase();
 if(!validHost(name)) return res.status(400).json({success:false,error:"Invalid hostname"});
 const types=["A","AAAA","CNAME","MX","TXT"];
 try{
  const results={};
  for(const type of types){
   const r=await fetch(`https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`,{headers:{accept:"application/dns-json"}});
   const j=await r.json();
   results[type]=(j.Answer||[]).map(x=>({data:x.data,ttl:x.TTL,type:x.type}));
  }
  return res.json({success:true,name,results});
 }catch(e){return res.status(502).json({success:false,error:"DNS resolver unavailable"});}
};
