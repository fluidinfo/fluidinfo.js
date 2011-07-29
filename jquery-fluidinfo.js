/**
 * fluidinfo.js - a small and simple client for Fluidinfo written in Javascript.
 *
 * @author <a href="http://twitter.com/onigiri">onigiri</a>, <a href="http://twitter.com/ntoll">ntoll</a> & <a href="http://twitter.com/barshirtcliff">barshirtcliff</a>
 * @version 0.1
 * @constructor
 * @param options {Object} Contains various parameters for the call.
 * returns {Object} An object through which one interacts with Fluidinfo.
 */
fluidinfo = function(options) {
    session = new Object();

    if(options) {
      if(options.instance) {
        switch(options.instance.toLowerCase()) {
          case "main":
            session.baseURL = "https://fluiddb.fluidinfo.com/";
            break;
          case "sandbox":
            session.baseURL = "https://sandbox.fluidinfo.com/";
            break;
          default:
              // validate the bespoke instance
              var urlRegex = /^(http|https):\/\/[\w\-_\.]+\/$/;
              if(urlRegex.exec(options.instance)) {
                session.baseURL = options.instance;
              } else {
                throw {
                  name: "ValueError",
                  message: "The URL must start with http[s]:// and have a trailing slash ('/') to be valid. E.g. https://localhost/"
                };
              }
        }
      }

      if((options.username != undefined) && (options.password != undefined)) {
        session.authorizationToken = Base64.encode(options.username + ":" + options.password);
      }
    }

    // Catch-all to make sure the library defaults to the main instance
    if(session.baseURL === undefined){
      session.baseURL = "https://fluiddb.fluidinfo.com/";
    }

    var utils = new Object();

    /**
     * Magic voodoo used to identify an array (potentially a Fluidinfo set).
     * Taken from page 61 of Doug Crockford's "Javascript: The Good Parts".
     *
     * @param value A value that might be an array.
     * @return {boolean} An indication if the value is an array.
     */
    utils.isArray = function(value) {
      return Object.prototype.toString.apply(value) === "[object Array]";
    };

    /**
     * Given a path that is expressed as an array of path elements, will
     * return the correctly encoded URL. e.g. ["a", "b", "c"] -> "/a/b/c"
     *
     * @param value {Array} A list of values to be appropriately encoded between
     * '/' values.
     * @return {string} The appropriately encoded URL.
     */
    utils.encodeURL = function(path) {
      var result = "";
      for(i=0; i<path.length; i++) {
        result += "/" + encodeURIComponent(path[i]);
      }
      return result.slice(1); // chops the leading slash
    };

    /**
     * Checks the passed value to discover if it's a Fluidinfo "primitive"
     * type. See <a href="http://doc.fluidinfo.com/fluidDB/api/tag-values.html">
     * the Fluidinfo docs</a> for <a href="http://bit.ly/hmrMzT">more
     * information</a> on Fluidinfo's types.
     *
     * @param value A value whose "type" needs identifying
     * @return A boolean indication if the value is a Fluidinfo primitive type.
     */
    utils.isPrimitive = function(value) {
      // check the easy type matches first
      var valueType = typeof(value);
      var primitiveTypes = ["number", "string", "boolean"];
      for(i=0; i<primitiveTypes.length; i++) {
        if(valueType === primitiveTypes[i]) {
          return true;
        }
      }
      // A null value is also a primitive
      if(value===null) {
        return true;
      }
      // check for an array (potential set) and validate it only contains
      // strings (currently multi-type arrays are not allowed)
      if(utils.isArray(value)) {
        for(i=0; i<value.length; i++) {
          memberType = typeof(value[i]);
          if(memberType !== "string") {
            return false;
          }
        }
        return true;
      }
      // value hasn't matched any of the primitive checks
      return false;
    }

    /**
     * Given the options describing a request, will return the most appropriate
     * MIME to set as the value for the Content-Type header
     *
     * @param options {Object} Contains various parameters describing the
     * request.
     * @return the most appropriate MIME to use of null if not appropriate /
     * required.
     */
    utils.detectContentType = function(options) {
      // a "PUT" to objects/ or about/ endpoints means dealing with the MIME
      // of a tag-value. If no MIME type is passed in the options objects
      // then check if the value is a Fluidinfo primitive type. Otherwise
      // complain.
      var result = null;
      if(options.type==="PUT" && (options.url.match("^objects\/") || options.url.match("^about\/"))) {
        if(options.contentType){
          result = options.contentType;
        } else if (api.utils.isPrimitive(options.data)) {
          result = "application/vnd.fluiddb.value+json";
        } else {
          throw { name: "ValueError", message: "Must supply Content-Type"};
        }
      } else if (options.data) {
        // all other requests to the API that have payloads will be passing JSON
        result = "application/json";
      }
      return result;
    }

    var api = new Object();

    api.utils = utils;

    /**
     * Makes an appropriate AJAX request to Fluidinfo
     *
     * @private
     * @param options {Object} Contains various parameters for the call.
     */
    api.ajax = function(options){
      options.contentType = api.utils.detectContentType(options);
      if(api.utils.isArray(options.url)) {
        options.url = api.utils.encodeURL(options.url);
      }
      options.url = session.baseURL+options.url;
      options.async = options.async || true;
      options.beforeSend = function(xhrObj){
        if(session.authorizationToken != undefined){
          xhrObj.setRequestHeader("Authorization","Basic " + session.authorizationToken);
        };
        if(options.contentType) {
          xhrObj.setRequestHeader("Content-Type", options.contentType);
        }
      };
      options.processData = false;
      $.ajax(options);
    }

    /**
     * Makes an HTTP GET call to the Fluidinfo API
     *
     */
    api.get = function(options){
      options.type = "GET";
      options.data = null;
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
      session.api.ajax(options);
    }

    /**
     * Makes an HTTP DELETE call to the Fluidinfo API
     *
     */
    api.delete = function(options){
      options.type = "DELETE";
      options.data = null;
      session.api.ajax(options);
    }

    /**
     * Makes an HTTP HEAD call to the Fluidinfo API
     *
     */
    api.head = function(options){
      options.type = "HEAD";
      options.data = null;
      session.api.ajax(options);
    }

    session.api = api;

    return session;
}

/**
 * Taken from http://www.webtoolkit.info/javascript-base64.html
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
