

(function ( $, window, document, undefined ) {

    "use strict";

    $.msf = function( options ){

        /*
         Define default options
         */
        var defaults = {

            // required
            appId               : null,
            channelId           : null,     /* the id of the channel to connect to (if not specified it will use the appId) */

            // optional
            container           : "body",   /* the selector or jquery element for the container (defaults to body) */
            enableUI            : false,    /* enable the built in UI */
            castButton          : null,     /* the id attribute of the element to use as the cast menu button (if enableUI is true this must be defined */
            autoDiscover        : false,    /* starts the discovery process as soon as the plugin is initialized */
            connectAttributes   : {},       /* hash containing public attributes about your connecting client */
            exitOnDisconnect    : false     /* determines is the TV application should exit once your client disconnects */
        };


        /*
         Apply options argument to defaults
         */
        options = $.extend(defaults, options);


        /*
         Verify options
         */
        if(!options.appId)      throw "appId is a required options";
        if(!options.channelId)  throw "channelId is a required options";
        if(options.enableUI && !options.castButton) throw "castButtonSelector is required when enableUI is true";
        if(options.castButton) options.enableUI = true;


        /*
         Scope variables
         */
        var msf = {};
        var ui = {};
        var discoveryFrame;
        var selectedService = {uri: 'http://127.0.0.1:8001/api/v2/',device  : {name : 'Local'}};
        var connectionState = 'disabled';


        //****************************************************************
        //
        // Plugin settings / Constants
        //
        //****************************************************************


        if(options.enableUI){

            ui.settings = {
                imageData                   : {
                    iconConnected           : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAYCAYAAACbU/80AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAIGNIUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUYAAAH4SURBVHja7NY/aBdGFAfwzy8JFOPgIFh6QwmiKYQiiFfqqNDp/DeoQ6HUqiiClILYoWihoFNpoWMcBDMJ6iBCjoQ4CoXmoC3ooEMnPXAQQUOoSPpz8ISQ6iD+fkkGHxz37r3H3ffevffudbrdLoi5vmSWmQasMA0tFZQUOm8yjrm+02ElhcV7dVenB5Yi7CXFXP/n4RX3wHsAqwrAH1hYMQAlhc+xYdnTMOZ6Fvdwq6SwuNLsxm/Y1O86cG5Rns7iIiZKCpMx15v4Gd+i068n+HfR+jOM427M9WBJ4VlJ4TscxvN+AViLrfgRd5v8Y1yJuV6KuX5QUpjAV/0I0gF0Swp/lRTOYwzf4H7TH8JUzHW4pHAFP/QDwFzMdSbm+jWG2m23YLrZ7MDlmGsHv2Cq1wCG8QUmcCfmurOk8Bh7cKPZ7cX36OLkkrh5ZwC/4p+23oSZmOvRksJzfInbTfcTRprtmpYVbzVe12sMlBROYxTHMIdBXIi57ispzOMI/muHnul1DHS2TT7Yj+slhYWY61bMYD0eYnNJ4WnM9SoOYB4f4Ql+x/ZePME1zMZcR0oKf+J4032IU40fb/MwdjV+ulceeNX53EYsKTyLub663b2Swicx10E8wjpcKCmc6Mdv+GnLe7jc5tGY68aSwgL+brKxXsbAiwEACl6gJ97f6xYAAAAASUVORK5CYII=',
                    iconDisconnected        : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAYCAYAAACbU/80AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAIGNIUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUYAAAFDSURBVHja7JXPKkRhGId/5ximpiiuQBYWsmDhAuQCFFnYmAXXYDXFBbgAJcXKwspOWdgoRSnZ+JOFlCwkpcHC9Nj8Rm/D8pwzs5hfnc7b8y6+57zf6fsSQM5vUWRStTmlf1hS0Np0xAS6Al2BjhI4k9QoWiAJJ6EkDUl6LfIcKEmqSbqVdCLpqR0TiCM4l7QtaVfSVxETEPDJ3zwAC4ByfMBFCkwANeC6RWQHKOctkASYAlXgMUgcA5U8BerAEbAE9JkNAodB4qBFNFOBmDtg2rzXCzezmpfABnAfFvoGlt2rAFfmH8BwHgICeoAV4D1IzLo3BTTMt/IQmLeAgEngxb1noN9836wODJidkkGaJhdhvHOhv2Y2E9ii2XqWAnivyy1fdxO26M1sM8ufMd6G45Kqrvf8HpU04lvy0mwsy/P4ZwBa2Ueg8uDXWgAAAABJRU5ErkJggg==',
                    iconEnabled             : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAYCAYAAACbU/80AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAIGNIUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUYAAAFESURBVHja7NXLK0VRFMfxz3W98gghFAZyZaRIMqCM1f1rzQwkRgyEgaKUyKPkHZHHMVnqkOE59xhYtTv7rL1rf9dv7bVXKUkSYVUFWJ2Crf4X31KNzq7+CQX+Af4B/hTALZIi34F1NBQBUMEjrvFcBMD4jzQc4wQftQL4SN2FzhgV7OEsb4BSkiQltKMPg2hLrZ9gNyc1ql8A34ACYhzN4bvCBt7zakaLmI2DSxH1Ki5jYzem8nwHyujFJBbQg1ds4iL29WM0L4BDPMV/a6gxHHnfwkOsjaElD4A9rGAHb5GGiYj6HdvxQpajOjKvgoGQOkFHKNCIlwB7wzQGAmg5fHPoykKBacyHvHdRdtCEkZgfxbcc5Sp1STPpBR2YwRrOcRPRDeIgSvE1ekU3TrEfI7Nu2I6hmJ+mLmVLpOc+tS8z+xwA1slLlFuS/UIAAAAASUVORK5CYII=',
                },
                wrapper:{
                    attr                    : {
                        class               :'msf-wrapper'
                    },
                    css:{
                        display				: "none",
                        position			: "absolute",
                        top					: 0,
                        left				: 0,
                        width				: "100%",
                        height 				: "100%",
                        background 		    : "rgba(0,0,0,.7)",
                        font                : "normal 1.3em Helvetica, Arial, sans-serif"
                    }
                },
                castButton                  : {
                    attr                    : {
                        class               :'msf-cast-button'
                    },
                    css:{
                        "width"             : "32px",
                        "height"            : "24px",
                        "background"        : "center no-repeat"
                    }
                },
                castWindow: {
                    attr                    : {
                        class               :'msf-cast-window'
                    },
                    css: {
                        "border"            : "solid 1px #999",
                        "border-radius"     : "3px",
                        "position" 			: "absolute",
                        "width"				: "80%",
                        "min-height"        : "50px",
                        "top"				: "10%",
                        "left"				: "10%",
                        "z-index"			: 999,
                        "background"		: "#666",
                        "color"				: "#fff",
                        "box-shadow"        : "0 0 10px rgba(0,0,0,1)"
                    }
                },
                castWindowHeader:{
                    text                    : "Connect to a Device",
                    attr                    : {
                        class               :'msf-cast-window-header'
                    },
                    css: {
                        "font-size" 		: "18px",
                        "line-height" 		: "24px",
                        "margin" 			: 0,
                        "padding" 			: "20px 0px 20px 60px",
                        "color" 			: "#fff",
                        "border-bottom"	    : "1px solid cornflowerblue",
                        "background"        : "20px 50% no-repeat"
                    }
                },
                castWindowBody:{
                    text                    : "You are connected",
                    attr                    : {
                        class               :"msf-cast-window-body"
                    },
                    css: {
                        "border-bottom"     : "1px solid #999",
                        "padding" 			: "20px 10px",
                        "color"             : "#ccc",
                        "text-align"        : "center",
                        "display"           : "none"
                    }
                },
                deviceList:{
                    attr                    : {
                        class               :'msf-device-list'
                    },
                    css:{
                        "list-style"		: "none",
                        "margin"			: 0,
                        "padding"			: 0
                    }
                },
                deviceListItem:{
                    attr                    : {
                        class               :'msf-device-list-item'
                    },
                    css:{
                        "border-bottom"     : "1px solid #999",
                        "padding" 			: "20px"
                    }
                },
                castWindowFooter:{
                    attr                    : {
                        class               :"msf-cast-window-footer"
                    },
                    css: {
                        "display"           : "flex",
                        "flex-direction"    : "row"
                    }
                },
                castWindowClose:{
                    text                    : "Close",
                    attr                    : {
                        class               :'msf-cast-window-close'
                    },
                    css: {
                        "border-top" 	    : "1px solid cornflowerblue",
                        "color" 			: "#fff",
                        "padding" 	    	: "20px 0",
                        "text-align" 	    : "center",
                        "flex-grow"         : "1"
                    }
                },
                castWindowRescan:{
                    text                    : "Refresh",
                    attr                    : {
                        class               :'msf-cast-window-rescan'
                    },
                    css: {
                        "border-top" 	    : "1px solid cornflowerblue",
                        "color" 			: "#fff",
                        "padding" 	    	: "20px 0",
                        "text-align" 	    : "center",
                        "border-left"       : "1px solid #999",
                        "flex-grow"         : "1"
                    }
                },
                castWindowDisconnect:{
                    text                    : "Disconnect",
                    attr                    : {
                        class               :'msf-cast-window-disconnect'
                    },
                    css: {
                        "border-top" 	    : "1px solid cornflowerblue",
                        "color" 			: "#fff",
                        "padding" 	    	: "20px 0",
                        "text-align" 	    : "center",
                        "border-left"       : "1px solid #999",
                        "flex-grow"         : "1"
                    }
                }
               
            };


        }


        //****************************************************************
        //
        // UI related methods (only used if the options sets ui enabled
        //
        //****************************************************************

        /*
         Shows the cast modal window
         */
        function showCastWindow(){
            ui.wrapper.fadeIn('fast');
        }

        /*
         Hides the cast modal window
         */
        function hideCastWindow(){
            ui.wrapper.fadeOut('fast');
        }

        /*
         Updates the UI to reflect the connection state
         */
        function setConnectionState(state){

            connectionState = state;

            if(options.enableUI) {

                switch (state) {
                    case 'enabled' :
                        ui.castButton.show();
                        ui.castWindowHeader.text(ui.settings.castWindowHeader.text);
                        ui.castWindowBody.hide();
                        ui.castWindowDisconnect.hide();
                        ui.deviceList.show();
                        ui.castWindowRescan.show();
                        ui.castButton.css('background-image', "url('" + ui.settings.imageData.iconEnabled + "')");
                        ui.castWindowHeader.css('background-image', "url('" + ui.settings.imageData.iconEnabled + "')");
                        ui.castWindowHeader.css('color', "#fff");
                        break;
                    case 'disabled' :
                        ui.castButton.hide();
                        ui.castWindowHeader.text(ui.settings.castWindowHeader.text);
                        ui.castWindowBody.hide();
                        ui.castWindowDisconnect.hide();
                        ui.deviceList.show();
                        ui.castWindowRescan.show();
                        ui.castButton.css('background-image', "url('" + ui.settings.imageData.iconEnabled + "')");
                        ui.wrapper.hide();
                        ui.castWindowHeader.css('background-image', "url('" + ui.settings.imageData.iconEnabled + "')");
                        ui.castWindowHeader.css('color', "#fff");
                        break;
                    case 'connected' :
                        ui.castButton.show();
                        ui.castWindowHeader.text(selectedService.device.name);
                        ui.castWindowBody.text('Connected to ' + selectedService.device.name);
                        ui.castWindowBody.show();
                        ui.castWindowDisconnect.show();
                        ui.deviceList.hide();
                        ui.castWindowRescan.hide();
                        ui.castButton.css('background-image', "url('" + ui.settings.imageData.iconConnected + "')");
                        ui.castWindowHeader.css('background-image', "url('" + ui.settings.imageData.iconConnected + "')");
                        ui.castWindowHeader.css('color', "#33b5e5");
                        break;
                    case 'disconnected' :
                        ui.castButton.show();
                        ui.castWindowHeader.text(ui.settings.castWindowHeader.text);
                        ui.castWindowBody.hide();
                        ui.castWindowDisconnect.hide();
                        ui.deviceList.show();
                        ui.castWindowRescan.show();
                        ui.castButton.css('background-image', "url('" + ui.settings.imageData.iconDisconnected + "')");
                        ui.castWindowHeader.css('background-image', "url('" + ui.settings.imageData.iconDisconnected + "')");
                        ui.castWindowHeader.css('color', "#fff");
                        break;
                    default :
                        break;
                }
            }
        }


        /*
         Builds all UI elements and wires event handlers
         */
        function configureUI(){

            // UI Elements
            ui.container = $(options.container);

            ui.wrapper = $("<div />")
                .attr(ui.settings.wrapper.attr)
                .css(ui.settings.wrapper.css)
                .appendTo( ui.container )
                .on('click', function(evt){
                    evt.stopPropagation();
                    hideCastWindow();
                });

            ui.castButton = $(options.castButton)
                .attr(ui.settings.castButton.attr)
                .css(ui.settings.castButton.css)
                .on('click', function(evt){
                    evt.stopPropagation();
                    showCastWindow();
                });


            ui.castWindow = $("<div />")
                .attr(ui.settings.castWindow.attr)
                .css(ui.settings.castWindow.css)
                .appendTo( ui.wrapper )
                .on('click', function(evt){
                    evt.stopPropagation();
                });

            ui.castWindowHeader = $("<div />")
                .attr(ui.settings.castWindowHeader.attr)
                .text(ui.settings.castWindowHeader.text)
                .css(ui.settings.castWindowHeader.css)
                .appendTo( ui.castWindow );

            ui.castWindowBody = $("<div />")
                .text(ui.settings.castWindowBody.text)
                .attr(ui.settings.castWindowBody.attr)
                .css(ui.settings.castWindowBody.css)
                .appendTo( ui.castWindow );

            ui.deviceList = $("<ul />")
                .attr(ui.settings.deviceList.attr)
                .css(ui.settings.deviceList.css)
                .appendTo( ui.castWindow );

            ui.castWindowFooter = $("<div />")
                .attr(ui.settings.castWindowFooter.attr)
                .css(ui.settings.castWindowFooter.css)
                .appendTo( ui.castWindow );

            ui.castWindowClose = $("<div />")
                .text(ui.settings.castWindowClose.text)
                .attr(ui.settings.castWindowClose.attr)
                .css(ui.settings.castWindowClose.css)
                .appendTo( ui.castWindowFooter)
                .on('click', function(evt){
                    evt.stopPropagation();
                    hideCastWindow();
                });

            ui.castWindowRescan = $("<div />")
                .text(ui.settings.castWindowRescan.text)
                .attr(ui.settings.castWindowRescan.attr)
                .css(ui.settings.castWindowRescan.css)
                .appendTo( ui.castWindowFooter)
                .on('click', function(evt){
                    evt.stopPropagation();
                    discover();
                });

            ui.castWindowDisconnect = $("<div />")
                .text(ui.settings.castWindowDisconnect.text)
                .attr(ui.settings.castWindowDisconnect.attr)
                .css(ui.settings.castWindowDisconnect.css)
                .appendTo( ui.castWindowFooter)
                .on('click', function(evt){
                    evt.stopPropagation();
                    hideCastWindow();
                    disconnect();
                });

            setConnectionState('enabled');

        }

        /*
         Populates the device list (if ui is enabled) on discovery results
         */
        function populateDeviceList(services){

            ui.deviceList.empty();

            if(services.length > 0){

                $(services).each(function(index, service){
                    $('<li />')
                        .text( service.device.name )
                        .attr( ui.settings.deviceListItem.attr )
                        .attr('id',service.device.udn)
                        .css( ui.settings.deviceListItem.css )
                        .data('service',service)
                        .appendTo(ui.deviceList)
                        .on('click', function(evt){
                            setService($(this).data('service'));
                            // TODO : Implement a connecting state for the UI
                            evt.stopPropagation();
                            hideCastWindow();
                            launchApplication()
                                .done(function(){
                                    connect(selectedService);
                                }).fail(function(error){
                                    alert(error.message);
                                });

                        });
                });

                setConnectionState('disconnected');

            }else{
                $('<li />')
                    .text( "No devices found" )
                    .attr( ui.settings.deviceListItem.css )
                    .css( ui.settings.deviceListItem.css )
                    .appendTo(ui.deviceList);

                setConnectionState('enabled');
            }
        }


        //**************************************************************************
        //
        // Service related methods (discovery, application management, connections
        //
        //**************************************************************************

        /*
         Set the current service to use for other methods
         */
        function setService(service){
            selectedService = service;
        }

        /*
         Creates an iframe and starts the discovery process
         */
        function discover(){

            var dfd = new $.Deferred();

            var resultListener = function(event){
                if(event.source === discoveryFrame){
                    if(event.data && event.data.event === 'discovery.result'){
                        if(options.enableUI) populateDeviceList(event.data.result);
                        $(msf).trigger('discover', [event.data.result]);
                        dfd.resolve(event.data.result);
                    }else if(event.data && event.data.event === 'discovery.error'){
                        $(msf).trigger('error', [event.data.error]);
                        dfd.reject(event.data.error);
                    }
                    window.removeEventListener('message', resultListener);
                }
            };

            if(discoveryFrame){

                window.addEventListener('message', resultListener);
                discoveryFrame.postMessage({method:'discovery.search'}, "*");

            }else{

                var frame = document.createElement('iframe');
                frame.setAttribute('width', '1');
                frame.setAttribute('height', '1');
                frame.style.display = "none";
                frame.src = 'https://dev-multiscreen.samsung.com/discoveryservice/v2/discover';
                document.body.appendChild(frame);

                var readyListener = function(event){
                    if(event.source === frame.contentWindow){
                        if(event.data && event.data.event === 'discovery.ready'){
                            discoveryFrame = event.source;

                            window.removeEventListener('message', readyListener);
                            window.addEventListener('message', resultListener);
                            discoveryFrame.postMessage({method:'discovery.search'}, "*");
                        }
                    }
                };

                window.addEventListener('message', readyListener);
            }

            return dfd.promise();
        }

        /*
         Gets application information (auto detects web application or installable application)
         */
        function getApplication(){

            var isWebApp = options.appId.indexOf('http') === 0 || options.appId.indexOf('file') === 0;

            var dfd = new $.Deferred();

            $.ajax({
                type:"GET",
                url: isWebApp ? selectedService.uri + "webapplication/" : selectedService.uri + "application/"+options.appId,
                success:function(info){
                    dfd.resolve(info);
                    $(msf).trigger('getApplication', [info]);
                },
                error: function(error){
                    dfd.reject(error);
                }
            });
        }

        /*
         launches an application (auto detects web application or installable application)
         */
        function launchApplication(){

            var isWebApp = options.appId.indexOf('http') === 0 || options.appId.indexOf('file') === 0;

            var dfd = new $.Deferred();

            $.ajax({
                type:"POST",
                url: isWebApp ? selectedService.uri + "webapplication/" : selectedService.uri + "application/"+options.appId,
                data: isWebApp ? {url: options.appId} : {},
                dataType:'json',
                success:function(){
                    $(msf).trigger('launchApplication');
                    dfd.resolve();
                },
                error: function(error){
                    dfd.reject(error);
                }
            });

            return dfd.promise();
        }

        /*
         Stop an application (auto detects web application or installable application)
         */
        function stopApplication(){

            var isWebApp = options.appId.indexOf('http') === 0 || options.appId.indexOf('file') === 0;

            var dfd = new $.Deferred();

            $.ajax({
                type:"DELETE",
                url: isWebApp ? selectedService.uri + "webapplication/" : selectedService.uri + "application/"+options.appId,
                data : {},
                dataType:'json',
                success:function(){
                    $(msf).trigger('stopApplication');
                    dfd.resolve();
                },
                error: function(error){
                    dfd.reject(error);
                }
            });

            return dfd.promise();
        }

        /*
         Install an application
         */
        function installApplication(){

            var isWebApp = options.appId.indexOf('http') === 0 || options.appId.indexOf('file') === 0;

            if(isWebApp) throw "installApplication can on be used for installable applications";

            var dfd = new $.Deferred();

            $.ajax({
                type:"PUT",
                url: selectedService.uri + "application/"+options.appId,
                data : {},
                dataType:'json',
                success:function(){
                    $(msf).trigger('installApplication');
                    dfd.resolve();
                },
                error: function(error){
                    dfd.reject(error);
                }
            });
        }


        /*
         Packs messages with payloads into binary message
         */
        function packMessage(oMsg, payload){

            // convert js object to string
            var msg = JSON.stringify(oMsg);

            // get byte length of the string
            var msgByteLength = new Blob([msg]).size;

            // create 2 byte header which contains the length of the string (json) message
            var hBuff = new ArrayBuffer(2);
            var hView = new DataView(hBuff);
            hView.setUint16(0,msgByteLength);

            // binary packed message and payload
            return new Blob([hBuff, msg, payload]);

        }

        /*
         Unpacks binary messages
         */
        function unpackMessage(buffer){

            var json = '';
            var view = new DataView(buffer);
            var msgByteLen = view.getUint16(0);

            for (var i = 0; i < msgByteLen; i++) {
                json += String.fromCharCode(view.getUint8(i+2));
            }

            var payload = buffer.slice(2+msgByteLen);
            var message = JSON.parse(json);

            return {payload : payload, message : message};

        }


        /*
         Connects to the default channel
         */
        function connect(){

            var dfd = new $.Deferred();

            // Create the websocket and wireup our listeners
            var ws = new WebSocket(selectedService.uri.replace("http://", "ws://") + "channels/" + options.channelId + "?" + $.param( options.connectAttributes, true ));

            ws.binaryType = "arraybuffer";

            ws.addEventListener('open', function (evt) {
            });

            ws.addEventListener('close', function (evt) {
                setConnectionState('disconnected');
                $(msf).trigger('disconnect');
            });

            ws.addEventListener('error', function (evt) {
                $(msf).trigger('error');
            });

            ws.addEventListener('message', function (evt) {
                var msg;
                var payload;

                if(typeof evt.data === "string"){
                    msg = JSON.parse(evt.data);
                }else{
                    var unpacked = unpackMessage(evt.data);
                    msg = unpacked.message;
                    payload = unpacked.payload;
                }

                switch(msg.event){

                    case "msf:connect" :
                        setConnectionState('connected');
                        $(msf).trigger('connect', [msg.data], ws);
                        dfd.resolve(msg.data,ws);
                        break;
                    case "msf:clientConnect" :
                        $(msf).trigger('clientConnect', [msg.data]);
                        break;
                    case "msf:clientDisconnect" :
                        $(msf).trigger('clientConnect', [msg.data]);
                        break;
                    case "msf:error" :
                        $(msf).trigger('error', [msg.data]);
                        break;
                    default :
                        $(msf).trigger(msg.event, [msg.data, payload]);
                        break;
                }

            });

            msf.ws = ws;
            return dfd.promise();
        }

        /*
            Disconnects from the channel
         */
        function disconnect(){

            var dfd = new $.Deferred();
            if(msf.ws) msf.ws.close();
            if(options.exitOnDisconnect){
                stopApplication();
            }
            dfd.resolve();

            return dfd.promise();
        }

        /*
         Emits a message to a client or group of clients
         */
        function emit(msg, payload){
            if(!msf.ws || msf.ws.readyState !== 1) throw "The connection must be open to send a message";

            if(payload){
                msf.ws.send(packMessage(msg,payload));
            }else{
                msf.ws.send(JSON.stringify(msg));
            }

        }

        //****************************************************************
        //
        // Plugin Initialization
        //
        //****************************************************************
        function init(){

            var jmsf = $(msf);

            /* Expose public methods */
            jmsf.setService          = setService;
            jmsf.discover            = discover;
            jmsf.getApplication      = getApplication;
            jmsf.launchApplication   = launchApplication;
            jmsf.stopApplication     = stopApplication;
            jmsf.installApplication  = installApplication;
            jmsf.connect             = connect;
            jmsf.disconnect          = disconnect;
            jmsf.emit                = emit;
            jmsf.showCastWindow      = showCastWindow;
            jmsf.hideCastWindow      = hideCastWindow;

            if(options.enableUI) configureUI();
            if(options.autoDiscover) discover();

            return jmsf;

        }

        /*
         Initialize the plugin and returns the jquery representation of the msf (public object)
         */
        return init();

    };

})( jQuery, window, document );