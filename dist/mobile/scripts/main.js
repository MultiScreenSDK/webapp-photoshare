$(function () {

    "use strict";

    var username = navigator.userAgent.match(/(opera|chrome|safari|firefox|msie)/i)[0] + ' User';
    var app;
    var EXIF = window.EXIF;

    var ui = {
        castButton          : $('#castButton'),
        castSettings        : $('#castSettings'),
        castWindowTitle     : $('#castSettings .title'),
        castWindowDeviceList: $('#castSettings .devices'),
        castButtonDisconnect: $('#castSettings button.disconnect'),
        castButtonRescan    : $('#castSettings button.search'),
        btnSelectPhoto      : $("#btnSelectFile"),
        filePhoto           : $("#filePhoto"),
        contentContainer    : $("#cntMain"),
        selectedImg         : $("#imgSelected")
    };


    var setService = function(service){

        // Since the mobile web app and tv app are hosted from the same place
        // We will use a little javascript to determine the tv app url
        var tvAppUrl = window.location.href.replace('/mobile','/tv');

        app = service.application(tvAppUrl, 'com.samsung.multiscreen.photoshare');

        app.connect({name: username}, function (err) {
            if(err) return console.error(err);
        });

        app.on('connect', function(){
            $('body').removeClass().addClass('connected');
            ui.castWindowTitle.text(service.device.name);
        });

        app.on('disconnect', function(){
            $('body').removeClass().addClass('disconnected');
            ui.castWindowTitle.text('Connect to a device');
            app.removeAllListeners();
        });

    };

    var init = function(){

        var search = window.msf.search();

        search.on('found', function(services){

            ui.castWindowDeviceList.empty();

            if(services.length > 0){
                $(services).each(function(index, service){
                    $('<li>').text(service.device.name).data('service',service).appendTo(ui.castWindowDeviceList);
                });
                $('body').removeClass().addClass('disconnected');
                ui.castWindowTitle.text('Connect To A Device');
            }else{
                $('<li>').text('No devices found').appendTo(ui.castWindowDeviceList);
            }
        });

        search.start();

        ui.castButton.on('click', function(){
            ui.castSettings.fadeToggle(200, 'swing');
        });

        ui.castSettings.on('click', function(evt){
            evt.stopPropagation();
            ui.castSettings.fadeOut(200, 'swing');
        });

        ui.castWindowDeviceList.on('click','li', function(evt){
            evt.stopPropagation();
            var service = $(this).data('service');
            if(service){
                setService(service);
                ui.castSettings.hide();
            }
        });

        ui.castButtonDisconnect.on('click', function(){
            if(app) app.disconnect();
            ui.castSettings.fadeToggle(200, 'swing');
        });

        ui.castButtonRescan.on('click', function(evt){
            evt.stopPropagation();
            search.start();
        });

        ui.btnSelectPhoto.on('click', function(){
            ui.filePhoto.click();
        });

        ui.filePhoto.on('change', function(event){
            var files = event.target.files;
            var file;
            if (files && files.length > 0) {

                file = files[0];

                // Publish the file to the channel
                app.publish('showPhoto', {}, 'broadcast', file);

                // Use the exif data to correct any orientation issues
                EXIF.getData(file, function() {

                    console.log(EXIF.pretty(this));

                    var o = EXIF.getTag(this,'Orientation');

                    var tMap = [];
                    tMap[2] = 'rotate3d(0, 1, 0, 180deg)';
                    tMap[3] = 'rotate3d(0, 0, 1, 180deg)';
                    tMap[4] = 'rotate3d(1, 0, 0, 180deg)';
                    tMap[5] = 'rotate3d(1, 1, 0, 180deg)';
                    tMap[6] = 'rotate3d(0, 0, 1, 90deg)';
                    tMap[7] = 'rotate3d(1, -1, 0, 180deg)';
                    tMap[8] = 'rotate3d(0, 0, -1, 90deg)';

                    if(tMap[o]) ui.selectedImg.css('transform',tMap[o]);
                    else ui.selectedImg.css('transform','rotate3d(0, 0, 0, 0deg)');

                });

                // Create a url from the blob and update the onscreen image
                var URL = window.URL || window.webkitURL;
                ui.selectedImg.attr('src',URL.createObjectURL(file));
            }
        });

    };

    init();


});