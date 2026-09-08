import React, { useState } from 'react'
import { Racha, formatCurrencyBRL } from '@/types/racha'
import { askGeminiAboutRacha } from '@/services/geminiService'
import { Button } from '@/components/ui/button'
import { Sparkles, X, Send, AlertCircle, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface GeminiAssistantPanelProps {
  racha: Racha
  isOpen: boolean
  onClose: () => void
  onApplyChange: (newCount: number, newTotal: number) => void
}

interface MiniMessage {
  id: string
  sender: 'user' | 'gemini'
  text: string
  action?: {
    type: 'add_people'
    count: number
    newPerPerson: number
  }
}

export const GeminiAssistantPanel: React.FC<GeminiAssistantPanelProps> = ({
  racha,
  isOpen,
  onClose,
  onApplyChange,
}) => {
  const [messages, setMessages] = useState<MiniMessage[]>([
    {
      id: 'init',
      sender: 'gemini',
      text: `Olá! Sou o Gemini. Estou conectado aos dados do racha "${racha.name}". O que você gostaria de saber ou simular?`,
    },
  ])
  const [inputVal, setInputVal] = useState('')
  const [isAsking, setIsAsking] = useState(false)

  if (!isOpen) return null

  const handleAsk = async (query: string) => {
    const q = query.trim()
    if (!q || isAsking) return

    const userMsg: MiniMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: q,
    }

    setMessages((prev) => [...prev, userMsg])
    setInputVal('')
    setIsAsking(true)

    try {
      const result = await askGeminiAboutRacha(q, racha)
      setMessages((prev) => [
        ...prev,
        {
          id: `g-${Date.now()}`,
          sender: 'gemini',
          text: result.text,
          action: result.action,
        },
      ])
    } catch (err) {
      console.error('Erro ao consultar Gemini:', err)
      setMessages((prev) => [
        ...prev,
        {
          id: `g-${Date.now()}`,
          sender: 'gemini',
          text: `Não consegui processar a resposta agora, mas o racha tem meta de ${formatCurrencyBRL(
            racha.totalAmount,
          )}.`,
        },
      ])
    } finally {
      setIsAsking(false)
    }
  }

  const handleApplyAction = (action: NonNullable<MiniMessage['action']>) => {
    onApplyChange(action.count, racha.totalAmount)
    toast.success('Racha recalculado com sucesso!')
    setMessages((prev) => [
      ...prev,
      {
        id: `g-${Date.now()}`,
        sender: 'gemini',
        text: `Alteração aplicada! O racha agora está distribuído para ${action.count} participantes a ${formatCurrencyBRL(action.newPerPerson)} cada.`,
      },
    ])
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4 animate-fade-in">
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl border border-border shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[620px] overflow-hidden animate-slide-up sm:animate-fade-in-up">
        {/* Panel Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-purple-50/50 via-white to-amber-50/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#7B2FF7] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-1.5">
                Perguntar ao Gemini
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Assistente contextual em tempo real
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Disclaimer header */}
        <div className="px-4 py-2 bg-amber-50/80 border-b border-amber-200/60 text-[11px] text-amber-900 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>
            O Gemini não executa pagamentos. Alterações importantes requerem sua confirmação.
          </span>
        </div>

        {/* Suggested question chips */}
        <div className="p-3 bg-[#F7F7FB] border-b border-border flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => handleAsk('Quem ainda não pagou?')}
            className="text-xs bg-white border border-border px-3 py-1 rounded-full hover:border-[#7B2FF7] hover:text-[#7B2FF7] font-medium shrink-0 transition-colors"
          >
            Quem ainda não pagou?
          </button>
          <button
            onClick={() => handleAsk('Quanto falta?')}
            className="text-xs bg-white border border-border px-3 py-1 rounded-full hover:border-[#7B2FF7] hover:text-[#7B2FF7] font-medium shrink-0 transition-colors"
          >
            Quanto falta?
          </button>
          <button
            onClick={() => handleAsk('Se adicionarmos mais duas pessoas, quanto fica para cada?')}
            className="text-xs bg-white border border-border px-3 py-1 rounded-full hover:border-[#7B2FF7] hover:text-[#7B2FF7] font-medium shrink-0 transition-colors"
          >
            +2 pessoas?
          </button>
          <button
            onClick={() => handleAsk('Faça um resumo do racha.')}
            className="text-xs bg-white border border-border px-3 py-1 rounded-full hover:border-[#7B2FF7] hover:text-[#7B2FF7] font-medium shrink-0 transition-colors"
          >
            Resumo geral
          </button>
        </div>

        {/* Chat message list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs sm:text-sm">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 ${
                  m.sender === 'user'
                    ? 'bg-[#7B2FF7] text-white rounded-tr-xs'
                    : 'bg-[#F7F7FB] border border-border text-foreground rounded-tl-xs space-y-2'
                }`}
              >
                <p className="leading-relaxed">{m.text}</p>

                {/* Optional confirmation button for simulations */}
                {m.action && (
                  <div className="pt-2 border-t border-border/80">
                    <Button
                      onClick={() => handleApplyAction(m.action!)}
                      size="sm"
                      className="w-full bg-[#7B2FF7] hover:bg-[#6A23E0] text-white text-xs font-semibold rounded-lg h-8 shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirmar alteração</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Chat input */}
        <div className="p-3 bg-white border-t border-border">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleAsk(inputVal)
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputVal}
              disabled={isAsking}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder={isAsking ? 'Gemini analisando...' : 'Pergunte ao Gemini...'}
              className="flex-1 h-10 px-3.5 rounded-xl bg-[#F7F7FB] border border-border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#7B2FF7] text-foreground disabled:opacity-50"
            />
            <Button
              type="submit"
              disabled={!inputVal.trim() || isAsking}
              className="h-10 w-10 p-0 rounded-xl bg-[#7B2FF7] hover:bg-[#6A23E0] text-white flex items-center justify-center shrink-0 disabled:opacity-40"
            >
              {isAsking ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>{' '}
          </form>
        </div>
      </div>
    </div>
  )
}
