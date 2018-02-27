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
  },

  displayGrade: function(grade) {
    return grade === -1 ? 'PreK' : grade === 0 ? 'K' : grade;
  },

  displayDayTypes: function(type) {
    return type === 'extended'
      ? 'Extended day'
      : type === 'half'
        ? 'Half day'
        : type === 'full'
          ? 'Full day'
          : type === 'overnight'
            ? 'Overnight'
            : type === 'other' ? 'Other' : type;
  },

  sortDayTypes: function(a, b) {
    a =
      a === 'half'
        ? 1
        : a === 'full'
          ? 2
          : a === 'extended'
            ? 3
            : b === 'overnight' ? 4 : b === 'other' ? 5 : -1;
    b =
      b === 'half'
        ? 1
        : b === 'full'
          ? 2
          : b === 'extended'
            ? 3
            : b === 'overnight' ? 4 : b === 'other' ? 5 : -1;
    return a - b;
  },

  // Turn map styles into URL for static maps
  mapStylesJSONToFlat: function(styles) {
    var styleSets = [];

    styles.forEach(v => {
      var style = '';
      if (v.stylers) {
        // only if there is a styler object
        if (v.stylers.length > 0) {
          // Needs to have a style rule to be valid.
          style +=
            (v.hasOwnProperty('featureType')
              ? 'feature:' + v.featureType
              : 'feature:all') + '|';
          style +=
            (v.hasOwnProperty('elementType')
              ? 'element:' + v.elementType
              : 'element:all') + '|';
          v.stylers.forEach(val => {
            var propertyname = Object.keys(val)[0];
            var propertyval = val[propertyname].toString().replace('#', '0x');
            style += propertyname + ':' + propertyval + '|';
          });
        }
      }
      styleSets.push(style.replace(/\|$/, ''));
    });

    return styleSets;
  }
};
