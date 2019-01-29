// @ts-check

function setup({projectCacheDir, testFramework}) {
  const jestConfig = require('./jest.config');

  delete jestConfig.globalSetup;
  delete jestConfig.globalTeardown;

  jestConfig.moduleNameMapper = {
    '^@feature-hub/([^/]+)$': projectCacheDir + '/packages/$1/src'
  };

  testFramework.configure(jestConfig);
}

module.exports = wallaby => ({
  files: [
    'jest.config.js',
    'scripts/setup-test-framework.js',
    'packages/*/src/**/*.{ts,tsx,snap}',
    '!packages/*/src/**/*.test.{ts,tsx}'
  ],
  tests: [
    'packages/*/src/**/*.test.{ts,tsx}',
    '!packages/demos/src/**/*.test.{ts,tsx}'
  ],
  env: {type: 'node', runner: 'node'},
  setup,
  testFramework: 'jest',
  compilers: {
    '**/*.ts?(x)': wallaby.compilers.babel()
  }
});
