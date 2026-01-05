export const state = {
  range: "2011_2012",
  species: "All",
  monthIndex: 6,      // 0..23 for 2011–2012
  playing: false,
  showWhales: true,
  showCurrents: true
};

const listeners = new Set();
export function subscribe(fn){ listeners.add(fn); return ()=>listeners.delete(fn); }
export function setState(patch){
  Object.assign(state, patch);
  listeners.forEach(fn => fn(state));
}
