// Firebase Auth for the server-rendered pages (login and registration).
// The forms are plain HTML; this module signs in or registers with Firebase,
// sends the ID token to the Go function (POST /session or POST /register) and then opens the dashboard.
import { initializeApp } from 'firebase/app'
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'

const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
})
const auth = getAuth(app)

// Invitation token from /register?invite=... (empty for open registration).
const invite = new URLSearchParams(window.location.search).get('invite') ?? ''

const messages = {
  'auth/invalid-credential': 'E-Mail oder Passwort ist falsch.',
  'auth/invalid-email': 'Bitte gib eine gültige E-Mail-Adresse ein.',
  'auth/missing-password': 'Bitte gib ein Passwort ein.',
  'auth/weak-password': 'Das Passwort muss mindestens 6 Zeichen lang sein (empfohlen: 8).',
  'auth/email-already-in-use': 'Für diese E-Mail-Adresse existiert bereits ein Konto.',
  'auth/too-many-requests': 'Zu viele Versuche. Bitte warte kurz und versuche es erneut.',
  'auth/network-request-failed': 'Keine Verbindung. Bitte prüfe dein Netzwerk.',
}

const INVALID_INVITE = 'Der Einladungslink ist ungültig oder abgelaufen.'

function friendly(err) {
  return messages[err?.code] ?? 'Es ist ein Fehler aufgetreten. Bitte versuche es erneut.'
}

// Login: the account exists already. The server checks the block flag.
async function createSession(user) {
  const idToken = await user.getIdToken()
  const res = await fetch('/session', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  })
  if (!res.ok) throw new Error(res.status === 403 ? 'blocked' : 'session')
}

// Registration: the server checks the invitation (if any) and sets the session.
// On an invalid link it removes the new account again and answers 410.
async function register(user) {
  const idToken = await user.getIdToken()
  const res = await fetch('/register', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken, invite }),
  })
  if (res.status === 410) throw new Error('invite')
  if (!res.ok) throw new Error('session')
}

// Asks the server whether the link is still usable, before an account is created.
async function inviteUsable(token) {
  const res = await fetch(`/api/invitations/${encodeURIComponent(token)}`, { credentials: 'same-origin' })
  if (!res.ok) return false
  const body = await res.json()
  return body.valid === true
}

function bind(form) {
  const mode = form.dataset.authForm // "login" or "register"
  const output = form.parentElement.querySelector('[data-auth-message]')
  const button = form.querySelector('button[type="submit"]')

  // With a link that is already used or expired, the form stays disabled.
  if (mode === 'register' && invite) {
    inviteUsable(invite).then((ok) => {
      if (ok) return
      output.textContent = INVALID_INVITE
      button.disabled = true
      form.querySelectorAll('input').forEach((input) => (input.disabled = true))
    })
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    const email = form.email.value.trim()
    const password = form.password.value
    output.textContent = ''
    button.disabled = true
    try {
      if (mode === 'register') {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        await register(cred.user)
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password)
        await createSession(cred.user)
      }
      window.location.assign('/dashboard')
    } catch (err) {
      // The browser is signed in to Firebase already; drop that session, since the server refused the account.
      await signOut(auth).catch(() => {})
      if (err.message === 'invite') output.textContent = INVALID_INVITE
      else if (err.message === 'blocked') output.textContent = 'Dieses Konto ist gesperrt.'
      else if (err.message === 'session') output.textContent = 'Anmeldung konnte nicht abgeschlossen werden.'
      else output.textContent = friendly(err)
      button.disabled = false
    }
  })
}

document.querySelectorAll('form[data-auth-form]').forEach(bind)
