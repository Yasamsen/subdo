const { verifySession } = require("./_auth");
module.exports=async function(req,res){ res.json({authenticated:verifySession(req)}); };
