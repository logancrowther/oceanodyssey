import { defineConfig } from 'vite';
import obfuscatorPlugin from 'vite-plugin-javascript-obfuscator';

export default defineConfig({
  server: {
    port: 9000,
    strictPort: true
  },
  plugins: [
    // Only runs on `vite build` (never `vite dev`) - it transforms each of
    // our own src/*.js modules before bundling, so the copy on disk stays
    // completely normal and editable; only what ships in dist/ is mangled.
    // node_modules (Phaser) is excluded by default so the game's own inner
    // loop doesn't take an obfuscation performance hit.
    obfuscatorPlugin({
      apply: 'build',
      options: {
        compact: true,
        identifierNamesGenerator: 'hexadecimal',
        renameGlobals: false,
        stringArray: true,
        stringArrayEncoding: ['base64'],
        stringArrayThreshold: 0.85,
        rotateStringArray: true,
        splitStrings: true,
        splitStringsChunkLength: 8,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.3,
        deadCodeInjection: false,
        disableConsoleOutput: true,
        numbersToExpressions: false,
        selfDefending: false,
        debugProtection: false
      }
    })
  ]
});
