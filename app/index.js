/**
 * Main JS file for project.
 */

// Define globals that are added through the config.json file, here like this:
// /* global _ */
'use strict';

// Dependencies
//import utilsFn from './utils.js';
import Page from '../components/page.html';
import parser from './parse-incoming-data.js';

// Setup utils function
//utilsFn({});

// Initialize components
let mainComponent = new Page({
  target: document.querySelector('.article-lcd-body-content'),
  hydrate: true
});

// Get data
window
  .fetch('http://media2.startribune.com/json_data_store/camp_guide.js')
  .then(response => response.json())
  .then(response => {
    mainComponent.set({ camps: parser(response.items) });
  })
  .catch(console.error);
