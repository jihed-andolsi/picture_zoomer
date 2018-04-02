var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: './src/App.ts',
    output: {
        pathinfo: true,
        filename: 'bundle.js',
        path: path.resolve('./dist')
    },

    resolve: {
        // add '.ts' as resolvable extensions
        extensions: ['.js', '.ts', '.json', '.scss']
    },
    devtool: 'source-map',
    plugins: [
        new CopyWebpackPlugin([
            {
                from: './src/assets',
                to:'./assets'
            },
            {
                from: './src/Components',
                to:'./Components'
            }
        ]),
        new HtmlWebpackPlugin({
            template: './index.html',
            inject: 'body'
        })
    ],

    module: {
        loaders: [
            { test: /\.ts(x?)$/, exclude: /node_modules/, loader: "ts-loader" },
            {
                test: /\.json$/,
                exclude: /node_modules/,
                loader: 'json-loader'
            },
            {
                test: /\.(scss)$/,
                use: [{
                    loader: 'style-loader', // inject CSS to page
                }, {
                    loader: 'css-loader', // translates CSS into CommonJS modules
                }, {
                    loader: 'postcss-loader', // Run post css actions
                    options: {
                        plugins: function () { // post css plugins, can be exported to postcss.config.js
                            return [
                                require('precss'),
                                require('autoprefixer')
                            ];
                        }
                    }
                }, {
                    loader: 'sass-loader' // compiles Sass to CSS
                }]
            }
          ]
    }
}