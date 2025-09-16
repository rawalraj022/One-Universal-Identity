// src/frontend/App.tsx
// Main frontend application for One Universal Identity (OUI)

import React, { useState, useEffect } from 'react';
import { useWallet } from './useWallet';
import IdentityManagement from './components/IdentityManagement';
import UVTManagement from './components/UVTManagement';
import DAOManagement from './components/DAOManagement';
import WatermarkManagement from './components/WatermarkManagement';
import PrivacyManagement from './components/PrivacyManagement';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import CrossChainManagement from './components/CrossChainManagement';
import './App.css';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const wallet = useWallet();

  useEffect(() => {
    // Auto-connect wallet if previously connected
    if (!wallet.isConnected && !wallet.isConnecting) {
      wallet.connectWallet();
    }
  }, [wallet]);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'identity', label: 'Identity', icon: '🆔' },
    { id: 'uvt', label: 'UVT Tokens', icon: '🪙' },
    { id: 'dao', label: 'DAO', icon: '🏛️' },
    { id: 'watermark', label: 'Watermark', icon: '🎨' },
    { id: 'crosschain', label: 'Cross-Chain', icon: '🌐' },
    { id: 'privacy', label: 'Privacy', icon: '🔒' },
    { id: 'analytics', label: 'Analytics', icon: '📈' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'identity':
        return <IdentityManagement wallet={wallet} />;
      case 'uvt':
        return <UVTManagement wallet={wallet} />;
      case 'dao':
        return <DAOManagement wallet={wallet} />;
      case 'watermark':
        return <WatermarkManagement wallet={wallet} />;
      case 'crosschain':
        return <CrossChainManagement wallet={wallet} />;
      case 'privacy':
        return <PrivacyManagement wallet={wallet} />;
      case 'analytics':
        return <AnalyticsDashboard />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <h1>🔐 One Universal Identity (OUI)</h1>
            <span className="tagline">Your Digital Identity, Everywhere</span>
          </div>

          <div className="wallet-section">
            {wallet.isConnected ? (
              <div className="wallet-info">
                <div className="wallet-address">
                  {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}
                </div>
                <div className="wallet-balance">
                  {parseFloat(wallet.balance).toFixed(4)} ETH
                </div>
                <button
                  className="disconnect-btn"
                  onClick={wallet.disconnectWallet}
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                className="connect-btn"
                onClick={wallet.connectWallet}
                disabled={wallet.isConnecting}
              >
                {wallet.isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}
          </div>
        </div>

        {wallet.error && (
          <div className="error-banner">
            ⚠️ {wallet.error}
          </div>
        )}
      </header>

      <nav className="app-navigation">
        <div className="nav-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <main className="app-main">
        <div className="main-content">
          {renderTabContent()}
        </div>
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <p>© 2024 One Universal Identity. Secured by Blockchain & AI.</p>
          <div className="footer-links">
            <a href="#docs">Documentation</a>
            <a href="#support">Support</a>
            <a href="#privacy">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Dashboard Component
const Dashboard: React.FC = () => {
  const wallet = useWallet();

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Welcome to One Universal Identity</h2>
        <p>Manage your digital identity across all platforms securely and privately.</p>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>🔐 Your Identity</h3>
          <p>Universal identity registered and verified</p>
          <div className="card-status">
            {wallet.isConnected ? '✅ Active' : '❌ Not Connected'}
          </div>
        </div>

        <div className="dashboard-card">
          <h3>🪙 UVT Balance</h3>
          <p>Universal Verification Tokens</p>
          <div className="card-value">0 UVT</div>
        </div>

        <div className="dashboard-card">
          <h3>🏛️ DAO Status</h3>
          <p>Governance participation</p>
          <div className="card-status">Active Member</div>
        </div>

        <div className="dashboard-card">
          <h3>🎨 Assets Protected</h3>
          <p>Watermarked digital assets</p>
          <div className="card-value">0 Assets</div>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <button className="action-btn primary">Register Identity</button>
          <button className="action-btn secondary">Issue UVT</button>
          <button className="action-btn secondary">Create Proposal</button>
          <button className="action-btn secondary">Watermark Asset</button>
        </div>
      </div>
    </div>
  );
};

export default App;