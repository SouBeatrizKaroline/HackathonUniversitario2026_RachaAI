import { Racha } from '@/types/racha'

export const DEMO_RACHA_ID = 'demo'

export const DEMO_RACHA: Racha = {
  id: DEMO_RACHA_ID,
  name: 'Viagem para Congresso Universitário',
  category: 'Faculdade',
  totalAmount: 480,
  splitType: 'equal',
  isDemo: true,
  shareCode: 'viagem-congresso-7k2m',
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  description: 'Rateio de vans, ingressos coletivos e hospedagem no congresso nacional da área.',
  participants: [
    {
      id: 'p-ana',
      name: 'Ana',
      amount: 80,
      paid: true,
      paidAt: 'hoje, 14:32',
      txHash: '8xK2...3fPq',
    },
    {
      id: 'p-beatriz',
      name: 'Beatriz',
      amount: 80,
      paid: false,
    },
    {
      id: 'p-carlos',
      name: 'Carlos',
      amount: 80,
      paid: false,
    },
    {
      id: 'p-joao',
      name: 'João',
      amount: 80,
      paid: true,
      paidAt: 'hoje, 11:15',
      txHash: '5mQ9...7yLt',
    },
    {
      id: 'p-lucas',
      name: 'Lucas',
      amount: 80,
      paid: false,
    },
    {
      id: 'p-marina',
      name: 'Marina',
      amount: 80,
      paid: false,
    },
  ],
  history: [
    {
      id: 'h-1',
      participantName: 'Ana',
      amount: 80,
      timestamp: 'hoje, 14:32',
      status: 'Confirmado',
      txHash: '8xK2...3fPq',
    },
    {
      id: 'h-2',
      participantName: 'João',
      amount: 80,
      timestamp: 'hoje, 11:15',
      status: 'Confirmado',
      txHash: '5mQ9...7yLt',
    },
  ],
}
