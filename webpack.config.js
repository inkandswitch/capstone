const path = require("path")
const CopyWebpackPlugin = require("copy-webpack-plugin")
const glob = require("glob")
const env = process.env.NODE_ENV

module.exports = {
  mode: "development",
  entry: {
    "capstone/main": "./src/apps/capstone/main.tsx",
    "capstone/background": "./src/apps/capstone/background.chrome.ts",
    "sidecar/main": "./src/apps/sidecar/main.tsx",
    "sidecar/background": "./src/apps/sidecar/background.chrome.ts",
    "tests/main": [
      "./src/apps/tests/main.js",
      ...glob.sync("./src/**/__tests__/**/*.ts"),
    ],
    "tests/background": "./src/apps/tests/background.chrome.ts",
  },
  devtool: "inline-source-map",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
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
  node: {
    fs: "empty",
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
  plugins: [
    new CopyWebpackPlugin([
      {
        from: "{manifest.json,index.html}",
        context: "./src/apps/capstone",
        to: "capstone",
      },
      {
        from: "{manifest.json,index.html}",
        context: "./src/apps/sidecar",
        to: "sidecar",
      },
      {
        from: "{manifest.json,index.html}",
        context: "./src/apps/tests",
        to: "tests",
      },
    ]),
  ],
}
