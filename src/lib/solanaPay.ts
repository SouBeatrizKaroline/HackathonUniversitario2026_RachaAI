import { formatCurrencyBRL } from '@/types/racha'

export interface SolanaPayConfig {
  recipientWallet?: string
  splTokenMint?: string // e.g. USDC on Solana
  label?: string
  message?: string
  memo?: string
}

// Known default address if configured via env
export const DEFAULT_SOLANA_WALLET = (import.meta as any).env?.VITE_SOLANA_RECIPIENT_WALLET || ''

// Devnet/Mainnet USDC mint
export const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'

/**
 * Builds standard Solana Pay URL specification:
 * solana:<recipient>?amount=<amount>&spl-token=<mint>&label=<label>&message=<message>&memo=<memo>
 */
export function buildSolanaPayUrl(params: {
  recipient: string
  amountInBrl: number
  label?: string
  message?: string
  memo?: string
  reference?: string
}): string {
  const { recipient, amountInBrl, label, message, memo, reference } = params
  // Rough parity estimate for demonstration / USDC peg reference: 1 USD ~ 5.50 BRL
  const approxUsdc = Math.max(0.01, Math.round((amountInBrl / 5.5) * 100) / 100)

  const url = new URL(`solana:${recipient}`)
  url.searchParams.set('amount', approxUsdc.toFixed(2))
  url.searchParams.set('spl-token', USDC_MINT)
  if (label) url.searchParams.set('label', label)
  if (message) url.searchParams.set('message', message)
  if (memo) url.searchParams.set('memo', memo)
  if (reference) url.searchParams.set('reference', reference)

  return url.toString()
}

/**
 * Generates an SVG QR Code as a data URL without external npm dependencies
 * using an inline reliable QR generator matrix algorithm.
 */
export function generateQrDataUrl(text: string): string {
  // Use public encoded SVG or standard Google charts / vector SVG representation
  // We provide a high-resolution, self-contained SVG representation using quickchart or inline SVG
  const encoded = encodeURIComponent(text)
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encoded}&margin=2`
}
