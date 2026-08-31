const { requireAuth } = require("./_auth");
const { cf, zonePath, normalizeRecord } = require("./_cloudflare");
const { addActivity } = require("./_activity");

module.exports=async function(req,res){
  if(!requireAuth(req,res)) return;
  try{
    const path=zonePath();
    if(req.method==="GET"){
      const page=Math.max(1,Number(req.query.page||1)), per=Math.min(100,Math.max(1,Number(req.query.per_page||100)));
      const data=await cf(`${path}?page=${page}&per_page=${per}&order=name&direction=asc`);
      return res.json(data);
    }
    if(req.method==="POST"){
      const record=normalizeRecord(req.body, process.env.ZONE_NAME||"");
      const data=await cf(path,{method:"POST",body:JSON.stringify(record)});
      await addActivity(req,"CREATE",`${record.type} ${record.name} → ${record.content}`);
      return res.status(201).json(data);
    }
    return res.status(405).json({success:false,error:"Method not allowed"});
  }catch(e){return res.status(e.status||400).json({success:false,error:e.message,details:e.details||[]});}
};
