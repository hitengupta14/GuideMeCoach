import 'dotenv/config'
import { db } from '@/db'
import { muscleGroups } from '@/db/schema'

const newGroups = [
  { name: 'mid_chest', displayName: 'Mid Chest', bodyPart: 'upper', description: 'Sternal fibers of pectoralis major' },
  { name: 'lower_chest', displayName: 'Lower Chest', bodyPart: 'upper', description: 'Inferior sternal fibers of pectoralis major' },
  { name: 'upper_abs', displayName: 'Upper Abs', bodyPart: 'core', description: 'Upper rectus abdominis' },
  { name: 'lower_abs', displayName: 'Lower Abs', bodyPart: 'core', description: 'Lower rectus abdominis' },
  { name: 'gastrocnemius_medial', displayName: 'Gastrocnemius (Medial)', bodyPart: 'legs', description: 'Medial head of gastrocnemius' },
  { name: 'gastrocnemius_lateral', displayName: 'Gastrocnemius (Lateral)', bodyPart: 'legs', description: 'Lateral head of gastrocnemius' },
  { name: 'soleus', displayName: 'Soleus', bodyPart: 'legs', description: 'Deep calf muscle for plantar flexion' },
]

async function upsertMuscleGroups() {
  console.log('🔧 Upserting extended muscle groups...')
  const existing = await db.select().from(muscleGroups)
  const existingNames = new Set(existing.map(m => m.name))
  const toInsert = newGroups.filter(g => !existingNames.has(g.name))

  if (toInsert.length === 0) {
    console.log('ℹ️  All extended groups already present.')
    return
  }

  await db.insert(muscleGroups).values(toInsert as any)
  console.log(`✅ Inserted ${toInsert.length} new muscle groups`)
}

upsertMuscleGroups().then(() => process.exit(0)).catch(err => {
  console.error(err)
  process.exit(1)
})
