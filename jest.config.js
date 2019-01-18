module.exports = {
  "roots": [
    "<rootDir>/src"
  ],
  "transform": {
    "^.+\\.tsx?$": "ts-jest"
  },
  "testRegex": "(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$",
  "collectCoverage": true,
  "collectCoverageFrom": [
    "**/*.ts",
    "!**/node_modules/**"
  ],
  "coverageReporters": [
    "html",
    "text-summary",
    "lcov"
  ],
  "testPathIgnorePatterns": ["initTable.spec.ts"],
  "moduleFileExtensions": [
    "ts",
    "tsx",
    "js",
    "jsx",
    "json",
    "node"
  ],
}
