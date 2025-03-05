import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
} from 'react-native';
import { createStackNavigator, StackScreenProps } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';

import { OWM_API_KEY } from '@env';
import { ScrollView } from 'react-native-gesture-handler';

// TODO move to separate class
// TODO minimize type to keep only essential info
type WeatherInfo = {
  coord: { lon: number; lat: number };
  dt: number;
  id: number;
  main: { temp: number; feels_like: number; temp_min: number; temp_max: number; pressure: number; sea_level: number; grnd_level: number; humidity: number };
  name: string;
  sys: { country: string; timezone: number; sunrise: number; sunset: number };
  visibility: number;
  weather: { id: number; main: string; description: string; icon: string }[];
  wind: { speed: number; deg: number };
  clouds: { all: number };
};

// TODO move to separate file
type WeatherDetailsProps = {
  weatherInfo: WeatherInfo;
  showArrow?: boolean
};

type WeatherPropertyProps = {
  name: string;
  value: string | number;
};

// TODO move to separate file with navigation logic
type RootStackParamList = {
  Main: undefined;
  Details: WeatherDetailsProps;
};

type WeatherMainPageProps = StackScreenProps<RootStackParamList, 'Main'>;
type WeatherDetailsPageProps = StackScreenProps<RootStackParamList, 'Details'>;

const ArrowIcon: React.FC = () => <Text style={styles.arrow}>{'\u276F'}</Text>;

const WeatherListItem: React.FC<WeatherDetailsProps> = ({ weatherInfo, showArrow = true }: WeatherDetailsProps) => {
  return (
    <View style={styles.mainListItem}>
      <View style={styles.mainListItemComponent}>
        <Image source={{ uri: `https://openweathermap.org/img/wn/${weatherInfo.weather[0].icon}@2x.png` }}
          style={styles.mainListItemIcon} />
        <View>
          <Text style={styles.mainListItemTitle}>{weatherInfo.name}</Text>
          <Text style={styles.mainListItemSubtitle}>{weatherInfo.weather[0].main}</Text>
        </View>
      </View>

      <View style={styles.mainListItemComponent}>
        <Text style={styles.temp}>{weatherInfo.main.temp} °C</Text>
        {showArrow ? <ArrowIcon /> : null}
      </View>
    </View>
  );
};

const DetailsListItem: React.FC<WeatherPropertyProps> = ({ name, value }: WeatherPropertyProps) => {
  return (
    <>
      <View style={styles.separator} />
      <View style={styles.detailsSubListItem}>
        <Text style={styles.detailsSubListItemName}>{name}</Text>
        <Text style={styles.detailsSubListItemValue}>{value}</Text>
      </View>
    </>
  );
};

const WeatherDetails: React.FC<WeatherDetailsPageProps> = ({ route }: WeatherDetailsPageProps) => {
  const { weatherInfo } = route.params;

  return (
    <>
      <WeatherListItem weatherInfo={weatherInfo} showArrow={false} />
      <ScrollView>
        <DetailsListItem name='Humidity' value={weatherInfo.main.humidity + '%'} />
        <DetailsListItem name='Pressure' value={weatherInfo.main.pressure + ' hPa'} />
        <DetailsListItem name='Wind Speed' value={weatherInfo.wind.speed + ' mps'} />
        <DetailsListItem name='Cloud Cover' value={weatherInfo.clouds.all + '%'} />
      </ScrollView>
    </>
  );
}

const WeatherMain: React.FC<WeatherMainPageProps> = ({ navigation }: WeatherMainPageProps) => {
  const [weatherData, setWeatherData] = useState<WeatherInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // TODO move to separate provider
  const cityIds = [
    703448, // Kyiv, UA
    692194, // Sumy, UA
    756135, // Warsaw, PL
    3081368, // Wrocław, PL
    3067696, // Prague, CZ
    3077916, // České Budějovice, CZ
    2950159, // Berlin, DE
    2867714, // Munich, DE
    3247449, // Aachen, DE
    5815135, // Washington, US
    5128581, // New York City, US
  ];

  useEffect(() => {
    // TODO implement pagination
    const fetchWeatherData = async () => {
      setLoading(true);
      setError(null);

      try {
        const apiUrl = `https://api.openweathermap.org/data/2.5/group?id=${cityIds.join(',')}&appid=${OWM_API_KEY}&units=metric`;

        console.log(`fetch ${apiUrl}`);

        const response = await fetch(apiUrl);
        const data = await response.json();

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
  }, []);

  if (loading) {
    return (
      <>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      </>
    );
  }

  if (error) {
    return (
      <>
        <View style={styles.centered}>
          <Text style={styles.error}>{error}</Text>
        </View>
      </>
    );
  }

  return (
    // TODO move renderItem to separate component
    // TODO implement drag to reload
    <>
      <FlatList
        data={weatherData}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <>
            <TouchableOpacity onPress={() => navigation.navigate('Details', { weatherInfo: item })}>
              <WeatherListItem weatherInfo={item} />
            </TouchableOpacity>
            <View style={styles.separator} />
          </>
        )}
      />
    </>
  );
};

const Stack = createStackNavigator();

const App = (): React.JSX.Element => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: 'lightgray' },
          headerTintColor: 'black',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen name="Main" component={WeatherMain as React.FC<any>} />
        <Stack.Screen name="Details" component={WeatherDetails as React.FC<any>} />
      </Stack.Navigator>
    </NavigationContainer>
  )
};

// TODO support themes with useColorScheme
const styles = StyleSheet.create({
  arrow: {
    fontSize: 18,
    padding: 5,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    color: 'red',
    fontSize: 18,
  },
  mainListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white'
  },
  mainListItemComponent: {
    flexDirection: 'row',
    gap: 10
  },
  mainListItemIcon: {
    width: 50,
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 100 / 2,
    overflow: 'hidden',
  },
  mainListItemTitle: {
    fontSize: 20,
  },
  mainListItemSubtitle: {
    fontSize: 18,
    color: 'gray',
  },
  temp: {
    fontSize: 18,
    fontWeight: 'bold',
    backgroundColor: '#B9D3DE',
    color: '#f5f5f5',
    padding: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  detailsSubListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 20,
  },
  detailsSubListItemName: {
    fontSize: 18
  },
  detailsSubListItemValue: {
    fontSize: 18,
    color: 'gray',
  },
  separator: {
    height: 1,
    backgroundColor: '#ccc',
  },
});

export default App;
