$(function(){

    var btnSelectPhoto  = $("#btnSelectFile");
    var filePhoto       = $("#filePhoto");

    var msf = $.msf({
        castButton          : "#btnCast",
        container           : "#cntContainer",
        appId               : window.location.href.replace('/mobile','/smarttv'),
        channelId           : "photoshare",
        autoDiscover        : true,
        exitOnDisconnect    : true
    });

    msf.on('connect', function(evt, data){
        console.info('connected!');
        btnSelectPhoto.show();
    });

    msf.on('disconnect', function(evt, data){
        console.warn('disconnected!');
        btnSelectPhoto.hide();
    });

    msf.on('error', function(error){
        console.error(error.message);
    });

    btnSelectPhoto.on('click', function(){
        filePhoto.click();
    });

    filePhoto.on('change', function(event){
        var files = event.target.files;
        var file;
        if (files && files.length > 0) {
            file = files[0];
            var URL = window.URL || window.webkitURL;
            var url = URL.createObjectURL(file);

            $('#photoContainer').css("background-image","none");
            $('#photo').attr('src',url);

            var oMsg = {
                method : 'emit',
                params : {
                    event : 'showPhoto',
                    to    : 'broadcast',
                    data  : {}
                }
            };

            msf.emit(oMsg, file);
        }
    });

});