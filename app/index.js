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

// TODO: Ployfill fetch
if (!window.fetch) {
  console.error('No fetch.');
}
else {
  // The share output is inside the component, but it is rendered
  // by news-platform.  And, of course, its different on desktop
  // and mobile
  $(document).ready(() => {
    // Hack to get share back
    let $share = $('.sharing-wrapper').size()
      ? $('.sharing-wrapper')
        .children()
        .detach()
      : undefined;
    let attachShare = !$share
      ? undefined
      : () => {
        $('.sharing-wrapper').append($share);
      };

    // Get data
    window
      .fetch(
        '//static.startribune.com/news/projects/all/2022-summer-camp-guide/camp_guide-2022.json'
      )
      .then(response => response.json())
      .then(response => {
        // Initialize components, after data is loaded so that the non-js
        // version keeeps showing
        let mainComponent = new Page({
          target: document.querySelector('.article-lcd-body-content'),
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
