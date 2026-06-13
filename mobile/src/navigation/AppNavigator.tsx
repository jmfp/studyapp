import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';
import { useAppSelector } from '../hooks/redux';
import { colors, radius } from '../theme';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import HomeScreen from '../screens/home/HomeScreen';
import TopicListScreen from '../screens/topics/TopicListScreen';
import TopicDetailScreen from '../screens/topics/TopicDetailScreen';
import QuizSelectScreen from '../screens/quiz/QuizSelectScreen';
import QuizSessionScreen from '../screens/quiz/QuizSessionScreen';
import QuizResultScreen from '../screens/quiz/QuizResultScreen';
import AnalyticsScreen from '../screens/analytics/AnalyticsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const AuthStack = createNativeStackNavigator();
const MainTab = createBottomTabNavigator();
const TopicsStack = createNativeStackNavigator();
const QuizStack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function TopicsNavigator() {
  return (
    <TopicsStack.Navigator screenOptions={{ headerShown: false }}>
      <TopicsStack.Screen name="TopicList" component={TopicListScreen} />
      <TopicsStack.Screen name="TopicDetail" component={TopicDetailScreen} />
    </TopicsStack.Navigator>
  );
}

function QuizNavigator() {
  return (
    <QuizStack.Navigator screenOptions={{ headerShown: false }}>
      <QuizStack.Screen name="QuizSelect" component={QuizSelectScreen} />
      <QuizStack.Screen name="QuizSession" component={QuizSessionScreen} />
      <QuizStack.Screen name="QuizResult" component={QuizResultScreen} />
    </QuizStack.Navigator>
  );
}

function MainNavigator() {
  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem,
        tabBarActiveTintColor: colors.white,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, [string, string]> = {
            HomeTab: ['home', 'home-outline'],
            TopicsTab: ['book', 'book-outline'],
            QuizTab: ['flash', 'flash-outline'],
            AnalyticsTab: ['bar-chart', 'bar-chart-outline'],
            ProfileTab: ['person', 'person-outline'],
          };
          const [active, inactive] = icons[route.name] || ['help', 'help-outline'];
          const iconName = focused ? active : inactive;

          if (focused) {
            return (
              <View style={styles.activeTab}>
                <Ionicons name={iconName as any} size={20} color={colors.white} />
              </View>
            );
          }
          return <Ionicons name={iconName as any} size={22} color={color} />;
        },
      })}
    >
      <MainTab.Screen name="HomeTab" component={HomeScreen} />
      <MainTab.Screen name="TopicsTab" component={TopicsNavigator} />
      <MainTab.Screen name="QuizTab" component={QuizNavigator} />
      <MainTab.Screen name="AnalyticsTab" component={AnalyticsScreen} />
      <MainTab.Screen name="ProfileTab" component={ProfileScreen} />
    </MainTab.Navigator>
  );
}

export default function AppNavigator() {
  const token = useAppSelector((s) => s.auth.token);

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {token ? (
          <RootStack.Screen name="Main" component={MainNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 24,
    right: 24,
    backgroundColor: '#1A1A2E',
    borderRadius: 32,
    height: 64,
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: colors.border,
    paddingBottom: 0,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  tabItem: {
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
