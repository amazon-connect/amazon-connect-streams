var istanbul = require('gulp-istanbul'),
    mocha = require('gulp-mocha'),
    concat = require('gulp-concat'),
    gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    jshint = require('gulp-jshint'),
    replace = require('gulp-replace'),
    pump = require('pump');
    fs = require('fs');
    path = require('path');

var DESTINATION_FOLDER = './release/';

var sourceCode = {
  streamJs: {
    sources: ["src/aws-client.js",
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
    "src/mediaControllers/*"
    ],
    destFilename: 'connect-streams.js',
    destMinifiedFilename: 'connect-streams-min.js',
  },
  disasterRecovery: {
    sources: [ "src/sprintf.js",
    "src/util.js",
    "src/drCoordinator/*"],
    destFilename: 'connect-streams-dr.js',
    destMinifiedFilename: 'connect-streams-dr-min.js',
  }
}

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
  var streamJs = sourceCode.streamJs;
  pump([
    gulp.src(streamJs.sources),
    jshint(),
    replace("STREAMS_VERSION", process.env.npm_package_version),
    concat(streamJs.destFilename),
    gulp.dest(DESTINATION_FOLDER),
    rename(streamJs.destMinifiedFilename),
    uglify(),
    gulp.dest(DESTINATION_FOLDER)
  ], cb);
});


gulp.task('script-with-dr', function(cb) {
  var dr = sourceCode.disasterRecovery;
  var streamJs = sourceCode.streamJs;
  pump([
    gulp.src(dr.sources),
    jshint(),
    replace("INSERT_LATEST_STREAMJS_BASE64_CODE", fs.readFileSync(path.join(DESTINATION_FOLDER, streamJs.destFilename), "base64")),
    concat(dr.destFilename),
    gulp.dest(DESTINATION_FOLDER),
    rename(dr.destMinifiedFilename),
    uglify(),
    gulp.dest(DESTINATION_FOLDER)
  ], cb)
});

gulp.task('default', gulp.series('script', 'script-with-dr', 'test'));
