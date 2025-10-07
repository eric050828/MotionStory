module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // expo-router/babel is included in babel-preset-expo since SDK 50
      'react-native-reanimated/plugin',
    ],
  };
};
