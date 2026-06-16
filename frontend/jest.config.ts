import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '<rootDir>/__tests__/**/*.test.{ts,tsx}',
    '<rootDir>/src/**/*.test.{ts,tsx}',
  ],
  collectCoverageFrom: [
    'src/lib/**/*.{ts,tsx}',
    'src/services/api.ts',
    'src/services/auth.service.ts',
    'src/services/admin-dx.service.ts',
    'src/services/public.service.ts',
    'src/services/autorizacion.service.ts',
    'src/services/users.service.ts',
    '!src/**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      functions: 80,
      lines: 80,
      branches: 70,
      statements: 80,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],
}

export default createJestConfig(config)
