import { useState, useEffect } from 'react';

import WeatherInfo from '@/model/WeatherInfo';

const useWeatherInfo = (apiKey: string, cityIds: number[], deviceInfo: WeatherInfo) => {
  const [weatherData, setWeatherData] = useState<WeatherInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeatherData = async () => {
      setLoading(true);
      setError(null);

      // TODO pagination, handle too many data in cityIds
      // TODO  It's a long-running process. I try to avoid this situation using tanstack query and (try) to use cancelable requests.

      try {
        const apiUrl = `https://api.openweathermap.org/data/2.5/group?id=${cityIds.join(',')}&appid=${apiKey}&units=metric`;

        const response = await fetch(apiUrl);
        const data = await response.json();

        data.list.unshift(deviceInfo);

        if (response.status === 200) {
          setWeatherData(data.list as WeatherInfo[]);
        } else {
          setError('Failed to load weather data');
        }
      } catch (err) {
        setError(`Error fetching data: ${err}`);
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherData();
  }, [apiKey, cityIds, deviceInfo]);

  return { weatherData, loading, error };
};

export default useWeatherInfo;
