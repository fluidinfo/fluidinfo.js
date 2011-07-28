/**
 * fluidinfo.js - a small and simple client for Fluidinfo written in Javascript.
 *
 * @author <a href="http://twitter.com/onigiri">onigiri</a>, <a href="http://twitter.com/ntoll">ntoll</a> & <a href="http://twitter.com/barshirtcliff">barshirtcliff</a>
 * @version 0.1
 * @constructor
 * @param options {Object} Contains various parameters for the call.
 * returns {Object} An object through which one interacts with Fluidinfo.
 */
Fluidinfo = function(options) {
    session = new Object();

    if(options.instance != undefined && options.instance === "sandbox"){
      session.baseURL = "https://sandbox.fluidinfo.com/";
    } else {
      // default to main instance
      session.baseURL = "https://fluiddb.fluidinfo.com/";
    }

    if((options.username != undefined) && (options.password != undefined)) {
        session.authorizationToken = Base64.encode(options.username + ":" + options.password);
    }

    api = new Object();

    /**
     * Makes an appropriate AJAX request to Fluidinfo
     *
     * @private
     * @param options {Object} Contains various parameters for the call.
     */
    api.ajax = function(options){
      if(session.authorizationToken != undefined){
        var authenticate = true;
        var base64string = session.authorizationToken;
      }
      options.url = session.baseURL+options.url;
      options.async = options.async || true;
      options.contentType = options.contentType || "application/json";
      options.primitive = options.primitive || false;
      options.beforeSend = function(xhrObj){
        if(authenticate){
          xhrObj.setRequestHeader("Authorization","Basic "+ base64string);
        };
        xhrObj.setRequestHeader("Content-Type", options.contentType);
      };
      options.processData = false;
      options.data = options.payload;
      $.ajax(options);
    }

    /**
     * Makes an HTTP GET call to the Fluidinfo API
     *
     */
    api.get = function(options){
      options.type = "GET";
      options.payload = null;
      session.api.ajax(options);
    }

    /**
     * Makes an HTTP POST call to the Fluidinfo API
     *
     */
    api.post = function(options){
      options.type = "POST";
      session.api.ajax(options);
    }

    /**
     * Makes an HTTP PUT call to the Fluidinfo API
     *
     */
    api.put = function(options){
      options.type = "PUT";
      if(options.primitive){
        options.contentType = "application/vnd.fluiddb.value+json";
      }
      session.api.ajax(options);
    }

    /**
     * Makes an HTTP DELETE call to the Fluidinfo API
     *
     */
    api.delete = function(options){
      options.type = "DELETE";
      options.payload = null;
      session.api.ajax(options);
    }

    /**
     * Makes an HTTP HEAD call to the Fluidinfo API
     *
     */
    api.head = function(options){
      options.type = "HEAD";
      options.payload = null;
      session.api.ajax(options);
    }

    session.api = api;

    return session;
}

/* Taken from http://www.webtoolkit.info/javascript-base64.html
*  eventually is going to be moved outside this file
*/

var Base64 = {
	// private property
	_keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
	// public method for encoding
	encode : function (input) {
		var output = "";
		var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
		var i = 0;
		input = Base64._utf8_encode(input);
		while (i < input.length) {
			chr1 = input.charCodeAt(i++);
			chr2 = input.charCodeAt(i++);
			chr3 = input.charCodeAt(i++);
			enc1 = chr1 >> 2;
			enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
			enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
			enc4 = chr3 & 63;
			if (isNaN(chr2)) {
				enc3 = enc4 = 64;
			} else if (isNaN(chr3)) {
				enc4 = 64;
			}
			output = output +
			this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
			this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
		}
		return output;
	},
	// private method for UTF-8 encoding
	_utf8_encode : function (string) {
		string = string.replace(/\r\n/g,"\n");
		var utftext = "";
		for (var n = 0; n < string.length; n++) {
			var c = string.charCodeAt(n);
			if (c < 128) {
				utftext += String.fromCharCode(c);
			}
			else if((c > 127) && (c < 2048)) {
				utftext += String.fromCharCode((c >> 6) | 192);
				utftext += String.fromCharCode((c & 63) | 128);
			}
			else {
				utftext += String.fromCharCode((c >> 12) | 224);
				utftext += String.fromCharCode(((c >> 6) & 63) | 128);
				utftext += String.fromCharCode((c & 63) | 128);
			}
		}
		return utftext;
	}
}
