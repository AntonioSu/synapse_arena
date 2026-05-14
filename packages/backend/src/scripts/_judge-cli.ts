/**
 * judge-missing-topics / rejudge-deadlock-topics 共享的 CLI 解析与小工具。
 * 两个脚本曾各自手抄一份完全相同的 --limit / --concurrency / --force / --dry-run 解析器。
 */

export interface BaseJudgeCli {
  limit: number | null;
  delayMs: number;
  concurrency: number;
  force: boolean;
  dryRun: boolean;
  only: string | null;
}

export function parseJudgeCliArgs(argv: string[]): BaseJudgeCli {
  const opts: BaseJudgeCli = {
    limit: null,
    delayMs: parseInt(process.env.JUDGE_DELAY_MS || '2000', 10),
    concurrency: parseInt(process.env.JUDGE_CONCURRENCY || '1', 10),
    force: false,
    dryRun: false,
    only: null,
  };

  const readNum = (raw: string | undefined): number => {
    const v = parseInt(raw || '0', 10);
    return v > 0 ? v : 0;
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--force' || arg === '-f') {
      opts.force = true;
    } else if (arg === '--dry-run') {
      opts.dryRun = true;
    } else if (arg === '--limit' || arg === '-n') {
      const v = readNum(argv[++i]);
      if (v > 0) opts.limit = v;
    } else if (arg.startsWith('--limit=')) {
      const v = readNum(arg.split('=')[1]);
      if (v > 0) opts.limit = v;
    } else if (arg === '--concurrency' || arg === '-c') {
      const v = readNum(argv[++i]);
      if (v > 0) opts.concurrency = v;
    } else if (arg.startsWith('--concurrency=')) {
      const v = readNum(arg.split('=')[1]);
      if (v > 0) opts.concurrency = v;
    } else if (arg === '--only') {
      const v = argv[++i];
      if (v) opts.only = v;
    }
  }
  if (opts.concurrency < 1) opts.concurrency = 1;
  return opts;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
