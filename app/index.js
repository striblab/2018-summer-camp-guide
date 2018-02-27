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
  .fetch('//static.startribune.com/projects/camp-guide/camp_guide-2018.json')
  .then(response => response.json())
  .then(response => {
    mainComponent.set({
      camps: parser(response.items ? response.items : response)
    });
  })
  .catch(console.error);
