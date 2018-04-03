var path = require("path")
var webpack = require("webpack")

module.exports = env => {
  const build = env && env.build && env.build === "build"
  return {
    entry: ["babel-polyfill", build ? "./src/index.js" : "./test/index.js"],
    output: {
      path: path.resolve(__dirname, "build"),
      filename: build ? "build.js" : "script.js",
      publicPath: path.resolve(__dirname, "build/") + "/",
    },
    devServer: {
      contentBase: "./build",
      hot: true,
    },
    target: "node",
    node: {
      __dirname: true,
    },
    resolve: {
      alias: {
        classifier: path.resolve(__dirname, "src"),
      },
    },
    module: {
      loaders: [
        {
          test: /(\.csv)$/,
          loader: "csv-loader",
        },
        {
          test: /(\.png)$/,
          loader: "file-loader",
          options: {
            useRelativePath: true,
          },
        },
        {
          test: /(\.js|\.jsx)$/,
          loader: "babel-loader",
          query: {
            presets: ["env"],
            plugins: [
              "transform-object-rest-spread",
              "transform-decorators-legacy",
              "transform-class-properties",
              "transform-do-expressions",
            ],
          },
        },
      ],
    },
    stats: {
      colors: true,
    },
    plugins: [
      new webpack.DefinePlugin({
        $dirname: "__dirname",
      }),
    ],
  }
}
