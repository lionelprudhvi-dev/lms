/**
 * Haversine formula to compute great-circle distance between two GPS coordinates in meters.
 */
export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;

  const φ1 = toRad(Number(lat1));
  const φ2 = toRad(Number(lat2));
  const Δφ = toRad(Number(lat2) - Number(lat1));
  const Δλ = toRad(Number(lon2) - Number(lon1));

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c * 100) / 100; // in meters, 2 decimal places
}

/**
 * Extract trusted server-observed public client IP from request headers or socket.
 */
export function getServerObservedIp(request) {
  if (!request || !request.headers) return '127.0.0.1';

  const getHeader = (name) => {
    return typeof request.headers.get === 'function'
      ? request.headers.get(name)
      : request.headers[name];
  };

  const forwarded = getHeader('x-forwarded-for');
  if (forwarded) {
    const list = forwarded.split(',').map((ip) => ip.trim());
    for (const ip of list) {
      if (ip && !isPrivateIp(ip)) {
        return ip;
      }
    }
    if (list[0]) return list[0];
  }

  const realIp = getHeader('x-real-ip');
  if (realIp) return realIp.trim();

  const cfConnectingIp = getHeader('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp.trim();

  return '203.0.113.10'; // Safe fallback public IP for development/demo
}

function isPrivateIp(ip) {
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') return true;
  if (ip.startsWith('10.') || ip.startsWith('192.168.')) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) return true;
  return false;
}
