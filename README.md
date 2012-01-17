fluidinfo.js is a javascript client library to access Fluidinfo
(http://fluidinfo.com/):

```javascript
var fi = fluidinfo({username: "username", password: "password"});
var onSuccess = function(result) {
  // A callback to do something with the result
};
var onError = function(result) {
  // A callback to handle when things go wrong
};
fi.query({select: ["fluiddb/about", "ntoll/rating", "terrycojones/comment"],
          where: 'oreilly.com/title matches "Javascript"',
          onSuccess: onSuccess,
          onError: onError});
```

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
