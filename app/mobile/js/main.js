$(function(){

    var btnSelectPhoto = $('#btnSelectFile');
    var filePhoto = $('#filePhoto');
		
	var socket;
	
	var btnDiscover = $('#btnDiscover').multiscreen({
		channelName: 'photoshare',
		appURL: "http://dev-multiscreen-examples.s3-website-us-west-1.amazonaws.com/examples/photoshare/smarttv/",
		clientName: "WheezyMobile",
		onopen : function (evt) {
            console.info("websocket open", evt);
            btnSelectPhoto.show();
        },
		onclose : function (evt) {
            console.warn("websocket close");
            //setConnectionState('enabled');
            btnSelectPhoto.hide();
        },
		onerror : function (evt) {
            console.error(arguments);
        },
        onmessage : function (msg) {
            msg = JSON.parse(msg.data);
            console.debug('websocket message : ', msg);
        }
	});
	
	$('#btnDiscover').on('connect', function(evt, ws){
		socket = ws;
	});
	
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
	
});

