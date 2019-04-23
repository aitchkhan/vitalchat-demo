'use strict';
const path = require('path');
const Dotenv = require('dotenv-webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const rootPath = path.resolve(__dirname, '../');

module.exports = {
    devtool: 'eval-source-map',
    mode: 'development',
    entry: {
        index: path.join(rootPath, './src/index.js'),
    },
    context: rootPath,
    output: {
        filename: '[name].bundle.js',
        path: path.join(rootPath, './dist'),
        publicPath: '/'
    },
    module: {
        rules: [
            {
                test: /\.html$/,
                use: [{
                    loader: 'html-loader'
                }]
            },
            {
                test: /\.js$/,
                exclude: [
                    path.resolve(rootPath, 'node_modules'),
                ],
                use: ['babel-loader'],
            },
        ]
    },
    resolve: {
        modules: [
            'src',
            'node_modules',
        ],
        extensions: ['.js',],
    },
    devServer: {
        contentBase: path.join(rootPath, './dist'),
        host: 'localhost',
        port: 9000
    },
    plugins: [
        new Dotenv({
            path: path.join(rootPath, './.env'),
            defaults: true,
        }),
        new webpack.DefinePlugin({
            VC_SERVER_URL: JSON.stringify(process.env.VC_SERVER_URL),
            API_SERVER_URL: JSON.stringify(process.env.API_SERVER_URL),
        }),
        new HtmlWebpackPlugin({
            hash: true,
            template: path.join(rootPath, './src/index.html'),
        }),
    ]
}