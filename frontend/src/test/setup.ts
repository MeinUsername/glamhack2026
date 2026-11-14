import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import i18n from '../i18n'

// Firebase never runs in tests. Each test sets the return values of these mocks.
vi.mock('../auth/firebase', () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOutFirebase: vi.fn(async () => {}),
  firebaseMessage: () => 'An error occurred. Please try again.',
}))

// jsdom has no layout; CodeMirror (F-023) measures text through these.
if (typeof Range !== 'undefined') {
  Range.prototype.getClientRects = () => ({ length: 0, item: () => null, [Symbol.iterator]: [][Symbol.iterator] }) as unknown as DOMRectList
  Range.prototype.getBoundingClientRect = () => new DOMRect()
}

// The tests check English texts (the source language). Each test starts in English.
beforeEach(async () => {
  await i18n.changeLanguage('en')
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})
