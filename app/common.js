/**
 * Common methods for components.
 */
'use strict';

module.exports = {
  distance: function(lat1, lng1, lat2, lng2, unit = 'miles') {
    let radlat1 = Math.PI * lat1 / 180;
    let radlat2 = Math.PI * lat2 / 180;
    let theta = lng1 - lng2;
    let radtheta = Math.PI * theta / 180;
    let dist =
      Math.sin(radlat1) * Math.sin(radlat2) +
      Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    dist = Math.acos(dist);
    dist = dist * 180 / Math.PI;
    dist = dist * 60 * 1.1515;
    if (unit === 'kilometers') {
      dist = dist * 1.609344;
    }
    if (unit === 'nautical') {
      dist = dist * 0.8684;
    }
    return dist;
  }
};
