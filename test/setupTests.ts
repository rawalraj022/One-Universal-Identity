// Jest setup file for OUI testing infrastructure

import '@testing-library/jest-dom';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window.ethereum for wallet tests
Object.defineProperty(window, 'ethereum', {
  writable: true,
  value: {
    isMetaMask: true,
    request: jest.fn(),
    on: jest.fn(),
    removeListener: jest.fn(),
    selectedAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    chainId: '0x1',
    networkVersion: '1'
  }
});

// Mock console methods to reduce noise during tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Global test utilities
global.testUtils = {
  // Generate mock wallet address
  generateWalletAddress: () => {
    return '0x' + Math.random().toString(16).substr(2, 40);
  },

  // Generate mock DID
  generateDID: (suffix = 'test') => {
    return `did:ethr:${global.testUtils.generateWalletAddress()}-${suffix}`;
  },

  // Mock API response delay
  delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  // Mock contract deployment
  mockContractDeployment: (contractName: string) => {
    return {
      address: global.testUtils.generateWalletAddress(),
      deployTransaction: {
        hash: '0x' + Math.random().toString(16).substr(2, 64),
        wait: jest.fn().mockResolvedValue({
          blockNumber: Math.floor(Math.random() * 1000000),
          gasUsed: Math.floor(Math.random() * 100000) + 50000
        })
      }
    };
  }
};

// Mock fetch API for backend tests
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Performance testing utilities
global.performanceUtils = {
  // Measure execution time
  measureExecutionTime: async (fn: Function, ...args: any[]) => {
    const start = performance.now();
    const result = await fn(...args);
    const end = performance.now();
    return { result, executionTime: end - start };
  },

  // Generate performance report
  generatePerformanceReport: (metrics: any[]) => {
    const totalTime = metrics.reduce((sum, m) => sum + m.executionTime, 0);
    const avgTime = totalTime / metrics.length;
    const minTime = Math.min(...metrics.map(m => m.executionTime));
    const maxTime = Math.max(...metrics.map(m => m.executionTime));

    return {
      totalOperations: metrics.length,
      totalTime,
      averageTime: avgTime,
      minTime,
      maxTime,
      operationsPerSecond: (metrics.length * 1000) / totalTime,
      timestamp: Date.now()
    };
  }
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
  localStorage.clear();
  sessionStorage.clear();
});

// Increase timeout for async operations
jest.setTimeout(30000);

// Custom matchers
expect.extend({
  toBeValidEthereumAddress(received) {
    const pass = /^0x[a-fA-F0-9]{40}$/.test(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid Ethereum address`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid Ethereum address`,
        pass: false,
      };
    }
  },

  toBeValidDID(received) {
    const pass = /^did:ethr:0x[a-fA-F0-9]{40}/.test(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid DID`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid DID`,
        pass: false,
      };
    }
  }
});