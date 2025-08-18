// jest.config.ts
import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",

  // Suche Tests primär unterhalb von src/
  roots: ["<rootDir>/src"],

  // Erlaubte Dateiendungen
  moduleFileExtensions: ["ts", "tsx", "js", "json"],

  // Match-Patterns für Tests (beides erlaubt: __tests__ Ordner & *.test|spec.ts)
  testMatch: [
    "<rootDir>/src/**/__tests__/**/*.(test|spec).ts",
    "<rootDir>/src/**/*.(test|spec).ts",
  ],

  // Aliase 1:1 gemäß deiner tsconfig.json (Quelle + Tests)
  moduleNameMapper: {
    // --- Source-Aliase (@)
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@type/(.*)$": "<rootDir>/src/types/$1",
    "^@feature/(.*)$": "<rootDir>/src/features/$1",
    "^@command/(.*)$": "<rootDir>/src/features/commands/$1",
    "^@util/(.*)$": "<rootDir>/src/utils/$1",
    "^@data/(.*)$": "<rootDir>/data/$1",

    // --- Test-Aliase (~)
    "^~/(.*)$": "<rootDir>/src/__tests__/$1",
    "^~feature/(.*)$": "<rootDir>/src/features/__tests__/$1",
    "^~command/(.*)$": "<rootDir>/src/features/commands/__tests__/$1",
    "^~util/(.*)$": "<rootDir>/src/utils/__tests__/$1",
    "^~helper/(.*)$": "<rootDir>/src/__tests__/helpers/$1",

    // VS Code API auf Test-Mock umbiegen
    "^vscode$": "<rootDir>/src/__tests__/__mocks__/vscode.ts",
  },

  // ts-jest kümmert sich um TS-Transformation
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },

  // Optionales Setup (z. B. globale Mocks, Reset zwischen Tests, usw.)
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setupTests.ts"],

  // Coverage-Einstellungen
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/**/__tests__/**",
    "!src/**/__mocks__/**",
    "!src/types/types.ts",
  ],
  coverageReporters: ["text", "lcov", "html"],

  // Qualität/Ergonomie
  clearMocks: true,
  verbose: true,

  // Verhindert false positives aus Build-Ordnern
  testPathIgnorePatterns: ["/node_modules/", "/out/", "/dist/"],
};

export default config;
