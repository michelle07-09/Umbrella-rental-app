import 'react-native-url-polyfill/auto';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { supabase } from './src/supabase';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import SplashScreen from './src/screens/SplashScreen';
import AuthScreen from './src/screens/AuthScreen';
import MapScreen from './src/screens/MapScreen';
import ActiveRentalScreen from './src/screens/ActiveRentalScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import PaymentSuccessScreen from './src/screens/PaymentSuccessScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs({ userId, activeRental, onRentalEnded }) {
  const { theme, isDark } = useTheme();

  const tabOptions = ({ route }) => ({
    headerShown: false,
    tabBarActiveTintColor: theme.accent,
    tabBarInactiveTintColor: theme.textMuted,
    tabBarStyle: {
      backgroundColor: theme.tabBar,
      borderTopColor: theme.tabBorder,
      borderTopWidth: 1,
      height: 64,
      paddingBottom: 10,
    },
    tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
    tabBarIcon: ({ focused }) => {
      const icons = { Peta: '🗺️', Sewa: '☂️', Profil: '👤' };
      return <Text style={{ fontSize: focused ? 22 : 19, opacity: focused ? 1 : 0.55 }}>{icons[route.name]}</Text>;
    },
  });

  return (
    <Tab.Navigator screenOptions={tabOptions}>
      <Tab.Screen name="Peta">
        {() => <MapScreen userId={userId} activeRental={activeRental} />}
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
            <ActiveRentalScreen rental={activeRental} userId={userId} onRentalEnded={onRentalEnded} />
          ) : (
            <View style={[styles.noRental, { backgroundColor: theme.bg }]}>
              <Text style={styles.noRentalEmoji}>☂️</Text>
              <Text style={[styles.noRentalTitle, { color: theme.text }]}>Tidak Ada Sewa Aktif</Text>
              <Text style={[styles.noRentalSub, { color: theme.textMuted }]}>Tap titik ☂️ di peta untuk mulai menyewa.</Text>
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

function MainScreen({ userId, activeRental, onRentalEnded, fetchActiveRental }) {
  const navigation = useNavigation();
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchActiveRental(userId);
    });
    return unsubscribe;
  }, [navigation, userId]);

  return <MainTabs userId={userId} activeRental={activeRental} onRentalEnded={onRentalEnded} />;
}

function AppContent() {
  const { theme, isDark } = useTheme();
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

  const navTheme = {
    dark: isDark,
    colors: {
      primary: theme.accent,
      background: theme.bg,
      card: theme.card,
      text: theme.text,
      border: theme.border,
      notification: '#ef4444',
    },
  };

  if (showSplash) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <SplashScreen onDone={() => setShowSplash(false)} />
      </SafeAreaProvider>
    );
  }

  if (session === undefined) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.bg }]}>
        <ActivityIndicator color={theme.accent} size="large" />
      </View>
    );
  }

  if (!session) {
    return (
      <SafeAreaProvider>
        <StatusBar style={theme.statusBar} />
        <AuthScreen />
      </SafeAreaProvider>
    );
  }

  const userId = session.user.id;

  return (
    <SafeAreaProvider>
      <StatusBar style={theme.statusBar} />
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          <Stack.Screen name="Main">
            {() => (
              <MainScreen
                userId={userId}
                activeRental={activeRental}
                fetchActiveRental={fetchActiveRental}
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

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  noRental: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  noRentalEmoji: { fontSize: 64, marginBottom: 16, opacity: 0.6 },
  noRentalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  noRentalSub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});