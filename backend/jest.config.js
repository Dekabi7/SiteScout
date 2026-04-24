module.exports = {
    testEnvironment: 'node',
    verbose: true,
    setupFilesAfterEnv: ['./tests/setup.js'],
    testMatch: ['**/tests/**/*.test.js'],
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/index.js',
        '!src/config/*.js'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov'],
    testPathIgnorePatterns: ['/node_modules/'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1'
    }
};
