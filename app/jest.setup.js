/**
 * Jest Setup File
 * Mocks and global test configuration
 */

// Mock React Native modules that require native implementations
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter')
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper')
jest.mock('react-native/Libraries/Settings/Settings', () => ({
  get: jest.fn(),
  set: jest.fn(),
}))

// Silence the warning: Animated: `useNativeDriver` is not supported
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper')

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
)

// Mock Appearance API
jest.mock('react-native/Libraries/Utilities/Appearance', () => {
  const actualAppearance = jest.requireActual('react-native/Libraries/Utilities/Appearance')
  return {
    ...actualAppearance,
    getColorScheme: jest.fn(() => 'light'),
    addChangeListener: jest.fn(() => ({
      remove: jest.fn(),
    })),
  }
})

// Suppress console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
}
