$(function(){

    var currentImg;
    var imgContainer = $('#imgContainer');
    var socket = new WebSocket('ws://127.0.0.1:8001/api/v2/channels/photoshare');

    socket.binaryType = "arraybuffer";

    socket.onopen = function () {
        console.info("websocket open");
    };

    socket.onclose = function () {
        console.warn("websocket close");
    };

    socket.onerror = function () {
        console.error(arguments);
    };

    socket.onmessage = function (msg) {
        var message;
        var decoded;
        var isBinary = msg.data instanceof ArrayBuffer;

        if(isBinary){
            decoded = app.utils.messageFromArrayBuffer(msg.data);
            message = decoded.message;
        }else{
            message = JSON.parse(msg.data);
        }

        if(message.event === 'showPhoto') showPhoto(decoded.payload);
    };


    function showPhoto(abPhoto){

        var photoBlob = new Blob([abPhoto]);
        var URL = window.URL || window.webkitURL;
        var url = URL.createObjectURL(photoBlob);

        var img = $('<img>');
        img.attr('src', url);
        img.one('load',onImageLoad);

    }

    function onImageLoad(){

        var newImg = $(this);
        newImg.appendTo(imgContainer);

        // Now we can clean up the url;
        //var URL = window.URL || window.webkitURL;
        //URL.revokeObjectURL(newImg.attr('src'));

        if(currentImg){
            currentImg.addClass("fadeOut");
            currentImg.one('webkitTransitionEnd', function() {
                currentImg.remove();
                newImg.addClass("fadeIn");
                currentImg = newImg;
            });
        }else{
            imgContainer.removeClass('waiting');
            newImg.addClass("fadeIn");
            currentImg = newImg;
        }
    }

});

