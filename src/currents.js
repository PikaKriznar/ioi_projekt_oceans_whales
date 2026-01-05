// src/currents.js
export function createCurrentsLayer() {
  let visible = true;
  let stepIndex = 0;
  let data = null;

  let animId = null;
  const t0 = performance.now();

  const Layer = L.Layer.extend({
    onAdd(map) {
      this._map = map;

      this._canvas = L.DomUtil.create("canvas", "leaflet-flow-canvas");
      this._canvas.style.position = "absolute";
      this._canvas.style.pointerEvents = "none";
      map.getPanes().overlayPane.appendChild(this._canvas);

      this._resize = () => {
        const size = this._map.getSize();
        this._canvas.width = size.x;
        this._canvas.height = size.y;
      };

      map.on("move zoom resize", this._resize);
      this._resize();

      this._load();
      this._startAnim();
    },

    onRemove(map) {
      map.off("move zoom resize", this._resize);
      map.getPanes().overlayPane.removeChild(this._canvas);
      this._stopAnim();
    },

    async _load() {
      try {
        data = await (await fetch("data/vertical_flow_w_surface.json")).json();

        // cache per-step maxAbs for stable scaling
        data._cache = data.steps?.map(step => {
          let maxAbs = 0;
          for (const p of step) {
            const a = Math.abs(p.w ?? 0);
            if (a > maxAbs) maxAbs = a;
          }
          return { maxAbs: Math.max(maxAbs, 1e-12) };
        }) ?? [];

      } catch (e) {
        console.warn("Flow layer: failed to load data/vertical_flow_w_surface.json", e);
      }
    },

    _startAnim() {
      const tick = (now) => {
        animId = requestAnimationFrame(tick);
        this._draw(now);
      };
      animId = requestAnimationFrame(tick);
    },

    _stopAnim() {
      if (animId) cancelAnimationFrame(animId);
      animId = null;
    },

    _draw(now) {
      if (!this._map || !this._canvas) return;
      const ctx = this._canvas.getContext("2d");
      ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

      if (!visible || !data) return;

      const steps = data.steps ?? [];
      if (steps.length === 0) return;

      const points = steps[stepIndex] ?? [];
      if (points.length === 0) return;

      const maxAbs = (data._cache?.[stepIndex]?.maxAbs) ?? 1e-12;

      // smooth pulse 0..1
      const phase = ((now - t0) / 1400) % 1;
      const pulse = 0.65 + 0.35 * Math.sin(phase * Math.PI * 2);

      const z = this._map.getZoom();
      const stride = z <= 4 ? 10 : (z <= 5 ? 7 : 5);

      for (let i = 0; i < points.length; i += stride) {
        const p = points[i];
        if (p.lat == null || p.lon == null || p.w == null) continue;

        const px = this._map.latLngToContainerPoint([p.lat, p.lon]);

        const a = Math.min(1, Math.abs(p.w) / maxAbs); // 0..1
        const r = 0.8 + a * 5.0 * pulse;
        const alpha = 0.10 + a * 0.70;

        const up = (p.w >= 0);
        ctx.fillStyle = up
          ? `rgba(80, 180, 255, ${alpha})`
          : `rgba(255, 120, 120, ${alpha})`;

        ctx.beginPath();
        ctx.arc(px.x, px.y, r, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();

        // tiny vertical cue (up/down)
        const dy = (up ? -1 : 1) * (1 + a * 5);
        ctx.strokeStyle = up
          ? `rgba(80, 180, 255, ${alpha})`
          : `rgba(255, 120, 120, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px.x, px.y);
        ctx.lineTo(px.x, px.y + dy);
        ctx.stroke();
      }
    }
  });

  const inst = new Layer();
  inst.setVisible = (v) => { visible = v; };
  inst.setMonthIndex = (idx) => { stepIndex = idx; };

  return inst;
}
