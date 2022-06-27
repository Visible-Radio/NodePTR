const config = {
  transform: {},
  collectCoverage: true,
  collectCoverageFrom: ['./PTR/**/*.js', '!**/__tests__/**'],
  testPathIgnorePatterns: ['makeControlSamples.js'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: -10,
    },
  },
};
module.exports = config;
