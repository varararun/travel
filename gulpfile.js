var pkg = require("./package.json");
var gulp = require("gulp");
var sass = require("gulp-sass");
var jshint = require("gulp-jshint");
var stylish = require("jshint-stylish");
var beautify = require("gulp-jsbeautifier");
var cleanCSS = require("gulp-clean-css");
var rename = require("gulp-rename");
var uglify = require("gulp-uglify");
var browserSync = require("browser-sync").create();
var autoprefixer = require("gulp-autoprefixer");
var header = require("gulp-header");
var ts = require("gulp-typescript");
var tsProject = ts.createProject("tsconfig.json");
var sourcemaps = require('gulp-sourcemaps');
var del = require("del");
var runSequence = require("run-sequence");

var banner = ["/*\n",
  " * <%= pkg.title %> (<%= pkg.homepage %>)\n",
  " * Copyright 2016-" + (new Date()).getFullYear(), " <%= pkg.author %>\n",
  " */\n",
  ""
].join("");

gulp.task("clean-dist", function () {
  return del.sync(["dist"], {
    force: true
  });
});

gulp.task("clean-css", function () {
  return del.sync([
    "assets/css/*.min.css",
    "assets/css/*.map"
  ], {
    force: true
  });
});

gulp.task("clean-js", function () {
  return del.sync([
    "assets/js/*.min.js",
    "assets/js/*.map"
  ], {
    force: true
  });
});

gulp.task("default", ["serve"]);

gulp.task("minify", function () {
  return runSequence("clean-css", "scss", "minify-css", "sourcemap-css", "clean-js", "typescript", "minify-js", "sourcemap-js");
});

gulp.task("typescript", function () {
  tsProject.src()
    .pipe(tsProject())
    .js.pipe(gulp.dest("assets/js"));
});

gulp.task("scss", function () {
  return gulp.src("assets/css/*.scss")
    .pipe(sass().on("error", sass.logError))
    .pipe(autoprefixer({
      browsers: ["last 2 versions", "> 5%", "Firefox ESR"]
    }))
    .pipe(gulp.dest("assets/css"));
});

gulp.task("jshint", function () {
  return gulp.src([
      "assets/js/travel.js"
    ])
    .pipe(jshint())
    .pipe(jshint.reporter(stylish))
    .pipe(jshint.reporter("fail"));
});

gulp.task("format", function () {
  return gulp.src([
      "assets/css/travel.css",
      "client/js/travel.js",
      "index.html",
      "*.{js,json}"
    ], {
      base: "./"
    })
    .pipe(beautify())
    .pipe(gulp.dest("./"));
});

gulp.task("sourcemap-css", function () {
  return gulp.src([
      "assets/css/*.min.css"
    ])
    .pipe(sourcemaps.init())
    .pipe(sourcemaps.write("./"))
    .pipe(gulp.dest("assets/css"));
});

gulp.task("sourcemap-js", function () {
  return gulp.src([
      "assets/js/*.min.js",
      "!assets/js/*spec.js"
    ])
    .pipe(sourcemaps.init())
    .pipe(sourcemaps.write("./"))
    .pipe(gulp.dest("assets/js"));
});

gulp.task("minify-css", function () {
  return gulp.src([
      "assets/css/travel.css"
    ])
    .pipe(cleanCSS({
      compatibility: "ie8"
    }))
    .pipe(rename({
      suffix: ".min"
    }))

    .pipe(header(banner, {
      pkg: pkg
    }))
    .pipe(gulp.dest("assets/css"));
});

gulp.task("minify-js", function () {
  return gulp.src([
      "assets/js/travel.js"
    ])
    .pipe(uglify())
    .pipe(rename({
      suffix: ".min"
    }))
    .pipe(header(banner, {
      pkg: pkg
    }))
    .pipe(gulp.dest("assets/js"));
});

gulp.task("browserSync", function () {
  browserSync.init({
    server: {
      baseDir: ""
    },
  });
});

gulp.task("package-js", function () {
  return gulp.src([
      "assets/js/*.js",
      "assets/js/*.map",
      "!assets/js/*.spec.js"
    ])
    .pipe(gulp.dest("dist/js"));
});

gulp.task("package-css", function () {
  return gulp.src([
      "assets/css/*.css",
      "assets/css/*.map"
    ])
    .pipe(gulp.dest("dist/css"));
});

gulp.task("package", function () {
  return runSequence("clean-dist", "minify", "package-css", "package-js");
});

gulp.task("serve", function () {
  runSequence("browserSync", "minify");

  gulp.watch("assets/css/**/*.scss", ["scss"]);
  gulp.watch("assets/css/travel.css", ["minify-css"]);
  gulp.watch("assets/js/travel.ts", ["typescript"]);
  gulp.watch("assets/js/travel.js", ["minify-js"]);
  gulp.watch("index.html", browserSync.reload);
  gulp.watch("assets/**/*.{js,css}", browserSync.reload);
});

module.exports = gulp;
