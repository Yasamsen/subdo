const BASE = "https://api.cloudflare.com/client/v4";

function cfHeaders() {
  return {
    "Authorization": `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
    "Content-Type": "application/json"
  };
}

async function cf(path, options={}) {
  if (!process.env.CLOUDFLARE_API_TOKEN || !process.env.CLOUDFLARE_ZONE_ID) {
    const e = new Error("Cloudflare environment variables are not configured");
    e.status=500; throw e;
  }
  const response = await fetch(BASE + path, {
    ...options,
    headers: {...cfHeaders(), ...(options.headers||{})}
  });
  let data;
  try { data = await response.json(); } catch { data = {success:false, errors:[{message:"Invalid Cloudflare response"}]}; }
  if (!response.ok || data.success === false) {
    const msg = data.errors?.map(e=>e.message).join("; ") || `Cloudflare HTTP ${response.status}`;
    const e = new Error(msg); e.status=response.status; e.details=data.errors||[]; throw e;
  }
  return data;
}

function zonePath() { return `/zones/${encodeURIComponent(process.env.CLOUDFLARE_ZONE_ID)}/dns_records`; }

function normalizeRecord(body, zone) {
  const type=String(body.type||"").toUpperCase();
  const allowed=["A","AAAA","CNAME","TXT","MX","NS","CAA","SRV"];
  if (!allowed.includes(type)) throw new Error("Unsupported DNS record type");
  let name=String(body.name||"").trim().toLowerCase();
  if (!name) throw new Error("Name is required");
  if (!name.includes(".")) name = name==="@" ? zone : `${name}.${zone}`;
  if (name.endsWith(".")) name=name.slice(0,-1);
  if (!(name===zone || name.endsWith("."+zone))) throw new Error("Name must belong to the configured zone");
  const content=String(body.content||"").trim();
  if (!content) throw new Error("Content is required");
  const ttl = body.ttl === "auto" || body.ttl === "" || body.ttl == null ? 1 : Number(body.ttl);
  if (!(ttl===1 || (Number.isInteger(ttl) && ttl>=60 && ttl<=86400))) throw new Error("TTL must be Auto or 60-86400");
  const out={type,name,content,ttl};
  if (["A","AAAA","CNAME"].includes(type)) out.proxied=Boolean(body.proxied);
  if (type==="MX") out.priority=Number.isFinite(Number(body.priority))?Number(body.priority):10;
  if (body.comment) out.comment=String(body.comment).slice(0,500);
  return out;
}

module.exports={cf,zonePath,normalizeRecord};
