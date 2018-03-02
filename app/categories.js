/**
 * Categories and sub-categories.
 *
 * Unfortunately the data comes in as just an array with
 * no information on category relationship.
 */

// Sort names
function sortName(a, b) {
  return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
}

// Categories
let categories = [
  {
    name: 'Academic',
    sub: [
      { name: 'General academic' },
      { name: 'Business and careers' },
      { name: 'History' },
      { name: 'Journalism and writing' },
      { name: 'Language and culture' },
      { name: 'Science, technology, engineering and math' }
    ]
  },
  {
    name: 'Agencies'
  },
  {
    name: 'Animals'
  },
  {
    name: 'Arts',
    sub: [
      { name: 'General arts' },
      { name: 'Music' },
      { name: 'Performing arts' },
      { name: 'Visual and studio arts' }
    ]
  },
  {
    name: 'Cooking'
  },
  {
    name: 'Day camps',
    sub: [{ name: 'Metro area' }, { name: 'Out state' }]
  },
  {
    name: 'Religious/spiritual'
  },
  {
    name: 'Resident camps',
    sub: [{ name: 'Metro area' }, { name: 'Out state' }]
  },
  {
    name: 'Special needs'
  },
  {
    name: 'Sports/athletics',
    sub: [
      { name: 'General sports' },
      { name: 'Baseball' },
      { name: 'Basketball' },
      { name: 'Cheerleading' },
      { name: 'Dance team' },
      { name: 'Fencing' },
      { name: 'Fishing' },
      { name: 'Football' },
      { name: 'Figure akating' },
      { name: 'Golf' },
      { name: 'Gymnastics' },
      { name: 'Hockey' },
      { name: 'Horseback riding' },
      { name: 'In-line skating' },
      { name: 'Lacrosse' },
      { name: 'Rock climbing' },
      { name: 'Sailing' },
      { name: 'Skateboarding' },
      { name: 'Soccer' },
      { name: 'Softball' },
      { name: 'Sports adventures' },
      { name: 'Strength and conditioning' },
      { name: 'Swimming' },
      { name: 'Tennis' },
      { name: 'Track and field' },
      { name: 'Volleyball' },
      { name: 'Wilderness/outdoor adventures' },
      { name: 'Wrestling' }
    ]
  }
]
  .map(c => {
    // Create IDs
    c.id = c.name.toLowerCase().replace(/\W/g, '');
    if (c.sub) {
      c.sub = c.sub
        .map(s => {
          s.id = c.id + '-' + s.name.toLowerCase().replace(/\W/g, '');
          return s;
        })
        .sort(sortName);
    }

    return c;
  })
  .sort(sortName);

module.exports = categories;
