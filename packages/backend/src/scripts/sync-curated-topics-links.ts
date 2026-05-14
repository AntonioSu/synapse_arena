/**
 * 一次性脚本：把 seed-curated-topics.ts 源文件里所有 /search? 形式的 zhihu_link，
 * 用数据库中对应 title 的真实 /question/{id} 链接替换掉，写回源文件。
 *
 * 使用：
 *   DRY_RUN=1 npx tsx src/scripts/sync-curated-topics-links.ts  # 仅打印替换
 *   npx tsx src/scripts/sync-curated-topics-links.ts             # 真写文件
 */
import * as fs from 'fs';
import * as path from 'path';
import { db } from '../db/client';

const DRY_RUN = process.env.DRY_RUN === '1';

const SOURCE_PATH = path.resolve(__dirname, 'seed-curated-topics.ts');

interface Block {
  start: number;
  end: number;
  title: string;
  link: string;
}

function parseBlocks(src: string): Block[] {
  const blocks: Block[] = [];
  const objectRe = /\{([^{}]*?title:\s*'([^']+)'[^{}]*?zhihu_link:\s*'([^']+)'[^{}]*?)\}/gs;
  let m: RegExpExecArray | null;
  while ((m = objectRe.exec(src)) !== null) {
    blocks.push({
      start: m.index,
      end: m.index + m[0].length,
      title: m[2],
      link: m[3],
    });
  }
  return blocks;
}

async function main() {
  const src = fs.readFileSync(SOURCE_PATH, 'utf8');
  const blocks = parseBlocks(src);
  const searchBlocks = blocks.filter((b) => /\/search\?/.test(b.link));

  console.log(`📋 源文件中 zhihu_link 条目: ${blocks.length}`);
  console.log(`📋 其中 /search? 形式: ${searchBlocks.length}`);
  if (searchBlocks.length === 0) {
    console.log('✅ 源文件已无 search 链接，无需同步');
    await db.close();
    return;
  }

  let patched = src;
  let replaced = 0;
  let skipped = 0;

  // 倒序替换，避免索引偏移
  for (const b of [...searchBlocks].reverse()) {
    const row = await db.query<{ zhihu_link: string }>(
      `SELECT zhihu_link FROM topics WHERE title = $1`,
      [b.title],
    );
    const dbLink = row.rows[0]?.zhihu_link;
    if (!dbLink || !/zhihu\.com\/question\/\d+/.test(dbLink)) {
      console.log(`⏸️  保留 (DB 也没有 question 链接): ${b.title}`);
      skipped++;
      continue;
    }
    const oldLine = `zhihu_link: '${b.link}'`;
    const newLine = `zhihu_link: '${dbLink}'`;
    if (!patched.includes(oldLine)) {
      console.log(`⚠️  无法在源中定位行: ${b.title}`);
      skipped++;
      continue;
    }
    patched = patched.replace(oldLine, newLine);
    console.log(`✅ ${b.title.slice(0, 30)}`);
    console.log(`     OLD: ${b.link}`);
    console.log(`     NEW: ${dbLink}`);
    replaced++;
  }

  console.log('\n========== 同步结果 ==========');
  console.log(`替换条目: ${replaced}`);
  console.log(`保留条目: ${skipped}`);

  if (DRY_RUN) {
    console.log('🔧 DRY_RUN=1，未写文件');
    await db.close();
    return;
  }

  if (replaced > 0) {
    fs.writeFileSync(SOURCE_PATH, patched, 'utf8');
    console.log(`💾 已写入 ${SOURCE_PATH}`);
  } else {
    console.log('💾 无变更，未写入文件');
  }
  await db.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
