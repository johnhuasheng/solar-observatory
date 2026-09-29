import type { BodyId } from "./planetData";

export type InteriorLayer = { name: string; detail: string; color: string };
export type ScienceEntry = {
  opening: string;
  surface: string;
  environment: string;
  interior: string;
  notice: string;
  layers: InteriorLayer[];
  source: string;
};

/** Short, deliberately qualitative descriptions adapted from NASA Science fact pages. */
export const SCIENCE: Record<BodyId, ScienceEntry> = {
  sun: {
    opening: "太阳占据太阳系绝大部分质量，是一颗以氢和氦为主的恒星。核心持续将氢聚变为氦，释放的能量驱动地球气候，也为整个太阳系提供光和热。",
    surface: "我们所说的“表面”是可见的光球，并非坚硬地面。明暗颗粒来自对流；活动区的磁场还能形成黑子、耀斑与日珥。",
    environment: "光球之外还有色球和极其稀薄的日冕。日冕向外延伸，太阳风持续影响整个太阳系的空间环境。",
    interior: "核心的高温高压使氢聚变成为可能。能量在辐射区多次被吸收和再释放，再由对流区翻涌的等离子体带向光球；外侧的色球和日冕属于太阳大气，不是固体壳层。",
    notice: "观察太阳的纹理和日冕时，这里的亮度经过压缩，以便在屏幕上看清细节。",
    layers: [{name:"光球与外层大气",detail:"可见光从光球离开，外侧延伸至日冕",color:"#f6b455"},{name:"对流区",detail:"热等离子体上下翻涌",color:"#ec7936"},{name:"辐射区",detail:"能量主要以辐射向外传递",color:"#cf4935"},{name:"核心",detail:"氢聚变释放能量",color:"#ffd59b"}],
    source:"https://science.nasa.gov/sun/facts/",
  },
  mercury: {
    opening:"水星是距离太阳最近、体积最小的行星，88 个地球日公转一周。它不像金星那样有浓密大气，因此即使更靠近太阳，夜侧仍会急剧降温。",
    surface:"古老的表面密布撞击坑，也能看到漫长的弧形悬崖。这些悬崖与行星内部冷却、整体轻微收缩有关。",
    environment:"水星没有地球式的大气，只有极稀薄的外逸层。太阳风和微陨石撞击会把表面原子带入其中。",
    interior:"水星的铁质核心相对整颗行星异常庞大，外面是较薄的硅酸盐地幔和地壳。探测器测得它仍有全球磁场，为研究核心状态提供线索；地表收缩悬崖则记录内部冷却。",
    notice:"寻找大小不一的撞击坑，以及跨越许多撞击坑的褶皱悬崖。",
    layers:[{name:"地壳",detail:"保存撞击坑和收缩悬崖",color:"#a9a69f"},{name:"岩石地幔",detail:"包围大型金属核心",color:"#776f69"},{name:"金属核心",detail:"相对半径占比很大",color:"#d3a06b"}],
    source:"https://science.nasa.gov/mercury/facts/",
  },
  venus: {
    opening:"金星的大小和密度与地球相近，却被浓密的二氧化碳大气包围。失控温室效应使其成为地表最热的行星，说明相近的岩石世界也可能拥有迥异的环境。",
    surface:"可见光下通常只能看见厚云顶。探测器利用雷达穿透云层，绘出火山平原、山地和复杂的地表。",
    environment:"大气以二氧化碳为主，云中含硫酸液滴。地表温度约 467°C，压力远高于地球海平面。",
    interior:"雷达测绘揭示广阔的火山地貌，但无法直接照见金星内部。其岩石地壳下预计是硅酸盐地幔和金属核心；地幔对流、核心状态与现今火山活动仍在研究。外层黄色区域表示厚云和大气。",
    notice:"眼前的黄色纹理表现云顶，不是能直接看到的金星地面。",
    layers:[{name:"浓密大气与云层",detail:"遮住可见光下的地表",color:"#edd6a4"},{name:"岩石地壳",detail:"雷达揭示火山与平原",color:"#b9895b"},{name:"地幔",detail:"高温岩石层",color:"#985d41"},{name:"金属核心",detail:"大小和状态仍在研究",color:"#e1a267"}],
    source:"https://science.nasa.gov/venus/venus-facts/",
  },
  earth: {
    opening:"地球是目前唯一确认存在生命的世界，也是太阳系中唯一已知有稳定地表液态海洋的行星。海洋、陆地、冰雪和变化的云层共同决定从太空看到的颜色。",
    surface:"海洋覆盖约七成表面。海岸线、岛链和海峡是陆地与海洋交错的真实地理细节；地壳板块的运动形成山脉和海沟。",
    environment:"大气主要由氮和氧组成。云层反射阳光，海洋和大气交换水与热；在背光半球，还能看到人类城市的灯光。",
    interior:"地壳由缓慢运动的板块组成，下面是可在漫长地质时间尺度流动的岩石地幔。更深处的液态铁质外核围绕固态内核；外核的导电流体运动产生地球的全球磁场。图中海洋与地壳合并显示。",
    notice:"旋转地球，比较欧非大陆边缘、地中海和红海，以及夜侧城市灯光。",
    layers:[{name:"地壳与海洋",detail:"板块、陆地和液态水",color:"#5d9a8b"},{name:"地幔",detail:"缓慢流动的硅酸盐岩石",color:"#ca7952"},{name:"液态外核",detail:"以铁、镍为主的流体",color:"#e0a45c"},{name:"固态内核",detail:"高压下的金属核心",color:"#f4cf8c"}],
    source:"https://science.nasa.gov/earth/facts/",
  },
  moon: {
    opening:"月球是地球唯一的天然卫星，与地球近乎潮汐锁定，因此我们在地面通常看到大致同一面。它几乎没有大气侵蚀，保留了漫长的撞击历史。",
    surface:"深色“月海”并没有水，而是古老撞击盆地被玄武质熔岩填满后形成的平原；较亮的高地保留更多撞击坑。",
    environment:"月球没有能像地球那样形成天气的浓厚大气，表面长期记录撞击历史。极区某些永久阴影区保存着水冰。",
    interior:"阿波罗计划布设的月震仪提供了研究内部的证据。月球分为地壳、硅酸盐地幔与相对较小的富铁核心；早期熔岩从内部上涌，填充撞击盆地形成今天的月海。",
    notice:"比较暗色月海和亮色高地，再寻找叠压在两者之上的环形山。",
    layers:[{name:"月壳",detail:"高地和月海位于最外层",color:"#c8c7c0"},{name:"地幔",detail:"以硅酸盐岩石为主",color:"#8f8e88"},{name:"小型核心",detail:"金属成分集中在中心",color:"#b99776"}],
    source:"https://science.nasa.gov/moon/facts/",
  },
  mars: {
    opening:"火星富含氧化铁的细尘让地表呈红色。它既有大型火山和峡谷，也保存了河道、三角洲和含水矿物等古代水活动的证据。",
    surface:"奥林帕斯山是太阳系最大的火山；水手号峡谷绵延数千千米。极区还能看到随季节变化的冰盖。",
    environment:"稀薄大气以二氧化碳为主。虽然今天的地表干冷，河道、矿物与沉积层显示古代曾有液态水。",
    interior:"火星有岩石地壳、硅酸盐地幔和富铁的金属核心。NASA 洞察号记录的火星震使科学家能估算层厚、核心大小与深部物态；细节仍会随着数据分析而修订。",
    notice:"看赭红色平原、深色地貌与明亮极冠之间的过渡。",
    layers:[{name:"地壳",detail:"火山、峡谷与撞击坑",color:"#d77d58"},{name:"岩石地幔",detail:"位于地壳与核心之间",color:"#a84e3b"},{name:"金属核心",detail:"含铁等元素",color:"#dda76a"}],
    source:"https://science.nasa.gov/mars/facts/",
  },
  jupiter: {
    opening:"木星是太阳系最大的行星，主要由氢和氦组成。明暗条带是高速气流与云层，不是固体地貌；内部热量和快速自转共同维持活跃天气。",
    surface:"木星没有可供站立的固体表面。大红斑是延续已久的巨大风暴，其形状与大小会随时间变化。",
    environment:"外层主要是氢和氦。强烈的自转和内部热量驱动复杂天气，云带、涡旋和极地极光都很活跃。",
    interior:"向内压力逐渐升高，氢从气态过渡到高压流体，深处成为可导电的金属氢。朱诺号的引力测量提示重元素可能分布在较宽的深部区域，核心未必有一条清晰的边界；图中的分界仅为示意。",
    notice:"转到南半球，寻找大红斑和周围卷曲的浅色云带。",
    layers:[{name:"云顶与氢氦大气",detail:"可见条带和风暴",color:"#d9c4a7"},{name:"高压氢流体",detail:"压力随深度持续增加",color:"#b88965"},{name:"金属氢深层",detail:"高压下呈导电状态",color:"#816d80"},{name:"核心区",detail:"结构仍在研究",color:"#b7a08b"}],
    source:"https://science.nasa.gov/jupiter/jupiter-facts/",
  },
  saturn: {
    opening:"土星是太阳系第二大的行星，以氢和氦为主。明亮而复杂的环系由无数分别绕行的冰粒和岩屑组成，并非与星球连成一体的固体圆盘。",
    surface:"土星没有固体表面。淡金色云带和风暴位于大气上层；行星环在天文尺度上极薄，并存在明显的环缝。",
    environment:"每条环带的粒子按自己的轨道速度运行。土星有复杂的磁场、天气系统与多样的卫星。",
    interior:"土星没有明确的固体表面。越往深处，氢氦流体越致密；更高压力下有导电的金属氢，中心可能是含较多重元素的区域。卡西尼号的引力与环振动研究帮助约束内部，但深层不是图中那样截然分开的硬壳。",
    notice:"倾斜视角下观察环带明暗和卡西尼环缝，留意它们不是一整块硬盘。",
    layers:[{name:"云层与氢氦大气",detail:"淡金色条带",color:"#e3d5ac"},{name:"高压氢流体",detail:"气体逐渐过渡为流体",color:"#bca37f"},{name:"深部金属氢",detail:"高压物态",color:"#8c8491"},{name:"核心区",detail:"深部结构仍在研究",color:"#b49a82"}],
    source:"https://science.nasa.gov/saturn/facts/",
  },
  uranus: {
    opening:"天王星的自转轴倾角约 98°，几乎侧躺着围绕太阳运行。一个公转周期约为 84 年，两个极区因此轮流经历漫长的日照和黑夜。",
    surface:"青绿色来自大气中的甲烷吸收红光。可见的是云顶和雾霾，而非坚固地面；它也拥有较暗的行星环。",
    environment:"外层含氢、氦和甲烷。Voyager 2 是迄今唯一近距离飞掠天王星的探测器。",
    interior:"“冰巨行星”不代表有一层普通的固体冰壳。氢氦甲烷大气向下逐渐过渡到高压下富含水、氨和甲烷的流体；更深处可能有岩质成分。质量分布与各层界面仍主要靠引力和理论模型推断。",
    notice:"观察冷青色球面与斜向细环；淡淡的层次比强烈条带更接近它的可见光外观。",
    layers:[{name:"甲烷与氢氦大气",detail:"吸收红光，显出青色",color:"#9bd5d5"},{name:"高压富水流体",detail:"可能含氨和甲烷",color:"#5b9fb0"},{name:"深部核心区",detail:"成分与边界尚不确定",color:"#8c8d91"}],
    source:"https://science.nasa.gov/uranus/facts/",
  },
  neptune: {
    opening:"海王星是太阳系最远的行星，公转一周约需 165 个地球年。大气中的甲烷吸收红光，而快速变化的云层和暗色风暴显示它并非宁静的蓝色球体。",
    surface:"像天王星一样，海王星没有清晰的固体表面。我们看到的是大气和高空甲烷冰云。",
    environment:"大气主要由氢、氦和少量甲烷组成。观测到的风速可超过每小时 2,000 千米，天气非常活跃。",
    interior:"蓝色云顶以下，氢氦甲烷大气随着压力增加逐渐变为高压流体；更深处可能富含水、氨和甲烷，中心或有岩质成分。深层无法直接成像，成分和边界来自有限观测与物理模型，切面只表达可能的结构。",
    notice:"寻找深蓝背景上的浅色云带；风暴的位置并非永久不变。",
    layers:[{name:"云层与甲烷大气",detail:"蓝色和高速天气",color:"#477ac8"},{name:"高压富水流体",detail:"可能含氨和甲烷",color:"#315687"},{name:"深部核心区",detail:"仍需更多探测",color:"#6c788d"}],
    source:"https://science.nasa.gov/neptune/neptune-facts/",
  },
};
