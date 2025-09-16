import React, { useState } from 'react';
import { useWallet } from '../useWallet';

const WatermarkManagement: React.FC<{ wallet: ReturnType<typeof useWallet> }> = ({ wallet }) => {
  const [assetId, setAssetId] = useState('');
  const [assetType, setAssetType] = useState('image');
  const [assets, setAssets] = useState<any[]>([]);

  const watermarkAsset = async () => {
    if (!assetId || !wallet.isConnected) return;

    const newAsset = {
      assetId,
      assetType,
      watermarkedAt: new Date(),
      status: 'watermarked'
    };
    setAssets([...assets, newAsset]);
    setAssetId('');
  };

  return (
    <div className="watermark-section">
      <h2>🎨 Digital Asset Watermarking</h2>
      <div className="form-group">
        <input
          type="text"
          value={assetId}
          onChange={(e) => setAssetId(e.target.value)}
          placeholder="Asset ID"
        />
        <select value={assetType} onChange={(e) => setAssetType(e.target.value)}>
          <option value="image">Image</option>
          <option value="video">Video</option>
          <option value="audio">Audio</option>
        </select>
        <button onClick={watermarkAsset}>Watermark Asset</button>
      </div>
      <div className="assets-list">
        {assets.map((asset, index) => (
          <div key={index} className="asset-item">
            <h4>{asset.assetId}</h4>
            <p>Type: {asset.assetType}</p>
            <p>Status: {asset.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WatermarkManagement;