var app = app || {};

app.utils = {

    messageToBlob : function(oMsg, payload)  {

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
    },

    messageFromArrayBuffer : function(buffer) {

        var json = '';
        var view = new DataView(buffer);
        var msgByteLen = view.getUint16(0);

        //String.fromCharCode.apply(null, new Uint16Array(buf));

        for (var i = 0; i < msgByteLen; i++) {
            json += String.fromCharCode(view.getUint8(i+2));
        }

        var payload = buffer.slice(2+msgByteLen);
        var message = JSON.parse(json);

        return {payload : payload, message : message};
    }

};