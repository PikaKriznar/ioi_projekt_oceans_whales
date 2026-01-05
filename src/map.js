import { state, setState } from "./state.js";
import { createCurrentsLayer } from "./currents.js";

let map, whalesLayer, currentsLayer;
let whalesData = null;

const BOOKMARKS = {
  med:     { center:[38.5, 16.0], zoom:4 },
  biscay:  { center:[46.0, -5.0], zoom:5 },
  norway:  { center:[67.0, 8.0],  zoom:5 },
  northsea:{ center:[56.0, 3.0],  zoom:5 },
  iceland: { center:[64.8, -18],  zoom:5 }
};

export function initMap(){
  map = L.map("map", { preferCanvas:true }).setView([52, 5], 4);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 8,
    attribution: "&copy; OpenStreetMap"
  }).addTo(map);

  whalesLayer = L.geoJSON([], {
    pointToLayer: (f, latlng) => L.circleMarker(latlng, {
      radius: 6,
      weight: 1,
      opacity: 1,
      fillOpacity: 0.9
    }),
    onEachFeature: (f, layer) => {
      const p = f.properties || {};
      layer.bindPopup(`
        <b>${p.species ?? "Unknown"}</b><br/>
        ${p.eventDate ?? ""}<br/>
        <span style="opacity:.8">${p.datasetName ?? ""}</span>
      `);
    }
  }).addTo(map);

  currentsLayer = createCurrentsLayer();
  currentsLayer.addTo(map);

  // bookmarks
  document.querySelectorAll(".chip").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const key = btn.dataset.bm;
      const bm = BOOKMARKS[key];
      if(bm) map.setView(bm.center, bm.zoom);
    });
  });
}

export async function loadWhales(range){
  const file = range === "2010_2013"
    ? "data/whales_2010_2013.geojson"
    : "data/whales_2011_2012.geojson";

  whalesData = await (await fetch(file)).json();
  updateMap();

    // DEBUG: zoom to data once
  if (whalesData?.features?.length) {
    const b = L.geoJSON(whalesData).getBounds();
    if (b.isValid()) map.fitBounds(b.pad(0.1));
  }


  return whalesData;
}

function featurePassesFilters(f){
  const p = f.properties || {};
  if(state.species !== "All" && p.species !== state.species) return false;

  // monthIndex → year/month filter (2011–2012 default)
  if(state.range === "2011_2012"){
    const y = p.year, m = p.month;
    if(!y || !m) return false;
    const idx = (y - 2011) * 12 + (m - 1);
    if (Math.abs(idx - state.monthIndex) > 1) return false; // window: 3 months
  }
  return true;
}

export function updateMap(){
  if(!map) return;

  // whales
  if(state.showWhales && whalesData){
    const filtered = {
      type:"FeatureCollection",
      features: whalesData.features.filter(featurePassesFilters)
    };
    whalesLayer.clearLayers();
    whalesLayer.addData(filtered);
  } else {
    whalesLayer.clearLayers();
  }

  // currents
  currentsLayer.setVisible(state.showCurrents);
  currentsLayer.setMonthIndex(state.monthIndex);
}
