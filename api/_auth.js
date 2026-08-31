const crypto = require("crypto");

const COOKIE_NAME = "yasam_session";

function sign(value) {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error("SESSION_SECRET is not configured");
  }

  return crypto
    .createHmac("sha256", secret)
    .update(value)
    .digest("base64url");
}

function makeSession() {
  const now = Date.now();

  const payload = Buffer.from(
    JSON.stringify({
      sub: "admin",
      iat: now,
      exp: now + 24 * 60 * 60 * 1000
    })
  ).toString("base64url");

  const signature = sign(payload);

  return `${payload}.${signature}`;
}

function getCookie(req) {
  const header = req.headers.cookie || "";

  const cookies = header.split(";");

  for (const item of cookies) {
    const [name, ...parts] = item.trim().split("=");

    if (name === COOKIE_NAME) {
      return decodeURIComponent(parts.join("="));
    }
  }

  return null;
}

function verifySession(req) {
  try {
    if (!process.env.SESSION_SECRET) {
      return false;
    }

    const token = getCookie(req);

    if (!token) {
      return false;
    }

    const parts = token.split(".");

    if (parts.length !== 2) {
      return false;
    }

    const [payload, signature] = parts;

    if (!payload || !signature) {
      return false;
    }

    const expected = sign(payload);

    const receivedBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);

    // timingSafeEqual membutuhkan panjang buffer yang sama
    if (receivedBuffer.length !== expectedBuffer.length) {
      return false;
    }

    if (!crypto.timingSafeEqual(receivedBuffer, expectedBuffer)) {
      return false;
    }

    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    );

    if (data.sub !== "admin") {
      return false;
    }

    if (!data.exp || data.exp <= Date.now()) {
      return false;
    }

    return true;
  } catch (err) {
    return false;
  }
}

function setSession(res) {
  const token = makeSession();

  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`
  );
}

function clearS