/**
 * Geocode via Mapbox
 */

function geocode(input, callback) {
  window
    .fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        input
      )}.json?access_token=pk.eyJ1Ijoic2hhZG93ZmxhcmUiLCJhIjoiS3pwY1JTMCJ9.pTSXx_LFgR3XBpCNNxWPKA&bbox=-97.7578124999709,43.27218889815032,-88.79296874998062,49.33495138607665&country=us&language=en`
    )
    .then(response => {
      if (!response.ok) {
        return callback(
          new Error(`Fetch response was: ${response.statusText}`)
        );
      }
      return response.json();
    })
    .then(data => {
      callback(null, data);
    })
    .catch(callback);
}

module.exports = geocode;
