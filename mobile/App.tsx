import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text, View, StyleSheet } from 'react-native';

// Initialize dictionary on app start
import { initializeBasicDictionary, loadComprehensiveDictionary } from './src/lib/dictionaryLoader';

// Screens (to be created)
import HomeScreen from './src/screens/HomeScreen';
import JourneyScreen from './src/screens/JourneyScreen';
import ArenaScreen from './src/screens/ArenaScreen';
import DailyScreen from './src/screens/DailyScreen';
import WordBankScreen from './src/screens/WordBankScreen';
import GameScreen from './src/screens/GameScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#64748b',
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <View style={styles.tabIcon}>
              <Text style={{ fontSize: 20 }}>🏠</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name="Journey" 
        component={JourneyScreen}
        options={{
          title: 'Journey',
          tabBarIcon: ({ color }) => (
            <View style={styles.tabIcon}>
              <Text style={{ fontSize: 20 }}>🎯</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name="Arena" 
        component={ArenaScreen}
        options={{
          title: 'Arena',
          tabBarIcon: ({ color }) => (
            <View style={styles.tabIcon}>
              <Text style={{ fontSize: 20 }}>⚔️</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name="Daily" 
        component={DailyScreen}
        options={{
          title: 'Daily',
          tabBarIcon: ({ color }) => (
            <View style={styles.tabIcon}>
              <Text style={{ fontSize: 20 }}>📅</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name="WordBank" 
        component={WordBankScreen}
        options={{
          title: 'Words',
          tabBarIcon: ({ color }) => (
            <View style={styles.tabIcon}>
              <Text style={{ fontSize: 20 }}>📚</Text>
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  useEffect(() => {
    // Ensure dictionary is initialized
    initializeBasicDictionary();
    // Load comprehensive dictionary in background
    loadComprehensiveDictionary().catch(err => {
      console.warn('Failed to load comprehensive dictionary:', err);
    });
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          <Stack.Screen name="Game" component={GameScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

