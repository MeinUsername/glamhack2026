import { api } from '../api'

// Exchanges a fresh Firebase ID token for the session cookie (login).
export function createSession(idToken: string): Promise<void> {
  return api<void>('/session', { method: 'POST', json: { idToken } })
}

// Creates the account on the server after Firebase sign-up (registration, optional invitation).
export function registerAccount(idToken: string, invite: string): Promise<void> {
  return api<void>('/register', { method: 'POST', json: { idToken, invite } })
}

// Checks an invitation link before an account is created.
export async function inviteUsable(token: string): Promise<boolean> {
  const res = await api<{ valid: boolean }>(`/api/invitations/${encodeURIComponent(token)}`)
  return res.valid
}
