/**
 * Crew Link (No-Backend Remote Voting) codec
 * - Encodes candidate movie IDs into a URL hash: #crew=1,5,9,12,20
 * - Encodes a friend's ballot { likes, passes, vetoes } into a compact base64url vote code
 * - Decodes one or more vote codes back into HotSeat-compatible vote objects
 */

export function buildCrewLinkUrl(films = []) {
  const ids = films.map((f) => f.id).filter(Boolean).slice(0, 6);
  const base =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}`
      : 'http://localhost:5173/';
  return `${base}#crew=${ids.join(',')}`;
}

export function parseCrewHashIds(hash = '') {
  if (!hash || !hash.startsWith('#crew=')) return null;
  const raw = hash.slice('#crew='.length).trim();
  if (!raw) return null;
  const ids = raw
    .split(',')
    .map((x) => Number(x.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);
  return ids.length > 0 ? ids : null;
}

export function encodeVoteBallot({ likes = [], passes = [], vetoes = [] }) {
  // Compact format: l1,l2|p1,p2|v1
  const payload = `${likes.join(',')}|${passes.join(',')}|${vetoes.join(',')}`;
  const b64 = btoa(payload)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return b64;
}

export function decodeVoteBallot(code = '', index = 1) {
  const cleaned = String(code).trim();
  if (!cleaned) return null;
  try {
    const padded = cleaned.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(padded);
    const [likesRaw = '', passesRaw = '', vetoesRaw = ''] = decoded.split('|');
    const toNums = (str) =>
      str
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isInteger(n) && n > 0);
    return {
      player: index,
      likes: toNums(likesRaw),
      passes: toNums(passesRaw),
      vetoes: toNums(vetoesRaw)
    };
  } catch {
    return null;
  }
}
