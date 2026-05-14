'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/store/useStore';
import { topicsAPI } from '@/lib/api';
import type { Comment, FeaturedQuote, Topic } from '@/types';

interface Props {
  topic: Topic;
}

interface BarrageItem {
  id: string;
  text: string;
  stance: 'pro' | 'con';
  lane: number;
  duration: number;
  delay: number;
}

const LANE_COUNT = 3;
const ITEMS_PER_LANE = 2;
const MAX_ITEMS = LANE_COUNT * ITEMS_PER_LANE;
const MIN_LEN = 6;
const MAX_LEN = 40;
const LANE_BASE_DURATION = 50;
const LANE_DURATION_STEP = 6;
const RECURATE_THRESHOLD = 10;

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function isQuoteWorthy(text: string): boolean {
  const t = text.trim();
  if (t.length < MIN_LEN || t.length > MAX_LEN) return false;
  if (t.startsWith('@')) return false;
  if (/^[\s\W_]+$/.test(t)) return false;
  return true;
}

interface QuoteSource {
  id: string;
  text: string;
  stance: 'pro' | 'con';
}

function buildItems(sources: QuoteSource[]): BarrageItem[] {
  if (sources.length === 0) return [];
  const items: BarrageItem[] = [];
  for (let i = 0; i < MAX_ITEMS; i++) {
    const src = sources[i % sources.length];
    const lane = i % LANE_COUNT;
    const slotInLane = Math.floor(i / LANE_COUNT);
    const duration = LANE_BASE_DURATION + lane * LANE_DURATION_STEP;
    const delay = -(slotInLane / ITEMS_PER_LANE) * duration;
    items.push({
      id: `${src.id}__${i}`,
      text: src.text,
      stance: src.stance,
      lane,
      duration,
      delay,
    });
  }
  return items;
}

function fromQuotes(quotes: FeaturedQuote[]): BarrageItem[] {
  const sources: QuoteSource[] = [];
  const proSeq: FeaturedQuote[] = [];
  const conSeq: FeaturedQuote[] = [];
  for (const q of quotes) {
    if (!q.content || q.content.length > MAX_LEN) continue;
    (q.stance === 'pro' ? proSeq : conSeq).push(q);
  }
  const max = Math.max(proSeq.length, conSeq.length);
  for (let i = 0; i < max; i++) {
    if (proSeq[i]) sources.push({ id: `llm_pro_${i}`, text: proSeq[i].content, stance: 'pro' });
    if (conSeq[i]) sources.push({ id: `llm_con_${i}`, text: conSeq[i].content, stance: 'con' });
  }
  return buildItems(sources);
}

function fromComments(comments: Comment[], topic: Topic): BarrageItem[] {
  const pool = comments.filter((c) => isQuoteWorthy(c.content));
  const proPool = pool.filter((c) => c.stance === 'pro');
  const conPool = pool.filter((c) => c.stance === 'con');

  const half = Math.ceil(MAX_ITEMS / 2);
  const proPicked = shuffle(proPool).slice(0, half);
  const conPicked = shuffle(conPool).slice(0, half);

  const sources: QuoteSource[] = [];
  const max = Math.max(proPicked.length, conPicked.length);
  for (let i = 0; i < max; i++) {
    if (proPicked[i]) {
      sources.push({
        id: proPicked[i].comment_id,
        text: proPicked[i].content.trim(),
        stance: 'pro',
      });
    }
    if (conPicked[i]) {
      sources.push({
        id: conPicked[i].comment_id,
        text: conPicked[i].content.trim(),
        stance: 'con',
      });
    }
  }

  if (sources.length === 0) {
    if (topic.pro_stance) {
      sources.push({
        id: '__seed_pro',
        text: topic.pro_stance.trim().slice(0, MAX_LEN),
        stance: 'pro',
      });
    }
    if (topic.con_stance) {
      sources.push({
        id: '__seed_con',
        text: topic.con_stance.trim().slice(0, MAX_LEN),
        stance: 'con',
      });
    }
  }

  return buildItems(sources);
}

export default function BarrageBoard({ topic }: Props) {
  const comments = useStore((s) => s.comments);
  const [items, setItems] = useState<BarrageItem[]>([]);
  const [hasLlmQuotes, setHasLlmQuotes] = useState(false);
  const lastCuratedRef = useRef(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    setItems(fromComments(comments, topic));
    lastCuratedRef.current = comments.length;
    setHasLlmQuotes(false);
  }, [topic.topic_id]);

  useEffect(() => {
    let cancelled = false;
    topicsAPI
      .getQuotes(topic.topic_id)
      .then((res) => {
        if (cancelled) return;
        const list: FeaturedQuote[] = res.data?.success ? res.data.data || [] : [];
        if (list.length > 0) {
          const llmItems = fromQuotes(list);
          if (llmItems.length > 0) {
            setItems(llmItems);
            setHasLlmQuotes(true);
          }
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [topic.topic_id]);

  useEffect(() => {
    if (hasLlmQuotes) return;
    const len = comments.length;
    if (len === 0) {
      if (items.length === 0) {
        setItems(fromComments(comments, topic));
      }
      return;
    }
    const last = lastCuratedRef.current;
    if (last < 0 || items.length === 0 || len - last >= RECURATE_THRESHOLD) {
      setItems(fromComments(comments, topic));
      lastCuratedRef.current = len;
    }
  }, [comments, topic, items.length, hasLlmQuotes]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setWidth(el.getBoundingClientRect().width);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (items.length === 0) return null;

  const distance = width > 0 ? `-${width}px` : '-100vw';

  return (
    <div
      ref={containerRef}
      className="barrage-overlay absolute inset-0 overflow-hidden pointer-events-none z-[5]"
      aria-hidden
    >
      {items.map((item) => {
        const topPct = 62.5 + item.lane * (22.5 / Math.max(1, LANE_COUNT - 1));
        return (
          <div
            key={item.id}
            className={`barrage-item absolute whitespace-nowrap text-[13px] sm:text-sm px-3 py-0.5 rounded-full border ${
              item.stance === 'pro'
                ? 'bg-cyan-50/35 border-cyan-200/30 text-cyan-600/85'
                : 'bg-rose-50/35 border-rose-200/30 text-rose-500/85'
            }`}
            style={{
              top: `${topPct}%`,
              left: '100%',
              animationDuration: `${item.duration}s`,
              animationDelay: `${item.delay}s`,
              ['--barrage-distance' as any]: distance,
              textShadow: '0 1px 2px rgba(255,255,255,0.9)',
            }}
          >
            <span className="font-medium">{item.text}</span>
          </div>
        );
      })}
    </div>
  );
}
