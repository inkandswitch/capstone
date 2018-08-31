const path = require("path")
const CopyWebpackPlugin = require("copy-webpack-plugin")
const env = process.env.NODE_ENV

module.exports = {
  mode: "development",
  entry: {
    main: "./src/main.tsx",
    background: "./src/entry.chrome.ts",
    "sidecar/main": "./src/apps/sidecar/main.tsx",
    "sidecar/background": "./src/apps/sidecar/background.chrome.ts",
  },
  devtool: "inline-source-map",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
  },
  resolve: {
    alias: {
      "utp-native": "utp",
      dgram: "chrome-dgram",
      net: "chrome-net",
      "bittorrent-dht": path.resolve("./stubs/bittorrent-dht.js"),
      "random-access-file": path.resolve("./stubs/bittorrent-dht.js"),
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
  plugins: [
    new CopyWebpackPlugin([
      {
        from: "{manifest.json,index.html}",
        context: "./src",
        to: ".",
      },
      {
        from: "{manifest.json,index.html}",
        context: "./src/apps/sidecar",
        to: "sidecar",
      },
    ]),
  ],
}
