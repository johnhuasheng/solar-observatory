export type BodyId = "sun" | "mercury" | "venus" | "earth" | "moon" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune";

export type Body = {
  id: BodyId;
  name: string;
  english: string;
  symbol: string;
  kind: string;
  description: string;
  feature: string;
  diameter: string;
  period: string;
  color: string;
  radius: number;
  orbit: number;
  days: number;
  phase: number;
};

export const BODIES: Body[] = [
  { id: "sun", name: "太阳", english: "THE SUN", symbol: "☉", kind: "恒星 · 太阳系中心", description: "太阳核心的氢聚变产生能量，经过漫长传输从光球辐射出去。磁场活动形成黑子、耀斑和日冕物质抛射，太阳风持续塑造行星际空间。", feature: "光球并非固体表面；日冕比可见光球更热", diameter: "约 139 万 km", period: "自转约 27 天", color: "#ffb450", radius: 4.3, orbit: 0, days: 0, phase: 0 },
  { id: "mercury", name: "水星", english: "MERCURY", symbol: "☿", kind: "类地行星 · 第 1 颗", description: "水星是最小、最靠近太阳的行星。密布的撞击坑与收缩悬崖记录了古老的地质史；极稀薄的外逸层几乎无法留住热量。", feature: "巨大金属核心与极端昼夜温差", diameter: "4,879 km", period: "88 天", color: "#aaa7a0", radius: .32, orbit: 9.5, days: 88, phase: .7 },
  { id: "venus", name: "金星", english: "VENUS", symbol: "♀", kind: "类地行星 · 第 2 颗", description: "金星与地球大小相近，却被浓厚的二氧化碳大气和硫酸云遮蔽。失控的温室效应使地表约 465°C；火山平原须借助雷达才能看清。", feature: "可见光中看到的是云顶，不是地面", diameter: "12,104 km", period: "225 天", color: "#edc493", radius: .58, orbit: 14.4, days: 225, phase: 2.1 },
  { id: "earth", name: "地球", english: "EARTH", symbol: "⊕", kind: "类地行星 · 第 3 颗", description: "海洋覆盖约七成地表，云系、大陆和冰盖随视角变化。板块运动持续改写海陆边界；充足的液态水和大气使它成为目前唯一确认有生命的世界。", feature: "海岸线、云层、大气薄晕与夜侧灯火", diameter: "12,742 km", period: "365.25 天", color: "#69b8ff", radius: .64, orbit: 20.2, days: 365.25, phase: 4.2 },
  { id: "moon", name: "月球", english: "THE MOON", symbol: "☾", kind: "地球的天然卫星", description: "月球与地球近乎潮汐锁定，因此我们总看见大致同一面。深色月海是古老熔岩平原，亮色高地则保留了密集的撞击坑。", feature: "对比玄武质月海、古老高地与极区阴影", diameter: "3,475 km", period: "绕地约 27.3 天", color: "#cbc8bd", radius: .18, orbit: 1.55, days: 27.3, phase: 2.4 },
  { id: "mars", name: "火星", english: "MARS", symbol: "♂", kind: "类地行星 · 第 4 颗", description: "氧化铁尘埃让火星呈赭红色。奥林帕斯山、水手号峡谷和季节性极冠展示它的地貌；河道与沉积物留下古代液态水的证据。", feature: "薄二氧化碳大气与古代水活动痕迹", diameter: "6,779 km", period: "687 天", color: "#ed7958", radius: .46, orbit: 27.5, days: 687, phase: 3.3 },
  { id: "jupiter", name: "木星", english: "JUPITER", symbol: "♃", kind: "气态巨行星 · 第 5 颗", description: "木星是太阳系最大的行星，没有可站立的固体表面。快速自转组织出明暗云带；大红斑是持续变化的巨型风暴，深处的氢受压可呈金属态。", feature: "不同方向的急流、大红斑与极区极光", diameter: "约 14 万 km", period: "约 11.9 年", color: "#d5a47c", radius: 1.9, orbit: 38, days: 4333, phase: 5.6 },
  { id: "saturn", name: "土星", english: "SATURN", symbol: "♄", kind: "气态巨行星 · 第 6 颗", description: "土星以氢、氦为主，没有固体表面。明亮的环由无数独立公转的冰粒和岩屑组成，环影投向淡金色云层；北极还有醒目的六边形急流。", feature: "薄环、卡西尼环缝、环影和六边形急流", diameter: "约 11.6 万 km", period: "约 29.5 年", color: "#ead5a4", radius: 1.55, orbit: 51, days: 10759, phase: 1.3 },
  { id: "uranus", name: "天王星", english: "URANUS", symbol: "♅", kind: "冰巨行星 · 第 7 颗", description: "天王星自转轴倾角约 98°，像侧躺着绕太阳运行，四季格外漫长。甲烷吸收红光，令云顶呈浅青色；暗淡的细环跟随倾斜的赤道。", feature: "近乎横卧的自转轴与细弱环系", diameter: "约 5.1 万 km", period: "约 84 年", color: "#8bdae1", radius: 1.04, orbit: 64, days: 30687, phase: 4.5 },
  { id: "neptune", name: "海王星", english: "NEPTUNE", symbol: "♆", kind: "冰巨行星 · 第 8 颗", description: "海王星约需 165 年绕太阳一周。大气中的甲烷吸收红光，云层和暗色风暴被异常强劲的风推动；云顶之下是不断增压的流体，而非地面。", feature: "短暂变化的暗斑与高空甲烷冰云", diameter: "约 4.9 万 km", period: "约 165 年", color: "#658df1", radius: 1.02, orbit: 78, days: 60190, phase: .4 },
];

export const BODY_BY_ID = Object.fromEntries(BODIES.map((body) => [body.id, body])) as Record<BodyId, Body>;
