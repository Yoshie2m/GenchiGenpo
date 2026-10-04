import { createContext, useContext } from 'react'

/** 画面の見え方（夜のテーマか、算用数字を併記するか）。 */
export interface UiState {
  readonly night: boolean
  readonly showArabic: boolean
}

export const UiContext = createContext<UiState>({ night: false, showArabic: false })
export const useUi = () => useContext(UiContext)
