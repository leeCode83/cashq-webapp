// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { AmountInput } from './ui'

afterEach(cleanup)

/** harness terkontrol seperti pemakaian nyata: state menyimpan angka mentah */
function Harness({ onChange }: { onChange?: (raw: string) => void }) {
  const [raw, setRaw] = useState('')
  return (
    <AmountInput
      value={raw}
      onValueChange={(v) => {
        setRaw(v)
        onChange?.(v)
      }}
    />
  )
}

const getInput = () => screen.getByRole('textbox') as HTMLInputElement

describe('AmountInput', () => {
  it('memformat ribuan saat mengetik, state tetap mentah', async () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    await userEvent.setup().type(getInput(), '10000')
    expect(getInput().value).toBe('10.000')
    expect(onChange).toHaveBeenLastCalledWith('10000')
  })

  it('menampilkan value terkontrol mentah dalam bentuk berformat', () => {
    render(<AmountInput value="135000" onValueChange={vi.fn()} />)
    expect(getInput().value).toBe('135.000')
  })

  it('koma diabaikan dan digit menyambung — state selalu integer murni', async () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    await userEvent.setup().type(getInput(), '1250,5')
    expect(getInput().value).toBe('12.505')
    expect(onChange).toHaveBeenLastCalledWith('12505')
  })

  it('kosong lagi setelah semua dihapus', async () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    const user = userEvent.setup()
    await user.type(getInput(), '100')
    await user.clear(getInput())
    expect(getInput().value).toBe('')
    expect(onChange).toHaveBeenLastCalledWith('')
  })
})
