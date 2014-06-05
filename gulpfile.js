var gulp = require('gulp'),
    less = require('gulp-less'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    clean = require('gulp-clean'),
    awspublish = require('gulp-awspublish'),
    rename = require('gulp-rename'),
    jshint = require('gulp-jshint'),
    csslint = require('gulp-csslint'),
    stylish = require('jshint-stylish'),
    minifyCSS = require('gulp-minify-css'),
    fs = require('fs');
/*
gulp.task('clean', function() {
    return gulp.src('dist/*', {read: false})
        .pipe(clean());
});

gulp.task('style', ['clean'], function () {
    gulp.src('src/style/*.less')
        .pipe(less({
            paths: [ '.', 'lib' ]
        }))
        .pipe(csslint())
        .pipe(csslint.reporter())
        .pipe(minifyCSS())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest('dist'));
});

gulp.task('scripts', ['clean'], function() {
    gulp.src(['src/script/lib/*.js','src/script/*.js'],
        {
            base: 'src/script/'
        })
        .pipe(jshint())
        .pipe(jshint.reporter(stylish))
        .pipe(concat('script.js'))
        .pipe(uglify())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest('dist'));
});*/

gulp.task('copy', function() {
    gulp.src(['src/**'], {base: 'src/'})
        .pipe(gulp.dest('dist'));
});

gulp.task('push', function() {
    var credentials = JSON.parse(fs.readFileSync('aws.json', 'utf8'));
    var pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    var publisher = awspublish.create(credentials);

    gulp.src('dist/**', {base: 'dist/'})
        .pipe(rename(function (path) {
            path.dirname = '/apps/2014/05/' + pkg.name + '/' + path.dirname;
        }))
        .pipe(publisher.cache())
        .pipe(publisher.publish())
        .pipe(awspublish.reporter());
});

gulp.task('build', ['copy']);
