'use strict';

// Dependencies

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const client = new pg.Client(process.env.DATABASE_URL);
app.use(cors());


client.on('error', err => {
  throw err;
});

// Routes
app.get('/', homePage);
app.get('/location', locationHandler);
app.get('/weather', weatherHandler);
app.use('*', errorPage);



// Request Handlers

function homePage(request, response) {
  response.send('Hello World');
}

function errorPage(request, response) {
  response.status(500).send('<h1>Oops Error 404 Page not found</h1>');
}

function locationHandler(request, response) {

  const city = request.query.city;
  const key = process.env.LOCATIONIQ_API_KEY;
  const url = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json`;


  if (city === '' || !city) {
    response.status(500);
    response.send('Sorry, something went wrong');
  }

  let SQL = 'SELECT search_query, longitude, latitude, formatted_query FROM location WHERE search_query = $1';
  let safeValues = [city];

  client.query(SQL, safeValues)
    .then(results => {
      if (results.rowCount > 0) {
        console.log('TALKED TO DATABASE');
        console.log('SELECT STATEMENT >>', results.rows);
        response.send(results.rows[0]);
      }
      else {
        console.log('TALKED TO API');
        superagent.get(url)
          .then(data => {
            const locationData = data.body[0];
            const sendData = new Location(city, locationData);
            let SQL = 'INSERT INTO location (search_query, longitude, latitude, formatted_query) VALUES ($1, $2, $3, $4) RETURNING *';

            let safeValues = [sendData.search_qeury, sendData.longitude, sendData.latitude, sendData.formatted_query];
            client.query(SQL, safeValues)
              .then(results => {
                console.log(results);
              });
            response.status(200).send(sendData);
          });
      }
    });


}

function weatherHandler(request, response) {
  const lat = request.query.latitude;
  const lon = request.query.longitude;
  const key = process.env.WEATHERBIT_API_KEY;
  const url = `http://api.weatherbit.io/v2.0/forecast/daily?&lat=${lat}&lon=${lon}&key=${key}`;

  superagent.get(url)
    .then(value => {
      const weatherData = value.body.data;

      const newWeatherData = weatherData.map(weathervalue => {
        return new Weather(weathervalue);
      });
      response.send(newWeatherData);
    });
}



// Constructors
function Location(city, locationData) {
  this.search_qeury = city;
  this.formatted_query = locationData.display_name;
  this.latitude = locationData.lat;
  this.longitude = locationData.lon;
}


function Weather(data) {
  this.forecast = data.weather.description;
  this.time = new Date(data.datetime).toDateString();
}


// App Initialization
client.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Now Listening on Port ${PORT}`);
      console.log(`Connected to database ${client.connectionParameters.database}`);
    });

  });
