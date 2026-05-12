import ka from './messages/ka.json'
import en from './messages/en.json'

export const messages = { ka, en } as const
export type Locale = keyof typeof messages
