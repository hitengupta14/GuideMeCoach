export default {
  'overhead-press': 'primary',
  'dumbbell-shoulder-press': 'primary',
  'machine-shoulder-press': 'primary',
  'arnold-press': 'primary',
  'incline-dumbbell-press': 'secondary',
  'barbell-bench-press': 'secondary',
  'dumbbell-bench-press': 'secondary',
  'machine-chest-press': 'secondary',
  'resistance-band-push-ups': 'secondary',
  'overhead-tricep-extension': 'stabilizer',
} as Record<string, 'primary' | 'secondary' | 'stabilizer'>;
