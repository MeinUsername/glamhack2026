// Shapes of the JSON API (see the Go handlers in files.go, auth.go, users.go, invitations.go).

export type Role = 'admin' | 'user'

export interface Me {
  email: string
  role: Role
}

export interface FileItem {
  id: string
  name: string
  bytes: number
  createdAt: string
}

export interface Invitation {
  link: string
  expiresAt: string // RFC 3339
}

export interface AdminUser {
  uid: string
  email: string
  role: Role
  disabled: boolean
}
