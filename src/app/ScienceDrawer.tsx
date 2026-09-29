"use client";

import { BookOpen, ChevronLeft, ChevronRight, ExternalLink, Languages, Layers3, X } from "lucide-react";
import { BODIES, type BodyId } from "./planetData";
import { SCIENCE } from "./planetScience";
import { SCIENCE_EN } from "./planetScienceEn";
import { OBSERVATORY_FACTS } from "./observatoryFacts";
import { HIGHLIGHTS } from "./planetHighlights";
import InteriorDiagram from "./InteriorDiagram";

export type ScienceTab = "story" | "inside";

type Props = {
  selected: BodyId | null;
  open: boolean;
  tab: ScienceTab;
  onToggle: () => void;
  onClose: () => void;
  onTab: (tab: ScienceTab) => void;
  language: "zh" | "en";
  onLanguage: (language:"zh"|"en") => void;
};

function translatedNasaUrl(url:string){
  return `https://translate.google.com/translate?sl=en&tl=zh-CN&u=${encodeURIComponent(url)}`;
}

export default function ScienceDrawer({selected,open,tab,onToggle,onClose,onTab,language,onLanguage}:Props){
  const english=language==="en";
  const body=selected?BODIES.find(x=>x.id===selected):null;
  const science=selected?(english?SCIENCE_EN[selected]:SCIENCE[selected]):null;
  return <>
    <button type="button" className={`science-tab-handle ${open?"is-open":""}`} onClick={onToggle} aria-expanded={open} aria-controls="science-drawer" aria-label={open?"收起天体档案":"展开天体档案"}>
      {open?<ChevronLeft size={21}/>:<ChevronRight size={21}/>}<span>天体档案</span>
    </button>
    <aside id="science-drawer" className={`science-drawer ${open?"is-open":""}`} aria-label="天体科普档案" aria-hidden={!open}>
      <div className="science-drawer-head">
        <div><span className="science-kicker">{english?(body?"SOLAR SYSTEM BODY":"EIGHT PLANETS · ONE STAR"):body?.kind??"八大行星 · 一颗恒星"}</span><h2>{english?(body?.english??"SOLAR SYSTEM"):body?body.name:"太阳系"}<small>{english?(body?.name??"太阳系"):(body?.english??"SOLAR SYSTEM")}</small></h2></div>
        <button type="button" className="science-close" aria-label={english?"Close dossier":"收起天体档案"} onClick={onClose}><X size={18}/></button>
      </div>
      <div className="language-row" role="group" aria-label="Language / 语言"><span>{english?"Language":"阅读语言"}</span><div><button type="button" className={!english?"active":""} aria-pressed={!english} onClick={()=>onLanguage("zh")}>中文</button><button type="button" className={english?"active":""} aria-pressed={english} onClick={()=>onLanguage("en")}>English</button></div></div>
      <p className="science-opening">{science?.opening??(english?"The Sun, eight planets, and many smaller bodies form a gravitationally bound system.":"太阳系以太阳为中心，八颗行星和众多小天体受引力约束，各自沿轨道运行。")}</p>
      <div className="science-stat-row"><div><span>{english?(body?"Mean diameter":"Planets"):(body?"平均直径":"行星")}</span><strong>{english?(body?`≈ ${OBSERVATORY_FACTS[body.id].diameterKm.toLocaleString("en-US")} km`:"8"):(body?.diameter??"8 颗")}</strong></div><div><span>{english?(body?.id==="sun"?"Equatorial rotation":body?.id==="moon"?"Orbit around Earth":body?"Orbital period":"Central star"):(body?.id==="sun"?"赤道自转":body?.id==="moon"?"绕地周期":body?"公转周期":"中心恒星")}</span><strong>{english?(body?.period.replace("天","days").replace("年","years").replace("约 ","about ").replace("绕地","").replace("自转","")??"The Sun"):(body?.period??"太阳")}</strong></div></div>
      {body&&<div className="science-extra-stats"><div><span>{english?"Mean Sun distance":"平均日距"}</span><strong>{body.id==="sun"?(english?"At the center":"太阳系中心"):body.id==="moon"?"≈ 1 AU":`≈ ${OBSERVATORY_FACTS[body.id].au} AU`}</strong></div><div><span>{body.id==="moon"?(english?"Facing Earth":"面向地球"):(english?"Axial tilt":"自转轴倾角")}</span><strong>{body.id==="moon"?(english?"Nearly locked":"近乎同步"):`${OBSERVATORY_FACTS[body.id].tiltDeg}°`}</strong></div></div>}
      {body&&science?<>
        <div className="science-tabs" role="tablist" aria-label="档案内容">
          <button type="button" role="tab" aria-selected={tab==="story"} className={tab==="story"?"active":""} onClick={()=>onTab("story")}><BookOpen size={15}/> {english?"Environment":"环境与发现"}</button>
          <button type="button" role="tab" aria-selected={tab==="inside"} className={tab==="inside"?"active":""} onClick={()=>onTab("inside")}><Layers3 size={15}/> {english?"Interior":"内部结构"}</button>
        </div>
        {tab==="story"?<div className="science-sections" role="tabpanel">
          <section><h3>{english?"What you see":"眼前看见什么"}</h3><p>{science.surface}</p></section>
          <section><h3>{english?"Environment and motion":"环境与运动"}</h3><p>{science.environment}</p></section>
          <section className="science-highlights"><h3>{english?"Three details to notice":"三个值得细看的细节"}</h3><ol>{HIGHLIGHTS[body.id][language].map((item,index)=><li key={item}><span>{String(index+1).padStart(2,"0")}</span>{item}</li>)}</ol></section>
          <div className="science-observe"><span>{english?"Observation tip":"观测提示"}</span><p>{science.notice}</p></div>
        </div>:<div className="science-sections" role="tabpanel">
          <p className="diagram-caption">{english?"Surface texture and exposed interior · model-based; layer thickness not to scale":"表层纹理与局部切面 · 基于结构模型，层厚不按比例"}</p>
          <InteriorDiagram id={body.id} english={english}/>
          <section><h3>{english?"Inside the body":"深入内部"}</h3><p>{science.interior}</p></section>
          {(body.id==="jupiter"||body.id==="saturn"||body.id==="uranus"||body.id==="neptune")&&<p className="model-note">{english?"Giant planets have no sharply defined solid surface. Deep boundaries and cores are inferred from measurements and models.":"巨行星没有清晰的固体表面；深层边界和核心形态仍依赖探测与模型推断。"}</p>}
        </div>}
        <div className="source-language-block">
          <h3><Languages size={16}/>{english?"Read NASA's complete article":"阅读 NASA 完整文章"}</h3>
          <div className="source-language-actions">
            <a href={translatedNasaUrl(SCIENCE[body.id].source)} target="_blank" rel="noopener noreferrer"><span>中文全文<small>NASA 文章机器翻译</small></span><ExternalLink size={14}/></a>
            <a href={SCIENCE[body.id].source} target="_blank" rel="noopener noreferrer"><span>English<small>NASA 官方原文</small></span><ExternalLink size={14}/></a>
          </div>
          <p>{english?"The Chinese link opens a machine translation of the same NASA page. Its translation toolbar can switch between the translated article and the original.":"中文入口打开同一篇 NASA 文章的机器译文；进入后可用页面顶部的语言栏切换译文与原文。"}</p>
        </div>
      </>:<div className="science-sections panorama-science"><section><h3>{english?"Why do the orbits look so close?":"为什么轨道看起来很近？"}</h3><p>{english?"Planet diameters and orbital distances differ enormously. To keep bodies tappable on a phone, the scene enlarges them and compresses the gaps. Orbit shapes and periods are illustrative; this is not a live ephemeris.":"行星直径与轨道距离相差悬殊。为了让手机屏幕也能点选天体，场景放大了星球，并压缩了轨道间距；轨道形状和公转周期用于示意，不代表当前实时星历。"}</p></section><section><h3>{english?"Where to start":"从哪里开始"}</h3><p>{english?"Select a body below or start the guided tour in the control center. Each body has a short guide to its appearance, environment, and interior.":"点选下方任意天体，或在控制中心启动自动巡航。每颗天体都有表面、环境和内部结构的简短档案。"}</p></section><a className="science-source" href="https://ssd.jpl.nasa.gov/planets/approx_pos.html" target="_blank" rel="noopener noreferrer">{english?"JPL orbital reference · English":"JPL 轨道参数（英文）"} <ExternalLink size={14}/></a></div>}
    </aside>
  </>;
}
