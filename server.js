var request = require("request"),
    crypto = require("crypto"),
    nconf = require("nconf");

// Setup nconf to use (in-order):
//   1. Command-line arguments
//   2. Environment variables
//   3. A file located at 'config.json'
//
nconf
  .argv()
  .env()
  .file({ file: 'config.json' })
  .defaults({
    "timer": 1000
  });

var bucket = function(period, now) {
  return now - (now % period);
};

var text_periods = [1,5,10,15,30,60,300,900,1800,3600]; // in seconds
var text_functions = {
  // Binary toggles true-false
  toggle: function(period, now) {
    return wave_functions.square(period, now) >= 0
  },

  // random between 0-1
  random: function(period, now) {
    var shasum = crypto.createHash('md5');
    shasum.update(String(bucket(period, now)));
    return (parseInt(shasum.digest('hex').slice(0,4), 16) / parseInt('ffff', 16)).toFixed(4);
  }
};

var wave_periods = [5,10,15,30,60,300,900,1800,3600]; // in seconds
var wave_functions = {
  // Waves
  sine: function(period, now) {
    return (Math.sin((20*now) / (period * Math.PI))).toFixed(4);
  },
  square: function(period, now) {
    var sine = this.sine(period, now);
    switch (true) {
      case (sine > 0):
        return 1;
      case (sine < 0):
        return -1;
      default:
        return 0;
    }
  },
  sawtooth: function(period, now) {
    return ((now % period) / period).toFixed(4);
  },
  triangle: function(period, now) {
    return (Math.abs(2*((now/period) - Math.floor((now/period) + .5)))).toFixed(4);
  }
};

var add = function(functions, periods, now) {
  var str = '';
  for (var func in functions) {
    for (var i=0; i < periods.length; i++) {
      var result = functions[func](periods[i], now)
      if (typeof(result) !== 'undefined') {
        str += func + periods[i] + ',' + result + '\n';
      }
    }
  }
  return str;
};

var body = function(now) {
  return add(text_functions, text_periods, now) + add(wave_functions, wave_periods, now);
};

setInterval(function() {
  var now = +(new Date()) / 1000, // now in seconds
      url = "http://"+nconf.get("api")+"/v2/feeds/"+nconf.get("feed_id")+".csv"

  request({
    url: url + "?key="+nconf.get("api_key"), 
    body: body(now),
  }, function(error, response, body) {
    if (error) {
      console.log("Posted to "+url+", error: "+error);
    } else {
      console.log("Posted to "+url+", response: "+response.statusCode);
    }
  });
}, nconf.get("timer"));
