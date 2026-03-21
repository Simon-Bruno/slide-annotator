import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/__tests__"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^pdfjs-dist/legacy/build/pdf\\.mjs$": "<rootDir>/__tests__/__mocks__/pdfjs-dist.ts",
  },
  testPathIgnorePatterns: ["/node_modules/", "/__mocks__/"],
};
export default config;
