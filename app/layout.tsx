import type { Metadata } from 'next'
import './globals.css'
import LanguageProviderWrapper from '@/components/LanguageProviderWrapper'
import { TherapistStatusProvider } from '@/contexts/TherapistStatusContext'

export const metadata: Metadata = {
  title: 'Massage App - Service Management',
  description: 'Manager and Therapist service entry system',
  openGraph: {
    title: 'Nantika Physical Thai Massage – Service Management',
    description:
      'Daily Matrix, therapist queue, revenue charts, and kiosk login for Nantika Physical Thai Massage.',
    url: 'https://example.com', // replace with real deployed URL
    siteName: 'Nantika Physical Thai Massage',
    images: [
      {
        url: '/og-image.png', // place an image at public/og-image.png
        width: 1200,
        height: 630,
        alt: 'Nantika Physical Thai Massage Service Management Overview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nantika Physical Thai Massage – Service Management',
    description:
      'Daily Matrix, therapist queue, revenue charts, and kiosk login for Nantika Physical Thai Massage.',
    images: ['/og-image.png'],
  },
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

