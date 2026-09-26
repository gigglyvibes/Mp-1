/**
 * Haversine formula - returns distance in kilometers between two
 * [longitude, latitude] GeoJSON coordinate pairs. Used for display
 * purposes; actual nearby matching is done via MongoDB's $near/$geoNear.
 */
const toRad = (value) => (value * Math.PI) / 180;

const calculateDistanceKm = (coord1 = [0, 0], coord2 = [0, 0]) => {
  const [lon1 = 0, lat1 = 0] = Array.isArray(coord1) ? coord1 : [0, 0];
  const [lon2 = 0, lat2 = 0] = Array.isArray(coord2) ? coord2 : [0, 0];
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
};

module.exports = calculateDistanceKm;
