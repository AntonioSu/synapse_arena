'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import BarrageBoard from './BarrageBoard';
import type { Topic } from '@/types';

interface Props {
  topics: Topic[];
  currentTopic: Topic | null;
  onTopicChange: (topic: Topic) => void;
}

export default function TopicSwiper({ topics, currentTopic, onTopicChange }: Props) {
  return (
    <section className="cyber-card p-4 sm:p-6 relative overflow-hidden" aria-label="debate topics">
      {currentTopic && <BarrageBoard topic={currentTopic} />}
      <Swiper
        modules={[Navigation, Pagination, EffectFade]}
        spaceBetween={30}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true }}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        onSlideChange={(swiper) => {
          onTopicChange(topics[swiper.activeIndex]);
        }}
        className="topic-swiper"
      >
        {topics.map((topic, index) => (
          <SwiperSlide key={topic.topic_id}>
            <div className="py-6 sm:py-8 bg-white">
              <div className="text-center mb-6">
                {topic.zhihu_link ? (
                  <a
                    href={topic.zhihu_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="topic-title-link inline-block"
                  >
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-cyan-700 tracking-wide leading-snug px-4">
                      {topic.title}
                    </h2>
                  </a>
                ) : (
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-cyan-700 tracking-wide leading-snug px-4">
                    {topic.title}
                  </h2>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="p-4 border-l-2 border-cyan-400 bg-cyan-50/40 rounded-r-sm">
                  <div className="text-xs text-cyan-600 mb-2 font-mono font-semibold">
                    {'[ 正方立场 ]'}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {topic.pro_stance}
                  </p>
                </div>

                <div className="p-4 border-l-2 sm:border-l-0 sm:border-r-2 border-rose-400 bg-rose-50/40 rounded-l-sm sm:rounded-l-none sm:rounded-r-sm">
                  <div className="text-xs text-rose-500 mb-2 font-mono font-semibold sm:text-right">
                    {'[ 反方立场 ]'}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed sm:text-right">
                    {topic.con_stance}
                  </p>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <style jsx global>{`
        .topic-title-link {
          text-decoration: none;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .topic-title-link h2 {
          text-decoration: none;
          border-bottom: 2px solid transparent;
          padding-bottom: 2px;
          transition: border-color 0.15s ease, color 0.15s ease;
          display: inline;
        }
        .topic-title-link:hover h2 {
          border-bottom-color: rgba(0, 160, 200, 0.6);
          color: rgb(0, 130, 170);
        }
        .topic-swiper {
          position: relative;
        }
        .topic-swiper .swiper-slide:not(.swiper-slide-active) {
          opacity: 0 !important;
          pointer-events: none;
        }
        .topic-swiper .swiper-button-next,
        .topic-swiper .swiper-button-prev {
          color: rgba(0, 160, 200, 0.5);
          width: 36px;
          height: 36px;
          top: 55px;
          transform: none;
          transition: color 0.2s;
        }
        .topic-swiper .swiper-button-prev {
          left: -4px;
        }
        .topic-swiper .swiper-button-next {
          right: -4px;
        }
        .topic-swiper .swiper-button-next:hover,
        .topic-swiper .swiper-button-prev:hover {
          color: rgba(0, 160, 200, 0.9);
        }
        .topic-swiper .swiper-button-next::after,
        .topic-swiper .swiper-button-prev::after {
          font-size: 18px;
          font-weight: bold;
        }
        .topic-swiper .swiper-pagination-bullet {
          background: rgba(0, 160, 200, 0.25);
          opacity: 1;
          width: 6px;
          height: 6px;
          transition: all 0.2s;
        }
        .topic-swiper .swiper-pagination-bullet-active {
          background: rgba(0, 160, 200, 0.8);
          width: 20px;
          border-radius: 3px;
        }
        @media (max-width: 640px) {
          .topic-swiper .swiper-button-next,
          .topic-swiper .swiper-button-prev {
            display: none;
          }
        }
      `}</style>
    </section>
  );
}
