// src/services/location.ts
import * as Location from 'expo-location';

export type Coords = {
  latitude: number;
  longitude: number;
};

export async function getCurrentCoords(): Promise<Coords> {
  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== 'granted') {
    throw new Error('Location permission denied');
  }

  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude,
  };
}
