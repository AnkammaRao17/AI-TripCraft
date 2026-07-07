const logger = require('../utils/logger');

/**
 * Geocodes a city name to latitude and longitude using Open-Meteo's free geocoding service
 * @param {string} city - Name of the city
 * @returns {Promise<{lat: number, lng: number}|null>}
 */
const geocodeCity = async (city) => {
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
    logger.info(`Geocoding city via Open-Meteo: ${city}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Geocoding API responded with HTTP ${response.status}`);
    }
    
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      return {
        lat: result.latitude,
        lng: result.longitude,
        country: result.country,
        name: result.name,
      };
    }
    return null;
  } catch (error) {
    logger.error(`Error in geocoding city: ${error.message}`);
    return null;
  }
};

/**
 * Retrieves the current weather and 5-day forecast for a city
 * @param {string} city - Name of the city
 * @param {number} [latitude] - Optional pre-defined latitude
 * @param {number} [longitude] - Optional pre-defined longitude
 */
const getWeatherByCity = async (city, latitude, longitude) => {
  try {
    let lat = latitude;
    let lng = longitude;

    if (!lat || !lng) {
      const coords = await geocodeCity(city);
      if (coords) {
        lat = coords.lat;
        lng = coords.lng;
      } else {
        // Default to a fallback (e.g., Paris coordinates)
        logger.warn(`Could not resolve coordinates for ${city}. Falling back to default coordinates.`);
        lat = 48.8566;
        lng = 2.3522;
      }
    }

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`;
    logger.info(`Fetching weather forecast from Open-Meteo: lat=${lat}, lng=${lng}`);

    const response = await fetch(weatherUrl);
    if (!response.ok) {
      throw new Error(`Weather API responded with HTTP ${response.status}`);
    }

    const data = await response.json();
    
    // Map WMO code to human readable weather statuses
    const mapWmoCodeToText = (code) => {
      const codeMap = {
        0: 'Clear sky',
        1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
        45: 'Fog', 48: 'Depositing rime fog',
        51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
        61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
        71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
        77: 'Snow grains',
        80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
        85: 'Slight snow showers', 86: 'Heavy snow showers',
        95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail',
      };
      return codeMap[code] || 'Unknown';
    };

    const current = {
      temp: data.current.temperature_2m,
      feelsLike: data.current.apparent_temperature,
      rain: data.current.rain,
      condition: mapWmoCodeToText(data.current.weather_code),
      windSpeed: data.current.wind_speed_10m,
    };

    const forecast = [];
    if (data.daily && data.daily.time) {
      for (let i = 0; i < Math.min(data.daily.time.length, 5); i++) {
        forecast.push({
          date: data.daily.time[i],
          maxTemp: data.daily.temperature_2m_max[i],
          minTemp: data.daily.temperature_2m_min[i],
          rainChance: data.daily.precipitation_probability_max[i] || 0,
          condition: mapWmoCodeToText(data.daily.weather_code[i]),
        });
      }
    }

    return {
      coordinates: { lat, lng },
      current,
      forecast,
    };
  } catch (error) {
    logger.error(`Error in getWeatherByCity: ${error.message}`);
    // Return structured default mock weather
    return getMockWeather();
  }
};

/**
 * Returns mock weather data on failure
 */
const getMockWeather = () => {
  return {
    coordinates: { lat: 48.8566, lng: 2.3522 },
    current: {
      temp: 22.5,
      feelsLike: 23,
      rain: 0,
      condition: 'Partly cloudy',
      windSpeed: 12.5,
    },
    forecast: [
      { date: new Date().toISOString().split('T')[0], maxTemp: 24, minTemp: 15, rainChance: 10, condition: 'Partly cloudy' },
      { date: new Date(Date.now() + 86400000).toISOString().split('T')[0], maxTemp: 26, minTemp: 16, rainChance: 0, condition: 'Sunny' },
      { date: new Date(Date.now() + 172800000).toISOString().split('T')[0], maxTemp: 25, minTemp: 17, rainChance: 20, condition: 'Mainly clear' },
      { date: new Date(Date.now() + 259200000).toISOString().split('T')[0], maxTemp: 22, minTemp: 14, rainChance: 60, condition: 'Light rain' },
      { date: new Date(Date.now() + 345600000).toISOString().split('T')[0], maxTemp: 20, minTemp: 13, rainChance: 40, condition: 'Showers' },
    ],
  };
};

module.exports = {
  geocodeCity,
  getWeatherByCity,
};
