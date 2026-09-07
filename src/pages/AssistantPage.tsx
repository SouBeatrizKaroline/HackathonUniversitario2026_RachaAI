import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useRacha } from '@/context/RachaContext'
import { parseNaturalLanguageRacha } from '@/lib/geminiParser'
import { InterpretedRachaData, formatCurrencyBRL, CATEGORIES } from '@/types/racha'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Send,
  Sparkles,
  Edit2,
  Check,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Users,
} from 'lucide-react'

interface Message {
  id: string
  sender: 'user' | 'assistant'
  text: string
  data?: InterpretedRachaData
  showActionCard?: boolean
}

const INITIAL_ASSISTANT_TEXT =
  'Oi! 👋 Sou o assistente do Racha.AI. Me conta o que vocês precisam dividir — participantes, valores, quem já pagou... Eu organizo tudo.'

const QUICK_CHIPS = [
  {
    label: 'República',
    text: 'Somos 4 pessoas da república e precisamos dividir o aluguel e as contas de R$ 1.600.',
  },
  { label: 'Comida', text: 'Pedimos uma pizza e lanches de R$ 150 para 5 amigos.' },
  { label: 'Viagem', text: 'Somos 6 pessoas e precisamos dividir R$ 480 da viagem da turma.' },
  {
    label: 'Faculdade',
    text: 'Precisamos arrecadar R$ 360 para materiais da formatura entre 4 alunos.',
  },
  { label: 'Evento', text: 'Compramos bebidas da festa por R$ 600 para 6 pessoas.' },
]

export default function AssistantPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentNickname } = useRacha()

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-init',
      sender: 'assistant',
      text: INITIAL_ASSISTANT_TEXT,
    },
  ])

  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [currentExtracted, setCurrentExtracted] = useState<InterpretedRachaData | undefined>(
    undefined,
  )

  // Inline edit form state
  const [editingData, setEditingData] = useState<InterpretedRachaData | null>(null)
  const [isEditingInline, setIsEditingInline] = useState(false)

  const chatEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping, isEditingInline])

  // Handle prompt passed from Dashboard
  useEffect(() => {
    const state = location.state as { initialPrompt?: string } | null
    if (state?.initialPrompt) {
      handleUserSubmit(state.initialPrompt)
      // clear location state so back navigation doesn't re-trigger
      window.history.replaceState({}, document.title)
    }
  }, [])

  const handleUserSubmit = (userText: string) => {
    const text = userText.trim()
    if (!text) return

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
    }

    setMessages((prev) => [...prev, userMsg])
    setInputText('')
    setIsTyping(true)

    // Simulate Gemini ~800ms
    setTimeout(() => {
      const { data, assistantMessage } = parseNaturalLanguageRacha(text, currentExtracted)
      setCurrentExtracted(data)

      const botMsg: Message = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: assistantMessage,
        data,
        showActionCard: true,
      }

      setIsTyping(false)
      setMessages((prev) => [...prev, botMsg])
    }, 850)
  }

  const handleCreateRachaFromData = (data: InterpretedRachaData) => {
    navigate('/racha/novo', { state: { prefilled: data } })
  }

  const handleStartInlineEdit = (data: InterpretedRachaData) => {
    setEditingData(JSON.parse(JSON.stringify(data)))
    setIsEditingInline(true)
  }

  const handleSaveInlineEdit = () => {
    if (!editingData) return
    setCurrentExtracted(editingData)
    setIsEditingInline(false)

    const botUpdateMsg: Message = {
      id: `a-${Date.now()}`,
      sender: 'assistant',
      text: `Dados atualizados com sucesso! Total de ${formatCurrencyBRL(
        editingData.totalAmount,
      )} para ${editingData.participants.length} participantes.`,
      data: editingData,
      showActionCard: true,
    }
    setMessages((prev) => [...prev, botUpdateMsg])
  }

  return (
    <div className="max-w-3xl mx-auto px-4 h-[calc(100vh-4rem)] flex flex-col">
      {/* Top Header */}
      <div className="flex items-center justify-between py-2 border-b border-border/80 mb-2">
        <div className="flex items-center gap-2">
          <Link
            to="/dashboard"
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#7B2FF7]" />
              Assistente Gemini
            </h1>
            <p className="text-[11px] text-muted-foreground">
              Inteligência simulada em Português (pt-BR)
            </p>
          </div>
        </div>

        <Link
          to="/racha/novo"
          className="text-xs font-semibold text-muted-foreground hover:text-[#7B2FF7] transition-colors"
        >
          Pular para manual
        </Link>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto pr-1 py-3 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className="space-y-2">
            {msg.sender === 'user' ? (
              /* User Bubble */
              <div className="flex justify-end">
                <div className="max-w-[85%] sm:max-w-[75%] bg-[#7B2FF7] text-white rounded-2xl rounded-tr-xs p-3.5 shadow-sm text-sm sm:text-base leading-relaxed">
                  {msg.text}
                </div>
              </div>
            ) : (
              /* Assistant Bubble */
              <div className="flex justify-start">
                <div className="max-w-[90%] sm:max-w-[85%] space-y-3">
                  <div className="bg-white border border-border text-foreground rounded-2xl rounded-tl-xs p-4 shadow-subtle text-sm sm:text-base leading-relaxed">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#7B2FF7] mb-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Racha.AI • Gemini</span>
                    </div>
                    <p className="text-foreground/90">{msg.text}</p>
                  </div>

                  {/* Structured Preview Card with Action Buttons */}
                  {msg.showActionCard && msg.data && (
                    <div className="bg-[#FAF9FF] border border-purple-200/80 rounded-2xl p-4 shadow-elevation space-y-3 animate-fade-in-up">
                      <div className="flex items-center justify-between pb-2 border-b border-border/70">
                        <span className="text-xs font-bold text-foreground">Resumo Extraído</span>
                        <Badge className="bg-purple-100 text-[#7B2FF7] hover:bg-purple-100 text-[10px]">
                          {msg.data.category}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-white p-2.5 rounded-xl border border-border">
                          <span className="text-muted-foreground block text-[11px]">Objetivo:</span>
                          <span className="font-bold text-foreground">{msg.data.name}</span>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-border">
                          <span className="text-muted-foreground block text-[11px]">Total:</span>
                          <span className="font-bold text-foreground tabular-nums">
                            {formatCurrencyBRL(msg.data.totalAmount)}
                          </span>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-border">
                          <span className="text-muted-foreground block text-[11px]">
                            Participantes:
                          </span>
                          <span className="font-bold text-foreground">
                            {msg.data.participantCount} pessoas
                          </span>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-border">
                          <span className="text-muted-foreground block text-[11px]">
                            Por pessoa:
                          </span>
                          <span className="font-bold text-[#7B2FF7] tabular-nums">
                            {formatCurrencyBRL(msg.data.perPersonAmount)}
                          </span>
                        </div>
                      </div>

                      {/* Participant chips */}
                      <div className="pt-1">
                        <span className="text-[11px] font-semibold text-muted-foreground block mb-1.5">
                          Participantes identificados:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.data.participants.map((p, i) => (
                            <span
                              key={i}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                                p.paid
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-white text-foreground border-border'
                              }`}
                            >
                              <span>{p.name}</span>
                              <span className="text-muted-foreground tabular-nums text-[11px]">
                                ({formatCurrencyBRL(p.amount)})
                              </span>
                              {p.paid && <Check className="w-3 h-3 text-emerald-600" />}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Buttons: Criar racha / Editar informações */}
                      <div className="pt-2 flex flex-col sm:flex-row gap-2">
                        <Button
                          onClick={() => handleCreateRachaFromData(msg.data!)}
                          className="flex-1 h-11 bg-[#7B2FF7] hover:bg-[#6A23E0] text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                        >
                          <Sparkles className="w-4 h-4 text-amber-300" />
                          <span>Criar racha</span>
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => handleStartInlineEdit(msg.data!)}
                          className="h-11 px-4 border-border hover:bg-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Editar informações</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-border rounded-2xl rounded-tl-xs p-3.5 shadow-subtle flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#7B2FF7] animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-[#7B2FF7] animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-[#7B2FF7] animate-bounce [animation-delay:0.4s]" />
              <span className="text-xs text-muted-foreground ml-1.5 font-medium">
                Gemini pensando...
              </span>
            </div>
          </div>
        )}

        {/* Inline Edit Form */}
        {isEditingInline && editingData && (
          <div className="bg-white rounded-2xl border-2 border-[#7B2FF7] p-4 shadow-xl space-y-3 animate-fade-in-up">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#7B2FF7]">
                Ajustar dados extraídos
              </h4>
              <button
                onClick={() => setIsEditingInline(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Cancelar
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="font-semibold block mb-1">Nome do racha:</label>
                <Input
                  value={editingData.name || ''}
                  onChange={(e) => setEditingData({ ...editingData, name: e.target.value })}
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Total (R$):</label>
                  <Input
                    type="number"
                    value={editingData.totalAmount || ''}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      const count = editingData.participants.length || 1
                      const perPerson = Math.round((val / count) * 100) / 100
                      setEditingData({
                        ...editingData,
                        totalAmount: val,
                        perPersonAmount: perPerson,
                        participants: editingData.participants.map((p) => ({
                          ...p,
                          amount: perPerson,
                        })),
                      })
                    }}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Categoria:</label>
                  <select
                    value={editingData.category}
                    onChange={(e) =>
                      setEditingData({
                        ...editingData,
                        category: e.target.value as any,
                      })
                    }
                    className="w-full h-9 px-2 text-xs rounded-xl border border-border bg-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.label} value={c.label}>
                        {c.emoji} {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Edit participants */}
              <div>
                <label className="font-semibold block mb-1">Participantes:</label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {editingData.participants.map((p, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        value={p.name}
                        onChange={(e) => {
                          const updated = [...editingData.participants]
                          updated[idx].name = e.target.value
                          setEditingData({ ...editingData, participants: updated })
                        }}
                        className="h-8 text-xs rounded-lg flex-1"
                        placeholder="Nome"
                      />
                      <Input
                        type="number"
                        value={p.amount}
                        onChange={(e) => {
                          const updated = [...editingData.participants]
                          updated[idx].amount = Number(e.target.value)
                          setEditingData({ ...editingData, participants: updated })
                        }}
                        className="h-8 text-xs rounded-lg w-24"
                        placeholder="Valor"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = editingData.participants.filter((_, i) => i !== idx)
                          setEditingData({
                            ...editingData,
                            participants: updated,
                            participantCount: updated.length,
                          })
                        }}
                        className="p-1.5 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const avg = editingData.totalAmount / (editingData.participants.length + 1)
                    setEditingData({
                      ...editingData,
                      participants: [
                        ...editingData.participants,
                        {
                          name: `Pessoa ${editingData.participants.length + 1}`,
                          amount: Math.round(avg * 100) / 100,
                          paid: false,
                        },
                      ],
                      participantCount: editingData.participants.length + 1,
                    })
                  }}
                  className="mt-2 w-full h-8 text-xs rounded-lg border-dashed"
                >
                  <Plus className="w-3 h-3 mr-1" /> Adicionar participante
                </Button>
              </div>
            </div>

            <Button
              onClick={handleSaveInlineEdit}
              className="w-full h-10 bg-[#7B2FF7] hover:bg-[#6A23E0] text-white text-xs font-semibold rounded-xl"
            >
              Salvar alterações
            </Button>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Quick suggestions when conversation has only initial prompt */}
      {messages.length <= 1 && (
        <div className="py-2 overflow-x-auto scrollbar-none flex items-center gap-1.5">
          {QUICK_CHIPS.map((chip) => (
            <button
              key={chip.label}
              onClick={() => handleUserSubmit(chip.text)}
              className="text-xs bg-white border border-border px-3 py-1.5 rounded-full hover:border-[#7B2FF7] hover:text-[#7B2FF7] shrink-0 font-medium transition-colors"
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* Fixed bottom input */}
      <div className="py-2 sm:py-3 bg-white/95 backdrop-blur-md border-t border-border mt-auto">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleUserSubmit(inputText)
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Descreva seu racha..."
            className="flex-1 h-12 px-4 rounded-xl bg-[#F7F7FB] border border-border focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7B2FF7] text-sm text-foreground transition-all"
          />

          <Button
            type="submit"
            disabled={!inputText.trim() || isTyping}
            className="w-12 h-12 p-0 rounded-xl bg-[#7B2FF7] hover:bg-[#6A23E0] text-white flex items-center justify-center shrink-0 shadow-md transition-all disabled:opacity-50"
            aria-label="Enviar mensagem"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  )
}
