import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { MainTabs } from './MainTabs';
import { ProductDetailScreen } from '../screens/ProductDetailScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { CheckoutScreen } from '../screens/CheckoutScreen';
import { OrderDetailScreen } from '../screens/OrderDetailScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { AddressesScreen } from '../screens/AddressesScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { theme } from '../theme';

const Stack = createNativeStackNavigator();

const screenHeaderOptions = {
  headerShown: true,
  headerTitle: '',
  headerBackTitle: 'Geri',
  headerTintColor: theme.colors.text,
  headerStyle: { backgroundColor: theme.colors.white },
};

export function AppNavigator() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.bgLight }}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.bgLight },
        }}
      >
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen
          name="ProductDetail"
          component={ProductDetailScreen}
          options={screenHeaderOptions}
        />
        <Stack.Screen
          name="Auth"
          component={AuthScreen}
          options={{ ...screenHeaderOptions, presentation: 'modal' }}
        />
        <Stack.Screen
          name="Search"
          component={SearchScreen}
          options={{ ...screenHeaderOptions, headerTitle: 'Arama' }}
        />
        <Stack.Screen
          name="Checkout"
          component={CheckoutScreen}
          options={{ ...screenHeaderOptions, headerTitle: 'Ödeme' }}
        />
        <Stack.Screen
          name="OrderDetail"
          component={OrderDetailScreen}
          options={{ ...screenHeaderOptions, headerTitle: 'Sipariş Detayı' }}
        />
        <Stack.Screen
          name="Favorites"
          component={FavoritesScreen}
          options={{ ...screenHeaderOptions, headerTitle: 'Favorilerim' }}
        />
        <Stack.Screen
          name="Addresses"
          component={AddressesScreen}
          options={{ ...screenHeaderOptions, headerTitle: 'Adreslerim' }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ ...screenHeaderOptions, headerTitle: 'Ayarlar' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
