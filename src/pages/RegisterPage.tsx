import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useRacha } from '@/context/RachaContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sparkles,
  Eye,
  EyeOff,
  ShieldCheck,
  PlayCircle,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register, setDemoMode } = useAuth()
  const { currentNickname, setCurrentNickname, syncLocalStorageRachasToUser } = useRacha()

  const [name, setName] = useState(currentNickname || '')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    if (!email.trim() || !password || !passwordConfirm) {
      setErrorMessage('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    if (password.length < 8) {
      setErrorMessage('A senha deve ter no mínimo 8 caracteres.')
      return
    }

    if (password !== passwordConfirm) {
      setErrorMessage('As senhas digitadas não coincidem.')
      return
    }

    setIsLoading(true)
    try {
      const user = await register({
        email: email.trim(),
        name: name.trim() || email.split('@')[0],
        password,
        passwordConfirm,
      })

      // Set nickname as user name
      if (user.name) {
        setCurrentNickname(user.name)
      }

      toast.success(`Conta criada com sucesso! Seja bem-vindo(a), ${user.name}! 🎉`)

      // Adopt any anonymously created rachas
      if (syncLocalStorageRachasToUser) {
        const adoptedCount = await syncLocalStorageRachasToUser(user.id)
        if (adoptedCount > 0) {
          toast.info(
            `${adoptedCount} racha(s) criado(s) anteriormente foram vinculados à sua conta!`,
          )
        }
      }

      navigate('/dashboard')
    } catch (err: any) {
      console.error('Erro no cadastro:', err)
      const data = err?.data?.data || {}
      if (data.email?.code === 'validation_not_unique' || err?.message?.includes('unique')) {
        setErrorMessage('Este e-mail já está em uso. Tente fazer login ou redefinir a senha.')
      } else if (data.password?.message) {
        setErrorMessage(`Senha inválida: ${data.password.message}`)
      } else {
        setErrorMessage(
          'Não foi possível concluir o cadastro. Verifique os dados e tente novamente.',
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleContinueAsDemo = () => {
    setDemoMode(true)
    toast.info('Entrando no modo demonstração.')
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
            Criar conta gratuita
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Salve seus rachas na nuvem, convide a galera e acompanhe pagamentos em tempo real
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
                htmlFor="name"
                className="text-xs font-bold uppercase tracking-wider text-foreground"
              >
                Seu nome ou apelido
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Ex.: Lucas, Bia da Rep, Rodrigo..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 rounded-xl text-sm border-border bg-[#F7F7FB] focus:bg-white"
              />
              <span className="text-[11px] text-muted-foreground">
                Como os amigos vão te identificar nos rachas.
              </span>
            </div>

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
              <Label
                htmlFor="password"
                className="text-xs font-bold uppercase tracking-wider text-foreground"
              >
                Senha (mínimo 8 caracteres)
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  placeholder="Mínimo 8 dígitos"
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

            <div className="space-y-1.5">
              <Label
                htmlFor="passwordConfirm"
                className="text-xs font-bold uppercase tracking-wider text-foreground"
              >
                Confirmar senha
              </Label>
              <Input
                id="passwordConfirm"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                placeholder="Repita a mesma senha"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="h-11 rounded-xl text-sm border-border bg-[#F7F7FB] focus:bg-white"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-[#7B2FF7] hover:bg-[#6A23E0] text-white font-bold rounded-xl shadow-md transition-all mt-2"
            >
              {isLoading ? 'Criando conta...' : 'Criar minha conta'}
            </Button>
          </form>

          <div className="pt-2 text-center text-xs text-muted-foreground border-t border-border/80">
            Já possui uma conta?{' '}
            <Link to="/login" className="font-bold text-[#7B2FF7] hover:underline">
              Fazer login
            </Link>
          </div>
        </div>

        {/* Demo Mode Alternative */}
        <div className="bg-white/70 border border-purple-200/80 rounded-2xl p-4 text-center space-y-2 shadow-subtle">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#7B2FF7]">
            <PlayCircle className="w-4 h-4" />
            <span>Apenas conhecendo o app?</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Você pode experimentar tudo no modo de demonstração sem compromisso.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={handleContinueAsDemo}
            className="w-full h-10 border-purple-300 text-[#7B2FF7] hover:bg-purple-50 text-xs font-bold rounded-xl"
          >
            Continuar como visitante (Demo)
          </Button>
        </div>
      </div>
    </div>
  )
}
