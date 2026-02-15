import React from 'react';
// @ts-ignore - packages installed correctly
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileSetupScreen from '../screens/auth/ProfileSetupScreen';

const Stack = createNativeStackNavigator();

export default function OnboardingStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="ProfileSetup"
        component={ProfileSetupScreen}
        options={{ title: 'Complete Profile' }}
      />
    </Stack.Navigator>
  );
}
