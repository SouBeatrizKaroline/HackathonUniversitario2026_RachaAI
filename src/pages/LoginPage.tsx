import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useRacha } from '@/context/RachaContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  PlayCircle,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, setDemoMode } = useAuth()
  const { syncLocalStorageRachasToUser } = useRacha()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    if (!email || !password) {
      setErrorMessage('Por favor, preencha todos os campos.')
      return
    }

    setIsLoading(true)
    try {
      const user = await login({ email, password })
      toast.success(`Bem-vindo(a) de volta, ${user.name}! 👋`)

      // Check if user has local rachas created anonymously to adopt
      if (syncLocalStorageRachasToUser) {
        const adoptedCount = await syncLocalStorageRachasToUser(user.id)
        if (adoptedCount > 0) {
          toast.info(
            `${adoptedCount} racha(s) criado(s) anteriormente foram vinculados à sua conta!`,
          )
        }
      }

      navigate(from, { replace: true })
    } catch (err: any) {
      console.error('Erro no login:', err)
      const msg = err?.data?.message || err?.message || ''
      if (msg.includes('Failed to authenticate') || err?.status === 400) {
        setErrorMessage('E-mail ou senha incorretos. Verifique suas credenciais.')
      } else {
        setErrorMessage('Erro ao conectar ao servidor. Tente novamente em instantes.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleContinueAsDemo = () => {
    setDemoMode(true)
    toast.info('Entrando no modo de demonstração. Você pode navegar livremente!')
    navigate('/dashboard')
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
            Acesse sua conta
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Entre para salvar seus rachas na nuvem com segurança
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white rounded-2xl border border-border p-6 shadow-elevation space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-xs font-bold uppercase tracking-wider text-foreground"
              >
                E-mail
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

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="text-xs font-bold uppercase tracking-wider text-foreground"
                >
                  Senha
                </Label>
                <Link
                  to="/esqueci-senha"
                  className="text-xs font-semibold text-[#7B2FF7] hover:underline"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pr-10 rounded-xl text-sm border-border bg-[#F7F7FB] focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-[#7B2FF7] hover:bg-[#6A23E0] text-white font-bold rounded-xl shadow-md transition-all mt-2"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <div className="pt-2 text-center text-xs text-muted-foreground border-t border-border/80">
            Ainda não tem conta?{' '}
            <Link to="/cadastro" className="font-bold text-[#7B2FF7] hover:underline">
              Cadastre-se grátis
            </Link>
          </div>
        </div>

        {/* Demo Mode Alternative */}
        <div className="bg-white/70 border border-purple-200/80 rounded-2xl p-4 text-center space-y-2 shadow-subtle">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#7B2FF7]">
            <PlayCircle className="w-4 h-4" />
            <span>Quer apenas testar ou ver como funciona?</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Você pode explorar a demonstração interativa sem cadastrar e-mail ou senha.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={handleContinueAsDemo}
            className="w-full h-10 border-purple-300 text-[#7B2FF7] hover:bg-purple-50 text-xs font-bold rounded-xl"
          >
            Continuar no Modo Demonstração
          </Button>
        </div>
      </div>
    </div>
  )
}
