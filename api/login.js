const { setSession, verifyPassword } = require("./_auth");
module.exports=async function(req,res){
  if(req.method!=="POST") return res.status(405).json({success:false,error:"Method not allowed"});
  try{
    const {password}=req.body||{};
    if(!process.env.ADMIN_PASSWORD_HASH || !process.env.SESSION_SECRET) return res.status(500).json({success:false,error:"Authentication environment variables are missing"});
    if(!password || !verifyPassword(String(password),process.env.ADMIN_PASSWORD_HASH)) return res.status(401).json({success:false,error:"Invalid password"});
    setSession(res); return res.json({success:true});
  }catch(e){return res.status(500).json({success:false,error:e.message});}
};
