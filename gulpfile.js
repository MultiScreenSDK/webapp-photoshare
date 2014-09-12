/**
 * Created by Jason on 1/31/14.
 */


'use strict';

var gulp        = require('gulp'),
    clean       = require('gulp-clean'),
    express     = require('express'),
    livereload  = require('gulp-livereload'),
    path        = require('path');


var paths = {
    app     : './app/',
    dist    : './dist/'
};



gulp.task('dev-server',['build'], function(){
    var app = express();
    app.set('port', process.env.PORT || 3000);
    app.use(express.static(path.join(__dirname, paths.dist)));
    app.listen(app.get('port'), function(){
        console.log('development server listening on port ' + app.get('port'));
    });
});

gulp.task('develop', ['dev-server'], function () {
    //livereload.listen();
    //server.changed('/'); // Fire change once due to bug where server wont listen until initial change
    gulp.watch(paths.app + '**', ['build']);
    //gulp.watch(paths.dist + '**').on('change', livereload.changed);
});


gulp.task('clean', function() {
    return gulp.src( paths.dist , { read: false }).pipe(clean());
});

gulp.task('build', ['clean'], function(){
    return gulp.src(paths.app+'**')
        .pipe(gulp.dest(paths.dist))
});


gulp.task('default', ['dev-server']);