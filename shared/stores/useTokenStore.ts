// stores/useTokenStore.ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import axios from 'axios'

interface TokenTransaction {
  id: number
  amount: number
  type: string
  description: string
  balance: number
  created_at: string
  updated_at: string
}

interface TokenState {
  balance: number
  isLoading: boolean
  transactions: TokenTransaction[]
  error: string | null
  
  // 액션
  fetchBalance: () => Promise<void>
  fetchTransactions: () => Promise<void>
  purchaseTokens: (amount: number, paymentMethod: string) => Promise<boolean>
  useTokens: (amount: number, purpose: string, metadata?: any) => Promise<boolean>
}

const useTokenStore = create<TokenState>()(
  devtools((set, get) => ({
    balance: 0,
    isLoading: false,
    transactions: [],
    error: null,
    
    fetchBalance: async () => {
      set({ isLoading: true })
      try {
        const { data } = await axios.get('/api/tokens/balance')
        set({ balance: data.balance, isLoading: false })
      } catch (error) {
        set({ error: '잔액 조회 실패', isLoading: false })
      }
    },
    
    fetchTransactions: async () => {
      set({ isLoading: true })
      try {
        const { data } = await axios.get('/api/tokens/transactions')
        set({ transactions: data, isLoading: false })
      } catch (error) {
        set({ error: '거래내역 조회 실패', isLoading: false })
      }
    },
    
    purchaseTokens: async (amount, paymentMethod) => {
      set({ isLoading: true })
      try {
        const { data } = await axios.post('/api/tokens/purchase', { amount, paymentMethod })
        set({ balance: data.balance, isLoading: false })
        return true
      } catch (error) {
        set({ error: '토큰 구매 실패', isLoading: false })
        return false
      }
    },
    
    useTokens: async (amount, purpose, metadata) => {
      set({ isLoading: true })
      try {
        const { data } = await axios.post('/api/tokens/use', { amount, purpose, metadata })
        set({ balance: data.balance, isLoading: false })
        return true
      } catch (error) {
        set({ error: '토큰 사용 실패', isLoading: false })
        return false
      }
    }
  }))
)

export default useTokenStore