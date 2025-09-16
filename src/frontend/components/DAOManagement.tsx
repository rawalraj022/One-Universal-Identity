import React, { useState } from 'react';
import { useWallet } from '../useWallet';

interface DAOManagementProps {
  wallet: ReturnType<typeof useWallet>;
}

const DAOManagement: React.FC<DAOManagementProps> = ({ wallet }) => {
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(7);
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const createProposal = async () => {
    if (!description || !wallet.isConnected) return;

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const newProposal = {
        id: Math.floor(Math.random() * 1000),
        description,
        proposer: wallet.address,
        voteCount: 0,
        status: 'active'
      };
      setProposals([...proposals, newProposal]);
      setDescription('');
    } catch (error) {
      console.error('Proposal creation failed:', error);
    }
    setLoading(false);
  };

  return (
    <div className="dao-section">
      <h2>🏛️ DAO Governance</h2>
      <div className="form-group">
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Proposal description"
        />
        <input
          type="number"
          value={duration}
          onChange={(e) => setDuration(parseInt(e.target.value))}
          placeholder="Duration in days"
        />
        <button onClick={createProposal} disabled={loading}>
          {loading ? 'Creating...' : 'Create Proposal'}
        </button>
      </div>
      <div className="proposals-list">
        {proposals.map((proposal, index) => (
          <div key={index} className="proposal-item">
            <h4>{proposal.description}</h4>
            <p>Votes: {proposal.voteCount}</p>
            <button>Vote</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DAOManagement;