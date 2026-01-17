import { Metadata } from 'next'
import UserEngagementPage from './client'

export const metadata: Metadata = {
  title: 'My Progress | GuideMeCoach',
  description: 'Track achievements, view your calendar, and complete your profile',
}

export default function EngagementPage() {
  return <UserEngagementPage />
}
