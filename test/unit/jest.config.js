// Jest config for the unit suite (*.test.js).
module.exports = {
  rootDir: './',
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/drCoordinator/'],
  moduleFileExtensions: ['js', 'ts', 'json'],
  transform: {
    '\\.[jt]sx?$': 'babel-jest',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // The connect bundle emits thousands of INFO logs during the suite. Jest
  // captures a stack trace for every console call and renders it, which on
  // slower hosts dominated runtime (~180s -> ~13s when suppressed).
  // Override on the CLI with `--silent=false` when debugging a specific test.
  silent: true,
  testTimeout: 30000,
  clearMocks: true,
  restoreMocks: true,
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/../../src/**/*.js',
    '!<rootDir>/../../src/**/*.d.ts',
    '!<rootDir>/../../src/aws-client.js',
    '!<rootDir>/../../src/lib/**',
  ],
  coverageDirectory: '<rootDir>/../../build/brazil-documentation/coverage-jest',
  coverageReporters: ['text', 'html', 'lcov', 'cobertura'],
  reporters: ['default'],
  // TODO: set real thresholds once the suite is fully migrated.
  coverageThreshold: {
    global: { statements: 0, branches: 0, functions: 0, lines: 0 },
  },
};
