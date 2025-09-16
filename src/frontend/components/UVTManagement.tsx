import React, { useState } from 'react';
import { useWallet } from '../useWallet';

interface UVTManagementProps {
  wallet: ReturnType<typeof useWallet>;
}

const UVTManagement: React.FC<UVTManagementProps> = ({ wallet }) => {
  const [credentialId, setCredentialId] = useState('');
  const [expiresDays, setExpiresDays] = useState(365);
  const [uvts, setUvts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const issueUVT = async () => {
    if (!credentialId || !wallet.isConnected) return;

    setLoading(true);
    try {
      // In a real implementation, this would call the backend API
      // const response = await fetch('/api/identity/issue-uvt', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ credentialId, expiresAt: expiresTimestamp })
      // });

      // For now, simulate UVT issuance
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newUVT = {
        tokenId: `0x${Math.random().toString(16).substr(2, 64)}`,
        credentialId,
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000),
        valid: true
      };

      setUvts([...uvts, newUVT]);
      setMessage('UVT issued successfully!');
      setCredentialId('');
    } catch (error) {
      console.error('UVT issuance failed:', error);
      setMessage('UVT issuance failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="uvt-section">
      <div className="section-header">
        <h2>🪙 Universal Verification Tokens (UVT)</h2>
        <p>Issue and manage verifiable credentials for identity verification.</p>
      </div>

      {message && (
        <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="uvt-grid">
        <div className="uvt-form-card">
          <h3>Issue New UVT</h3>
          <div className="form-group">
            <label htmlFor="credentialId">Credential ID</label>
            <input
              type="text"
              id="credentialId"
              value={credentialId}
              onChange={(e) => setCredentialId(e.target.value)}
              placeholder="kyc-verification-001"
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="expiresDays">Expiration (days)</label>
            <input
              type="number"
              id="expiresDays"
              value={expiresDays}
              onChange={(e) => setExpiresDays(parseInt(e.target.value))}
              min="1"
              max="3650"
              disabled={loading}
            />
          </div>
          <button
            className="primary-btn"
            onClick={issueUVT}
            disabled={loading || !credentialId}
          >
            {loading ? 'Issuing...' : 'Issue UVT'}
          </button>
        </div>

        <div className="uvt-list-card">
          <h3>Issued UVTs</h3>
          {uvts.length === 0 ? (
            <p className="no-uvts">No UVTs issued yet.</p>
          ) : (
            <div className="uvt-list">
              {uvts.map((uvt, index) => (
                <div key={index} className="uvt-item">
                  <div className="uvt-info">
                    <div className="uvt-id">{uvt.tokenId.slice(0, 10)}...</div>
                    <div className="uvt-credential">{uvt.credentialId}</div>
                    <div className="uvt-status valid">Valid</div>
                  </div>
                  <div className="uvt-dates">
                    <div>Issued: {uvt.issuedAt.toLocaleDateString()}</div>
                    <div>Expires: {uvt.expiresAt.toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UVTManagement;