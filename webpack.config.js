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
        extensions: ['.js', '.ts', '.json']
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
            }
          ]
    }
}