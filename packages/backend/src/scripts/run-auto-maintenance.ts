/**
 * 手动触发一次 auto-maintenance（不依赖 cron），方便本地调试/补刷。
 *
 * 用法：
 *   tsx src/scripts/run-auto-maintenance.ts
 *   AUTO_JUDGEMENT_CONCURRENCY=6 tsx src/scripts/run-auto-maintenance.ts
 */
import { autoMaintenance } from '../services/auto-maintenance';

async function main() {
  const stats = await autoMaintenance.runOnce();
  process.exit(stats ? 0 : 1);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
