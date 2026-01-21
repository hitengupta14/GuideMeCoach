import React from 'react';
// @ts-ignore - packages installed correctly  
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// @ts-ignore - packages installed correctly
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import DashboardScreen from '../screens/home/DashboardScreen';
import ProfileScreen from '../screens/home/ProfileScreen';
import VideoUploadScreen from '../screens/video/VideoUploadScreen';
import WearablesScreen from '../screens/wearables/WearablesScreen';
import SubscriptionScreen from '../screens/subscription/SubscriptionScreen';
import ExercisesListScreen from '../screens/exercises/ExercisesListScreen';
import ExerciseDetailScreen from '../screens/exercises/ExerciseDetailScreen';
import WorkoutLoggerScreen from '../screens/workouts/WorkoutLoggerScreen';
import AIPlannerScreen from '../screens/planner/AIPlannerScreen';
import ProgressScreen from '../screens/progress/ProgressScreen';

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

function ExercisesStack() {
  const [selectedExercise, setSelectedExercise] = React.useState<any>(null);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerTintColor: '#000',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      {!selectedExercise ? (
        <Stack.Screen
          name="ExercisesList"
          options={{ title: 'Exercises' }}
        >
          {() => (
            <ExercisesListScreen
              onSelectExercise={(ex) => setSelectedExercise(ex)}
            />
          )}
        </Stack.Screen>
      ) : (
        <Stack.Screen
          name="ExerciseDetail"
          options={{ title: selectedExercise.name }}
        >
          {() => (
            <ExerciseDetailScreen
              exerciseId={selectedExercise.id}
              exerciseName={selectedExercise.name}
              onBack={() => setSelectedExercise(null)}
            />
          )}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
}

function WorkoutsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerTintColor: '#000',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen
        name="WorkoutLogger"
        component={WorkoutLoggerScreen}
        options={{ title: 'Workout Logger' }}
      />
    </Stack.Navigator>
  );
}

function PlannerStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="AIPlannerMain"
        component={AIPlannerScreen}
      />
    </Stack.Navigator>
  );
}

function ProgressStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="ProgressMain"
        component={ProgressScreen}
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
          } else if (route.name === 'Exercises') {
            iconName = focused ? 'dumbbell' : 'dumbbell';
          } else if (route.name === 'Workouts') {
            iconName = focused ? 'fire' : 'fire-outline';
          } else if (route.name === 'Planner') {
            iconName = focused ? 'robot' : 'robot-outline';
          } else if (route.name === 'Progress') {
            iconName = focused ? 'chart-line' : 'chart-line';
          } else if (route.name === 'Video') {
            iconName = focused ? 'video' : 'video-outline';
          } else if (route.name === 'Wearables') {
            iconName = focused ? 'heart-pulse' : 'heart-outline';
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
        tabBarLabelStyle: { fontSize: 10, marginTop: -8 },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="Exercises"
        component={ExercisesStack}
        options={{ title: 'Exercises' }}
      />
      <Tab.Screen
        name="Workouts"
        component={WorkoutsStack}
        options={{ title: 'Workouts' }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressStack}
        options={{ title: 'Progress' }}
      />
      <Tab.Screen
        name="Planner"
        component={PlannerStack}
        options={{ title: 'Planner' }}
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
    </Tab.Navigator>
  );
}
