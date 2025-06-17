import type { JestConfigWithTsJest } from "ts-jest";

const config: JestConfigWithTsJest = {
  preset: "ts-jest/presets/default",
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  moduleFileExtensions: ["ts", "tsx", "js"],
  testMatch: ["**/test/**/*.test.ts"],
  extensionsToTreatAsEsm: [".ts"],
};

export default config;
