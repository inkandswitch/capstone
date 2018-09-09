const path = require("path")
const CopyWebpackPlugin = require("copy-webpack-plugin")
const env = process.env.NODE_ENV

module.exports = {
  mode: "development",
  entry: {
    main: "./src/main.tsx",
    background: "./src/entry.chrome.ts",
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
  plugins: [new CopyWebpackPlugin(["./src/manifest.json", "./src/index.html"])],
}
