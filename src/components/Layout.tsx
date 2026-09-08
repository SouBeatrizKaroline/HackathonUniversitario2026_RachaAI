import React, { useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useRacha } from '@/context/RachaContext'
import { useAuth } from '@/context/AuthContext'
import { WhySolanaModal } from '@/components/WhySolanaModal'
import { NicknameModal } from '@/components/NicknameModal'
import { NotificationCenter } from '@/components/NotificationCenter'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Home,
  Plus,
  ListOrdered,
  Sparkles,
  User,
  HelpCircle,
  LogOut,
  LogIn,
  UserPlus,
  Shield,
} from 'lucide-react'
import { toast } from 'sonner'

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, isDemoMode, logout, setDemoMode } = useAuth()
  const {
    currentNickname,
    setCurrentNickname,
    isWhySolanaModalOpen,
    setIsWhySolanaModalOpen,
    isNicknameModalOpen,
    setIsNicknameModalOpen,
  } = useRacha()

  const isLandingPage = location.pathname === '/'
  const isAuthPage = ['/login', '/cadastro', '/esqueci-senha'].includes(location.pathname)

  // Prompt nickname on first visit if not set, not on landing or auth pages, and not logged in
  useEffect(() => {
    if (
      !isLandingPage &&
      !isAuthPage &&
      !isAuthenticated &&
      !currentNickname &&
      localStorage.getItem('rachaai_nickname') === null
    ) {
      setIsNicknameModalOpen(true)
    }
  }, [isLandingPage, isAuthPage, isAuthenticated, currentNickname, setIsNicknameModalOpen])

  // Get dynamic title for mobile top nav
  const getPageTitle = () => {
    const path = location.pathname
    if (path === '/dashboard') return 'Início'
    if (path === '/assistente') return 'Assistente IA'
    if (path === '/racha/novo') return 'Criar Racha'
    if (path === '/rachas') return 'Meus Rachas'
    if (path.startsWith('/racha/')) return 'Detalhes do Racha'
    return 'Racha.AI'
  }

  // Active state checkers
  const isHomeActive = location.pathname === '/dashboard'
  const isAssistantActive =
    location.pathname === '/assistente' || location.pathname === '/racha/novo'
  const isRachasActive = location.pathname === '/rachas'

  const displayName = isAuthenticated
    ? user?.name || user?.email?.split('@')[0] || 'Usuário'
    : currentNickname || 'Visitante'

  const userInitial = displayName.trim().charAt(0).toUpperCase() || 'U'

  const handleLogout = () => {
    logout()
    toast.success('Você saiu da sua conta.')
    navigate('/')
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-sans">
      {/* Top Header (Slim on desktop, contextual on mobile) */}
      {!isLandingPage && !isAuthPage && (
        <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-border shadow-xs transition-all">
          <div className="max-w-4xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <Link to="/dashboard" className="flex items-center gap-2 group">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-[#7B2FF7] to-[#9D5BFF] flex items-center justify-center text-white shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
                </div>
                <div className="flex items-baseline">
                  <span className="font-extrabold text-lg sm:text-xl tracking-tight text-foreground">
                    Racha
                  </span>
                  <span className="font-extrabold text-lg sm:text-xl tracking-tight text-[#7B2FF7] ml-0.5">
                    .AI
                  </span>
                </div>
              </Link>

              {/* Demo Mode Badge if not authenticated */}
              {!isAuthenticated && (
                <Badge
                  variant="outline"
                  className="hidden md:inline-flex border-amber-300 bg-amber-50 text-amber-800 text-[10px] font-semibold"
                >
                  Modo Demonstração
                </Badge>
              )}
            </div>

            {/* Mobile Contextual Page Title */}
            <div className="sm:hidden font-semibold text-xs sm:text-sm text-foreground/90 truncate max-w-[130px]">
              {getPageTitle()}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Desktop link: Por que Solana */}
              <button
                type="button"
                onClick={() => setIsWhySolanaModalOpen(true)}
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-muted-foreground hover:text-[#7B2FF7] hover:bg-purple-50 transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                Por que Solana?
              </button>

              {/* Centro de Notificações */}
              <NotificationCenter />

              {/* If NOT authenticated: Show Login/Cadastro CTA button on desktop */}
              {!isAuthenticated && (
                <div className="hidden sm:flex items-center gap-2">
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="text-xs font-bold text-foreground hover:text-[#7B2FF7] h-8 px-2.5"
                  >
                    <Link to="/login">Entrar</Link>
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    className="bg-[#7B2FF7] hover:bg-[#6A23E0] text-white text-xs font-bold rounded-xl h-8 px-3 shadow-xs"
                  >
                    <Link to="/cadastro">Criar conta</Link>
                  </Button>
                </div>
              )}

              {/* User Avatar Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border text-xs sm:text-sm font-bold flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-[#7B2FF7] ${
                      isAuthenticated
                        ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
                        : 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200'
                    }`}
                    aria-label="Menu do usuário"
                  >
                    {userInitial}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl p-1.5">
                  <div className="px-2.5 py-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-medium text-muted-foreground">
                        {isAuthenticated ? 'Conta conectada' : 'Modo visitante (Demo)'}
                      </p>
                      {isAuthenticated ? (
                        <span className="w-2 h-2 rounded-full bg-emerald-500" title="Online" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-amber-500" title="Visitante" />
                      )}
                    </div>
                    <p className="text-sm font-bold text-foreground truncate mt-0.5">
                      {displayName}
                    </p>
                    {isAuthenticated && user?.email && (
                      <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                    )}
                  </div>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() => navigate('/rachas')}
                    className="text-xs font-medium cursor-pointer"
                  >
                    <ListOrdered className="w-4 h-4 mr-2 text-[#7B2FF7]" />
                    Meus rachas
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => setIsWhySolanaModalOpen(true)}
                    className="text-xs font-medium cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 mr-2 text-amber-500" />
                    Por que Solana?
                  </DropdownMenuItem>

                  {!isAuthenticated ? (
                    <>
                      <DropdownMenuItem
                        onClick={() => setIsNicknameModalOpen(true)}
                        className="text-xs font-medium cursor-pointer"
                      >
                        <User className="w-4 h-4 mr-2" />
                        Alterar apelido visitante
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => navigate('/login')}
                        className="text-xs font-bold text-[#7B2FF7] cursor-pointer"
                      >
                        <LogIn className="w-4 h-4 mr-2" />
                        Entrar na minha conta
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => navigate('/cadastro')}
                        className="text-xs font-medium text-foreground cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4 mr-2 text-emerald-600" />
                        Criar conta real grátis
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="text-xs font-medium text-destructive cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sair da conta
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main
        className={`flex-1 w-full ${
          !isLandingPage && !isAuthPage ? 'pb-24 sm:pb-12 pt-3 sm:pt-6' : ''
        }`}
      >
        <Outlet />
      </main>

      {/* Bottom Nav Bar (Mobile only, authenticated pages) */}
      {!isLandingPage && (
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-border px-6 py-2 shadow-lg">
          <div className="flex items-center justify-between max-w-md mx-auto relative">
            {/* Início */}
            <Link
              to="/dashboard"
              className={`flex flex-col items-center justify-center py-1 transition-colors ${
                isHomeActive ? 'text-[#7B2FF7] font-bold' : 'text-muted-foreground font-medium'
              }`}
            >
              <Home className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Início</span>
            </Link>

            {/* Novo Racha (Center Elevated Floating Button) */}
            <div className="relative -top-5">
              <Link
                to="/assistente"
                className="w-13 h-13 w-12 h-12 rounded-full bg-gradient-to-tr from-[#7B2FF7] to-[#9D5BFF] text-white flex items-center justify-center shadow-lg shadow-purple-500/40 border-4 border-white hover:scale-105 active:scale-95 transition-all"
                aria-label="Criar novo racha com IA"
              >
                <Plus className="w-6 h-6 stroke-[2.5]" />
              </Link>
            </div>

            {/* Rachas */}
            <Link
              to="/rachas"
              className={`flex flex-col items-center justify-center py-1 transition-colors ${
                isRachasActive ? 'text-[#7B2FF7] font-bold' : 'text-muted-foreground font-medium'
              }`}
            >
              <ListOrdered className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Rachas</span>
            </Link>
          </div>
        </nav>
      )}

      {/* Global Modals */}
      <WhySolanaModal open={isWhySolanaModalOpen} onOpenChange={setIsWhySolanaModalOpen} />
      <NicknameModal />
    </div>
  )
}
