import path from 'path';
import { fileURLToPath } from 'url';

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
        crypto: false,
        stream: false,
        https: false,
        // os: require.resolve("os-browserify/browser"),
        // zlib: require.resolve("browserify-zlib"),
        util: false,
        net: false,
        dns: false
        // url: require.resolve("url/"),
        // http: require.resolve("stream-http"),
        // assert: require.resolve("assert/"),
        // buffer: require.resolve("buffer/")
      }
    }
  };