export default {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/src/*.test.ts", '**/src/tests/**/*.test.ts'],
  moduleFileExtensions: ["ts", "js", "json"],
  setupFilesAfterEnv: ['<rootDir>/src/tests/singleton.ts'],
  roots: ["<rootDir>/src"],
};