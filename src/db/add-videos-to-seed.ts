import 'dotenv/config'
import { db } from '@/db'
import { exercises } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { videoLinks, exerciseAlternatives } from './add-videos-alternatives'

async function addVideosAndAlternatives() {
console.log('Adding videos and alternatives to exercises...')

  let updated = 0
  let notFound = 0

  // Add videos to exercises
  for (const [slug, videoUrl] of Object.entries(videoLinks)) {
    const exerciseList = await db.select().from(exercises).where(eq(exercises.slug, slug))
    
    if (exerciseList.length > 0) {
      await db.update(exercises)
        .set({
          videos: { demoVideo: videoUrl }
        })
        .where(eq(exercises.slug, slug))
      
      updated++
console.log(`Added video for: ${slug}`)
    } else {
      notFound++
console.log(`Exercise not found: ${slug}`)
    }
  }

console.log(`\nUpdated ${updated} exercises with videos`)
console.log(`${notFound} exercises not found in database`)
console.log('\nNote: Alternatives will be displayed via the exerciseAlternatives mapping')
}

addVideosAndAlternatives()
  .catch((error) => {
console.error('Error:', error)
    process.exit(1)
  })
  .finally(() => {
    process.exit(0)
  })
