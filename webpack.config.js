const path = require("path")
const ChromeExtensionReloader = require("webpack-chrome-extension-reloader")

module.exports = {
  mode: "development",
  entry: "./src/main.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "main.bundle.js",
  },
  plugins: [
    new ChromeExtensionReloader({
      port: 9090,
    }),
  ],
}
