import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sparkles, ArrowLeft, Mail, AlertCircle, CheckCircle2, Info } from 'lucide-react'

export default function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsLoading(true)
    setResult(null)
    try {
      const res = await sendPasswordReset(email.trim())
      setResult(res)
    } catch {
      setResult({
        success: false,
        message: 'Ocorreu um erro ao processar sua solicitação. Tente novamente.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center px-4 py-8 bg-[#FAF9FF]">
      <div className="w-full max-w-md space-y-6">
        {/* Header & Logo */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 group mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#7B2FF7] to-[#9D5BFF] flex items-center justify-center text-white shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div className="flex items-baseline">
              <span className="font-extrabold text-2xl tracking-tight text-foreground">Racha</span>
              <span className="font-extrabold text-2xl tracking-tight text-[#7B2FF7] ml-0.5">
                .AI
              </span>
            </div>
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Recuperar senha
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Digite seu e-mail para receber as instruções de recuperação de senha
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-border p-6 shadow-elevation space-y-5">
          {result && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                result.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              {result.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{result.message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-xs font-bold uppercase tracking-wider text-foreground"
              >
                E-mail da sua conta
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                placeholder="seu.email@faculdade.edu.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-xl text-sm border-border bg-[#F7F7FB] focus:bg-white"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="w-full h-11 bg-[#7B2FF7] hover:bg-[#6A23E0] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4" />
              {isLoading ? 'Enviando instruções...' : 'Enviar link de recuperação'}
            </Button>
          </form>

          <div className="pt-2 text-center text-xs text-muted-foreground border-t border-border/80">
            <Link
              to="/login"
              className="inline-flex items-center gap-1 font-bold text-[#7B2FF7] hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
