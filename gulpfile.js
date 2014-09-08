/**
 * Created by Jason on 1/31/14.
 */


'use strict';

var gulp = require('gulp'),
    es = require('event-stream'),
    express = require('express'),
    fs = require('fs'),
    knox = require('knox'),
    path = require('path');


var paths = {
    app : './app/',
    dist : './dist/'
};




function publishToS3 () {

    if(!process.env.AWS_ACCESS_KEY_ID)      throw "missing env variable : AWS_ACCESS_KEY_ID";
    if(!process.env.AWS_SECRET_ACCESS_KEY)  throw "missing env variable : AWS_SECRET_ACCESS_KEY";
    if(!process.env.AWS_DEFAULT_REGION)     throw "missing env variable : AWS_DEFAULT_REGION";
    if(!process.env.S3_BUCKET)              throw "missing env variable : S3_BUCKET";
    if(!process.env.S3_BUCKET_PATH)         throw "missing env variable : S3_BUCKET_PATH";

    return es.map(function (file, cb) {
        var isFile = fs.lstatSync(file.path).isFile();
        if (!isFile) return false;

        var uploadPath = file.path.replace(file.base, '');
        uploadPath = path.join(process.env.S3_BUCKET_PATH, uploadPath);

        // Correct path to use forward slash for windows
        if(path.sep == "\\") uploadPath = uploadPath.replace(/\\/g,"/");

        var client = knox.createClient({
            "key": process.env.AWS_ACCESS_KEY_ID,
            "secret": process.env.AWS_SECRET_ACCESS_KEY,
            "region": process.env.AWS_DEFAULT_REGION,
            "bucket": process.env.S3_BUCKET
        });

        var headers = {'x-amz-acl': 'public-read'};

        client.putFile(file.path, uploadPath, headers, function(err, res) {
            if (err || res.statusCode !== 200) {
                console.log("Error Uploading" + res.req.path);
            } else {
                console.log("Uploaded " + res.req.path);
            }
            cb();
        });

        return true;

    });
}

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

gulp.task('build',function(){

    // For now this is just a copy but later may include less, js, ... compilation
    gulp.src(paths.app+'**')
        .pipe(gulp.dest(paths.dist));

});


gulp.task('deploy',function(){

    gulp.src('./dist/**', {read: false})
        .pipe(publishToS3());

});


gulp.task('default', ['dev-server']);