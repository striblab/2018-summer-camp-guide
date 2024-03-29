/**
 * Task running and building through Gulp.
 * http://gulpjs.com/
 *
 * Overall, use config files (like .babelrc) to manage
 * options for processes.  This will allow moving away from
 * Gulp more easily if desired.
 */
'use strict';

// Catch things
process.on('unhandledRejection', console.error);

// Dependencies
const fs = require('fs');
const path = require('path');
const gulp = require('gulp');
const ejs = require('gulp-ejs');
const rename = require('gulp-rename');
const noopener = require('gulp-noopener');
const eslint = require('gulp-eslint');
const stylelint = require('gulp-stylelint');
const sass = require('gulp-sass');
const htmlhint = require('gulp-htmlhint');
const autoprefixer = require('gulp-autoprefixer');
const include = require('gulp-file-include');
const sourcemaps = require('gulp-sourcemaps');
const gutil = require('gulp-util');
const a11y = require('gulp-a11y');
const transform = require('gulp-transform');
const runSequence = require('run-sequence');
const browserSync = require('browser-sync').create();
const webpack = require('webpack');
const webpackStream = require('webpack-stream');
const webpackConfig = require('./webpack.config.js');
const del = require('del');
const gulpContent = require('./lib/gulp-content.js');
const gulpPublish = require('./lib/gulp-publish.js');
const _ = require('lodash');
const r = require('request');
const request = require('cached-request')(r);
const jest = require('./lib/gulp-jest.js');
const pkg = require('./package.json');
const parseData = require('./app/parse-incoming-data.js');
const config = exists('config.custom.json')
  ? require('./config.custom.json')
  : require('./config.json');

const argv = require('yargs').argv;
require('dotenv').load({ silent: true });

// Register svelte to be able to require
require('svelte/ssr/register')({});

// Process base html templates/pages (not templates used in front-end JS)
gulp.task('html', () => {
  const content = exists('content.json') ? require('./content.json') : {};

  return gulp
    .src(['pages/**/*.ejs.html', '!pages/**/_*.ejs.html'])
    .pipe(
      include({
        prefix: '@@',
        basepath: '@file'
      })
    )
    .pipe(
      ejs({ config: config, content: content, package: pkg, _: _ }).on(
        'error',
        gutil.log
      )
    )
    .pipe(
      rename(function(path) {
        path.basename = path.basename.replace('.ejs', '');
      })
    )
    .pipe(noopener.warn())
    .pipe(gulp.dest('build/'));
});

// Lint HTML (happens after HTML build process).  The "stylish" version
// is more succinct but its less helpful to find issues.
gulp.task('html:lint', ['html'], () => {
  return gulp
    .src('build/*.html')
    .pipe(htmlhint('.htmlhintrc'))
    .pipe(htmlhint.reporter('htmlhint-stylish'))
    .pipe(a11y())
    .pipe(a11y.reporter());
});
gulp.task('html:lint:details', ['html'], () => {
  return gulp
    .src('build/*.html')
    .pipe(htmlhint('.htmlhintrc'))
    .pipe(htmlhint.reporter())
    .pipe(a11y())
    .pipe(a11y.reporter());
});

// Server-side rendering of
gulp.task('components', done => {
  let data = {};

  // Render
  function render(content, file) {
    const component = require(file.path);
    const { html, css } = component.render(data);
    return `<style type="text/css">${css.code}</style>\n\n${html}`;
  }

  // Get data
  request.setCacheDirectory(path.join(__dirname, '.cache-component-data'));
  request(
    {
      url: config.data.camps,
      ttl: 60 * 10
    },
    (error, response, body) => {
      if (error) {
        return new gutil.PluginError('components', { message: error });
      }
      let parsed = JSON.parse(body);
      data.camps = parseData(parsed.items ? parsed.items : parsed);

      // Do each file
      return gulp
        .src('components/**/*.html')
        .pipe(transform('utf-8', render))
        .pipe(
          rename({
            prefix: 'component-'
          })
        )
        .pipe(gulp.dest('build/'))
        .on('end', done);
    }
  );
});

// Content tasks
gulp.task('content', gulpContent.getContent(gulp, config));
gulp.task('content:create', gulpContent.createSheet(gulp, config));
gulp.task('content:open', gulpContent.openContent(gulp, config));
gulp.task('content:owner', gulpContent.share(gulp, config, 'owner'));
gulp.task('content:share', gulpContent.share(gulp, config, 'writer'));

// Lint JS
gulp.task('js:lint', () => {
  return gulp
    .src(['app/**/*.js', 'gulpfile.js'])
    .pipe(eslint())
    .pipe(eslint.format());
});

// Lint styles/css
gulp.task('styles:lint', () => {
  return gulp.src(['styles/**/*.scss']).pipe(
    stylelint({
      failAfterError: false,
      reporters: [{ formatter: 'string', console: true }]
    })
  );
});

// Compile styles
gulp.task('styles', ['styles:lint'], () => {
  return gulp
    .src('styles/index.scss')
    .pipe(sourcemaps.init())
    .pipe(
      sass({
        outputStyle: 'compressed',
        includePaths: [path.join(__dirname, 'node_modules')]
      }).on('error', sass.logError)
    )
    .pipe(
      autoprefixer({
        // browsers: See browserlist file
        cascade: false
      })
    )
    .pipe(
      rename(path => {
        path.basename =
          path.basename === 'index' ? 'styles.bundle' : path.basename;
      })
    )
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('build/'));
});

// Build JS
gulp.task('js', ['js:lint', 'js:test'], () => {
  // Use the webpack.config.js to manage locations and options.
  return gulp
    .src('app/index.js')
    .pipe(webpackStream(webpackConfig, webpack))
    .pipe(gulp.dest('build'));
});

// Assets
gulp.task('assets', () => {
  // Copy a couple files to root for more global support
  gulp.src(['./assets/images/favicons/favicon.ico']).pipe(gulp.dest('build'));

  return gulp.src('assets/**/*').pipe(gulp.dest('build/assets'));
});

// Clean build
gulp.task('clean', () => {
  return del(['build/**/*']);
});

// Testing ,manully using jest module because
gulp.task(
  'js:test',
  jest('js:test', {
    rootDir: __dirname,
    testMatch: ['**/*.test.js'],
    testPathIgnorePatterns: ['acceptance'],
    setupFiles: ['./tests/globals.js']
  })
);
gulp.task(
  'js:test:acceptance',
  jest('js:test:acceptance', {
    rootDir: __dirname,
    // Not sure why full path is needed
    testMatch: [path.join(__dirname, 'tests/acceptance/*.test.js')]
  })
);

// Web server for development.  Do build first to ensure something is there.
gulp.task('server', ['build'], () => {
  // Proxy the dev version of news-platform.  (assumes the host file has been set up)
  // https://github.com/MinneapolisStarTribune/news-platform
  //
  // We serve the build files in a way that can be used by the serve_static
  // function in news-platform.  This means that the path is the same, but
  // the domain changes; locally we serve it from here at localhost:3000,
  // but for production it runs from static.startribune.com.
  //
  // news-platform knows about the local domain through the ASSETS_STATIC_URL
  // environment variable.  This can be in a .env file in your locally running
  // news-platform.
  //
  // The publish.production can change location but the "route" option below
  // will need to change so local and production act the same.
  //
  // serve_static function for reference:
  // https://github.com/MinneapolisStarTribune/news-platform/blob/1a56bd11892f79e5d48a9263bed2db7c5539fc60/app/Extensions/helpers/url.php#L272

  // Make rewrite rules
  let rewriteRules = [];
  _.each(config.cms.componentMapping, (component, id) => {
    rewriteRules.push({
      match: new RegExp(
        `<div class="${id}">([\\s\\S]*)<\\/div>\\s*<!-- end ${id} -->`,
        'im'
      ),
      fn: function(request) {
        // Make sure its only for the CMS pages and we have something
        // to replace it with
        if (
          request.originalUrl.indexOf('show=1&cache=trash') &&
          exists(`build/${component}`)
        ) {
          let inject = fs.readFileSync(`build/${component}`, 'utf-8');

          // Handle rewriting any production path urls for build
          inject = inject.replace(
            new RegExp(config.publish.production.url, 'ig'),
            '/'
          );

          return `<div class="${id}">${inject}</div>`;
        }

        return `<div class="${id}">$1</div>`;
      }
    });
  });

  // Without CMS
  if (argv.cms === false) {
    return browserSync.init({
      port: 3000,
      server: './build/',
      files: './build/**/*',
      rewriteRules: argv.rewrite === false ? [] : rewriteRules
    });
  }

  // With CMS
  return browserSync.init({
    port: 3000,
    proxy:
      'https://' +
      (argv.mobile ? 'vm-m' : 'vm-www') +
      '.startribune.com/x/' +
      (argv['cms-id'] ? argv['cms-id'] : config.cms.id) +
      '?show=1&cache=trash',
    serveStatic: [
      {
        route: '/' + config.publish.production.path,
        dir: './build'
      }
    ],
    files: './build/**/*',
    rewriteRules: argv.rewrite === false ? [] : rewriteRules,
    logLevel: argv.debug ? 'debug' : 'info'
  });
});

// Watch for building
gulp.task('watch', () => {
  gulp.watch(['styles/**/*.scss'], ['styles']);
  gulp.watch(['components/**/*.html'], ['components']);
  gulp.watch(
    ['pages/**/*', 'config.*json', 'package.json', 'content.json'],
    ['html']
  );
  gulp.watch(['app/**/*', 'components/**/*.html', 'config.json'], ['js']);
  gulp.watch(['assets/**/*'], ['assets']);
  gulp.watch(['config.*json'], ['publish:build']);
});

// Publishing
gulp.task(
  'publish',
  ['publish:token', 'publish:confirm'],
  gulpPublish.publish(gulp)
);
gulp.task('publish:token', gulpPublish.createToken(gulp));
gulp.task('publish:build', gulpPublish.buildConfig(gulp));
gulp.task('publish:confirm', gulpPublish.confirmToken(gulp));
gulp.task('publish:open', gulpPublish.openURL(gulp));

// Full build
gulp.task('build', [
  'publish:build',
  'assets',
  'html',
  'components',
  'styles',
  'js'
]);
gulp.task('default', ['build']);

// Deploy (build and publish)
gulp.task('deploy', done => {
  return runSequence('clean', 'build', 'publish', done);
});
gulp.task('deploy:open', ['publish:open']);

// Server and watching (development)
gulp.task('develop', ['server', 'watch']);

// Check file/fir exists
function exists(file) {
  return fs.existsSync(path.join(__dirname, file));
}
