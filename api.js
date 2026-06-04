/**
 * AirPulse API Services Module
 * Handles interactions with Open-Meteo and WAQI APIs.
 */

export const ApiService = {
  /**
   * Search locations using fuzzy geocoding fuzzy matching
   * @param {string} query - The city name to search for
   * @returns {Promise<Array>} List of matching locations
   */
  async searchLocations(query) {
    if (!query || query.trim().length < 2) return [];
    
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Geocoding search failed');
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error in searchLocations:', error);
      return [];
    }
  },

  /**
   * Fetch Air Quality data from Open-Meteo (Keyless Global Provider)
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<Object>} Formatted air quality and weather data
   */
  async fetchFromOpenMeteo(lat, lng) {
    const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=european_aqi,us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&hourly=european_aqi,us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&timezone=auto`;
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto`;

    try {
      const [aqRes, weatherRes] = await Promise.all([
        fetch(aqUrl),
        fetch(weatherUrl)
      ]);

      if (!aqRes.ok || !weatherRes.ok) throw new Error('Failed to retrieve data from Open-Meteo');

      const aqData = await aqRes.json();
      const weatherData = await weatherRes.json();

      return this.formatOpenMeteoResponse(aqData, weatherData, lat, lng);
    } catch (error) {
      console.error('Error in fetchFromOpenMeteo:', error);
      throw error;
    }
  },

  /**
   * Helper to map Open-Meteo response into unified dashboard structure
   */
  formatOpenMeteoResponse(aqData, weatherData, lat, lng) {
    const cur = aqData.current;
    
    // We map WMO weather codes to simple descriptions
    const wmoCodes = {
      0: 'Clear sky',
      1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
      45: 'Foggy', 48: 'Foggy',
      51: 'Drizzle', 53: 'Drizzle', 55: 'Drizzle',
      61: 'Light rain', 63: 'Moderate rain', 65: 'Heavy rain',
      71: 'Light snow', 73: 'Moderate snow', 75: 'Heavy snow',
      80: 'Rain showers', 81: 'Rain showers', 82: 'Rain showers',
      95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm'
    };

    const weatherCode = weatherData.current.weather_code;
    const weatherDesc = wmoCodes[weatherCode] || 'Cloudy';

    return {
      provider: 'Open-Meteo',
      lat: lat,
      lng: lng,
      aqi: Math.round(cur.us_aqi),
      european_aqi: Math.round(cur.european_aqi),
      status: this.getAQIStatus(cur.us_aqi),
      description: this.getAQIDescription(cur.us_aqi),
      weather: {
        temp: Math.round(weatherData.current.temperature_2m),
        humidity: Math.round(weatherData.current.relative_humidity_2m),
        desc: weatherDesc,
        code: weatherCode
      },
      pollutants: {
        pm25: cur.pm2_5,
        pm10: cur.pm10,
        o3: cur.ozone,
        no2: cur.nitrogen_dioxide,
        so2: cur.sulphur_dioxide,
        co: cur.carbon_monoxide ? (cur.carbon_monoxide / 1000).toFixed(2) : 0 // Convert ug/m3 to mg/m3
      },
      hourly: aqData.hourly,
      timezone: aqData.timezone
    };
  },

  /**
   * Fetch Air Quality data from WAQI API
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {string} token - WAQI API Token Key
   * @returns {Promise<Object>} Unified dashboard structure
   */
  async fetchFromWAQI(lat, lng, token) {
    if (!token) throw new Error('WAQI API token is missing');
    
    const url = `https://api.waqi.info/feed/geo:${lat};${lng}/?token=${token}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('WAQI network response failed');
      const data = await response.json();
      
      if (data.status !== 'ok') {
        throw new Error(data.data || 'Invalid WAQI Token');
      }

      // Also get weather from open-meteo as WAQI weather data is sometimes incomplete or missing
      let weather = { temp: 22, humidity: 55, desc: 'Sunny', code: 0 };
      try {
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto`;
        const weatherRes = await fetch(weatherUrl);
        if (weatherRes.ok) {
          const weatherData = await weatherRes.json();
          const wmoCodes = {
            0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
            45: 'Foggy', 48: 'Foggy', 51: 'Drizzle', 53: 'Drizzle', 55: 'Drizzle',
            61: 'Light rain', 63: 'Moderate rain', 65: 'Heavy rain', 95: 'Thunderstorm'
          };
          weather = {
            temp: Math.round(weatherData.current.temperature_2m),
            humidity: Math.round(weatherData.current.relative_humidity_2m),
            desc: wmoCodes[weatherData.current.weather_code] || 'Cloudy',
            code: weatherData.current.weather_code
          };
        }
      } catch (e) {
        console.warn('Weather fetch fallback failed, using default values', e);
      }

      return this.formatWAQIResponse(data.data, weather, lat, lng);
    } catch (error) {
      console.error('Error in fetchFromWAQI:', error);
      throw error;
    }
  },

  /**
   * Helper to map WAQI response to unified dashboard structure
   */
  formatWAQIResponse(data, weather, reqLat, reqLng) {
    const iaqi = data.iaqi || {};
    const aqi = data.aqi;
    
    // WAQI returns concentration values as simple numbers inside iaqi objects
    return {
      provider: 'WAQI',
      cityName: data.city.name,
      lat: data.city.geo ? data.city.geo[0] : reqLat,
      lng: data.city.geo ? data.city.geo[1] : reqLng,
      aqi: aqi,
      status: this.getAQIStatus(aqi),
      description: this.getAQIDescription(aqi),
      weather: weather,
      pollutants: {
        pm25: iaqi.pm25 ? iaqi.pm25.v : 0,
        pm10: iaqi.pm10 ? iaqi.pm10.v : 0,
        o3: iaqi.o3 ? iaqi.o3.v : 0,
        no2: iaqi.no2 ? iaqi.no2.v : 0,
        so2: iaqi.so2 ? iaqi.so2.v : 0,
        co: iaqi.co ? iaqi.co.v : 0
      },
      // WAQI does not give 7-day hourly forecasts on free tier easily, so we generate fallback forecast arrays 
      // based on current station readings with mild variance to render consistent forecasting graphs
      hourly: this.generateMockForecast(aqi, iaqi)
    };
  },

  /**
   * Test if a WAQI token is valid by hitting the general 'shanghai' feed
   * @param {string} token - Token Key
   * @returns {Promise<boolean>} Whether validation succeeded
   */
  async testWAQIToken(token) {
    if (!token) return false;
    const url = `https://api.waqi.info/feed/shanghai/?token=${token}`;
    try {
      const response = await fetch(url);
      if (!response.ok) return false;
      const data = await response.json();
      return data.status === 'ok';
    } catch (e) {
      return false;
    }
  },

  /**
   * Helper to define AQI qualitative band from US AQI score
   */
  getAQIStatus(aqi) {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  },

  /**
   * Helper to define general guidance text based on AQI value
   */
  getAQIDescription(aqi) {
    if (aqi <= 50) {
      return 'Air quality is satisfactory, and air pollution poses little or no risk.';
    } else if (aqi <= 100) {
      return 'Air quality is acceptable. However, active individuals or individuals with respiratory illnesses should consider limiting heavy outdoor work.';
    } else if (aqi <= 150) {
      return 'Members of sensitive groups may experience health effects. The general public is less likely to be affected.';
    } else if (aqi <= 200) {
      return 'Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects.';
    } else if (aqi <= 300) {
      return 'Health warnings of emergency conditions. The entire population is more likely to be affected.';
    } else {
      return 'Health alert: everyone may experience more serious health effects. Outdoor activities should be completely avoided.';
    }
  },

  /**
   * Generate highly realistic forecasting curves from base values
   */
  generateMockForecast(baseAqi, iaqi) {
    const time = [];
    const us_aqi = [];
    const pm2_5 = [];
    const pm10 = [];
    const ozone = [];
    const nitrogen_dioxide = [];

    const now = new Date();
    
    // Generate 24 hours of simulated trends
    for (let i = 0; i < 24; i++) {
      const targetTime = new Date(now.getTime() + i * 60 * 60 * 1000);
      time.push(targetTime.toISOString());
      
      // Simulate diurnal swing (higher pollution in morning/evening rush, lower in afternoon)
      const hour = targetTime.getHours();
      const wave = Math.sin((hour - 4) * Math.PI / 12); // peak at 8 AM and 8 PM roughly
      const variance = 1 + wave * 0.15 + (Math.random() - 0.5) * 0.08;

      us_aqi.push(Math.round(baseAqi * variance));
      pm2_5.push(Math.round((iaqi.pm25 ? iaqi.pm25.v : baseAqi * 0.3) * variance));
      pm10.push(Math.round((iaqi.pm10 ? iaqi.pm10.v : baseAqi * 0.6) * variance));
      ozone.push(Math.round((iaqi.o3 ? iaqi.o3.v : 30) * (1 - wave * 0.2))); // ozone peaks mid-day in sunlight
      nitrogen_dioxide.push(Math.round((iaqi.no2 ? iaqi.no2.v : 20) * variance));
    }

    return {
      time,
      us_aqi,
      pm2_5,
      pm10,
      ozone,
      nitrogen_dioxide
    };
  }
};
