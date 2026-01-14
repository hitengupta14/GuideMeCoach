import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'GuideMeCoach - Structured Exercise Knowledge Platform',
    template: '%s | GuideMeCoach'
  },
  description: 'Comprehensive exercise library with 100+ exercises, muscle-wise navigation, video demonstrations, and medical-safe filtering. Built for Indian fitness enthusiasts.',
  keywords: ['exercise library', 'workout guide', 'fitness', 'muscle exercises', 'gym exercises', 'home workouts', 'India fitness', 'training guide'],
  authors: [{ name: 'GuideMeCoach' }],
  creator: 'GuideMeCoach',
  publisher: 'GuideMeCoach',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://guidemecoach.com'),
  openGraph: {
    title: 'GuideMeCoach - Structured Exercise Knowledge Platform',
    description: 'Comprehensive exercise library with medical-safe filtering and personalized training guidance',
    url: 'https://guidemecoach.com',
    siteName: 'GuideMeCoach',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GuideMeCoach - Exercise Knowledge Platform',
    description: 'Comprehensive exercise library for Indian fitness enthusiasts',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <Header />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
