import 'react-native-url-polyfill/auto';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { supabase } from './src/supabase';
import SplashScreen from './src/screens/SplashScreen';
import AuthScreen from './src/screens/AuthScreen';
import MapScreen from './src/screens/MapScreen';
import ActiveRentalScreen from './src/screens/ActiveRentalScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import PaymentSuccessScreen from './src/screens/PaymentSuccessScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs({ userId, activeRental, onRentalStarted, onRentalEnded }) {
  return (
    <Tab.Navigator screenOptions={tabOptions}>
      <Tab.Screen name="Peta">
        {() => (
          <MapScreen
            userId={userId}
            activeRental={activeRental}
            onRentalStarted={onRentalStarted}
          />
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Sewa"
        options={{
          tabBarBadge: activeRental ? '!' : undefined,
          tabBarBadgeStyle: { backgroundColor: '#ef4444', color: '#fff', fontSize: 10 },
        }}
      >
        {() =>
          activeRental ? (
            <ActiveRentalScreen
              rental={activeRental}
              userId={userId}
              onRentalEnded={onRentalEnded}
            />
          ) : (
            <View style={styles.noRental}>
              <Text style={styles.noRentalEmoji}>☂️</Text>
              <Text style={styles.noRentalTitle}>Tidak Ada Sewa Aktif</Text>
              <Text style={styles.noRentalSub}>Tap titik ☂️ di peta untuk mulai menyewa.</Text>
            </View>
          )
        }
      </Tab.Screen>
      <Tab.Screen name="Profil">
        {() => <ProfileScreen userId={userId} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [session, setSession] = useState(undefined);
  const [activeRental, setActiveRental] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchActiveRental(session.user.id);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchActiveRental(session.user.id);
      else setActiveRental(null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function fetchActiveRental(userId) {
    const { data } = await supabase
      .from('rentals').select('*')
      .eq('user_id', userId).eq('active', true).maybeSingle();
    setActiveRental(data || null);
  }

  if (showSplash) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <SplashScreen onDone={() => setShowSplash(false)} />
      </SafeAreaProvider>
    );
  }

  if (session === undefined) {
    return <View style={styles.loading}><ActivityIndicator color="#1a7fe8" size="large" /></View>;
  }

  if (!session) {
    return <SafeAreaProvider><StatusBar style="light" /><AuthScreen /></SafeAreaProvider>;
  }

  const userId = session.user.id;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          <Stack.Screen name="Main">
            {() => (
              <MainTabs
                userId={userId}
                activeRental={activeRental}
                onRentalStarted={setActiveRental}
                onRentalEnded={() => { setActiveRental(null); fetchActiveRental(userId); }}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Payment" component={PaymentScreen} />
          <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const navTheme = {
  dark: true,
  colors: {
    primary: '#1a7fe8', background: '#05090f', card: '#0c1929',
    text: '#dde8f5', border: '#162840', notification: '#ef4444',
  },
};

const tabOptions = ({ route }) => ({
  headerShown: false,
  tabBarActiveTintColor: '#3b9eff',
  tabBarInactiveTintColor: '#3d5a73',
  tabBarStyle: { backgroundColor: '#0c1929', borderTopColor: '#162840', borderTopWidth: 1, height: 64, paddingBottom: 10 },
  tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
  tabBarIcon: ({ focused }) => {
    const icons = { Peta: '🗺️', Sewa: '☂️', Profil: '👤' };
    return <Text style={{ fontSize: focused ? 22 : 19, opacity: focused ? 1 : 0.55 }}>{icons[route.name]}</Text>;
  },
});

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: '#05090f', justifyContent: 'center', alignItems: 'center' },
  noRental: { flex: 1, backgroundColor: '#05090f', justifyContent: 'center', alignItems: 'center', padding: 32 },
  noRentalEmoji: { fontSize: 64, marginBottom: 16, opacity: 0.6 },
  noRentalTitle: { fontSize: 20, fontWeight: '800', color: '#dde8f5', marginBottom: 8 },
  noRentalSub: { fontSize: 14, color: '#3d5a73', textAlign: 'center', lineHeight: 20 },
});