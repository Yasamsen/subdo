const { requireAuth }=require("./_auth");
const { cf }=require("./_cloudflare");
module.exports=async function(req,res){
 if(!requireAuth(req,res)) return;
 try{
  const r=await cf(`/zones/${encodeURIComponent(process.env.CLOUDFLARE_ZONE_ID)}`);
  res.json({success:true,zone:r.result?.name||null,configured:true});
 }catch(e){res.status(500).json({success:false,error:e.message});}
};
