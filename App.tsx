import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/constants/colors';

export default function App() {
  return (
    <SafeAreaProvider>
      <AppNavigator />
      <StatusBar style="light" backgroundColor={colors.background} />
    </SafeAreaProvider>
  );
}
