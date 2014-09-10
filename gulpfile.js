/**
 * Created by Jason on 1/31/14.
 */


'use strict';

var gulp    = require('gulp'),
    clean   = require('gulp-clean'),
    es      = require('event-stream'),
    express = require('express'),
    fs      = require('fs'),
    knox    = require('knox'),
    path    = require('path');


var paths = {
    app     : './app/',
    dist    : './dist/'
};


gulp.task('dev-server',['build'], function(){
    var app = express();
    app.set('port', process.env.PORT || 3000);
    app.use(express.logger('dev'));
    app.use(express.json());
    app.use(express.urlencoded());
    app.use(express.methodOverride());
    app.use(express.static(path.join(__dirname, paths.dist)));
    app.use(express.errorHandler());

    app.listen(app.get('port'), function(){
        console.log('development server listening on port ' + app.get('port'));
    });
});

gulp.task('clean', function() {
    return gulp.src( paths.dist , { read: false })
        .pipe(clean());
});

gulp.task('build', ['clean'], function(){

    // For now this is just a copy but later may include less, js, ... compilation
    return gulp.src(paths.app+'**')
        .pipe(gulp.dest(paths.dist));

});


gulp.task('deploy',['build'],function(){

    return gulp.src('./dist/**', {read: false})
        .pipe(publishToS3());

});


gulp.task('default', ['dev-server']);