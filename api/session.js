const { verifySession } = require("./_auth");

module.exports = async function (req, res) {
  res.setHeader("Cache-Control", "no-store"