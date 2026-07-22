'use client'

import { useEffect, useState } from 'react'
import { Star, MessageSquare, TrendingUp, Loader2, ThumbsUp } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { PageHeader, StatCard, StarRating, EmptyState } from '@/components/dashboard/ui-bits'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

interface ReviewItem {
  id: string
  rating: number
  comment: string | null
  tags: string[]
  reviewerName?: string
  reviewedRole?: string
  sessionId: string
  createdAt: string
}

interface ReviewsData {
  avgRating: number
  totalReviews: number
  distribution: Array<{ star: number; count: number }>
  reviewsAboutMe: ReviewItem[]
  reviewsIGave: ReviewItem[]
}

const TAG_LABELS: Record<string, string> = {
  PATIENCE: 'الصبر',
  PROFESSIONALISM: 'الاحترافية',
  PUNCTUALITY: 'الالتزام بالمواعيد',
  ENGAGEMENT: 'التفاعل',
  PROGRESS: 'التقدّم',
  COMMUNICATION: 'التواصل',
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' })

export default function TeacherReviewsPage() {
  return (
    <DashboardShell role="TEACHER">
      <ReviewsView />
    </DashboardShell>
  )
}

function ReviewsView() {
  const [data, setData] = useState<ReviewsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/teacher/reviews')
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading || !data) {
    return (
      <div className="grid gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    )
  }

  const maxCount = Math.max(...data.distribution.map((d) => d.count), 1)

  return (
    <>
      <PageHeader
        title="التقييمات"
        description="تقييمات أولياء الأمور عنك + تقييماتك لطلابك"
      />

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={Star}
          label="متوسط التقييم"
          value={data.avgRating > 0 ? data.avgRating.toString() : '—'}
          hint="من 5"
          color="var(--gold)"
        />
        <StatCard
          icon={MessageSquare}
          label="إجمالي التقييمات"
          value={data.totalReviews}
          color="var(--azure)"
        />
        <StatCard
          icon={ThumbsUp}
          label="تقييمات 5 نجوم"
          value={data.distribution.find((d) => d.star === 5)?.count ?? 0}
          color="var(--emerald-egypt)"
        />
        <StatCard
          icon={TrendingUp}
          label="تقييماتك للطلاب"
          value={data.reviewsIGave.length}
          color="var(--kids-teal)"
        />
      </div>

      <Tabs defaultValue="aboutMe" className="w-full">
        <TabsList className="grid w-full grid-cols-2 glass border border-gold/20 max-w-md">
          <TabsTrigger value="aboutMe" className="data-[state=active]:bg-gold data-[state=active]:text-night">
            تقييمات عني ({data.reviewsAboutMe.length})
          </TabsTrigger>
          <TabsTrigger value="iGave" className="data-[state=active]:bg-gold data-[state=active]:text-night">
            تقييماتي للطلاب ({data.reviewsIGave.length})
          </TabsTrigger>
        </TabsList>

        {/* Reviews about me */}
        <TabsContent value="aboutMe" className="mt-4">
          {/* Distribution chart */}
          {data.totalReviews > 0 && (
            <Card className="p-5 glass border-gold/15 mb-4">
              <h3 className="font-display font-bold mb-3">توزيع التقييمات</h3>
              <div className="space-y-2">
                {data.distribution.map((d) => (
                  <div key={d.star} className="flex items-center gap-3">
                    <span className="text-sm font-bold w-12 flex items-center gap-1">
                      {d.star} <Star className="h-3 w-3 fill-gold text-gold" />
                    </span>
                    <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-l from-gold to-[#E8D488] rounded-full transition-all"
                        style={{ width: `${(d.count / maxCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8 text-right">{d.count}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {data.reviewsAboutMe.length === 0 ? (
            <Card className="glass border-gold/15">
              <EmptyState
                icon={Star}
                title="لا توجد تقييمات بعد"
                description="ستظهر تقييمات أولياء الأمور بعد إكمال الحصص"
              />
            </Card>
          ) : (
            <div className="space-y-3">
              {data.reviewsAboutMe.map((r) => (
                <Card key={r.id} className="p-4 glass border-gold/15">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="font-bold text-sm">{r.reviewerName}</p>
                      <p className="text-xs text-muted-foreground">{fmtDate(r.createdAt)}</p>
                    </div>
                    <StarRating value={r.rating} size="md" />
                  </div>
                  {r.comment && (
                    <p className="text-sm text-foreground/90 bg-muted/30 rounded-lg p-3 mb-2">
                      "{r.comment}"
                    </p>
                  )}
                  {r.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {r.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[0.65rem] px-2 py-0.5 rounded-full bg-emerald-egypt/15 text-emerald-egypt font-bold"
                        >
                          {TAG_LABELS[tag] ?? tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Reviews I gave */}
        <TabsContent value="iGave" className="mt-4">
          {data.reviewsIGave.length === 0 ? (
            <Card className="glass border-gold/15">
              <EmptyState
                icon={MessageSquare}
                title="لم تُقيّم أي طالب بعد"
                description="قيّم طلابك بعد إكمال الحصص لمساعدة أولياء الأمور"
              />
            </Card>
          ) : (
            <div className="space-y-3">
              {data.reviewsIGave.map((r) => (
                <Card key={r.id} className="p-4 glass border-gold/15">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="font-bold text-sm">
                        {r.reviewedRole === 'PARENT' ? 'ولي أمر' : r.reviewedRole}
                      </p>
                      <p className="text-xs text-muted-foreground">{fmtDate(r.createdAt)}</p>
                    </div>
                    <StarRating value={r.rating} size="md" />
                  </div>
                  {r.comment && (
                    <p className="text-sm text-foreground/90 bg-muted/30 rounded-lg p-3">
                      "{r.comment}"
                    </p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </>
  )
}
