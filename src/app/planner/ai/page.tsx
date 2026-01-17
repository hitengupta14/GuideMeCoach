'use client'

import { redirect } from 'next/navigation'

export default function AIPlannerPage() {
  // Redirect to unified planner which now has both modes
  redirect('/planner/unified?mode=ai')
}
