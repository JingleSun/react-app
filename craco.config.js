const { when, whenDev, whenProd } = require('@craco/craco');
const CracoLessPlugin = require('craco-less');
const CracoVtkPlugin = require('craco-vtk');
const CracoAntdPlugin = require('craco-antd');
const CracoAliasPlugin = require('craco-alias');
const CracoFastRefreshPlugin = require('craco-fast-refresh');

const webpack = require('webpack');
const WebpackBar = require('webpackbar');
const DashboardPlugin = require('webpack-dashboard/plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const CircularDependencyPlugin = require('circular-dependency-plugin');
const SimpleProgressWebpackPlugin = require('simple-progress-webpack-plugin');
const CompressionWebpackPlugin = require('compression-webpack-plugin');

const path = require('path');
const pathResolve = pathUrl => path.join(__dirname, pathUrl);

const isBuildAnalyzer = process.env.BUILD_ANALYZER === 'true';

module.exports = {
    webpack: {
        alias: {
            '@': pathResolve('src')
        },
        plugins: [
            new WebpackBar({ profile: true }),
            new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
            new SimpleProgressWebpackPlugin(),
            ...whenDev(() => [
                new CircularDependencyPlugin({
                    exclude: /node_modules/,
                    include: /src/,
                    failOnError: true,
                    allowAsyncCycles: false,
                    cwd: process.cwd()
                }),
                new DashboardPlugin(),
                // new webpack.HotModuleReplacementPlugin(),
            ], []),
            ...when(isBuildAnalyzer, () => [
                new BundleAnalyzerPlugin({
                    analyzerMode: 'static',
                    openAnalyzer: false,
                    reportFilename: path.resolve(__dirname, `analyzer/index.html`),
                }),
            ], []),
            ...whenProd(() => [
                new CompressionWebpackPlugin({
                    algorithm: 'gzip',
                    test: new RegExp('\\.(' + ['js', 'css'].join('|') + ')$'),
                    threshold: 1024,
                    minRatio: 0.8,
                }),
            ], []),
        ],
        configure: (webpackConfig, { env, paths }) => {
            webpackConfig.devtool = false;
            paths.appBuild = 'dist';
            webpackConfig.output = {
                ...webpackConfig.output,
                path: path.resolve(__dirname, 'dist'),
                publicPath: '/',
            };
            return webpackConfig;
        },
        optimization: {
            splitChunks: {
                cacheGroups: {
                    commons: {
                        chunks: 'initial',
                        minChunks: 2,
                        maxInitialRequests: 5,
                        minSize: 0,
                    },
                    vendor: {
                        test: /node_modules/,
                        chunks: 'initial',
                        name: 'vendor',
                        priority: 10,
                        enforce: true,
                    },
                },
            },
        },
    },
    babel: {
        presets: [],
        plugins: [
            ['@babel/plugin-proposal-decorators', { legacy: true }],
            // ['import', { libraryName: 'antd', style: true }],
            ['import', { libraryName: 'antd', libraryDirectory: 'es', style: true }, 'antd']
        ],
        loaderOptions: {},
        loaderOptions: (babelLoaderOptions, { env, paths }) => { return babelLoaderOptions; },
    },
    plugins: [
        ...whenDev(() => [
            { plugin: CracoFastRefreshPlugin },
            { plugin: CracoVtkPlugin() },
        ], []),
        // {
        //     plugin: CracoLessPlugin,
        //     options: {
        //         lessLoaderOptions: {
        //             lessOptions: {
        //                 javascriptEnabled: true,
        //             }
        //         }
        //     }
        // },
        {
            plugin: CracoAntdPlugin,
            options: {
                customizeThemeLessPath: pathResolve('antd.customize.less'),
            },
        },
        {
            plugin: CracoAliasPlugin,
            options: {
                source: 'tsconfig',
                baseUrl: './src',
                tsConfigPath: './tsconfig.extends.json',
            },
        },
    ],
    devServer: {
        port: 8023,
        proxy: {
            '/api': {
                target: 'https://placeholder.com/',
                changeOrigin: true,
                secure: false,
                xfwd: false,
            },
        },
    },
};