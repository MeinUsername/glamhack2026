import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Firebase never runs in tests. Each test sets the return values of these mocks.
vi.mock('../auth/firebase', () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOutFirebase: vi.fn(async () => {}),
  firebaseMessage: () => 'Es ist ein Fehler aufgetreten. Bitte versuche es erneut.',
}))

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})
