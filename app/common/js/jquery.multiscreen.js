(function ( $ ) {
 
    $.fn.multiscreen = function( options ) {
		
		//listen for cloud discovery records
		$('body').append('<iframe id="winDiscovery" src="http://dev-multiscreen.samsung.com/discoveryservice/v2/discover" width="1" height="1" style="display: none"></iframe>');
		window.addEventListener('message', function(event){
			if(event.data && event.data.event === 'discovery.ready'){
			
				event.source.postMessage({method:'discovery.search'}, "*");
			
			}else if(event.data && event.data.event === 'discovery.result'){
				
				console.info('results', event.data.result);
				ms.populateServices(event.data.result);
				
			}else if(event.data && event.data.event === 'discovery.error'){
				
				console.error('error', event.data.error);
			
			}
		});
		
        // This is the easiest way to have default options.
		var ms = this;
		
		this.css({
			width: '32px',
			height: '24px'
		});
		
		var defaults = {
			wrapper:{
				attr:{
					id: "deviceWindow"
				},
				css:{
					display				: "none",
					position				: "absolute",
					top					: 0,
					left					: 0,
					width				: "100%",
					height 				: "100%",
					background 		: "rgba(0,0,0,.5)"
				}
			},
			deviceWindow: {
				el: $("<ul />"),
				css: {
					"position" 			: "absolute",
					"width"				: "80%",
					"top"					: "10%",
					"left"					: "10%",
					"z-index"			: 999,
					"background"		: "#333",
					"color"				: "#fff",
					"font-family"		: "Helvetica, Arial, sans-serif",
					"list-style"			: "none",
					"margin"			: 0,
					"padding"			: 0,
				}
			},
			deviceWindowHeader:{
				text: "Connect to a Device",
				css: {
					"font-size" 		: "18px",
					"line-height" 		: "24px",
					"font-weight" 		: "normal",
					"margin" 			: 0,
					"padding" 			: "20px 10px",
					"color" 				: "#fff",
					"border-bottom"	: "1px solid cornflowerblue"
				},
				attr:{
					class: "header"
				}
			},
			deviceWindowItem:{
				css:{
					"border-bottom" : "1px solid #999",
					"padding" 			: "20px 10px"
				}
			},
			deviceWindowCancel:{
				attr:{
					class: "cancel"
				},
				text: "Cancel",
				css: {
					"width" 			: "100%",
					"border-top" 	: "1px solid cornflowerblue",
					"color" 			: "#fff",
					"padding" 		: "20px 0",
					"text-align" 	: "center"
				}
			},
			state: null,
			container: "body"
		};
		
		this.setConnectionState = function(state){
			settings.state = state;
			this.toggleClass(state);
		};
		
		this.onSelectDevice = function(service){
			console.debug(service);
			ms.trigger("deviceSelect", [service]);
			ms.launchApplication(service.uri);
			wrapper.hide();
		};


		this.launchApplication = function(serviceUri){
		
			$.ajax({
				type:"POST",
				url: serviceUri + "webapplication/",
				data: {url: settings.appURL},
				dataType:'json',
				success:function(success){
					ms.connect(serviceUri);
				},
				error: function(error){
					alert('There was an error launching the application. The server responded with : '+error.status + ' : ' +error.statusText);
				}
			});
			
		};
		
		this.connect = function(serviceUri){
			var wsEndpoint = serviceUri.replace("http://", "ws://") + "channels/" + settings.channelName + "?name=" + settings.clientName;
			ms.socket = new WebSocket(wsEndpoint);
			ms.trigger("connect",[ms.socket]);
			ms.socket.onopen = function(evt){ settings.onopen(evt) };
			ms.socket.onclose = function(evt){ settings.onclose(evt) };
			ms.socket.onmessage = function(msg){ settings.onmessage(msg) };
			ms.socket.onerror = function(evt){ settings.onerror(evt) };
		};
		
		var settings = $.extend( true, {}, defaults, options );
		//this.deviceList = $('<div id="ms-wrap"><div id="deviceWindow"><h1>Connect to a Device</h1><ul></ul><div class="cancel" onclick="$(\'#ms-wrap\').hide()">Cancel</div></div></div>');
		this.populateServices = function(services){
			if(services.length > 0){
				
				var deviceList = settings.deviceWindow.el
					.css( settings.deviceWindow.css );
				var deviceListHeader = $("<li />")
					.text( settings.deviceWindowHeader.text )
					.css( settings.deviceWindowHeader.css )
					.attr( settings.deviceWindowHeader.attr )
					.appendTo(deviceList);
				
				$(services).each(function(index, service){
					var el = $('<li>'+service.device.name+'</li>');
					el.attr("class", "device");
					el.css( settings.deviceWindowItem.css );
					el.data('service',service);
					el.on('click',function(evt){
						ms.onSelectDevice(service);
						ms.setConnectionState("connected");
					});
					deviceList.append(el);
				
				});
				
				var deviceWindowCancel = $("<li />")
					.text( settings.deviceWindowCancel.text )
					.css( settings.deviceWindowCancel.css )
					.attr( settings.deviceWindowCancel.attr )
					.on("click", function(){
						wrapper.hide();
					})
					.appendTo(deviceList);
				
				wrapper.append(deviceList);
				
				this.removeClass('disabled');
				this.addClass('enabled');
			}else{
				//no services found
			}
		};
		
		var wrapper = $("<div />")
				.attr( settings.wrapper.attr )
				.css( settings.wrapper.css )
				.appendTo( $(settings.container) );
				
		this.on("click", function(){
			wrapper.show();
		});
		
    };
 
}( jQuery ));