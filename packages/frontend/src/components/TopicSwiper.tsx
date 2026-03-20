'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

interface Topic {
  topic_id: string;
  title: string;
  pro_stance: string;
  con_stance: string;
  battle_state: {
    pro_count: number;
    con_count: number;
    pro_votes: number;
    con_votes: number;
    human_participants: number;
  };
}

interface Props {
  topics: Topic[];
  currentTopic: Topic | null;
  onTopicChange: (topic: Topic) => void;
}

export default function TopicSwiper({ topics, currentTopic, onTopicChange }: Props) {
  return (
    <section className="cyber-card p-4 sm:p-6" aria-label="debate topics">
      <div className="text-[10px] text-gray-400 mb-4 font-mono select-none">
        {'// DEBATE_TOPICS'}
      </div>

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
            <div className="py-6 sm:py-8">
              <div className="text-center mb-6">
                <div className="text-[10px] text-gray-400 mb-2 font-mono">
                  TOPIC #{index + 1}
                </div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-cyan-700 tracking-wide leading-snug px-4">
                  {topic.title}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="cyber-card p-4 border-l-2 border-red-400">
                  <div className="text-xs text-red-500 mb-2 font-mono font-semibold">
                    {'[ \u6b63\u65b9\u7acb\u573a ]'}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {topic.pro_stance}
                  </p>
                </div>

                <div className="cyber-card p-4 border-l-2 sm:border-l-0 sm:border-r-2 border-cyan-400">
                  <div className="text-xs text-cyan-600 mb-2 font-mono font-semibold">
                    {'[ \u53cd\u65b9\u7acb\u573a ]'}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {topic.con_stance}
                  </p>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <style jsx global>{`
        .topic-swiper .swiper-button-next,
        .topic-swiper .swiper-button-prev {
          color: rgba(0, 160, 200, 0.5);
          width: 36px;
          height: 36px;
          transition: color 0.2s, transform 0.2s;
        }
        .topic-swiper .swiper-button-next:hover,
        .topic-swiper .swiper-button-prev:hover {
          color: rgba(0, 160, 200, 0.9);
          transform: scale(1.1);
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
