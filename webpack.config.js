const path = require("path")
const CopyWebpackPlugin = require("copy-webpack-plugin")
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin")
const glob = require("glob")
const env = process.env.NODE_ENV

const shared = {
  context: __dirname,
  mode: "development",
  devtool: "inline-source-map",

  node: {
    fs: "empty",
  },

  resolve: {
    alias: {
      "utp-native": "utp",
      debug: path.resolve("./src/modules/debug"),
      dgram: "chrome-dgram",
      net: "chrome-net",
      "util-deprecate": path.resolve("./stubs/util-deprecate.js"),
      "bittorrent-dht": path.resolve("./stubs/bittorrent-dht.js"),
      "random-access-file": path.resolve("./stubs/blank.js"),
    },
    extensions: [".web.ts", ".tsx", ".ts", ".js"],
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: "ts-loader",
          options: {
            transpileOnly: true,
            experimentalWatchApi: true,
          },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        include: [path.resolve(__dirname, "src/components")],
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {
              modules: true,
              localIdentName: "[local]-[hash:base64:5]",
            },
          },
        ],
      },
      {
        test: /\.css$/,
        exclude: [path.resolve(__dirname, "src/components")],
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {
              localIdentName: "[local]-[hash:base64:5]",
            },
          },
        ],
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: {
          loader: "file-loader",
          options: {
            outputPath: "assets/",
            name: file =>
              env === "development" ? "[name].[ext]" : "[hash].[ext]",
          },
        },
      },
    ],
  },
}

function app(env, name, overrides = {}) {
  const mode = env.mode || "development"

  if (env.only && env.only != name) return null

  return {
    ...shared,
    mode,
    entry: {
      main: `./src/apps/${name}/main.tsx`,
      background: `./src/apps/${name}/background.chrome.ts`,
      entry: `./src/apps/${name}/entry.chrome.ts`,
      worker: `./src/apps/${name}/worker.ts`,
    },
    output: {
      path: path.resolve(__dirname, "dist", name),
      filename: "[name].js",
    },

    plugins: [
      new CopyWebpackPlugin(["manifest.json", "index.html", "sandbox.html"], {
        context: `./src/apps/${name}`,
      }),
      new ForkTsCheckerWebpackPlugin(),
    ],
    ...overrides,
  }
}

module.exports = (env = {}) =>
  [
    app(env, "capstone"),
    app(env, "sidecar"),
    app(env, "tests", {
      entry: {
        main: [
          "./src/apps/tests/main.js",
          ...glob.sync("./src/**/__tests__/**/*.ts"),
        ],
        background: "./src/apps/tests/background.chrome.ts",
      },
    }),
    app(env, "clipper", {
      entry: {
        content: ["./src/apps/clipper/content.js"],
        background: "./src/apps/clipper/background.js",
      },
      plugins: [
        new CopyWebpackPlugin(["manifest.json"], {
          context: `./src/apps/clipper`,
        }),
      ],
    }),
  ].filter(x => x)
