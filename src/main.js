import { state, setState, subscribe } from "./state.js";
import { initMap, loadWhales, updateMap } from "./map.js";
import { initSeasonality } from "./charts_seasonality.js";
import { initSpeciesChart, setWhaleFeatures } from "./charts_species.js";

let playTimer = null;
let whalesCache = {};

function monthLabel(idx){
  const y = 2011 + Math.floor(idx/12);
  const m = (idx % 12) + 1;
  const d = new Date(2000, m-1, 1);
  const mStr = d.toLocaleString("en", {month:"short"});
  return `${mStr} ${y}`;
}

function populateSpecies(features){
  const species = Array.from(new Set(features.map(f=>f.properties?.species).filter(Boolean))).sort();
  const sel = document.querySelector("#speciesSelect");
  sel.innerHTML = `<option value="All">All</option>` + species.map(s=>`<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join("");
}

function escapeHtml(s){
  return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
}

async function refreshData(){
  if(!whalesCache[state.range]){
    const geo = await loadWhales(state.range);
    whalesCache[state.range] = geo;
  }
  const geo = whalesCache[state.range];
  populateSpecies(geo.features);
  setWhaleFeatures(geo.features);
  updateMap();
}

function setupUI(){
  const rangeSelect = document.querySelector("#rangeSelect");
  const speciesSelect = document.querySelector("#speciesSelect");
  const timeSlider = document.querySelector("#timeSlider");
  const timeLabelEl = document.querySelector("#timeLabel");
  const playBtn = document.querySelector("#playBtn");

  document.querySelector("#whalesToggle").addEventListener("change", e=>{
    setState({ showWhales: e.target.checked });
    updateMap();
  });
  document.querySelector("#currentsToggle").addEventListener("change", e=>{
    setState({ showCurrents: e.target.checked });
    updateMap();
  });

  rangeSelect.addEventListener("change", async e=>{
    setState({ range: e.target.value, species:"All" });
    await refreshData();
  });

  speciesSelect.addEventListener("change", e=>{
    setState({ species: e.target.value });
    updateMap();
  });

  timeSlider.addEventListener("input", e=>{
    setState({ monthIndex: +e.target.value });
    updateMap();
  });

  playBtn.addEventListener("click", ()=>{
    setState({ playing: !state.playing });
  });

  subscribe((s)=>{
    timeLabelEl.textContent = monthLabel(s.monthIndex);
    playBtn.textContent = s.playing ? "Pause" : "Play";
    if(s.playing) startPlay();
    else stopPlay();
  });

  timeLabelEl.textContent = monthLabel(state.monthIndex);
}

function startPlay(){
  stopPlay();
  playTimer = setInterval(()=>{
    const next = (state.monthIndex + 1) % 24;
    setState({ monthIndex: next });
    updateMap();
  }, 900);
}
function stopPlay(){
  if(playTimer) clearInterval(playTimer);
  playTimer = null;
}

async function loadFlowMeta(){
  try{
    const j = await (await fetch("data/vertical_flow_w_surface.json")).json();
    return { steps: (j.steps?.length ?? 12), labels: j.labels ?? null };
  }catch{
    return { steps: 12, labels: null };
  }
}




async function main(){
    initMap();
    setupUI();

    const meta = await loadFlowMeta();
    const timeSlider = document.querySelector("#timeSlider");
    timeSlider.max = String(Math.max(0, meta.steps - 1));


    await initSeasonality();
    initSpeciesChart();
    await refreshData();
}




main();
