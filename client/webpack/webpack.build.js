'use strict';
const path = require('path');
const webpack = require('webpack');
const Dotenv = require('dotenv-webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const rootPath = path.resolve(__dirname, '../');

module.exports = {
    mode: 'production',
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
    plugins: [
        new HtmlWebpackPlugin({
            hash: true,
            template: path.join(rootPath, './src/index.html'),
        }),
        new Dotenv({path: path.join(rootPath, './.env'),}),
    ]
}