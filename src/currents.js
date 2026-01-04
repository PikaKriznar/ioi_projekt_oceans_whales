export function createCurrentsLayer(){
  let visible = true;
  let monthIndex = 0;
  let data = null;

  const layer = L.canvasLayer ? L.canvasLayer() : null;

  // fallback: Leaflet brez canvasLayer plugin → naredimo custom pane s canvas
  const custom = L.Layer.extend({
    onAdd(map){
      this._map = map;
      this._canvas = L.DomUtil.create("canvas", "leaflet-currents-canvas");
      this._canvas.style.position = "absolute";
      this._canvas.style.pointerEvents = "none";
      map.getPanes().overlayPane.appendChild(this._canvas);

      const resize = ()=>this._resize();
      map.on("move zoom resize", resize);
      this._resize();

      // load once
      this._load();
    },
    onRemove(map){
      map.getPanes().overlayPane.removeChild(this._canvas);
    },
    async _load(){
      try{
        data = await (await fetch("data/currents_surface.json")).json();
        this._redraw();
      }catch(e){
        // no data yet -> ignore
      }
    },
    _resize(){
      const size = this._map.getSize();
      this._canvas.width = size.x;
      this._canvas.height = size.y;
      this._redraw();
    },
    _redraw(){
      if(!this._map || !this._canvas) return;
      const ctx = this._canvas.getContext("2d");
      ctx.clearRect(0,0,this._canvas.width,this._canvas.height);

      if(!visible || !data) return;

      // data format expected:
      // { "months": [ [ {lat, lon, u, v, speed}, ... ], ... ] }
      const points = data.months?.[monthIndex] ?? [];
      if(points.length === 0) return;

      // simple downsample for performance
      const step = 5; // render every Nth point
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = 1;

      for(let i=0;i<points.length;i+=step){
        const p = points[i];
        const latlng = L.latLng(p.lat, p.lon);
        const px = this._map.latLngToContainerPoint(latlng);

        // scale arrow length by speed (clamped)
        const len = Math.max(4, Math.min(18, (p.speed ?? 0) * 8));
        const angle = Math.atan2(p.v, p.u);

        drawArrow(ctx, px.x, px.y, len, angle);
      }
    }
  });

  const inst = new custom();

  inst.setVisible = (v)=>{ visible=v; inst._redraw?.(); };
  inst.setMonthIndex = (idx)=>{ monthIndex=idx; inst._redraw?.(); };

  return inst;
}

function drawArrow(ctx, x, y, len, angle){
  const x2 = x + Math.cos(angle) * len;
  const y2 = y - Math.sin(angle) * len; // canvas y down
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // arrow head
  const head = 4;
  const a1 = angle + Math.PI * 0.85;
  const a2 = angle - Math.PI * 0.85;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 + Math.cos(a1)*head, y2 - Math.sin(a1)*head);
  ctx.lineTo(x2 + Math.cos(a2)*head, y2 - Math.sin(a2)*head);
  ctx.closePath();
  ctx.fill();
}
