/**
 * Home Screen - Main Dashboard for OUI Mobile App
 * Showcases Phase 2 features and provides navigation
 */

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useOUI } from '../providers/OUIProvider';
import { RootStackParamList } from '../App';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const {
    isConnected,
    walletInfo,
    identity,
    isLoading,
    error,
    analyzeSecurity,
    performZKPAgeVerification,
    initiateCrossChainTransfer
  } = useOUI();

  const phase2Features = [
    {
      title: '🤖 AI Security Monitor',
      description: 'Real-time threat detection with ML models',
      onPress: () => navigation.navigate('AIMonitor'),
      phase: 'Phase 2'
    },
    {
      title: '🔐 ZKP Verification',
      description: 'Privacy-preserving identity verification',
      onPress: () => navigation.navigate('ZKPVerification'),
      phase: 'Phase 2'
    },
    {
      title: '⚖️ Compliance Center',
      description: 'KYC, AML, and regulatory compliance',
      onPress: () => navigation.navigate('Compliance'),
      phase: 'Phase 2'
    },
    {
      title: '🌉 LayerZero Bridge',
      description: 'Cross-chain identity transfers',
      onPress: () => navigation.navigate('LayerZeroBridge'),
      phase: 'Phase 2'
    }
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>One Universal Identity</Text>
        <Text style={styles.subtitle}>Phase 2: Enhanced Features</Text>
      </View>

      {/* Connection Status */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>Connection Status</Text>
        <Text style={[
          styles.statusText,
          { color: isConnected ? '#4CAF50' : '#F44336' }
        ]}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </Text>
        {walletInfo && (
          <Text style={styles.addressText}>
            {`${walletInfo.address.slice(0, 6)}...${walletInfo.address.slice(-4)}`}
          </Text>
        )}
        {identity && (
          <Text style={styles.identityText}>
            Identity: {identity.did.slice(0, 20)}...
          </Text>
        )}
      </View>

      {/* Phase 2 Feature Cards */}
      <View style={styles.featuresContainer}>
        <Text style={styles.sectionTitle}>🚀 Phase 2 Features</Text>
        {phase2Features.map((feature, index) => (
          <TouchableOpacity
            key={index}
            style={styles.featureCard}
            onPress={feature.onPress}
          >
            <View style={styles.featureHeader}>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.phaseBadge}>{feature.phase}</Text>
            </View>
            <Text style={styles.featureDescription}>{feature.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={analyzeSecurity}
          disabled={isLoading || !isConnected}
        >
          <Text style={styles.primaryButtonText}>🔍 Analyze Security</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={performZKPAgeVerification}
          disabled={isLoading || !isConnected}
        >
          <Text style={styles.secondaryButtonText}>🔐 Age Verification</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => initiateCrossChainTransfer(137, '0.1')}
          disabled={isLoading || !isConnected}
        >
          <Text style={styles.secondaryButtonText}>🌉 Bridge to Polygon</Text>
        </TouchableOpacity>
      </View>

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      )}

      {/* Version Info */}
      <View style={styles.footer}>
        <Text style={styles.versionText}>OUI Mobile v2.0 (Phase 2)</Text>
        <Text style={styles.poweredByText}>Powered by Real AI & ZKP</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
  },
  statusContainer: {
    backgroundColor: '#ffffff',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  identityText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  featuresContainer: {
    margin: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  featureCard: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  phaseBadge: {
    backgroundColor: '#4CAF50',
    color: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 'bold',
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actionsContainer: {
    margin: 15,
  },
  actionButton: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: '#FFE6E6',
    margin: 15,
    padding: 10,
    borderRadius: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
  },
  footer: {
    alignItems: 'center',
    padding: 20,
  },
  versionText: {
    fontSize: 12,
    color: '#666',
  },
  poweredByText: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 2,
  },
});

export default HomeScreen;