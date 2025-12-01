import type { Metadata } from 'next'
import './globals.css'
import LanguageProviderWrapper from '@/components/LanguageProviderWrapper'
import { TherapistStatusProvider } from '@/contexts/TherapistStatusContext'

export const metadata: Metadata = {
  title: 'Massage App - Service Management',
  description: 'Manager and Therapist service entry system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <LanguageProviderWrapper>
          <TherapistStatusProvider>
            {children}
          </TherapistStatusProvider>
        </LanguageProviderWrapper>
      </body>
    </html>
  )
}

