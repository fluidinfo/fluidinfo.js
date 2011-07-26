function it_should_be_a_standard_ajax_request() {

  it("should send one request", function() {
    expect(this.server.requests.length)
      .toEqual(1);
  });

  it("should point to the correct URL", function() {
    expect(this.server.requests[0].url)
      .toEqual(Fluidinfo.baseURL+"objects/fakeObjectID/username/tag");
  });

  it("should be anonymous", function() {
    expect(this.server.requests[0].username)
      .not.toBeDefined();
    expect(this.server.requests[0].password)
      .not.toBeDefined();
  });

  it("should have content-type to application/json", function() {
    expect(this.server.requests[0].requestHeaders['Content-Type'])
      .toMatch('^application/json');
  });
};


function it_should_have_empty_payload () {
  it("it should have empty payload", function() {
    expect(this.server.requests[0].data)
      .toEqual(null);
  });
}

describe("Fluidinfo.js", function() {

  describe("Configuration", function() {
    it("as default it should point to the main instance", function() {
      expect(Fluidinfo.baseURL).toEqual("https://fluiddb.fluidinfo.com/");
    });

    it("should set the lib to point to the main instance", function() {
      Fluidinfo.choose("main");
      expect(Fluidinfo.baseURL).toEqual("https://fluiddb.fluidinfo.com/");
    });

    it("should set the lib to point to the sandbox", function() {
      Fluidinfo.choose("sandbox");
      expect(Fluidinfo.baseURL).toEqual("https://sandbox.fluidinfo.com/");
      Fluidinfo.choose("main");
    });
  });

  describe("REST", function() {
    beforeEach(function() {
      this.server = sinon.fakeServer.create();
    });

    describe("GET", function() {
      describe("default values", function() {
        beforeEach(function() {
          Fluidinfo.api.get({
                 url: "objects/fakeObjectID/username/tag",
                 success: function(json){
                          }
          });
        });

        it_should_be_a_standard_ajax_request();

        it("should be a GET method", function() {
          expect(this.server.requests[0].method)
            .toEqual("GET");
        });

        it("should have null payload", function() {
        });
      }); //default values

    });

    describe("POST", function() {
      describe("default values", function() {
        beforeEach(function() {
          Fluidinfo.api.post({
                 url: "objects/fakeObjectID/username/tag",
                 success: function(json){
                          }
          });
        });

        it_should_be_a_standard_ajax_request();

        it("should be a POST method", function() {
          expect(this.server.requests[0].method)
            .toEqual("POST");
        });

        it("should have null payload", function() {
        });
      });
    });

    describe("PUT", function() {
      describe("default values", function() {
        beforeEach(function() {
          Fluidinfo.api.put({
                 url: "objects/fakeObjectID/username/tag",
                 success: function(json){
                          }
          });
        });

        it_should_be_a_standard_ajax_request();

        it("should be a PUT method", function() {
          expect(this.server.requests[0].method)
            .toEqual("PUT");
        });

        it("should have null payload", function() {
        });

      });
    });

    describe("DELETE", function() {
      describe("default values", function() {
        beforeEach(function() {
          Fluidinfo.api.delete({
                 url: "objects/fakeObjectID/username/tag",
                 success: function(json){
                          }
          });
        });

        it_should_be_a_standard_ajax_request();

        it("should be a DELETE method", function() {
          expect(this.server.requests[0].method)
            .toEqual("DELETE");
        });

        it("should have null payload", function() {
        });

      });
    });


    describe("HEAD", function() {
      describe("default values", function() {
        beforeEach(function() {
          Fluidinfo.api.head({
                 url: "objects/fakeObjectID/username/tag",
                 success: function(json){
                          }
          });
        });

        it_should_be_a_standard_ajax_request();

        it("should be a HEAD method", function() {
          expect(this.server.requests[0].method)
            .toEqual("HEAD");
        });

        it("should have null payload", function() {
        });

      });
    });

    afterEach(function() {
      this.server.restore();
    });
  });
});

/*
  GET
  POST
  PUT
  DELETE
  HEAD
  primitive per put
  primitive per altri
  payload per head
  payload per delete
  payload per get
  parsing del tag in values

  setting async = true
  changing the base url
  changing content type
  authenticazione salvata
  authenticazione ovverriden

  deve passare gli args
*/
