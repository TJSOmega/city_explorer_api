'use strict';

// Dependencies

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT;
app.use(cors());




// Routes
app.get('/', homePage);
app.get('/location', locationHandler);
app.get('/weather', weatherHandler);
app.use('*', errorPage);





function homePage(request, response) {
  response.send('Hello World');
}

function errorPage(request, response) {
  response.status(500).send('<h1>Oops Error 404 Page not found</h1>');
}

function locationHandler(request, response) {

  const city = request.query.city;

  if (city === '' || !city) {
    response.status(500);
    response.send('Sorry, something went wrong');
  }

  const locationData = require('./data/location.json');

  const sendData = new Location(city, locationData);

  response.send(sendData);
}

function weatherHandler(request, response) {
  const weatherData = require('./data/weather.json');
  let weatherArray = [];
  weatherData.data.forEach(weatherItem => {
    weatherArray.push(new Weather(weatherItem));
  });
  response.send(weatherArray);
}

function Location(city, locationData) {
  this.search_qeury = city;
  this.formatted_query = locationData[0].display_name;
  this.latitude = locationData[0].lat;
  this.longitude = locationData[0].lon;
}

function Weather(data) {
  this.forecast = data.weather.description;
  let date = Date.parse(data.datetime);
  this.time = new Date(date).toDateString();
}


app.listen(PORT, () => {
  console.log(`Now Listening on Port ${PORT}`);
});
