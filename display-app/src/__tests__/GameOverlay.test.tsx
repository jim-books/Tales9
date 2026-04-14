import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GameOverlay } from '../screens/GameOverlay'
import { useAppStore } from '../store/useAppStore'

beforeEach(() => {
  useAppStore.getState().endSession()
  useAppStore.getState().endGame()
})

describe('GameOverlay', () => {
  it('shows truth or dare actions only for the chosen user', () => {
    useAppStore.getState().startSession(4)
    useAppStore.getState().startGame('truth_or_dare')
    useAppStore.getState().advanceGame(1, null, 'user-1')

    render(<GameOverlay />)

    expect(screen.getByText("GREEN — it's your turn")).toBeTruthy()
    expect(screen.getAllByText('WAIT FOR DECISION')).toHaveLength(3)
    expect(screen.getByRole('button', { name: 'TRUTH' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'DARE' })).toBeTruthy()
    expect(screen.getAllByText(/GREEN/).length).toBeGreaterThan(0)
  })

  it('shows kings game action only for the chosen king', () => {
    useAppStore.getState().startSession(4)
    useAppStore.getState().startGame('kings_game')
    useAppStore.getState().advanceGame(1, null, 'user-2')

    render(<GameOverlay />)

    expect(screen.getAllByText('THE KING IS…')).toHaveLength(4)
    expect(screen.getAllByText(/ORANGE/).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'RULE!' })).toBeTruthy()
    expect(screen.queryAllByRole('button', { name: 'RULE!' })).toHaveLength(1)
  })
})

