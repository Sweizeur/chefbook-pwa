import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { Category } from '../types';

// Screens
import RecipeListScreen from '../screens/RecipeListScreen';
import RecipeDetailScreen from '../screens/RecipeDetailScreen';
import RecipeFormScreen from '../screens/RecipeFormScreen';
import CategoryManagementScreen from '../screens/CategoryManagementScreen';
import CategoryRecipesScreen from '../screens/CategoryRecipesScreen';

export type RootStackParamList = {
  Home: undefined;
  RecipeDetail: { recipeId: string };
  RecipeForm: { recipeId?: string; categoryId?: string; categoryName?: string };
  CategoryManagement: undefined;
  CategoryRecipes: { category: Category };
};

export type MainTabParamList = {
  Recipes: undefined;
  Categories: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Recipes') {
            iconName = focused ? 'restaurant' : 'restaurant-outline';
          } else if (route.name === 'Categories') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        headerStyle: {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
          borderBottomWidth: 1,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen 
        name="Recipes" 
        component={RecipeListScreen}
        options={{ title: 'Mes Recettes' }}
      />
      <Tab.Screen 
        name="Categories" 
        component={CategoryManagementScreen}
        options={{ title: 'Catégories' }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
            borderBottomWidth: 1,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: '600',
          },
          cardStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={MainTabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="RecipeDetail" 
          component={RecipeDetailScreen}
          options={{ title: 'Détail de la recette' }}
        />
        <Stack.Screen 
          name="RecipeForm" 
          component={RecipeFormScreen}
          options={{ title: 'Nouvelle recette' }}
        />
        <Stack.Screen 
          name="CategoryManagement" 
          component={CategoryManagementScreen}
          options={{ title: 'Gestion des catégories' }}
        />
        <Stack.Screen 
          name="CategoryRecipes" 
          component={CategoryRecipesScreen}
          options={{ 
            headerShown: false 
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
