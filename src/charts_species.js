import { state, subscribe } from "./state.js";

let allFeatures = [];

export function setWhaleFeatures(features){
  allFeatures = features || [];
  render();
}

export function initSpeciesChart(){
  subscribe(()=>render());
}

function passes(f){
  const p = f.properties || {};
  if(state.species !== "All" && p.species !== state.species) return false;

  if(state.range === "2011_2012"){
    const y = p.year, m = p.month;
    const idx = (y - 2011) * 12 + (m - 1);
    return idx === state.monthIndex;
  }
  return true;
}

function render(){
  const el = d3.select("#speciesChart");
  el.selectAll("*").remove();

  const w = el.node().clientWidth || 450;
  const h = 220;
  const margin = {top:10,right:10,bottom:40,left:160};

  const filtered = allFeatures.filter(passes);
  const counts = d3.rollups(
    filtered,
    v=>v.length,
    f=>(f.properties?.species ?? "Unknown")
  ).sort((a,b)=>d3.descending(a[1], b[1]))
   .slice(0, 10);

  const x = d3.scaleLinear().domain([0, d3.max(counts, d=>d[1]) || 1]).range([margin.left, w-margin.right]);
  const y = d3.scaleBand().domain(counts.map(d=>d[0])).range([margin.top, h-margin.bottom]).padding(0.12);

  const svg = el.append("svg").attr("width", w).attr("height", h);

  svg.append("g")
    .attr("transform", `translate(0,${h-margin.bottom})`)
    .call(d3.axisBottom(x).ticks(5))
    .selectAll("text").attr("fill", "#9fb2c2");

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y))
    .selectAll("text").attr("fill", "#9fb2c2");

  svg.append("g")
    .selectAll("rect")
    .data(counts)
    .join("rect")
    .attr("x", x(0))
    .attr("y", d=>y(d[0]))
    .attr("width", d=>x(d[1]) - x(0))
    .attr("height", y.bandwidth())
    .attr("fill", "#1b6aa5")
    .attr("opacity", 0.85);

  svg.append("g")
    .selectAll("text.val")
    .data(counts)
    .join("text")
    .attr("class","val")
    .attr("x", d=>x(d[1]) + 6)
    .attr("y", d=>y(d[0]) + y.bandwidth()/2 + 4)
    .attr("fill", "#e9f1f7")
    .attr("font-size", 12)
    .text(d=>d[1]);
}
