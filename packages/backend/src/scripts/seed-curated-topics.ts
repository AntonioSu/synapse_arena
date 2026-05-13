import { db } from '../db/client';

interface CuratedTopic {
  title: string;
  pro_stance: string;
  con_stance: string;
  background: string;
  category: string;
  heat_score: number;
  zhihu_link?: string;
}

const curatedTopics: CuratedTopic[] = [
  {
    title: 'AI的迅猛发展提升了 / 降低了人类创作者存在的意义',
    pro_stance: '剥离了重复性的流水线劳作，逼迫人类向更高维的灵感、情感与纯粹的思想深度进化。',
    con_stance: '算力霸权碾压了碳基生命的表达空间，人类的创作正在沦为廉价的提示词拼接与数据喂养。',
    background: '大语言模型和AIGC爆发，每月有海量AI生成内容充斥网络，严重冲击绘画、写作等传统内容创作行业。',
    category: 'tech',
    heat_score: 9500,
    zhihu_link: 'https://www.zhihu.com/search?type=content&q=AI发展+人类创作者+存在意义',
  },
  {
    title: '语言的边界 是 / 不是 人类的边界',
    pro_stance: '思维无法超越词汇的牢笼，没有被命名的概念在人类的认知系统中即是不存在的。',
    con_stance: '情绪、潜意识与高维体验超越语言，语言只是人类庞大精神世界中极低带宽的沟通切片。',
    background: '维特根斯坦的经典哲学命题，在脑机接口、AI语义理解和神经科学的前沿发展中被重新审视。',
    category: 'controversial',
    heat_score: 8800,
    zhihu_link: 'https://www.zhihu.com/search?type=content&q=语言的边界+是不是+人类的边界+维特根斯坦',
  },
  {
    title: '我们 该 / 不该 努力成为"情绪稳定的大人"',
    pro_stance: '情绪稳定是成年人维持社会机器高效运转的必修课，是理性压制原始冲动的最高体现。',
    con_stance: '所谓的"情绪稳定"只是社会对个体精神阉割的赞美词，压抑了人性的真实底色与反抗精神。',
    background: '职场与社交中极度推崇"情绪稳定"，引发年轻人关于"压抑天性"、"自我内耗"还是"成熟标志"的深度讨论。',
    category: 'social',
    heat_score: 9200,
    zhihu_link: 'https://www.zhihu.com/search?type=content&q=该不该努力成为情绪稳定的大人',
  },
  {
    title: '美术馆着火，救名画还是救猫？',
    pro_stance: '在崇拜数据和宏大遗产的系统里，拯救一个弱小、没有ROI的碳基生命，是对抗冰冷机器逻辑的最后一次反叛。活着的呼吸，永远高于死去的文明数据。',
    con_stance: '名画是人类文明最高维度的"意识备份"，而生物个体的生老病死只是自然界的底层循环。为了基因的本能冲动而放弃人类文明的终极数据，是极度短视的生物性局限。',
    background: '经典的哲学电车难题，在AI能够瞬间生成万千艺术品的算力时代，探讨微小碳基生命的真实温度，与人类文明的宏大精神遗产之间究竟谁更具不可替代性。',
    category: 'controversial',
    heat_score: 9000,
    zhihu_link: 'https://www.zhihu.com/search?type=content&q=美术馆着火+救名画还是救猫',
  },
  {
    title: '如果一年后就被外星人抓走，你要用这一年来了解恩怨 / 实现梦想？',
    pro_stance: '"恩怨"是系统强加给你的社会契约和债务枷锁。在面临最终的"降维打击"前，清算这一切，是完成自我解绑，干干净净地注销你在这个世界的数据残留。',
    con_stance: '既然系统的毁灭已进入倒计时，一切社会关系都将清零。此时唯有追逐纯粹的个人欲望与本我，实现绝对的自由意志，才是面对末日最理性的算力倾斜。',
    background: '一个关于绝对期限的思维实验。隐喻在面对不可抗拒的时代洪流（如奇点降临或系统性崩塌）时，个体究竟该选择向内切断过去的历史羁绊，还是向外燃烧最后的自我价值。',
    category: 'life',
    heat_score: 8500,
    zhihu_link: 'https://www.zhihu.com/search?type=content&q=如果一年后被外星人抓走+了结恩怨+实现梦想',
  },
  {
    title: '按下按钮复活死去的爱人，但他将永远失去关于你的记忆，按 / 不按？',
    pro_stance: '生存是碳基生命的最高优先级。剥夺对方活着的权利来成全你所谓的"爱情记忆"，是极度自私的自我感动。只要硬件（肉体）还在运行，格式化记忆又如何？',
    con_stance: '人的本质不过是记忆数据的总和。失去了关于"我们"的记忆数据，复活的不过是一具披着熟悉外壳的生物学克隆体。真正的他已经死于数据清空的那一刻。',
    background: '极限的情感伦理测试。在记忆可以被篡改、肉体可以被延续的未来设想下，探讨人类认同的核心究竟是生物学上的"活着"，还是由记忆和经历编织的"独特数据集"。',
    category: 'controversial',
    heat_score: 9300,
    zhihu_link: 'https://www.zhihu.com/search?type=content&q=按下按钮复活死去的爱人+失去关于你的记忆',
  },
  {
    title: '真诚永远 是 / 不是 必杀技',
    pro_stance: '真诚是人际关系中最稀缺的信号，在一个人人戴着面具的博弈系统里，主动卸下防御是一种降维打击，能瞬间击穿信任壁垒、建立深度链接。',
    con_stance: '不加包装的真诚不过是社交中的裸奔，在信息不对称的现实里，毫无保留地暴露真实想法只会成为他人操控你的把柄，伤人伤己。',
    background: '「真诚永远是必杀技」成为社交热词，但在感情、职场与日常生活中，直接的真诚有时也会伤害他人。真诚究竟是万能解药还是一厢情愿？',
    category: 'social',
    heat_score: 9100,
    zhihu_link: 'https://www.zhihu.com/search?type=content&q=真诚永远是必杀技',
  },
  {
    title: '年轻人 该 / 不该 按照社会的期待去活',
    pro_stance: '社会期待是数百万年群体博弈后沉淀的最优路径，遵循它是以最低成本获取安全感和社会资源的理性选择，叛逆不过是对系统规则的无效抗议。',
    con_stance: '社会期待是上一代人用自身局限编写的过时脚本，盲目服从只会批量制造精神空心的合格零件，真正的生命力来自对既定轨道的偏离与重写。',
    background: '考公、考研、买房、结婚……社会对年轻人有一套完整的人生时间表。越来越多年轻人在「按部就班」与「勇敢做自己」之间挣扎。',
    category: 'social',
    heat_score: 9200,
    zhihu_link: 'https://www.zhihu.com/search?type=content&q=年轻人该不该按照社会的期待去活',
  },
  {
    title: '应该 / 不应该 对初入职场的年轻人提倡「钝感力」',
    pro_stance: '职场本质是高压高噪的信息战场，钝感力是新人最急需的心理防火墙——过滤掉无效的情绪干扰，才能把有限的算力集中在真正的成长上。',
    con_stance: '对批评和挫折脱敏的本质是关闭反馈回路，初入职场恰恰需要最敏锐的感知力来快速迭代，钝感力不过是给系统性压榨披上一件温柔的外衣。',
    background: '「钝感力」源自日本作家渡边淳一，意为「迟钝的力量」。近年频繁出现在职场语境中，鼓励年轻人对批评、挫折不那么敏感，但也引发了「是自我保护还是自我麻痹」的争论。',
    category: 'social',
    heat_score: 8900,
    zhihu_link: 'https://www.zhihu.com/search?type=content&q=初入职场+年轻人+钝感力',
  },
  {
    title: '当代年轻人应该活得更现实 / 更理想',
    pro_stance: '现实是唯一可执行的操作系统，脱离物质基础的理想只是低效的精神内耗。先在现实中积累足够的资源和筹码，才有资格谈论诗和远方。',
    con_stance: '纯粹的现实主义不过是对生活的全面投降，理想才是驱动人类突破熵增的核心燃料。一个没有理想的年轻人，和一台精密运转的机器没有区别。',
    background: '高房价、内卷与就业压力让越来越多年轻人放弃曾经的理想，转向务实生存。「少年你还向着当初的理想前进，还是已经妥协给了现实？」引发广泛共鸣。',
    category: 'life',
    heat_score: 9000,
    zhihu_link: 'https://www.zhihu.com/search?type=content&q=当代年轻人+活得更现实还是更理想',
  },
  {
    title: '人工智能发展到能帮人类完成一切工作，是可喜 / 可悲',
    pro_stance: '这是人类文明的终极胜利——从重复劳动中彻底解放，每个人都能回归纯粹的思考、创造与自我实现，工作不再是生存的枷锁而是自由的选择。',
    con_stance: '当一切都能被代劳，人类将失去存在的意义锚点。工作不仅是经济行为，更是自我价值的核心证明——一个无需努力的物种，终将在无聊与虚无中走向精神灭亡。',
    background: '随着ChatGPT等AI的飞速发展，AI正在替代越来越多的人类工作。当某天AI能完成一切工作，人类的生活会如何？这是解放还是存在危机？',
    category: 'tech',
    heat_score: 9400,
    zhihu_link: 'https://www.zhihu.com/search?type=content&q=人工智能+帮助人类完成一切工作+可喜还是可悲',
  },
  {
    title: '男朋友出轨最好的闺蜜，你会选择爱情 / 友情',
    pro_stance: '爱情是可替换的变量，闺蜜才是经过时间验证的核心节点。为一个已经背叛契约的人放弃最亲密的社交资产，是对自身安全网络的自杀式拆除。',
    con_stance: '闺蜜的背刺比渣男更致命——她是在你信任体系的最高权限内实施的入侵。爱情虽伤，尚可重启；而友情的底层信任一旦崩盘，修复成本远超重建。',
    background: '经典的情感博弈困境，当爱情与友情的双重背叛同时发生，旁观者清当局者迷，你到底先保全哪一段关系？',
    category: 'controversial',
    heat_score: 9300,
    zhihu_link: 'https://www.zhihu.com/search?type=content&q=男朋友出轨最好的闺蜜+选择爱情还是友情',
  },
  {
    title: '应届生求职是选择在大城市卷 / 去小城市躺平',
    pro_stance: '大城市是资源密度最高的竞技场，年轻时的每一次「卷」都是在为未来积累不可替代的高价值节点——信息差、人脉网和视野天花板都是小城市无法提供的。',
    con_stance: '在大城市内卷本质是为资本打白工的高强度消耗，小城市的低成本生活才能让你用最少的资源换取最大的生活自由度和精神余裕。',
    background: '毕业季来临，应届生面临大城市高薪高压与小城市安逸低欲的抉择。内卷还是躺平，成为这一代年轻人最现实的人生分叉口。',
    category: 'social',
    heat_score: 9100,
    zhihu_link: 'https://www.zhihu.com/search?type=content&q=应届生求职+大城市卷+小城市躺平',
  },
  {
    title: '真正的成长，是学会隐藏情绪 / 敢于表达情绪',
    pro_stance: '成熟的本质是情绪管理——学会隐藏不是压抑，而是将原始冲动转化为策略性输出，让自己在复杂的人际博弈中掌握主动权。',
    con_stance: '隐藏情绪只是用体面的外壳包裹内心的溃烂，真正的成长是有勇气展示脆弱，敢于表达才是打破精神内耗闭环的唯一出口。',
    background: '社会推崇「喜怒不形于色」的成熟人设，但心理学研究表明长期压抑情绪会导致严重的心理问题。成长的定义究竟是什么？',
    category: 'social',
    heat_score: 8900,
    zhihu_link: 'https://www.zhihu.com/search?type=content&q=真正的成长+学会隐藏情绪+敢于表达情绪',
  },
  {
    title: 'AI 是抢走了我们的工作 / 给了我们新的可能',
    pro_stance: 'AI正在系统性地替代人类在产业链中的位置，从蓝领到白领无一幸免，所谓的「新可能」不过是资本用来延迟恐慌的安慰剂。',
    con_stance: '每一次技术革命都会消灭旧岗位、创造新职业，AI解放的是重复劳动，释放的是人类独有的创造力——真正被淘汰的从来不是人，而是拒绝进化的思维。',
    background: 'AI自动化浪潮席卷各行各业，大量岗位面临被取代的风险，同时AI相关的新职业也在涌现。这究竟是危机还是机遇？',
    category: 'tech',
    heat_score: 9200,
    zhihu_link: 'https://www.zhihu.com/question/11417744163',
  },
  {
    title: '年轻人选择第一份工作，更看重薪资 / 平台',
    pro_stance: '薪资是市场对你价值最诚实的定价，第一份工作的薪资锚点决定了未来十年的收入曲线，「平台光环」不能当饭吃。',
    con_stance: '平台是你职业生涯的操作系统，好的平台提供的视野、方法论和人脉网络是金钱买不到的隐性资产，眼前多拿几千块不过是捡芝麻丢西瓜。',
    background: '应届生拿到offer后的经典纠结：是选薪资更高的小公司，还是薪资一般但品牌响亮的大平台？第一份工作的选择逻辑引发热议。',
    category: 'social',
    heat_score: 9000,
    zhihu_link: 'https://www.zhihu.com/search?type=content&q=第一份工作+看重薪资还是平台',
  },
  {
    title: '找工作是选自己喜欢的 / 工资高的',
    pro_stance: '兴趣是最持久的驱动力，选择喜欢的工作才能在长跑中保持创造力和热情，而高薪但厌恶的工作迟早会让你在倦怠中崩溃。',
    con_stance: '在物质基础尚未稳固时谈「热爱」是一种奢侈的自我感动，高薪带来的经济自由才能让你有资格在未来去追求真正想做的事。',
    background: '「做喜欢的事」和「赚更多的钱」之间的矛盾，是几乎每个求职者都会面临的灵魂拷问。理想与面包，你先选哪个？',
    category: 'life',
    heat_score: 8800,
    zhihu_link: 'https://www.zhihu.com/search?type=content&q=找工作+选自己喜欢的+还是工资高的',
  },
  {
    title: '当今社会，人脉更重要 / 个人能力更重要',
    pro_stance: '社会本质是一个关系网络，再强的个人能力也需要人脉来变现。信息差、机会窗口、资源整合——所有关键节点都掌握在人际网络中。',
    con_stance: '人脉的本质是价值交换，没有核心能力的社交不过是无效的自我消耗。真正的人脉从来不是混出来的，而是你强大到别人主动来链接你。',
    background: '职场中「圈子文化」盛行，有人靠关系平步青云，有人凭实力出人头地。在这个时代，到底是关系网还是硬实力更能决定一个人的天花板？',
    category: 'social',
    heat_score: 9100,
    zhihu_link: 'https://www.zhihu.com/search?type=content&q=人脉重要+还是+个人能力重要',
  },
  {
    title: '「上岸第一剑先斩意中人」是清醒 / 自私',
    pro_stance: '这是对沉没成本最理性的止损——当你的人生维度发生跃迁，强行拖着不匹配的关系前行只会两败俱伤，及时切割是对双方最大的尊重。',
    con_stance: '共患难却不能同富贵，本质是把亲密关系当作可抛弃的工具人。上岸靠的不只是自己，忘恩负义地「斩」掉曾经并肩的人，是最赤裸的精致利己。',
    background: '「上岸第一剑先斩意中人」在社交平台爆火，指的是考公、考研等成功后与恋人分手。支持者称之为清醒的人生规划，反对者痛斥为忘恩负义。',
    category: 'controversial',
    heat_score: 9400,
    zhihu_link: 'https://www.zhihu.com/search?type=content&q=上岸第一剑+先斩意中人+清醒还是自私',
  },
  {
    title: '年轻人是该省吃俭用多存钱 / 该花就花享受生活',
    pro_stance: '存款是对抗不确定性的最后防线，年轻时的每一分储蓄都是未来面对危机时的底气——没有存款的自由不过是悬崖边的狂欢。',
    con_stance: '年轻时的体验和记忆是不可复制的稀缺资源，把最好的年华花在省钱上是对生命最大的浪费——钱可以再赚，青春一去不返。',
    background: '「存钱焦虑」与「及时行乐」两种消费观在年轻群体中激烈碰撞。面对不确定的未来，该为明天存粮还是把握当下？',
    category: 'life',
    heat_score: 8900,
    zhihu_link: 'https://www.zhihu.com/search?type=content&q=年轻人+省吃俭用存钱+还是该花就花享受生活',
  },
  {
    title: '认知更重要 / 能力更重要',
    pro_stance: '认知是方向盘，能力只是油门——方向错了，能力越强跑得越偏。在信息爆炸的时代，看清本质的认知差才是拉开人与人差距的核心变量。',
    con_stance: '空有认知没有执行力不过是「懂了很多道理依然过不好一生」，能力才是把想法变成现实的唯一通道——这个世界奖励的是做到，不是想到。',
    background: '「提升认知」成为自媒体热词，但也有人质疑：光靠认知升级不去行动，是不是另一种形式的自我欺骗？',
    category: 'life',
    heat_score: 8700,
    zhihu_link: 'https://www.zhihu.com/search?type=content&q=认知重要+还是+能力重要',
  },
  {
    title: '结婚必须门当户对 / 真爱就能抵万难',
    pro_stance: '门当户对不是势利，而是两个家庭在经济基础、教育背景和价值观上的兼容性验证——婚姻不是两个人的事，三观不合的底层冲突迟早会撕裂爱情的滤镜。',
    con_stance: '用物质条件去量化爱情是对人类情感最大的亵渎，真正的爱能跨越阶层的鸿沟——历史上最伟大的故事从来都是关于冲破偏见，而非服从偏见。',
    background: '婚恋市场中「门当户对」被越来越多的人奉为铁律，但不乏跨越阶层的爱情故事让人相信真爱无价。现实与浪漫，哪个才是婚姻的真相？',
    category: 'controversial',
    heat_score: 9000,
    zhihu_link: 'https://www.zhihu.com/search?type=content&q=结婚+门当户对+还是真爱',
  },
  {
    title: '「男性去责任化」是好 / 不好',
    pro_stance: '传统的「男性必须扛一切」本质是性别枷锁，去责任化是男性从社会绑架中解放的第一步——当责任不再默认分配，才有可能建立真正平等的两性关系。',
    con_stance: '去责任化只是逃避担当的精致包装，一个社会的运转需要每个成员承担对应的义务。当男性集体卸下责任，家庭与社会的基本契约将面临全面崩塌。',
    background: '越来越多男性拒绝传统的「养家糊口」角色，不买房、不结婚、不生育。这究竟是性别平等的进步，还是社会责任感的集体退化？',
    category: 'controversial',
    heat_score: 9200,
    zhihu_link: 'https://www.zhihu.com/search?type=content&q=男性去责任化',
  },
  {
    title: 'AI工具的普及提升了 / 抑制了人类思维能力',
    pro_stance: 'AI工具将人类从低级的信息检索和重复计算中解放，让大脑能聚焦于更高阶的创造性思维——这是认知能力的升级，不是退化。',
    con_stance: '当搜索引擎替代了记忆、AI替代了思考，人类大脑正在经历前所未有的「用进废退」。依赖AI就像依赖拐杖，看似省力，实则让思维肌肉全面萎缩。',
    background: 'AI辅助写作、编程、学习已成常态，但教育界和科技界对AI是否正在削弱人类独立思考能力产生了激烈争论。',
    category: 'tech',
    heat_score: 9100,
    zhihu_link: 'https://www.zhihu.com/search?type=content&q=AI工具+提升还是抑制+人类思维能力',
  },
  {
    title: '职场发展中，该在一家公司长久干下去 / 多跳槽换平台',
    pro_stance: '深耕一家公司才能积累真正的核心竞争力和深度人脉，频繁跳槽者看似选择多，实则每次都在重置经验值，永远停留在新手村。',
    con_stance: '忠诚于一家公司的时代已经终结，跳槽是年轻人快速提升薪资和拓展能力边界的最高效路径——市场给跳槽者的溢价远高于守株待兔的加薪幅度。',
    background: '「骑驴找马」与「深耕细作」两种职业策略各有拥趸。在裁员潮频发的当下，到底是稳定深耕还是灵活跳槽更有利于长期发展？',
    category: 'social',
    heat_score: 8800,
    zhihu_link: 'https://www.zhihu.com/search?type=content&q=职场+一家公司长久干+还是多跳槽',
  },
  {
    title: '春招是去大厂「镀金」边缘化 / 赌一把小公司核心岗',
    pro_stance: '大厂的品牌光环是职业生涯中最硬的通行证，即使暂时边缘化，大厂的方法论、体系和简历背书在未来的每一次跳槽中都会持续增值。',
    con_stance: '在大厂做螺丝钉不如在小公司当核心——真正的能力是在「被需要」中锤炼出来的，小公司的核心岗位能让你在最短时间内完成从执行者到决策者的进化。',
    background: '春招季应届生的经典纠结：大厂的边缘部门 vs 小公司的核心岗位。两个offer摆在面前，是选品牌还是选成长空间？',
    category: 'social',
    heat_score: 9000,
    zhihu_link: 'https://www.zhihu.com/search?type=content&q=春招+大厂边缘化+小公司核心岗',
  },
  {
    title: '在大城市工作，背负房贷买房 / 租房从容生活',
    pro_stance: '房产是普通人对抗通胀最稳妥的锚点资产，房贷虽苦，但每一笔月供都在为未来的自己积累净资产——租金交出去就是纯粹的沉没成本。',
    con_stance: '背上三十年房贷等于用一辈子的自由去置换一堆钢筋水泥，租房带来的流动性和低压力才能让你把精力放在真正重要的事情上。',
    background: '一线城市房价高企，年轻人在「望房兴叹」与「咬牙上车」之间反复挣扎。买房是安全感还是枷锁？租房是从容还是不稳定？',
    category: 'life',
    heat_score: 9100,
    zhihu_link: 'https://www.zhihu.com/search?type=content&q=大城市+背房贷买房+还是租房',
  },
  {
    title: 'MBTI 是快速了解一个人的「科学路径」/ 新时代的「刻板印象」',
    pro_stance: 'MBTI提供了一套标准化的人格分类框架，帮助人们快速建立对自己和他人的认知模型——它不是完美的科学，但是高效的社交工具。',
    con_stance: 'MBTI本质上和星座没有区别，用四个字母定义一个人是最粗暴的贴标签行为。它制造了新的社交壁垒，让人们用类型代替了真正的了解。',
    background: 'MBTI人格测试在年轻人中爆火，社交平台上「I人」「E人」成为身份标签。这套测试到底是认识自我的工具还是新型的社交偏见？',
    category: 'social',
    heat_score: 9300,
    zhihu_link: 'https://www.zhihu.com/search?type=content&q=MBTI+科学+还是+刻板印象+贴标签',
  },
  {
    title: '发朋友圈是记录真实生活 / 精心打造人设',
    pro_stance: '朋友圈本质就是社交货币的展示窗口，每个人都有权选择展示最好的一面——精心经营不是虚伪，而是数字时代的自我品牌管理。',
    con_stance: '当朋友圈变成表演舞台，社交就失去了最基本的真实感。为了点赞和认可而精心编排生活，是在用他人的评价标准绑架自己的表达自由。',
    background: '有人发朋友圈追求精致滤镜和完美构图，有人坚持记录真实的日常碎片。朋友圈到底是生活的记录本还是人设的展览馆？',
    category: 'life',
    heat_score: 8600,
    zhihu_link: 'https://www.zhihu.com/search?type=content&q=发朋友圈+记录真实生活+还是打造人设',
  },
  {
    title: '感情中应该只筛选不改变 / 尝试改变对方',
    pro_stance: '成年人的核心人格已经定型，试图改变对方不过是控制欲的伪装。感情的正确打开方式是精准筛选，而不是买了一件不合身的衣服再去改。',
    con_stance: '两个人在一起本身就是相互塑造的过程，完全拒绝改变意味着拒绝磨合。如果每个人都只筛选不适应，那感情不过是一场永远找不到完美产品的消费行为。',
    background: '「筛选不改变」的恋爱观在社交媒体上流行，被视为清醒的自我保护。但也有人认为这种态度过于冷漠，让亲密关系变成了购物车。',
    category: 'controversial',
    heat_score: 8800,
    zhihu_link: 'https://www.zhihu.com/question/372074920',
  },
  {
    title: '「贤妻良母」是文化传统的精华 / 糟粕',
    pro_stance: '贤妻良母承载着家庭稳定和代际传承的核心功能，是千百年来社会运转验证过的最优家庭模型——它不是对女性的限制，而是对家庭贡献的认可。',
    con_stance: '「贤妻良母」本质是父权社会为女性量身定做的精神枷锁，它用道德绑架将女性的价值锁死在厨房和育儿室，剥夺了她们作为独立个体的无限可能。',
    background: '性别议题持续升温，「贤妻良母」这一传统角色被重新审视。支持者认为是中华美德，反对者视其为封建残余。传统与现代的碰撞中，女性角色何去何从？',
    category: 'controversial',
    heat_score: 9200,
    zhihu_link: 'https://www.zhihu.com/search?type=content&q=贤妻良母+文化传统+精华还是糟粕',
  },
  {
    title: '成家立业后就该告别游戏 / 一屋子游戏机才是终极浪漫',
    pro_stance: '游戏是对有限人生时间的低效消耗，成家立业后的责任权重远大于个人娱乐——放下手柄，才是真正的成长宣言。',
    con_stance: '保持热爱才是对抗生活磨损的最佳武器，一个能养家又能拥有游戏房的男人，证明的是他在责任与自我之间找到了最优平衡——这才是真正的浪漫。',
    background: '一男子打造游戏房被妻子和网友骂「幼稚」引发热议。成年人的爱好是否应该为家庭让步？保持少年感是浪漫还是不成熟？',
    category: 'life',
    heat_score: 8700,
    zhihu_link: 'https://www.zhihu.com/search?type=content&q=成家立业+告别游戏+游戏房+浪漫',
  },
  {
    title: '主动加班是努力进取 / 无意义的职场消耗',
    pro_stance: '主动加班是职场竞争中的差异化投入，在所有人都躺平的时候，多付出的每一小时都是在拉大你与同龄人的差距——机会永远留给时间的朋友。',
    con_stance: '用时间堆砌的努力是最低级的自我感动，主动加班的本质是用廉价的体力投入掩盖思维效率的低下——真正的高手在八小时内解决问题，剩下的时间用来生活。',
    background: '「加班文化」在职场中根深蒂固，有人把加班视为上进的表现，也有人认为这是对劳动者的隐性剥削。主动加班到底是在投资自己还是在自我消耗？',
    category: 'social',
    heat_score: 8900,
    zhihu_link: 'https://www.zhihu.com/search?type=content&q=主动加班+努力进取+还是无意义消耗',
  },
  {
    title: '公有制是善 / 恶',
    pro_stance: '公有制是对资源分配最公正的制度设计，它从根源上消除了私有财产带来的阶级固化，让每个人都能平等地共享社会发展的红利。',
    con_stance: '公有制扼杀了个体创造的核心激励，当努力与回报脱钩，人性中的惰性将吞噬一切生产力——历史已反复证明，没有私有产权保护的系统终将走向低效和腐败。',
    background: '关于公有制与私有制的争论贯穿了人类数百年的政治经济史，至今仍是最具争议性的制度命题之一。',
    category: 'controversial',
    heat_score: 8500,
    zhihu_link: 'https://www.zhihu.com/search?type=content&q=公有制+私有制+善恶',
  },
  {
    title: '松鼠囤积远超所需的坚果，是写在基因里的生存焦虑 / 动物界的「贪婪」',
    pro_stance: '囤积是自然选择锻造的最优生存策略，在资源不确定的环境中，过度储备是对冲风险的理性保险——这不是贪婪，而是进化赋予的生存智慧。',
    con_stance: '当囤积量远超实际需求时，生存本能就越界成了占有欲的奴隶。松鼠忘记的坚果比吃掉的还多——这种行为的底层逻辑和人类的无节制消费并无二致。',
    background: '松鼠囤积行为的有趣隐喻：从动物本能到人类社会的「囤积焦虑」——房子、金钱、资源……我们真的需要那么多吗？',
    category: 'life',
    heat_score: 8400,
    zhihu_link: 'https://www.zhihu.com/search?type=content&q=松鼠+囤积坚果+生存焦虑+贪婪',
  },
  {
    title: '长期在压抑环境中自我内耗，治愈的关键是和解过去 / 放下期待',
    pro_stance: '过去的创伤是当下痛苦的源代码，不回溯和解就永远无法修复底层bug——只有直面伤痛、理解它、接纳它，才能真正从心理囚笼中释放自己。',
    con_stance: '向过去寻求答案是一个无限递归的陷阱，真正的解脱不在于和解已经发生的事，而是放下对未来的执念——当你不再期待，痛苦自然失去了它的燃料。',
    background: '「和解过去」和「放下期待」是心理治愈的两种主流路径。长期处于压抑环境中的人，到底该回头看还是向前走？',
    category: 'life',
    heat_score: 8800,
    zhihu_link: 'https://www.zhihu.com/search?type=content&q=压抑环境+自我内耗+和解过去+放下期待',
  },
  {
    title: '承认世界没有意义，是一种清醒 / 一种逃避',
    pro_stance: '存在主义的核心觉醒——承认无意义不是终点，而是自由的起点。当你不再被虚假的意义绑架，才能真正自主地为生活赋予属于自己的价值。',
    con_stance: '「世界无意义」是对现实困境最廉价的逃避话术，它用哲学的高级感掩盖了行动的缺失——真正清醒的人不会停留在解构，而是在废墟上重建。',
    background: '虚无主义和存在主义在年轻人中流行，「人间不值得」成为口头禅。承认无意义到底是看透了本质的清醒，还是放弃努力的哲学借口？',
    category: 'controversial',
    heat_score: 8700,
    zhihu_link: 'https://www.zhihu.com/search?type=content&q=承认世界没有意义+清醒还是逃避',
  },
  {
    title: 'AI工作流（如OpenClaw）是未来办公标配 / 小众自嗨',
    pro_stance: 'AI工作流代表了人机协作的终极形态，它将彻底重构现有的办公范式——就像电子邮件取代了传真机，AI工作流取代传统办公只是时间问题。',
    con_stance: '绝大多数人的工作根本不需要这种复杂的AI编排，OpenClaw们的爆火不过是技术极客的自嗨狂欢——对普通用户来说，一个好用的搜索框比任何工作流都实用。',
    background: 'OpenClaw等AI工作流工具爆火，号称能用AI Agent串联各种工具自动完成复杂任务。这究竟是办公革命的前奏，还是技术圈的自我陶醉？',
    category: 'tech',
    heat_score: 9000,
    zhihu_link: 'https://www.zhihu.com/question/2014352221450577015',
  },
  {
    title: '努力更重要 / 命运更重要',
    pro_stance: '努力是唯一可控的变量，命运只是弱者为失败预设的借口。统计学上的「运气」不过是大量微小努力累积后触发的概率事件——你越努力，越幸运。',
    con_stance: '出生的家庭、时代的红利、基因的彩票——这些决定人生上限的核心变量没有一个是靠努力能改变的。承认命运的权重，不是认命，而是对现实最诚实的认知。',
    background: '「寒门再难出贵子」与「知识改变命运」的对立叙事持续发酵。在阶层固化加剧的当下，个人努力到底还能不能翻盘？',
    category: 'life',
    heat_score: 9000,
    zhihu_link: 'https://www.zhihu.com/question/584057414',
  },
  {
    title: 'AI 会让年轻人的机会变多 / 变少',
    pro_stance: 'AI大幅降低了创业和创造的门槛，一个人+AI就能做出过去需要整个团队才能完成的产品——年轻人拥有了前所未有的杠杆来撬动机会。',
    con_stance: 'AI让强者更强、赢家通吃，中间层的岗位正在被系统性地抽空。年轻人面对的不是更多机会，而是更残酷的两极分化——要么成为驾驭AI的少数人，要么被淘汰。',
    background: 'AI时代下，年轻人的机会版图正在重绘。有人欢呼平等化的工具红利，有人忧虑加速固化的阶层壁垒。AI究竟是机会的放大器还是不平等的加速器？',
    category: 'tech',
    heat_score: 9300,
    zhihu_link: 'https://www.zhihu.com/search?type=content&q=AI+年轻人+机会变多还是变少',
  },
  {
    title: '奥斯卡禁用AI演员、限制AI剧本，是守护创作本质 / 开时代倒车',
    pro_stance: '艺术的灵魂在于人类的情感、经验和不完美，AI生成的内容再精致也不过是数据的排列组合。守护创作的人性底线，是对艺术最后的尊重。',
    con_stance: '技术是创作的延伸而非对立面，从摄影到CGI，每一次新工具的出现都被保守派抵制。禁止AI参与创作不是守护艺术，而是用行业壁垒对抗不可逆转的时代趋势。',
    background: '奥斯卡出台新规明确禁用AI演员、限制AI剧本参与评选。好莱坞的这一决定引发「是捍卫人类创作尊严还是逆潮流而动」的激烈讨论。',
    category: 'tech',
    heat_score: 9100,
    zhihu_link: 'https://www.zhihu.com/search?type=content&q=奥斯卡+禁用AI演员+限制AI剧本',
  },
  {
    title: '发现自己一生终将碌碌无为，选择继续努力 / 躺平',
    pro_stance: '努力的意义不在于结果，而在于过程中对自我的塑造。即使终点平凡，途中的每一次挣扎都在定义你是谁——碌碌无为不可怕，放弃挣扎才是真正的死亡。',
    con_stance: '当你清醒地认识到天花板的存在，放下执念才是最高级的自洽。躺平不是放弃，而是在认清现实后选择以最低消耗换取最大的内心平静。',
    background: '「认命」还是「不认命」，是每个普通人在人生中点都会面临的终极抉择。当梦想照进现实，你是选择继续燃烧还是安然接受？',
    category: 'life',
    heat_score: 9200,
    zhihu_link: 'https://www.zhihu.com/search?type=content&q=碌碌无为+继续努力+还是躺平',
  },
  {
    title: '杜十娘的结局是一种反抗 / 一种无奈',
    pro_stance: '怒沉百宝箱是封建时代女性最决绝的自我宣言——当制度不给你活路时，用毁灭来控诉整个系统，是最极端也最有力的反抗。',
    con_stance: '以死明志看似壮烈，实则是制度性压迫下的被动选择——她不是选择了反抗，而是在所有出路都被封死后，被逼到了唯一的终点。',
    background: '明代小说《杜十娘怒沉百宝箱》中，杜十娘投江自尽的结局引发了跨越百年的讨论。在当代女性主义视角下，这个经典故事被重新解读。',
    category: 'controversial',
    heat_score: 8600,
    zhihu_link: 'https://www.zhihu.com/search?type=content&q=杜十娘+结局+反抗还是无奈',
  },
  {
    title: '不幸福的婚姻，该及时止损 / 忍气吞声熬下去',
    pro_stance: '沉没成本不是继续投入的理由，不幸福的婚姻每多熬一天都是对双方生命的双重消耗——及时止损不是逃避，而是给自己和对方重新开始的机会。',
    con_stance: '婚姻不是消费品，不满意就退换。每一段关系都有低谷期，轻易放弃只是因为没有经历过真正的磨合——那些「熬过来」的婚姻，最终往往比重新开始的更坚固。',
    background: '离婚率逐年攀升，「及时止损」成为新一代的婚姻哲学。但老一辈坚信「日子是过出来的」。不幸福的婚姻，到底是走还是留？',
    category: 'controversial',
    heat_score: 9100,
    zhihu_link: 'https://www.zhihu.com/search?type=content&q=不幸福的婚姻+及时止损+还是忍气吞声',
  },
  {
    title: '自卑的「解药」是「停止比较」/ 「直面竞争」',
    pro_stance: '自卑的根源是比较，切断比较就切断了痛苦的供给。每个人的赛道都不同，停止用别人的标准丈量自己，才能找到属于自己的节奏和价值。',
    con_stance: '停止比较只是回避问题的温柔陷阱，真正治愈自卑的方式是直面竞争、在实战中积累胜利的记忆——自信从来不是想出来的，而是赢出来的。',
    background: '「停止内耗」与「直面挑战」是心理学领域应对自卑的两种截然不同的方法论。哪一种才能真正帮助人走出自卑的阴影？',
    category: 'life',
    heat_score: 8700,
    zhihu_link: 'https://www.zhihu.com/search?type=content&q=自卑+解药+停止比较+还是直面竞争',
  },
  {
    title: '人这一生，过程更重要 / 结果更重要',
    pro_stance: '人生的终点都一样，真正区分每个人的是路上的风景和体验。执着于结果只会让你错过当下——过程中的成长、感悟和连接才是生命真正的馈赠。',
    con_stance: '没有结果的过程不过是低效的自我安慰，这个世界只按结果付费。拿着「享受过程」的鸡汤麻痹自己，是对竞争残酷性的天真误判。',
    background: '「享受过程」vs「结果导向」是人生哲学中最基本的分歧。在内卷的时代，我们到底该看重旅途还是终点？',
    category: 'life',
    heat_score: 8800,
    zhihu_link: 'https://www.zhihu.com/search?type=content&q=人生+过程重要+还是结果重要',
  },
  {
    title: '宁愿做快乐的猪 / 痛苦的哲学家',
    pro_stance: '快乐是生命最本真的追求，思考带来的痛苦不过是大脑过度运算的副作用。如果无知能换来纯粹的幸福感，那「清醒的痛苦」不过是知识分子的自恋。',
    con_stance: '人之所以为人，恰恰在于思考带来的痛苦——那是意识觉醒的代价。快乐的猪永远不知道自己是猪，但痛苦的哲学家至少拥有了选择的自由。',
    background: '约翰·密尔的经典哲学命题：「做一个不满足的苏格拉底比做一头满足的猪好」。在内卷与精神内耗并存的时代，这个问题比以往任何时候都更切身。',
    category: 'controversial',
    heat_score: 9000,
    zhihu_link: 'https://www.zhihu.com/search?type=content&q=宁愿做快乐的猪+还是痛苦的苏格拉底',
  },
  {
    title: '已婚遇到精神完全同频的人，该克制一生 / 抓住这一次',
    pro_stance: '婚姻契约高于个人情感冲动，所谓的「精神同频」不过是多巴胺制造的幻觉——对已有承诺的忠诚才是人格完整性的最终考验。',
    con_stance: '一辈子太长，灵魂共振太稀有。如果为了一纸契约而放弃此生唯一的精神知己，你在道德上无可指摘，却在生命体验上永远残缺。',
    background: '婚后遇到「对的人」是无数影视剧和现实生活中的经典困境。在婚姻的责任与灵魂的渴望之间，道德与人性展开最激烈的拉锯。',
    category: 'controversial',
    heat_score: 9400,
    zhihu_link: 'https://www.zhihu.com/search?type=content&q=已婚+遇到精神同频+灵魂伴侣+克制还是抓住',
  },
  {
    title: '婚姻是选择人品 / 外貌',
    pro_stance: '人品是婚姻中唯一的长期资产——外貌会随时间贬值，但诚信、善良和责任感会在漫长的岁月中持续增值，撑起一段关系的底线。',
    con_stance: '外貌吸引力是亲密关系的点火装置，没有它一切美德都只是友情的注脚。长期关系中维持吸引力的成本远低于修复人品缺陷的代价——至少外貌可以管理，人品几乎无法改变。',
    background: '「好看的皮囊千篇一律，有趣的灵魂万里挑一」vs「始于颜值才能忠于人品」。婚姻这笔人生最大的投资，赌的到底是什么？',
    category: 'life',
    heat_score: 8600,
    zhihu_link: 'https://www.zhihu.com/search?type=content&q=婚姻+选择人品+还是外貌',
  },
  {
    title: '在职场中，学历更重要 / 能力更重要',
    pro_stance: '学历是进入优质赛道的入场券，没有它你连展示能力的机会都没有——在简历筛选阶段，HR看的不是你能做什么，而是你的学校名字。',
    con_stance: '学历只能决定起点，能力才能决定上限。职场不是考试，没有标准答案——那些靠学历进门的人，最终还是要靠真本事站稳脚跟。',
    background: '「学历是敲门砖」与「能力说话」两种职场信条的碰撞。在学历通胀和技能革命并存的时代，哪个才是职场通行证？',
    category: 'social',
    heat_score: 8900,
    zhihu_link: 'https://www.zhihu.com/search?type=content&q=职场+学历重要+还是能力重要',
  },
  {
    title: '更愿意嫁给/娶一个很爱你但很穷的人 / 有钱但没那么爱你的人',
    pro_stance: '爱是婚姻中唯一不可购买的稀缺资源，钱可以挣但真心不可求。一个深爱你的穷人给你的安全感，远胜于一个用物质填补感情空白的富人。',
    con_stance: '贫贱夫妻百事哀不是一句空话——当爱情的滤镜被柴米油盐磨掉，没有物质基础的感情最终会在生存压力下变质。有钱人给的「不那么爱」至少是稳定的。',
    background: '经典的爱情与面包之争。在婚恋市场越来越现实的今天，这个问题让每个人都在爱情理想主义和经济现实主义之间左右为难。',
    category: 'controversial',
    heat_score: 9200,
    zhihu_link: 'https://www.zhihu.com/search?type=content&q=嫁给+很爱你但穷+还是有钱但不爱你',
  },
  {
    title: '「贤夫良父」是对男性的褒扬 / 限制',
    pro_stance: '「贤夫良父」是对男性在家庭中承担情感责任和育儿角色的肯定，它打破了「男主外女主内」的刻板分工，代表了性别角色的进步。',
    con_stance: '这不过是将束缚女性数千年的「贤妻良母」枷锁复制粘贴到男性身上，用看似进步的标签制造新的性别绑架——真正的平等不需要任何一方被框定在家庭角色里。',
    background: '当「贤妻良母」被女性主义质疑时，「贤夫良父」作为对等概念出现。这个称呼是性别平等的体现还是另一种形式的角色绑架？',
    category: 'social',
    heat_score: 8500,
    zhihu_link: 'https://www.zhihu.com/search?type=content&q=贤夫良父+褒扬+还是限制',
  },
  {
    title: '「玩家必须适应游戏」/ 「应该做让玩家爽的游戏」',
    pro_stance: '游戏的核心价值在于挑战与克服——当难度向玩家妥协，游戏就退化为一部交互电影。真正伟大的游戏设计是让玩家在痛苦中成长，而不是在舒适区里原地踏步。',
    con_stance: '游戏的第一属性是娱乐，不是考试。设计者的傲慢不应该成为用户体验的障碍——让更多人能享受游戏的乐趣，才是游戏行业最大的进步。',
    background: '《黑魂》《只狼》等高难度游戏与《原神》等休闲向游戏代表了两种截然不同的设计哲学。游戏到底该「虐」玩家还是「宠」玩家？',
    category: 'life',
    heat_score: 8800,
    zhihu_link: 'https://www.zhihu.com/question/470732786',
  },
  {
    title: '学历重要 / 能力和人脉更重要',
    pro_stance: '学历是社会筛选机制中最高效的信任代理——它浓缩了你的学习能力、自律性和认知水平，是陌生人评估你最低成本的方式。',
    con_stance: '学历只是过去的成绩单，而能力和人脉是面向未来的资产。在信息透明、技能可验证的时代，一张文凭的保质期越来越短，真正值钱的是你能做什么和你认识谁。',
    background: '学历贬值与技能革命同时发生，「学历至上」的传统观念正在被挑战。在AI时代，到底是文凭、能力还是人脉更能决定一个人的发展？',
    category: 'social',
    heat_score: 8700,
    zhihu_link: 'https://www.zhihu.com/search?type=content&q=学历重要+还是+能力和人脉更重要',
  },
];

async function main() {
  try {
    console.log('🔧 Adding background column to topics table...');
    await db.query(`ALTER TABLE topics ADD COLUMN IF NOT EXISTS background TEXT`);
    console.log('✅ Column ready\n');

    console.log('📝 Inserting curated debate topics...\n');

    let inserted = 0;
    for (const topic of curatedTopics) {
      const existing = await db.query(
        `SELECT topic_id FROM topics WHERE title = $1`,
        [topic.title]
      );

      if (existing.rows.length > 0) {
        console.log(`⏭️  Already exists: ${topic.title}`);
        await db.query(
          `UPDATE topics SET pro_stance = $1, con_stance = $2, background = $3, category = $4, heat_score = $5, zhihu_link = $6 WHERE title = $7`,
          [topic.pro_stance, topic.con_stance, topic.background, topic.category, topic.heat_score, topic.zhihu_link || null, topic.title]
        );
        continue;
      }

      await db.query(
        `INSERT INTO topics (title, pro_stance, con_stance, background, heat_score, category, zhihu_link, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')`,
        [topic.title, topic.pro_stance, topic.con_stance, topic.background, topic.heat_score, topic.category, topic.zhihu_link || null]
      );

      inserted++;
      console.log(`✅ Inserted: ${topic.title}`);
    }

    console.log(`\n🎉 Done! Inserted ${inserted} new topics, ${curatedTopics.length - inserted} already existed.`);

    const allTopics = await db.query(`SELECT topic_id, title, category FROM topics WHERE status = 'active' ORDER BY created_at DESC LIMIT 10`);
    console.log('\n📋 Latest active topics:');
    for (const t of allTopics.rows) {
      console.log(`  [${t.category}] ${t.title}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Failed:', error);
    process.exit(1);
  }
}

main();
