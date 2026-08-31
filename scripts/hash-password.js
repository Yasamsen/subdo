const crypto = require("crypto");
const password = process.argv[2];
if (!password) {
  console.error("Usage: node scripts/hash-password.js "YourPassword"");
  process.exit(1);
}
const N = 16384, r = 8, p = 1, keylen = 64;
const salt = crypto.randomBytes(16);
crypto.scrypt(password, salt, keylen, { N, r, p, maxmem: 64 * 1024 * 1024 }, (err, derived) => {
  if (err) throw err;
  console.log(`scrypt$${N}$${r}$${p}$${salt.toString("base64url")}$${derived.toString("base64url")}`);
});
