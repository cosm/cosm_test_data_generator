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
    "timer": 5000 // How often to re-calculate (in ms)
  });

var precision = 8;

var bucket = function(period, now) {
  return now - (now % period);
};

var seconds = function(ms) {
  return ms / 1000;
}

var text_periods = [5,60,900,3600]; // in seconds
var text_functions = {
  // Toggles 0-1
  toggle: function(period, now) {
    if (wave_functions.sine(period*2, now) >= 0) {
      return 1;
    } else {
      return 0;
    }
  },

  // Random between 0-1
  random: function(period, now) {
    var now = bucket(period, now),
        shasum = crypto.createHash('md5');
    shasum.update(String(now));
    return (parseInt(shasum.digest('hex').slice(0,4), 16) / parseInt('ffff', 16)).toFixed(precision);
  }
};

var wave_periods = [60,900,3600]; // in seconds
var wave_functions = {
  // Sine Wave
  sine: function(period, now) {
    return (Math.sin((20*now) / (period * Math.PI))).toFixed(precision);
  },

  // Sawtooth Wave
  sawtooth: function(period, now) {
    return ((now % period) / period).toFixed(precision);
  },

  // Triangle Wave
  triangle: function(period, now) {
    return (Math.abs(2*((now/period) - Math.floor((now/period) + .5)))).toFixed(precision);
  }
};

var add = function(functions, periods, now) {
  var str = '',
      prev_time = now - seconds(nconf.get("timer"));

  for (var func in functions) {
    for (var i=0; i < periods.length; i++) {
      var prev = functions[func](periods[i], prev_time)
          result = functions[func](periods[i], now);

      if (typeof(result) !== 'undefined' && result != prev) {
        str += func + periods[i] + ',' + result + '\n';
      }
    }
  }
  return str;
};

var body = function(now) {
  return add(text_functions, text_periods, now) + add(wave_functions, wave_periods, now);
};

// Set a start delay to sync up with the system clock so we trigger just after each interval
var start_time = +(new Date()),
    start_delay = nconf.get("timer") - (start_time % nconf.get("timer")) + 100;

setTimeout(function() {
  setInterval(function() {
    var now = seconds(new Date()), // current time in seconds
        url = "http://"+nconf.get("api")+"/v2/feeds/"+nconf.get("feed_id")+".csv",
        data = body(now);

    if (data != "") {
      request({
        url: url + "?key="+nconf.get("api_key"), 
        method: 'PUT',
        body: data,
      }, function(error, response, body) {
        if (error) {
          console.log("Posted to "+url+", error: "+error);
        } else {
          console.log("Posted to "+url+", response: "+response.statusCode);
        }
      });
    }
  }, nconf.get("timer"));
}, start_delay);
