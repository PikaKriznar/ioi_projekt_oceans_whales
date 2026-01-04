import { state } from "./state.js";

export async function initSeasonality(){
  const data = await d3.csv("data/whales_monthly_counts.csv", d3.autoType);

  const el = d3.select("#seasonality");
  const w = el.node().clientWidth || 450;
  const h = 180;

  const margin = {top:10,right:10,bottom:30,left:40};
  const svg = el.append("svg")
    .attr("width", w)
    .attr("height", h);

  const years = [...new Set(data.map(d=>d.year))].sort();
  const months = d3.range(1,13);

  const x = d3.scaleBand().domain(months).range([margin.left, w-margin.right]).padding(0.05);
  const y = d3.scaleBand().domain(years).range([margin.top, h-margin.bottom]).padding(0.1);

  const maxC = d3.max(data, d=>d.count) || 1;
  const c = d3.scaleLinear().domain([0, maxC]).range([0.1, 1]);

  svg.append("g")
    .attr("transform", `translate(0,${h-margin.bottom})`)
    .call(d3.axisBottom(x).tickFormat(m=>d3.timeFormat("%b")(new Date(2000, m-1, 1))))
    .selectAll("text").attr("fill", "#9fb2c2");

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y))
    .selectAll("text").attr("fill", "#9fb2c2");

  const cells = svg.append("g");

  function render(){
    cells.selectAll("rect")
      .data(data, d=>`${d.year}-${d.month}`)
      .join("rect")
      .attr("x", d=>x(d.month))
      .attr("y", d=>y(d.year))
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .attr("fill", "#1b6aa5")
      .attr("opacity", d=>c(d.count))
      .append("title")
      .text(d=>`${d.year}-${String(d.month).padStart(2,"0")}: ${d.count}`);
  }

  render();
}
