import React from 'react';
// @ts-ignore - packages installed correctly  
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// @ts-ignore - packages installed correctly
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeStore } from '../store/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import DashboardScreen from '../screens/home/DashboardScreen';
import ProfileScreen from '../screens/home/ProfileScreen';
import TodayScreen from '../screens/today/TodayScreen';
import VideoUploadScreen from '../screens/video/VideoUploadScreen';
import WearablesScreen from '../screens/wearables/WearablesScreen';
import PricingScreen from '../screens/subscription/PricingScreen';
import CheckoutScreen from '../screens/subscription/CheckoutScreen';
import SubscriptionManagementScreen from '../screens/subscription/SubscriptionManagementScreen';
import ExercisesListScreen from '../screens/exercises/ExercisesListScreen';
import ExerciseDetailScreen from '../screens/exercises/ExerciseDetailScreen';
import WorkoutLoggerScreen from '../screens/workouts/WorkoutLoggerScreen';
import WorkoutHistoryScreen from '../screens/workouts/WorkoutHistoryScreen';
import WorkoutSummaryScreen from '../screens/workouts/WorkoutSummaryScreen';
import AIPlannerScreen from '../screens/planner/AIPlannerScreen';
import PlannerUnifiedScreen from '../screens/planner/PlannerUnifiedScreen';
import PlanDetailScreen from '../screens/planner/PlanDetailScreen';
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
import AdminHomeScreen from '../screens/admin/AdminHomeScreen';
import AdminSystemHealthScreen from '../screens/admin/AdminSystemHealthScreen';
import AdminExerciseApprovalScreen from '../screens/admin/AdminExerciseApprovalScreen';
import AdminExerciseEditorScreen from '../screens/admin/AdminExerciseEditorScreen';
import AdminActivityLogsScreen from '../screens/admin/AdminActivityLogsScreen';
import AdminAiLogsScreen from '../screens/admin/AdminAiLogsScreen';
import AdminAnalyticsScreen from '../screens/admin/AdminAnalyticsScreen';
import AdminAiMonitoringScreen from '@screens/admin/AdminAiMonitoringScreen';
import AdminMetricsScreen from '@screens/admin/AdminMetricsScreen';
import AdminSettingsScreen from '../screens/admin/AdminSettingsScreen';
import AdminUsersListScreen from '../screens/admin/AdminUsersListScreen';
import AdminUserDetailScreen from '../screens/admin/AdminUserDetailScreen';
import AdminSubscriptionsScreen from '../screens/admin/AdminSubscriptionsScreen';
import AdminEmailCampaignsScreen from '../screens/admin/AdminEmailCampaignsScreen';
import AdminCreateEmailCampaignScreen from '../screens/admin/AdminCreateEmailCampaignScreen';
import AdminAdminUsersScreen from '../screens/admin/AdminAdminUsersScreen';
import AdminAuditLogsScreen from '../screens/admin/AdminAuditLogsScreen';
import PrivacyScreen from '../screens/legal/PrivacyScreen';
import TermsScreen from '../screens/legal/TermsScreen';
import MedicalDisclaimerScreen from '../screens/legal/MedicalDisclaimerScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
  const { colors } = useThemeStore();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Today" component={TodayScreen} />
    </Stack.Navigator>
  );
}

function ExercisesStack() {
  const { colors } = useThemeStore();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="ExercisesList"
        component={ExercisesListScreen}
        options={{ title: 'Exercises' }}
      />
      <Stack.Screen
        name="ExerciseDetail"
        component={ExerciseDetailScreen}
        options={{ title: 'Exercise' }}
      />
    </Stack.Navigator>
  );
}

function WorkoutsStack() {
  const { colors } = useThemeStore();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="WorkoutLogger"
        component={WorkoutLoggerScreen}
      />
      <Stack.Screen
        name="WorkoutHistory"
        component={WorkoutHistoryScreen}
      />
      <Stack.Screen
        name="WorkoutSummary"
        component={WorkoutSummaryScreen}
      />
    </Stack.Navigator>
  );
}

function ProgressStack() {
  const { colors } = useThemeStore();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="ProgressMain"
        component={ProgressScreen}
      />
    </Stack.Navigator>
  );
}

function MoreStack() {
  const { colors } = useThemeStore();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="MoreMenu" component={MoreMenuScreen} options={{ headerShown: false }} />
      {/* Core “More” feature entrypoints */}
      <Stack.Screen name="Planner" component={PlannerUnifiedScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AIPlanner" component={AIPlannerScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Nutrition" component={NutritionScreen} options={{ headerShown: false }} />
      <Stack.Screen name="FormAnalysis" component={VideoUploadScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Wearables" component={WearablesScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ChatConversations" component={ConversationsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />

      <Stack.Screen name="BodyMap" component={BodyMapScreen} options={{ headerShown: false }} />
      <Stack.Screen name="MuscleExercises" component={MuscleExercisesScreen} options={{ title: 'Muscle Exercises' }} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'Favorites' }} />
      <Stack.Screen name="Achievements" component={AchievementsScreen} options={{ title: 'Achievements' }} />
      <Stack.Screen name="AiInsights" component={AiInsightsScreen} options={{ title: 'AI Insights' }} />
      <Stack.Screen name="Recovery" component={RecoveryScreen} options={{ title: 'Recovery' }} />
      <Stack.Screen name="FormFeedback" component={FormFeedbackScreen} options={{ title: 'Form Feedback' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Tools" component={ToolsScreen} options={{ title: 'Tools' }} />
      <Stack.Screen name="Plans" component={PlansScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PlanDetail" component={PlanDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AIHub" component={AIHubScreen} options={{ title: 'AI Hub' }} />
      <Stack.Screen name="ProgressV2" component={ProgressV2Screen} options={{ title: 'Progress V2' }} />
      <Stack.Screen name="Pricing" component={PricingScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SubscriptionManagement" component={SubscriptionManagementScreen} options={{ headerShown: false }} />

      {/* Legal */}
      <Stack.Screen name="Privacy" component={PrivacyScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Terms" component={TermsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="MedicalDisclaimer" component={MedicalDisclaimerScreen} options={{ headerShown: false }} />

      {/* Admin */}
      <Stack.Screen name="AdminHome" component={AdminHomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdminUsers" component={AdminUsersListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdminUserDetail" component={AdminUserDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdminSubscriptions" component={AdminSubscriptionsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdminEmailCampaigns" component={AdminEmailCampaignsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdminCreateEmailCampaign" component={AdminCreateEmailCampaignScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdminAdminUsers" component={AdminAdminUsersScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdminSystemHealth" component={AdminSystemHealthScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdminExerciseApproval" component={AdminExerciseApprovalScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdminExerciseEditor" component={AdminExerciseEditorScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdminActivityLogs" component={AdminActivityLogsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdminAiLogs" component={AdminAiLogsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdminAnalytics" component={AdminAnalyticsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdminAiMonitoring" component={AdminAiMonitoringScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdminAuditLogs" component={AdminAuditLogsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdminMetrics" component={AdminMetricsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdminSettings" component={AdminSettingsScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

export default function AppStack() {
  const { colors } = useThemeStore();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      id="TabNavigator"
      backBehavior="history"
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
          } else if (route.name === 'Progress') {
            iconName = focused ? 'chart-line' : 'chart-line';
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
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 62 + Math.max(insets.bottom, 0),
          paddingBottom: Math.max(insets.bottom, 10),
          paddingTop: 8,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="Workouts"
        component={WorkoutsStack}
        options={{ title: 'Workouts' }}
      />
      <Tab.Screen
        name="Exercises"
        component={ExercisesStack}
        options={{ title: 'Explore' }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressStack}
        options={{ title: 'Progress' }}
      />
      <Tab.Screen
        name="More"
        component={MoreStack}
        options={{ title: 'More' }}
      />
    </Tab.Navigator>
  );
}
