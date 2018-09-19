var istanbul = require('gulp-istanbul'), 
    mocha = require('gulp-mocha'),
    concat = require('gulp-concat'),
    gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename');

var source = [ "src/aws-client.js",
    "src/sprintf.js",
    "src/log.js", 
    "src/util.js",
    "src/event.js",
    "src/streams.js",
    "src/client.js",
    "src/transitions.js",
    "src/api.js",
    "src/core.js",
    "src/ringtone.js",
    "src/softphone.js",
    "src/worker.js"
]; 
 
gulp.task('pre-test', function () {
  return gulp.src(['./src/*.js'])
    // Covering files
    .pipe(istanbul({includeUntested: false}))
    // Force `require` to return covered files
    .pipe(istanbul.hookRequire());
});
 
gulp.task('test', ['pre-test'], function () {
  return gulp.src(['test/unit/*.js'])
    .pipe(mocha({exit: true, showStack:true}))
    .on('error', console.error)
    // Creating the reports after tests ran
    .pipe(istanbul.writeReports());
});
 
gulp.task('script', function() {
  return gulp.src(source)
    .pipe(concat('connect-streams.js'))
    .pipe(gulp.dest('./release/'))
    .pipe(rename('connect-streams-min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('./release/'))
});

gulp.task('default',['test','script']);