import type { BodyId } from "./planetData";

export const PANORAMA_HIGHLIGHTS: [string,string,string] = [
  "从太阳向外找到水星、金星、地球和火星，辨认四颗内侧行星的轨道。",
  "在外侧找到木星和土星，再观察土星环相对轨道的方向。",
  "沿最外侧两条轨道找到天王星和海王星，比较它们与太阳的位置关系。",
];

// Short observing prompts grounded in the NASA fact pages linked from each dossier.
export const HIGHLIGHTS: Record<BodyId,{zh:[string,string,string];en:[string,string,string]}>={
  sun:{zh:["观察光球上的颗粒纹理，它来自热等离子体对流。","留意太阳边缘稀薄、不断变化的日冕；显示亮度已压缩。","太阳黑子与耀斑由复杂磁场活动驱动。"],en:["Inspect photospheric granulation caused by convection in hot plasma.","Notice the tenuous changing corona at the solar limb; display brightness is compressed.","Magnetic activity drives sunspots and solar flares."]},
  mercury:{zh:["不同大小的撞击坑叠在古老地表上。","长弧状陡崖记录了行星冷却收缩。","极地永久阴影的深坑可能保存水冰。"],en:["Craters of many sizes overlap across ancient terrain.","Long curved scarps record the planet's contraction as it cooled.","Permanently shadowed polar craters may preserve water ice."]},
  venus:{zh:["可见光看到的是云顶，不是金星地面。","浓厚的二氧化碳大气造成极强的温室效应。","金星的自转方向与大多数行星相反。"],en:["Visible light shows cloud tops, not Venus's ground.","A dense carbon dioxide atmosphere drives an intense greenhouse effect.","Venus rotates in the opposite direction to most planets."]},
  earth:{zh:["沿海岸线寻找岛链、海峡与半岛。","浅蓝大气边缘和薄云层位于地表之上。","转到背光面，可对比海洋暗面与城市灯光。"],en:["Follow coastlines to find island chains, straits, and peninsulas.","A thin atmosphere and cloud layer sit above the surface.","On the night side, compare dark oceans with city lights."]},
  moon:{zh:["暗色月海是古老熔岩平原，并非海洋。","明亮高地保留更多撞击坑。","月球近乎始终以同一面朝向地球。"],en:["The dark maria are ancient lava plains, not oceans.","Bright highlands preserve many more impact craters.","Nearly the same lunar hemisphere faces Earth."]},
  mars:{zh:["红色来自富含氧化铁的表面尘埃。","留意暗色地貌与明亮极冠的过渡。","奥林帕斯山和水手号峡谷展示了漫长地质史。"],en:["Iron-rich surface dust gives Mars its rusty color.","Notice the transition between dark terrain and bright polar caps.","Olympus Mons and Valles Marineris record a long geological history."]},
  jupiter:{zh:["明暗云带围绕木星，不是固体地层。","大红斑是会变化的巨大风暴。","条带边缘的卷曲细节反映复杂气流。"],en:["Alternating cloud belts encircle Jupiter; they are not solid layers.","The Great Red Spot is a huge storm that changes over time.","Curled edges of the belts hint at complex winds."]},
  saturn:{zh:["环由许多独立绕行的冰粒与岩屑构成。","明暗环带之间有卡西尼环缝。","留意环经过行星前方和后方时的遮挡关系。"],en:["The rings consist of many separately orbiting pieces of ice and rock.","The Cassini Division separates bright ring bands.","Watch how the rings pass in front of and behind the planet."]},
  uranus:{zh:["自转轴倾斜约 98°，几乎侧躺着运行。","甲烷吸收红光，使云顶呈柔和青色。","可见光下层次本来很淡，暗环也十分狭窄。"],en:["Its axis tilts about 98°, so Uranus rotates almost sideways.","Methane absorbs red light, giving the cloud tops a soft cyan tone.","Visible-light features are subtle, and the dark rings are narrow."]},
  neptune:{zh:["大气中的甲烷让海王星呈蓝色。","高空亮云与深色风暴会随时间变化。","这里的阳光比地球附近弱得多。"],en:["Atmospheric methane contributes to Neptune's blue appearance.","Bright high clouds and dark storms change with time.","Sunlight here is much weaker than near Earth."]},
};
