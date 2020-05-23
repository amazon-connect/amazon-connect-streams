var istanbul = require('gulp-istanbul'),
    mocha = require('gulp-mocha'),
    concat = require('gulp-concat'),
    gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    jshint = require('gulp-jshint'),
    replace = require('gulp-replace'),
    pump = require('pump');

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

gulp.task('test', gulp.series('pre-test', function (cb) {
  return gulp.src(['test/unit/**/*.spec.js'])
    .pipe(mocha({exit: true, showStack:true}))
    .on('error', (err) => cb(err))
    // Creating the reports after tests ran
    .pipe(istanbul.writeReports());
}));
 
gulp.task('watch', function() {
  gulp.watch('src/*.js', gulp.series('script'));
});

gulp.task('script', function (cb) {
  pump([
    gulp.src(source),
    jshint(),
    replace("STREAMS_VERSION", process.env.npm_package_version),
    concat('connect-streams.js'),
    gulp.dest('./release/'),
    rename('connect-streams-min.js'),
    uglify(),
    gulp.dest('./release/')
  ], cb);
});

gulp.task('default', gulp.series('script', 'test'));
