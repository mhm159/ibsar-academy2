import { seedRewards } from '../src/lib/gamification'
import { db } from '../src/lib/db'

async function run() {
  await seedRewards()
  
  // Let's also give some Points to the test student so they can buy boxes
  // The first student ID in seed is 'seed-student-1'
  await db.student.updateMany({
    where: { id: 'seed-student-1' },
    data: { pointsBalance: 1000 }
  })
  console.log('✓ Added 1000 points to seed-student-1')
}

run().catch(console.error).finally(() => process.exit(0))
