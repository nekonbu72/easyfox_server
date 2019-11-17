const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");

module.exports = {
  publicPath: "",
  configureWebpack: config => {
    if (process.env.NODE_ENV === "production") {
      config.mode = "production";
      config.devtool = false;
    } else {
      config.mode = "development";
      config.devtool = "source-map";
    }

    config.plugins.push(
      new MonacoWebpackPlugin({
        languages: ["python"],
        features: []
      })
    );
  }
};
