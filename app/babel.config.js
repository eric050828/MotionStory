module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // 1. Tamagui 需要的環境變數插件
      'transform-inline-environment-variables',

      // 2. Reanimated 插件 (必須在最後)
      'react-native-reanimated/plugin',
    ],
  };
};