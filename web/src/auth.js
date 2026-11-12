// Firebase Auth for the server-rendered pages (login and registration).
// The forms are plain HTML; this module signs in or registers with Firebase,
// sends the ID token to the Go function (POST /session) and then opens the dashboard.
import { initializeApp } from 'firebase/app'
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth'

const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
})
const auth = getAuth(app)

const messages = {
  'auth/invalid-credential': 'E-Mail oder Passwort ist falsch.',
  'auth/invalid-email': 'Bitte gib eine gültige E-Mail-Adresse ein.',
  'auth/missing-password': 'Bitte gib ein Passwort ein.',
  'auth/weak-password': 'Das Passwort muss mindestens 6 Zeichen lang sein (empfohlen: 8).',
  'auth/email-already-in-use': 'Für diese E-Mail-Adresse existiert bereits ein Konto.',
  'auth/too-many-requests': 'Zu viele Versuche. Bitte warte kurz und versuche es erneut.',
  'auth/network-request-failed': 'Keine Verbindung. Bitte prüfe dein Netzwerk.',
}

function friendly(err) {
  return messages[err?.code] ?? 'Es ist ein Fehler aufgetreten. Bitte versuche es erneut.'
}

async function createSession(user) {
  const idToken = await user.getIdToken()
  const res = await fetch('/session', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  })
  if (!res.ok) throw new Error('session')
}

function bind(form) {
  const mode = form.dataset.authForm // "login" or "register"
  const output = form.parentElement.querySelector('[data-auth-message]')
  const button = form.querySelector('button[type="submit"]')

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    const email = form.email.value.trim()
    const password = form.password.value
    output.textContent = ''
    button.disabled = true
    try {
      const cred =
        mode === 'register'
          ? await createUserWithEmailAndPassword(auth, email, password)
          : await signInWithEmailAndPassword(auth, email, password)
      await createSession(cred.user)
      window.location.assign('/dashboard')
    } catch (err) {
      output.textContent = err.message === 'session' ? 'Anmeldung konnte nicht abgeschlossen werden.' : friendly(err)
      button.disabled = false
    }
  })
}

document.querySelectorAll('form[data-auth-form]').forEach(bind)
