import { config } from '@tamagui/config/v3'
import { createTamagui } from 'tamagui'

// 1. 建立設定實例
const tamaguiConfig = createTamagui(config)

// 2. 這裡必須是 export default
export default tamaguiConfig

// 3. 導出型別
export type AppConfig = typeof tamaguiConfig

// 4. 擴充 Tamagui 的全域型別 (這步沒做會導致很多紅字)
declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}