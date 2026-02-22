// metro.config.js — Web 平台將 react-native-maps 替換為空 stub
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const WEB_STUBS = {
    'react-native-maps': path.resolve(__dirname, 'src/mocks/maps.stub.js'),
};

const _resolve = config.resolver.resolveRequest;
config.resolver.resolveRequest = (ctx, name, platform) => {
    if (platform === 'web' && WEB_STUBS[name]) {
        return { filePath: WEB_STUBS[name], type: 'sourceFile' };
    }
    return _resolve ? _resolve(ctx, name, platform) : ctx.resolveRequest(ctx, name, platform);
};

module.exports = config;
