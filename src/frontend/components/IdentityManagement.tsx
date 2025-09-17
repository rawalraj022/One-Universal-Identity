import React, { useState, useEffect } from 'react';
import { useWallet } from '../useWallet';

interface IdentityManagementProps {
  wallet: ReturnType<typeof useWallet>;
}

const IdentityManagement: React.FC<IdentityManagementProps> = ({ wallet }) => {
  const [did, setDid] = useState('');
  const [identity, setIdentity] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (wallet.isConnected) {
      fetchIdentity();
    }
  }, [wallet.isConnected]);

  const fetchIdentity = async () => {
    try {
      // In a real implementation, this would call the backend API
      // const response = await fetch(`/api/identity/${wallet.address}`);
      // const data = await response.json();
      // setIdentity(data);

      // Mock data for now
      setIdentity({
        did: `did:ethr:${wallet.address}`,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
        uvts: []
      });
    } catch (error) {
      console.error('Failed to fetch identity:', error);
    }
  };

  const registerIdentity = async () => {
    if (!did || !wallet.isConnected) return;

    setLoading(true);
    try {
      // In a real implementation, this would call the backend API
      // const response = await fetch('/api/identity/register', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ did, address: wallet.address })
      // });

      // For now, simulate the registration
      await new Promise(resolve => setTimeout(resolve, 2000));

      setIdentity({
        did,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
        uvts: []
      });

      setMessage('Identity registered successfully!');
    } catch (error) {
      console.error('Registration failed:', error);
      setMessage('Registration failed. Please try again.');
    }
    setLoading(false);
  };

  const updateIdentity = async () => {
    if (!did || !wallet.isConnected || !identity) return;

    setLoading(true);
    try {
      // In a real implementation, this would call the backend API
      // const response = await fetch('/api/identity/update', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ did, address: wallet.address })
      // });

      // For now, simulate the update
      await new Promise(resolve => setTimeout(resolve, 2000));

      setIdentity({
        ...identity,
        did,
        updatedAt: new Date().toISOString(),
        version: (identity.version || 1) + 1
      });
      setMessage('Identity updated successfully!');
    } catch (error) {
      console.error('Update failed:', error);
      setMessage('Update failed. Please try again.');
    }
    setLoading(false);
  };

  if (!wallet.isConnected) {
    return (
      <div className="identity-section">
        <div className="connect-prompt">
          <h3>🔐 Connect Your Wallet</h3>
          <p>Please connect your wallet to manage your universal identity.</p>
          <button
            className="primary-btn"
            onClick={wallet.connectWallet}
            disabled={wallet.isConnecting}
          >
            {wallet.isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="identity-section">
      <div className="section-header">
        <h2>🆔 Universal Identity Management</h2>
        <p>Create and manage your decentralized identity across all platforms.</p>
      </div>

      {message && (
        <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="identity-grid">
        <div className="identity-card">
          <h3>Current Identity</h3>
          {identity ? (
            <div className="identity-info">
              <div className="info-row">
                <span className="label">DID:</span>
                <span className="value">{identity.did}</span>
              </div>
              <div className="info-row">
                <span className="label">Status:</span>
                <span className="status active">{identity.status}</span>
              </div>
              <div className="info-row">
                <span className="label">Created:</span>
                <span className="value">{new Date(identity.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="info-row">
                <span className="label">Version:</span>
                <span className="value">{identity.version}</span>
              </div>
              <div className="info-row">
                <span className="label">UVTs Issued:</span>
                <span className="value">{identity.uvts?.length || 0}</span>
              </div>
            </div>
          ) : (
            <div className="no-identity">
              <p>No identity registered yet.</p>
              <p>Create your universal identity below.</p>
            </div>
          )}
        </div>

        <div className="identity-card">
          <h3>Identity History</h3>
          <div className="history-list">
            <div className="history-item">
              <div className="history-version">v1</div>
              <div className="history-details">
                <p>Identity created</p>
                <small>{new Date(identity.createdAt).toLocaleString()}</small>
              </div>
            </div>
            {identity.version > 1 && (
              <div className="history-item">
                <div className="history-version">v{identity.version}</div>
                <div className="history-details">
                  <p>Identity updated</p>
                  <small>{new Date(identity.updatedAt).toLocaleString()}</small>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="identity-actions">
          <div className="action-card">
            <h4>Register New Identity</h4>
            <div className="form-group">
              <label htmlFor="did">Decentralized Identifier (DID)</label>
              <input
                type="text"
                id="did"
                value={did}
                onChange={(e) => setDid(e.target.value)}
                placeholder="did:ethr:0x..."
                disabled={loading}
              />
            </div>
            <div className="action-buttons">
              <button
                className="primary-btn"
                onClick={registerIdentity}
                disabled={loading || !did}
              >
                {loading ? 'Registering...' : 'Register Identity'}
              </button>
              {identity && (
                <button
                  className="secondary-btn"
                  onClick={updateIdentity}
                  disabled={loading || !did}
                >
                  {loading ? 'Updating...' : 'Update Identity'}
                </button>
              )}
            </div>
          </div>

          <div className="action-card">
            <h4>Identity Features</h4>
            <div className="features-list">
              <div className="feature-item">
                <span className="feature-icon">🔐</span>
                <div className="feature-info">
                  <h5>Privacy-First</h5>
                  <p>Zero-knowledge proofs for selective disclosure</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🌐</span>
                <div className="feature-info">
                  <h5>Cross-Platform</h5>
                  <p>Use your identity across all digital services</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🛡️</span>
                <div className="feature-info">
                  <h5>Self-Sovereign</h5>
                  <p>You own and control your digital identity</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdentityManagement;