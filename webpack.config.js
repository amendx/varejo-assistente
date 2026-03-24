const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { VueLoaderPlugin } = require('vue-loader')
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin')

const isDev = process.env.NODE_ENV !== 'production'
const isPreview = process.env.PREVIEW === 'true'
const publicPath = isDev || isPreview 
  ? 'http://localhost:8090/' 
  : 'https://varejo-assistente.vercel.app/'

module.exports = {
  mode: isDev ? 'development' : 'production',
  entry: {
    main: './src/index.js',
    iframe: './src/iframe.js'  // 🌉 Nova entrada para iframe
  },
  
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: isDev ? '[name].js' : '[name].[contenthash].js',
    chunkFilename: isDev ? '[name].chunk.js' : '[name].[contenthash].chunk.js',
    publicPath: publicPath,
    clean: true,
    assetModuleFilename: 'assets/[name].[contenthash][ext]'
  },
  devServer: {
    port: 8090,
    historyApiFallback: true,
    hot: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
    }
  },

  resolve: {
    extensions: ['.js', '.vue', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },

  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                targets: {
                  browsers: ['> 1%', 'last 2 versions']
                }
              }]
            ]
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },

  plugins: [
    new ModuleFederationPlugin({
      name: 'assistente_compras',
      filename: 'remoteEntry.js',
      exposes: {
        './App': './src/App.vue',  
        './AssistenteCompras': './src/bootstrap.js'
      },
      shared: {
        vue: {
          singleton: true,
          eager: false,
          requiredVersion: '^3.0.0'
        }
      }
    }),
    new HtmlWebpackPlugin({
      template: './public/index.html',
      filename: 'index.html',
      chunks: ['main'],  // Apenas chunk main para Module Federation
      inject: true
    }),
    new HtmlWebpackPlugin({
      template: './public/iframe.html', 
      filename: 'iframe.html',
      chunks: ['iframe'],  // 🌉 Chunk iframe para modo iframe
      inject: true
    }),
    new VueLoaderPlugin()
  ],

  optimization: {
    splitChunks: {
      chunks: 'async',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        }
      }
    }
  }
}