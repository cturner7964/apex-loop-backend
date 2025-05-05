// Apex Loop MVP Frontend (Expo / React Native)

import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView, { Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';

export default function App() {
  const [duration, setDuration] = useState(null);
  const [loading, setLoading] = useState(false);
  const [route, setRoute] = useState(null);
  const [region, setRegion] = useState(null);

  const handleGenerateLoop = async (minutes) => {
    setDuration(minutes);
    setLoading(true);
    setRoute(null);
    
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access location was denied');
      setLoading(false);
      return;
    }

    let location = await Location.getCurrentPositionAsync({});

    try {
      const res = await axios.post("https://your-render-url/api/generate-loop", {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        duration_minutes: minutes
      });

      const coords = res.data.polyline.coordinates.map(([lng, lat]) => ({
        latitude: lat,
        longitude: lng
      }));

      setRoute(coords);
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1
      });
    } catch (err) {
      alert('Failed to generate route');
    } finally {
      setLoading(false);
    }
  };

  if (route) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Your Apex Loop</Text>
        <MapView style={styles.map} region={region}>
          <Polyline coordinates={route} strokeWidth={4} strokeColor="orange" />
        </MapView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How long do you want to go out for?</Text>
      {[30, 60, 90].map((min) => (
        <TouchableOpacity key={min} style={styles.button} onPress={() => handleGenerateLoop(min)}>
          <Text style={styles.buttonText}>{min} minutes</Text>
        </TouchableOpacity>
      ))}
      {loading && <ActivityIndicator size="large" color="white" style={{ marginTop: 20 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  title: {
    fontSize: 22,
    color: 'white',
    marginBottom: 40
  },
  button: {
    backgroundColor: '#1e1e1e',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginVertical: 10
  },
  buttonText: {
    color: 'white',
    fontSize: 18
  },
  map: {
    marginTop: 20,
    width: '100%',
    height: '75%'
  }
});
