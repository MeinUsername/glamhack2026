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

// F-002: an idea page as returned by GET /api/ideas/{id}.
export type Budget = 'S' | 'M' | 'L' | 'XL'
export type Category = 'affirmative' | 'reproductive' | 'deconstructive' | 'transformation'

export interface IdeaImage {
  contentType: string
  bytes: number
}

export interface Idea {
  id: string
  title: string
  description: string
  audience: string
  goal: string
  sustainability: string
  accessibility: string
  space: { areaM2: number | null; volumeM3: number | null }
  equipment: string[]
  categories: Category[]
  budget: Budget | null
  images: IdeaImage[]
  createdAt: string
}
