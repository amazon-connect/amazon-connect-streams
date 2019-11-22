var istanbul = require('gulp-istanbul'), 
    mocha = require('gulp-mocha'),
    concat = require('gulp-concat'),
    gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    watch = require('gulp-watch'),
    jshint = require('gulp-jshint'),
    pump = require('pump');

var webserver = require('gulp-webserver');

var source = [ "src/aws-client.js",
    "src/sprintf.js",
    "src/log.js", 
    "src/util.js",
    "src/event.js",
    "src/streams.js",
    "src/client.js",
    "src/transitions.js",
    "src/api.js",
    "src/lib/amazon-connect-websocket-manager.js",
    "src/core.js",
    "src/ringtone.js",
    "src/softphone.js",
    "src/worker.js",
    "src/mediaControllers/*",
   
]; 
 
gulp.task('pre-test', function () {
  return gulp.src(['./src/*.js'])
    // Covering files
    .pipe(istanbul({includeUntested: false}))
    // Force `require` to return covered files
    .pipe(istanbul.hookRequire());
});
 
gulp.task('test', ['pre-test'], function () {
  return gulp.src(['test/unit/**/*.spec.js'])
    .pipe(mocha({exit: true, showStack:true}))
    .on('error', console.error)
    // Creating the reports after tests ran
    .pipe(istanbul.writeReports());
});
 
gulp.task('watch', function() {
  gulp.watch('src/*.js', ['script']);
});

gulp.task('script', function (cb) {
  pump([
    gulp.src(source),
    jshint(),
    concat('connect-streams.js'),
    gulp.dest('./release/'),
    rename('connect-streams-min.js'),
    uglify(),
    gulp.dest('./release/')
  ], cb);
});

gulp.task('default',['test','script']);
