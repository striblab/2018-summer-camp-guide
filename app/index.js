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
//import LazyLoad from 'vanilla-lazyload/dist/lazyload';

// TOGGLE MAPS
const noMaps = true;

// Setup utils function
//utilsFn({});

// TODO: Polyfill fetch
if (!window.fetch) {
  console.error('No fetch.');
}
else {
  // The share output is inside the component, but it is rendered
  // by news-platform. And, of course, it's different on desktop
  // and mobile
  document.addEventListener('DOMContentLoaded', () => {
    // Hack to get share back
    let shareElements = document.querySelectorAll('.sharing-wrapper');
    let share = shareElements.length > 0 ? shareElements[0].children : undefined;
    let attachShare = !share ? undefined : () => {
      shareElements[0].append(...share);
    };

    // Get data
    window
      .fetch(
        '//static.startribune.com/news/projects/all/2024-summer-camp-guide/camp_guide-2024.json'
      )
      .then(response => response.json())
      .then(response => {
        // Initialize components, after data is loaded so that the non-js
        // version keeps showing
        let mainComponent = new Page({
          target: document.querySelector('.article-body.article-body-content'),
          hydrate: true,
          data: {
            attachShare,
            noMaps: noMaps,
            camps: parser(response.items ? response.items : response)
          }
        });
      })
      .catch(console.error);
  });
}
