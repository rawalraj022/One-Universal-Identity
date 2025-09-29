/**
 * One Universal Identity (OUI) Mobile App
 * Phase 2: Enhanced Mobile Experience
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { StatusBar, View, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { store, persistor } from './store';
import { WalletProvider } from './providers/WalletProvider';
import { OUIProvider } from './providers/OUIProvider';

// Import screens
import HomeScreen from './screens/HomeScreen';
import IdentityScreen from './screens/IdentityScreen';
import SecurityScreen from './screens/SecurityScreen';
import CrossChainScreen from './screens/CrossChainScreen';
import DAOScreen from './screens/DAOScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import SettingsScreen from './screens/SettingsScreen';

// Import Phase 2 screens
import AIMonitorScreen from './screens/AIMonitorScreen';
import ZKPVerificationScreen from './screens/ZKPVerificationScreen';
import ComplianceScreen from './screens/ComplianceScreen';
import LayerZeroBridgeScreen from './screens/LayerZeroBridgeScreen';

export type RootStackParamList = {
  Main: undefined;
  AIMonitor: undefined;
  ZKPVerification: undefined;
  Compliance: undefined;
  LayerZeroBridge: undefined;
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Identity') {
            iconName = 'person';
          } else if (route.name === 'Security') {
            iconName = 'security';
          } else if (route.name === 'CrossChain') {
            iconName = 'sync';
          } else if (route.name === 'DAO') {
            iconName = 'group';
          } else if (route.name === 'Analytics') {
            iconName = 'analytics';
          } else {
            iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Identity" component={IdentityScreen} />
      <Tab.Screen name="Security" component={SecurityScreen} />
      <Tab.Screen name="CrossChain" component={CrossChainScreen} />
      <Tab.Screen name="DAO" component={DAOScreen} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
    </Tab.Navigator>
  );
}

function App(): React.JSX.Element {
  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingScreen />} persistor={persistor}>
        <WalletProvider>
          <OUIProvider>
            <NavigationContainer>
              <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
              <Stack.Navigator
                initialRouteName="Main"
                screenOptions={{
                  headerStyle: {
                    backgroundColor: '#007AFF',
                  },
                  headerTintColor: '#ffffff',
                  headerTitleStyle: {
                    fontWeight: 'bold',
                  },
                }}
              >
                <Stack.Screen
                  name="Main"
                  component={MainTabNavigator}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="AIMonitor"
                  component={AIMonitorScreen}
                  options={{ title: 'AI Security Monitor' }}
                />
                <Stack.Screen
                  name="ZKPVerification"
                  component={ZKPVerificationScreen}
                  options={{ title: 'Zero-Knowledge Proofs' }}
                />
                <Stack.Screen
                  name="Compliance"
                  component={ComplianceScreen}
                  options={{ title: 'Compliance Center' }}
                />
                <Stack.Screen
                  name="LayerZeroBridge"
                  component={LayerZeroBridgeScreen}
                  options={{ title: 'Cross-Chain Bridge' }}
                />
                <Stack.Screen
                  name="Settings"
                  component={SettingsScreen}
                  options={{ title: 'Settings' }}
                />
              </Stack.Navigator>
            </NavigationContainer>
          </OUIProvider>
        </WalletProvider>
      </PersistGate>
    </Provider>
  );
}

function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
      <Text style={{ fontSize: 18, marginTop: 20 }}>Loading OUI Mobile...</Text>
      <Text style={{ fontSize: 14, color: '#666', marginTop: 10 }}>Phase 2 Features Enabled</Text>
    </View>
  );
}

export default App;