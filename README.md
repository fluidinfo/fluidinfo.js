fluidinfo.js is a javascript client library to access Fluidinfo
(http://fluidinfo.com/).


Getting started
---------------

```javascript
var client = fluidinfo({username: "username", password: "password"});
var onSuccess = function(result) {
    // A callback to do something with the result.
};
var onError = function(result) {
    // A callback to do something when things go wrong.
};
client.query({select: ["fluiddb/about", "ntoll/rating", "terrycojones/comment"],
              where: 'oreilly.com/title matches "Javascript"',
              onSuccess: onSuccess,
              onError: onError});
```


Running the tests
-----------------

fluidinfo.js uses the Jasmine behaviour-driven development framework
for it's test suite.  Run the tests by opening `SpecRunner.html` in
your web browser.


Learning more
-------------

Documentation for using the library can be found in fluidinfo.js's
wiki, found here:

  https://github.com/fluidinfo/fluidinfo.js/wiki

To sign up for Fluidinfo see here:

  https://fluidinfo.com/accounts/new/

An overview of Fluidinfo itself can be found here:

  https://github.com/fluidinfo/fluidinfo.js/wiki/Fluidinfo

and here:

  http://www.slideshare.net/fluidinfo/fluidinfo-in-a-nutshell

Any questions? Please don't hesitate to submit an issue or get in
touch with the developers:

- Emanuel Carnevale (http://twitter.com/onigiri)
- Nicholas Tollervey (http://twitter.com/ntoll)
- Bar Shirtcliff (http://twitter.com/barshirtcliff)
- Jamu Kakar (http://twitter.com/jkakar)
