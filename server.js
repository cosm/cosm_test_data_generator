var request = require("request");

var feed_id = "",
    api_key = "",
    periods = [1,5,10,15,30,60], // in minutes
    timer = 5000; // every 5 seconds

var math_functions = {
  // random between 0-1
  random: function(period, time) {
  },

  // Waves
  sine: function(period, time) {
  },
  square: function(period, time) {
  },
  triangle: function(period, time) {
  },
  sawtooth: function(period, time) {
  },

  // Binary toggles on-off
  toggle: function(period, time) {
  },

  // Fuzzy Clock
  text: function(period, time) {
  }
};

setInterval(function() {
  var now = new Date(),
      body = '';

  for (var func in math_functions) {
    for (var i=0; i < periods.length; i++) {
      var result = math_functions[func](periods[i], now)
      if (typeof(result) !== 'undefined') {
        body += result;
      }
    }
  }

  request({
    url: "http://api.cosm.com/v2/feeds/"+feed_id+".csv?key="+api_key, 
    body: ""
  }, function(error, response, body) {
    if (error) {
      console.log("Posted to Cosm feed: "+feed_id", error: "+error);
    } else {
      console.log("Posted to Cosm feed: "+feed_id", response: "+response.statusCode);
    }
  });
}, timer);
