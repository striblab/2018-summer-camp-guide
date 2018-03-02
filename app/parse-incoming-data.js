/**
 * Used to parse raw camp list from data stream.  Will
 * be used in browser and SSR
 */

// Dependencies
const { DateTime } = require('luxon');
const categories = require('./categories.js');
console.log(categories);

// event_id: '127489',
// type: 'Camp',
// label: 'Global Language Institute Program',
// event_desc: 'One- to four-week, half- and full-day camps for English as a Second Language students to prepare for high school.',
// event_url: 'http://www.vita.mn/event_detail.php?event_id=127489',
// venue_id: '2051',
// venue_name: 'Global Language Institute',
// venue_city: 'St. Paul, MN',
// latLng: '44.945661,-93.092709',
// event_category_array: [Array],
// special_information_array: [Array],
// start_date: '2017-07-17',
// end_date: '2017-08-11',
// date_range: 'Jul. 17 to Aug. 11',
// price_range: '$796 to $2105',
// info_phone_nbr: '651-209-3525',
// info_toll_free_phone_nbr: '',
// contact_label: 'Contact',
// event_who: 'Ages 12-17',
// info_website: 'http://gli.edu/youth-programs',
// occurrence_array: [Array],
// occurrence_date_array: [Array]
module.exports = camps => {
  console.error(`Original camp count: ${camps.length}`);

  return camps
    .map(c => {
      let parsed = {};

      parsed.id = c.event_id;
      parsed.title = c.label;
      parsed.description = c.event_desc;
      parsed.url = c.event_url;
      parsed.rawCategories = c.event_category_array;
      parsed.phone = c.info_phone_nbr;
      parsed.phoneTollFree = c.info_toll_free_phone_nbr;
      parsed.website = c.info_website;

      // lat long
      let locationMatch = c.latLng.match(/([0-9.-]+),\s*([0-9.-]+)/i);
      if (locationMatch) {
        parsed.location = {
          lat: parseFloat(locationMatch[1]),
          lng: parseFloat(locationMatch[2])
        };
      }

      // Star and end dates
      parsed.start = DateTime.fromISO(c.start_date);
      parsed.end = DateTime.fromISO(c.end_date);
      // Unsure what this is
      // occurrence_array

      // Parse prices
      let prices = c.price_range.replace(/[$,]/g, '').split(' to ');
      parsed.minPrice = parseInt(prices[0], 10);
      parsed.maxPrice = parseInt(prices[prices.length === 1 ? 0 : 1], 10);

      // Parse who can attend
      parsed.who = {};
      let whoMatch = c.event_who.match(
        /(girls|boys|)[,\s]*(completed|entering|)\s*(ages?|grades?)\s*(pre-?k|k|[0-9]+|adult)-(pre-?k|k|[0-9]+|adult)(.*adults with developmental disabilities|)/i
      );
      if (whoMatch) {
        parsed.who = {
          type: whoMatch[3].match(/grade/i) ? 'grade' : 'age',
          specifically: whoMatch[1].trim() ? whoMatch[1].trim() : undefined,
          entering: whoMatch[2].match(/enter/i) ? true : false,
          min: whoMatch[4].match(/^pre-?k$/i)
            ? -1
            : whoMatch[4].match(/^k$/i)
              ? 0
              : whoMatch[4].match(/^adult$/i) ? 22 : parseInt(whoMatch[4], 0),
          max: whoMatch[5].match(/^pre-?k$/i)
            ? -1
            : whoMatch[5].match(/^k$/i)
              ? 0
              : whoMatch[5].match(/^adult$/i) ? 22 : parseInt(whoMatch[5], 0),
          specialNeedsAdults: whoMatch[6].trim() ? true : false,
          minText: whoMatch[4],
          maxText: whoMatch[5]
        };
      }
      else {
        // Family camps?
        // TODO: Who parsing better
        if (c.event_who.match(/family\s+camp/i)) {
          parsed.who.type = 'family';
        }
        else {
          console.error(`No match for: ${c.event_who}`);
          console.error(c);
        }
      }

      // Standardize/convert grades all to "entering"
      if (parsed.who.type === 'grade' && !parsed.who.entering) {
        parsed.who.min++;
        parsed.who.max++;
        parsed.who.entering = true;
      }

      // Parse type of camps
      parsed.notes = c.special_information_array;
      parsed.types = parsed.notes
        .filter(i => (i.trim ? i.trim() : i))
        .map(n => {
          let day = n.match(
            /(full\s*day|extended\s*day|half\s*day).*(([0-9]+)-([0-9]+)|([0-9]+)\+)\s*hrs/i
          );
          let overnight = n.match(/overnight/i);

          if (day) {
            return {
              description: day[0],
              type: day[1].match(/full/i)
                ? 'full'
                : day[1].match(/extended/i)
                  ? 'extended'
                  : day[1].match(/half/i) ? 'half' : undefined,
              minHours: day[5] ? parseInt(day[5], 10) : parseInt(day[3], 10),
              maxHours: day[5] ? Infinity : parseInt(day[4], 10)
            };
          }
          else if (overnight) {
            return {
              description: overnight[0],
              type: 'overnight',
              overnight: true
            };
          }
          else {
            console.error(`Unable to parse: ${n}`);
          }
        })
        .filter(n => n);

      // Check types
      if (parsed.types.length === 0) {
        parsed.types.push({
          type: 'other'
        });
        console.error('Unable to find type, setting to "other"', c);
      }

      // Get venue
      parsed.venue = {
        id: c.venue_id,
        name: c.venue_name,
        city: c.venue_city,
        various: !!c.venue_name.match(/various/i)
      };

      // Clean up categories.  The categories come in as an array, but there
      // is a heirarchy to them.  And what's worse is that there are
      // sub categories that are repeated, so we try to look for a set of
      // categories that work.  And what's even worse, is that there
      // are sub categories, but there are not parent categories attached.
      let allCategoryIDs = parsed.rawCategories.map(c =>
        c.toLowerCase().replace(/\W/g, '')
      );
      parsed.categories = [];
      parsed.rawCategories.forEach(c => {
        let id = c.toLowerCase().replace(/\W/g, '');
        let found;

        // Look through categories
        categories.forEach(i => {
          if (i.id === id) {
            found = i.id;
          }
          else if (i.sub) {
            // For sub categories, which may have the same name as other
            // sub categories, we look for other categories and combine them
            i.sub.forEach(s => {
              allCategoryIDs.forEach(topID => {
                if (topID + '-' + id === s.id) {
                  found = s.id;
                }
              });
            });
          }
        });

        // If we haven't found one yet, it might be that its a
        // sub category without a parent
        if (!found) {
          categories.forEach(i => {
            if (i.sub) {
              i.sub.forEach(s => {
                if (s.id.indexOf('-' + id) > 0) {
                  found = s.id;

                  // And add parent
                  parsed.categories.push(i.id);
                }
              });
            }
          });
        }

        parsed.categories.push(found);
      });

      parsed.categories = parsed.categories
        .filter(i => i)
        // Unique
        .filter((value, index, self) => {
          return self.indexOf(value) === index;
        });

      //console.log(parsed);
      return parsed;
    })
    .sort((a, b) => {
      return a.title < b.title ? -1 : a.title > b.title ? 1 : 0;
    });
};
