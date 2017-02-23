var ts = require('gulp-typescript');
var del = require('del');
var pkg = require('./package.json');
var gulp = require('gulp');
var sass = require('gulp-sass');
var header = require('gulp-header');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
var beautify = require('gulp-jsbeautifier');
var cleanCSS = require('gulp-clean-css');
var tsProject = ts.createProject('tsconfig.json');
var sourcemaps = require('gulp-sourcemaps');
var runSequence = require('run-sequence');
var browserSync = require('browser-sync').create();
var autoprefixer = require('gulp-autoprefixer');

var paths = {
  scss: 'assets/css/travel.scss',
  css: 'assets/css/travel.css',  
  ts:'assets/js/travel.ts',
  js:'assets/js/travel.js'
}

var banner = ['/*\n',
  ' * <%= pkg.title %> (<%= pkg.homepage %>)\n',
  ' * Copyright 2016-' + (new Date()).getFullYear(), ' <%= pkg.author %>\n',
  ' */\n',
  ''
].join('');

/** Miscellaneous Tasks **/

gulp.task('jshint', function () {
  return gulp.src([
      paths.ts,
      '*.js'
    ])
    .pipe(jshint())
    .pipe(jshint.reporter(stylish))
    .pipe(jshint.reporter('fail'));
});

gulp.task('format', function () {
  return gulp.src([
       paths.scss,
       paths.ts,
      'index.html',
      '*.{js,json}'
    ], {
      base: './'
    })
    .pipe(beautify())
    .pipe(gulp.dest('./'));
});

/** JavaScript Tasks **/

gulp.task('clean-js', function () {
  return del.sync([
    'assets/js/*.min.js',
    'assets/js/*.map'
  ], {
    force: true
  });
});

gulp.task('typescript', function () {
  tsProject.src()
    .pipe(tsProject())
    .js.pipe(gulp.dest('assets/js'));
});

gulp.task('minify-js', function () {
  return gulp.src([
       paths.js
    ])
    .pipe(uglify())
    .pipe(header(banner, {
      pkg: pkg
    }))
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest('assets/js'));
});

gulp.task('sourcemap-js', function () {
  return gulp.src([
      'assets/js/*.min.js',
      '!assets/js/*spec.js'
    ])
    .pipe(sourcemaps.init())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('assets/js'));
});

gulp.task('js', function () {
  return runSequence('clean-js', 'typescript', 'minify-js', 'sourcemap-js');
});

/** CSS Tasks **/

gulp.task('clean-css', function () {
  return del.sync([
    'assets/css/*.min.css',
    'assets/css/*.map'
  ], {
    force: true
  });
});

gulp.task('scss', function () {
  return gulp.src('assets/css/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer({
      browsers: ['last 2 versions', '> 5%', 'Firefox ESR']
    }))
    .pipe(gulp.dest('assets/css'));
});

gulp.task('minify-css', ['scss'], function () {
  return gulp.src([
       paths.css
    ])
    .pipe(cleanCSS({
      compatibility: 'ie8'
    }))
    .pipe(header(banner, {
      pkg: pkg
    }))
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest('assets/css'));
});

gulp.task('sourcemap-css', function () {
  return gulp.src([
      'assets/css/*.min.css'
    ])
    .pipe(sourcemaps.init())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('assets/css'));
});

/** Server Task **/

gulp.task('browserSync', function () {
  return browserSync.init({
    server: {
      baseDir: ''
    },
    port: process.env.PORT || 4790
  });
});

/** Task Flows **/

gulp.task('css', function () {
  return runSequence('clean-css', 'scss', 'minify-css', 'sourcemap-css');
});

gulp.task('minify', function () {
  return runSequence('css', 'js');
});

gulp.task('serve', function () {
  runSequence('minify', 'browserSync');
  gulp.watch('assets/css/**/*.scss', ['css', browserSync.reload]);
  gulp.watch('assets/js/**/*.ts', ['js', browserSync.reload]);
  gulp.watch('index.html', browserSync.reload);
});

gulp.task('default', ['serve']);

module.exports = gulp;
