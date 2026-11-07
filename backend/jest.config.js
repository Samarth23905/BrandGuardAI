/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          target: 'ES2022',
          module: 'CommonJS',
          lib: ['ES2022', 'DOM'],
          types: ['node', 'jest'],
          esModuleInterop: true,
          skipLibCheck: true,
        },
      },
    ],
  },
  testTimeout: 20000,
};
