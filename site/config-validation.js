export function validHttps(value) {
  try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password; } catch { return false; }
}
export function salesIssues(config) {
  const errors = [];
  if (!Number.isFinite(config.pricePLN) || config.pricePLN <= 0) errors.push('Uzupełnij dodatnią cenę pricePLN.');
  for (const key of ['checkoutUrl', 'termsUrl', 'privacyUrl', 'consumerRightsUrl']) {
    if (!validHttps(config[key])) errors.push(`Uzupełnij poprawny adres HTTPS: ${key}.`);
  }
  for (const key of ['sellerName', 'sellerDetails', 'deliveryDescription']) {
    if (typeof config[key] !== 'string' || !config[key].trim()) errors.push(`Uzupełnij pole ${key}.`);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.contactEmail || '')) errors.push('Uzupełnij contactEmail.');
  return errors;
}
