function _1(md){return(
md`# Spotify genre fingerprints

This notebook explores how Spotify genres differ in their audio-feature “DNA,” and what separates **popular** from **unpopular** songs **within** a genre.

We are using the Spotify tracks dataset as the underlying source, but for speed and clarity in Observable we are working from two precomputed CSV summaries:

- \\\`genresagainstoneanother.csv\\\` — compares each genre against the overall average of other genres
- \\\`whatmakesagenrepopular.csv\\\` — compares the top 33% vs bottom 33% of songs within each genre

Our goal is to make the notebook useful both for **exploration** and for **presentation** during critique.`
)}

function _2(md){return(
md`## Dataset

The original dataset contains Spotify tracks across roughly 125 genres with feature columns such as:

- danceability
- energy
- loudness
- speechiness
- acousticness
- instrumentalness
- liveness
- valence
- tempo
- duration

The full track-level dataset is useful for modeling and preprocessing, but for this notebook we intentionally use summarized genre-level tables so the visuals load quickly and keep attention on the design and the story rather than data wrangling.`
)}

function _3(md){return(
md`## Two questions

We focus on two related questions:

**1. What makes a genre distinct?**  
How does each genre differ from the average of other genres?

**2. What makes a song popular within a genre?**  
Within each genre, how do the most popular songs differ from the least popular songs?

These are difference scores centered at zero, so the visual language is naturally diverging: positive values on one side, negative on the other.`
)}

function _d3(require){return(
require("d3@7")
)}

function _genreVsAllRaw(FileAttachment){return(
FileAttachment("genresagainstoneanother.csv").csv({typed: true})
)}

function _genrePopularityRaw(FileAttachment){return(
FileAttachment("whatmakesagenrepopular.csv").csv({typed: true})
)}

function _7(md){return(
md`featureDefs = [
  {key: "danceability", label: "Danceability", short: "Dance"},
  {key: "energy", label: "Energy", short: "Energy"},
  {key: "loudness", label: "Loudness", short: "Loud"},
  {key: "speechiness", label: "Speechiness", short: "Speech"},
  {key: "acousticness", label: "Acousticness", short: "Acoustic"},
  {key: "instrumentalness", label: "Instrumentalness", short: "Instrument"},
  {key: "liveness", label: "Liveness", short: "Live"},
  {key: "valence", label: "Valence", short: "Valence"},
  {key: "tempo", label: "Tempo", short: "Tempo"},
  {key: "duration", label: "Duration", short: "Duration"}
]`
)}

function _featureDefs(){return(
[
  { key: "danceability", label: "Danceability", short: "Dance" },
  { key: "energy", label: "Energy", short: "Energy" },
  { key: "loudness", label: "Loudness", short: "Loud" },
  { key: "speechiness", label: "Speechiness", short: "Speech" },
  { key: "acousticness", label: "Acousticness", short: "Acoustic" },
  { key: "instrumentalness", label: "Instrumentalness", short: "Instrument" },
  { key: "liveness", label: "Liveness", short: "Live" },
  { key: "valence", label: "Valence", short: "Valence" },
  { key: "tempo", label: "Tempo", short: "Tempo" },
  { key: "duration", label: "Duration", short: "Duration" }
]
)}

function _featureKeys(featureDefs){return(
featureDefs.map(d => d.key)
)}

function _featureLabels(featureDefs){return(
new Map(featureDefs.map(d => [d.key, d.label]))
)}

function _featureShort(featureDefs){return(
new Map(featureDefs.map(d => [d.key, d.short]))
)}

function _normalizeGenreVsAll(){return(
row => ({
  genre: row.genre,
  danceability: +row.Dance,
  energy: +row.Energy,
  loudness: +row.Loud,
  speechiness: +row.Speech,
  acousticness: +row.Acoustic,
  instrumentalness: +row.Instrument,
  liveness: +row.Live,
  valence: +row.Valence,
  tempo: +row.Tempo,
  duration: +row.Duration
})
)}

function _normalizeGenrePopularity(){return(
row => ({
  genre: row.genre,
  danceability: +row.Danceability,
  energy: +row.Energy,
  loudness: +row.Loudness,
  speechiness: +row.Speechiness,
  acousticness: +row.Acousticness,
  instrumentalness: +row.Instrumentalness,
  liveness: +row.Liveness,
  valence: +row.Valence,
  tempo: +row.Tempo,
  duration: +row.Duration
})
)}

function _genreVsAll(genreVsAllRaw,normalizeGenreVsAll){return(
genreVsAllRaw.map(normalizeGenreVsAll)
)}

function _genrePopularity(genrePopularityRaw,normalizeGenrePopularity){return(
genrePopularityRaw.map(normalizeGenrePopularity)
)}

function _allValues(genreVsAll,featureKeys,genrePopularity){return(
[
  ...genreVsAll.flatMap(d => featureKeys.map(f => d[f])),
  ...genrePopularity.flatMap(d => featureKeys.map(f => d[f]))
]
)}

function _absMax(d3,allValues){return(
d3.max(allValues, d => Math.abs(d))
)}

function _diverging(d3,absMax){return(
d3.scaleDiverging([-absMax, 0, absMax], d3.interpolateRdYlGn)
)}

function _tooltip(d3,invalidation)
{
  const div = d3.create("div")
    .style("position", "fixed")
    .style("pointer-events", "none")
    .style("z-index", 1000)
    .style("background", "rgba(17,17,17,0.92)")
    .style("color", "white")
    .style("padding", "8px 10px")
    .style("border-radius", "8px")
    .style("font", "12px system-ui, sans-serif")
    .style("line-height", "1.35")
    .style("box-shadow", "0 6px 20px rgba(0,0,0,0.25)")
    .style("opacity", 0)

  document.body.appendChild(div.node())
  invalidation.then(() => div.remove())
  return div
}


function _colorLegend(d3,absMax){return(
({scale, title = "", width = 320, height = 12, ticks = 5} = {}) => {
  const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", 46)

  const gradientId = `legend-${Math.random().toString(36).slice(2)}`

  const defs = svg.append("defs")
  const gradient = defs.append("linearGradient")
    .attr("id", gradientId)
    .attr("x1", "0%")
    .attr("x2", "100%")

  d3.range(0, 1.0001, 0.02).forEach(t => {
    gradient.append("stop")
      .attr("offset", `${t * 100}%`)
      .attr("stop-color", scale(-absMax + t * 2 * absMax))
  })

  svg.append("text")
    .attr("x", 0)
    .attr("y", 11)
    .attr("fill", "#333")
    .style("font", "12px system-ui, sans-serif")
    .style("font-weight", 600)
    .text(title)

  svg.append("rect")
    .attr("x", 0)
    .attr("y", 18)
    .attr("width", width)
    .attr("height", height)
    .attr("rx", 5)
    .attr("fill", `url(#${gradientId})`)

  const x = d3.scaleLinear()
    .domain([-absMax, absMax])
    .range([0, width])

  svg.append("g")
    .attr("transform", `translate(0,${18 + height})`)
    .call(d3.axisBottom(x).tickValues(d3.ticks(-absMax, absMax, ticks)).tickSize(4))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll("text").style("font", "11px system-ui, sans-serif"))

  return svg.node()
}
)}

function _21(md){return(
md`## How to read the charts

For the first comparison, green means a genre has **more** of a feature than other genres on average, while red means **less**.

For the second comparison, green means **popular songs** in that genre score higher on that feature than unpopular songs, while red means the opposite.

So if **sleep** music is strongly negative in loudness, that means sleep tracks are much quieter than the cross-genre baseline. If sleep is negative in loudness in the popularity chart, that means the more popular sleep tracks are even quieter than the less popular ones.`
)}

function _22(md){return(
md`## 1) Genre vs. all other genres

This heatmap shows a broad “fingerprint” for each genre. It is useful for scanning the full field and spotting outliers: which genres are unusually acoustic, speech-heavy, upbeat, slow, or quiet relative to others.`
)}

function _genreVsAllPanel(html,Inputs,featureDefs,colorLegend,diverging,genreVsAll,d3,featureKeys,featureLabels,tooltip,absMax)
{
  const container = html`<div style="display:grid; gap:12px; max-width:100%;">
    <div style="display:flex; align-items:end; justify-content:space-between; gap:16px; flex-wrap:wrap;">
      <div>
        <div style="font:700 20px system-ui, sans-serif; color:#111;">Audio Feature DNA of Genres</div>
        <div style="font:12px system-ui, sans-serif; color:#555; margin-top:4px;">
          Green = more than other genres · Red = less than other genres
        </div>
      </div>
      <div class="control-slot"></div>
    </div>
    <div class="legend-slot"></div>
    <div class="chart-slot"></div>
  </div>`

  const controlSlot = container.querySelector(".control-slot")
  const legendSlot = container.querySelector(".legend-slot")
  const chartSlot = container.querySelector(".chart-slot")

  const controlWrap = html`<label style="display:grid; gap:4px; font:12px system-ui, sans-serif; color:#333;">
    <span style="font-weight:600;">Sort genre overview by</span>
  </label>`

  const sortInput = Inputs.select(
    new Map([
      ["Alphabetical", "genre"],
      ...featureDefs.map(d => [d.label, d.key])
    ]),
    {value: "genre"}
  )

  controlWrap.append(sortInput)
  controlSlot.append(controlWrap)

  legendSlot.append(
    colorLegend({
      scale: diverging,
      title: "Difference score (z)",
      width: 320
    })
  )

  function render() {
    chartSlot.innerHTML = ""

    const sortValue = sortInput.value
    const data = [...genreVsAll]

    if (sortValue === "genre") {
      data.sort((a, b) => d3.ascending(a.genre, b.genre))
    } else {
      data.sort((a, b) => d3.descending(a[sortValue], b[sortValue]))
    }

    const cellW = 82
    const cellH = 22
    const margin = {top: 36, right: 20, bottom: 20, left: 110}
    const width = margin.left + featureKeys.length * cellW + margin.right
    const height = margin.top + data.length * cellH + margin.bottom

    const svg = d3.create("svg")
      .attr("viewBox", [0, 0, width, height])
      .style("max-width", "100%")
      .style("height", "auto")
      .style("background", "white")

    const x = d3.scaleBand()
      .domain(featureKeys)
      .range([margin.left, width - margin.right])
      .paddingInner(0.02)

    const y = d3.scaleBand()
      .domain(data.map(d => d.genre))
      .range([margin.top, height - margin.bottom])
      .paddingInner(0.02)

    svg.append("g")
      .selectAll("text")
      .data(featureKeys)
      .join("text")
      .attr("x", d => x(d) + x.bandwidth() / 2)
      .attr("y", margin.top - 10)
      .attr("text-anchor", "middle")
      .attr("fill", "#222")
      .style("font", "12px system-ui, sans-serif")
      .style("font-weight", 600)
      .text(d => featureLabels.get(d))

    svg.append("g")
      .selectAll("text")
      .data(data)
      .join("text")
      .attr("x", margin.left - 8)
      .attr("y", d => y(d.genre) + y.bandwidth() / 2)
      .attr("dy", "0.32em")
      .attr("text-anchor", "end")
      .attr("fill", "#333")
      .style("font", "11px system-ui, sans-serif")
      .text(d => d.genre)

    const row = svg.append("g")
      .selectAll("g")
      .data(data)
      .join("g")
      .attr("transform", d => `translate(0,${y(d.genre)})`)

    row.selectAll("rect")
      .data(d => featureKeys.map(f => ({genre: d.genre, feature: f, value: d[f]})))
      .join("rect")
      .attr("x", d => x(d.feature))
      .attr("y", 0)
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .attr("fill", d => diverging(d.value))
      .attr("stroke", "rgba(0,0,0,0.18)")
      .on("mouseenter", function(event, d) {
        d3.select(this).attr("stroke", "#111").attr("stroke-width", 1.5)
        tooltip
          .style("opacity", 1)
          .html(`<strong>${d.genre}</strong><br>${featureLabels.get(d.feature)}: ${d.value.toFixed(2)} z`)
      })
      .on("mousemove", event => {
        tooltip.style("left", `${event.clientX + 12}px`).style("top", `${event.clientY + 12}px`)
      })
      .on("mouseleave", function() {
        d3.select(this).attr("stroke", "rgba(0,0,0,0.18)").attr("stroke-width", 1)
        tooltip.style("opacity", 0)
      })

    row.selectAll("text")
      .data(d => featureKeys.map(f => ({genre: d.genre, feature: f, value: d[f]})))
      .join("text")
      .attr("x", d => x(d.feature) + x.bandwidth() / 2)
      .attr("y", y.bandwidth() / 2)
      .attr("dy", "0.33em")
      .attr("text-anchor", "middle")
      .attr("fill", d => Math.abs(d.value) > absMax * 0.45 ? "white" : "#222")
      .style("font", "10px system-ui, sans-serif")
      .text(d => d.value.toFixed(1))

    chartSlot.append(svg.node())
  }

  sortInput.addEventListener("input", render)
  render()

  return container
}


function _24(md){return(
md`The heatmap is good for scanning the whole field, but it is dense. A second view can make the “shape” of each genre easier to compare.`
)}

function _fingerprintChart(featureKeys,d3,absMax,featureShort){return(
({data, width = 175, height = 112, title = d => d.genre.toUpperCase(), dark = true, features = featureKeys.slice(0, 4)} = {}) => {
  const cols = 5
  const cardW = width
  const cardH = height
  const margin = {top: 18, right: 10, bottom: 18, left: 10}
  const fullW = cols * cardW
  const rows = Math.ceil(data.length / cols)
  const fullH = rows * cardH

  const svg = d3.create("svg")
    .attr("viewBox", [0, 0, fullW, fullH])
    .style("max-width", "100%")
    .style("height", "auto")
    .style("background", dark ? "#0b0b0b" : "white")

  const x = d3.scaleLinear()
    .domain([-absMax, absMax])
    .range([margin.left, cardW - margin.right])

  const y = d3.scaleBand()
    .domain(features)
    .range([margin.top, cardH - margin.bottom])
    .padding(0.25)

  const cards = svg.append("g")
    .selectAll("g")
    .data(data)
    .join("g")
    .attr("transform", (d, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      return `translate(${col * cardW},${row * cardH})`
    })

  cards.append("rect")
    .attr("x", 4)
    .attr("y", 4)
    .attr("width", cardW - 8)
    .attr("height", cardH - 8)
    .attr("rx", 10)
    .attr("fill", dark ? "#151515" : "#fafafa")
    .attr("stroke", dark ? "#2b2b2b" : "#ddd")

  cards.append("text")
    .attr("x", cardW / 2)
    .attr("y", 14)
    .attr("text-anchor", "middle")
    .attr("fill", dark ? "white" : "#111")
    .style("font", "600 10px system-ui, sans-serif")
    .text(title)

  cards.each(function(d) {
    const g = d3.select(this)

    g.append("line")
      .attr("x1", x(0))
      .attr("x2", x(0))
      .attr("y1", margin.top - 2)
      .attr("y2", cardH - margin.bottom + 2)
      .attr("stroke", dark ? "#8a8a8a" : "#999")
      .attr("stroke-dasharray", "3,2")

    const entries = features.map(f => ({feature: f, value: d[f]}))

    g.selectAll("line.grid")
      .data(entries)
      .join("line")
      .attr("x1", margin.left)
      .attr("x2", cardW - margin.right)
      .attr("y1", e => y(e.feature) + y.bandwidth() / 2)
      .attr("y2", e => y(e.feature) + y.bandwidth() / 2)
      .attr("stroke", dark ? "#242424" : "#eee")

    g.selectAll("rect.bar")
      .data(entries)
      .join("rect")
      .attr("x", e => Math.min(x(0), x(e.value)))
      .attr("y", e => y(e.feature))
      .attr("width", e => Math.abs(x(e.value) - x(0)))
      .attr("height", y.bandwidth())
      .attr("fill", e => e.value >= 0 ? "#2ecc71" : "#ff5a5f")

    g.selectAll("text.label")
      .data(entries)
      .join("text")
      .attr("x", margin.left)
      .attr("y", e => y(e.feature) + y.bandwidth() / 2)
      .attr("dy", "0.32em")
      .attr("fill", dark ? "#d0d0d0" : "#555")
      .style("font", "9px system-ui, sans-serif")
      .text(e => featureShort.get(e.feature))
  })

  return svg.node()
}
)}

function _genreVsAllFingerprints(genreVsAll,d3,html,fingerprintChart,featureKeys)
{
  const data = [...genreVsAll].sort((a, b) => d3.ascending(a.genre, b.genre))

  const container = html`<div style="display:grid; gap:10px;">
    <div>
      <div style="font:700 18px system-ui, sans-serif; color:#111;">Genre fingerprint small multiples</div>
      <div style="font:12px system-ui, sans-serif; color:#555; margin-top:4px;">
        A compact view of each genre’s shape across a few key features.
      </div>
    </div>
    <div class="chart-slot"></div>
  </div>`

  container.querySelector(".chart-slot").append(
    fingerprintChart({
      data,
      width: 175,
      height: 112,
      title: d => d.genre.toUpperCase(),
      dark: true,
      features: featureKeys.slice(0, 4)
    })
  )

  return container
}


function _27(md){return(
md`## 2) What makes a genre popular?

This second comparison asks a more focused question: within each genre, what separates the **top third** of songs by popularity from the **bottom third**? That makes it more useful for a story about success patterns rather than just genre identity.`
)}

function _genrePopularityPanel(html,Inputs,featureDefs,colorLegend,diverging,genrePopularity,d3,featureKeys,featureLabels,tooltip,absMax)
{
  const container = html`<div style="display:grid; gap:12px; max-width:100%;">
    <div style="display:flex; align-items:end; justify-content:space-between; gap:16px; flex-wrap:wrap;">
      <div>
        <div style="font:700 20px system-ui, sans-serif; color:#111;">Why Is a Genre Popular?</div>
        <div style="font:12px system-ui, sans-serif; color:#555; margin-top:4px;">
          Δ = mean(top-33% popularity) − mean(bottom-33% popularity) within genre
        </div>
        <div style="font:12px system-ui, sans-serif; color:#555; margin-top:2px;">
          Green = popular songs score higher · Red = popular songs score lower
        </div>
      </div>
      <div class="control-slot"></div>
    </div>
    <div class="legend-slot"></div>
    <div class="chart-slot"></div>
  </div>`

  const controlSlot = container.querySelector(".control-slot")
  const legendSlot = container.querySelector(".legend-slot")
  const chartSlot = container.querySelector(".chart-slot")

  const controlWrap = html`<label style="display:grid; gap:4px; font:12px system-ui, sans-serif; color:#333;">
    <span style="font-weight:600;">Sort popularity chart by</span>
  </label>`

  const sortInput = Inputs.select(
    new Map([
      ["Alphabetical", "genre"],
      ...featureDefs.map(d => [d.label, d.key])
    ]),
    {value: "genre"}
  )

  controlWrap.append(sortInput)
  controlSlot.append(controlWrap)

  legendSlot.append(
    colorLegend({
      scale: diverging,
      title: "Popularity gap within genre (z)",
      width: 320
    })
  )

  function render() {
    chartSlot.innerHTML = ""

    const sortValue = sortInput.value
    const data = [...genrePopularity]

    if (sortValue === "genre") {
      data.sort((a, b) => d3.ascending(a.genre, b.genre))
    } else {
      data.sort((a, b) => d3.descending(a[sortValue], b[sortValue]))
    }

    const cellW = 82
    const cellH = 22
    const margin = {top: 36, right: 20, bottom: 20, left: 110}
    const width = margin.left + featureKeys.length * cellW + margin.right
    const height = margin.top + data.length * cellH + margin.bottom

    const svg = d3.create("svg")
      .attr("viewBox", [0, 0, width, height])
      .style("max-width", "100%")
      .style("height", "auto")
      .style("background", "white")

    const x = d3.scaleBand()
      .domain(featureKeys)
      .range([margin.left, width - margin.right])
      .paddingInner(0.02)

    const y = d3.scaleBand()
      .domain(data.map(d => d.genre))
      .range([margin.top, height - margin.bottom])
      .paddingInner(0.02)

    svg.append("g")
      .selectAll("text")
      .data(featureKeys)
      .join("text")
      .attr("x", d => x(d) + x.bandwidth() / 2)
      .attr("y", margin.top - 10)
      .attr("text-anchor", "middle")
      .attr("fill", "#222")
      .style("font", "12px system-ui, sans-serif")
      .style("font-weight", 600)
      .text(d => featureLabels.get(d))

    svg.append("g")
      .selectAll("text")
      .data(data)
      .join("text")
      .attr("x", margin.left - 8)
      .attr("y", d => y(d.genre) + y.bandwidth() / 2)
      .attr("dy", "0.32em")
      .attr("text-anchor", "end")
      .attr("fill", "#333")
      .style("font", "11px system-ui, sans-serif")
      .text(d => d.genre)

    const row = svg.append("g")
      .selectAll("g")
      .data(data)
      .join("g")
      .attr("transform", d => `translate(0,${y(d.genre)})`)

    row.selectAll("rect")
      .data(d => featureKeys.map(f => ({genre: d.genre, feature: f, value: d[f]})))
      .join("rect")
      .attr("x", d => x(d.feature))
      .attr("y", 0)
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .attr("fill", d => diverging(d.value))
      .attr("stroke", "rgba(0,0,0,0.18)")
      .on("mouseenter", function(event, d) {
        d3.select(this).attr("stroke", "#111").attr("stroke-width", 1.5)
        tooltip
          .style("opacity", 1)
          .html(`<strong>${d.genre}</strong><br>${featureLabels.get(d.feature)}: ${d.value.toFixed(2)} z<br><span style="opacity:.8">Popular minus unpopular</span>`)
      })
      .on("mousemove", event => {
        tooltip.style("left", `${event.clientX + 12}px`).style("top", `${event.clientY + 12}px`)
      })
      .on("mouseleave", function() {
        d3.select(this).attr("stroke", "rgba(0,0,0,0.18)").attr("stroke-width", 1)
        tooltip.style("opacity", 0)
      })

    row.selectAll("text")
      .data(d => featureKeys.map(f => ({genre: d.genre, feature: f, value: d[f]})))
      .join("text")
      .attr("x", d => x(d.feature) + x.bandwidth() / 2)
      .attr("y", y.bandwidth() / 2)
      .attr("dy", "0.33em")
      .attr("text-anchor", "middle")
      .attr("fill", d => Math.abs(d.value) > absMax * 0.45 ? "white" : "#222")
      .style("font", "10px system-ui, sans-serif")
      .text(d => d.value.toFixed(1))

    chartSlot.append(svg.node())
  }

  sortInput.addEventListener("input", render)
  render()

  return container
}


function _29(md){return(
md`The popularity heatmap shows broad patterns, but it is still hard to narrate from the full matrix alone. A genre-level drilldown makes the story much clearer.`
)}

function _selectedGenrePanel(html,Inputs,genrePopularity,d3,featureKeys,featureLabels,absMax)
{
  const container = html`<div style="display:grid; gap:12px; max-width:100%;">
    <div style="display:flex; align-items:end; justify-content:space-between; gap:16px; flex-wrap:wrap;">
      <div>
        <div style="font:700 18px system-ui, sans-serif; color:#111;">Genre drilldown</div>
        <div style="font:12px system-ui, sans-serif; color:#555; margin-top:4px;">
          Inspect one genre to see which features most separate its popular tracks from its unpopular tracks.
        </div>
      </div>
      <div class="control-slot"></div>
    </div>
    <div class="summary-slot"></div>
    <div class="chart-slot"></div>
  </div>`

  const controlSlot = container.querySelector(".control-slot")
  const summarySlot = container.querySelector(".summary-slot")
  const chartSlot = container.querySelector(".chart-slot")

  const genreInputWrap = html`<label style="display:grid; gap:4px; font:12px system-ui, sans-serif; color:#333;">
    <span style="font-weight:600;">Inspect one genre</span>
  </label>`

  const genreInput = Inputs.select(
    genrePopularity.map(d => d.genre).sort(d3.ascending),
    {value: "sleep"}
  )

  genreInputWrap.append(genreInput)
  controlSlot.append(genreInputWrap)

  function render() {
    summarySlot.innerHTML = ""
    chartSlot.innerHTML = ""

    const selectedGenre = genreInput.value
    const row = genrePopularity.find(d => d.genre === selectedGenre)

    const entries = featureKeys.map(f => ({
      feature: f,
      label: featureLabels.get(f),
      value: row[f]
    }))

    const maxPos = d3.greatest(entries, d => d.value)
    const maxNeg = d3.least(entries, d => d.value)

    summarySlot.append(html`<div style="font:15px/1.5 Georgia, serif; color:#222;">
      For <strong>${selectedGenre}</strong>, the strongest positive popularity gap is
      <strong>${maxPos.label}</strong> (${maxPos.value.toFixed(2)} z),
      while the strongest negative gap is
      <strong>${maxNeg.label}</strong> (${maxNeg.value.toFixed(2)} z).
    </div>`)

    const data = [...entries].sort((a, b) => d3.descending(Math.abs(a.value), Math.abs(b.value)))

    const margin = {top: 42, right: 30, bottom: 30, left: 130}
    const width = 820
    const height = margin.top + data.length * 34 + margin.bottom

    const svg = d3.create("svg")
      .attr("viewBox", [0, 0, width, height])
      .style("max-width", "100%")
      .style("height", "auto")
      .style("background", "#101214")
      .style("border-radius", "12px")

    const x = d3.scaleLinear()
      .domain([-absMax, absMax])
      .range([margin.left, width - margin.right])

    const y = d3.scaleBand()
      .domain(data.map(d => d.label))
      .range([margin.top, height - margin.bottom])
      .padding(0.22)

    svg.append("text")
      .attr("x", margin.left)
      .attr("y", 24)
      .attr("fill", "white")
      .style("font", "700 18px system-ui, sans-serif")
      .text(`${selectedGenre}: popularity fingerprint`)

    svg.append("text")
      .attr("x", margin.left)
      .attr("y", 40)
      .attr("fill", "#b5b5b5")
      .style("font", "12px system-ui, sans-serif")
      .text("Positive = popular tracks score higher on this feature")

    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(7))
      .call(g => g.select(".domain").attr("stroke", "#666"))
      .call(g => g.selectAll("line").attr("stroke", "#333"))
      .call(g => g.selectAll("text").attr("fill", "#ddd").style("font", "11px system-ui, sans-serif"))

    svg.append("g")
      .call(d3.axisLeft(y).tickSize(0))
      .attr("transform", `translate(${margin.left},0)`)
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll("text").attr("fill", "#eee").style("font", "12px system-ui, sans-serif"))

    svg.append("line")
      .attr("x1", x(0))
      .attr("x2", x(0))
      .attr("y1", margin.top - 6)
      .attr("y2", height - margin.bottom)
      .attr("stroke", "#ddd")
      .attr("stroke-dasharray", "4,3")

    svg.append("g")
      .selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", d => Math.min(x(0), x(d.value)))
      .attr("y", d => y(d.label))
      .attr("width", d => Math.abs(x(d.value) - x(0)))
      .attr("height", y.bandwidth())
      .attr("rx", 4)
      .attr("fill", d => d.value >= 0 ? "#2ecc71" : "#ff5a5f")

    svg.append("g")
      .selectAll("text.value")
      .data(data)
      .join("text")
      .attr("x", d => d.value >= 0 ? x(d.value) + 6 : x(d.value) - 6)
      .attr("y", d => y(d.label) + y.bandwidth() / 2)
      .attr("dy", "0.32em")
      .attr("text-anchor", d => d.value >= 0 ? "start" : "end")
      .attr("fill", "white")
      .style("font", "12px system-ui, sans-serif")
      .text(d => d.value.toFixed(2))

    chartSlot.append(svg.node())
  }

  genreInput.addEventListener("input", render)
  render()

  return container
}


function _31(md){return(
md`A final scannable view can show the popularity “shape” of many genres at once, which is useful if our final project moves from overview to drilldown.`
)}

function _genrePopularityFingerprints(genrePopularity,d3,html,fingerprintChart,featureKeys)
{
  const data = [...genrePopularity].sort((a, b) => d3.ascending(a.genre, b.genre))

  const container = html`<div style="display:grid; gap:10px;">
    <div>
      <div style="font:700 18px system-ui, sans-serif; color:#111;">Popularity fingerprint small multiples</div>
      <div style="font:12px system-ui, sans-serif; color:#555; margin-top:4px;">
        A compact view of how popularity gaps vary across genres.
      </div>
    </div>
    <div class="chart-slot"></div>
  </div>`

  container.querySelector(".chart-slot").append(
    fingerprintChart({
      data,
      width: 175,
      height: 112,
      title: d => d.genre.toUpperCase(),
      dark: true,
      features: featureKeys.slice(0, 4)
    })
  )

  return container
}


async function _musicStory(d3,html,genrePopularity,invalidation,Inputs)
{
  if (typeof d3 === "undefined") {
    return html`<div style="padding:12px; border:1px solid #ddd; border-radius:10px;">
      This cell needs <code>d3 = require("d3@7")</code> first.
    </div>`
  }

  if (typeof genrePopularity === "undefined" || !genrePopularity?.length) {
    return html`<div style="padding:12px; border:1px solid #ddd; border-radius:10px;">
      This cell needs <code>genrePopularity</code> loaded first.
    </div>`
  }

  const RAW_CSV_URL =
    "https://huggingface.co/datasets/maharshipandya/spotify-tracks-dataset/resolve/main/dataset.csv?download=true"

  let rawTracks = []
  try {
    rawTracks = await d3.csv(RAW_CSV_URL, d3.autoType)
  } catch (err) {
    console.error("Could not load raw Spotify dataset:", err)
    rawTracks = []
  }

  const featureDefs = [
    {key: "danceability", label: "Danceability"},
    {key: "energy", label: "Energy"},
    {key: "loudness", label: "Loudness"},
    {key: "speechiness", label: "Speechiness"},
    {key: "acousticness", label: "Acousticness"},
    {key: "instrumentalness", label: "Instrumentalness"},
    {key: "liveness", label: "Liveness"},
    {key: "valence", label: "Valence"},
    {key: "tempo", label: "Tempo"},
    {key: "duration", label: "Duration"}
  ]

  const featureKeys = featureDefs.map(d => d.key)
  const featureLabels = new Map(featureDefs.map(d => [d.key, d.label]))

  const glossary = new Map([
    ["danceability", "How suitable a track is for dancing based on rhythm, beat strength, and regularity."],
    ["energy", "A perceptual measure of intensity and activity. High-energy tracks tend to feel fast, loud, and forceful."],
    ["loudness", "Overall loudness. Higher means louder; lower means quieter."],
    ["speechiness", "How speech-like a recording is. High values often mean spoken-word or rap-heavy tracks."],
    ["acousticness", "How likely the track is to be acoustic rather than electronically produced."],
    ["instrumentalness", "How likely the track contains no vocals."],
    ["liveness", "How likely the track sounds like a live performance with an audience."],
    ["valence", "A measure of musical positivity. Higher valence often sounds happier or brighter."],
    ["tempo", "Estimated speed in beats per minute."],
    ["duration", "Track length. Positive means popular songs tend to be longer; negative means shorter."]
  ])

  const allValues = genrePopularity.flatMap(d => featureKeys.map(f => +d[f] || 0))
  const absMax = d3.max(allValues, d => Math.abs(d)) || 1
  const diverging = d3.scaleDiverging([-absMax, 0, absMax], d3.interpolateRdYlGn)

  const strongestPositiveFeature = row => d3.greatest(featureKeys, f => row[f])
  const strongestNegativeFeature = row => d3.least(featureKeys, f => row[f])

  const genreStats = (() => {
    if (!rawTracks.length) return new Map()

    const valid = rawTracks.filter(d =>
      d.track_genre != null &&
      d.track_id != null &&
      d.popularity != null &&
      !Number.isNaN(+d.popularity)
    )

    const rolled = d3.rollups(
      valid,
      rows => {
        const sortedByPopularity = [...rows].sort((a, b) => d3.descending(+a.popularity, +b.popularity))
        const bestTrack = sortedByPopularity[0] || null
        return {
          avgPopularity: d3.mean(rows, d => +d.popularity) ?? 0,
          trackCount: rows.length,
          topTrackId: bestTrack?.track_id ?? null,
          topTrackName: bestTrack?.track_name ?? "Top track",
          topArtist: bestTrack?.artists ?? "",
          topTrackPopularity: bestTrack ? +bestTrack.popularity : null
        }
      },
      d => d.track_genre
    )

    return new Map(rolled)
  })()

  const getTopGenres = n => {
    const lookup = new Map(genrePopularity.map(d => [d.genre, d]))

    if (genreStats.size) {
      return [...genreStats.entries()]
        .sort((a, b) => d3.descending(a[1].avgPopularity, b[1].avgPopularity))
        .slice(0, n)
        .map(([genre]) => lookup.get(genre))
        .filter(Boolean)
    }

    return [...genrePopularity].slice(0, n)
  }

  const getSpotifyTrackForGenre = genre => {
    const stats = genreStats.get(genre)
    if (stats?.topTrackId) {
      return {
        title: stats.topTrackName || "Top track",
        artist: stats.topArtist || "",
        trackId: stats.topTrackId,
        popularity: stats.topTrackPopularity
      }
    }
    return null
  }

  const buildLegend = (title = "Popularity gap within genre (z)") => {
    const width = 360
    const height = 12
    const svg = d3.create("svg").attr("width", width).attr("height", 42)
    const gid = `grad-${Math.random().toString(36).slice(2)}`
    const defs = svg.append("defs")
    const grad = defs.append("linearGradient")
      .attr("id", gid)
      .attr("x1", "0%")
      .attr("x2", "100%")

    d3.range(0, 1.0001, 0.02).forEach(t => {
      grad.append("stop")
        .attr("offset", `${t * 100}%`)
        .attr("stop-color", diverging(-absMax + t * 2 * absMax))
    })

    svg.append("text")
      .attr("x", 0)
      .attr("y", 11)
      .attr("fill", "#333")
      .style("font", "12px system-ui,sans-serif")
      .style("font-weight", 700)
      .text(title)

    svg.append("rect")
      .attr("x", 0)
      .attr("y", 18)
      .attr("width", width)
      .attr("height", height)
      .attr("rx", 6)
      .attr("fill", `url(#${gid})`)

    const x = d3.scaleLinear().domain([-absMax, absMax]).range([0, width])

    svg.append("g")
      .attr("transform", `translate(0,${18 + height})`)
      .call(d3.axisBottom(x).ticks(5).tickSize(4))
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll("text").style("font", "11px system-ui,sans-serif"))

    return svg.node()
  }

  const tooltip = d3.create("div")
    .style("position", "fixed")
    .style("pointer-events", "none")
    .style("opacity", 0)
    .style("z-index", 1000)
    .style("background", "rgba(20,20,20,0.96)")
    .style("color", "white")
    .style("padding", "8px 10px")
    .style("border-radius", "8px")
    .style("font", "12px system-ui,sans-serif")
    .style("line-height", "1.35")
    .style("box-shadow", "0 8px 22px rgba(0,0,0,0.24)")
  document.body.appendChild(tooltip.node())
  invalidation.then(() => tooltip.remove())

  const animateIn = node => {
    node.style.opacity = 0
    node.style.transform = "translateY(8px)"
    node.style.transition = "opacity 450ms ease, transform 450ms ease"
    requestAnimationFrame(() => {
      node.style.opacity = 1
      node.style.transform = "translateY(0)"
    })
    return node
  }

  const fillSelect = (select, values, preferred) => {
    select.innerHTML = ""
    values.forEach(v => {
      const opt = document.createElement("option")
      opt.value = v
      opt.textContent = v
      select.appendChild(opt)
    })
    if (preferred && values.includes(preferred)) select.value = preferred
  }

  // ------------------------------------------------------------
  // Tiny Web Audio sonification lab for feature intuition
  // ------------------------------------------------------------
  let audioCtx = null
  let activeNodes = []

  const getAudioContext = () => {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext
      audioCtx = new Ctx()
    }
    return audioCtx
  }

  const stopAllAudio = () => {
    activeNodes.forEach(node => {
      try { node.stop && node.stop() } catch (e) {}
      try { node.disconnect && node.disconnect() } catch (e) {}
    })
    activeNodes = []
  }

  invalidation.then(() => stopAllAudio())

  const makeGain = (ctx, value = 0.15) => {
    const gain = ctx.createGain()
    gain.gain.value = value
    gain.connect(ctx.destination)
    return gain
  }

  const makeOsc = (ctx, type, freq, start, stop, destination, gainStart = 0.0001, gainPeak = 0.15, attack = 0.02) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, start)
    gain.gain.setValueAtTime(gainStart, start)
    gain.gain.exponentialRampToValueAtTime(gainPeak, start + attack)
    gain.gain.exponentialRampToValueAtTime(0.0001, stop)
    osc.connect(gain)
    gain.connect(destination)
    osc.start(start)
    osc.stop(stop)
    activeNodes.push(osc, gain)
    return {osc, gain}
  }

  const makeNoiseBuffer = ctx => {
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    return buffer
  }

  const noiseBuffer = (() => {
    try {
      const ctx = getAudioContext()
      return makeNoiseBuffer(ctx)
    } catch {
      return null
    }
  })()

  const playFeatureExample = async (featureKey, level = "high") => {
    const ctx = getAudioContext()
    if (ctx.state === "suspended") await ctx.resume()
    stopAllAudio()

    const now = ctx.currentTime + 0.02
    const master = makeGain(ctx, 0.18)
    activeNodes.push(master)

    const kick = (startOffset, strong = false) => {
      const start = now + startOffset
      const stop = start + 0.18
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sine"
      osc.frequency.setValueAtTime(strong ? 140 : 110, start)
      osc.frequency.exponentialRampToValueAtTime(45, stop)
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(strong ? 0.24 : 0.16, start + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, stop)
      osc.connect(gain)
      gain.connect(master)
      osc.start(start)
      osc.stop(stop)
      activeNodes.push(osc, gain)
    }

    const hat = (startOffset, bright = true) => {
      if (!noiseBuffer) return
      const start = now + startOffset
      const stop = start + 0.06
      const src = ctx.createBufferSource()
      const filter = ctx.createBiquadFilter()
      const gain = ctx.createGain()
      src.buffer = noiseBuffer
      filter.type = "highpass"
      filter.frequency.value = bright ? 7000 : 3000
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(bright ? 0.08 : 0.035, start + 0.005)
      gain.gain.exponentialRampToValueAtTime(0.0001, stop)
      src.connect(filter)
      filter.connect(gain)
      gain.connect(master)
      src.start(start)
      src.stop(stop)
      activeNodes.push(src, filter, gain)
    }

    const clap = (startOffset) => {
      if (!noiseBuffer) return
      const start = now + startOffset
      const stop = start + 0.12
      const src = ctx.createBufferSource()
      const band = ctx.createBiquadFilter()
      const gain = ctx.createGain()
      src.buffer = noiseBuffer
      band.type = "bandpass"
      band.frequency.value = 1800
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.09, start + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, stop)
      src.connect(band)
      band.connect(gain)
      gain.connect(master)
      src.start(start)
      src.stop(stop)
      activeNodes.push(src, band, gain)
    }

    const spokenPulse = (startOffset, freq, dur, bright = false) => {
      const start = now + startOffset
      const stop = start + dur
      const osc = ctx.createOscillator()
      const filter = ctx.createBiquadFilter()
      const gain = ctx.createGain()
      osc.type = "sawtooth"
      osc.frequency.setValueAtTime(freq, start)
      filter.type = "bandpass"
      filter.frequency.value = bright ? 1800 : 900
      filter.Q.value = 7
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.12, start + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, stop)
      osc.connect(filter)
      filter.connect(gain)
      gain.connect(master)
      osc.start(start)
      osc.stop(stop)
      activeNodes.push(osc, filter, gain)
    }

    const chord = (freqs, startOffset, dur, type = "triangle", peak = 0.06) => {
      freqs.forEach(f => makeOsc(ctx, type, f, now + startOffset, now + startOffset + dur, master, 0.0001, peak, 0.03))
    }

    const slideTone = (type, startFreq, endFreq, startOffset, dur, peak = 0.12) => {
      const start = now + startOffset
      const stop = start + dur
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = type
      osc.frequency.setValueAtTime(startFreq, start)
      osc.frequency.exponentialRampToValueAtTime(endFreq, stop)
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(peak, start + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, stop)
      osc.connect(gain)
      gain.connect(master)
      osc.start(start)
      osc.stop(stop)
      activeNodes.push(osc, gain)
    }

    const arpeggio = (notes, startOffset, stepDur, type = "triangle", peak = 0.08) => {
      notes.forEach((f, i) => makeOsc(ctx, type, f, now + startOffset + i * stepDur, now + startOffset + i * stepDur + stepDur * 0.85, master, 0.0001, peak, 0.01))
    }

    switch (featureKey) {
      case "danceability":
        if (level === "high") {
          ;[0, 0.5, 1.0, 1.5].forEach(t => kick(t, true))
          ;[0.25, 0.75, 1.25, 1.75].forEach(t => clap(t))
          d3.range(0, 16).forEach(i => hat(i * 0.125, true))
          arpeggio([392, 494, 587, 494, 392, 494, 659, 587], 0, 0.25, "square", 0.045)
        } else {
          kick(0, false); kick(1.0, false); hat(0.35, false); hat(1.45, false)
          chord([220, 277, 330], 0, 1.8, "sine", 0.045)
        }
        break
      case "energy":
        if (level === "high") {
          ;[0, 0.5, 1.0, 1.5].forEach(t => kick(t, true))
          d3.range(0, 16).forEach(i => hat(i * 0.125, true))
          slideTone("sawtooth", 180, 420, 0, 1.8, 0.09)
          arpeggio([330, 392, 494, 659, 784, 659, 494, 392], 0, 0.22, "sawtooth", 0.05)
        } else {
          chord([146, 220, 293], 0, 1.8, "sine", 0.035)
          slideTone("sine", 220, 180, 0.1, 1.4, 0.03)
        }
        break
      case "loudness":
        if (level === "high") {
          makeOsc(ctx, "sawtooth", 440, now, now + 0.5, master, 0.0001, 0.24, 0.02)
          makeOsc(ctx, "square", 660, now + 0.55, now + 1.05, master, 0.0001, 0.22, 0.02)
          makeOsc(ctx, "triangle", 550, now + 1.1, now + 1.7, master, 0.0001, 0.2, 0.02)
        } else {
          makeOsc(ctx, "sine", 440, now, now + 1.5, master, 0.0001, 0.025, 0.08)
        }
        break
      case "speechiness":
        if (level === "high") {
          ;[0, 0.22, 0.46, 0.72, 0.95, 1.2, 1.45].forEach((t, i) => spokenPulse(t, 180 + i * 25, 0.12, true))
          ;[0.14, 0.38, 0.62, 0.86, 1.12, 1.36, 1.6].forEach((t, i) => spokenPulse(t, 130 + i * 18, 0.08, false))
        } else {
          chord([262, 330, 392], 0, 1.6, "triangle", 0.05)
          arpeggio([262, 330, 392, 523], 0.15, 0.32, "triangle", 0.04)
        }
        break
      case "acousticness":
        if (level === "high") {
          arpeggio([196, 247, 294, 392, 294, 247], 0, 0.28, "triangle", 0.06)
          chord([196, 247, 294], 1.0, 0.7, "triangle", 0.045)
        } else {
          makeOsc(ctx, "sawtooth", 220, now, now + 1.7, master, 0.0001, 0.08, 0.03)
          makeOsc(ctx, "square", 440, now + 0.03, now + 1.7, master, 0.0001, 0.04, 0.03)
          hat(0.3, true); hat(0.6, true); hat(0.9, true); hat(1.2, true); hat(1.5, true)
        }
        break
      case "instrumentalness":
        if (level === "high") {
          arpeggio([262, 330, 392, 523, 659, 523, 392, 330], 0, 0.2, "triangle", 0.055)
        } else {
          spokenPulse(0.0, 150, 0.18, false)
          spokenPulse(0.25, 180, 0.14, true)
          spokenPulse(0.48, 160, 0.16, false)
          spokenPulse(0.74, 205, 0.14, true)
          spokenPulse(1.0, 172, 0.18, false)
        }
        break
      case "liveness":
        if (level === "high") {
          chord([196, 247, 294], 0, 1.4, "triangle", 0.05)
          clap(0.45); clap(0.9); clap(1.25)
          if (noiseBuffer) {
            const start = now + 0.15
            const stop = now + 1.75
            const src = ctx.createBufferSource()
            const low = ctx.createBiquadFilter()
            const gain = ctx.createGain()
            src.buffer = noiseBuffer
            low.type = "lowpass"
            low.frequency.value = 900
            gain.gain.setValueAtTime(0.0001, start)
            gain.gain.exponentialRampToValueAtTime(0.03, start + 0.08)
            gain.gain.exponentialRampToValueAtTime(0.0001, stop)
            src.connect(low)
            low.connect(gain)
            gain.connect(master)
            src.start(start)
            src.stop(stop)
            activeNodes.push(src, low, gain)
          }
        } else {
          chord([196, 247, 294], 0, 1.6, "sine", 0.04)
        }
        break
      case "valence":
        if (level === "high") {
          arpeggio([262, 330, 392, 523, 659, 523, 392, 330], 0, 0.2, "triangle", 0.06)
          chord([262, 330, 392], 1.1, 0.6, "triangle", 0.05)
        } else {
          arpeggio([220, 262, 330, 262, 220, 196], 0, 0.28, "sine", 0.045)
          chord([196, 233, 294], 1.0, 0.8, "sine", 0.04)
        }
        break
      case "tempo":
        if (level === "high") {
          ;[0, 0.33, 0.66, 0.99, 1.32, 1.65].forEach(t => kick(t, true))
          d3.range(0, 12).forEach(i => hat(i * 0.165, true))
        } else {
          ;[0, 0.9].forEach(t => kick(t, false))
          hat(0.45, false); hat(1.35, false)
        }
        break
      case "duration":
        if (level === "high") {
          chord([262, 330, 392], 0, 2.5, "triangle", 0.045)
          arpeggio([392, 440, 494, 523, 494, 440, 392, 330], 0.3, 0.25, "triangle", 0.035)
        } else {
          arpeggio([392, 523, 659], 0, 0.18, "square", 0.07)
        }
        break
      default:
        makeOsc(ctx, "sine", 440, now, now + 0.6, master, 0.0001, 0.08, 0.02)
    }
  }

  const buildFeatureAudioLab = () => {
    const wrap = html`<div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:12px;"></div>`

    featureDefs.forEach((fd, i) => {
      const card = html`<div style="
        border:1px solid #e5e7eb;
        border-radius:16px;
        padding:14px;
        background:white;
        display:grid;
        gap:10px;
      "></div>`

      const btnBase = `
        appearance:none;
        border:1px solid #d0d7de;
        background:#fff;
        border-radius:999px;
        padding:8px 10px;
        font:600 12px system-ui,sans-serif;
        cursor:pointer;
      `
      const highBtn = html`<button style="${btnBase}">▶ High</button>`
      const lowBtn = html`<button style="${btnBase}">▶ Low</button>`

      highBtn.onclick = async () => {
        highBtn.textContent = "♪ Playing..."
        await playFeatureExample(fd.key, "high")
        setTimeout(() => { highBtn.textContent = "▶ High" }, 2200)
      }

      lowBtn.onclick = async () => {
        lowBtn.textContent = "♪ Playing..."
        await playFeatureExample(fd.key, "low")
        setTimeout(() => { lowBtn.textContent = "▶ Low" }, 2200)
      }

      card.append(html`<div style="display:flex; align-items:center; gap:10px;">
        <div style="
          width:12px;height:12px;border-radius:999px;
          background:${d3.interpolateTurbo(i / Math.max(1, featureDefs.length - 1))};
          box-shadow:0 0 0 6px rgba(0,0,0,0.03);
        "></div>
        <div style="font:800 14px system-ui,sans-serif;">${fd.label}</div>
      </div>`)

      card.append(html`<div style="font:13px/1.45 system-ui,sans-serif; color:#555;">
        ${glossary.get(fd.key)}
      </div>`)

      const btnRow = html`<div style="display:flex; gap:8px; flex-wrap:wrap;"></div>`
      btnRow.append(lowBtn, highBtn)
      card.append(btnRow)
      wrap.append(card)
    })

    return html`<div style="display:grid; gap:12px;">
      <div style="font:700 14px system-ui,sans-serif; color:#111;">Hear the traits</div>
      <div style="font:13px/1.5 system-ui,sans-serif; color:#555; max-width:900px;">
        These are short synthetic sketches, not real songs. Click low vs high to build intuition for what each feature means before looking at the charts.
      </div>
      ${wrap}
    </div>`
  }

  const buildSpotifyEmbed = genre => {
    const match = getSpotifyTrackForGenre(genre)

    if (!match?.trackId) {
      return html`<div style="
        border:1px dashed #d1d5db;
        border-radius:14px;
        padding:12px 14px;
        background:#fafafa;
        color:#555;
        font:13px/1.5 system-ui,sans-serif;
      ">
        <div style="font-weight:700; color:#111; margin-bottom:4px;">Listen to ${genre}</div>
        No playable track id found for this genre from the raw dataset load.
      </div>`
    }

    return html`<div style="
      border:1px solid #e5e7eb;
      border-radius:14px;
      padding:12px 14px;
      background:#fafafa;
      display:grid;
      gap:8px;
    ">
      <div>
        <div style="font:700 13px system-ui,sans-serif; color:#111;">Listen to ${genre}</div>
        <div style="font:12px/1.4 system-ui,sans-serif; color:#555;">
          ${match.title}${match.artist ? ` — ${match.artist}` : ""}${match.popularity != null ? ` · popularity ${match.popularity}` : ""}
        </div>
      </div>
      <iframe
        style="border-radius:12px"
        src="https://open.spotify.com/embed/track/${match.trackId}?utm_source=generator"
        width="100%"
        height="152"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy">
      </iframe>
    </div>`
  }

  const buildGlossaryCards = () => {
    const wrap = html`<div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:12px;"></div>`
    featureDefs.forEach((fd, i) => {
      const card = html`<div style="
        position:relative;
        border:1px solid #e5e7eb;
        border-radius:16px;
        padding:14px;
        background:linear-gradient(180deg,#fff,#fafafa);
        overflow:hidden;
      ">
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
          <div style="
            width:12px;height:12px;border-radius:999px;
            background:${d3.interpolateTurbo(i / Math.max(1, featureDefs.length - 1))};
            box-shadow:0 0 0 6px rgba(0,0,0,0.03);
            animation:pulse 1.8s ease-in-out infinite;
          "></div>
          <div style="font:800 14px system-ui,sans-serif;">${fd.label}</div>
        </div>
        <div style="font:13px/1.5 system-ui,sans-serif; color:#555;">${glossary.get(fd.key)}</div>
      </div>`
      wrap.append(animateIn(card))
    })
    wrap.append(html`<style>
      @keyframes pulse {
        0% { transform: scale(1); opacity: .85; }
        50% { transform: scale(1.25); opacity: 1; }
        100% { transform: scale(1); opacity: .85; }
      }
    </style>`)
    return wrap
  }

  const buildPopularityFocus = data => {
    const ranked = [...data]
      .map(d => ({
        ...d,
        _avgPopularity: genreStats.get(d.genre)?.avgPopularity ?? 0,
        _trackCount: genreStats.get(d.genre)?.trackCount ?? 0
      }))
      .sort((a, b) => d3.descending(a._avgPopularity, b._avgPopularity))

    const margin = {top: 12, right: 70, bottom: 30, left: 180}
    const width = 980
    const height = margin.top + ranked.length * 34 + margin.bottom

    const svg = d3.create("svg")
      .attr("viewBox", [0, 0, width, height])
      .style("max-width", "100%")
      .style("height", "auto")
      .style("background", "white")
      .style("border-radius", "14px")

    const x = d3.scaleLinear()
      .domain([0, d3.max(ranked, d => d._avgPopularity) || 100]).nice()
      .range([margin.left, width - margin.right])

    const y = d3.scaleBand()
      .domain(ranked.map(d => d.genre))
      .range([margin.top, height - margin.bottom])
      .padding(0.22)

    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(6))
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll("text").style("font", "11px system-ui,sans-serif"))

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).tickSize(0))
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll("text").style("font", "12px system-ui,sans-serif"))

    svg.append("g")
      .selectAll("rect")
      .data(ranked)
      .join("rect")
      .attr("x", margin.left)
      .attr("y", d => y(d.genre))
      .attr("width", 0)
      .attr("height", y.bandwidth())
      .attr("rx", 6)
      .attr("fill", "#7c3aed")
      .transition()
      .duration(900)
      .attr("width", d => x(d._avgPopularity) - margin.left)

    svg.append("g")
      .selectAll("text.value")
      .data(ranked)
      .join("text")
      .attr("x", d => x(d._avgPopularity) + 8)
      .attr("y", d => y(d.genre) + y.bandwidth() / 2)
      .attr("dy", "0.33em")
      .attr("fill", "#333")
      .style("font", "11px system-ui,sans-serif")
      .style("opacity", 0)
      .text(d => d._avgPopularity.toFixed(1))
      .transition()
      .delay(500)
      .duration(300)
      .style("opacity", 1)

    return svg.node()
  }

  const buildHeatmap = data => {
    const orderedFeatures = [...featureKeys]
    const cellW = 80
    const cellH = 26
    const margin = {top: 34, right: 20, bottom: 16, left: 130}
    const width = margin.left + orderedFeatures.length * cellW + margin.right
    const height = margin.top + data.length * cellH + margin.bottom

    const svg = d3.create("svg")
      .attr("viewBox", [0, 0, width, height])
      .style("max-width", "100%")
      .style("height", "auto")
      .style("background", "white")
      .style("border-radius", "14px")

    const x = d3.scaleBand().domain(orderedFeatures).range([margin.left, width - margin.right]).paddingInner(0.03)
    const y = d3.scaleBand().domain(data.map(d => d.genre)).range([margin.top, height - margin.bottom]).paddingInner(0.03)

    svg.append("g")
      .selectAll("text")
      .data(orderedFeatures)
      .join("text")
      .attr("x", d => x(d) + x.bandwidth() / 2)
      .attr("y", 18)
      .attr("text-anchor", "middle")
      .attr("fill", "#222")
      .style("font", "12px system-ui,sans-serif")
      .style("font-weight", 700)
      .text(d => featureLabels.get(d))

    const rows = svg.append("g")
      .selectAll("g")
      .data(data)
      .join("g")
      .attr("transform", d => `translate(0,${y(d.genre)})`)

    rows.append("text")
      .attr("x", margin.left - 12)
      .attr("y", y.bandwidth() / 2)
      .attr("dy", "0.33em")
      .attr("text-anchor", "end")
      .attr("fill", "#333")
      .style("font", "11px system-ui,sans-serif")
      .text(d => d.genre)

    rows.selectAll("rect.cell")
      .data(d => orderedFeatures.map(f => ({genre: d.genre, feature: f, value: d[f]})))
      .join("rect")
      .attr("x", d => x(d.feature))
      .attr("y", 0)
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .attr("rx", 4)
      .attr("fill", "#fff")
      .attr("stroke", "rgba(0,0,0,0.12)")
      .on("mouseenter", function(event, d) {
        d3.select(this).attr("stroke", "#111").attr("stroke-width", 1.5)
        tooltip.style("opacity", 1).html(
          `<strong>${d.genre}</strong><br>${featureLabels.get(d.feature)}: ${d.value.toFixed(2)} z<br><span style="opacity:.8">${glossary.get(d.feature)}</span>`
        )
      })
      .on("mousemove", event => {
        tooltip.style("left", `${event.clientX + 12}px`).style("top", `${event.clientY + 12}px`)
      })
      .on("mouseleave", function() {
        d3.select(this).attr("stroke", "rgba(0,0,0,0.12)").attr("stroke-width", 1)
        tooltip.style("opacity", 0)
      })
      .transition()
      .delay((d, i) => i * 8)
      .duration(500)
      .attr("fill", d => diverging(d.value))

    rows.selectAll("text.value")
      .data(d => orderedFeatures.map(f => ({genre: d.genre, feature: f, value: d[f]})))
      .join("text")
      .attr("x", d => x(d.feature) + x.bandwidth() / 2)
      .attr("y", y.bandwidth() / 2)
      .attr("dy", "0.33em")
      .attr("text-anchor", "middle")
      .attr("fill", d => Math.abs(d.value) > absMax * 0.45 ? "white" : "#222")
      .style("font", "10px system-ui,sans-serif")
      .style("opacity", 0)
      .text(d => d.value.toFixed(1))
      .transition()
      .delay(350)
      .duration(250)
      .style("opacity", 1)

    return svg.node()
  }

  const buildHeadToHead = (rowA, rowB) => {
    const entries = featureKeys.map(f => ({
      key: f,
      label: featureLabels.get(f),
      a: rowA[f],
      b: rowB[f],
      gap: Math.abs(rowA[f] - rowB[f])
    })).sort((a, b) => d3.descending(a.gap, b.gap))

    const margin = {top: 16, right: 34, bottom: 32, left: 160}
    const width = 940
    const height = margin.top + entries.length * 34 + margin.bottom

    const svg = d3.create("svg")
      .attr("viewBox", [0, 0, width, height])
      .style("max-width", "100%")
      .style("height", "auto")
      .style("background", "white")
      .style("border-radius", "14px")

    const x = d3.scaleLinear().domain([-absMax, absMax]).range([margin.left, width - margin.right])
    const y = d3.scaleBand().domain(entries.map(d => d.label)).range([margin.top, height - margin.bottom]).padding(0.35)

    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(6))
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll("text").style("font", "11px system-ui,sans-serif"))

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).tickSize(0))
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll("text").style("font", "12px system-ui,sans-serif"))

    svg.append("line")
      .attr("x1", x(0)).attr("x2", x(0))
      .attr("y1", margin.top - 4).attr("y2", height - margin.bottom)
      .attr("stroke", "#9ca3af")
      .attr("stroke-dasharray", "4,4")

    svg.append("g")
      .selectAll("line")
      .data(entries)
      .join("line")
      .attr("x1", d => x(d.a))
      .attr("x2", d => x(d.a))
      .attr("y1", d => y(d.label) + y.bandwidth() / 2)
      .attr("y2", d => y(d.label) + y.bandwidth() / 2)
      .attr("stroke", "#d1d5db")
      .attr("stroke-width", 3)
      .transition()
      .duration(600)
      .attr("x2", d => x(d.b))

    svg.append("g")
      .selectAll("circle.a")
      .data(entries)
      .join("circle")
      .attr("cx", d => x(d.a))
      .attr("cy", d => y(d.label) + y.bandwidth() / 2)
      .attr("r", 0)
      .attr("fill", "#2563eb")
      .transition()
      .duration(500)
      .attr("r", 6)

    svg.append("g")
      .selectAll("circle.b")
      .data(entries)
      .join("circle")
      .attr("cx", d => x(d.b))
      .attr("cy", d => y(d.label) + y.bandwidth() / 2)
      .attr("r", 0)
      .attr("fill", "#f97316")
      .transition()
      .delay(120)
      .duration(500)
      .attr("r", 6)

    const wrap = html`<div style="display:grid; gap:12px;"></div>`
    wrap.append(html`<div style="display:flex; gap:18px; flex-wrap:wrap; align-items:center; font:12px system-ui,sans-serif; color:#444;">
      <div style="display:flex; gap:8px; align-items:center;"><span style="width:12px;height:12px;border-radius:999px;background:#2563eb;display:inline-block;"></span>${rowA.genre}</div>
      <div style="display:flex; gap:8px; align-items:center;"><span style="width:12px;height:12px;border-radius:999px;background:#f97316;display:inline-block;"></span>${rowB.genre}</div>
    </div>`)
    wrap.append(svg.node())
    return wrap
  }

  const buildSpotlightCards = data => {
    const selected = [data[0], data[Math.floor(data.length / 2)], data[data.length - 1]].filter(Boolean)
    const wrap = html`<div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(320px,1fr)); gap:14px;"></div>`

    selected.forEach((row, idx) => {
      const pos = strongestPositiveFeature(row)
      const neg = strongestNegativeFeature(row)
      const entries = featureKeys.map(f => ({
        label: featureLabels.get(f),
        value: row[f]
      })).sort((a, b) => d3.descending(Math.abs(a.value), Math.abs(b.value))).slice(0, 4)

      const card = html`<div style="
        border:1px solid #e5e7eb;border-radius:18px;padding:14px;background:white;
        box-shadow:0 1px 0 rgba(0,0,0,0.02);
        display:grid;gap:12px;
      "></div>`

      card.append(html`<div style="display:grid; gap:4px;">
        <div style="font:800 18px system-ui,sans-serif;">${row.genre}</div>
        <div style="font:13px/1.5 system-ui,sans-serif; color:#444;">
          Popular songs here lean most toward <strong>${featureLabels.get(pos)}</strong>
          and away from <strong>${featureLabels.get(neg)}</strong>.
        </div>
      </div>`)

      const margin = {top: 8, right: 18, bottom: 18, left: 100}
      const width = 340
      const height = margin.top + entries.length * 28 + margin.bottom
      const svg = d3.create("svg")
        .attr("viewBox", [0, 0, width, height])
        .style("max-width", "100%")
        .style("height", "auto")
        .style("background", "#101214")
        .style("border-radius", "12px")

      const x = d3.scaleLinear().domain([-absMax, absMax]).range([margin.left, width - margin.right])
      const y = d3.scaleBand().domain(entries.map(d => d.label)).range([margin.top, height - margin.bottom]).padding(0.25)

      svg.append("line")
        .attr("x1", x(0)).attr("x2", x(0))
        .attr("y1", margin.top - 2).attr("y2", height - margin.bottom)
        .attr("stroke", "#d1d5db")
        .attr("stroke-dasharray", "4,4")

      svg.append("g")
        .selectAll("text")
        .data(entries)
        .join("text")
        .attr("x", margin.left - 8)
        .attr("y", d => y(d.label) + y.bandwidth() / 2)
        .attr("dy", "0.33em")
        .attr("text-anchor", "end")
        .attr("fill", "#e5e7eb")
        .style("font", "10px system-ui,sans-serif")
        .text(d => d.label)

      svg.append("g")
        .selectAll("rect")
        .data(entries)
        .join("rect")
        .attr("x", x(0))
        .attr("y", d => y(d.label))
        .attr("height", y.bandwidth())
        .attr("rx", 4)
        .attr("fill", d => d.value >= 0 ? "#22c55e" : "#ef4444")
        .transition()
        .delay(idx * 160)
        .duration(700)
        .attr("x", d => Math.min(x(0), x(d.value)))
        .attr("width", d => Math.abs(x(d.value) - x(0)))

      card.append(svg.node())
      card.append(buildSpotifyEmbed(row.genre))
      wrap.append(animateIn(card))
    })

    return wrap
  }

  const buildSummaryBars = data => {
    const entries = featureKeys.map(f => ({
      key: f,
      label: featureLabels.get(f),
      mean: d3.mean(data, d => d[f]) ?? 0
    })).sort((a, b) => d3.descending(Math.abs(a.mean), Math.abs(b.mean)))

    const margin = {top: 12, right: 24, bottom: 32, left: 150}
    const width = 920
    const height = margin.top + entries.length * 34 + margin.bottom

    const svg = d3.create("svg")
      .attr("viewBox", [0, 0, width, height])
      .style("max-width", "100%")
      .style("height", "auto")
      .style("background", "white")
      .style("border-radius", "14px")

    const x = d3.scaleLinear().domain([-absMax, absMax]).range([margin.left, width - margin.right])
    const y = d3.scaleBand().domain(entries.map(d => d.label)).range([margin.top, height - margin.bottom]).padding(0.22)

    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(6))
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll("text").style("font", "11px system-ui,sans-serif"))

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).tickSize(0))
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll("text").style("font", "12px system-ui,sans-serif"))

    svg.append("line")
      .attr("x1", x(0)).attr("x2", x(0))
      .attr("y1", margin.top - 4).attr("y2", height - margin.bottom)
      .attr("stroke", "#9ca3af")
      .attr("stroke-dasharray", "4,4")

    svg.append("g")
      .selectAll("rect")
      .data(entries)
      .join("rect")
      .attr("x", x(0))
      .attr("y", d => y(d.label))
      .attr("height", y.bandwidth())
      .attr("rx", 5)
      .attr("fill", d => d.mean >= 0 ? "#22c55e" : "#ef4444")
      .transition()
      .duration(850)
      .attr("x", d => Math.min(x(0), x(d.mean)))
      .attr("width", d => Math.abs(x(d.mean) - x(0)))

    svg.append("g")
      .selectAll("text")
      .data(entries)
      .join("text")
      .attr("x", d => d.mean >= 0 ? x(d.mean) + 7 : x(d.mean) - 7)
      .attr("y", d => y(d.label) + y.bandwidth() / 2)
      .attr("dy", "0.33em")
      .attr("text-anchor", d => d.mean >= 0 ? "start" : "end")
      .attr("fill", "#333")
      .style("font", "11px system-ui,sans-serif")
      .style("opacity", 0)
      .text(d => d.mean.toFixed(2))
      .transition()
      .delay(450)
      .duration(250)
      .style("opacity", 1)

    return svg.node()
  }

  const container = html`<div style="
    display:grid;
    gap:20px;
    max-width:1180px;
    font-family:Inter,system-ui,sans-serif;
    color:#111;
  ">
    <div style="display:grid; gap:8px;">
      <div style="font:800 36px/1.02 system-ui,sans-serif;">The Sound of Popularity</div>
      <div style="font:15px/1.55 system-ui,sans-serif; color:#444; max-width:980px;">
        A guided walk through what popularity looks like inside a genre.
        <span style="color:#1a7f37; font-weight:700;">Green</span> means popular songs score higher on that feature;
        <span style="color:#b42318; font-weight:700;">red</span> means they score lower.
      </div>
    </div>

    <div style="display:flex; flex-wrap:wrap; gap:16px; align-items:end;">
      <div class="step-wrap"></div>
      <div class="topn-wrap"></div>
      <div class="genreA-wrap"></div>
      <div class="genreB-wrap"></div>
      <div class="play-wrap"></div>
    </div>

    <div class="progress-wrap"></div>
    <div class="headline-wrap"></div>
    <div class="legend-wrap"></div>
    <div class="viz-wrap"></div>
    <div class="callout-wrap"></div>
  </div>`

  const stepWrap = container.querySelector(".step-wrap")
  const topNWrap = container.querySelector(".topn-wrap")
  const genreAWrap = container.querySelector(".genreA-wrap")
  const genreBWrap = container.querySelector(".genreB-wrap")
  const playWrap = container.querySelector(".play-wrap")
  const progressWrap = container.querySelector(".progress-wrap")
  const headlineWrap = container.querySelector(".headline-wrap")
  const legendWrap = container.querySelector(".legend-wrap")
  const vizWrap = container.querySelector(".viz-wrap")
  const calloutWrap = container.querySelector(".callout-wrap")

  const stepInput = Inputs.range([1, 6], {step: 1, value: 1})
  const topNInput = Inputs.range([8, 25], {step: 1, value: 15})
  const genreAInput = html`<select style="padding:8px 10px;border:1px solid #ddd;border-radius:10px;background:white;"></select>`
  const genreBInput = html`<select style="padding:8px 10px;border:1px solid #ddd;border-radius:10px;background:white;"></select>`
  const playBtn = html`<button style="
    appearance:none;border:none;border-radius:999px;padding:10px 14px;
    background:#111;color:white;font:600 13px system-ui,sans-serif;cursor:pointer;
  ">▶ Play story</button>`

  stepWrap.append(html`<label style="display:grid; gap:5px; font:12px system-ui,sans-serif; color:#444;">
    <span style="font-weight:700;">Story step</span>
    ${stepInput}
  </label>`)

  topNWrap.append(html`<label style="display:grid; gap:5px; font:12px system-ui,sans-serif; color:#444; min-width:150px;">
    <span style="font-weight:700;">Genres to show</span>
    ${topNInput}
  </label>`)

  genreAWrap.append(html`<label style="display:grid; gap:5px; font:12px system-ui,sans-serif; color:#444; min-width:170px;">
    <span style="font-weight:700;">Compare genre A</span>
    ${genreAInput}
  </label>`)

  genreBWrap.append(html`<label style="display:grid; gap:5px; font:12px system-ui,sans-serif; color:#444; min-width:170px;">
    <span style="font-weight:700;">Compare genre B</span>
    ${genreBInput}
  </label>`)

  playWrap.append(html`<label style="display:grid; gap:5px; font:12px system-ui,sans-serif; color:#444;">
    <span style="font-weight:700;">Autoplay</span>
    ${playBtn}
  </label>`)

  const stepMeta = [
    {
      title: "1. Meet the musical traits",
      subtitle: "Start with the building blocks: rhythm, energy, loudness, positivity, acoustic character, and more."
    },
    {
      title: "2. Start with popularity",
      subtitle: rawTracks.length
        ? "These are ranked by average track popularity from the raw Spotify dataset."
        : "Raw dataset could not be loaded; this step falls back to the current order."
    },
    {
      title: "3. Scan the full musical landscape",
      subtitle: "Across genres, the same trait can help in one place and hurt in another."
    },
    {
      title: "4. Put two genres head-to-head",
      subtitle: "This makes the genre-specific differences feel concrete."
    },
    {
      title: "5. Walk through a few memorable examples",
      subtitle: "A handful of genre spotlights turns the matrix into readable mini-stories."
    },
    {
      title: "6. End with the big takeaway",
      subtitle: "Popularity has patterns, but there is still no single recipe for a hit."
    }
  ]

  let timer = null
  let playing = false

  const stopPlaying = () => {
    playing = false
    playBtn.textContent = "▶ Play story"
    if (timer) clearInterval(timer)
    timer = null
  }

  const startPlaying = () => {
    playing = true
    playBtn.textContent = "⏸ Pause story"
    if (timer) clearInterval(timer)
    timer = setInterval(() => {
      const current = +stepInput.value
      stepInput.value = current < 6 ? current + 1 : 1
      render()
    }, 4300)
  }

  playBtn.onclick = () => playing ? stopPlaying() : startPlaying()
  invalidation.then(() => { if (timer) clearInterval(timer) })

  function render() {
    const step = +stepInput.value
    const topN = +topNInput.value
    const visible = getTopGenres(topN)
    const names = visible.map(d => d.genre)

    fillSelect(genreAInput, names, genreAInput.value || names[0])
    fillSelect(
      genreBInput,
      names,
      genreBInput.value && genreBInput.value !== genreAInput.value
        ? genreBInput.value
        : names[Math.min(1, names.length - 1)]
    )
    if (genreAInput.value === genreBInput.value && names.length > 1) genreBInput.value = names[1]

    progressWrap.innerHTML = ""
    headlineWrap.innerHTML = ""
    legendWrap.innerHTML = ""
    vizWrap.innerHTML = ""
    calloutWrap.innerHTML = ""

    const pills = html`<div style="display:flex; gap:8px; flex-wrap:wrap;"></div>`
    stepMeta.forEach((s, i) => {
      pills.append(html`<div style="
        padding:6px 10px;border-radius:999px;font:12px system-ui,sans-serif;
        background:${i + 1 === step ? "#111" : "#f3f4f6"};
        color:${i + 1 === step ? "white" : "#444"};
        border:${i + 1 === step ? "none" : "1px solid #e5e7eb"};
      ">${i + 1}</div>`)
    })
    progressWrap.append(pills)

    headlineWrap.append(animateIn(html`<div style="display:grid; gap:6px;">
      <div style="font:800 24px system-ui,sans-serif;">${stepMeta[step - 1].title}</div>
      <div style="font:14px/1.55 system-ui,sans-serif; color:#444; max-width:950px;">
        ${stepMeta[step - 1].subtitle}
      </div>
    </div>`))

    if (step === 1) {
      vizWrap.append(html`<div style="display:grid; gap:18px;">
        ${buildGlossaryCards()}
        ${buildFeatureAudioLab()}
      </div>`)
      calloutWrap.append(html`<div style="font:14px/1.55 system-ui,sans-serif; color:#444; max-width:930px;">
        <strong>What to notice:</strong> these are measurable traits of the sound itself—rhythm, loudness, positivity, acoustic character, and more. The synthetic low/high buttons make the abstract audio features easier to hear before you start reading the data.
      </div>`)
    }

    if (step === 2) {
      vizWrap.append(buildPopularityFocus(visible))
      const topGenre = visible[0]
      const topStats = genreStats.get(topGenre?.genre)
      calloutWrap.append(html`<div style="display:grid; gap:12px;">
        <div style="font:14px/1.55 system-ui,sans-serif; color:#444; max-width:930px;">
          <strong>What to notice:</strong>
          ${
            rawTracks.length
              ? `these are ranked by actual average song popularity from the raw Spotify dataset. The leading genre here averages ${topStats ? topStats.avgPopularity.toFixed(1) : "—"} popularity across ${topStats?.trackCount ?? "—"} songs.`
              : `the raw file did not load, so this step cannot compute true average genre popularity.`
          }
        </div>
        ${topGenre ? buildSpotifyEmbed(topGenre.genre) : html`<div></div>`}
      </div>`)
    }

    if (step === 3) {
      legendWrap.append(buildLegend("Popularity gap within genre (z)"))
      vizWrap.append(buildHeatmap(visible))
      const topFeature = (() => {
        const featureMeans = featureKeys.map(f => ({f, m: d3.mean(visible, d => d[f]) ?? 0}))
        return d3.greatest(featureMeans, d => Math.abs(d.m))
      })()
      calloutWrap.append(html`<div style="font:14px/1.55 system-ui,sans-serif; color:#444; max-width:930px;">
        <strong>What to notice:</strong> the colors do not form one clean pattern across rows.
        Popularity behaves differently by genre. In this view, <strong>${featureLabels.get(topFeature.f)}</strong> stands out most overall, but not in the same way everywhere.
      </div>`)
    }

    if (step === 4) {
      const rowA = visible.find(d => d.genre === genreAInput.value) ?? visible[0]
      const rowB = visible.find(d => d.genre === genreBInput.value) ?? visible[1]
      vizWrap.append(buildHeadToHead(rowA, rowB))
      const biggest = featureKeys
        .map(f => ({f, gap: Math.abs(rowA[f] - rowB[f])}))
        .sort((a, b) => d3.descending(a.gap, b.gap))[0]

      calloutWrap.append(html`<div style="display:grid; gap:12px;">
        <div style="font:14px/1.55 system-ui,sans-serif; color:#444; max-width:930px;">
          <strong>What to notice:</strong> these two genres split most on <strong>${featureLabels.get(biggest.f)}</strong>.
          That is the clearest sign that a “hit” means something different depending on the genre.
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          ${buildSpotifyEmbed(rowA.genre)}
          ${buildSpotifyEmbed(rowB.genre)}
        </div>
      </div>`)
    }

    if (step === 5) {
      vizWrap.append(buildSpotlightCards(visible))
      calloutWrap.append(html`<div style="font:14px/1.55 system-ui,sans-serif; color:#444; max-width:930px;">
        <strong>What to notice:</strong> once you pause on individual genres, the story becomes much easier to read.
        Some reward more upbeat, energetic, or danceable songs; others reward the opposite.
      </div>`)
    }

    if (step === 6) {
      legendWrap.append(buildLegend("Average popularity gap across visible genres (z)"))
      vizWrap.append(buildSummaryBars(visible))
      const strongest = featureKeys
        .map(f => ({f, m: d3.mean(visible, d => d[f]) ?? 0}))
        .sort((a, b) => d3.descending(Math.abs(a.m), Math.abs(b.m)))[0]

      calloutWrap.append(html`<div style="font:14px/1.55 system-ui,sans-serif; color:#444; max-width:930px;">
        <strong>Final takeaway:</strong> genres do have recurring popularity fingerprints, and <strong>${featureLabels.get(strongest.f)}</strong>
        is the strongest overall signal in this view—but there is still no single recipe that explains every genre.
      </div>`)
    }
  }

  stepInput.addEventListener("input", render)
  topNInput.addEventListener("input", render)
  genreAInput.addEventListener("input", render)
  genreBInput.addEventListener("input", render)

  render()
  return container
}


function _whatmakesagenrepopular(__query,FileAttachment,invalidation){return(
__query(FileAttachment("whatmakesagenrepopular.csv"),{from:{table:"whatmakesagenrepopular"},sort:[],slice:{to:null,from:null},filter:[],select:{columns:null}},invalidation)
)}

function _genresagainstoneanother(__query,FileAttachment,invalidation){return(
__query(FileAttachment("genresagainstoneanother.csv"),{from:{table:"genresagainstoneanother"},sort:[],slice:{to:null,from:null},filter:[],select:{columns:null}},invalidation)
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["genresagainstoneanother.csv", {url: new URL("./files/605240c23326a88dbb379a13268f67c19a6bd9f52c005c25a6a7cc5d997985a83b4450ff847802ab994836907ba26ea858face8ed598620ebf078cf4fc3c35f1.csv", import.meta.url), mimeType: "text/csv", toString}],
    ["whatmakesagenrepopular.csv", {url: new URL("./files/d73403ee459cf8d466c0addc263b7fea810dac9071dfbfed79bda477221266600f5b42d59159be3ed019a9cd053029a289a95c28ff435b01a3363177a6000316.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["md"], _2);
  main.variable(observer()).define(["md"], _3);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("genreVsAllRaw")).define("genreVsAllRaw", ["FileAttachment"], _genreVsAllRaw);
  main.variable(observer("genrePopularityRaw")).define("genrePopularityRaw", ["FileAttachment"], _genrePopularityRaw);
  main.variable(observer()).define(["md"], _7);
  main.variable(observer("featureDefs")).define("featureDefs", _featureDefs);
  main.variable(observer("featureKeys")).define("featureKeys", ["featureDefs"], _featureKeys);
  main.variable(observer("featureLabels")).define("featureLabels", ["featureDefs"], _featureLabels);
  main.variable(observer("featureShort")).define("featureShort", ["featureDefs"], _featureShort);
  main.variable(observer("normalizeGenreVsAll")).define("normalizeGenreVsAll", _normalizeGenreVsAll);
  main.variable(observer("normalizeGenrePopularity")).define("normalizeGenrePopularity", _normalizeGenrePopularity);
  main.variable(observer("genreVsAll")).define("genreVsAll", ["genreVsAllRaw","normalizeGenreVsAll"], _genreVsAll);
  main.variable(observer("genrePopularity")).define("genrePopularity", ["genrePopularityRaw","normalizeGenrePopularity"], _genrePopularity);
  main.variable(observer("allValues")).define("allValues", ["genreVsAll","featureKeys","genrePopularity"], _allValues);
  main.variable(observer("absMax")).define("absMax", ["d3","allValues"], _absMax);
  main.variable(observer("diverging")).define("diverging", ["d3","absMax"], _diverging);
  main.variable(observer("tooltip")).define("tooltip", ["d3","invalidation"], _tooltip);
  main.variable(observer("colorLegend")).define("colorLegend", ["d3","absMax"], _colorLegend);
  main.variable(observer()).define(["md"], _21);
  main.variable(observer()).define(["md"], _22);
  main.variable(observer("genreVsAllPanel")).define("genreVsAllPanel", ["html","Inputs","featureDefs","colorLegend","diverging","genreVsAll","d3","featureKeys","featureLabels","tooltip","absMax"], _genreVsAllPanel);
  main.variable(observer()).define(["md"], _24);
  main.variable(observer("fingerprintChart")).define("fingerprintChart", ["featureKeys","d3","absMax","featureShort"], _fingerprintChart);
  main.variable(observer("genreVsAllFingerprints")).define("genreVsAllFingerprints", ["genreVsAll","d3","html","fingerprintChart","featureKeys"], _genreVsAllFingerprints);
  main.variable(observer()).define(["md"], _27);
  main.variable(observer("genrePopularityPanel")).define("genrePopularityPanel", ["html","Inputs","featureDefs","colorLegend","diverging","genrePopularity","d3","featureKeys","featureLabels","tooltip","absMax"], _genrePopularityPanel);
  main.variable(observer()).define(["md"], _29);
  main.variable(observer("selectedGenrePanel")).define("selectedGenrePanel", ["html","Inputs","genrePopularity","d3","featureKeys","featureLabels","absMax"], _selectedGenrePanel);
  main.variable(observer()).define(["md"], _31);
  main.variable(observer("genrePopularityFingerprints")).define("genrePopularityFingerprints", ["genrePopularity","d3","html","fingerprintChart","featureKeys"], _genrePopularityFingerprints);
  main.variable(observer("musicStory")).define("musicStory", ["d3","html","genrePopularity","invalidation","Inputs"], _musicStory);
  main.variable(observer("whatmakesagenrepopular")).define("whatmakesagenrepopular", ["__query","FileAttachment","invalidation"], _whatmakesagenrepopular);
  main.variable(observer("genresagainstoneanother")).define("genresagainstoneanother", ["__query","FileAttachment","invalidation"], _genresagainstoneanother);
  return main;
}
