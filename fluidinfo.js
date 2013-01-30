/**
 * fluidinfo.js - a small and simple client for Fluidinfo written in Javascript.
 *
 * @author <a href="http://twitter.com/onigiri">onigiri</a>, <a href="http://twitter.com/ntoll">ntoll</a>, <a href="http://twitter.com/barshirtcliff">barshirtcliff</a> and <a href="http://twitter.com/jkakar">jkakar</a>
 * @version 0.1
 * @constructor
 * @param options {Object} Contains various parameters for the new session with
 * Fluidinfo.
 * <dl>
 *   <dt>username</dt>
 *   <dd>The username to use when authenticating with Fluidinfo.</dd>
 *   <dt>password</dt>
 *   <dd>The password to use when authenticating with Fluidinfo</dd>
 *   <dt>instance</dt>
 *   <dd>The instance to connect to. Either "main", "sandbox" or a bespoke
 *  instance. Defaults to "main".</dd>
 * </dl>
 * returns {Object} An object through which one interacts with Fluidinfo.
 */
var fluidinfo = function(options) {
    /**
     * Returns a clone of the supplied object.
     *
     * It is possible (although unlikely) that this method could get into an
     * infinite loop. TODO: Refactor this out.
     */
    var clone = function(obj) {
        if (obj === null || typeof(obj) !== 'object') {
            return obj;
        }
        var temp = obj.constructor();
        for (var key in obj) {
            if (typeof(obj[key]) === "object") {
                temp[key] = clone(obj[key]);
            } else {
                temp[key] = obj[key];
            }
        }
        return temp;
    };

    /**
    Quote an about value to make it suitable for use in a fluiddb/about="..."
    type query.
    */
    var quoteAbout = function(s) {
        return s.replace(/\\/g, '\\\\').replace(/\"/g, '\\"');
    };

    /**
     * Encodes strings into base64. Adapted from:
     * http://www.webtoolkit.info/javascript-base64.html
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
                else if ((c > 127) && (c < 2048)) {
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
    };

    /**
     * Represents a session with Fluidinfo.
     */
    var session = {};
    var authorizationBase64Fragment = '';
    var OAuthAccessToken = '';

    if (options) {
        if (options.instance) {
            switch(options.instance.toLowerCase()) {
            case "main":
                session.baseURL = "https://fluiddb.fluidinfo.com/";
                break;
            case "sandbox":
                session.baseURL = "https://sandbox.fluidinfo.com/";
                break;
            default:
                // validate the bespoke instance
                var urlRegex = /^(http|https):\/\/.+\/$/;
                if (urlRegex.exec(options.instance)) {
                    session.baseURL = options.instance;
                } else {
                    throw {
                        name: "ValueError",
                        message: "The URL must start with http[s]:// and have a trailing slash ('/') to be valid. E.g. https://localhost/"
                    };
                }
            }
        }
        if (options.access_token !== undefined){
            OAuthAccessToken = options.access_token;
        }
        if ((options.username !== undefined) && (options.password !== undefined)) {
            authorizationBase64Fragment = Base64.encode(
                options.username + ":" + options.password);
            // Makes sure the logged in user's username is available via the
            // username attribute
            session.username = options.username;
        }
    }

    // Catch-all to make sure the library defaults to the main instance
    if (session.baseURL === undefined){
        session.baseURL = "https://fluiddb.fluidinfo.com/";
    }

    /**
     * Magic voodoo used to identify an array (potentially a Fluidinfo set).
     * Taken from page 61 of Doug Crockford's "Javascript: The Good Parts".
     *
     * @param value A value that might be an array.
     * @return {boolean} An indication if the value is an array.
     */
    function isArray(value) {
        return Object.prototype.toString.apply(value) === "[object Array]";
    }

    /**
     * Given a path that is expressed as an array of path elements, will
     * return the correctly encoded URL. e.g. ["a", "b", "c"] -> "/a/b/c"
     *
     * @param value {Array} A list of values to be appropriately encoded
     * between '/' values.
     * @return {string} The appropriately encoded URL.
     */
    function encodeURL(path) {
        var i, result = "";
        for (i = 0; i < path.length; i++) {
            result += "/" + encodeURIComponent(path[i]);
        }
        return result.slice(1); // chops the leading slash
    }

    /**
     * Checks the passed value to discover if it's a Fluidinfo "primitive"
     * type. See <a href="http://doc.fluidinfo.com/fluidDB/api/tag-values.html">
     * the Fluidinfo docs</a> for <a href="http://bit.ly/hmrMzT">more
     * information</a> on Fluidinfo's types.
     *
     * @param value A value whose "type" needs identifying
     * @return A boolean indication if the value is a Fluidinfo primitive type.
     */
    function isPrimitive(value) {
        // check the easy type matches first
        var valueType = typeof(value);
        var primitiveTypes = ["number", "string", "boolean"];
        var i;
        for (i = 0; i < primitiveTypes.length; i++) {
            if (valueType === primitiveTypes[i]) {
                return true;
            }
        }
        // A null value is also a primitive
        if (value === null) {
            return true;
        }
        // check for an array (potential set) and validate it only contains
        // strings (currently multi-type arrays are not allowed)
        if (isArray(value)) {
            for (i = 0; i < value.length; i++) {
                var memberType = typeof(value[i]);
                if (memberType !== "string") {
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
    function detectContentType(options) {
        // a "PUT" to objects/ or about/ endpoints means dealing with the MIME
        // of a tag-value. If no MIME type is passed in the options objects
        // then check if the value is a Fluidinfo primitive type. Otherwise
        // complain.
        var result = null;
        if (options.type === "PUT" && (options.path.match("^objects\/") ||
                                       options.path.match("^about\/"))) {
            if (options.contentType){
                result = options.contentType;
            } else if (isPrimitive(options.data)) {
                result = "application/vnd.fluiddb.value+json";
            } else {
                throw {name: "ValueError",
                       message: "Must supply Content-Type"};
            }
        } else if (options.data) {
            // all other requests to the API that have payloads will
            // be passing JSON
            result = "application/json";
        }
        return result;
    }

    /**
     * Given a value from a Content-Type header, will return a boolean
     * indication if the associated content is JSON.
     *
     * @param contentType {string} The MIME value associated with the content
     * @result {boolean} An indication if the associated content is JSON
     */
    function isJSONData(contentType) {
        return contentType && (
            contentType === "application/json" ||
            contentType === "application/vnd.fluiddb.value+json");
    }

    /**
     * Given an object representing the arguments to append to a URL
     * will return an appropriately encoded string representation.
     */
    function createArgs(args) {
        var result = "";
        if (args) {
            var arg;
            for (arg in args) {
                if (typeof args[arg] !== "function") {
                    if (isArray(args[arg])) {
                        var j;
                        for (j = 0; j <args[arg].length; j++) {
                            result += "&" + encodeURIComponent(arg) + "=" +
                                      encodeURIComponent(args[arg][j]);
                        }
                    } else {
                        result += "&" + encodeURIComponent(arg) + "=" +
                                  encodeURIComponent(args[arg]);
                    }
                }
            }
            result = "?" + result.slice(1);
        }
        return result;
    }

    /**
     * Returns an object representing the headers returned from Fluidinfo
     */
    function getHeaders(xhr) {
        var result = {};
        var rawHeaders = xhr.getAllResponseHeaders();
        // Turn the result into an object
        if (rawHeaders){ // Mozilla doesn't like getAllResponseHeaders
            var i;
            // Split on newline only, even though a proper HTTP
            // request separates headers with \r\n, because the header
            // blob only has newline when parsed in a Firefox extension.
            var splitHeaders = rawHeaders.split("\n");
            for (i = 0; i < splitHeaders.length; i++){
                var rawHeader = splitHeaders[i];
                if (rawHeader.length > 0) {
                    var splitHeader = rawHeader.split(": ");
                    var value = splitHeader[1].trim();
                    result[splitHeader[0].toLowerCase()] = value;
                }
            }
        } else {
            // Attempt to get the content type from the header (due to Mozilla
            // bug.
            var contentType = xhr.getResponseHeader("content-type");
            if (contentType){
                result["content-type"] = contentType;
            }
        }
        return result;
    }

    /**
     * Returns an appropriate XMLHttpRequest Object depending on the browser.
     * Based upon code from here:
     * http://www.quirksmode.org/js/xmlhttp.html
     */
    function createXMLHTTPObject() {
        var XMLHttpFactories = [
            function () {return new XMLHttpRequest();},
            function () {return new ActiveXObject("Msxml2.XMLHTTP");},
            function () {return new ActiveXObject("Msxml3.XMLHTTP");},
            function () {return new ActiveXObject("Microsoft.XMLHTTP");}
        ];
        var xhr = false;
        for (var i = 0; i < XMLHttpFactories.length; i++) {
            try {
                xhr = XMLHttpFactories[i]();
            } catch(e) {
                continue;
            }
            break;
        }
        return xhr;
    }

    /**
     * Builds a simplified (nice to use) result object
     * @param xhr {Object} the XmlHttpRequest instance from which to build the
     * result.
     */
    function createNiceResult(xhr) {
        // build a simple result object
        var result = {};
        result.status = xhr.status;
        result.statusText = xhr.statusText;
        result.headers = getHeaders(xhr);
        result.rawData = xhr.responseText;
        if (isJSONData(result.headers['content-type'])) {
            result.data = JSON.parse(xhr.responseText);
        } else {
            result.data = xhr.responseText;
        }
        result.request = xhr;
        return result;
    }

    /**
     * Sends an appropriate XMLHTTPRequest based request to Fluidinfo.
     * @param options {Object} An object containing the following named
     * options:
     * <dl>
     *  <dt>type</dt>
     *  <dd>The request's HTTP method. [GET, POST, PUT, DELETE or HEAD]</dd>
     *  <dt>url</dt>
     *  <dd>The full URL of the resource to which the request is made.</dd>
     *  <dt>data</dt>
     *  <dd>The body of data that may be the payload of the request (in the
     *  case of POST and PUT requests).</dd>
     *  <dt>async</dt>
     *  <dd>Indicates if the request is to be asyncronous (default is true)</dd>
     *  <dt>onSuccess</dt>
     *  <dd>A function that takes the XHR request as an argument. Called upon
     *  successful completion of the request.</dd>
     *  <dt>onError</dt>
     *  <dd>A function that takes the XHR request as an argument. Called when
     *  the request resulted in an error.</dd>
     * </dl>
     *
     */
    function sendRequest(options) {
        if (isArray(options.path)) {
            options.path = encodeURL(options.path);
        }
        var method = options.type.toUpperCase() || "GET";
        var args = createArgs(options.args);
        var url = session.baseURL + options.path + args;
        var async = true;
        if (options.async !== undefined) {
            async = options.async;
        }
        var xhr = createXMLHTTPObject();
        if (!xhr) {
            return undefined;
        }
        xhr.open(method, url, async);
        if (OAuthAccessToken === ''){
            // Basic Auth
            if (authorizationBase64Fragment !== ''){
                xhr.setRequestHeader('Authorization',
                                     'basic ' + authorizationBase64Fragment);
            }
        }
        else {
            // OAuth2
            xhr.setRequestHeader('X-FluidDB-Access-Token', OAuthAccessToken);
            if (authorizationBase64Fragment === ''){
                // The Consumer is the anonymous user.
                xhr.setRequestHeader('Authorization', 'oauth2');
            }
            else {
                // Use a specific Consumer.
                xhr.setRequestHeader('Authorization',
                                     'oauth2 ' + authorizationBase64Fragment);
            }
        }
        var contentType = detectContentType(options);
        if (contentType) {
            xhr.setRequestHeader("content-type", contentType);
            if (isJSONData(contentType)) {
                options.data = JSON.stringify(options.data);
            }
        }
        try {
            var handleResult = function() {
                var result = createNiceResult(xhr);
                if (xhr.status < 300) {
                    // process a good result.
                    if (options.onSuccess){
                        options.onSuccess(result);
                    }
                } else if (options.onError) {
                    // handle problems nicely.
                    options.onError(result);
                }
            };

            // A hack due to bugs in Android browsers
            var isAndroid =
                navigator.userAgent.toLowerCase().indexOf("android") >= 0;
            if('onprogress' in xhr && !isAndroid) {
                // DANGER Be very careful here.  This branch is not
                // tested by the FakeXHRHttpRequest we use in tests!
                if (options.onError) {
                    xhr.onerror = function() {
                        // handle problems nicely.
                        var result = createNiceResult(xhr);
                        options.onError(result);
                    };
                }
                xhr.onload = function() {
                    // process a good result.
                    handleResult();
                };
            } else {
                xhr.onreadystatechange = function() {
                    // Old skool handling of XHR for older browsers.
                    if (xhr.readyState !== 4) return;
                    handleResult();
                };
            }
        } catch (e) {
            // Browser is IE6 or 7 so can't do cross origin requests anyway.
            return undefined;
        }
        xhr.send(options.data);
        if (!async) {
            var result = createNiceResult(xhr);
            return result;
        }
        return undefined;
    }

    /**
     * Contains functions to facilitate the calling of the Fluidinfo REST API.
     */
    var api = {};

    /**
     * Makes an HTTP GET call to the Fluidinfo API
     *
     */
    api.get = function(opts){
        var options = clone(opts);
        options.type = "GET";
        options.data = null;
        return sendRequest(options);
    };

    /**
     * Makes an HTTP POST call to the Fluidinfo API
     *
     */
    api.post = function(opts){
        var options = clone(opts);
        options.type = "POST";
        return sendRequest(options);
    };

    /**
     * Makes an HTTP PUT call to the Fluidinfo API
     *
     */
    api.put = function(opts){
        var options = clone(opts);
        options.type = "PUT";
        return sendRequest(options);
    };

    /**
     * Makes an HTTP DELETE call to the Fluidinfo API
     *
     */
    api.del = function(opts){
        var options = clone(opts);
        options.type = "DELETE";
        options.data = null;
        return sendRequest(options);
    };

    /**
     * Makes an HTTP HEAD call to the Fluidinfo API.
     *
     */
    api.head = function(opts){
        var options = clone(opts);
        options.type = "HEAD";
        options.data = null;
        return sendRequest(options);
    };

    session.api = api;

    /**
     * Easily gets results from Fluidinfo.
     */
    session.query = function(opts) {
        var options = clone(opts);
        // process the options
        if (options.select === undefined) {
            throw {
                name: "ValueError",
                message: "Missing select option."
            };
        }
        if (options.where === undefined) {
            throw {
                name: "ValueError",
                message: "Missing where option."
            };
        }

        /**
         * Takes the raw result from Fluidinfo and turns it into an easy-to-use
         * array of useful objects representing the matching results then calls
         * the onSuccess function with the newly created array.
         *
         * @param {Object} The raw result from Fluidinfo that is to be
         * processed.
         */
        var processResult = function(raw) {
            var result = [];
            var data = raw.data.results;
            var objectID;
            for (objectID in data.id){
                if (typeof data.id[objectID] !== "function") {
                    var tag, obj = {};
                    obj.id = objectID;
                    for (tag in data.id[objectID]) {
                        if (typeof data.id[objectID][tag] !== "function") {
                            if (data.id[objectID][tag].value !== undefined) {
                                // primitive value
                                obj[tag] = data.id[objectID][tag].value;
                            } else {
                                // opaque value
                                obj[tag] = data.id[objectID][tag];
                                // add a URL to the opaque value
                                obj[tag].url =
                                    session.baseURL + "objects/" + objectID +
                                    "/" + tag;
                            }
                        }
                    }
                    result[result.length] = obj;
                }
            }
            raw.data = result;
            if (options.onSuccess){
                options.onSuccess(raw);
            }
        };

        var args = {query: options.where};
        if (options.select !== undefined) {
            args.tag = options.select;
        } else {
            args.tag = "*";
        }

        // Make the appropriate call to Fluidinfo
        this.api.get({path: "values", args: args,
                      onSuccess: processResult, onError: options.onError});
    };

    /**
     * Easily updates objects in Fluidinfo.
     */
    session.update = function(opts) {
        var options = clone(opts);
        // process the options
        if (options.values === undefined) {
            throw {
                name: "ValueError",
                message: "Missing values option."
            };
        }
        if (options.where === undefined) {
            throw {
                name: "ValueError",
                message: "Missing where option."
            };
        }
        var payload = {},
            queries = [],
            updateSpecification = [];
        updateSpecification[0] = options.where;
        var val, valueSpec = {};
        for (val in options.values){
            if (typeof options.values[val] !== "function") {
                if(options.values[val] === undefined) {
                    valueSpec[val]= {value: null};
                } else {
                    valueSpec[val]= {value: options.values[val]};
                }
            }
        }
        updateSpecification[1] = valueSpec;
        queries[0] = updateSpecification;
        payload.queries = queries;
        // Make the appropriate call to Fluidinfo
        this.api.put({path: "values", data: payload,
                      onSuccess: options.onSuccess, onError: options.onError});
    };

    /**
     * Easily tag a specified object
     */
    session.tag = function(opts) {
        var options = clone(opts);
        if (options.about === undefined && options.id === undefined) {
            throw {
                name: "ValueError",
                message: "Supply either an 'about' or 'id' specification."
            };
        }
        if (options.about) {
            options.where = 'fluiddb/about="' + options.about + '"';
        } else if (options.id) {
            options.where = 'fluiddb/id="' + options.id + '"';
        }
        this.update(options);
    };

    /**
     * Easily delete tag-value instances from Fluidinfo using a query to
     * /values.
     */
    session.del = function(opts) {
        var options = clone(opts);
        if (options.tags === undefined) {
            throw {
                name: "ValueError",
                message: "Missing tags option."
            };
        }
        if (options.where === undefined) {
            throw {
                name: "ValueError",
                message: "Missing where option."
            };
        }

        options.path = "values";
        options.args = {
            query: options.where,
            tag: options.tags
        };
        this.api.del(options);
    };

    /**
     * Get tags for a specific object
     */
    session.getObject = function(opts) {
        var options = clone(opts);
        if (options.about === undefined && options.id === undefined) {
            throw {
                name: "ValueError",
                message: "Supply either an 'about' or 'id' specification."
            };
        }
        if (options.about) {
            options.where = 'fluiddb/about="' + quoteAbout(options.about) + '"';
        } else if (options.id) {
            options.where = 'fluiddb/id="' + options.id + '"';
        }

        var userOnSuccess = options.onSuccess;
        /**
         * Takes the result of a call to query() and builds an appropriate
         * result.
         */
        var processResult = function(result) {
            if (result.data.length === 1) {
                result.data = result.data[0];
                if (userOnSuccess){
                    userOnSuccess(result);
                }
            } else if (result.data.length === 0) {
                // no data returned so just pass an empty object
                result.data = [];
                if (userOnSuccess){
                    userOnSuccess(result);
                }
            } else {
                if (options.onError){
                    options.onError(result);
                }
            }
        };
        options.onSuccess = processResult;
        // call the query function
        session.query(options);
    };

    /**
     * Enables a user to create a new object about something
     */
    session.createObject = function(opts) {
        var options = clone(opts);
        if (!authorizationBase64Fragment && !OAuthAccessToken) {
            throw {
                name: "AuthorizationError",
                message: "You must be signed in to create a new object."
            };
        }
        if (options.about) {
            options.path = ["about", options.about];
        } else {
            options.path = "objects";
        }
        var userOnSuccess = options.onSuccess;
        var onSuccess = function(result) {
            var newObject = {};
            if (options.about){
                newObject["fluiddb/about"] = options.about;
            }
            newObject.id = result.data.id;
            result.data = newObject;
            if (userOnSuccess){
                userOnSuccess(result);
            }
        };
        options.onSuccess = onSuccess;
        session.api.post(options);
    };

    /**
     * Finds the most recent 20 tags and values on the specified objects
     * (using either id, about or query) or created by the given user.
     */
    session.recent = function(opts) {
        var options = clone(opts);
        if (options === undefined) {
            options = {};
        }

        if (options.about) {
            options.path = ["recent", "about", options.about];
        } else if (options.id) {
            options.path = ["recent", "objects", options.id];
        } else if (options.where) {
            options.path = ["recent", "objects"];
            options.args = {"query": options.where};
        } else if (options.user) {
            options.path = ["recent", "users", options.user];
        } else if (options.whereUsers) {
            options.path = ["recent", "users"];
            options.args = {"query": options.whereUsers};
        } else {
            throw {
                name: "ValueError",
                message: "Supply either an 'about', 'id', 'where',  " +
                         "'user' or 'whereUser' to look up."
            };
        }

        var userOnSuccess = options.onSuccess;
        /**
         * Takes the raw result from Fluidinfo and turns it into an easy-to-use
         * array of useful objects representing the matching results then calls
         * the onSuccess function with the newly created array.
         *
         * @param {Object} The raw result from Fluidinfo that is to be
         * processed.
         */
        var processResult = function(raw) {
            var result = [];
            var data = raw.data;
            var i;
            for (i = 0; i < data.length; i++){
                var obj = data[i];
                obj.date = new Date(obj["updated-at"]);
                if (obj.value !== null &&
                    obj.value["value-type"] !== undefined) {
                    // opaque value
                    obj.value.url =
                        session.baseURL + "objects/" + obj.id +
                        "/" + obj.tag;
                }
                result.push(obj);
            }
            raw.data = result;
            if (userOnSuccess){
                userOnSuccess(raw);
            }
        };
        options.onSuccess = processResult;
        session.api.get(options);
    };

    return session;
};
