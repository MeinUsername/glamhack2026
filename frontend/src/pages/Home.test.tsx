import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import i18n from '../i18n'
import { renderAt, routeFetch, unauthorized } from '../test/helpers'

describe('Landingpage (F-033)', () => {
  it('AC-033-7 zeigt Name, Claim und zwei Karten, ohne Login', async () => {
    routeFetch({ 'GET /api/me': () => unauthorized })
    renderAt('/')
    expect(await screen.findByRole('heading', { level: 1, name: 'Good Question' })).toBeInTheDocument()
    expect(screen.getByText('A Tool Kit for Art Mediation', { selector: 'p' })).toBeInTheDocument()
    const main = screen.getByRole('main')
    expect(within(main).getByRole('link', { name: /Idea shop/ })).toHaveAttribute('href', '/ideas')
    expect(within(main).getByRole('link', { name: /Feedback prompt download/ })).toHaveAttribute('href', '/feedback-prompts')
  })

  it('AC-033-8 Kartenbeschriftungen sind übersetzt, der Projektname im Header nicht', async () => {
    routeFetch({ 'GET /api/me': () => unauthorized })
    renderAt('/')
    await i18n.changeLanguage('de')
    expect(await screen.findByRole('link', { name: /Ideen-Shop/ })).toHaveAttribute('href', '/ideas')
    expect(screen.getByRole('link', { name: /Feedback-Prompt Download/ })).toHaveAttribute('href', '/feedback-prompts')
    expect(within(screen.getByRole('banner')).getByRole('link', { name: 'Good Question – A Tool Kit for Art Mediation' })).toBeInTheDocument()
    await i18n.changeLanguage('en')
  })
})
