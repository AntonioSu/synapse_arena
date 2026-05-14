/**
 * 跨脚本共享的轻量 worker pool。
 * 用 cursor + N 个并发 worker 拉取下一项，避免每个 caller 自己手写 while 循环。
 */
export async function runWorkerPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T, workerId: number, index: number) => Promise<void>
): Promise<void> {
  const total = items.length;
  if (total === 0) return;

  let cursor = 0;
  const run = async (workerId: number) => {
    while (true) {
      const idx = cursor++;
      if (idx >= total) return;
      await worker(items[idx], workerId, idx);
    }
  };

  const handles = Array.from(
    { length: Math.max(1, Math.min(concurrency, total)) },
    (_, i) => run(i + 1)
  );
  await Promise.all(handles);
}
