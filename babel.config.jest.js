// Used only by Jest (see jest.config.js). Next.js itself still uses SWC for
// `next build`/`next dev` — this file exists solely so next/jest falls back
// to babel-jest instead of the native SWC binary, which triggered SIGBUS
// crashes when loaded from this project's network-mounted directory.
module.exports = {
  presets: ["next/babel"],
};
