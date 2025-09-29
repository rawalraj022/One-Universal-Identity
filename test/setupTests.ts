// Test setup file for Jest configuration

// Global test environment setup
declare global {
  var beforeAll: (fn: () => void) => void;
  var afterAll: (fn: () => void) => void;
  var jest: any;
}

beforeAll(() => {
  // Setup code that runs before all tests
  process.env.NODE_ENV = 'test';
});

afterAll(() => {
  // Cleanup code that runs after all tests
});

// Mock console methods to reduce noise in tests
(global as any).console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};