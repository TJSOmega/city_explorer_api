DROP TABLE IF EXISTS location;

CREATE TABLE location (
  id SERIAL PRIMARY KEY,
  search_query VARCHAR(255),
  longitude NUMERIC (10,7),
  latitude NUMERIC(10,7),
  formatted_query VARCHAR(255)
);