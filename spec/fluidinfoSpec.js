/**
 * Some BDD style tests. The point is that reading these should be like
 * reading some sort of specification for the application being tested.
 */

/**
 * Describes the behaviour expected of a standard AJAX request from the library.
 */
function it_should_be_a_standard_ajax_request() {

  it("should send one request", function() {
    expect(this.server.requests.length)
      .toEqual(1);
  });

  it("should point to the correct domain", function() {
    expect(this.server.requests[0].url)
      .toContain(fi.baseURL);
  });
};

/**
 * Ensures that the latest request contained no payload.
 */
function it_should_have_an_empty_payload () {
  it("should have an empty payload", function() {
    expect(this.server.requests[0].data)
      .toEqual(null);
  });
}

/**
 * Ensures that the last request was appropriately authenticated.
 */
function it_should_be_authenticated() {
  it("should be an authorized request", function() {
    expect(this.server.requests[0].requestHeaders['Authorization'])
      .not.toEqual(undefined);
  });
}

/**
 * Ensures that the last request had the correct content-type sent
 *
 * @param type {String} the expected value of the Content-Type
 */
function it_should_have_a_content_type_of(type) {
  it("should have the content-type: "+type, function() {
    expect(this.server.requests[0].requestHeaders['Content-Type'])
      .toContain(type); // toContain avoids regex
  });
}

/**
 * Encapsulates tests that describe the expected behaviour of the Fluidinfo
 * library.
 */
describe("Fluidinfo.js", function() {

  beforeEach(function() {
    this.server = sinon.fakeServer.create();
    this.xhr = sinon.useFakeXMLHttpRequest();
    fi = fluidinfo({ username: "username",
                     password: "password"
                   });
  });

  /**
   * Describes the expected behaviour of a new Fluidinfo session object.
   */
  describe("Configuration", function() {

    it("should default to point to the main instance", function() {
      expect(fi.baseURL).toEqual("https://fluiddb.fluidinfo.com/");
      expect(fi.authorizationToken).not.toEqual(undefined);
    });

    it("should set the lib to point to the main instance", function() {
      fi = fluidinfo({ username: "username",
                       password: "password",
                       instance: "main"
                     });
      expect(fi.baseURL).toEqual("https://fluiddb.fluidinfo.com/");
    });

    it("should set the lib to point to the sandbox", function() {
      fi = fluidinfo({ username: "username",
                       password: "password",
                       instance: "sandbox"
                     });
      expect(fi.baseURL).toEqual("https://sandbox.fluidinfo.com/");
    });

    it("should set the lib to point to any other instance", function() {
      fi = fluidinfo({instance: "https://localhost/"});
      expect(fi.baseURL).toEqual("https://localhost/");
    });

    it("should validate bespoke instances are valid addresses", function() {
      // missing http[s]:// and trailing slash
      try {
        fi = fluidinfo({instance: "localhost"});
      } catch(e) {
        var exception = e;
      }
      expect(exception.name).toEqual("ValueError");
      // missing the trailing slash
      try {
        fi = fluidinfo({instance: "http://localhost"});
      } catch(e) {
        var exception = e;
      }
      expect(exception.name).toEqual("ValueError");
      // missing http[s]://
      try {
        fi = fluidinfo({instance: "localhost/"});
      } catch(e) {
        var exception = e;
      }
      expect(exception.name).toEqual("ValueError");
      // valid case
      fi = fluidinfo({instance: "https://localhost/"});
      expect(fi.baseURL).toEqual("https://localhost/");
    });

    it("should work as anonymous user", function() {
      fi = fluidinfo();
      expect(fi.baseURL).toEqual("https://fluiddb.fluidinfo.com/");
      expect(fi.authorizationToken).toEqual(undefined);
    });
  });

  /**
   * Describes the behaviour of functions that allow direct reference to
   * REST API endpoints.
   */
  describe("API", function() {

    describe("Request configuration", function() {
      it("should correctly use the full URL", function() {
        var options = new Object();
        options.url = "objects/fakeObjectID/username/tag";
        fi.api.get(options);
        expected = "https://fluiddb.fluidinfo.com/objects/fakeObjectID/username/tag";
        actual = this.server.requests[0].url;
        expect(actual).toEqual(expected);
      });

      it("should correctly set content-type on a primitive value PUT to the /objects endpoint", function() {
        var options = new Object();
        options.url = "objects/fakeObjectID/username/tag";
        options.data = 1.234;
        fi.api.put(options);
        expected = "application/vnd.fluiddb.value+json";
        actual = this.server.requests[0].requestHeaders['Content-Type'];
        expect(actual).toContain(expected);
      });

      it("should correctly set content-type on a primitive value PUT to the /about endpoint", function() {
        var options = new Object();
        options.url = "about/fakeAboutValue/username/tag";
        options.data = 1.234;
        fi.api.put(options);
        expected = "application/vnd.fluiddb.value+json";
        actual = this.server.requests[0].requestHeaders['Content-Type'];
        expect(actual).toContain(expected);
      });

      it("should correctly set content-type on a passed in MIME as PUT to the /objects endpoint", function() {
        var options = new Object();
        options.url = "objects/fakeObjectID/username/tag";
        options.data = "<html><body><h1>Hello, world!</h1></body></html>";
        options.contentType = "text/html";
        fi.api.put(options);
        expected = "text/html";
        actual = this.server.requests[0].requestHeaders['Content-Type'];
        expect(actual).toContain(expected);
      });

      it("should correctly set content-type on a passed in MIME as PUT to the /about endpoint", function() {
        var options = new Object();
        options.url = "about/fakeAboutValue/username/tag";
        options.data = "<html><body><h1>Hello, world!</h1></body></html>";
        options.contentType = "text/html";
        fi.api.put(options);
        expected = "text/html";
        actual = this.server.requests[0].requestHeaders['Content-Type'];
        expect(actual).toContain(expected);
      });

      it("should complain if it can't set a content-type on a PUT to /objects", function() {
        var options = new Object();
        options.url = "objects/fakeObjectID/username/tag";
        options.data = {"foo": "bar"};
        try {
          fi.api.put(options);
        } catch(e) {
          var exception = e;
        }
        expect(exception.name).toEqual("ValueError");
      });

      it("should complain if it can't set a content-type on a PUT to /about", function() {
        var options = new Object();
        options.url = "about/fakeAboutValue/username/tag";
        options.data = {"foo": "bar"};
        try {
          fi.api.put(options);
        } catch(e) {
          var exception = e;
        }
        expect(exception.name).toEqual("ValueError");
      });

      it("should set the content-type to to 'application/json' by default", function() {
        var options = new Object();
        options.url = "namespaces/test";
        options.data = {name: "foo", description: "bar"};
        fi.api.post(options);
        expected = "application/json";
        actual = this.server.requests[0].requestHeaders['Content-Type'];
        expect(actual).toContain(expected);
      });

      it("should appropriately encode a URL passed as an array", function() {
        var options = new Object();
        options.url = ["about", "än/- object", "namespace", "tag"];
        options.data = {name: "foo", description: "bar"};
        fi.api.post(options);
        expect(this.server.requests[0].url)
          .toEqual(fi.baseURL+"about/%C3%A4n%2F-%20object/namespace/tag");
      })
    });

    describe("Response handling", function() {
      it("should provide a simple response object for onSuccess", function() {
        var options = new Object();
        options.url = "namespaces/test";
        var payload = {name: "foo", description: "bar"};
        options.data = payload;
        options.onSuccess = function(result) {
          expect(typeof(result)).toEqual("object");
          expect(result.status).toEqual(201);
          expect(result.statusText).toEqual("Created");
          expect(typeof(result.headers)).toEqual("object");
          expect(result.headers["Content-Type"]).toEqual("application/json");
          expect(result.data).toBeTruthy();
          expect(typeof(result.request)).toEqual("object"); // original XHR
        };
        fi.api.post(options);
        var responseStatus = 201;
        var responseHeaders = {"Content-Type": "application/json",
          "Location": "http://fluiddb.fluidinfo.com/namespaces/test/foo",
          "Content-Length": 107,
          "Date": "Mon, 02 Aug 2010 12:40:41 GMT"}
        var responseText = '{"id": "e9c97fa8-05ed-4905-9f72-8d00b7390f9b", "URI": "http://fluiddb.fluidinfo.com/namespaces/test/foo"}';
        this.server.requests[0].respond(responseStatus, responseHeaders, responseText);
      });

      it("should provide a simple response object for onError", function() {
        var options = new Object();
        options.url = "namespaces/test";
        var payload = {name: "foo", description: "bar"};
        options.data = payload;
        options.onError = function(result) {
          expect(typeof(result)).toEqual("object");
          expect(result.status).toEqual(401);
          expect(result.statusText).toEqual("Unauthorized");
          expect(typeof(result.headers)).toEqual("object");
          expect(result.data).toEqual("");
          expect(typeof(result.request)).toEqual("object"); // original XHR
        };
        fi.api.post(options);
        var responseStatus = 401;
        var responseHeaders = {"Content-Type": "text/html",
          "Location": "http://fluiddb.fluidinfo.com/namespaces/test/foo",
          "Date": "Mon, 02 Aug 2010 12:40:41 GMT"}
        var responseText = '';
        this.server.requests[0].respond(responseStatus, responseHeaders, responseText);
      });

      it("should serialise Javascript objects into JSON", function() {
        var options = new Object();
        options.url = "namespaces/test";
        var payload = {name: "foo", description: "bar"};
        options.data = payload;
        fi.api.post(options);
        expected = "application/json";
        actual = this.server.requests[0].requestHeaders['Content-Type'];
        expect(actual).toContain(expected);
        expect(this.server.requests[0].requestBody)
          .toEqual(JSON.stringify(payload));
      })

      it("should de-serialise JSON payloads to Javascript objects", function() {
        var options = new Object();
        options.url = "namespaces/test";
        var payload = {name: "foo", description: "bar"};
        options.data = payload;
        options.onSuccess = function(result) {
            expect(result.data.id)
              .toEqual("e9c97fa8-05ed-4905-9f72-8d00b7390f9b");
        };
        fi.api.post(options);
        this.server.requests[0].respond(201, {"Content-Type": "application/json"}, '{"id": "e9c97fa8-05ed-4905-9f72-8d00b7390f9b", "URI": "http://fluiddb.fluidinfo.com/namespaces/foo/bar"}');
      })
    });

    describe("GET", function() {
      describe("default behaviour", function() {
        beforeEach(function() {
          this.server.respondWith("GET", "https://fluiddb.fluidinfo.com/objects/fakeObjectID/username/tag",
            [200, {"Content-Type": "application/vnd.fluiddb.value+json"},
            "1.234"]);
          fi.api.get({
                 url: "objects/fakeObjectID/username/tag",
                 onSuccess: function(result) {
                   expect(result.data).toEqual(1.234);
                 },
                 onError: function(result) {
                   throw { name: "XHRError", message: "Bad response"};
                 }
          });
          this.server.respond()
        });

        it_should_be_a_standard_ajax_request();

        it_should_be_authenticated();

        it("should be a GET method", function() {
          expect(this.server.requests[0].method)
            .toEqual("GET");
        });

        it_should_have_an_empty_payload();
      });
    });

    describe("POST", function() {
      describe("default behaviour", function() {
        beforeEach(function() {
          fi.api.post({
                 url: "namespaces/test",
                 data: {name: "test", description: "A description"},
                 onSuccess: function(result){
                   expect(result.status).toEqual(201);
                   expect(result.data.id).
                     toEqual("e9c97fa8-05ed-4905-9f72-8d00b7390f9b");
                 }
          });
          var responseStatus = 201;
          var responseHeaders = {"Content-Type": "application/json",
              "Location": "http://fluiddb.fluidinfo.com/namespaces/test/foo",
              "Content-Length": 107,
              "Date": "Mon, 02 Aug 2010 12:40:41 GMT"}
          var responseText = '{"id": "e9c97fa8-05ed-4905-9f72-8d00b7390f9b", "URI": "http://fluiddb.fluidinfo.com/namespaces/test/foo"}';
          this.server.requests[0].respond(responseStatus, responseHeaders, responseText);
        });

        it_should_be_a_standard_ajax_request();

        it_should_be_authenticated();

        it("should be a POST method", function() {
          expect(this.server.requests[0].method)
            .toEqual("POST");
        });

        it("should have a payload", function() {
          expect(this.server.requests[0].requestBody)
            .not.toEqual(null);
          expect(this.server.requests[0].requestBody)
            .toBeTruthy();
        });

        it_should_have_a_content_type_of("application/json");
      });
    });

    describe("PUT", function() {
      describe("default behaviour", function() {
        beforeEach(function() {
          fi.api.put({
                 url: "objects/fakeObjectID/username/tag",
                 data: "data",
                 onSuccess: function(result){
                   expect(result.status).toEqual(204);
                 },
          });
          var responseStatus = 204;
          var responseHeaders = {"Content-Type": "text/html",
              "Date": "Mon, 02 Aug 2010 12:40:41 GMT"}
          var responseText = '';
          this.server.requests[0].respond(responseStatus, responseHeaders, responseText);
        });

        it_should_be_a_standard_ajax_request();

        it_should_be_authenticated();

        it("should be a PUT method", function() {
          expect(this.server.requests[0].method)
            .toEqual("PUT");
        });

        it("should have a payload", function() {
          expect(this.server.requests[0].requestBody)
            .not.toEqual(null);
          expect(this.server.requests[0].requestBody)
            .toEqual('"data"');
        });

        it_should_have_a_content_type_of("application/vnd.fluiddb.value+json");
      });
    });

    describe("DELETE", function() {
      describe("default behaviour", function() {
        beforeEach(function() {
          fi.api.delete({
                 url: "objects/fakeObjectID/username/tag",
                 onSuccess: function(result){
                   expect(result.status).toEqual(204);
                 }
          });
          var responseStatus = 204;
          var responseHeaders = {"Content-Type": "text/html",
              "Date": "Mon, 02 Aug 2010 12:40:41 GMT"}
          var responseText = '';
          this.server.requests[0].respond(responseStatus, responseHeaders, responseText);
        });

        it_should_be_a_standard_ajax_request();

        it_should_be_authenticated();

        it("should be a DELETE method", function() {
          expect(this.server.requests[0].method)
            .toEqual("DELETE");
        });

        it_should_have_an_empty_payload();

      })
    });

    describe("HEAD", function() {
      describe("default behaviour", function() {
        beforeEach(function() {
          fi.api.head({
                 url: "objects/fakeObjectID/username/tag",
                 onSuccess: function(response){
                   expect(response.status).toEqual(200);
                   expect(response.statusText).toEqual("OK");
                   expect(typeof(response.headers)).toEqual("object");
                   expect(response.headers["Content-Type"]).toEqual("text/html");
                   expect(response.headers["Content-Length"]).toEqual("28926");
                   expect(response.headers["Date"]).toEqual("Mon, 02 Aug 2010 12:40:41 GMT");
                 }
          });
          var responseStatus = 200;
          var responseHeaders = {"Content-Type": "text/html",
              "Content-Length": "28926",
              "Date": "Mon, 02 Aug 2010 12:40:41 GMT"}
          var responseText = '';
          this.server.requests[0].respond(responseStatus, responseHeaders, responseText);
        });

        it_should_be_a_standard_ajax_request();

        it_should_be_authenticated();

        it("should be a HEAD method", function() {
          expect(this.server.requests[0].method)
            .toEqual("HEAD");
        });

        it_should_have_an_empty_payload();
      });
    });
  });

  /**
   * Describes the behaviour of utility functions used when making calls to the
   * API.
   */
  describe("API utilities", function(){

    /**
     * Checks the library correctly detects the appropriate MIME type to set for
     * the eventual value of the Content-Type header of a request.
     */
    describe("Content-Type detection", function() {
      it("should identify a primitive in a PUT to 'objects'", function() {
        var options = new Object();
        options.url = "objects/fakeObjectID/username/tag";
        options.data = 1.234;
        fi.api.put(options);
        expected = "application/vnd.fluiddb.value+json";
        actual = this.server.requests[0].requestHeaders['Content-Type'];
        expect(actual).toContain(expected);
      });

      it("should identify a primitive in a PUT to 'about'", function() {
        var options = new Object();
        options.url = "about/fakeAboutValue/username/tag";
        options.data = 1.234;
        fi.api.put(options);
        expected = "application/vnd.fluiddb.value+json";
        actual = this.server.requests[0].requestHeaders['Content-Type'];
        expect(actual).toContain(expected);
      });

      it("should identify a given MIME in a PUT to 'objects'", function() {
        var options = new Object();
        options.url = "objects/fakeObjectID/username/tag";
        options.contentType = "text/html";
        fi.api.put(options);
        expected = "text/html";
        actual = this.server.requests[0].requestHeaders['Content-Type'];
        expect(actual).toContain(expected);
      });

      it("should identify a given MIME in a PUT to 'about'", function() {
        var options = new Object();
        options.type = "PUT";
        options.url = "about/fakeAboutValue/username/tag";
        options.contentType = "text/html";
        fi.api.put(options);
        expected = "text/html";
        actual = this.server.requests[0].requestHeaders['Content-Type'];
        expect(actual).toContain(expected);
      });

      it("should default to JSON for all other requests with data", function() {
        var options = new Object();
        options.url = "namespaces/test";
        options.data = {name: "foo", description: "bar"};
        fi.api.post(options);
        expected = "application/json";
        actual = this.server.requests[0].requestHeaders['Content-Type'];
        expect(actual).toContain(expected);
      });

      it("should complain if it can't detect the MIME", function() {
        var options = new Object();
        options.url = "about/fakeAboutValue/username/tag";
        options.data = new Object();
        try {
          fi.api.put(options);
        } catch(e) {
          var exception = e;
        }
        expect(exception.name).toEqual("ValueError");
      });
    });

    /**
     * Checks the library correctly identifies primitive values.
     */
    describe("Primitive identification", function() {
      it("should identify an integer as primitive", function() {
        var options = new Object();
        options.url = "about/fakeAboutValue/username/tag";
        options.data = 1;
        fi.api.put(options);
        expected = "application/vnd.fluiddb.value+json";
        actual = this.server.requests[0].requestHeaders['Content-Type'];
        expect(actual).toContain(expected);
      });

      it("should identify a float as primitive", function() {
        var options = new Object();
        options.url = "about/fakeAboutValue/username/tag";
        options.data = 1.234;
        fi.api.put(options);
        expected = "application/vnd.fluiddb.value+json";
        actual = this.server.requests[0].requestHeaders['Content-Type'];
        expect(actual).toContain(expected);
      });

      it("should identify a boolean as primitive", function() {
        var options = new Object();
        options.url = "about/fakeAboutValue/username/tag";
        options.data = false;
        fi.api.put(options);
        expected = "application/vnd.fluiddb.value+json";
        actual = this.server.requests[0].requestHeaders['Content-Type'];
        expect(actual).toContain(expected);
      });

      it("should identify a string as primitive", function() {
        var options = new Object();
        options.url = "about/fakeAboutValue/username/tag";
        options.data = "hello";
        fi.api.put(options);
        expected = "application/vnd.fluiddb.value+json";
        actual = this.server.requests[0].requestHeaders['Content-Type'];
        expect(actual).toContain(expected);
      });

      it("should identify a null as primitive", function() {
        var options = new Object();
        options.url = "about/fakeAboutValue/username/tag";
        options.data = null;
        fi.api.put(options);
        expected = "application/vnd.fluiddb.value+json";
        actual = this.server.requests[0].requestHeaders['Content-Type'];
        expect(actual).toContain(expected);
      });

      it("should identify a string array as primitive", function() {
        var options = new Object();
        options.url = "about/fakeAboutValue/username/tag";
        options.data = ["a", "b", "c"];
        fi.api.put(options);
        expected = "application/vnd.fluiddb.value+json";
        actual = this.server.requests[0].requestHeaders['Content-Type'];
        expect(actual).toContain(expected);
      });

      it("should identify a mixed array as NOT primitive", function() {
        var options = new Object();
        options.url = "about/fakeAboutValue/username/tag";
        options.data = ["a", "b", 1];
        try {
          fi.api.put(options);
        } catch(e) {
          var exception = e;
        }
        expect(exception.name).toEqual("ValueError");
      });

      it("should identify an object as NOT primitive", function() {
        var options = new Object();
        options.url = "about/fakeAboutValue/username/tag";
        options.data = {foo: "bar"};
        try {
          fi.api.put(options);
        } catch(e) {
          var exception = e;
        }
        expect(exception.name).toEqual("ValueError");
      });
    });
  });

  afterEach(function() {
    this.server.restore();
  });
});
