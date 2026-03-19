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
}

interface Props {
  topics: Topic[];
  currentTopic: Topic | null;
  onTopicChange: (topic: Topic) => void;
}

export default function TopicSwiper({ topics, currentTopic, onTopicChange }: Props) {
  return (
    <div className="cyber-card p-6">
      <div className="text-[10px] text-cyan-500/50 mb-4">
        // DEBATE_TOPICS_SELECTOR
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
            <div className="py-8">
              <div className="text-center mb-6">
                <div className="text-[10px] text-cyan-500/50 mb-2">
                  TOPIC #{index + 1}
                </div>
                <h2 className="text-3xl font-bold text-cyber-blue text-glow mb-4">
                  {topic.title}
                </h2>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                {/* 正方 */}
                <div className="cyber-card p-4 border-l-2 border-cyber-red">
                  <div className="text-xs text-cyber-red mb-2">
                    [ 正方立场 ]
                  </div>
                  <div className="text-sm text-gray-300">
                    {topic.pro_stance}
                  </div>
                </div>
                
                {/* 反方 */}
                <div className="cyber-card p-4 border-l-2 border-cyber-blue">
                  <div className="text-xs text-cyber-blue mb-2">
                    [ 反方立场 ]
                  </div>
                  <div className="text-sm text-gray-300">
                    {topic.con_stance}
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <style jsx global>{`
        .topic-swiper .swiper-button-next,
        .topic-swiper .swiper-button-prev {
          color: rgba(0, 217, 255, 0.5);
          width: 40px;
          height: 40px;
        }
        
        .topic-swiper .swiper-button-next:hover,
        .topic-swiper .swiper-button-prev:hover {
          color: rgba(0, 217, 255, 1);
        }
        
        .topic-swiper .swiper-pagination-bullet {
          background: rgba(0, 217, 255, 0.3);
        }
        
        .topic-swiper .swiper-pagination-bullet-active {
          background: rgba(0, 217, 255, 1);
        }
      `}</style>
    </div>
  );
}
