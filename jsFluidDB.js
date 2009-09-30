//BEGIN FluidDB REST LIB

fluidDB = new Object();

fluidDB.instance = {
    main : "http://fluiddb.fluidinfo.com/",
    sandbox : "http://sandbox.fluidinfo.com/"
}


fluidDB.choose = function(type){
    //add error handling
    fluidDB.baseURL = fluidDB.instance[type];
}

fluidDB.choose('main');

fluidDB.ajax = function(type, url, payload, callback, async_req){
    if(async_req == undefined){
      async_req = true;
    }
    $.ajax({
          async: async_req,
          beforeSend: function(xhrObj){
              if(fluidDB.baseURL == fluidDB.instance['main']){
                  xhrObj.setRequestHeader("Accept","application/json");
              };
              xhrObj.setRequestHeader("Content-Type","application/json");
          },
          contentType: "application/json",
          type: type,
          url: url,
          data: payload,
          processData: false,
          success: callback
    });
}

fluidDB.get = function(url, callback, async_req){
    fluidDB.ajax("GET", fluidDB.baseURL+url, null, callback, async_req);
}

fluidDB.post = function(url, payload, callback, async_req){
    fluidDB.ajax("POST", fluidDB.baseURL+url, payload, callback, async_req);
}


//END FluidDB REST LIB