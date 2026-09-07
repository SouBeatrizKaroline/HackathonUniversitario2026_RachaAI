import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRacha } from '@/context/RachaContext'
import { User, Sparkles } from 'lucide-react'

export const NicknameModal: React.FC = () => {
  const { currentNickname, setCurrentNickname, isNicknameModalOpen, setIsNicknameModalOpen } =
    useRacha()
  const [nameInput, setNameInput] = useState(currentNickname || '')

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (nameInput.trim()) {
      setCurrentNickname(nameInput.trim())
    } else {
      setCurrentNickname('Você')
    }
    setIsNicknameModalOpen(false)
  }

  const handleVisitor = () => {
    setCurrentNickname('Visitante')
    setIsNicknameModalOpen(false)
  }

  return (
    <Dialog open={isNicknameModalOpen} onOpenChange={setIsNicknameModalOpen}>
      <DialogContent className="max-w-sm w-[92vw] rounded-2xl p-6 bg-white border border-border shadow-2xl">
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-purple-100 text-[#7B2FF7] flex items-center justify-center mb-2 shadow-sm">
            <User className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
            Como podemos te chamar?
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground pt-1">
            Seu apelido será usado para identificar suas participações e pagamentos nos rachas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <div>
            <Input
              type="text"
              placeholder="Ex.: Lucas, Bia, Rafa..."
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="h-11 rounded-xl text-center text-sm font-medium border-border focus-visible:ring-[#7B2FF7]"
              autoFocus
              maxLength={24}
            />
          </div>

          <div className="space-y-2">
            <Button
              type="submit"
              className="w-full h-11 bg-[#7B2FF7] hover:bg-[#6A23E0] text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              Entrar
            </Button>

            <button
              type="button"
              onClick={handleVisitor}
              className="w-full text-xs text-center text-muted-foreground hover:text-foreground py-1 transition-colors"
            >
              Entrar como visitante
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
