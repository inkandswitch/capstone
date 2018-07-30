const path = require("path")
const WebpackChromeReloaderPlugin = require("webpack-chrome-extension-reloader")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const CleanWebpackPlugin = require("clean-webpack-plugin")
const CopyWebpackPlugin = require("copy-webpack-plugin")

module.exports = {
  mode: "development",
  entry: { 
    "main": "./src/main.tsx",
    "background": "./src/entry.chrome.js",
  },
  devtool: "inline-source-map",
  devServer: {
    contentBase: "./dist",
  },
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
    ],
  },
  plugins: [
    new CleanWebpackPlugin(["dist"]),
    new WebpackChromeReloaderPlugin(),
    new CopyWebpackPlugin(["./src/manifest.json", "./src/index.html"]),
    new HtmlWebpackPlugin({
      title: "Capstone",
    }),
  ],
}
