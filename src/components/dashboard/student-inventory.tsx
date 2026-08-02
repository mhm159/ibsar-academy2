'use client'

import { useState } from 'react'
import { Check, ShieldCheck, Gem } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { notify } from '@/lib/notify'
import { Card } from '@/components/ui/card'

interface Reward {
  id: string
  name: string
  type: string
  rarity: string
  cssValue: string
  icon: string
}

export function StudentInventory({ 
  studentId, 
  inventory, 
  activeFrame, 
  activeTitle,
  onEquip 
}: { 
  studentId: string
  inventory: Reward[]
  activeFrame?: string
  activeTitle?: string
  onEquip: (type: string, cssValue: string, name: string) => void
}) {
  const [loadingId, setLoading] = useState<string | null>(null)

  const handleEquip = async (reward: Reward) => {
    setLoading(reward.id)
    try {
      const res = await fetch('/api/gamification/equip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, rewardId: reward.id })
      })
      if (!res.ok) throw new Error('فشل التفعيل')
      notify.success('تم التفعيل بنجاح!')
      onEquip(reward.type, reward.cssValue, reward.name)
    } catch {
      notify.error('حدث خطأ أثناء التفعيل')
    }
    setLoading(null)
  }

  const frames = inventory.filter(r => r.type === 'FRAME')
  const titles = inventory.filter(r => r.type === 'TITLE')

  if (inventory.length === 0) {
    return (
      <div className="text-center py-12 opacity-70">
        <Gem className="mx-auto h-12 w-12 mb-3 text-muted-foreground" />
        <p>لا تملك أي جوائز حتى الآن. افتح الصناديق السحرية لتربح!</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 mt-4">
      {frames.length > 0 && (
        <div>
          <h3 className="font-display font-bold text-xl mb-4 flex items-center gap-2">
            🖼️ إطارات الصور
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {frames.map(frame => {
              const isActive = activeFrame === frame.cssValue
              return (
                <Card key={frame.id} className={`p-4 text-center flex flex-col items-center justify-between ${isActive ? 'ring-2 ring-primary bg-primary/5' : ''}`}>
                  <div className="mb-4">
                    <div className={`w-16 h-16 rounded-full mx-auto bg-muted flex items-center justify-center text-3xl ${frame.cssValue}`}>
                      {frame.icon}
                    </div>
                  </div>
                  <h4 className="font-bold text-sm mb-3">{frame.name}</h4>
                  <Button 
                    size="sm" 
                    variant={isActive ? "secondary" : "default"}
                    disabled={isActive || loadingId === frame.id}
                    onClick={() => handleEquip(frame)}
                    className="w-full"
                  >
                    {isActive ? <><Check className="ml-2 w-4 h-4" /> مفعل</> : 'تفعيل'}
                  </Button>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {titles.length > 0 && (
        <div>
          <h3 className="font-display font-bold text-xl mb-4 flex items-center gap-2">
            👑 الألقاب
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {titles.map(title => {
              const isActive = activeTitle === title.name
              return (
                <Card key={title.id} className={`p-4 flex items-center justify-between ${isActive ? 'ring-2 ring-primary bg-primary/5' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{title.icon}</div>
                    <div>
                      <span className={`px-2 py-1 rounded text-sm ${title.cssValue}`}>
                        {title.name}
                      </span>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant={isActive ? "secondary" : "default"}
                    disabled={isActive || loadingId === title.id}
                    onClick={() => handleEquip(title)}
                  >
                    {isActive ? <ShieldCheck className="w-4 h-4" /> : 'تفعيل'}
                  </Button>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
