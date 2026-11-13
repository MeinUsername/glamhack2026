// Firebase Auth in the browser. The Go function never sees the password; it gets the ID token.
import { initializeApp } from 'firebase/app'
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'

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

const messages: Record<string, string> = {
  'auth/invalid-credential': 'E-Mail oder Passwort ist falsch.',
  'auth/invalid-email': 'Bitte gib eine gültige E-Mail-Adresse ein.',
  'auth/missing-password': 'Bitte gib ein Passwort ein.',
  'auth/weak-password': 'Das Passwort muss mindestens 6 Zeichen lang sein (empfohlen: 8).',
  'auth/email-already-in-use': 'Für diese E-Mail-Adresse existiert bereits ein Konto.',
  'auth/too-many-requests': 'Zu viele Versuche. Bitte warte kurz und versuche es erneut.',
  'auth/network-request-failed': 'Keine Verbindung. Bitte prüfe dein Netzwerk.',
}

export function firebaseMessage(err: unknown): string {
  const code = (err as { code?: string } | null)?.code
  return (code && messages[code]) || 'Es ist ein Fehler aufgetreten. Bitte versuche es erneut.'
}
