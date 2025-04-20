import { Suspense } from 'react'
import PublicProfileContent from '@/components/profile/PublicProfileContent'

export default async function PublicProfilePage({ params }: { params: { userId: string } }) {
  // With async function, params.userId will be properly resolved
  const userId = params.userId

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Загрузка...</div>
      </div>
    }>
      <PublicProfileContent userId={userId} />
    </Suspense>
  )
}