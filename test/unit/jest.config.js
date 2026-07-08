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
  clearMocks: true,
  restoreMocks: true,
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/../../src/**/*.js',
    '!<rootDir>/../../src/**/*.d.ts',
  ],
  coverageDirectory: '<rootDir>/../../build/brazil-documentation/coverage-jest',
  coverageReporters: ['text', 'html', 'lcov', 'cobertura'],
  reporters: ['default'],
  // TODO: set real thresholds once the suite is fully migrated.
  coverageThreshold: {
    global: { statements: 0, branches: 0, functions: 0, lines: 0 },
  },
};
