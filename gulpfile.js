// Include gulp
var gulp = require('gulp');

// Include Our Plugins
var jshint = require('gulp-jshint');
var sass = require('gulp-sass');
var uglify = require('gulp-uglify');
var minifyhtml = require('gulp-minify-html');
var imagemin = require('gulp-imagemin');
var gulpif = require('gulp-if');
var useref = require('gulp-useref');
var rev = require('gulp-rev');
var collect = require('gulp-rev-collector');
var rs = require('run-sequence');
var del = require('del');
var browserSync = require('browser-sync');
var autoprefixer = require('gulp-autoprefixer');
var reload = browserSync.reload;

// Paths
var app = 'app';
var tmp = 'tmp';
var dist = 'dist';

var appPaths = {
  js: app + '/scripts/**/*.js',
  sass: app + '/styles/**/*.sass',
  html: app + '/**/*.html',
  img: app + '/img/*'
};

var AUTOPREFIXER_BROWSERS = [
  'ie >= 10',
  'ie_mob >= 10',
  'ff >= 30',
  'chrome >= 34',
  'safari >= 7',
  'opera >= 23',
  'ios >= 7',
  'android >= 4.4',
  'bb >= 10'
];

// Functions
function onError(err) {
  console.log(); console.log(err.toString()); console.log();
}

// Lint Task
gulp.task('jshint', function() {
  gulp.src(appPaths.js)
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

// Compile Our Sass for development
gulp.task('sass', function() {
  gulp.src(appPaths.sass)
    .pipe(sass())
    .on('error', onError)
    .pipe(autoprefixer({browsers: AUTOPREFIXER_BROWSERS}))
    .pipe(gulp.dest(app + '/styles'))
});

// Compile Our Sass for production
gulp.task('sass-build', function() {
  gulp.src(appPaths.sass)
    .pipe(sass({ outputStyle: 'compressed' }))
    .on('error', onError)
    .pipe(autoprefixer({browsers: AUTOPREFIXER_BROWSERS}))
    .pipe(gulp.dest(app + '/styles'))
});

// Minify images and rev it
gulp.task('imagemin', function() {
  return gulp.src(appPaths.img)
    .pipe(imagemin())
    .pipe(rev())
    .pipe(gulp.dest(dist + '/img')) //write rev'd img to dist
    .pipe(rev.manifest())
    .pipe(gulp.dest(tmp + '/img')) //write img manifest to tmp
});

// Combine assets (JS and CSS), rev them, and minify HTML
gulp.task('useref', function() {
  var assets = useref.assets();

  return gulp.src(app + '/index.html')
    .pipe(assets)
    // .pipe(gulpif('*.js', uglify()))
    .pipe(rev()) //revision all assets (js, css)
    .pipe(gulp.dest(tmp)) //write rev'd assets to tmp
    .pipe(rev.manifest())
    .pipe(gulp.dest(tmp)) //write assets manifest to tmp
    .pipe(assets.restore())
    .pipe(useref())
    .pipe(minifyhtml())
    .pipe(gulp.dest(tmp)) //write non assets (index.html) to tmp
});

gulp.task('collect', function () {
  return gulp.src([tmp + '/**/*.json', tmp + '/**/*.{html,css,js}'])
    .pipe(collect()) //replace all occurence in manifest (.json) in all .{html,css,js} on tmp
    .pipe(gulp.dest(dist)) //write it to dist
});

// Watch files for changes & reload
gulp.task('serve', ['sass'], function () {
  browserSync({
    notify: false,
    // Customize the BrowserSync console logging prefix
    logPrefix: 'PUMPKIN',
    // Run as an https by uncommenting 'https: true'
    // Note: this uses an unsigned certificate which on first access
    //       will present a certificate warning in the browser.
    // https: true,
    server: ['app']
  });

  gulp.watch(['app/**/*.html'], reload);
  gulp.watch(appPaths.sass, ['sass', reload]);
  gulp.watch(appPaths.js, ['jshint']);
  gulp.watch(['app/img/**/*'], reload);
});

// Default Task
gulp.task('clean', function (cb) {
  del(dist, cb);
});

gulp.task('finish', function (cb) {
  del(tmp, cb);
});

gulp.task('default', ['jshint', 'sass', 'watch']);
gulp.task('build', function() { rs(['clean', 'finish'], ['sass-build', 'imagemin'], 'useref', 'collect', 'finish') });
