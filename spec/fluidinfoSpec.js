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

  it("should point to the correct URL", function() {
    expect(this.server.requests[0].url)
      .toEqual(fi.baseURL+"objects/fakeObjectID/username/tag");
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

    describe("GET", function() {
      describe("default behaviour", function() {
        beforeEach(function() {
          this.server.respondWith("GET", "https://fluiddb.fluidinfo.com/objects/fakeObjectID/username/tag",
            [200, {"Content-Type": "application/vnd.fluiddb.value+json"},
            "1.234"]);
          fi.api.get({
                 url: "objects/fakeObjectID/username/tag",
                 onSuccess: function(xhr) {
                   expect(xhr.responseText).toEqual("1.234");
                 },
                 onError: function(xhr) {
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
                 url: "objects/fakeObjectID/username/tag",
                 onSuccess: function(json){},
                 data: {"test": "test"}
          });
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
          expect(this.server.requests[0].requestBody.test)
            .toEqual("test");
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
                 onSuccess: function(json){},
          });
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
            .toEqual("data");
        });

        it_should_have_a_content_type_of("application/vnd.fluiddb.value+json");
      });
    });

    describe("DELETE", function() {
      describe("default behaviour", function() {
        beforeEach(function() {
          fi.api.delete({
                 url: "objects/fakeObjectID/username/tag",
                 onSuccess: function(json){}
          });
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
                 onSuccess: function(json){}
          });
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
