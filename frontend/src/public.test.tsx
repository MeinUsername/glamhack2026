// F-012 frontend tests: the public use of ideas, and the sign-up that needs an invitation.
import { describe, expect, it } from 'vitest'
import userEvent from '@testing-library/user-event'
import { screen } from '@testing-library/react'
import { renderAt, routeFetch, saveIdea, unauthorized } from './test/helpers'

const idea = {
  id: 'abc',
  title: 'Lichtkabine',
  description: 'Text',
  targetGroup: '',
  descriptionOfInteraction: '',
  staffNeeded: '',
  exhibitRelated: '',
  goal: '',
  sustainability: '',
  accessibility: '',
  space: { areaM2: 2.5, volumeM3: null },
  equipment: [],
  categories: [],
  budget: null,
  images: [{ contentType: 'image/png', bytes: 10, version: 'v1' }],
  createdAt: '2026-11-13T10:00:00Z',
}

describe('F-012 public use', () => {
  // AC-012-6 and Q-012-11: without an invitation link the form is replaced by the hint.
  it('AC-012-6 zeigt auf /register ohne Einladungslink keinen Formular, sondern den Hinweis', async () => {
    routeFetch({ 'GET /api/me': () => unauthorized })
    renderAt('/register')
    expect(await screen.findByText('Registration is only possible with an invitation link.')).toBeInTheDocument()
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument()
  })

  // AC-012-1: a visitor sees the edit link on an idea page, without any login.
  it('AC-012-1 zeigt Besuchern ohne Anmeldung den Bearbeiten-Link auf der Ideenseite', async () => {
    routeFetch({ 'GET /api/me': () => unauthorized, 'GET /api/ideas/abc': () => ({ json: idea }) })
    renderAt('/ideas/abc')
    const link = await screen.findByRole('link', { name: 'Edit' })
    expect(link).toHaveAttribute('href', '/ideas/abc/edit')
  })

  // AC-012-2: a visitor edits an idea; the form is filled and the change is sent to the server.
  it('AC-012-2 lädt die Bearbeitungsseite ohne Anmeldung und sendet die Änderung per PUT', async () => {
    const { calls } = routeFetch({
      'GET /api/me': () => unauthorized,
      'GET /api/ideas/abc': () => ({ json: idea }),
      'PUT /api/ideas/abc': () => ({ json: { id: 'abc' } }),
    })
    renderAt('/ideas/abc/edit')
    expect(await screen.findByRole('heading', { name: 'Edit idea' })).toBeInTheDocument()
    expect(screen.getByLabelText('Keep image 1')).toBeChecked()

    await saveIdea(userEvent.setup())
    await screen.findByRole('heading', { name: 'Lichtkabine' })
    const put = calls.find((c) => c.method === 'PUT')
    expect(put?.url).toBe('/api/ideas/abc')
    expect(put?.body).toBeInstanceOf(FormData)
    expect(JSON.parse((put?.body as FormData).get('data') as string).keepImages).toEqual([0])
  })
})
