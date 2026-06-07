import React from 'react';
import { StatusBar } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { requestPermission } from './src/services/notifications';

export default function App() {
  React.useEffect(() => {
    requestPermission();
  }, []);
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#18181b" />
      <AppNavigator />
    </>
  );
}
