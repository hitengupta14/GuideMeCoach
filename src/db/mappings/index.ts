import chestUpper from './chest.upper'
import chestMid from './chest.mid'
import chestLower from './chest.lower'
import upperAbs from './core.upper_abs'
import lowerAbs from './core.lower_abs'
import abs from './core.abs'
import obliques from './core.obliques'
import lats from './back.lats'
import upperBack from './back.upper_back'
import lowerBack from './back.lower_back'
import frontDelts from './shoulders.front_delts'
import sideDelts from './shoulders.side_delts'
import rearDelts from './shoulders.rear_delts'
import biceps from './arms.biceps'
import triceps from './arms.triceps'
import forearms from './arms.forearms'
import quads from './legs.quads'
import hamstrings from './legs.hamstrings'
import glutes from './legs.glutes'
import gastroMedial from './legs.gastro_medial'
import gastroLateral from './legs.gastro_lateral'
import soleus from './legs.soleus'
import calves from './calves.calves'

export type Role = 'primary' | 'secondary' | 'stabilizer'
export type RoleMap = Record<string, Role>

const muscleMappings: Record<string, RoleMap> = {
  upper_chest: chestUpper,
  mid_chest: chestMid,
  lower_chest: chestLower,
  upper_abs: upperAbs,
  lower_abs: lowerAbs,
  abs,
  obliques,
  lats,
  upper_back: upperBack,
  lower_back: lowerBack,
  front_delts: frontDelts,
  side_delts: sideDelts,
  rear_delts: rearDelts,
  biceps,
  triceps,
  forearms,
  quads,
  hamstrings,
  glutes,
  gastrocnemius_medial: gastroMedial,
  gastrocnemius_lateral: gastroLateral,
  soleus,
  calves,
}

export function buildExerciseMuscleMap(): Record<string, { primary: string[]; secondary: string[]; stabilizer: string[] }> {
  const out: Record<string, { primary: string[]; secondary: string[]; stabilizer: string[] }> = {}

  for (const [muscleName, map] of Object.entries(muscleMappings)) {
    for (const [slug, role] of Object.entries(map)) {
      if (!out[slug]) out[slug] = { primary: [], secondary: [], stabilizer: [] }
      out[slug][role].push(muscleName)
    }
  }

  return out
}
