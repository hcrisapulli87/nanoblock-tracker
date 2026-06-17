import type { PriceResult, EbayPriceData } from '../../shared/types'
import { ebaySearchUrl, amazonSearchUrl, amiAmiSearchUrl, nanoblockSearchUrl } from '../data/buyLinks'

interface Props {
  ebay: PriceResult
  nanoblock: PriceResult
  pokemonName: string
  onBuyLink: (url: string) => void
}

function fmt(price: number, currency = 'AUD') {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency }).format(price)
}

function EbayRow({ result }: { result: PriceResult }) {
  if (result.status === 'loading') return <p className="price-row__loading">Loading eBay prices...</p>
  if (result.status === 'error') return <p className="price-row__error">{result.errorMessage}</p>
  if (result.status === 'not-found') return <p className="price-row__empty">No listings found on eBay</p>
  // status === 'success', data is guaranteed by discriminated union
  const d = result.data as EbayPriceData
  return (
    <div className="price-row">
      <span className="price-row__label">Secondary market</span>
      <div className="price-row__values">
        <span>Low: <strong>{fmt(d.lowestPrice, d.currency)}</strong></span>
        <span>Avg: <strong>{fmt(d.averagePrice, d.currency)}</strong></span>
        <span>High: <strong>{fmt(d.highestPrice, d.currency)}</strong></span>
      </div>
    </div>
  )
}

function NanoblockRow({ result }: { result: PriceResult }) {
  if (result.status === 'loading') return <p className="price-row__loading">Loading retail price...</p>
  if (result.status === 'error') return <p className="price-row__error">{result.errorMessage}</p>
  if (result.status === 'not-found') return <p className="price-row__empty">Retail price unavailable</p>
  // status === 'success', data is guaranteed by discriminated union
  const price = result.data as number
  return (
    <div className="price-row">
      <span className="price-row__label">Retail price</span>
      <strong>{fmt(price)}</strong>
    </div>
  )
}

export function PriceComparison({ ebay, nanoblock, pokemonName, onBuyLink }: Props) {
  const links = [
    { label: 'View on eBay →', url: ebaySearchUrl(pokemonName) },
    { label: 'View on Amazon →', url: amazonSearchUrl(pokemonName) },
    { label: 'View on AmiAmi →', url: amiAmiSearchUrl(pokemonName) },
    { label: 'Nanoblock Official →', url: nanoblockSearchUrl(pokemonName) },
  ]

  return (
    <div className="price-comparison">
      <h4 className="price-comparison__heading">Prices</h4>
      <EbayRow result={ebay} />
      <NanoblockRow result={nanoblock} />

      <h4 className="price-comparison__heading">Buy Links</h4>
      <div className="price-comparison__links">
        {links.map(l => (
          <button key={l.label} className="buy-link-btn" onClick={() => onBuyLink(l.url)}>
            {l.label}
          </button>
        ))}
      </div>
    </div>
  )
}
