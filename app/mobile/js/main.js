$(function(){

    var socket;
    var btnSelectPhoto = $('#btnSelectFile');
    var btnDiscover = $('#btnDiscover');
    var devicesContainer = $('#deviceWindow');
    var listDevices = $('.device-list .foundDevices ul');
    var filePhoto = $('#filePhoto');

    var connectionState = 'disabled';

    var appUrl = "http://multiscreen-examples.s3-website-us-west-1.amazonaws.com/examples/photoshare/smarttv/";

    function connect(serviceUri){

        var oReq = new XMLHttpRequest();

        oReq.onload = function(e){
            console.info("Application launched");
        };
        oReq.open("POST", serviceUri+"webapplication/", true);
        oReq.setRequestHeader('Content-type','application/json; charset=utf-8');
        oReq.send(JSON.stringify({url:appUrl}));


        socket = new WebSocket(serviceUri.replace('http://','ws://')+'channels/photoshare');

        socket.onopen = function () {
            console.info("websocket open");
            setConnectionState('connected');
            btnSelectPhoto.show();
        };

        socket.onclose = function () {
            console.warn("websocket close");
            setConnectionState('enabled');
            btnSelectPhoto.hide();
        };

        socket.onerror = function () {
            console.error(arguments);
        };

        socket.onmessage = function (msg) {
            msg = JSON.parse(msg.data);
            console.debug('websocket message : ', msg);
        };
    }

    function setConnectionState(state){
        connectionState = state;
        btnDiscover.removeClass();
        btnDiscover.addClass(state);
    }


    function onSelectDevice(evt){
        var service = $(this).data('service');
        devicesContainer.hide();
        connect(service.uri);
    }


    function populateServiceList(services){

        listDevices.empty();

        if(services.length > 0){
            for(var i=0; i<services.length; i++){
                var service = services[i];
                var el = $('<li>'+service.device.name+'</li>');
                el.data('service',service);
                el.on('click',onSelectDevice);
                listDevices.append(el);
            }
            setConnectionState('enabled');
        }else{
            setConnectionState('disabled');
        }
    }


    filePhoto.on('change', function(){
        var files = event.target.files;
        var file;
        if (files && files.length > 0) {
            file = files[0];
            var URL = window.URL || window.webkitURL;
            var url = URL.createObjectURL(file);

            $('#photoContainer').css('background-image','none');
            $('#photo').attr('src',url);

            var oMsg = {
                method : 'emit',
                params : {
                    event : 'showPhoto',
                    to    : 'broadcast',
                    data  : {}
                }
            };

            var msgBlob = app.utils.messageToBlob(oMsg, file);
            socket.send(msgBlob);
        }
    });

    btnSelectPhoto.on('click', function(){
        $('#filePhoto').click();
    });

    btnDiscover.on('click', function(){
        devicesContainer.show();
    });
	
	$('.device-list .cancel').on('click', function(){
		devicesContainer.hide();
	});

    window.addEventListener('message', function(event){
       if(event.data && event.data.event === 'discovery.ready'){
           event.source.postMessage({method:'discovery.search'}, "*");
       }else if(event.data && event.data.event === 'discovery.result'){
           console.info('results', event.data.result);
           populateServiceList(event.data.result);
       }else if(event.data && event.data.event === 'discovery.error'){
           console.error('error', event.data.error);
       }
    });

});

