/* Main App Component - Handles routing (using react-router-dom), query client and other providers - use this file to add all routes */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { RachaProvider } from '@/context/RachaContext'

import Layout from './components/Layout'
import Index from './pages/Index'
import Dashboard from './pages/Dashboard'
import AssistantPage from './pages/AssistantPage'
import CreateRachaPage from './pages/CreateRachaPage'
import RachaDetailPage from './pages/RachaDetailPage'
import RachasListPage from './pages/RachasListPage'
import NotFound from './pages/NotFound'

const App = () => (
  <BrowserRouter>
    <TooltipProvider>
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
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </RachaProvider>
    </TooltipProvider>
  </BrowserRouter>
)

export default App
