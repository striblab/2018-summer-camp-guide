/**
 * Main JS file for project.
 */

// Define globals that are added through the config.json file, here like this:
// /* global _ */
'use strict';

// Dependencies
import utilsFn from './utils.js';
import Page from '../components/page.html';

// Import local ES6 modules like this:
//import utilsFn from './utils.js';

// Or import libraries installed with npm like this:
// import module from 'module';

// Setup utils function
utilsFn({});

// Initialize components
let mainComponent = new Page({
  target: document.querySelector('.article-lcd-body-content'),
  hydrate: true,
  data: {
    test: true
  }
});
