let del = require('del');
let pkg = require('./package.json');
let gulp = require('gulp');
let sass = require('gulp-sass');
let header = require('gulp-header');
let rename = require('gulp-rename');
let uglify = require('gulp-uglify');
let jshint = require('gulp-jshint');
let stylish = require('jshint-stylish');
let beautify = require('gulp-jsbeautifier');
let cleanCSS = require('gulp-clean-css');
let sourcemaps = require('gulp-sourcemaps');
let browserSync = require('browser-sync').create();
let autoprefixer = require('gulp-autoprefixer');
let plumber = require('gulp-plumber');

let paths = {
    scss: 'assets/css/travel.scss',
    css: 'assets/css/travel.css',
    js: 'assets/js/travel.js'
}

const banner = ['/*\n',
    ' * <%= pkg.title %> (<%= pkg.homepage %>)\n',
    ' * Copyright 2016-' + (new Date()).getFullYear(), ' <%= pkg.author %>\n',
    ' */\n',
    ''
].join('');

/** Miscellaneous Tasks **/

function jshintReport() {
    return gulp.src([
            paths.js
        ])
        .pipe(plumber())
        .pipe(jshint())
        .pipe(jshint.reporter(stylish))
        .pipe(jshint.reporter('fail'));
};

function format() {
    return gulp.src([
            paths.scss,
            paths.js,
            'index.html',
            '*.{js,json}'
        ], {
            base: './'
        })
        .pipe(plumber())
        .pipe(beautify())
        .pipe(gulp.dest('./'));
};

/** JavaScript Tasks **/

function cleanJs(done) {
    del.sync([
        'assets/js/*.min.js',
        'assets/js/*.map'
    ], {
        force: true
    });

    done();
};

function minifyJs() {
    return gulp.src([
            paths.js
        ])
        .pipe(plumber())
        .pipe(header(banner, {
            pkg: pkg
        }))
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest('assets/js'));
};

function sourcemapJs() {
    return gulp.src([
            'assets/js/*.min.js',
            '!assets/js/*spec.js'
        ])
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('assets/js'));
};

/** CSS Tasks **/

function cleanCss(done) {
    del.sync([
        'assets/css/*.min.css',
        'assets/css/*.map'
    ], {
        force: true
    });

    done();
};

function scss() {
    return gulp.src('assets/css/**/*.scss')
        .pipe(plumber())
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer({
            browsers: ['last 2 versions', '> 5%', 'Firefox ESR']
        }))
        .pipe(gulp.dest('assets/css'));
};

function minifyCss() {
    return gulp.src([
            paths.css
        ])
        .pipe(plumber())
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
};

function sourcemapCss() {
    return gulp.src([
            'assets/css/*.min.css'
        ])
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('assets/css'));
};

/** Server Task **/

function serve(done) {
    browserSync.init({
        server: {
            baseDir: '.'
        },
        port: process.env.PORT || 4790
    });

    done();
};

function reload(done) {
    browserSync.reload();
    done();
};

/** Task Flows **/

const js = gulp.series(cleanJs, minifyJs, sourcemapJs, reload);

const css = gulp.series(cleanCss, scss, minifyCss, sourcemapCss, reload);

const minify = gulp.series(css, js);

function watch() {
    gulp.watch('assets/css/**/*.scss', css);
    gulp.watch(paths.js, js);
    gulp.watch('index.html', reload);
};

gulp.task('default', gulp.series(minify, serve, watch));

gulp.task('lint', jshintReport);

gulp.task('format', format);

module.exports = gulp;