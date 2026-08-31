const { clearSession } = require("./_auth");
module.exports=async function(req,res){ if(req.method!=="POST") return res.status(405).end(); clearSession(res); res.json({success:true}); };
