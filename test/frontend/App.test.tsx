import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../../src/frontend/App';

// Mock the useWallet hook
jest.mock('../../src/frontend/useWallet', () => ({
  useWallet: () => ({
    address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    balance: '1.5',
    chainId: 1,
    isConnected: true,
    isConnecting: false,
    error: null,
    connectWallet: jest.fn(),
    disconnectWallet: jest.fn(),
    switchNetwork: jest.fn(),
    signMessage: jest.fn(),
    sendTransaction: jest.fn()
  })
}));

describe('App Component', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
  });

  test('renders main application layout', () => {
    render(<App />);

    expect(screen.getByText('🔐 One Universal Identity (OUI)')).toBeInTheDocument();
    expect(screen.getByText('Your Digital Identity, Everywhere')).toBeInTheDocument();
  });

  test('displays wallet information when connected', () => {
    render(<App />);

    expect(screen.getByText('0x742d...44e')).toBeInTheDocument();
    expect(screen.getByText('1.5 ETH')).toBeInTheDocument();
  });

  test('shows navigation tabs', () => {
    render(<App />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Identity')).toBeInTheDocument();
    expect(screen.getByText('UVT Tokens')).toBeInTheDocument();
    expect(screen.getByText('DAO')).toBeInTheDocument();
    expect(screen.getByText('Watermark')).toBeInTheDocument();
    expect(screen.getByText('Cross-Chain')).toBeInTheDocument();
    expect(screen.getByText('Privacy')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  test('starts with dashboard tab active', () => {
    render(<App />);

    const dashboardTab = screen.getByText('Dashboard').closest('button');
    expect(dashboardTab).toHaveClass('active');
  });

  test('switches tabs when clicked', async () => {
    render(<App />);

    const identityTab = screen.getByText('Identity');
    fireEvent.click(identityTab);

    await waitFor(() => {
      expect(screen.getByText('🆔 Universal Identity Management')).toBeInTheDocument();
    });

    const daoTab = screen.getByText('DAO');
    fireEvent.click(daoTab);

    await waitFor(() => {
      expect(screen.getByText('🏛️ DAO Governance')).toBeInTheDocument();
    });
  });

  test('renders dashboard content by default', () => {
    render(<App />);

    expect(screen.getByText('Welcome to One Universal Identity')).toBeInTheDocument();
    expect(screen.getByText('🔐 Your Identity')).toBeInTheDocument();
    expect(screen.getByText('🪙 UVT Balance')).toBeInTheDocument();
    expect(screen.getByText('🏛️ DAO Status')).toBeInTheDocument();
  });

  test('shows quick action buttons in dashboard', () => {
    render(<App />);

    expect(screen.getByText('Register Identity')).toBeInTheDocument();
    expect(screen.getByText('Issue UVT')).toBeInTheDocument();
    expect(screen.getByText('Create Proposal')).toBeInTheDocument();
    expect(screen.getByText('Watermark Asset')).toBeInTheDocument();
  });

  test('displays footer with links', () => {
    render(<App />);

    expect(screen.getByText('© 2024 One Universal Identity. Secured by Blockchain & AI.')).toBeInTheDocument();
    expect(screen.getByText('Documentation')).toBeInTheDocument();
    expect(screen.getByText('Support')).toBeInTheDocument();
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
  });

  test('handles wallet not connected state', () => {
    // Mock disconnected wallet
    jest.mock('../../src/frontend/useWallet', () => ({
      useWallet: () => ({
        address: null,
        balance: '0',
        chainId: null,
        isConnected: false,
        isConnecting: false,
        error: null,
        connectWallet: jest.fn(),
        disconnectWallet: jest.fn(),
        switchNetwork: jest.fn(),
        signMessage: jest.fn(),
        sendTransaction: jest.fn()
      })
    }));

    render(<App />);

    expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    expect(screen.queryByText('0x742d...44e')).not.toBeInTheDocument();
  });

  test('shows error banner when wallet error occurs', () => {
    // Mock wallet with error
    jest.mock('../../src/frontend/useWallet', () => ({
      useWallet: () => ({
        address: null,
        balance: '0',
        chainId: null,
        isConnected: false,
        isConnecting: false,
        error: 'Failed to connect to wallet',
        connectWallet: jest.fn(),
        disconnectWallet: jest.fn(),
        switchNetwork: jest.fn(),
        signMessage: jest.fn(),
        sendTransaction: jest.fn()
      })
    }));

    render(<App />);

    expect(screen.getByText('⚠️ Failed to connect to wallet')).toBeInTheDocument();
  });

  test('handles different tab navigation patterns', async () => {
    render(<App />);

    // Test navigation to UVT tab
    const uvtTab = screen.getByText('UVT Tokens');
    fireEvent.click(uvtTab);

    await waitFor(() => {
      expect(screen.getByText('🪙 Universal Verification Tokens (UVT)')).toBeInTheDocument();
    });

    // Test navigation back to dashboard
    const dashboardTab = screen.getByText('Dashboard');
    fireEvent.click(dashboardTab);

    await waitFor(() => {
      expect(screen.getByText('Welcome to One Universal Identity')).toBeInTheDocument();
    });
  });

  test('maintains tab state correctly', async () => {
    render(<App />);

    // Navigate to multiple tabs and verify active states
    const identityTab = screen.getByText('Identity');
    fireEvent.click(identityTab);

    await waitFor(() => {
      expect(identityTab.closest('button')).toHaveClass('active');
    });

    const watermarkTab = screen.getByText('Watermark');
    fireEvent.click(watermarkTab);

    await waitFor(() => {
      expect(watermarkTab.closest('button')).toHaveClass('active');
      expect(identityTab.closest('button')).not.toHaveClass('active');
    });
  });
});