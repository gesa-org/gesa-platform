// Deliberately not using next/jest's createJestConfig helper here: it
// defaults to the native SWC binary for transforms, which causes a SIGBUS
// crash when loaded from this project's network-mounted directory. Using
// babel-jest (pure JS, no native binary) instead — this only affects test
// runs; `next build`/`next dev` still use SWC as normal since there's no
// root-level babel.config.js for Next itself to pick up.

/** @type {import('jest').Config} */
module.exports = {
  // Narrowed so Jest's file crawler never walks node_modules (standard
  // require() resolution for imports still works regardless of `roots` —
  // this only controls what gets scanned for tests/haste).
  roots: ["<rootDir>/tests", "<rootDir>/components", "<rootDir>/lib", "<rootDir>/app"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testEnvironment: "jsdom",
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/", "<rootDir>/tests/e2e/"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "\\.(css|less|scss|sass)$": "<rootDir>/tests/unit/__mocks__/styleMock.js",
  },
  transform: {
    "^.+\\.(js|jsx|ts|tsx|mjs)$": [
      "babel-jest",
      { configFile: require("path").join(__dirname, "babel.config.jest.js") },
    ],
  },
  transformIgnorePatterns: ["/node_modules/"],
};
