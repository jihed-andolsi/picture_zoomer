var path = require('path');
var webpack = require('webpack');
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
        extensions: ['.js', '.ts', '.json', '.scss', '.css', '/\.(gif|png|jpe?g|svg)$/i', '.html'],
        alias: {
            'jquery': __dirname + '/src/Assets/jquery-ui-1.12.1/external/jquery/jquery.js',
            'jquery-ui': __dirname + '/src/Assets/jquery-ui-1.12.1/jquery-ui.js',
        }
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
        }),
        new webpack.optimize.UglifyJsPlugin({
            include: /\.min\.js$/,
            minimize: true
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
            },
            {
                test: /\.css$/,
                use: [
                    { loader: "style-loader" },
                    { loader: "css-loader" }
                ]
            },
            {
                test: /\.(gif|png|jpe?g|svg)$/i,
                use: [
                    'file-loader',
                    {
                        loader: 'image-webpack-loader',
                        options: {
                            bypassOnDebug: true,
                        },
                    },
                ],
            },
            {
                test: /\.html$/,
                use: [ {
                    loader: 'html-loader',
                    options: {
                        minimize: true,
                        removeComments: false,
                        collapseWhitespace: false
                    }
                }],
            }
          ]
    }
}