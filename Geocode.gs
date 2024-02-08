
/**
 * Get location and lat long from city
 * 
 * Get Temperature information of the location
 */

/***
 * Updated 2023.08.22
 * from: https://nominatim.openstreetmap.org/search/?q=Berlin
 *  to: https://nominatim.openstreetmap.org/search?q=Berlin
 * 
 */
function OSMLocationSearch(searchterm) {
  // Define the URL with the search term
  var url = "https://nominatim.openstreetmap.org/search?q=" + searchterm + "&format=json&addressdetails=1&limit=5&countrycodes=&accept-language=en";
  // Define the options for the fetch request
  var options = {
    "headers": {
      "accept": "*/*",
      "accept-language": "en-GB,en;q=0.9,it-IT;q=0.8,it;q=0.7,en-US;q=0.6",
      "sec-ch-ua": "\"Chromium\";v=\"112\", \"Google Chrome\";v=\"112\", \"Not:A-Brand\";v=\"99\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site"
    },
    "method": "GET"
  };
  // Use UrlFetchApp to fetch the URL with the options
  var response = UrlFetchApp.fetch(url, options);
  // Parse the response as JSON
  var data = JSON.parse(response.getContentText());
  // Return the data
  return data;
}


/**
 * function to insert inside gsheet
 * 
 */
function GetLat(searchterm) {
  var result = OSMLocationSearch(searchterm);
  Logger.log("lat. " + result[0].lat);
  return result[0].lat;
}
function GetLon(searchterm) {
  var result = OSMLocationSearch(searchterm);
  Logger.log("lat. " + result[0].lon);
  return result[0].lon;
}
function AvgTemp(wmo){
  return GetMeteoData(wmo).meteo_stations[0].dbavg_annual;
}
function MinTemp(wmo){
  return GetMeteoData(wmo).meteo_stations[0].extreme_annual_DB_mean_min;
}
function MaxTemp(wmo){
  return GetMeteoData(wmo).meteo_stations[0].extreme_annual_DB_mean_max;
}

/**
 *Climate Zone API
 * http://climateapi.scottpinkelman.com/
 * eg.
 * http://climateapi.scottpinkelman.com/api/v1/location/40.8539645/14.1765625
 */
function GetClimateClass(lat, lon) {
  var url = "http://climateapi.scottpinkelman.com/api/v1/location/" + lat + "/" + lon;

  // The fetch request
  var response = UrlFetchApp.fetch(url);

  // The response content
  var content = JSON.parse(response.getContentText());

  // Log the content for debugging
  return content.return_values[0].koppen_geiger_zone;
}


/**
 * use copy curl comd
 * this function get place wmo of a place lat, long
 */
// This function converts a cURL command to a Google Apps Script fetch request
function GetElev(lat, lon) {
  // The cURL command to be converted
  var curl = `curl "http://ashrae-meteo.info/v2.0/request_places.php" ^
  -H "Accept: */*" ^
  -H "Accept-Language: en-GB,en;q=0.9,it-IT;q=0.8,it;q=0.7,en-US;q=0.6" ^
  -H "Connection: keep-alive" ^
  -H "Content-type: application/x-www-form-urlencoded" ^
  -H "Cookie: si_ip=SI; psi_calc=on; show_station=off; help_window=off; attention_2=on; _ga=GA1.1.2006648809.1681295326; __utmc=219599369; ashrae_version=2021; __utmz=219599369.1683534048.7.2.utmcsr=google^|utmccn=(organic)^|utmcmd=organic^|utmctr=(not^%^20provided); _ga_XMTZ7MSQWD=GS1.1.1683612513.11.1.1683612530.0.0.0; __utma=219599369.2006648809.1681295326.1683561552.1683612538.9; __utmt=1; __utmb=219599369.1.10.1683612538" ^
  -H "Origin: http://ashrae-meteo.info" ^
  -H "Referer: http://ashrae-meteo.info/v2.0/" ^
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36" ^
  --data-raw "lat=`+ lat + `&long=` + lon + `&number=10&ashrae_version=2021" ^
  --compressed ^
  --insecure`;

  // The URL to be fetched
  var url = curl.match(/curl "(.*?)"/)[1];

  // The headers to be sent
  var headers = {};
  var headerMatches = curl.match(/-H "(.*?)"/g);
  for (var i = 0; i < headerMatches.length; i++) {
    var header = headerMatches[i].slice(4, -1); // Remove the -H and the quotes
    var parts = header.split(": "); // Split the header into key and value
    headers[parts[0]] = parts[1];
  }

  // The payload to be sent
  var payload = curl.match(/--data-raw "(.*?)"/)[1];

  // The options for the fetch request
  var options = {
    method: "post",
    headers: headers,
    payload: payload,
    muteHttpExceptions: true // To handle errors gracefully
  };

  // The fetch request
  var response = UrlFetchApp.fetch(url, options);

  // The response content
  var content = JSON.parse(response.getContentText());
  //var content = response.getContentText();

  // Log the content for debugging
  return content.meteo_stations[0].elev;
}


/**
 * Get wmo with HTTP direct
 * si_ip=SI; psi_calc=on; show_station=off; help_window=off; attention_2=on; _ga=GA1.1.2006648809.1681295326; __utmc=219599369; ashrae_version=2021; __utmz=219599369.1683534048.7.2.utmcsr=google^|utmccn=(organic)^|utmcmd=organic^|utmctr=(not^%^20provided); _ga_XMTZ7MSQWD=GS1.1.1683612513.11.1.1683612530.0.0.0; __utma=219599369.2006648809.1681295326.1683561552.1683612538.9; __utmt=1; __utmb=219599369.1.10.1683612538
 */
function Getwmo(lat, lon) {
  // The cURL command to be converted


  var curl = `curl "http://ashrae-meteo.info/v2.0/request_places.php" ^
  -H "Accept: */*" ^
  -H "Accept-Language: en-GB,en;q=0.9,it-IT;q=0.8,it;q=0.7,en-US;q=0.6" ^
  -H "Connection: keep-alive" ^
  -H "Content-type: application/x-www-form-urlencoded" ^
  -H "Cookie: si_ip=SI; psi_calc=on; show_station=off; help_window=off; attention_2=on; _ga=GA1.1.2006648809.1681295326; __utmc=219599369; ashrae_version=2021; __utmz=219599369.1683534048.7.2.utmcsr=google^|utmccn=(organic)^|utmcmd=organic^|utmctr=(not^%^20provided); _ga_XMTZ7MSQWD=GS1.1.1683612513.11.1.1683612530.0.0.0; __utma=219599369.2006648809.1681295326.1683561552.1683612538.9; __utmt=1; __utmb=219599369.1.10.1683612538" ^
  -H "Origin: http://ashrae-meteo.info" ^
  -H "Referer: http://ashrae-meteo.info/v2.0/" ^
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36" ^
  --data-raw "lat=`+ lat + `&long=` + lon + `&number=10&ashrae_version=2021" ^
  --compressed ^
  --insecure`;

  // The URL to be fetched
  var url = curl.match(/curl "(.*?)"/)[1];

  // The headers to be sent
  var headers = {};
  var headerMatches = curl.match(/-H "(.*?)"/g);
  for (var i = 0; i < headerMatches.length; i++) {
    var header = headerMatches[i].slice(4, -1); // Remove the -H and the quotes
    var parts = header.split(": "); // Split the header into key and value
    headers[parts[0]] = parts[1];
  }

  // The payload to be sent
  var payload = curl.match(/--data-raw "(.*?)"/)[1];

  // The options for the fetch request
  var options = {
    method: "post",
    headers: headers,
    payload: payload,
    muteHttpExceptions: true // To handle errors gracefully
  };

  // The fetch request
  var response = UrlFetchApp.fetch(url, options);

  // The response content
  var content = JSON.parse(response.getContentText());
  //var content = response.getContentText();

  // Log the content for debugging
  return content.meteo_stations[0].wmo;
}


/**
 * get meteo data from wmo
 * use https://jsonpathfinder.com/
 * on http://ashrae-meteo.info/v2.0/
 */
// This function converts a cURL command to a Google Apps Script fetch request
function GetMeteoData(wmo) {
  // The cURL command to be converted
  var curl = `curl "http://ashrae-meteo.info/v2.0/request_meteo_parametres.php" ^
-H "Accept: */*" ^
-H "Accept-Language: en-GB,en;q=0.9,it-IT;q=0.8,it;q=0.7,en-US;q=0.6" ^
-H "Connection: keep-alive" ^
-H "Content-type: application/x-www-form-urlencoded" ^
-H "Cookie: si_ip=SI; psi_calc=on; show_station=off; help_window=off; attention_2=on; _ga=GA1.1.2006648809.1681295326; __utmc=219599369; ashrae_version=2021; __utmz=219599369.1683534048.7.2.utmcsr=google^|utmccn=(organic)^|utmcmd=organic^|utmctr=(not^%^20provided); _ga_XMTZ7MSQWD=GS1.1.1683612513.11.1.1683612530.0.0.0; __utma=219599369.2006648809.1681295326.1683561552.1683612538.9; __utmt=1; __utmb=219599369.1.10.1683612538" ^
-H "Origin: http://ashrae-meteo.info" ^
-H "Referer: http://ashrae-meteo.info/v2.0/" ^
-H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36" ^
--data-raw "wmo=`+ wmo + `&ashrae_version=2021&si_ip=SI" ^
--compressed ^
--insecure`;

  // The URL to be fetched
  var url = curl.match(/curl "(.*?)"/)[1];

  // The headers to be sent
  var headers = {};
  var headerMatches = curl.match(/-H "(.*?)"/g);
  for (var i = 0; i < headerMatches.length; i++) {
    var header = headerMatches[i].slice(4, -1); // Remove the -H and the quotes
    var parts = header.split(": "); // Split the header into key and value
    headers[parts[0]] = parts[1];
  }

  // The payload to be sent
  var payload = curl.match(/--data-raw "(.*?)"/)[1];

  // The options for the fetch request
  var options = {
    method: "post",
    headers: headers,
    payload: payload,
    muteHttpExceptions: true // To handle errors gracefully
  };

  // The fetch request
  var response = UrlFetchApp.fetch(url, options);

  // The response content
  var content = JSON.parse(response.getContentText());
  //var content = response.getContentText();

  // Log the content for debugging
  return content;
}


/**
 * Returns latitude and longitude values for given address using the Google Maps Geocoder.
 */
//https://discourse.looker.com/t/get-latitude-longitude-for-any-location-through-google-sheets-and-plot-these-in-looker/5402

function GEOCODE_GOOGLE(t) { var e = Math.floor(1e3 * (2 * Math.random() + 1)); if (Utilities.sleep(e), t.map) return t.map(GEOCODE_GOOGLE); for (var r = Maps.newGeocoder().geocode(t), n = 0; n < r.results.length; n++) { var o = r.results[n]; return o.geometry.location.lat + ", " + o.geometry.location.lng } } function GoogleMapsDist(t, e) { var r = Maps.DirectionFinder.Mode.DRIVING, n = Maps.newDirectionFinder().setOrigin(t).setDestination(e).setMode(r).getDirections(); if ("OK" !== n.status) return "Error: " + n.status; var o = n.routes[0].legs[0], i = (o.duration.text, o.distance.text); o.steps.map((function (t) { return t.html_instructions.replace(/<[^>]+>/g, "") })).join("\n"); return i }

/*
function GEOCODE_GOOGLE(address) {


  var milliseconds = Math.floor(((Math.random() * 2) + 1) * 1000);
  Utilities.sleep(milliseconds);

  if (address.map) {
    return address.map(GEOCODE_GOOGLE)
  } else {
    var r = Maps.newGeocoder().geocode(address)
    for (var i = 0; i < r.results.length; i++) {
      var res = r.results[i]
      return res.geometry.location.lat + ", " + res.geometry.location.lng
    }
  }

}




//***************************RETURN DISTANCE BETWEEN TWO POINTS*************************
function GoogleMapsDist(origin, destination) {

  var travelMode = Maps.DirectionFinder.Mode.DRIVING;

  var directions = Maps.newDirectionFinder()
    .setOrigin(origin)
    .setDestination(destination)
    .setMode(travelMode)
    .getDirections();

  if (directions.status !== "OK")
    return "Error: " + directions.status;

  var route = directions.routes[0].legs[0];
  var time = route.duration.text;
  var distance = route.distance.text;
  var steps = route.steps.map(function (step) {
    return step.html_instructions.replace(/<[^>]+>/g, "")
  }).join("\n");

  return distance

}

*/

_________________________________________________________________
*** CAUTION | DISCLAIMER ***

This message and/or its attachment(s) may contain privileged and confidential information intended only for the use of the addressee named above. If you are not the intended recipient of this message, you are hereby notified that any use, dissemination, distribution or reproduction of this message is strictly prohibited. If you have received this message in error please notify DEC immediately. Any views expressed in this message are those of the individual sender and may not necessarily reflect the views of  DEC. More details available HERE.
_________________________________________________________________
DEC • Dynamic Environmental Corporation S.p.A.
[Società per Azioni a socio unico, soggetta a direzione e coordinamento di DEC HOLDING]
_________________________________________________________________
solutions for a sustainable tomorrow
