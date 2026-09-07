import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRacha } from '@/context/RachaContext'
import {
  Sparkles,
  Zap,
  Search,
  QrCode,
  Shield,
  MessageSquare,
  Layers,
  ArrowRight,
  ChevronDown,
  CheckCircle2,
  Users,
} from 'lucide-react'

export default function Index() {
  const navigate = useNavigate()
  const { setIsWhySolanaModalOpen } = useRacha()

  const scrollToHow = () => {
    const el = document.getElementById('como-funciona')
    el?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-white text-foreground flex flex-col selection:bg-purple-100 selection:text-[#7B2FF7]">
      {/* Top Simple Landing Header */}
      <header className="w-full max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#7B2FF7] to-[#9D5BFF] flex items-center justify-center text-white shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <div className="flex items-baseline">
            <span className="font-extrabold text-xl tracking-tight text-foreground">Racha</span>
            <span className="font-extrabold text-xl tracking-tight text-[#7B2FF7] ml-0.5">.AI</span>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => setIsWhySolanaModalOpen(true)}
            className="text-xs sm:text-sm font-semibold text-muted-foreground hover:text-[#7B2FF7] transition-colors px-2 py-1"
          >
            Por que Solana?
          </button>
          <Button
            asChild
            variant="outline"
            className="text-xs sm:text-sm font-semibold rounded-xl border-[#7B2FF7]/30 text-[#7B2FF7] hover:bg-purple-50 h-9"
          >
            <Link to="/dashboard">Entrar no App</Link>
          </Button>
        </div>
      </header>

      {/* 1. HERO SECTION */}
      <section className="relative w-full pt-8 pb-16 sm:pt-16 sm:pb-24 overflow-hidden bg-gradient-to-b from-[#F3F0FF] via-[#FAF9FF] to-white">
        {/* Subtle decorative circles */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[340px] sm:w-[600px] h-[340px] sm:h-[600px] bg-purple-200/35 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center flex flex-col items-center">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-purple-200/70 shadow-xs mb-6 animate-fade-in">
            <span className="text-xs font-semibold text-[#7B2FF7]">
              Para repúblicas, viagens, festas e mais 🎓
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1] mb-4">
            Rachou?
            <br />
            <span className="text-[#7B2FF7]">Deixa com a gente.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-base sm:text-xl font-medium text-foreground/80 max-w-2xl mb-3 leading-relaxed">
            Organize despesas em grupo com IA e acompanhe os pagamentos com transparência.
          </p>

          {/* Complementary text */}
          <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mb-8 leading-relaxed">
            Da pizza da turma à viagem para o congresso: diga o que precisa dividir e o Racha.AI
            organiza o resto.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mb-6">
            <Button
              asChild
              className="w-full sm:w-auto h-12 px-8 bg-[#7B2FF7] hover:bg-[#6A23E0] text-white text-base font-bold rounded-xl shadow-lg shadow-purple-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Link to="/assistente" className="flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-300" />
                Criar um racha
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="w-full sm:w-auto h-12 px-8 bg-white hover:bg-slate-50 text-foreground text-base font-semibold rounded-xl border-border shadow-xs transition-all"
            >
              <Link to="/racha/demo">Ver demonstração</Link>
            </Button>
          </div>

          {/* Powered by row */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium pt-1">
            <span>Powered by</span>
            <div className="inline-flex items-center gap-1 font-semibold text-foreground bg-white/80 px-2.5 py-1 rounded-full border border-border shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#7B2FF7]" />
              <span>Gemini</span>
              <span className="text-muted-foreground/60">+</span>
              <span className="w-2.5 h-2.5 rounded-xs bg-[#7B2FF7] inline-block rotate-45 mr-0.5" />
              <span>Solana</span>
            </div>
          </div>

          {/* Scroll cue */}
          <button
            onClick={scrollToHow}
            className="mt-12 text-muted-foreground/60 hover:text-foreground transition-colors p-2"
            aria-label="Rolar para ver mais"
          >
            <ChevronDown className="w-5 h-5 animate-bounce" />
          </button>
        </div>
      </section>

      {/* 2. COMO FUNCIONA SECTION */}
      <section id="como-funciona" className="py-16 sm:py-24 bg-[#F7F7FB] border-y border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Como funciona
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Três passos simples para nunca mais ter dor de cabeça com dinheiro da turma.
            </p>
          </div>

          {/* 3 Steps Stack / Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Step 1 */}
            <div className="relative bg-white rounded-2xl p-6 border border-border shadow-subtle hover:shadow-elevation transition-all">
              <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-purple-50 text-[#7B2FF7] text-xs font-bold flex items-center justify-center">
                1
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-[#7B2FF7] flex items-center justify-center mb-4 text-xl">
                💬
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">Descreva</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Diga naturalmente o que precisa dividir. O Gemini entende quem participa e quanto
                custa.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative bg-white rounded-2xl p-6 border border-border shadow-subtle hover:shadow-elevation transition-all">
              <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-amber-50 text-amber-600 text-xs font-bold flex items-center justify-center">
                2
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4 text-xl">
                ✨
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">Organize</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Participantes, valores e prazos organizados para você em segundos com divisão igual
                ou personalizada.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative bg-white rounded-2xl p-6 border border-border shadow-subtle hover:shadow-elevation transition-all">
              <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold flex items-center justify-center">
                3
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4 text-xl">
                🔗
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">Pague</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Cada um paga sua parte. Todos acompanham o mesmo status em tempo real com
                comprovantes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. DEMO SECTION (Veja na prática) */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <Badge variant="outline" className="border-purple-200 text-[#7B2FF7] bg-purple-50 mb-2">
              Veja na prática
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              De uma mensagem ao racha pronto
            </h2>
            <p className="text-sm text-muted-foreground mt-1.5">
              Experimente como a inteligência do Gemini decifra áudios ou textos bagunçados da
              galera.
            </p>
          </div>

          {/* Sample Chat Conversation Preview Card */}
          <div className="bg-[#FAF9FF] border border-purple-200/80 rounded-2xl p-5 sm:p-7 shadow-elevation">
            <div className="flex items-center justify-between pb-4 border-b border-border/80 mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#7B2FF7] text-white flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Racha.AI Assistant</h4>
                  <p className="text-[11px] text-muted-foreground">Interpretador Inteligente</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-[11px]">
                Simulação Ativa
              </Badge>
            </div>

            <div className="space-y-4 text-sm">
              {/* User Bubble */}
              <div className="flex justify-end">
                <div className="max-w-[85%] sm:max-w-[75%] bg-[#7B2FF7] text-white rounded-2xl rounded-tr-xs p-3.5 shadow-sm">
                  <p className="leading-relaxed">
                    Somos 6 pessoas e precisamos dividir R$ 480 da viagem da turma.
                  </p>
                </div>
              </div>

              {/* AI Bubble */}
              <div className="flex justify-start">
                <div className="max-w-[85%] sm:max-w-[80%] bg-white border border-border text-foreground rounded-2xl rounded-tl-xs p-4 shadow-subtle space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#7B2FF7]">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Entendi! ✨</span>
                  </div>
                  <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                    Vou criar um racha de <strong>R$ 480,00</strong> para <strong>6 pessoas</strong>
                    . Cada pessoa pagará <strong>R$ 80,00</strong>.
                  </p>

                  {/* Structured Mini Card */}
                  <div className="bg-[#F7F7FB] border border-border rounded-xl p-3 text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Objetivo:</span>
                      <span className="font-semibold text-foreground">✈️ Viagem</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total:</span>
                      <span className="font-bold text-foreground">R$ 480,00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Participantes:</span>
                      <span className="font-semibold text-foreground">6</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-border/60">
                      <span className="text-muted-foreground">Por pessoa:</span>
                      <span className="font-bold text-[#7B2FF7]">R$ 80,00</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action inside preview */}
            <div className="pt-6 mt-4 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground text-center sm:text-left">
                Sem cadastro. Sem configuração. Teste agora.
              </span>
              <Button
                asChild
                className="w-full sm:w-auto bg-[#7B2FF7] hover:bg-[#6A23E0] text-white font-semibold rounded-xl h-10 px-5 shadow-sm"
              >
                <Link to="/racha/demo" className="flex items-center justify-center gap-2">
                  <span>Abrir demonstração</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. POR QUE SOLANA SECTION */}
      <section className="py-16 sm:py-24 bg-[#F7F7FB] border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Por que Solana?
            </h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-xl mx-auto">
              Tecnologia de ponta por baixo dos panos para que o usuário final só veja facilidade.
            </p>
          </div>

          {/* 2x2 Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card 1 */}
            <div className="bg-white rounded-2xl p-5 border border-border shadow-subtle flex flex-col justify-between hover:border-[#7B2FF7]/40 transition-colors">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  ⚡
                </div>
                <h3 className="text-base font-bold text-foreground">Pagamentos</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Rápidos, de baixo custo e verificáveis.
                </p>
              </div>
              <div className="pt-4">
                <Badge
                  variant="secondary"
                  className="bg-purple-100 text-[#7B2FF7] hover:bg-purple-100 text-[11px] font-medium"
                >
                  Solana — Pagamentos
                </Badge>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-2xl p-5 border border-border shadow-subtle flex flex-col justify-between hover:border-[#7B2FF7]/40 transition-colors">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#7B2FF7] flex items-center justify-center font-bold">
                  🔍
                </div>
                <h3 className="text-base font-bold text-foreground">Transparência</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Registros verificáveis de cada transação.
                </p>
              </div>
              <div className="pt-4">
                <Badge
                  variant="secondary"
                  className="bg-purple-100 text-[#7B2FF7] hover:bg-purple-100 text-[11px] font-medium"
                >
                  Solana — Transparência
                </Badge>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-2xl p-5 border border-border shadow-subtle flex flex-col justify-between hover:border-[#7B2FF7]/40 transition-colors">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  📱
                </div>
                <h3 className="text-base font-bold text-foreground">Solana Pay</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Cobrança e pagamento por QR Code.
                </p>
              </div>
              <div className="pt-4">
                <Badge
                  variant="secondary"
                  className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-[11px] font-medium"
                >
                  Solana Pay — Cobrança
                </Badge>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white rounded-2xl p-5 border border-border shadow-subtle flex flex-col justify-between hover:border-[#7B2FF7]/40 transition-colors">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  🛡️
                </div>
                <h3 className="text-base font-bold text-foreground">Squads</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Carteiras compartilhadas para grupos (evolução futura).
                </p>
              </div>
              <div className="pt-4">
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-[11px] font-medium"
                >
                  Squads — Evolução futura
                </Badge>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground bg-white/80 py-2.5 px-4 rounded-xl border border-border inline-block">
              Recursos representados no protótipo para demonstração. Integrações reais estão em
              desenvolvimento.
            </p>
          </div>
        </div>
      </section>

      {/* 5. CTA SECTION */}
      <section className="py-16 sm:py-20 bg-gradient-to-tr from-[#7B2FF7] to-[#9D5BFF] text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Pronto para rachar?
          </h2>
          <p className="text-base sm:text-lg text-purple-100 max-w-xl mx-auto mb-8 font-medium">
            Você não precisa entender blockchain. Só precisa saber o que quer rachar.
          </p>
          <Button
            asChild
            className="h-12 px-9 bg-white text-[#7B2FF7] hover:bg-slate-100 text-base font-bold rounded-xl shadow-xl transition-all hover:scale-105 active:scale-95"
          >
            <Link to="/assistente">Criar um racha</Link>
          </Button>
        </div>
      </section>

      {/* 6. FOOTER */}
      <footer className="py-10 bg-white border-t border-border mt-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-4">
          <div className="flex items-center justify-center gap-1.5 font-bold text-base">
            <span className="text-foreground">Racha</span>
            <span className="text-[#7B2FF7]">.AI</span>
          </div>

          <p className="text-xs text-muted-foreground">Feito para universitários brasileiros 🇧🇷</p>

          <p className="text-xs text-muted-foreground/90 font-medium italic">
            &ldquo;Gemini entende o combinado. Solana ajuda a tornar o pagamento verificável.&rdquo;
          </p>

          <div className="pt-2 flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <button
              onClick={() => setIsWhySolanaModalOpen(true)}
              className="hover:text-[#7B2FF7] transition-colors"
            >
              Por que Solana?
            </button>
            <span>•</span>
            <span className="hover:text-[#7B2FF7] cursor-pointer">Termos</span>
            <span>•</span>
            <Link to="/racha/demo" className="hover:text-[#7B2FF7] transition-colors">
              Racha Demo
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
