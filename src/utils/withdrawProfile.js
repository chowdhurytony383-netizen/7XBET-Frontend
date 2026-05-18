function cleanText(value) {
  return String(value || '').trim();
}

function normalizeForCompare(value) {
  return cleanText(value).replace(/\s+/g, ' ').toLowerCase();
}

function looksLikeGeneratedFullName(value, user = {}) {
  const normalized = normalizeForCompare(value);
  if (!normalized) return true;

  const generatedValues = [
    user.userId,
    user.username,
    user.login,
    user.email,
    user.userId ? `User ${user.userId}` : '',
    user.username ? `User ${user.username}` : '',
  ].map(normalizeForCompare).filter(Boolean);

  return generatedValues.includes(normalized);
}

export function hasWithdrawFullName(user = {}) {
  const candidates = [user.fullName, user.name]
    .map(cleanText)
    .filter((value) => value.length >= 2);

  return candidates.some((value) => !looksLikeGeneratedFullName(value, user));
}

export function hasWithdrawAddress(user = {}) {
  return cleanText(user.address).length > 0;
}

export function getWithdrawProfileMissingFields(user = {}) {
  const missing = [];
  if (!hasWithdrawFullName(user)) missing.push('Full Name');
  if (!hasWithdrawAddress(user)) missing.push('Address');
  return missing;
}

export function isWithdrawProfileComplete(user = {}) {
  return getWithdrawProfileMissingFields(user).length === 0;
}
