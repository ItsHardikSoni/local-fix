import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState, Platform } from 'react-native';
import * as Location from 'expo-location';
import { useUser } from './UserContext';

type LocationContextValue = {
  location: Location.LocationObject | null;
  locationLabel: string | null;
  locationLoading: boolean;
  locationError: string | null;
  refreshLocation: () => Promise<Location.LocationObject | null>;
};

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const { session } = useUser();
  const userId = session?.user.id ?? null;

  return (
    <LocationSessionProvider key={userId ?? 'signed-out'} userId={userId}>
      {children}
    </LocationSessionProvider>
  );
}

function LocationSessionProvider({
  children,
  userId,
}: {
  children: ReactNode;
  userId: string | null;
}) {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const requestRef = useRef<Promise<Location.LocationObject | null> | null>(null);
  const geocodedCoordinatesRef = useRef<string | null>(null);

  const refreshLocation = useCallback(() => {
    if (requestRef.current) return requestRef.current;

    const request = (async (): Promise<Location.LocationObject | null> => {
      setLocationLoading(true);
      setLocationError(null);

      try {
        const currentPermission = await Location.getForegroundPermissionsAsync();
        const permission = currentPermission.granted
          ? currentPermission
          : await Location.requestForegroundPermissionsAsync();

        if (!permission.granted) {
          setLocationError(permission.canAskAgain
            ? 'Location permission is required to include your service location.'
            : 'Location access is disabled. Enable it for LocalFix in your device settings.');
          return null;
        }

        if (Platform.OS === 'android') {
          await Location.enableNetworkProviderAsync();
        }

        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation(currentLocation);

        const coordinates = currentLocation.coords;
        const fallbackLabel = `${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}`;
        const geocodeKey = `${coordinates.latitude.toFixed(3)},${coordinates.longitude.toFixed(3)}`;
        if (geocodedCoordinatesRef.current !== geocodeKey) {
          geocodedCoordinatesRef.current = geocodeKey;
          try {
            const [address] = await Location.reverseGeocodeAsync({
              latitude: coordinates.latitude,
              longitude: coordinates.longitude,
            });
            const city = address?.city || address?.district || address?.subregion;
            const region = address?.region;
            setLocationLabel(city && region && city !== region
              ? `${city}, ${region}`
              : city || region || address?.country || fallbackLabel);
          } catch {
            setLocationLabel(fallbackLabel);
          }
        }

        return currentLocation;
      } catch (error) {
        const details = error instanceof Error ? error.message : 'Unknown location error';
        setLocationError(`Unable to get your location. Check that device location services are on and try again. ${details}`);
        return null;
      } finally {
        setLocationLoading(false);
        requestRef.current = null;
      }
    })();

    requestRef.current = request;
    return request;
  }, []);

  useEffect(() => {
    if (!userId) return;

    void refreshLocation();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refreshLocation();
      }
    });

    return () => subscription.remove();
  }, [refreshLocation, userId]);

  return (
    <LocationContext.Provider value={{
      location,
      locationLabel,
      locationLoading,
      locationError,
      refreshLocation,
    }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation(): LocationContextValue {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
