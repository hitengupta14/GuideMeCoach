import React from 'react';
// @ts-ignore - packages installed correctly  
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// @ts-ignore - packages installed correctly
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import DashboardScreen from '../screens/home/DashboardScreen';
import VideoUploadScreen from '../screens/video/VideoUploadScreen';
import WearablesScreen from '../screens/wearables/WearablesScreen';
import SubscriptionScreen from '../screens/subscription/SubscriptionScreen';
import ProfileScreen from '../screens/home/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerTintColor: '#000',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

function VideoStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerTintColor: '#000',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen
        name="VideoUploadMain"
        component={VideoUploadScreen}
        options={{ title: 'Form Analysis' }}
      />
    </Stack.Navigator>
  );
}

function WearablesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerTintColor: '#000',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen
        name="WearablesMain"
        component={WearablesScreen}
        options={{ title: 'Health Data' }}
      />
    </Stack.Navigator>
  );
}

export default function AppStack() {
  return (
    <Tab.Navigator
      id="TabNavigator"
      screenOptions={({ route }: any) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }: any) => {
          let iconName = 'home';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Video') {
            iconName = focused ? 'video' : 'video-outline';
          } else if (route.name === 'Wearables') {
            iconName = focused ? 'heart-pulse' : 'heart-outline';
          } else if (route.name === 'Subscription') {
            iconName = focused ? 'crown' : 'crown-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'cog' : 'cog-outline';
          }

          return (
            <MaterialCommunityIcons
              name={iconName as any}
              size={size}
              color={color}
            />
          );
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#999',
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="Video"
        component={VideoStack}
        options={{ title: 'Video' }}
      />
      <Tab.Screen
        name="Wearables"
        component={WearablesStack}
        options={{ title: 'Health' }}
      />
      <Tab.Screen
        name="Subscription"
        component={SubscriptionScreen}
        options={{ title: 'Pro' }}
      />
    </Tab.Navigator>
  );
}
