const crypto = require("crypto");

function cookieName() { return "yasam_session"; }

function sign(value) {
  return crypto.createHmac("sha256", process.env.SESSION_SECRET || "").update(value).digest("base64url");
}

function makeSession() {
  const payload = Buffer.from(JSON.stringify({
    sub: "admin",
    iat: Date.now(),
    exp: Date.now() + 1000 * 60 * 60 * 24
  })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function verifySession(req) {
  const header = req.headers.cookie || "";
  const found = header.split(";").map(v => v.trim()).find(v => v.startsWith(cookieName()+"="));
  if (!found) return false;
  const token = decodeURIComponent(found.slice(cookieName().length + 1));
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = sign(payload);
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return data.sub === "admin" && data.exp > Date.now();
  } catch { return false; }
}

function setSession(res) {
  res.setHeader("Set-Cookie",
    `${cookieName()}=${encodeURIComponent(makeSession())}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`);
}

function clearSession(res) {
  res.setHeader("Set-Cookie",
    `${cookieName()}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
}

function requireAuth(req, res) {
  if (!process.env.SESSION_SECRET || !verifySession(req)) {
    res.status(401).json({ success:false, error:"Unauthorized" });
    return false;
  }
  return true;
}

function verifyPassword(password, encoded) {
  try {
    const [algo,Ns,rs,ps,salt64,key64] = String(encoded).split("$");
    if (algo !== "scrypt") return false;
    const N=Number(Ns), r=Number(rs), p=Number(ps);
    const salt=Buffer.from(salt64,"base64url"), stored=Buffer.from(key64,"base64url");
    const derived=crypto.scryptSync(password, salt, stored.length, {N,r,p,maxmem:64*1024*1024});
    return crypto.timingSafeEqual(derived, stored);
  } catch { return false; }
}
module.exports = { setSession, clearSession, requireAuth, verifyPassword, verifySession };
