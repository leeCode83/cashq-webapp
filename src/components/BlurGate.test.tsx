// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BlurGate } from './BlurGate'

vi.mock('@privy-io/react-auth', () => ({ useLogin: () => ({ login: vi.fn() }) }))

afterEach(cleanup)

describe('BlurGate', () => {
  it('aktif: konten tersembunyi (aria-hidden) + kartu Login dulu + tombol Masuk', () => {
    render(
      <BlurGate active>
        <p>skor rahasia</p>
      </BlurGate>,
    )
    expect(screen.getByText('skor rahasia').closest('[aria-hidden]')).not.toBeNull()
    expect(screen.getByText('Login dulu')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Masuk' })).toBeTruthy()
  })

  it('tidak aktif: konten tampil normal tanpa kartu', () => {
    render(
      <BlurGate active={false}>
        <p>skor terlihat</p>
      </BlurGate>,
    )
    expect(screen.getByText('skor terlihat')).toBeTruthy()
    expect(screen.queryByText('Login dulu')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Masuk' })).toBeNull()
  })
})
