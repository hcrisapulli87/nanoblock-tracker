import { useState, useEffect } from 'react'
import type { PriceResult, EbayPriceData } from '../../shared/types'

export function usePriceLookup(pokemonName: string) {
  const [ebay, setEbay] = useState<PriceResult>({ source: 'ebay', status: 'loading' })
  const [nanoblock, setNanoblock] = useState<PriceResult>({ source: 'nanoblock', status: 'loading' })

  useEffect(() => {
    if (!pokemonName) return

    setEbay({ source: 'ebay', status: 'loading' })
    setNanoblock({ source: 'nanoblock', status: 'loading' })

    window.electronAPI.fetchEbayPrices(pokemonName).then(res => {
      if (res.ok) {
        setEbay({ source: 'ebay', status: 'success', data: res.data as EbayPriceData })
      } else {
        setEbay({ source: 'ebay', status: 'error', errorMessage: res.message })
      }
    })

    window.electronAPI.fetchNanoblockPrice(pokemonName).then(res => {
      if (res.ok) {
        setNanoblock({ source: 'nanoblock', status: 'success', data: res.data as number })
      } else {
        setNanoblock({ source: 'nanoblock', status: 'error', errorMessage: res.message })
      }
    })
  }, [pokemonName])

  return { ebay, nanoblock }
}
