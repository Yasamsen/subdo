const { requireAuth } = require("./_auth");
const { listActivities } = require("./_activity");
module.exports=async function(req,res){
 if(!requireAuth(req,res)) return;
 if(req.method!=="GET") return res.status(405).end();
 res.json({success:true,items:await listActivities(Number(req.query.limit||100))});
};
