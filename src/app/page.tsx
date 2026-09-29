"use client";

import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Compass, Layers3, Maximize2, Minimize2, Pause, Play, RotateCcw, Settings2, Shuffle, Sparkles, Sun, Ruler, Orbit, Volume2, VolumeX, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { BODIES, type Body, type BodyId } from "./planetData";
import ScienceDrawer, { type ScienceTab } from "./ScienceDrawer";
import { formatLightTime, OBSERVATORY_FACTS } from "./observatoryFacts";
import { HIGHLIGHTS, PANORAMA_HIGHLIGHTS } from "./planetHighlights";
import { TOUR_ORBIT_MS, TOUR_TRAVEL_MS, type TourStage } from "./tourTiming";
import { TourAudio } from "./tourAudio";

const speeds = [0.25,1,5,20];
const SolarScene = lazy(() => import("./SolarScene"));
type Experiment = "light"|"size"|"tilt";

function ExperimentResults({id,experiment}: {id:BodyId|null;experiment:Experiment}) {
  if(id===null){
    if(experiment==="light")return <><div className="experiment-eyebrow">太阳光抵达海王星轨道</div><strong>{formatLightTime("neptune")}</strong><div className="light-beam" aria-hidden="true"><span/></div><p>按海王星平均日距估算；行星实际位置不断变化。</p></>;
    if(experiment==="size"){
      const ratio=OBSERVATORY_FACTS.jupiter.diameterKm/OBSERVATORY_FACTS.earth.diameterKm;
      return <><div className="experiment-eyebrow">木星直径 / 地球直径</div><strong>约 {ratio.toFixed(1)} 倍</strong><div className="comparison-track"><span>地球 1×</span><span>木星 {ratio.toFixed(1)}×</span></div><p>真实直径的对比；三维场景为了方便点选，放大了较小的天体。</p></>;
    }
    return <><div className="experiment-eyebrow">全景中的极端自转倾角</div><strong>天王星约 98°</strong><div className="tilt-mark" aria-hidden="true"><span style={{transform:"rotate(98deg)"}}/></div><p>天王星几乎侧躺着自转；切换到它的视角可以观察细环。</p></>;
  }
  const fact=OBSERVATORY_FACTS[id];
  const name=BODIES.find(body=>body.id===id)!.name;
  const earthRatio=fact.diameterKm/OBSERVATORY_FACTS.earth.diameterKm;
  if(experiment==="light")return <><div className="experiment-eyebrow">太阳光的单程旅行</div><strong>{formatLightTime(id)}</strong><div className="light-beam" aria-hidden="true"><span/></div><p>{id==="sun"?"从这里出发，照亮整个太阳系。":id==="moon"?"月球与地球的日距近似；数字按地球平均日距计算。":`按平均日距 ${fact.au} AU 估算，实际随轨道位置变化。`}</p></>;
  if(experiment==="size")return <><div className="experiment-eyebrow">以地球直径为 1</div><strong>{earthRatio.toFixed(earthRatio<1?2:1)} 倍</strong><div className="comparison-track"><span>地球 1×</span><span>{name} {earthRatio.toFixed(earthRatio<1?2:1)}×</span></div><p>直径的数字对比；三维场景为了便于观察，另行放大了天体。</p></>;
  return <><div className="experiment-eyebrow">自转轴相对轨道法线</div><strong>{fact.tiltDeg===null?"与地球同步":`${fact.tiltDeg}°`}</strong><div className="tilt-mark" aria-hidden="true"><span style={{transform:`rotate(${Math.min(fact.tiltDeg??0,180)}deg)`}}/></div><p>{id==="moon"?"月球近乎总以同一面朝向地球；此处不以单一倾角概括。":id==="uranus"?"超过 90°，天王星几乎侧躺，细环跟随倾斜赤道。":"星球三维姿态采用示意倾角；轨道尺度仍经过压缩。"}</p></>;
}

function TourIntroduction({body}: {body:Body}) {
  return <>
    <div className="tour-route">{body.kind}</div>
    <h2>{body.name}<span>{body.english}</span></h2>
    <p>{body.description}</p>
    <div className="tour-feature">{body.feature}</div>
    <div className="tour-facts"><span>直径 {body.diameter}</span><span>{body.period}</span></div>
  </>;
}

export default function Home() {
  const [selected,setSelected]=useState<BodyId|null>(null);
  const [focusToken,setFocusToken]=useState(0);
  const [playing,setPlaying]=useState(true);
  const [speed,setSpeed]=useState(1);
  const [showOrbits,setShowOrbits]=useState(true);
  const [orbitStrength,setOrbitStrength]=useState<"soft"|"clear"|"bright">("clear");
  const [viewSide,setViewSide]=useState<"free"|"day"|"night"|"rings"|"clouds">("free");
  const [showLabels,setShowLabels]=useState(true);
  const [settingsOpen,setSettingsOpen]=useState(false);
  const [infoOpen,setInfoOpen]=useState(false);
  const [scienceTab,setScienceTab]=useState<ScienceTab>("story");
  const [scienceLanguage,setScienceLanguage]=useState<"zh"|"en">("zh");
  const [touring,setTouring]=useState(false);
  const [tourPaused,setTourPaused]=useState(false);
  const [musicEnabled,setMusicEnabled]=useState(true);
  const [tourStage,setTourStage]=useState<TourStage|null>(null);
  const musicRef=useRef<TourAudio|null>(null);
  useEffect(()=>()=>{musicRef.current?.stop();},[]);
  const selectedRef=useRef<BodyId|null>(selected);
  useEffect(()=>{selectedRef.current=selected;},[selected]);
  const tourSequence=useRef(0);
  const pausedRef=useRef(tourPaused);
  const tourTimeline=useRef<{timer:number|null;deadline:number;remaining:number;advance:(()=>void)|null}>({timer:null,deadline:0,remaining:0,advance:null});
  useEffect(()=>{pausedRef.current=tourPaused;},[tourPaused]);
  const [ready,setReady]=useState(false);
  const [full,setFull]=useState(false);
  const [experiment,setExperiment]=useState<Experiment>("light");
  const [missionStep,setMissionStep]=useState(0);
  const [completedMissions,setCompletedMissions]=useState<Set<string>>(()=>new Set());
  const experimentName=selected?BODIES.find(body=>body.id===selected)!.name:"太阳系全景";
  const missionTarget=selected??"panorama";
  const missionClues=selected?HIGHLIGHTS[selected].zh:PANORAMA_HIGHLIGHTS;
  const missionKey=`${missionTarget}-${missionStep}`;
  const missionProgress=missionClues.filter((_,index)=>completedMissions.has(`${missionTarget}-${index}`)).length;
  const tourBody=tourStage?BODIES.find(body=>body.id===tourStage.to):null;
  const tourFrom= BODIES.find(body=>body.id===tourStage?.from);
  const endTour=useCallback(()=>{
    musicRef.current?.stop();musicRef.current=null;
    setTouring(false);setTourPaused(false);setTourStage(null);
  },[]);
  const select=useCallback((id:BodyId|null)=>{endTour();setSelected(id);setScienceTab("story");setMissionStep(0);setViewSide("free");setFocusToken(x=>x+1);},[endTour]);
  useEffect(()=>{
    if(!touring||!ready)return;
    let cancelled=false;
    const ids=BODIES.map(body=>body.id);
    const start=selectedRef.current;
    const startIndex=start?ids.indexOf(start):0;
    const itinerary=[...ids.slice(startIndex),...ids.slice(0,startIndex)];
    let visited=0;
    const timeline=tourTimeline.current;
    const schedule=(duration:number,advance:()=>void)=>{
      timeline.remaining=duration;timeline.advance=advance;
      if(!pausedRef.current){
        timeline.deadline=performance.now()+duration;
        timeline.timer=window.setTimeout(()=>{timeline.timer=null;if(!cancelled)advance();},duration);
      }
    };
    const orbit=(id:BodyId)=>{
      if(cancelled)return;
      selectedRef.current=id;setSelected(id);setMissionStep(0);setViewSide("free");
      setTourStage({phase:"orbit",from:id,to:id,sequence:++tourSequence.current});
      schedule(TOUR_ORBIT_MS,()=>{
        visited++;
        if(visited===itinerary.length){endTour();return;}
        travel(id,itinerary[visited]);
      });
    };
    const travel=(from:BodyId|null,to:BodyId)=>{
      if(cancelled)return;
      setTourStage({phase:"travel",from,to,sequence:++tourSequence.current});
      schedule(TOUR_TRAVEL_MS,()=>orbit(to));
    };
    if(start)orbit(start);else travel(null,itinerary[0]);
    return ()=>{cancelled=true;if(timeline.timer!==null)window.clearTimeout(timeline.timer);timeline.timer=null;timeline.advance=null;};
  },[touring,ready,endTour]);
  useEffect(()=>{
    if(!touring||!ready)return;
    const timeline=tourTimeline.current;
    if(tourPaused&&timeline.timer!==null){
      window.clearTimeout(timeline.timer);timeline.timer=null;
      timeline.remaining=Math.max(0,timeline.deadline-performance.now());
    } else if(!tourPaused&&timeline.timer===null&&timeline.advance){
      const advance=timeline.advance;
      timeline.deadline=performance.now()+timeline.remaining;
      timeline.timer=window.setTimeout(()=>{timeline.timer=null;advance();},timeline.remaining);
    }
  },[tourPaused,touring,ready]);
  useEffect(()=>{
    if(!touring)return;
    const pauseWhenHidden=()=>{if(document.hidden){setTourPaused(true);musicRef.current?.pause();}};
    document.addEventListener("visibilitychange",pauseWhenHidden);
    return ()=>document.removeEventListener("visibilitychange",pauseWhenHidden);
  },[touring]);
  const playMusic=()=>{
    if(!musicRef.current)musicRef.current=new TourAudio();musicRef.current.play();
  };
  const startTour=()=>{tourSequence.current=0;setTourPaused(false);setTourStage(null);setInfoOpen(false);setSettingsOpen(false);if(musicEnabled)playMusic();setTouring(true);};
  const toggleTourPause=()=>{const paused=!tourPaused;setTourPaused(paused);if(paused)musicRef.current?.pause();else if(musicEnabled)playMusic();};
  const toggleMusic=()=>{const enabled=!musicEnabled;setMusicEnabled(enabled);if(enabled&&!tourPaused)playMusic();else if(!enabled){musicRef.current?.stop();musicRef.current=null;}};
  const showInterior=()=>{
    if(!selected){setSelected("earth");setFocusToken(x=>x+1);}
    setScienceTab("inside");setInfoOpen(true);setSettingsOpen(false);
  };
  const chooseView=(side:"day"|"night")=>{setViewSide(side);setFocusToken(x=>x+1);setSettingsOpen(false);};
  const observeFeature=(id:BodyId,side:"rings"|"clouds")=>{
    endTour();setSelected(id);setScienceTab("story");setViewSide(side);setFocusToken(x=>x+1);
    setSettingsOpen(false);setInfoOpen(false);
  };
  const toggleMission=()=>setCompletedMissions(previous=>{const next=new Set(previous);if(next.has(missionKey))next.delete(missionKey);else next.add(missionKey);return next;});
  const toggleFullscreen=async()=>{
    if(!document.fullscreenElement){await document.documentElement.requestFullscreen?.();setFull(true);}
    else {await document.exitFullscreen?.();setFull(false);}
  };

  return <main className={`observatory ${touring?"is-touring":""} ${tourPaused?"is-tour-paused":""}`}>
    <Suspense fallback={<div className="scene-host" aria-label="正在载入三维太阳系" />}>
      <SolarScene selected={selected} focusToken={focusToken} touring={touring} tourPaused={tourPaused} tourStage={tourStage} speed={speed} playing={playing} showOrbits={showOrbits} orbitStrength={orbitStrength} viewSide={viewSide} showLabels={showLabels} onSelect={select} onReady={()=>setReady(true)} />
    </Suspense>
    <div className="space-haze" aria-hidden="true" />

    <header className="masthead">
      <div className="brand"><span className="brand-mark"><Sparkles size={18} strokeWidth={1.7}/></span><div><strong>星际漫游</strong><small>太阳系观测台</small></div></div>
      <div className="top-context"><span className="live-pulse" /> 太阳系 <span className="context-divider" /> 三维探索</div>
      <div className="header-actions">
        <button type="button" className="icon-button" aria-label={full?"退出全屏":"全屏查看"} onClick={toggleFullscreen}>{full?<Minimize2 size={19}/>:<Maximize2 size={19}/>}</button>
        <button type="button" className="icon-button settings-toggle" aria-label={settingsOpen?"关闭控制面板":"打开控制面板"} aria-pressed={settingsOpen} onClick={()=>{setSettingsOpen(v=>!v);setInfoOpen(false);}}><Settings2 size={19}/></button>
      </div>
    </header>

    <ScienceDrawer selected={selected} open={infoOpen} tab={scienceTab} language={scienceLanguage} onLanguage={setScienceLanguage} onToggle={()=>{setInfoOpen(v=>!v);setSettingsOpen(false);}} onClose={()=>setInfoOpen(false)} onTab={setScienceTab}/>

    {touring&&<div className="tour-toolbar" role="group" aria-label="巡航控制">
      <button type="button" onClick={toggleMusic} aria-label={musicEnabled?"关闭巡航音乐":"开启巡航音乐"} aria-pressed={musicEnabled}>{musicEnabled?<Volume2 size={16}/>:<VolumeX size={16}/>} 音乐{musicEnabled?"开":"关"}</button>
      <button type="button" onClick={toggleTourPause} aria-label={tourPaused?"继续巡航":"暂停巡航"} aria-pressed={tourPaused}>{tourPaused?<Play size={16}/>:<Pause size={16}/>} {tourPaused?"继续":"暂停"}</button>
      <button type="button" onClick={endTour} aria-label="结束巡航"><X size={17}/> 结束</button>
    </div>}
    {touring&&tourStage&&tourBody&&<aside className={`tour-card ${tourStage.phase}`} key={tourStage.sequence} aria-label="巡航星球简介">
      <div className="tour-heading"><span className="tour-pulse" /> {tourStage.phase==="orbit"?"环绕观察 · 一圈":"平滑飞行 · 下一站"} <small>{String(tourStage.sequence).padStart(2,"0")}</small></div>
      <div className="tour-copy-stack" aria-live="polite">
        {tourStage.phase==="travel"&&tourFrom&&<div className="tour-copy outgoing" style={{animationDuration:`${TOUR_TRAVEL_MS}ms`}} aria-hidden="true"><TourIntroduction body={tourFrom}/></div>}
        <div className={`tour-copy ${tourStage.phase==="travel"?"incoming":"current"}`} style={tourStage.phase==="travel"?{animationDuration:`${TOUR_TRAVEL_MS}ms`}:undefined}><TourIntroduction body={tourBody}/></div>
      </div>
      <div className="tour-progress" aria-hidden="true"><span style={{animationDuration:`${tourStage.phase==="orbit"?TOUR_ORBIT_MS:TOUR_TRAVEL_MS}ms`}} /></div>
    </aside>}

    <aside className={`control-panel ${settingsOpen?"is-open":""}`} aria-label="观测控制">
      <div className="panel-heading"><div><span className="panel-kicker">OBSERVATORY</span><h2>控制中心</h2></div><button type="button" className="panel-close" aria-label="关闭控制面板" onClick={()=>setSettingsOpen(false)}><X size={17}/></button></div>
      <div className="control-section"><div className="section-label">场景元素</div>
        <label className="toggle-row"><span>轨道线<small>显示运行路径</small></span><Switch checked={showOrbits} onCheckedChange={setShowOrbits} aria-label="显示轨道线" /></label>
        <label className="toggle-row"><span>天体标签<small>标记行星名称</small></span><Switch checked={showLabels} onCheckedChange={setShowLabels} aria-label="显示天体标签" /></label>
        <div className="orbit-strength-label">轨道亮度 <small>选中天体的轨道会额外突出</small></div>
        <div className="orbit-strength-options" role="group" aria-label="轨道亮度">
          {([ ["soft","柔和"],["clear","清晰"],["bright","强调"] ] as const).map(([value,label])=><button type="button" key={value} className={orbitStrength===value?"active":""} aria-pressed={orbitStrength===value} onClick={()=>{setOrbitStrength(value);setShowOrbits(true);}}>{label}</button>)}
        </div>
      </div>
      <div className="control-section"><div className="section-label">运行速度</div>
        <RadioGroup value={String(speed)} onValueChange={v=>setSpeed(Number(v))} className="speed-row" aria-label="轨道演示速度">
          {speeds.map(v=><label className={`speed-choice ${speed===v?"chosen":""}`} key={v}><RadioGroupItem value={String(v)} className="speed-radio" /><span>{v}×</span></label>)}
        </RadioGroup>
        <p className="control-caption">轨道周期保持相对关系，时间经过加速演示。</p>
      </div>
      <div className="control-section"><div className="section-label">探索任务</div><div className="action-row tour-row">
        <button type="button" onClick={startTour}><Compass size={15}/> 自动巡航</button>
      </div><p className="control-caption">每站绕行一圈，巡完自动返回；移动时自动调节画质，暂停可细看。</p>
      </div>
      <div className="control-section"><div className="section-label">观察挑战 · {experimentName}<span className="mission-count">{missionProgress}/3</span></div>
        <div className="mission-card"><small>线索 {missionStep+1} / 3</small><p>{missionClues[missionStep]}</p></div>
        <div className="action-row mission-actions"><button type="button" onClick={()=>setMissionStep(x=>(x+1)%3)}><Shuffle size={14}/> 换线索</button><button type="button" className={completedMissions.has(missionKey)?"control-active":""} aria-pressed={completedMissions.has(missionKey)} onClick={toggleMission}>{completedMissions.has(missionKey)?"✓ 已找到":"标记找到"}</button></div>
      </div>
      <div className="control-section"><div className="section-label">天文小实验 · {experimentName}</div>
        <div className="experiment-switch" role="group" aria-label="选择天文小实验">
          <button type="button" className={experiment==="light"?"active":""} aria-pressed={experiment==="light"} onClick={()=>setExperiment("light")}><Sun size={15}/> 光速</button>
          <button type="button" className={experiment==="size"?"active":""} aria-pressed={experiment==="size"} onClick={()=>setExperiment("size")}><Ruler size={15}/> 大小</button>
          <button type="button" className={experiment==="tilt"?"active":""} aria-pressed={experiment==="tilt"} onClick={()=>setExperiment("tilt")}><Orbit size={15}/> 倾角</button>
        </div>
        <div className="experiment-card" key={`${experiment}-${selected??"panorama"}`} aria-live="polite"><ExperimentResults id={selected} experiment={experiment}/></div>
      </div>
      <div className="control-section"><div className="section-label">深入天体</div><button type="button" className="interior-action" onClick={showInterior}><Layers3 size={16}/> 查看内部结构 <span>→</span></button></div>
      <div className="control-section"><div className="section-label">观测视角</div><div className="action-row">
        <button type="button" disabled={!selected||selected==="sun"} onClick={()=>chooseView("day")}>☀ 向阳面</button>
        <button type="button" disabled={!selected||selected==="sun"} onClick={()=>chooseView("night")}>◐ 背光面</button>
      </div><p className="control-caption">镜头移到当前天体的两侧，比较明暗和大气边缘。之后仍可自由拖动。</p></div>
      <div className="control-section"><div className="section-label">特色机位</div>
        <div className="feature-vantages">
          <button type="button" onClick={()=>observeFeature("venus","clouds")}><strong>金星云顶</strong><small>看厚云与晨昏线</small></button>
          <button type="button" onClick={()=>observeFeature("saturn","rings")}><strong>土星环面</strong><small>俯瞰环隙与环影</small></button>
          <button type="button" onClick={()=>observeFeature("uranus","rings")}><strong>天王星极区</strong><small>观察倾斜的自转轴</small></button>
          <button type="button" onClick={()=>observeFeature("neptune","clouds")}><strong>海王星日侧</strong><small>追踪云带的层次</small></button>
        </div>
      </div>
      <div className="control-section compact"><div className="section-label">镜头与时间</div><div className="action-row">
        <button type="button" onClick={()=>select(null)}><RotateCcw size={15}/> 全景</button>
        <button type="button" onClick={()=>setPlaying(v=>!v)}>{playing?<Pause size={15}/>:<Play size={15}/>} {playing?"暂停":"继续"}</button>
      </div></div>
    </aside>

    <div className="bottom-area">
      <div className="bottom-meta"><span className="status-beacon" /> {ready?"三维场景已就绪":"正在载入三维场景"}<span className="meta-separator">/</span> 天体与距离分别缩放 · 轨道示意</div>
      <nav className="destination-rail" aria-label="选择天体">
        <div className="rail-caption"><span>目的地</span><small>DESTINATIONS</small></div>
        {BODIES.map((item,index)=><button type="button" key={item.id} className={`destination ${selected===item.id?"active":""}`} onClick={()=>select(item.id)} aria-pressed={selected===item.id}>
          <span className="destination-symbol" style={{color:item.color}}>{item.symbol}</span><span className="destination-name">{item.name}</span><span className="destination-number">{String(index).padStart(2,"0")}</span>
        </button>)}
        <button type="button" className={`destination panorama ${selected===null?"active":""}`} onClick={()=>select(null)} aria-pressed={selected===null}><span className="destination-symbol">◎</span><span className="destination-name">全景</span></button>
      </nav>
      <div className="footer-note">拖动旋转 · 滚轮或双指缩放 · 点选天体靠近 <span>·</span> <a href="https://www.solarsystemscope.com/textures/" target="_blank" rel="noopener noreferrer">贴图：Solar System Scope（经压缩和尺寸调整）</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a></div>
    </div>
  </main>;
}
