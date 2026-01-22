import React from 'react';
// @ts-ignore - packages installed correctly  
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// @ts-ignore - packages installed correctly
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeStore } from '../store/theme';

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
import NutritionScreen from '../screens/nutrition/NutritionScreen';
import ConversationsScreen from '../screens/chat/ConversationsScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import MoreMenuScreen from '../screens/more/MoreMenuScreen';
import BodyMapScreen from '../screens/more/BodyMapScreen';
import MuscleExercisesScreen from '../screens/more/MuscleExercisesScreen';
import FavoritesScreen from '../screens/more/FavoritesScreen';
import AchievementsScreen from '../screens/more/AchievementsScreen';
import AiInsightsScreen from '../screens/more/AiInsightsScreen';
import RecoveryScreen from '../screens/more/RecoveryScreen';
import FormFeedbackScreen from '../screens/more/FormFeedbackScreen';
import SettingsScreen from '../screens/more/SettingsScreen';
import ToolsScreen from '../screens/more/ToolsScreen';
import PlansScreen from '../screens/more/PlansScreen';
import AIHubScreen from '../screens/more/AIHubScreen';
import ProgressV2Screen from '../screens/more/ProgressV2Screen';

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

function NutritionStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="NutritionMain" component={NutritionScreen} />
    </Stack.Navigator>
  );
}

function ChatStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerTintColor: '#000',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="Conversations" component={ConversationsScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
}

function MoreStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerTintColor: '#000',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="MoreMenu" component={MoreMenuScreen} options={{ title: 'More' }} />
      <Stack.Screen name="BodyMap" component={BodyMapScreen} options={{ title: 'Body Map' }} />
      <Stack.Screen name="MuscleExercises" component={MuscleExercisesScreen} options={{ title: 'Muscle Exercises' }} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'Favorites' }} />
      <Stack.Screen name="Achievements" component={AchievementsScreen} options={{ title: 'Achievements' }} />
      <Stack.Screen name="AiInsights" component={AiInsightsScreen} options={{ title: 'AI Insights' }} />
      <Stack.Screen name="Recovery" component={RecoveryScreen} options={{ title: 'Recovery' }} />
      <Stack.Screen name="FormFeedback" component={FormFeedbackScreen} options={{ title: 'Form Feedback' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="Tools" component={ToolsScreen} options={{ title: 'Tools' }} />
      <Stack.Screen name="Plans" component={PlansScreen} options={{ title: 'My Plans' }} />
      <Stack.Screen name="AIHub" component={AIHubScreen} options={{ title: 'AI Hub' }} />
      <Stack.Screen name="ProgressV2" component={ProgressV2Screen} options={{ title: 'Progress V2' }} />
    </Stack.Navigator>
  );
}

export default function AppStack() {
  const { colors } = useThemeStore();
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
            iconName = 'fire';
          } else if (route.name === 'Planner') {
            iconName = focused ? 'robot' : 'robot-outline';
          } else if (route.name === 'Progress') {
            iconName = focused ? 'chart-line' : 'chart-line';
          } else if (route.name === 'Video') {
            iconName = focused ? 'video' : 'video-outline';
          } else if (route.name === 'Wearables') {
            iconName = focused ? 'heart-pulse' : 'heart-outline';
          } else if (route.name === 'Nutrition') {
            iconName = focused ? 'food-apple' : 'food-apple-outline';
          } else if (route.name === 'Chat') {
            iconName = focused ? 'message' : 'message-outline';
          } else if (route.name === 'More') {
            iconName = focused ? 'dots-horizontal' : 'dots-horizontal';
          }

          return (
            <MaterialCommunityIcons
              name={iconName as any}
              size={size}
              color={color}
            />
          );
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: { fontSize: 10, marginTop: -8 },
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
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
        name="Nutrition"
        component={NutritionStack}
        options={{ title: 'Nutrition' }}
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
        name="Chat"
        component={ChatStack}
        options={{ title: 'Chat' }}
      />
      <Tab.Screen
        name="More"
        component={MoreStack}
        options={{ title: 'More' }}
      />
    </Tab.Navigator>
  );
}
