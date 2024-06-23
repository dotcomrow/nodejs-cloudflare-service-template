import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    entry: "./src/index.js",
    mode: "production",
    optimization: {
      minimize: true
    },
    performance: {
      hints: false
    },
    output: {
      path: __dirname + "/dist",
      publicPath: "dist",
      filename: "index.mjs",
      library: {
        type: 'module',
      },
    },
    experiments: {
      outputModule: true,
    },
    module: {
      rules: [
        // all files with a `.ts`, `.cts`, `.mts` or `.tsx` extension will be handled by `ts-loader`
        { test: /\.([cm]?ts|tsx)$/, loader: "ts-loader" }
      ]
    },
    resolve: {
      fallback: {
        path: false,
        stream: false,
        crypto: require.resolve("crypto-browserify"),
        // os: require.resolve("os-browserify/browser"),
        // zlib: require.resolve("browserify-zlib"),
        util: false,
        dns: false,
        https: require.resolve("https-browserify"),
        "buffer": require.resolve("buffer/"),
        "vm": require.resolve("vm-browserify")
        // url: require.resolve("url/"),
        // http: require.resolve("stream-http"),
        // assert: require.resolve("assert/"),
      }
    }
  };