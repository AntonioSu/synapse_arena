import { db } from './client';
import { npcsData } from '../data/npcs';

async function seed() {
  try {
    console.log('Seeding database...');

    // Seed NPCs
    console.log('Seeding NPCs...');
    for (const npc of npcsData) {
      await db.query(
        `INSERT INTO npcs (npc_id, name, avatar_url, system_prompt, slang_tags, stance_preference)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (npc_id) DO UPDATE SET
           name = EXCLUDED.name,
           avatar_url = EXCLUDED.avatar_url,
           system_prompt = EXCLUDED.system_prompt,
           slang_tags = EXCLUDED.slang_tags,
           stance_preference = EXCLUDED.stance_preference`,
        [
          npc.npc_id,
          npc.name,
          npc.avatar_url,
          npc.system_prompt,
          JSON.stringify(npc.slang_tags),
          npc.stance_preference || null,
        ]
      );
    }

    console.log(`✅ Seeded ${npcsData.length} NPCs`);
    console.log('✅ Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
