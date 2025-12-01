'use client'

import { LanguageProvider } from '@/contexts/LanguageContext'

export default function LanguageProviderWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return <LanguageProvider>{children}</LanguageProvider>
}

