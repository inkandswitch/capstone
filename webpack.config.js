const path = require("path")
const CopyWebpackPlugin = require("copy-webpack-plugin")
const glob = require("glob")
const env = process.env.NODE_ENV

const shared = {
  mode: "development",
  devtool: "inline-source-map",

  node: {
    fs: "empty",
  },

  resolve: {
    alias: {
      "utp-native": "utp",
      debug: "chrome-debug",
      dgram: "chrome-dgram",
      net: "chrome-net",
      "util-deprecate": path.resolve("./stubs/util-deprecate.js"),
      "bittorrent-dht": path.resolve("./stubs/bittorrent-dht.js"),
      "random-access-file": path.resolve("./stubs/blank.js"),
    },
    extensions: [".tsx", ".ts", ".js"],
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            // options: {
            //   importLoaders: 1,
            // },
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

function app(name, overrides = {}) {
  return {
    ...shared,
    entry: {
      main: `./src/apps/${name}/main.tsx`,
      background: `./src/apps/${name}/background.chrome.ts`,
    },
    output: {
      path: path.resolve(__dirname, "dist", name),
      filename: "[name].js",
    },

    plugins: [
      new CopyWebpackPlugin(["manifest.json", "index.html"], {
        context: `./src/apps/${name}`,
      }),
    ],
    ...overrides,
  }
}

module.exports = [
  app("capstone"),
  app("sidecar"),
  app("tests", {
    entry: {
      main: [
        "./src/apps/tests/main.js",
        ...glob.sync("./src/**/__tests__/**/*.ts"),
      ],
      background: "./src/apps/tests/background.chrome.ts",
    },
  }),
]
