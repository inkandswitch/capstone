const path = require("path")
const CopyWebpackPlugin = require("copy-webpack-plugin")

module.exports = {
  mode: "development",
  entry: {
    main: "./src/main.tsx",
    background: "./src/entry.chrome.js",
  },
  devtool: "inline-source-map",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
  },
  resolve: {
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
        test: /\.(png|svg|jpg|gif)$/,
        use: "file-loader",
      },
    ],
  },
  plugins: [
    new CopyWebpackPlugin(["./src/manifest.json", "./src/index.html"]),
    new CopyWebpackPlugin([{ from: "src/assets", to: "assets" }]),
  ],
}
