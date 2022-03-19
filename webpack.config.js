const path = require('path');

module.exports = {
    mode: 'development',
    entry: './ts-files/app.ts',
    output: {
        filename:'bundle.js',
        path: path.resolve(__dirname, 'src'),
        publicPath: 'src'
    },
    devtool: 'inline-source-map',
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.js']
    }
};