// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Modal } from './Modal'

afterEach(cleanup)

describe('Modal', () => {
  it('menampilkan isi saat open, tidak merender saat closed', () => {
    const { rerender } = render(
      <Modal open onClose={vi.fn()} title="Tes">
        isi modal
      </Modal>,
    )
    expect(screen.getByText('isi modal')).toBeTruthy()
    rerender(
      <Modal open={false} onClose={vi.fn()} title="Tes">
        isi modal
      </Modal>,
    )
    expect(screen.queryByText('isi modal')).toBeNull()
  })

  it('Escape dan klik overlay menutup, klik kartu tidak', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(
      <Modal open onClose={onClose} title="Tes">
        isi modal
      </Modal>,
    )
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('dialog').parentElement!)
    expect(onClose).toHaveBeenCalledTimes(2)

    await user.click(screen.getByText('isi modal'))
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
