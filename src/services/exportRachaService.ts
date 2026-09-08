import { Racha, formatCurrencyBRL } from '@/types/racha'

/**
 * Generates a high-resolution PNG image of a racha summary using an HTML5 canvas.
 * Brand styling: Purple #7B2FF7 header gradient, Amber #FFB020 accents, crisp typography,
 * metrics cards, participants table with ✅ / ⏳ badges and footer with Racha.AI branding.
 */
export async function generateRachaSummaryImage(racha: Racha): Promise<string> {
  const scale = 2 // Retina crispness
  const width = 800
  // Dynamic height based on participants and history
  const headerHeight = 240
  const statsHeight = 140
  const participantItemHeight = 44
  const participantsHeight = Math.max(120, racha.participants.length * participantItemHeight + 60)
  const footerHeight = 100
  const totalHeight = headerHeight + statsHeight + participantsHeight + footerHeight

  const canvas = document.createElement('canvas')
  canvas.width = width * scale
  canvas.height = totalHeight * scale
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Não foi possível obter o contexto 2D do canvas.')
  }

  ctx.scale(scale, scale)

  // 1. Background fill
  ctx.fillStyle = '#F8F9FD'
  ctx.fillRect(0, 0, width, totalHeight)

  // 2. Header Gradient Banner (Brand Purple: #7B2FF7 -> #5F1AC9)
  const headerGrad = ctx.createLinearGradient(0, 0, width, headerHeight)
  headerGrad.addColorStop(0, '#7B2FF7')
  headerGrad.addColorStop(0.7, '#6A23E0')
  headerGrad.addColorStop(1, '#4E12B8')
  ctx.fillStyle = headerGrad
  ctx.fillRect(0, 0, width, headerHeight - 30)

  // Decorative top circle
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'
  ctx.beginPath()
  ctx.arc(width - 40, 20, 140, 0, Math.PI * 2)
  ctx.fill()

  // App Logo & Brand Badge
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 20px system-ui, -apple-system, sans-serif'
  ctx.fillText('⚡ Racha.AI', 40, 48)

  ctx.fillStyle = '#E9D5FF'
  ctx.font = '500 13px system-ui, -apple-system, sans-serif'
  ctx.fillText('Comprovante de Fechamento de Contas', 160, 48)

  // Recurring / Category pill
  const categoryPill = racha.isRecurring
    ? `🏠 República • ${racha.referenceMonth || 'Mensal'}`
    : `🏷️ ${racha.category || 'Racha Geral'}`

  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
  ctx.beginPath()
  ctx.roundRect(width - 240, 30, 200, 28, 14)
  ctx.fill()

  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 12px system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(categoryPill, width - 140, 49)
  ctx.textAlign = 'left'

  // Racha Title
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 26px system-ui, -apple-system, sans-serif'
  const title = racha.name.length > 40 ? racha.name.substring(0, 37) + '...' : racha.name
  ctx.fillText(title, 40, 105)

  // Subtitle / Date
  const dateStr = new Date(racha.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
  ctx.fillStyle = '#DDD6FE'
  ctx.font = '14px system-ui, -apple-system, sans-serif'
  ctx.fillText(
    `Gerado em ${dateStr} • Código: #${racha.shareCode || racha.id.slice(0, 8)}`,
    40,
    135,
  )

  // 3. Stats Card Floating on Header
  const total = racha.totalAmount
  const paidParts = racha.participants.filter((p) => p.paid)
  const pendingParts = racha.participants.filter((p) => !p.paid)
  const paidAmount = paidParts.reduce((acc, curr) => acc + curr.amount, 0)
  const pendingAmount = Math.max(0, total - paidAmount)
  const percent = total > 0 ? Math.min(100, Math.round((paidAmount / total) * 100)) : 0

  const cardY = 160
  const cardW = width - 80
  const cardH = 100

  // Card background with soft shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.08)'
  ctx.shadowBlur = 16
  ctx.shadowOffsetY = 6
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.roundRect(40, cardY, cardW, cardH, 18)
  ctx.fill()
  ctx.shadowColor = 'transparent' // Reset shadow

  // Card 3 columns
  const colW = cardW / 3

  // Col 1: Meta Total
  ctx.fillStyle = '#64748B'
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif'
  ctx.fillText('META TOTAL', 60, cardY + 34)
  ctx.fillStyle = '#0F172A'
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif'
  ctx.fillText(formatCurrencyBRL(total), 60, cardY + 66)
  ctx.fillStyle = '#64748B'
  ctx.font = '12px system-ui, -apple-system, sans-serif'
  ctx.fillText(`${racha.participants.length} participantes`, 60, cardY + 85)

  // Divider 1
  ctx.strokeStyle = '#E2E8F0'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(40 + colW, cardY + 20)
  ctx.lineTo(40 + colW, cardY + cardH - 20)
  ctx.stroke()

  // Col 2: Total Arrecadado
  ctx.fillStyle = '#16A34A'
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif'
  ctx.fillText('ARRECADADO', 40 + colW + 20, cardY + 34)
  ctx.fillStyle = '#15803D'
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif'
  ctx.fillText(formatCurrencyBRL(paidAmount), 40 + colW + 20, cardY + 66)
  ctx.fillStyle = '#16A34A'
  ctx.font = '12px system-ui, -apple-system, sans-serif'
  ctx.fillText(`✅ ${paidParts.length} pagos (${percent}%)`, 40 + colW + 20, cardY + 85)

  // Divider 2
  ctx.beginPath()
  ctx.moveTo(40 + colW * 2, cardY + 20)
  ctx.lineTo(40 + colW * 2, cardY + cardH - 20)
  ctx.stroke()

  // Col 3: Pendente
  ctx.fillStyle = '#D97706'
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif'
  ctx.fillText('PENDENTE', 40 + colW * 2 + 20, cardY + 34)
  ctx.fillStyle = pendingAmount > 0 ? '#B45309' : '#15803D'
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif'
  ctx.fillText(formatCurrencyBRL(pendingAmount), 40 + colW * 2 + 20, cardY + 66)
  ctx.fillStyle = '#B45309'
  ctx.font = '12px system-ui, -apple-system, sans-serif'
  ctx.fillText(
    pendingAmount > 0 ? `⏳ ${pendingParts.length} pendentes` : '🎉 100% quitado!',
    40 + colW * 2 + 20,
    cardY + 85,
  )

  // 4. Participants Table
  const tableY = cardY + cardH + 30
  ctx.fillStyle = '#0F172A'
  ctx.font = 'bold 16px system-ui, -apple-system, sans-serif'
  ctx.fillText('Detalhamento dos Participantes', 40, tableY)

  ctx.fillStyle = '#64748B'
  ctx.font = '12px system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText(
    `${paidParts.length} de ${racha.participants.length} partes confirmadas`,
    width - 40,
    tableY,
  )
  ctx.textAlign = 'left'

  // Table Container Card
  const tableCardY = tableY + 14
  const tableCardH = racha.participants.length * participantItemHeight + 20
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.roundRect(40, tableCardY, cardW, tableCardH, 16)
  ctx.fill()
  ctx.strokeStyle = '#E2E8F0'
  ctx.lineWidth = 1
  ctx.stroke()

  // Draw each participant row
  racha.participants.forEach((p, idx) => {
    const rowY = tableCardY + 16 + idx * participantItemHeight
    const isEven = idx % 2 === 0

    // Alternating subtle row bg
    if (isEven) {
      ctx.fillStyle = '#F8FAFC'
      ctx.beginPath()
      ctx.roundRect(48, rowY - 6, cardW - 16, participantItemHeight - 4, 8)
      ctx.fill()
    }

    // Status icon badge
    if (p.paid) {
      ctx.fillStyle = '#DCFCE7'
      ctx.beginPath()
      ctx.arc(68, rowY + 12, 11, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#15803D'
      ctx.font = 'bold 12px system-ui, -apple-system, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('✓', 68, rowY + 16)
      ctx.textAlign = 'left'
    } else {
      ctx.fillStyle = '#FEF3C7'
      ctx.beginPath()
      ctx.arc(68, rowY + 12, 11, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#B45309'
      ctx.font = 'bold 12px system-ui, -apple-system, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('•', 68, rowY + 16)
      ctx.textAlign = 'left'
    }

    // Name
    ctx.fillStyle = '#0F172A'
    ctx.font = 'bold 14px system-ui, -apple-system, sans-serif'
    const nameWidth = ctx.measureText(p.name).width
    ctx.fillText(p.name, 92, rowY + 16)

    // Badge de perfil verificado
    if (p.isVerified) {
      const badgeX = 92 + nameWidth + 8
      ctx.fillStyle = '#DCFCE7'
      ctx.beginPath()
      ctx.roundRect(badgeX, rowY + 4, 76, 16, 8)
      ctx.fill()
      ctx.fillStyle = '#15803D'
      ctx.font = 'bold 9px system-ui, -apple-system, sans-serif'
      ctx.fillText('✓ VERIFICADO', badgeX + 7, rowY + 15)
    }

    // Paid details / status label
    ctx.font = '11px system-ui, -apple-system, sans-serif'
    if (p.paid) {
      ctx.fillStyle = '#15803D'
      const statusText = p.isVerified
        ? p.paidAt
          ? `Pago (${p.paidAt}) • Conta Verificada`
          : 'Confirmado • Conta Verificada'
        : p.paidAt
          ? `Pago (${p.paidAt})`
          : 'Confirmado'
      ctx.fillText(statusText, 310, rowY + 16)
    } else {
      ctx.fillStyle = '#B45309'
      ctx.fillText('Aguardando pagamento', 310, rowY + 16)
    }

    // Amount
    ctx.textAlign = 'right'
    ctx.fillStyle = p.paid ? '#15803D' : '#0F172A'
    ctx.font = 'bold 14px system-ui, -apple-system, sans-serif'
    ctx.fillText(formatCurrencyBRL(p.amount), width - 60, rowY + 16)
    ctx.textAlign = 'left'
  })

  // 5. Footer with Branding and Verification Badge
  const footerY = tableCardY + tableCardH + 35
  ctx.strokeStyle = '#E2E8F0'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(40, footerY)
  ctx.lineTo(width - 40, footerY)
  ctx.stroke()

  ctx.fillStyle = '#64748B'
  ctx.font = '12px system-ui, -apple-system, sans-serif'
  ctx.fillText(
    'Racha.AI • Gestão inteligente e transparente de contas e repúblicas universitárias',
    40,
    footerY + 28,
  )

  ctx.font = '11px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#94A3B8'
  ctx.fillText('Documento gerado automaticamente para prestação de contas.', 40, footerY + 46)

  // Brand Stamp Badge
  ctx.fillStyle = '#7B2FF7'
  ctx.beginPath()
  ctx.roundRect(width - 180, footerY + 14, 140, 32, 16)
  ctx.fill()

  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('✓ Racha.AI Verificado', width - 110, footerY + 34)
  ctx.textAlign = 'left'

  return canvas.toDataURL('image/png')
}

/**
 * Downloads dataUrl as a file directly in the browser (supports desktop & mobile)
 */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Generates and triggers download of PNG summary
 */
export async function exportRachaSummary(racha: Racha): Promise<string> {
  const dataUrl = await generateRachaSummaryImage(racha)
  const safeName = racha.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 30)

  const filename = `resumo-${safeName}-${new Date().toISOString().slice(0, 10)}.png`
  downloadDataUrl(dataUrl, filename)
  return dataUrl
}
