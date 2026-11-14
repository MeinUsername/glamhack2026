// Shapes of the JSON API (see the Go handlers in auth.go, users.go, invitations.go).

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
  link: string // F-012 D5: no expiry any more
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
  version: string
}

export type IdeaStatus = 'pending' | 'published' | 'rejected'

// F-031: a link of an idea and the type it belongs to (types are kept by admins).
export interface IdeaLink {
  url: string
  title: string
  typeId: string
}

export interface LinkType {
  id: string
  name: string
}

export interface Idea {
  id: string
  title: string
  description: string
  mediationConcept: string
  status?: IdeaStatus // F-030; missing counts as published
  rejectionReason?: string
  creditFirstName: string
  creditLastName: string
  creditInstitute: string
  creditEmail: string
  targetGroup: string
  goal: string
  descriptionOfInteraction: string
  staffNeeded: string
  exhibitRelated: string
  sustainability: string
  accessibility: string
  space: { areaM2: number | null; volumeM3: number | null }
  equipment: string[]
  categories: Category[]
  // F-024: IDs from data/icom-filter-kategorien.json. Optional, because older test data lacks them.
  icomCategories?: string[]
  locations?: string[]
  budget: Budget | null
  images: IdeaImage[]
  links?: IdeaLink[] // F-031; missing in older test data
  createdAt: string
}

// F-025: a feedback prompt. The text is only sent to admins.
export interface FeedbackPrompt {
  id: string
  title: string
  description: string
  text?: string
}

// F-018: a prompt level (Detailgrad). Titles and descriptions per language, English always present.
export interface PromptLevel {
  id: string
  titles: Record<string, string>
  descriptions: Record<string, string>
  text: string
  version: number
}
