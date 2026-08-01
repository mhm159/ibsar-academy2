'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Gift, Loader2, Sparkles, Coins } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { triggerConfetti } from '@/components/site/kids-effects'

interface Reward {
  id: string
  name: string
  type: string
  rarity: string
  cssValue: string
  icon: string
}

export function MysteryBox({ studentId, balance, onRewardUnlocked }: { studentId: string; balance: number; onRewardUnlocked: (r: Reward, newBalance: number) => void }) {
  const [loading, setLoading] = useState(false)
  const [reward, setReward] = useState<Reward | null>(null)
  const [isOpening, setIsOpening] = useState(false)
  
  const BOX_PRICE = 150

  const handleOpen = async () => {
    if (balance < BOX_PRICE) {
      toast.error('رصيد النقاط غير كافٍ!')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/gamification/mystery-box', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId })
      })
      const data = await res.json()
      
      if (!res.ok) {
        toast.error(data.error)
        setLoading(false)
        return
      }

      // Start animation
      setIsOpening(true)
      setTimeout(() => {
        setReward(data.reward)
        setIsOpening(false)
        triggerConfetti(100, 3000)
        onRewardUnlocked(data.reward, data.newBalance)
      }, 2000) // 2 sec shake

    } catch (err) {
      toast.error('حدث خطأ')
      setLoading(false)
    }
  }

  const getRarityColor = (rarity: string) => {
    switch(rarity) {
      case 'LEGENDARY': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400'
      case 'EPIC': return 'text-fuchsia-500 bg-fuchsia-500/10 border-fuchsia-500'
      case 'RARE': return 'text-blue-400 bg-blue-400/10 border-blue-400'
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400'
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <AnimatePresence mode="wait">
        {!reward ? (
          <motion.div 
            key="box"
            className="flex flex-col items-center"
            animate={isOpening ? { rotate: [-10, 10, -10, 10, 0], scale: [1, 1.1, 1] } : {}}
            transition={isOpening ? { duration: 0.4, repeat: 4 } : {}}
          >
            <div className="relative w-48 h-48 mb-6">
              <div className="absolute inset-0 bg-gradient-to-tr from-gold/40 to-fuchsia-500/40 rounded-full blur-2xl animate-pulse" />
              <img src="https://em-content.zobj.net/source/apple/354/wrapped-gift_1f381.png" alt="Mystery Box" className="w-full h-full object-contain relative z-10 drop-shadow-2xl" />
            </div>

            <Button 
              size="lg" 
              onClick={handleOpen} 
              disabled={loading || isOpening || balance < BOX_PRICE}
              className="kids-btn kids-btn-accent rounded-full text-xl px-8 py-6 h-auto"
            >
              {loading || isOpening ? <Loader2 className="animate-spin h-6 w-6" /> : (
                <>
                  افتح الصندوق بـ {BOX_PRICE} <Coins className="mr-2 h-5 w-5 inline" />
                </>
              )}
            </Button>
            {balance < BOX_PRICE && (
              <p className="text-red-500 mt-3 text-sm font-bold">تحتاج إلى {BOX_PRICE - balance} نقطة إضافية لفتح صندوق!</p>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="reward"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`flex flex-col items-center p-8 rounded-3xl border-4 ${getRarityColor(reward.rarity)}`}
          >
            <Sparkles className="h-12 w-12 mb-4 animate-spin-slow" />
            <div className="text-6xl mb-4 kids-bounce">{reward.icon}</div>
            <h3 className="text-3xl font-black mb-2">{reward.name}</h3>
            <p className="text-xl font-bold mb-6 opacity-80">{reward.type === 'FRAME' ? 'إطار صورة' : 'لقب حصري'}</p>
            <Button 
              onClick={() => { setReward(null); setLoading(false); }}
              variant="outline"
              className="rounded-full border-2"
            >
              رائع! العودة للمتجر
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
