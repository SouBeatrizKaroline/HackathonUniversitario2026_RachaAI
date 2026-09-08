/* Main App Component - Handles routing (using react-router-dom), query client and other providers - use this file to add all routes */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/context/AuthContext'
import { RachaProvider } from '@/context/RachaContext'

import Layout from './components/Layout'
import Index from './pages/Index'
import Dashboard from './pages/Dashboard'
import AssistantPage from './pages/AssistantPage'
import CreateRachaPage from './pages/CreateRachaPage'
import RachaDetailPage from './pages/RachaDetailPage'
import RachasListPage from './pages/RachasListPage'
import HistoricoFinanceiroPage from './pages/HistoricoFinanceiroPage'
import CarteiraPage from './pages/CarteiraPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import NotFound from './pages/NotFound'

const App = () => (
  <BrowserRouter>
    <TooltipProvider>
      <AuthProvider>
        <RachaProvider>
          <Toaster />
          <Sonner position="top-center" richColors />
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/assistente" element={<AssistantPage />} />
              <Route path="/racha/novo" element={<CreateRachaPage />} />
              <Route path="/racha/:id" element={<RachaDetailPage />} />
              <Route path="/racha/demo" element={<RachaDetailPage />} />
              <Route path="/rachas" element={<RachasListPage />} />
              <Route path="/historico" element={<HistoricoFinanceiroPage />} />
              <Route path="/carteira" element={<CarteiraPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/cadastro" element={<RegisterPage />} />
              <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </RachaProvider>
      </AuthProvider>
    </TooltipProvider>
  </BrowserRouter>
)

export default App
