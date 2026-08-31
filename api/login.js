const { setSession, verifyPassword } = require("./_auth");

module.exports = async function (req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    const password = String(req.body?.password || "");

    const hash = process.env.ADMIN_PASSWORD_HASH;
    const secret = process.env.SESSION_SECRET;

    if (!hash || !secret) {
      return res.status(500).json({
        success: false,
        error: "Authentication environment variables are missing"
      });
    }

    if (!verifyPassword(password, hash)) {
      return res.status(401).json({
        success: false,
        error: "Invalid passwo