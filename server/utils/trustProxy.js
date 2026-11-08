// Turns the TRUST_PROXY env value into an Express 'trust proxy' setting.
// Returns undefined when the proxy should not be trusted.
// Express `true` would trust every X-Forwarded-For hop, letting clients pick their own IP
// and dodge the login limits, so "true" means one proxy hop instead.
function resolveTrustProxy(raw) {
  const value = String(raw ?? '').trim();
  if (!value || value === 'false' || value === '0') return undefined;
  if (value === 'true') return 1;
  if (/^\d+$/.test(value)) return Number(value);
  return value; // e.g. "loopback" or a list of proxy IPs
}

module.exports = { resolveTrustProxy };
