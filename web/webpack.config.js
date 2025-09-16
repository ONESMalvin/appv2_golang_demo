const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    page1: './src/pages/page1.js',
    setting_page_1: './src/setting_page_1/index.jsx'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    //publicPath: 'http://localhost:8082/static/'
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/pages/page1.html',
      filename: 'page1.html',
      chunks: ['page1']
    }),
    new HtmlWebpackPlugin({
      template: './src/pages/page2.html',
      filename: 'page2.html',
      chunks: ['setting_page_1']
    })
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    port: 8081,
    hot: true,
    liveReload: true,
    watchFiles: ['src/**/*'],
    open: true,
  }
};