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
import LazyLoad from 'vanilla-lazyload';

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
  let share = '';
  if (window.$ && window.$('.article-share').length) {
    share = window.$('.article-share').get(0).outerHTML;
  }
  if (!share && window.$ && window.$('.story-share.body-sharing-top').length) {
    share = window.$('.story-share.body-sharing-top').get(0).outerHTML;
  }

  // Lazy load images
  let lazyloader = new LazyLoad();

  // Initialize components
  let mainComponent = new Page({
    target: document.querySelector('.article-lcd-body-content'),
    hydrate: true,
    data: {
      share: share,
      lazyloader: lazyloader
    }
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
}
