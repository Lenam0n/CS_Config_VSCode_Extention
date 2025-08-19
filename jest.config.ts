// jest.config.ts
import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",

  // Tests leben in src/
  roots: ["<rootDir>/src"],

  moduleFileExtensions: ["ts", "tsx", "js", "json", "node"],

  // __tests__-Ordner + *.test|spec.ts
  testMatch: [
    "<rootDir>/src/**/__tests__/**/*.(test|spec).ts",
    "<rootDir>/src/**/*.(test|spec).ts",
  ],

  // 1:1-Aliase gemäß deiner tsconfig.json
  moduleNameMapper: {
    // --- Source-Aliase (@)
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@type/(.*)$": "<rootDir>/src/types/$1",
    "^@feature/(.*)$": "<rootDir>/src/features/$1",
    "^@command/(.*)$": "<rootDir>/src/commands/$1",
    "^@lint/(.*)$": "<rootDir>/src/lint/$1",
    "^@templates/(.*)$": "<rootDir>/src/templates/$1",
    "^@webview/(.*)$": "<rootDir>/src/webview/$1",
    "^@config/(.*)$": "<rootDir>/src/config/$1",
    "^@i18n/(.*)$": "<rootDir>/src/i18n/$1",
    "^@util/(.*)$": "<rootDir>/src/utils/$1",
    "^@data/(.*)$": "<rootDir>/data/$1",
    "^@media/(.*)$": "<rootDir>/media/$1",

    // --- Test-Aliase (~)
    "^~/(.*)$": "<rootDir>/src/__tests__/$1",
    "^~feature/(.*)$": "<rootDir>/src/features/__tests__/$1",
    "^~command/(.*)$": "<rootDir>/src/commands/__tests__/$1",
    "^~util/(.*)$": "<rootDir>/src/utils/__tests__/$1",
    "^~webview/(.*)$": "<rootDir>/src/webview/__tests__/$1",
    "^~lint/(.*)$": "<rootDir>/src/lint/__tests__/$1",
    "^~i18n/(.*)$": "<rootDir>/src/i18n/__tests__/$1",
    "^~helper/(.*)$": "<rootDir>/src/__tests__/helpers/$1",

    // VS Code API → Test-Mock
    "^vscode$": "<rootDir>/src/__tests__/helpers/vscode.test.ts",
  },

  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },

  // ts-jest Konfiguration (nutzt dein tsconfig.json)
  globals: {
    "ts-jest": {
      tsconfig: "<rootDir>/tsconfig.json",
      isolatedModules: true,
    },
  },

  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setupTests.ts"],

  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/**/__tests__/**",
    "!src/**/__mocks__/**",
  ],
  coverageReporters: ["text", "lcov", "html"],

  clearMocks: true,
  verbose: true,

  testPathIgnorePatterns: ["/node_modules/", "/out/", "/dist/", "/coverage/"],
};

export default config;
