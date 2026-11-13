// Firebase Auth in the browser. The Go function never sees the password; it gets the ID token.
import { initializeApp } from 'firebase/app'
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import i18n from '../i18n'
import type { MessageKey } from '../i18n/messages'

const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
})
const auth = getAuth(app)

export async function signIn(email: string, password: string): Promise<User> {
  return (await signInWithEmailAndPassword(auth, email, password)).user
}

export async function signUp(email: string, password: string): Promise<User> {
  return (await createUserWithEmailAndPassword(auth, email, password)).user
}

export function signOutFirebase(): Promise<void> {
  return signOut(auth)
}

const messages: Record<string, MessageKey> = {
  'auth/invalid-credential': 'error.firebase.invalidCredential',
  'auth/invalid-email': 'error.firebase.invalidEmail',
  'auth/missing-password': 'error.firebase.missingPassword',
  'auth/weak-password': 'error.firebase.weakPassword',
  'auth/email-already-in-use': 'error.firebase.emailInUse',
  'auth/too-many-requests': 'error.firebase.tooManyRequests',
  'auth/network-request-failed': 'error.firebase.network',
}

// The message in the current language. Firebase codes map to keys; anything else is generic.
export function firebaseMessage(err: unknown): string {
  const code = (err as { code?: string } | null)?.code
  const key = (code && messages[code]) || 'error.generic'
  return i18n.t(key)
}
