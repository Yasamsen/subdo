const { requireAuth } = require("./_auth");
const { cf, zonePath, normalizeRecord } = require("./_cloudflare");
const { addActivity } = require("./_activity");
module.exports=async function(req,res){
  if(!requireAuth(req,res)) return;
  const id=req.query.id;
  if(!id) return res.status(400).json({success:false,error:"Missing record id"});
  try{
    if(req.method==="GET") return res.json(await cf(`${zonePath()}/${encodeURIComponent(id)}`));
    if(req.method==="PATCH" || req.method==="PUT"){
      const record=normalizeRecord(req.body, process.env.ZONE_NAME||"");
      const data=await cf(`${zonePath()}/${encodeURIComponent(id)}`,{method:req.method,body:JSON.stringify(record)});
      await addActivity(req,"UPDATE",`${record.type} ${record.name} → ${record.content}`);
      return res.json(data);
    }
    if(req.method==="DELETE"){
      const data=await cf(`${zonePath()}/${encodeURIComponent(id)}`,{method:"DELETE"});
      await addActivity(req,"DELETE",`DNS record ${id}`);
      return res.json(data);
    }
    return res.status(405).json({success:false,error:"Method not allowed"});
  }catch(e){return res.status(e.status||400).json({success:false,error:e.message,details:e.details||[]});}
};
