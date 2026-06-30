const CSV_GENRE = "./f7d11845f8925709/files/605240c23326a88dbb379a13268f67c19a6bd9f52c005c25a6a7cc5d997985a83b4450ff847802ab994836907ba26ea858face8ed598620ebf078cf4fc3c35f1.csv";
const CSV_POPULAR = "./f7d11845f8925709/files/d73403ee459cf8d466c0addc263b7fea810dac9071dfbfed79bda477221266600f5b42d59159be3ed019a9cd053029a289a95c28ff435b01a3363177a6000316.csv";
const CSV_TRACKS = "./data/spotify_tracks.csv";

const features = [
  { key: "tempo", genreCol: "Tempo", popularCol: "Tempo", label: "Tempo", short: "Tempo", color: "#8aa2ff", definition: "The estimated speed of the song.", producer: "Tempo shapes the physical feel of a track — whether it pulls listeners to nod, dance, sprint, or sway." },
  { key: "speechiness", genreCol: "Speech", popularCol: "Speechiness", label: "Speechiness", short: "Speech", color: "#b98cff", definition: "How much a track resembles spoken-word delivery, rap, chants, or talk-like vocals.", producer: "Rap verses, spoken word passages, and chant hooks gain impact by contrasting with melodic sections — the shift in delivery keeps listeners engaged." },
  { key: "danceability", genreCol: "Dance", popularCol: "Danceability", label: "Danceability", short: "Dance", color: "#ff4f7b", definition: "How much the track supports steady movement through beat strength, tempo stability, and rhythmic regularity.", producer: "Danceability is rhythmic infrastructure. A groove feels bigger when the beat leaves clean space and the tempo stays locked — giving movement somewhere to land." },
  { key: "energy", genreCol: "Energy", popularCol: "Energy", label: "Energy", short: "Energy", color: "#f8c14a", definition: "The intensity of a track: density, drive, speed, and perceived force.", producer: "Energy shapes the arc of a track. A well-placed drop or final chorus hits harder when the build controls intensity without exhausting the listener first." },
  { key: "loudness", genreCol: "Loud", popularCol: "Loudness", label: "Loudness", short: "Loud", color: "#55c7ff", definition: "Overall volume and perceived brightness after production and mastering.", producer: "Loudness affects how a track punches through a playlist. It can create polish and presence, but heavy compression risks flattening the dynamic contrast that makes moments feel impactful." }
];

const rankByExplanations = {
  popularity: {
    label: "Popularity signal",
    description: "Genres are ranked by how strongly their audio traits shift between obscure and popular songs. A high score means the genre's hits sound noticeably different from its deep cuts across all five traits — the bigger the average gap, the higher it ranks. All five dots are relevant: any of them may be driving the score.",
    highlight: ["tempo", "speechiness", "danceability", "energy", "loudness"]
  },
  distinctive: {
    label: "Distinctiveness",
    description: "Genres are ranked by how far their average audio profile sits from the center across all five traits. The direction doesn't matter — only magnitude. A genre that is extremely fast, extremely loud, and extremely danceable ranks high even if those traits point in different directions. All five dots contribute equally.",
    highlight: ["tempo", "speechiness", "danceability", "energy", "loudness"]
  },
  tempo: {
    label: "Tempo",
    description: "Genres are ranked by their tempo z-score — how fast or slow they are compared to the average across all genres. Positive means faster than average, negative means slower. Only the Tempo dot drives the ranking.",
    highlight: ["tempo"]
  },
  speechiness: {
    label: "Speechiness",
    description: "Genres are ranked by their speechiness z-score — how much their tracks resemble spoken-word delivery, rap, or chant versus pure melody. High speechiness genres lean heavily on verbal rhythm. Only the Speechiness dot drives the ranking.",
    highlight: ["speechiness"]
  },
  danceability: {
    label: "Danceability",
    description: "Genres are ranked by their danceability z-score — how strongly their tracks support steady movement through beat regularity, tempo stability, and rhythmic structure. Only the Danceability dot drives the ranking.",
    highlight: ["danceability"]
  },
  energy: {
    label: "Energy",
    description: "Genres are ranked by their energy z-score — how intense, dense, and driven their tracks feel. High-energy genres tend to be loud, fast, and relentless. Only the Energy dot drives the ranking.",
    highlight: ["energy"]
  },
  loudness: {
    label: "Loudness",
    description: "Genres are ranked by their loudness z-score — the overall volume and perceived brightness after mastering. Louder genres sit closer to 0 dB; quieter genres sit further negative. Only the Loudness dot drives the ranking.",
    highlight: ["loudness"]
  }
};

const activeFeatureKeys = ["tempo", "speechiness", "danceability", "energy", "loudness"];
const activeFeatures = features;
const topTraitKeys = activeFeatureKeys;
const tooltip = d3.select("#tooltip");
const state = {
  genreRows: [],
  popularityRows: [],
  tracks: [],
  byGenre: new Map(),
  byPopularGenre: new Map(),
  tracksByGenre: new Map(),
  selectedTrait: "danceability",
  compareGenreA: null,
  compareGenreB: null,
  rankBy: "popularity",
  showAll: false,
  showPopularity: false,
  popularityDirection: "top",
  showRankDetail: false,
  selectedFingerprint: null,
  sampleTrait: "danceability",
  traitGame: { round: 0, score: 0, answered: false, history: [], streak: 0, currentRound: null, usedIds: new Set(), roundIndex: -1 },
  proximityGame: { round: 0, score: 0, answered: false, history: [], streak: 0, currentRound: null, usedIds: new Set() },
  pinnedHeroGenre: null
};

let audioContext;

Promise.all([
  d3.csv(CSV_GENRE, normalizeGenreRow),
  d3.csv(CSV_POPULAR, normalizePopularityRow),
  d3.csv(CSV_TRACKS, normalizeTrackRow)
]).then(([genreRows, popularityRows, tracks]) => {
  state.genreRows = genreRows;
  state.popularityRows = popularityRows;
  state.byGenre = new Map(genreRows.map(d => [d.genre, d]));
  state.byPopularGenre = new Map(popularityRows.map(d => [d.genre, d]));
  state.tracks = tracks.filter(d => d.track_id && state.byGenre.has(d.genre));
  state.tracksByGenre = d3.group(state.tracks, d => d.genre);
  initializeControls();
  renderAll();
  installScrollSpy();
}).catch(error => {
  document.querySelector("main").insertAdjacentHTML("afterbegin", `<div class="story-section empty-state">Could not load the CSV data: ${error.message}</div>`);
});

function normalizeGenreRow(row) {
  const output = { genre: row.genre };
  features.forEach(feature => output[feature.key] = +row[feature.genreCol]);
  return output;
}

function normalizePopularityRow(row) {
  const output = { genre: row.genre };
  features.forEach(feature => output[feature.key] = +row[feature.popularCol]);
  return output;
}

function normalizeTrackRow(row) {
  return {
    track_id: row.track_id,
    artists: row.artists,
    album_name: row.album_name,
    track_name: row.track_name,
    popularity: +row.popularity,
    duration_ms: +row.duration_ms,
    danceability: +row.danceability,
    energy: +row.energy,
    loudness: +row.loudness,
    speechiness: +row.speechiness,
    tempo: +row.tempo,
    genre: row.track_genre
  };
}

function initializeControls() {
  // Default to top 2 genres by popularity score
  const top2 = topGenresBy("popularity", 2);
  state.compareGenreA = state.compareGenreA || (top2[0] && top2[0].genre);
  state.compareGenreB = state.compareGenreB || (top2[1] && top2[1].genre);
  state.pinnedHeroGenre = state.pinnedHeroGenre || (top2[0] && top2[0].genre);
  state.selectedFingerprint = state.selectedFingerprint || (top2[0] && top2[0].genre);

  const allGenres = state.genreRows.map(d => d.genre).sort(d3.ascending);

  const selectA = document.querySelector("#compare-genre-a");
  const selectB = document.querySelector("#compare-genre-b");

  allGenres.forEach(genre => {
    selectA.add(new Option(titleCase(genre), genre));
    selectB.add(new Option(titleCase(genre), genre));
  });

  selectA.value = state.compareGenreA;
  selectB.value = state.compareGenreB;

  selectA.addEventListener("change", event => {
    state.compareGenreA = event.target.value;
    renderComparison();
  });
  selectB.addEventListener("change", event => {
    state.compareGenreB = event.target.value;
    renderComparison();
  });

  const rank = document.querySelector("#rank-select");
  rank.add(new Option("Popularity signal", "popularity"));
  rank.add(new Option("Distinctiveness", "distinctive"));
  activeFeatures.forEach(feature => rank.add(new Option(feature.label, feature.key)));
  rank.value = state.rankBy;
  rank.addEventListener("change", event => {
    state.rankBy = event.target.value;
    state.showAll = false;
    document.querySelector("#show-all").textContent = "Show all genres";
    updateRankDetailBox();
    renderFingerprints();
  });

  document.querySelector("#show-rank-detail").addEventListener("click", event => {
    state.showRankDetail = !state.showRankDetail;
    event.currentTarget.setAttribute("aria-expanded", String(state.showRankDetail));
    event.currentTarget.classList.toggle("active", state.showRankDetail);
    updateRankDetailBox();
    renderFingerprints();
  });

  document.querySelector("#show-all").addEventListener("click", event => {
    state.showAll = !state.showAll;
    event.currentTarget.textContent = state.showAll ? "Show top 20" : "Show all genres";
    renderFingerprints();
  });

  document.querySelector("#show-pop-toggle").addEventListener("click", event => {
    state.showPopularity = !state.showPopularity;
    event.currentTarget.textContent = state.showPopularity ? "Hide popularity within genre" : "Show popularity within genre";
    event.currentTarget.classList.toggle("active", state.showPopularity);
    renderFingerprints();
  });

  document.querySelector("#pop-direction-toggle").addEventListener("click", event => {
    state.popularityDirection = state.popularityDirection === "top" ? "bottom" : "top";
    event.currentTarget.textContent = state.popularityDirection === "top" ? "Most popular" : "Least popular";
    event.currentTarget.classList.toggle("active", state.popularityDirection === "bottom");
    renderFingerprints();
  });
}

function renderAll() {
  renderHero();
  renderTraits();
  renderTraitDashboard();
  renderComparison();
  renderFingerprints();
  renderTraitGame();
  renderProximityGame();
  renderTakeaways();
}

function renderHero() {
  const rows = topGenresBy("popularity", 20);
  const keys = activeFeatureKeys;

  // ── Build the two-panel layout: genre list + radar ──
  const host = d3.select("#hero-visual").html("");
  host.style("display", "grid")
      .style("grid-template-columns", "200px 1fr")
      .style("height", "100%")
      .style("min-height", "560px");

  // Left: genre list
  const listPanel = host.append("div")
    .style("overflow-y", "auto")
    .style("border-right", "1px solid rgba(255,255,255,.10)")
    .style("padding", "16px 0");

  listPanel.append("p")
    .style("margin", "0 0 10px 14px")
    .style("font-size", "10px")
    .style("font-weight", "800")
    .style("letter-spacing", ".08em")
    .style("text-transform", "uppercase")
    .style("color", "#9da7b7")
    .text("Top 20 by popularity");

  const items = listPanel.selectAll("button.hero-genre-btn")
    .data(rows)
    .join("button")
    .attr("class", "hero-genre-btn")
    .style("display", "block")
    .style("width", "100%")
    .style("text-align", "left")
    .style("padding", "7px 14px")
    .style("background", d => d.genre === state.pinnedHeroGenre ? "rgba(30,215,96,.12)" : "none")
    .style("border", "none")
    .style("border-left", d => d.genre === state.pinnedHeroGenre ? "3px solid #1ed760" : "3px solid transparent")
    .style("color", d => d.genre === state.pinnedHeroGenre ? "#1ed760" : "#b3b3b3")
    .style("font-size", "13px")
    .style("font-weight", "700")
    .style("cursor", "pointer")
    .style("transition", "color .15s, background .15s")
    .text((d, i) => `${String(i + 1).padStart(2, "0")}  ${titleCase(d.genre)}`)
    .on("click", (_, d) => {
      state.pinnedHeroGenre = d.genre;
      renderHero();
      renderTakeaways();
    });

  // Right: radar chart
  const radarPanel = host.append("div")
    .style("position", "relative")
    .style("display", "flex")
    .style("flex-direction", "column")
    .style("align-items", "center")
    .style("justify-content", "center")
    .style("padding", "20px 12px 12px");

  const pinnedRow = state.byGenre.get(state.pinnedHeroGenre) || rows[0];

  radarPanel.append("div")
    .style("font-size", "18px")
    .style("font-weight", "850")
    .style("color", "#1ed760")
    .style("margin-bottom", "4px")
    .text(titleCase(pinnedRow.genre));

  radarPanel.append("div")
    .style("font-size", "11px")
    .style("color", "#9da7b7")
    .style("margin-bottom", "12px")
    .text("Audio fingerprint · z-score vs all genres");

  drawHeroRadar(radarPanel, pinnedRow, keys);
}

function drawHeroRadar(host, row, keys) {
  const size = 380;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 140;
  const levels = 4;
  const featureColors = new Map(features.map(f => [f.key, f.color]));

  const svg = host.append("svg")
    .attr("viewBox", [0, 0, size, size])
    .attr("width", "100%")
    .style("max-width", "380px");

  const angleSlice = (Math.PI * 2) / keys.length;

  // Scale: map [-2.6, 2.6] → [0, maxR]
  const rScale = d3.scaleLinear().domain([-2.6, 2.6]).range([0, maxR]).clamp(true);

  // Grid rings
  svg.append("g").attr("class", "radar-grid")
    .selectAll("circle")
    .data(d3.range(1, levels + 1))
    .join("circle")
    .attr("cx", cx).attr("cy", cy)
    .attr("r", d => maxR * (d / levels))
    .attr("fill", "none")
    .attr("stroke", "rgba(255,255,255,.10)")
    .attr("stroke-width", 1);

  // Axis spokes
  svg.append("g").attr("class", "radar-axes")
    .selectAll("line")
    .data(keys)
    .join("line")
    .attr("x1", cx).attr("y1", cy)
    .attr("x2", (d, i) => cx + maxR * Math.cos(angleSlice * i - Math.PI / 2))
    .attr("y2", (d, i) => cy + maxR * Math.sin(angleSlice * i - Math.PI / 2))
    .attr("stroke", "rgba(255,255,255,.16)")
    .attr("stroke-width", 1);

  // Axis labels
  const labelR = maxR + 22;
  svg.append("g").attr("class", "radar-labels")
    .selectAll("text")
    .data(keys)
    .join("text")
    .attr("x", (d, i) => cx + labelR * Math.cos(angleSlice * i - Math.PI / 2))
    .attr("y", (d, i) => cy + labelR * Math.sin(angleSlice * i - Math.PI / 2))
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("fill", d => featureColors.get(d))
    .attr("font-size", 12)
    .attr("font-weight", 800)
    .text(d => featureByKey(d).short);

  // Compute polygon points
  function toPoint(key, i, val) {
    const r = rScale(val);
    return [
      cx + r * Math.cos(angleSlice * i - Math.PI / 2),
      cy + r * Math.sin(angleSlice * i - Math.PI / 2)
    ];
  }

  const points = keys.map((key, i) => toPoint(key, i, row[key]));
  const pointStr = points.map(p => p.join(",")).join(" ");

  // Filled polygon
  const polygon = svg.append("polygon")
    .attr("points", pointStr)
    .attr("fill", "rgba(30,215,96,.12)")
    .attr("stroke", "#1ed760")
    .attr("stroke-width", 2.5)
    .attr("stroke-linejoin", "round");

  // Animate in with a clip trick via opacity
  polygon.style("opacity", 0)
    .transition().duration(600).ease(d3.easeCubicOut)
    .style("opacity", 1);

  // Dots at each axis tip
  svg.append("g").attr("class", "radar-dots")
    .selectAll("circle")
    .data(keys)
    .join("circle")
    .attr("cx", (d, i) => toPoint(d, i, row[d])[0])
    .attr("cy", (d, i) => toPoint(d, i, row[d])[1])
    .attr("r", 4)
    .attr("fill", d => featureColors.get(d))
    .attr("stroke", "#0d1118")
    .attr("stroke-width", 1.5)
    .style("opacity", 0)
    .transition().duration(600).ease(d3.easeCubicOut)
    .style("opacity", 1);
}

function renderTraits() {
  const grid = d3.select("#trait-grid").html("");

  const cards = grid.selectAll("button")
    .data(topTraitKeys.map(key => featureByKey(key)))
    .join("button")
    .attr("class", d => `trait-pill-btn ${d.key === state.selectedTrait ? "active" : ""}`)
    .attr("type", "button")
    .style("--trait-color", d => d.color)
    .on("click", (_, feature) => {
      state.selectedTrait = feature.key;
      renderTraits();
      renderTraitDashboard();
    });

  cards.append("span").attr("class", "trait-pill-label").style("color", d => d.color).text(d => d.label);
  cards.append("span").attr("class", "trait-pill-def").text(d => d.definition);
}

function renderTraitDashboard() {
  const feature = featureByKey(state.selectedTrait);

  // High songs: all tracks across all genres sorted descending by trait
  // Low songs: exclude zero values — those indicate missing/unset metrics
  // Base filter: must have a valid track id and a finite metric value
  const validTracks = state.tracks.filter(d => d.track_id && Number.isFinite(d[feature.key]));

  // Trait-specific junk filters (applied to both high and low pools unless noted)
  function isValidForTrait(d) {
    if (feature.key === "energy"      && (d.energy < 0.001 || d.energy > 0.999)) return false;
    if (feature.key === "speechiness" && d.speechiness < 0.001) return false;
    return true;
  }

  // Loudness is in dB (negative scale): louder = closer to 0, quieter = more negative.
  // High pool: drop broken 0.0 dB entries (>= -0.5 dB).
  // Low pool:  keep all valid negative dB values — most negative = quietest.
  let highPool, lowPool;
  if (feature.key === "loudness") {
    highPool = validTracks.filter(d => Math.abs(d.loudness) > 0.05);
    lowPool  = validTracks.filter(d => Math.abs(d.loudness) > 0.05);
  } else {
    highPool = validTracks.filter(isValidForTrait);
    lowPool  = validTracks.filter(isValidForTrait).filter(d => d[feature.key] > 0);
  }

  const highSongs = [...highPool].sort((a, b) => d3.descending(a[feature.key], b[feature.key])).slice(0, 5);
  const lowSongs  = [...lowPool].sort((a, b) => d3.ascending(a[feature.key], b[feature.key])).slice(0, 5);

  const songRow = tracks => tracks.map(d => `
    <div class="ref-song-row">
      <div class="ref-song-meta">
        <a href="https://open.spotify.com/track/${d.track_id}" target="_blank" rel="noreferrer">${escapeHtml(d.track_name)}</a>
        <small>${escapeHtml(d.artists)} · ${escapeHtml(titleCase(d.genre))} · ${formatTrackTrait(feature.key, d[feature.key])}</small>
      </div>
      ${spotifyEmbed(d.track_id)}
    </div>
  `).join("");

  const html = `
    <div class="trait-dash-layout">
      <div class="info-block ref-block">
        <h4 class="ref-header ref-high"><span style="color:var(--green)">&#9650;</span> Highest ${feature.label} tracks</h4>
        ${songRow(highSongs)}
      </div>

      <div class="info-block ref-block">
        <h4 class="ref-header ref-low"><span style="color:var(--hot)">&#9660;</span> Lowest ${feature.label} tracks</h4>
        ${songRow(lowSongs)}
      </div>
    </div>
  `;

  const host = document.querySelector("#trait-dashboard");
  host.innerHTML = html;
}

// ── Head-to-head comparison state ──────────────────────────────────────────
const compareState = {
  mode: "genre",          // "genre" | "pop"
  showIndividual: false,  // pin individual dots
};

function initCompareControls() {
  document.querySelector("#compare-mode-genre").addEventListener("click", () => {
    compareState.mode = "genre";
    document.querySelector("#compare-mode-genre").classList.add("active");
    document.querySelector("#compare-mode-pop").classList.remove("active");
    drawHead2Head();
  });
  document.querySelector("#compare-mode-pop").addEventListener("click", () => {
    compareState.mode = "pop";
    document.querySelector("#compare-mode-pop").classList.add("active");
    document.querySelector("#compare-mode-genre").classList.remove("active");
    drawHead2Head();
  });
  document.querySelector("#compare-show-individual").addEventListener("click", event => {
    compareState.showIndividual = !compareState.showIndividual;
    event.currentTarget.classList.toggle("active", compareState.showIndividual);
    event.currentTarget.textContent = compareState.showIndividual ? "Hide individual values" : "Show individual values";
    drawHead2Head();
  });
}

function renderComparison() {
  // Lazy-init the compare controls once
  if (!renderComparison._ready) {
    initCompareControls();
    renderComparison._ready = true;
  }
  drawHead2Head();
  renderCompareMusic();
}

function drawHead2Head() {
  const rowsA_genre = state.byGenre.get(state.compareGenreA);
  const rowsB_genre = state.byGenre.get(state.compareGenreB);
  const rowsA_pop   = state.byPopularGenre.get(state.compareGenreA);
  const rowsB_pop   = state.byPopularGenre.get(state.compareGenreB);
  if (!rowsA_genre || !rowsB_genre) return;

  const rowA = compareState.mode === "genre" ? rowsA_genre : rowsA_pop;
  const rowB = compareState.mode === "genre" ? rowsB_genre : rowsB_pop;

  const colorA = "#1ed760";
  const colorB = "#55c7ff";
  const host = d3.select("#head2head-chart").html("");

  const width  = 700;
  const height = 380;
  const margin = { top: 52, right: 48, bottom: 44, left: 148 };
  const keys   = activeFeatureKeys;

  const svg = host.append("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("width", "100%");

  // Compute differences: A − B
  const diffs = keys.map(key => ({
    key,
    diff: rowA[key] - rowB[key],
    valA: rowA[key],
    valB: rowB[key],
  }));

  const maxAbs = Math.max(d3.max(diffs, d => Math.abs(d.diff)), 0.5);
  const xDomain = [-maxAbs * 1.15, maxAbs * 1.15];

  const x = d3.scaleLinear().domain(xDomain).range([margin.left, width - margin.right]).clamp(true);
  const y = d3.scaleBand().domain(keys).range([margin.top, height - margin.bottom]).padding(0.32);

  // ── Legend / header ─────────────────────────────────────────────────────
  const legend = svg.append("g").attr("transform", `translate(${margin.left}, 18)`);

  // Genre A pill
  legend.append("rect").attr("x", 0).attr("y", 0).attr("width", 12).attr("height", 12).attr("rx", 2).attr("fill", colorA);
  legend.append("text").attr("x", 17).attr("dy", "0.82em").attr("fill", colorA).attr("font-size", 13).attr("font-weight", 800).text(titleCase(state.compareGenreA));

  const labelAWidth = titleCase(state.compareGenreA).length * 8.2 + 26;

  legend.append("text").attr("x", labelAWidth).attr("dy", "0.82em").attr("fill", "#6b7280").attr("font-size", 12).attr("font-weight", 700).text("leads →");
  const leadLabelWidth = labelAWidth + 56;

  // center vs label
  const midX = (width - margin.left - margin.right) / 2;
  legend.append("text").attr("x", midX).attr("dy", "0.82em").attr("fill", "#9da7b7").attr("font-size", 11).attr("font-weight", 700).attr("text-anchor", "middle").text("← tied →");

  // Genre B
  const rightX = width - margin.left - margin.right;
  legend.append("text").attr("x", rightX).attr("dy", "0.82em").attr("fill", "#6b7280").attr("font-size", 12).attr("font-weight", 700).attr("text-anchor", "end").text("← leads");
  legend.append("rect").attr("x", rightX + 4).attr("y", 0).attr("width", 12).attr("height", 12).attr("rx", 2).attr("fill", colorB);
  legend.append("text").attr("x", rightX + 20).attr("dy", "0.82em").attr("fill", colorB).attr("font-size", 13).attr("font-weight", 800).text(titleCase(state.compareGenreB));

  // ── Zero line ────────────────────────────────────────────────────────────
  svg.append("line")
    .attr("x1", x(0)).attr("x2", x(0))
    .attr("y1", margin.top - 8).attr("y2", height - margin.bottom)
    .attr("stroke", "rgba(255,255,255,.30)")
    .attr("stroke-dasharray", "4,3");

  // ── Bottom axis ───────────────────────────────────────────────────────────
  svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(6).tickFormat(d => (d >= 0 ? "+" : "") + d.toFixed(1)));

  // ── Trait labels ─────────────────────────────────────────────────────────
  svg.append("g").selectAll("text")
    .data(keys)
    .join("text")
    .attr("x", margin.left - 14)
    .attr("y", key => y(key) + y.bandwidth() / 2)
    .attr("dy", "0.32em")
    .attr("text-anchor", "end")
    .attr("fill", key => featureByKey(key).color)
    .attr("font-weight", 800)
    .attr("font-size", 13)
    .text(key => featureByKey(key).label);

  // ── Difference bars ───────────────────────────────────────────────────────
  const barHeight = y.bandwidth();

  const barGroups = svg.selectAll("g.h2h-bar")
    .data(diffs)
    .join("g")
    .attr("class", "h2h-bar");

  // Background band (alternating subtle rows)
  barGroups.append("rect")
    .attr("x", margin.left)
    .attr("y", d => y(d.key) - (y.step() - barHeight) / 2)
    .attr("width", width - margin.left - margin.right)
    .attr("height", y.step())
    .attr("fill", (_, i) => i % 2 === 0 ? "rgba(255,255,255,.025)" : "transparent");

  // Bar fill
  const bars = barGroups.append("rect")
    .attr("class", "diff-bar")
    .attr("x", x(0))
    .attr("y", d => y(d.key) + barHeight * 0.15)
    .attr("height", barHeight * 0.70)
    .attr("rx", 3)
    .attr("width", 0)
    .attr("fill", d => d.diff >= 0 ? colorA : colorB)
    .attr("opacity", 0.85);

  // Animate bars
  bars.transition().duration(600).ease(d3.easeCubicOut)
    .attr("x", d => d.diff >= 0 ? x(0) : x(d.diff))
    .attr("width", d => Math.abs(x(d.diff) - x(0)));

  // Difference value label
  const diffLabels = barGroups.append("text")
    .attr("class", "diff-label")
    .attr("y", d => y(d.key) + y.bandwidth() / 2)
    .attr("dy", "0.35em")
    .attr("font-size", 11)
    .attr("font-weight", 800)
    .attr("fill", d => d.diff >= 0 ? colorA : colorB)
    .attr("text-anchor", d => d.diff >= 0 ? "start" : "end")
    .attr("opacity", 0)
    .attr("x", x(0));

  diffLabels.transition().duration(600).ease(d3.easeCubicOut)
    .attr("x", d => d.diff >= 0 ? x(d.diff) + 6 : x(d.diff) - 6)
    .attr("opacity", 1)
    .tween("text", function(d) {
      const node = this;
      const i = d3.interpolateNumber(0, d.diff);
      return t => { node.textContent = (i(t) >= 0 ? "+" : "") + i(t).toFixed(2); };
    });

  // ── Individual value dots (hover or pinned) ───────────────────────────────
  function showIndividualDots(data) {
    // Remove existing dots
    svg.selectAll("g.individual-dots").remove();
    if (!data) return;

    // Individual scale for the full range
    const xFull = d3.scaleLinear().domain([-2.8, 2.8]).range([margin.left, width - margin.right]).clamp(true);

    const dotsGroup = svg.append("g").attr("class", "individual-dots");

    // Draw connector line
    dotsGroup.selectAll("line.ind-connector")
      .data([data])
      .join("line")
      .attr("class", "ind-connector")
      .attr("x1", xFull(data.valA))
      .attr("x2", xFull(data.valB))
      .attr("y1", y(data.key) + y.bandwidth() / 2)
      .attr("y2", y(data.key) + y.bandwidth() / 2)
      .attr("stroke", "rgba(255,255,255,.25)")
      .attr("stroke-width", 2);

    // Dot A
    dotsGroup.append("circle")
      .attr("cx", xFull(data.valA))
      .attr("cy", y(data.key) + y.bandwidth() / 2)
      .attr("r", 7)
      .attr("fill", colorA)
      .attr("stroke", "#0d1118")
      .attr("stroke-width", 2);

    // Dot B
    dotsGroup.append("circle")
      .attr("cx", xFull(data.valB))
      .attr("cy", y(data.key) + y.bandwidth() / 2)
      .attr("r", 7)
      .attr("fill", colorB)
      .attr("stroke", "#0d1118")
      .attr("stroke-width", 2);

    // Value labels for both dots
    dotsGroup.append("text")
      .attr("x", xFull(data.valA))
      .attr("y", y(data.key) - 6)
      .attr("text-anchor", "middle")
      .attr("font-size", 10)
      .attr("font-weight", 800)
      .attr("fill", colorA)
      .text(signed(data.valA));

    dotsGroup.append("text")
      .attr("x", xFull(data.valB))
      .attr("y", y(data.key) - 6)
      .attr("text-anchor", "middle")
      .attr("font-size", 10)
      .attr("font-weight", 800)
      .attr("fill", colorB)
      .text(signed(data.valB));
  }

  // If pinned, draw all individual dots
  if (compareState.showIndividual) {
    const xFull = d3.scaleLinear().domain([-2.8, 2.8]).range([margin.left, width - margin.right]).clamp(true);
    const allDotsGroup = svg.append("g").attr("class", "individual-dots");

    diffs.forEach(d => {
      allDotsGroup.append("line")
        .attr("x1", xFull(d.valA)).attr("x2", xFull(d.valB))
        .attr("y1", y(d.key) + y.bandwidth() / 2).attr("y2", y(d.key) + y.bandwidth() / 2)
        .attr("stroke", "rgba(255,255,255,.20)").attr("stroke-width", 1.5);

      allDotsGroup.append("circle")
        .attr("cx", xFull(d.valA)).attr("cy", y(d.key) + y.bandwidth() / 2)
        .attr("r", 6).attr("fill", colorA).attr("stroke", "#0d1118").attr("stroke-width", 2);

      allDotsGroup.append("circle")
        .attr("cx", xFull(d.valB)).attr("cy", y(d.key) + y.bandwidth() / 2)
        .attr("r", 6).attr("fill", colorB).attr("stroke", "#0d1118").attr("stroke-width", 2);

      allDotsGroup.append("text")
        .attr("x", xFull(d.valA)).attr("y", y(d.key) - 5)
        .attr("text-anchor", "middle").attr("font-size", 10).attr("font-weight", 800).attr("fill", colorA)
        .text(signed(d.valA));

      allDotsGroup.append("text")
        .attr("x", xFull(d.valB)).attr("y", y(d.key) + y.bandwidth() + 13)
        .attr("text-anchor", "middle").attr("font-size", 10).attr("font-weight", 800).attr("fill", colorB)
        .text(signed(d.valB));
    });
  }

  // ── Hover interaction on bar rows ─────────────────────────────────────────
  const hitAreas = svg.selectAll("rect.h2h-hit")
    .data(diffs)
    .join("rect")
    .attr("class", "h2h-hit")
    .attr("x", margin.left)
    .attr("y", d => y(d.key) - (y.step() - barHeight) / 2)
    .attr("width", width - margin.left - margin.right)
    .attr("height", y.step())
    .attr("fill", "transparent")
    .attr("cursor", "crosshair")
    .on("mousemove", (event, d) => {
      const modeLabel = compareState.mode === "genre" ? "genre z-score" : "popularity gap";
      showTooltip(event, `
        <strong>${featureByKey(d.key).label}</strong><br>
        <span style="color:${colorA}">▲ ${titleCase(state.compareGenreA)}: ${signed(d.valA)}</span><br>
        <span style="color:${colorB}">▲ ${titleCase(state.compareGenreB)}: ${signed(d.valB)}</span><br>
        <em>Δ ${signed(d.diff)} ${modeLabel}</em>
      `);
      if (!compareState.showIndividual) showIndividualDots(d);
    })
    .on("mouseleave", () => {
      hideTooltip();
      if (!compareState.showIndividual) showIndividualDots(null);
    });

  // ── Mode subtitle ─────────────────────────────────────────────────────────
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height - 6)
    .attr("text-anchor", "middle")
    .attr("fill", "#6b7280")
    .attr("font-size", 11)
    .attr("font-weight", 700)
    .text(compareState.mode === "genre"
      ? "Genre identity — z-score vs all genres · positive = Genre A leads"
      : "Popularity shift — top-third vs bottom-third within genre · positive = Genre A leads");
}

function renderCompareMusic() {
  const genres = [state.compareGenreA, state.compareGenreB];
  const html = genres.map(genre => {
    const tracks = topPopularTracks(genre, 2);
    return `
      <div class="music-strip-group">
        <h3>${titleCase(genre)} listening anchors</h3>
        <div class="embed-grid">
          ${tracks.map(track => `
            <div>
              <p>${escapeHtml(track.track_name)}<small>${escapeHtml(track.artists)}</small></p>
              ${spotifyEmbed(track.track_id)}
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }).join("");
  document.querySelector("#compare-music").innerHTML = html;
}



function updateRankDetailBox() {
  const box = document.querySelector("#rank-detail-box");
  if (!box) return;
  const exp = rankByExplanations[state.rankBy];
  if (!exp || !state.showRankDetail) {
    box.hidden = true;
    return;
  }
  const highlighted = exp.highlight.map(k => {
    const f = featureByKey(k);
    return `<span class="rank-detail-pill" style="border-color:${f.color};color:${f.color}">${f.label}</span>`;
  }).join(" ");
  box.hidden = false;
  box.innerHTML = `
    <p class="rank-detail-desc">${exp.description}</p>
    <div class="rank-detail-pills">Highlighted trait${exp.highlight.length > 1 ? "s" : ""}: ${highlighted}</div>
  `;
}

function renderFingerprints() {
  const rows = topGenresBy(state.rankBy, state.showAll ? state.genreRows.length : 20);
  const grid = d3.select("#fingerprint-grid").html("");
  const cards = grid.selectAll("button")
    .data(rows)
    .join("button")
    .attr("type", "button")
    .attr("class", d => `fingerprint-card ${d.genre === state.selectedFingerprint ? "active" : ""}`)
    .on("click", (_, d) => {
      state.selectedFingerprint = d.genre;
      renderFingerprints();
      renderDrilldown();
    });

  cards.append("div").attr("class", "fingerprint-title").html((d, i) => `<b>${titleCase(d.genre)}</b><span>#${i + 1}</span>`);
  cards.append("div").each(function(d) {
    drawFingerprint(d3.select(this), d, 260, 170);
  });

  renderDrilldown();
}

function drawFingerprint(host, row, width, height) {
  const svg = host.append("svg").attr("viewBox", [0, 0, width, height]).attr("width", "100%");
  const keys = activeFeatureKeys;
  const domain = [-2.6, 2.6];
  const x = d3.scaleLinear().domain(domain).range([96, width - 24]).clamp(true);
  const y = d3.scaleBand().domain(keys).range([16, height - 18]).padding(0.28);
  const pop = state.byPopularGenre.get(row.genre);
  const [xMin, xMax] = domain;
  const exp = rankByExplanations[state.rankBy];
  const highlightKeys = state.showRankDetail && exp ? new Set(exp.highlight) : new Set();

  svg.append("line").attr("x1", x(0)).attr("x2", x(0)).attr("y1", 10).attr("y2", height - 12).attr("stroke", "rgba(255,255,255,.25)").attr("stroke-dasharray", "3,3");
  svg.selectAll("text.label")
    .data(keys)
    .join("text")
    .attr("x", 4)
    .attr("y", d => y(d) + y.bandwidth() / 2)
    .attr("dy", "0.34em")
    .attr("fill", d => highlightKeys.size > 0 ? (highlightKeys.has(d) ? "#f6f7fb" : "rgba(157,167,183,0.35)") : "#9da7b7")
    .attr("font-size", 10)
    .attr("font-weight", d => highlightKeys.has(d) ? 900 : 750)
    .text(d => featureByKey(d).short);

  // Invisible wide hit targets for hover — one per row
  svg.selectAll("rect.hit")
    .data(keys)
    .join("rect")
    .attr("class", "hit")
    .attr("x", 0)
    .attr("y", d => y(d))
    .attr("width", width)
    .attr("height", y.bandwidth())
    .attr("fill", "transparent")
    .on("mousemove", (event, d) => {
      const f = featureByKey(d);
      const genreVal = row[d];
      const popVal = pop?.[d];
      const clamped = genreVal < xMin || genreVal > xMax;
      let tip = `<b>${f.label}</b><br>Genre z-score: ${signed(genreVal)}${clamped ? " ⚠ exceeds range" : ""}`;
      if (state.showPopularity && popVal != null) tip += `<br>Pop. gap: ${signed(popVal)}`;
      showTooltip(event, tip);
    })
    .on("mouseleave", hideTooltip);

  // Genre dots with clamping arrows
  const genreGroups = svg.selectAll("g.fp-dot")
    .data(keys)
    .join("g")
    .attr("class", "fp-dot")
    .attr("transform", d => `translate(${x(0)},${y(d) + y.bandwidth() / 2})`);

  genreGroups.append("circle")
    .attr("r", d => highlightKeys.size > 0 && !highlightKeys.has(d) ? 3.5 : 5.5)
    .attr("fill", d => featureByKey(d).color)
    .attr("opacity", d => highlightKeys.size > 0 && !highlightKeys.has(d) ? 0.25 : 1);

  const arrowSize = 4;
  genreGroups.append("polygon")
    .attr("class", "fp-clamp-arrow")
    .attr("fill", d => featureByKey(d).color)
    .attr("opacity", 0)
    .attr("points", d => {
      const val = row[d];
      const dir = val > xMax ? 1 : -1;
      return [
        [8 * dir, 0],
        [8 * dir + arrowSize * dir, -arrowSize * 0.7],
        [8 * dir + arrowSize * dir, arrowSize * 0.7]
      ].map(p => p.join(",")).join(" ");
    });

  genreGroups.transition().duration(550)
    .attr("transform", d => `translate(${x(row[d])},${y(d) + y.bandwidth() / 2})`)
    .on("end", function(d) {
      const clamped = row[d] < xMin || row[d] > xMax;
      d3.select(this).select(".fp-clamp-arrow").attr("opacity", clamped ? 1 : 0);
    });

  // Popularity dots (conditionally shown)
  if (state.showPopularity && pop) {
    svg.selectAll("circle.popular")
      .data(keys)
      .join("circle")
      .attr("class", "popular")
      .attr("cx", d => x(pop[d] ?? 0))
      .attr("cy", d => y(d) + y.bandwidth() / 2)
      .attr("r", 2.8)
      .attr("fill", "#f5f1e8")
      .attr("opacity", d => highlightKeys.size > 0 && !highlightKeys.has(d) ? 0.2 : 0.9);
  }
}

function renderDrilldown() {
  const host = d3.select("#genre-drilldown").classed("open", true).html("");
  const genre = state.selectedFingerprint;
  const row = state.byGenre.get(genre);
  if (!row) return;

  host.append("div").attr("class", "drilldown-head").html(`
    <div>
      <p class="eyebrow">Song cloud</p>
      <h3>${titleCase(genre)}: ${Math.min(getGenreTracks(genre).length, 1000).toLocaleString()} Spotify tracks</h3>
      <p class="empty-state">Each bubble is a real Hugging Face Spotify track row with a Spotify track ID. Bubble size follows popularity, so the cloud shows whether the selected trait pulls toward the hit side inside the genre.</p>
    </div>
    <label>Trait on y-axis <select id="sample-trait"></select></label>
  `);

  const select = host.select("#sample-trait").node();
  activeFeatures.forEach(feature => select.add(new Option(feature.label, feature.key)));
  select.value = state.sampleTrait;
  select.addEventListener("change", event => {
    state.sampleTrait = event.target.value;
    renderDrilldown();
  });

  host.append("div").attr("class", "music-strip inline").html(`
    <div class="music-strip-group">
      <h3>${titleCase(genre)} tracks to hear while reading the cloud</h3>
      <div class="embed-grid three">
        ${topPopularTracks(genre, 3).map(track => `
          <div>
            <p>${escapeHtml(track.track_name)}<small>${escapeHtml(track.artists)}</small></p>
            ${spotifyEmbed(track.track_id)}
          </div>
        `).join("")}
      </div>
    </div>
  `);

  drawSongScatter(host.append("div"), genre, state.sampleTrait);
}

function drawSongScatter(host, genre, trait) {
  const sample = getGenreTracks(genre).slice(0, 1000);
  const allTracks = state.tracks.filter(d => Number.isFinite(d[trait]));
  const genreMedian = d3.median(sample, d => d[trait]);
  const globalMean = d3.mean(allTracks, d => d[trait]);
  const popularTrait = d3.mean(sample.filter(d => d.popularity >= 67), d => d[trait]) ?? genreMedian;
  const width = 980;
  const height = 470;
  const margin = { top: 24, right: 72, bottom: 56, left: 70 };
  const svg = host.append("svg").attr("viewBox", [0, 0, width, height]).attr("width", "100%");
  const x = d3.scaleLinear().domain([0, 100]).range([margin.left, width - margin.right]);

  // Fixed y domain from all genres, not just this genre's extent
  const globalExtent = d3.extent(allTracks, d => d[trait]);
  const y = d3.scaleLinear().domain(globalExtent).nice().range([height - margin.bottom, margin.top]);
  const radius = d3.scaleSqrt().domain([0, 100]).range([2, 9]);
  const traitColor = featureByKey(trait).color;

  svg.append("g").attr("class", "axis").attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x));
  svg.append("g").attr("class", "axis").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y).ticks(6));
  svg.append("text").attr("class", "axis-label").attr("x", width / 2).attr("y", height - 16).attr("text-anchor", "middle").attr("font-size", 12).attr("font-weight", 750).text("Spotify popularity");
  svg.append("text").attr("class", "axis-label").attr("x", -height / 2).attr("y", 18).attr("transform", "rotate(-90)").attr("text-anchor", "middle").attr("font-size", 12).attr("font-weight", 750).text(featureByKey(trait).label);

  // Global mean line (all genres)
  svg.append("line").attr("x1", margin.left).attr("x2", width - margin.right).attr("y1", y(globalMean)).attr("y2", y(globalMean)).attr("stroke", "rgba(255,255,255,.35)").attr("stroke-width", 1.5).attr("stroke-dasharray", "6,4");
  svg.append("text").attr("x", width - margin.right + 4).attr("y", y(globalMean)).attr("dy", "0.35em").attr("fill", "rgba(255,255,255,.5)").attr("font-size", 10).attr("font-weight", 700).text("all genres");

  // Genre median line
  svg.append("line").attr("x1", margin.left).attr("x2", width - margin.right).attr("y1", y(genreMedian)).attr("y2", y(genreMedian)).attr("stroke", traitColor).attr("stroke-width", 2).attr("stroke-dasharray", "5,4");
  svg.append("text").attr("x", width - margin.right + 4).attr("y", y(genreMedian)).attr("dy", "0.35em").attr("fill", traitColor).attr("font-size", 10).attr("font-weight", 700).text("genre avg");

  svg.selectAll("circle")
    .data(sample)
    .join("circle")
    .attr("cx", d => x(d.popularity))
    .attr("cy", y(genreMedian))
    .attr("r", 4)
    .attr("fill", traitColor)
    .attr("opacity", 0.45)
    .on("mousemove", (event, d) => showTooltip(event, `${escapeHtml(d.track_name)}<br>${escapeHtml(d.artists)}<br>${featureByKey(trait).label}: ${formatTrackTrait(trait, d[trait])}<br>Popularity: ${Math.round(d.popularity)}`))
    .on("mouseleave", hideTooltip)
    .transition()
    .duration(900)
    .delay((d, i) => Math.min(i * 2, 600))
    .attr("cy", d => y(d[trait]));

  // LOESS smooth curve spanning full x domain 0–100
  const validSample = sample.filter(d => Number.isFinite(d.popularity) && Number.isFinite(d[trait]));
  if (validSample.length > 4) {
    const xs = validSample.map(d => d.popularity);
    const ys = validSample.map(d => d[trait]);
    const bw = 0.55;
    const steps = 60;
    // Query points span the full axis range (0–100), not just the data extent
    const queryPoints = d3.range(steps + 1).map(i => (i / steps) * 100);

    const smoothed = queryPoints.map(qx => {
      const dists = xs.map(xi => Math.abs(xi - qx));
      const sorted = dists.slice().sort(d3.ascending);
      const maxDist = sorted[Math.floor(bw * sorted.length)] || sorted[sorted.length - 1];
      if (!maxDist || maxDist === 0) return { x: qx, y: d3.mean(ys) };

      let sw = 0, swx = 0, swy = 0, swxx = 0, swxy = 0;
      xs.forEach((xi, i) => {
        const u = dists[i] / maxDist;
        if (u >= 1) return;
        const w = Math.pow(1 - Math.pow(u, 3), 3);
        sw += w; swx += w * xi; swy += w * ys[i];
        swxx += w * xi * xi; swxy += w * xi * ys[i];
      });
      const det = sw * swxx - swx * swx;
      if (Math.abs(det) < 1e-12) return { x: qx, y: swy / (sw || 1) };
      const b = (sw * swxy - swx * swy) / det;
      const a = (swy - b * swx) / sw;
      return { x: qx, y: a + b * qx };
    });

    const lineGen = d3.line()
      .x(d => x(d.x))
      .y(d => y(d.y))
      .curve(d3.curveCatmullRom.alpha(0.5));

    svg.append("path")
      .datum(smoothed)
      .attr("fill", "none")
      .attr("stroke", "#f5f1e8")
      .attr("stroke-width", 2.5)
      .attr("opacity", 0.9)
      .attr("d", lineGen);

    // Label to the right of the line at x=100, same style as "genre avg"
    const endPt = smoothed[smoothed.length - 1];
    const traitLabel = featureByKey(trait).label;
    svg.append("text")
      .attr("x", width - margin.right + 4)
      .attr("y", clamp(y(endPt.y), margin.top + 8, height - margin.bottom - 8))
      .attr("dy", "0.35em")
      .attr("fill", "#f5f1e8")
      .attr("font-size", 10)
      .attr("font-weight", 700)
      .text(`pop. → ${traitLabel}`);
  }
}

function renderTraitGame() {
  const cardHost = document.querySelector("#trait-game-card");
  const chartHost = document.querySelector("#trait-game-chart");
  const game = state.traitGame;

  // Initialize round data on first render or when round changes
  if (!game.currentRound || game.roundIndex !== game.round) {
    game.roundIndex = game.round;
    game.usedIds = game.usedIds || new Set();
    const round = buildFingerprintRound(game.usedIds);
    if (!round) {
      cardHost.innerHTML = `<div class="game-score">No more tracks available.</div>`;
      return;
    }
    game.usedIds.add(round.targetRaw.track_id);
    round.choices.forEach(c => game.usedIds.add(c.track_id));
    game.currentRound = round;
    game.answered = false;
  }

  const round = game.currentRound;
  // LEFT CARD: header + radar + result area
  cardHost.innerHTML = `
    <div class="tg-header">
      <div class="tg-score-row">
        <div class="game-score">Score ${game.score}</div>
        <button class="ghost-button tg-reset-btn" type="button">Reset</button>
      </div>
      <div class="tg-instructions">Which song matches this fingerprint?</div>
    </div>
    <div class="tg-radar-box" id="tg-radar"></div>
    <div id="tg-result" class="tg-result" style="display:none;"></div>
    <div id="tg-reveal-area"></div>
  `;

  // RIGHT CHART PANEL: song choices
  chartHost.innerHTML = `
    <div class="tg-choices-header">
      <span>Choose a song</span>
      <small>Listen, then pick the one whose fingerprint matches the radar</small>
    </div>
    <div class="tg-choices" id="tg-choices">
      ${round.choices.map((choice, i) => `
        <button class="tg-choice-btn" data-choice="${i}" type="button">
          <div class="tg-choice-meta">
            <span class="tg-choice-num">${String.fromCharCode(65 + i)}</span>
            <div class="tg-choice-text">
              <span class="tg-choice-name">${escapeHtml(choice.name)}</span>
              <span class="tg-choice-genre">${escapeHtml(titleCase(choice.genre))}</span>
            </div>
          </div>
          <div class="tg-choice-embed" id="tg-embed-${i}"></div>
        </button>
      `).join("")}
    </div>
  `;

  // Draw the mystery fingerprint radar in the card
  drawFingerprintRadar(d3.select("#tg-radar"), round.fingerprint, false);

  // Inject embeds into chart host
  round.choices.forEach((choice, i) => {
    const embedContainer = chartHost.querySelector(`#tg-embed-${i}`);
    if (embedContainer && choice.track_id) {
      embedContainer.innerHTML = spotifyEmbed(choice.track_id);
    }
  });

  // Wire reset button
  cardHost.querySelector(".tg-reset-btn").addEventListener("click", () => {
    state.traitGame = { round: 0, score: 0, answered: false, history: [], streak: 0, currentRound: null, usedIds: new Set(), roundIndex: -1 };
    renderTraitGame();
    renderTakeaways();
  });

  // Wire choice buttons (in chart host)
  chartHost.querySelectorAll(".tg-choice-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const choice = round.choices[+btn.dataset.choice];
      answerFingerprintRound(round, choice);
    });
  });
}

function answerFingerprintRound(round, choice) {
  const game = state.traitGame;
  if (game.answered) return;
  game.answered = true;

  const correct = choice.id === round.answer.id;
  if (correct) {
    game.score += 1;
    game.streak = (game.streak || 0) + 1;
  } else {
    game.streak = 0;
  }
  game.history.push({ choice, correct, round });

  const chartHost = document.querySelector("#trait-game-chart");
  const cardHost  = document.querySelector("#trait-game-card");

  // Lock and highlight choice buttons in chart panel
  chartHost.querySelectorAll(".tg-choice-btn").forEach(btn => {
    const c = round.choices[+btn.dataset.choice];
    if (c.id === round.answer.id) btn.classList.add("tg-correct");
    else if (c.id === choice.id && !correct) btn.classList.add("tg-wrong");
    btn.disabled = true;
  });

  // Show result message in card
  const result = cardHost.querySelector("#tg-result");
  result.style.display = "block";
  result.innerHTML = `
    <div class="tg-result-inner ${correct ? "tg-result-correct" : "tg-result-wrong"}">
      <span class="tg-result-icon">${correct ? "✓" : "✗"}</span>
      <div class="tg-result-body">
        <strong>${correct ? "Correct!" : "Wrong!"}</strong>
        ${correct
          ? `<span>${escapeHtml(round.answer.name)} matches the fingerprint.</span>`
          : `<span>The correct answer was <strong>${escapeHtml(round.answer.name)}</strong>.</span>`
        }
      </div>
    </div>
    <button class="primary-button tg-next-btn" type="button">Next round →</button>
  `;

  // Reveal all 3 fingerprints below the radar in the card
  const revealArea = cardHost.querySelector("#tg-reveal-area");
  revealArea.innerHTML = "";
  const revealSel = d3.select(revealArea);

  revealSel.append("div")
    .style("font-size", "12px")
    .style("font-weight", "800")
    .style("color", "var(--muted)")
    .style("text-transform", "uppercase")
    .style("letter-spacing", ".06em")
    .style("margin", "16px 0 8px")
    .text("All three fingerprints");

  const grid = revealSel.append("div")
    .style("display", "grid")
    .style("grid-template-columns", "repeat(3, 1fr)")
    .style("gap", "8px");

  round.choices.forEach(c => {
    const isAnswer = c.id === round.answer.id;
    const wasChosen = c.id === choice.id;
    const card = grid.append("div")
      .style("border", isAnswer ? "1px solid rgba(59,224,167,.65)" : wasChosen && !correct ? "1px solid rgba(255,79,123,.65)" : "1px solid rgba(255,255,255,.08)")
      .style("border-radius", "8px")
      .style("background", isAnswer ? "rgba(59,224,167,.06)" : wasChosen && !correct ? "rgba(255,79,123,.06)" : "rgba(255,255,255,.02)")
      .style("overflow", "hidden")
      .style("padding", "6px");

    card.append("div")
      .style("font-size", "10px")
      .style("font-weight", "750")
      .style("color", isAnswer ? "var(--mint)" : "var(--muted)")
      .style("margin-bottom", "2px")
      .style("line-height", "1.3")
      .html(`${isAnswer ? "✓ " : ""}${escapeHtml(c.name.split(" – ")[0])}`);

    drawFingerprintRadar(card.append("div"), c, true);
  });

  result.querySelector(".tg-next-btn").addEventListener("click", () => {
    game.round += 1;
    game.currentRound = null;
    renderTraitGame();
    renderTakeaways();
  });
}

// Legacy stub kept so nothing references undefined
function answerTraitRound() {}



function buildFingerprintRound(usedIds) {
  const MIN_DIST = 7; // minimum sum of |z| differences across all 5 traits between answer and each decoy

  // Only include tracks that are playable: popularity > 0 and valid track_id
  const playable = state.tracks.filter(t =>
    t.track_id &&
    t.popularity > 0 &&
    activeFeatureKeys.every(k => Number.isFinite(t[k]))
  );

  const validPool = playable.filter(t => !usedIds.has(t.track_id));
  if (!validPool.length) return null;

  // Try up to 40 random targets; find one where we can get 2 decoys far enough away
  for (let attempt = 0; attempt < 40; attempt++) {
    const targetRaw = validPool[Math.floor(Math.random() * validPool.length)];
    const targetSketch = trackToSketch(targetRaw);

    // Decoys must be: playable, different track, different genre, not used,
    // AND total |z| distance from target >= MIN_DIST
    const farDecoys = playable.filter(t => {
      if (t.track_id === targetRaw.track_id) return false;
      if (usedIds.has(t.track_id)) return false;
      if (t.genre === targetRaw.genre) return false;
      const s = trackToSketch(t);
      const totalDist = activeFeatureKeys.reduce((sum, k) => sum + Math.abs((s[k] || 0) - (targetSketch[k] || 0)), 0);
      return totalDist >= MIN_DIST;
    });

    if (farDecoys.length < 2) continue;

    // Shuffle and pick 2 distinct decoys, also ensuring they differ from each other somewhat
    const shuffled = shuffle(farDecoys);
    let d1 = null, d2 = null;
    for (const cand of shuffled) {
      if (!d1) { d1 = cand; continue; }
      // d2 should also be reasonably different from d1
      const s1 = trackToSketch(d1);
      const s2 = trackToSketch(cand);
      const d1d2dist = activeFeatureKeys.reduce((sum, k) => sum + Math.abs((s1[k] || 0) - (s2[k] || 0)), 0);
      if (d1d2dist >= 3) { d2 = cand; break; }
    }
    if (!d1 || !d2) continue;

    const toChoice = (raw) => {
      const s = trackToSketch(raw);
      return {
        ...s,
        track_id: raw.track_id,
        id: raw.track_id,
        name: `${raw.track_name} – ${raw.artists}`,
        genre: raw.genre,
        raw
      };
    };

    const answer  = toChoice(targetRaw);
    const choices = shuffle([answer, toChoice(d1), toChoice(d2)]);
    return { fingerprint: targetSketch, answer, choices, targetRaw };
  }

  return null; // couldn't find a valid round after 40 attempts
}

// Legacy – kept for potential future use
function traitGameRounds() { return []; }


function drawFingerprintRadar(hostSel, sketch, showLabel) {
  hostSel.html("");
  const size = 280;
  const cx = size / 2, cy = size / 2;
  const maxR = 96;
  const levels = 4;
  const keys = activeFeatureKeys;
  const angleSlice = (Math.PI * 2) / keys.length;
  const rScale = d3.scaleLinear().domain([-3, 3]).range([0, maxR]).clamp(true);
  const featureColors = new Map(features.map(f => [f.key, f.color]));

  const svg = hostSel.append("svg")
    .attr("viewBox", [0, 0, size, size])
    .attr("width", "100%")
    .style("max-width", `${size}px`)
    .style("overflow", "visible");

  // Grid rings
  svg.append("g").selectAll("circle")
    .data(d3.range(1, levels + 1)).join("circle")
    .attr("cx", cx).attr("cy", cy)
    .attr("r", d => maxR * (d / levels))
    .attr("fill", "none")
    .attr("stroke", (d, i) => i === levels - 1 ? "rgba(255,255,255,.06)" : "rgba(255,255,255,.08)")
    .attr("stroke-width", 1);

  // Average ring: z = 0 maps to r = maxR/2 on the [-3,3] scale
  // rScale(0) = maxR/2 = 48
  const avgR = rScale(0);
  svg.append("circle")
    .attr("cx", cx).attr("cy", cy)
    .attr("r", avgR)
    .attr("fill", "none")
    .attr("stroke", "rgba(255,255,255,.32)")
    .attr("stroke-width", 1.5)
    .attr("stroke-dasharray", "4 3");

  // "avg" label on the average ring (top spoke direction)
  svg.append("text")
    .attr("x", cx)
    .attr("y", cy - avgR - 5)
    .attr("text-anchor", "middle")
    .attr("fill", "rgba(255,255,255,.38)")
    .attr("font-size", 9)
    .attr("font-weight", 700)
    .text("avg");

  // Center dot
  svg.append("circle").attr("cx", cx).attr("cy", cy).attr("r", 2).attr("fill", "rgba(255,255,255,.2)");

  // Axis spokes
  svg.append("g").selectAll("line")
    .data(keys).join("line")
    .attr("x1", cx).attr("y1", cy)
    .attr("x2", (d, i) => cx + maxR * Math.cos(angleSlice * i - Math.PI / 2))
    .attr("y2", (d, i) => cy + maxR * Math.sin(angleSlice * i - Math.PI / 2))
    .attr("stroke", "rgba(255,255,255,.16)")
    .attr("stroke-width", 1);

  // Axis labels
  const labelR = maxR + 20;
  svg.append("g").selectAll("text")
    .data(keys).join("text")
    .attr("x", (d, i) => cx + labelR * Math.cos(angleSlice * i - Math.PI / 2))
    .attr("y", (d, i) => cy + labelR * Math.sin(angleSlice * i - Math.PI / 2))
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("fill", d => featureColors.get(d))
    .attr("font-size", 11)
    .attr("font-weight", 800)
    .text(d => featureByKey(d).short);

  function toPoint(key, i, val) {
    const r = rScale(val ?? 0);
    return [cx + r * Math.cos(angleSlice * i - Math.PI / 2), cy + r * Math.sin(angleSlice * i - Math.PI / 2)];
  }

  const points = keys.map((key, i) => toPoint(key, i, sketch[key] ?? 0));
  const pointStr = points.map(p => p.join(",")).join(" ");

  svg.append("polygon")
    .attr("points", pointStr)
    .attr("fill", "rgba(30,215,96,.12)")
    .attr("stroke", "#1ed760")
    .attr("stroke-width", 2)
    .attr("stroke-linejoin", "round")
    .style("opacity", 0)
    .transition().duration(450).ease(d3.easeCubicOut)
    .style("opacity", 1);

  if (showLabel) {
    svg.append("g").selectAll("text.val")
      .data(keys).join("text")
      .attr("x", (d, i) => { const [px] = toPoint(d, i, sketch[d] ?? 0); return px + 11 * Math.cos(angleSlice * i - Math.PI / 2); })
      .attr("y", (d, i) => { const [, py] = toPoint(d, i, sketch[d] ?? 0); return py + 11 * Math.sin(angleSlice * i - Math.PI / 2); })
      .attr("text-anchor", "middle").attr("dominant-baseline", "middle")
      .attr("fill", "#f6f7fb").attr("font-size", 9).attr("font-weight", 700)
      .style("opacity", 0)
      .text(d => signed(sketch[d] ?? 0))
      .transition().duration(450).style("opacity", 0.75);
  }

  // Interactive dots with hover tooltip showing exact z value
  svg.append("g").attr("class", "radar-interactive-dots")
    .selectAll("circle")
    .data(keys).join("circle")
    .attr("cx", (d, i) => toPoint(d, i, sketch[d] ?? 0)[0])
    .attr("cy", (d, i) => toPoint(d, i, sketch[d] ?? 0)[1])
    .attr("r", 6)
    .attr("fill", d => featureColors.get(d))
    .attr("stroke", "#0d1118")
    .attr("stroke-width", 1.5)
    .style("cursor", "crosshair")
    .style("opacity", 0)
    .transition().duration(450)
    .style("opacity", 1);

  // Wire hover on dots AFTER transition
  setTimeout(() => {
    svg.selectAll(".radar-interactive-dots circle")
      .on("mousemove", function(event, d) {
        const val = sketch[d] ?? 0;
        const feat = featureByKey(d);
        const direction = val > 0.1 ? "above avg" : val < -0.1 ? "below avg" : "at avg";
        showTooltip(event, `<b style="color:${featureColors.get(d)}">${feat.label}</b><br>z = ${signed(val)}<br><span style="opacity:.7">${direction}</span>`);
      })
      .on("mouseleave", hideTooltip);
  }, 500);
}

function drawTraitGameSideChart(chartHost, round, revealed) {
  const host = d3.select(chartHost).html("");

  if (!revealed) {
    host.append("div")
      .style("padding", "24px 18px")
      .style("color", "var(--muted)")
      .style("font-size", "13px")
      .html(`
        <p style="font-weight:800;color:var(--ink);font-size:15px;margin:0 0 8px">Mystery fingerprint</p>
        <p style="margin:0 0 16px">The radar above shows a real Spotify track's audio fingerprint — its z-scores for all five traits. Read the shape: is it high-energy and low-speech? Fast tempo? Choose the song that matches.</p>
        <p style="margin:0;font-style:italic">After you answer, all three fingerprints will appear here so you can compare.</p>
      `);
    return;
  }

  host.append("div")
    .style("padding", "14px 18px 8px")
    .style("font-size", "14px")
    .style("font-weight", "800")
    .style("color", "var(--ink)")
    .text("Fingerprint comparison");

  host.append("div")
    .style("padding", "0 18px 14px")
    .style("font-size", "12px")
    .style("color", "var(--muted)")
    .text("The correct answer (highlighted) matches the mystery radar. See how the other two differ.");

  const grid = host.append("div")
    .style("display", "grid")
    .style("grid-template-columns", "repeat(3, 1fr)")
    .style("gap", "10px")
    .style("padding", "0 12px 18px");

  round.choices.forEach(choice => {
    const isAnswer = choice.id === round.answer.id;
    const card = grid.append("div")
      .style("border", isAnswer ? "1px solid rgba(59,224,167,.7)" : "1px solid rgba(255,255,255,.10)")
      .style("border-radius", "8px")
      .style("background", isAnswer ? "rgba(59,224,167,.07)" : "rgba(255,255,255,.03)")
      .style("overflow", "hidden");

    card.append("div")
      .style("padding", "8px 10px 4px")
      .style("font-size", "11px")
      .style("font-weight", "750")
      .style("color", isAnswer ? "var(--mint)" : "var(--muted)")
      .html(`${isAnswer ? "✓ " : ""}${escapeHtml(choice.name)}<br><span style="font-size:10px;font-weight:600;color:var(--muted)">${escapeHtml(titleCase(choice.genre))}</span>`);

    drawFingerprintRadar(card.append("div").style("padding", "4px"), choice, true);
  });
}


function drawGameHistory(selector, history, mode) {
  const host = d3.select(selector).html("");
  host.append("h3").text("Your answer trail");
  if (!history.length) {
    host.append("p").attr("class", "empty-state").text("No rounds answered yet.");
    return;
  }
  if (mode === "trait") drawBubbleMap(host, history.map(d => ({ ...d, genre: d.genre || "k-pop" })), history[0].trait);
  else drawBarChart(host, history, d => `${titleCase(d.genre)} ${featureByKey(d.key).short}`, d => d.value);
}

function renderTakeaways() {
  const host = d3.select("#takeaway-content");
  if (host.empty() || !state.genreRows.length) return;
  host.html("");

  const numGenres = state.genreRows.length;
  const numTracks = state.tracks.length;

  // Find the two most different genres (furthest Euclidean distance in trait space)
  let maxDist = 0, genreA = "", genreB = "";
  for (let i = 0; i < state.genreRows.length; i++) {
    for (let j = i + 1; j < state.genreRows.length; j++) {
      const a = state.genreRows[i], b = state.genreRows[j];
      const d = Math.sqrt(activeFeatureKeys.reduce((s, k) => s + (a[k] - b[k]) ** 2, 0));
      if (d > maxDist) { maxDist = d; genreA = a.genre; genreB = b.genre; }
    }
  }

  // Most similar pair (excluding self)
  let minDist = Infinity, closeA = "", closeB = "";
  for (let i = 0; i < state.genreRows.length; i++) {
    for (let j = i + 1; j < state.genreRows.length; j++) {
      const a = state.genreRows[i], b = state.genreRows[j];
      const d = Math.sqrt(activeFeatureKeys.reduce((s, k) => s + (a[k] - b[k]) ** 2, 0));
      if (d < minDist) { minDist = d; closeA = a.genre; closeB = b.genre; }
    }
  }

  // Genre with widest within-genre spread (most internally diverse)
  const withinSpread = [...state.tracksByGenre.entries()].map(([genre, tracks]) => {
    const vals = tracks.map(t => t.energy).filter(Number.isFinite);
    if (vals.length < 10) return { genre, spread: 0 };
    const mean = d3.mean(vals);
    const std = Math.sqrt(d3.mean(vals.map(v => (v - mean) ** 2)));
    return { genre, spread: std };
  }).sort((a, b) => d3.descending(a.spread, b.spread));
  const mostDiverse = withinSpread[0]?.genre;
  const leastDiverse = withinSpread[withinSpread.length - 1]?.genre;

  // Genre closest to the global average across all traits (most "typical")
  const globalMeans = {};
  activeFeatureKeys.forEach(k => { globalMeans[k] = d3.mean(state.genreRows, d => d[k]); });
  const mostTypical = [...state.genreRows].sort((a, b) => {
    const da = Math.sqrt(activeFeatureKeys.reduce((s, k) => s + (a[k] - globalMeans[k]) ** 2, 0));
    const db = Math.sqrt(activeFeatureKeys.reduce((s, k) => s + (b[k] - globalMeans[k]) ** 2, 0));
    return da - db;
  })[0]?.genre;

  // Most distinctive genre (furthest from average)
  const mostDistinctive = [...state.genreRows].sort((a, b) => {
    const da = Math.sqrt(activeFeatureKeys.reduce((s, k) => s + (a[k] - globalMeans[k]) ** 2, 0));
    const db = Math.sqrt(activeFeatureKeys.reduce((s, k) => s + (b[k] - globalMeans[k]) ** 2, 0));
    return db - da;
  })[0]?.genre;

  // Average number of tracks per genre
  const avgTracksPerGenre = Math.round(numTracks / numGenres);

  // How many genres share a "dominant" trait (where one trait z-score is >1.2 above the rest)
  const stronglyCharacterised = state.genreRows.filter(row => {
    const vals = activeFeatureKeys.map(k => Math.abs(row[k]));
    const max = d3.max(vals);
    return max > 1.2;
  }).length;

  const gameScore1 = state.traitGame.score;
  const gameScore2 = state.proximityGame.score;

  // ── Prose layout ──
  const wrap = host.append("div").style("max-width", "720px").style("line-height", "1.75").style("font-size", "16px");

  function section(title, body) {
    wrap.append("h3").style("font-size", "22px").style("margin", "40px 0 10px").style("color", "var(--ink)").text(title);
    wrap.append("p").style("color", "var(--muted)").style("margin", "0 0 0").html(body);
  }

  section(
    "Every genre is its own world.",
    `There are <strong style="color:var(--ink)">${numGenres} genres</strong> in this dataset, and no two of them have the same audio fingerprint. 
    The furthest apart are <strong style="color:var(--ink)">${titleCase(genreA)}</strong> and <strong style="color:var(--ink)">${titleCase(genreB)}</strong> — 
    on the five traits measured here, they sit as far from each other as any two genres can. At the other extreme, 
    <strong style="color:var(--ink)">${titleCase(closeA)}</strong> and <strong style="color:var(--ink)">${titleCase(closeB)}</strong> are practically neighbors — 
    different names, but strikingly similar sound profiles when you measure them the same way.`
  );

  section(
    "The average is never the whole story.",
    `Across all ${numGenres} genres there are roughly <strong style="color:var(--ink)">${numTracks.toLocaleString()} individual tracks</strong>, 
    about <strong style="color:var(--ink)">${avgTracksPerGenre.toLocaleString()} per genre</strong> on average. 
    Within any one genre, those songs don't all sound the same — they scatter. 
    <strong style="color:var(--ink)">${titleCase(mostDiverse)}</strong> has some of the widest internal spread: 
    songs inside it vary almost as much as the gap between two completely different genres. 
    Meanwhile, <strong style="color:var(--ink)">${titleCase(leastDiverse)}</strong> sits at the tighter end — 
    its tracks cluster more closely around a shared center of gravity.`
  );

  section(
    "Some genres have a clear identity. Others blend in.",
    `About <strong style="color:var(--ink)">${stronglyCharacterised} out of ${numGenres} genres</strong> have at least one trait that pulls sharply away from the pack — 
    something that makes them immediately recognisable on a fingerprint chart. The rest sit closer to the middle across all five dimensions. 
    <strong style="color:var(--ink)">${titleCase(mostDistinctive)}</strong> is the most extreme outlier overall — 
    its average profile is further from the global center than any other genre. 
    <strong style="color:var(--ink)">${titleCase(mostTypical)}</strong>, by contrast, is the most "average" genre in the dataset: 
    not particularly loud, fast, danceable, wordy, or intense — just middling across the board.`
  );

  section(
    "Patterns still exist underneath all the differences.",
    `Even with this much variation, structure keeps showing up. Genres that tend to feel intense also tend to sound louder — 
    that relationship holds across styles that have nothing else in common. 
    Genres built heavily on words and rhythm tend to be less reliant on pure sonic force. 
    These aren't rules — every genre has exceptions, and every song within a genre adds its own variation — 
    but they're real tendencies that cross genre lines, visible whenever you look at enough music at once.`
  );

  section(
    "What the games were really testing.",
    `Matching a fingerprint to a song, or picking the closest neighbor, trains the same underlying instinct: 
    that audio fingerprints carry real information, even when your ears are unsure. 
    Two songs can sound worlds apart and still live close together in trait space. 
    Two songs that feel similar can sit far apart on the chart. 
    Genre labels are useful shortcuts — but the actual shape of a song is always more specific, and more surprising, than the label suggests.
    ${gameScore1 > 0 || gameScore2 > 0 ? `<br><br>You scored <strong style="color:var(--ink)">${gameScore1}</strong> on the fingerprint game and <strong style="color:var(--ink)">${gameScore2}</strong> on the neighbor game.` : ""}`
  );
}

function drawBubbleMap(host, data, trait) {
  const width = 620;
  const height = 360;
  const margin = { top: 24, right: 28, bottom: 46, left: 60 };
  const svg = host.append("svg").attr("viewBox", [0, 0, width, height]).attr("width", "100%");
  const x = d3.scaleLinear().domain([-3, 3]).range([margin.left, width - margin.right]);
  const y = d3.scaleLinear().domain([-3, 3]).range([height - margin.bottom, margin.top]);
  svg.append("g").attr("class", "axis").attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x).ticks(5));
  svg.append("g").attr("class", "axis").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y).ticks(5));
  svg.selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", d => x(d[trait]))
    .attr("cy", d => y(d.energy ?? 0))
    .attr("r", d => d.isTarget ? 15 : 11)
    .attr("fill", d => d.correct === false ? "#ff4f7b" : d.isTarget ? "#f8c14a" : featureByKey(trait).color)
    .attr("opacity", 0.86);
  svg.selectAll("text")
    .data(data)
    .join("text")
    .attr("x", d => x(d[trait]) + 14)
    .attr("y", d => y(d.energy ?? 0) - 10)
    .attr("fill", "#f6f7fb")
    .attr("font-size", 11)
    .attr("font-weight", 750)
    .text(d => d.name);
}

function drawBarChart(host, data, label, value) {
  const width = 620;
  const height = 360;
  const margin = { top: 24, right: 40, bottom: 52, left: 142 };
  const svg = host.append("svg").attr("viewBox", [0, 0, width, height]).attr("width", "100%");
  const x = d3.scaleLinear().domain([-1.3, 1.3]).range([margin.left, width - margin.right]);
  const y = d3.scaleBand().domain(data.map(label)).range([margin.top, height - margin.bottom]).padding(0.25);
  svg.append("line").attr("x1", x(0)).attr("x2", x(0)).attr("y1", margin.top).attr("y2", height - margin.bottom).attr("stroke", "rgba(255,255,255,.34)").attr("stroke-dasharray", "4,4");
  svg.append("g").attr("class", "axis").attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x).ticks(5));
  svg.selectAll("text.label").data(data).join("text")
    .attr("x", margin.left - 10).attr("y", d => y(label(d)) + y.bandwidth() / 2).attr("dy", "0.33em")
    .attr("text-anchor", "end").attr("fill", "#9da7b7").attr("font-weight", 750).attr("font-size", 12).text(label);
  svg.selectAll("rect").data(data).join("rect")
    .attr("x", x(0)).attr("y", d => y(label(d))).attr("height", y.bandwidth()).attr("rx", 5)
    .attr("fill", d => value(d) >= 0 ? "#3be0a7" : "#ff4f7b")
    .transition().duration(650)
    .attr("x", d => Math.min(x(0), x(value(d))))
    .attr("width", d => Math.abs(x(value(d)) - x(0)));
}

function buildProximityRound(usedIds) {
  const MIN_SPREAD = 3.5; // close answer must be notably nearer than far decoy

  const playable = state.tracks.filter(t =>
    t.track_id &&
    t.popularity > 0 &&
    activeFeatureKeys.every(k => Number.isFinite(t[k]))
  );

  const validPool = playable.filter(t => !usedIds.has(t.track_id));
  if (validPool.length < 3) return null;

  function euclidean(a, b) {
    return Math.sqrt(activeFeatureKeys.reduce((sum, k) => {
      const diff = (a[k] ?? 0) - (b[k] ?? 0);
      return sum + diff * diff;
    }, 0));
  }

  for (let attempt = 0; attempt < 60; attempt++) {
    const source = validPool[Math.floor(Math.random() * validPool.length)];
    const sourceSk = trackToSketch(source);

    // Candidates: different track, not used
    const pool = playable.filter(t =>
      t.track_id !== source.track_id &&
      !usedIds.has(t.track_id)
    );
    if (pool.length < 2) continue;

    // Score every candidate by distance to source
    const scored = pool.map(t => {
      const sk = trackToSketch(t);
      return { t, sk, dist: euclidean(sourceSk, sk) };
    }).sort((a, b) => a.dist - b.dist);

    // Close answer: one of the 10% nearest, different genre preferred
    const closePool = scored.slice(0, Math.max(Math.floor(scored.length * 0.1), 6));
    const close = closePool[Math.floor(Math.random() * closePool.length)];

    // Far decoy: must be at least MIN_SPREAD further than the close answer
    const farPool = scored.filter(s => s.dist >= close.dist + MIN_SPREAD && s.t.track_id !== close.t.track_id);
    if (!farPool.length) continue;

    const far = farPool[Math.floor(Math.random() * Math.min(farPool.length, 10))];

    const toChoice = ({ t, sk, dist }) => ({
      ...sk,
      track_id: t.track_id,
      id: t.track_id,
      name: `${t.track_name} – ${t.artists}`,
      genre: t.genre,
      dist,
      raw: t
    });

    const answer = toChoice(close);
    const decoy  = toChoice(far);
    const choices = shuffle([answer, decoy]);

    return { source: { ...sourceSk, name: `${source.track_name} – ${source.artists}`, genre: source.genre, track_id: source.track_id }, answer, choices, sourceSk };
  }
  return null;
}

function renderProximityGame() {
  const cardHost  = document.querySelector("#proximity-game-card");
  const chartHost = document.querySelector("#proximity-game-chart");
  if (!cardHost || !chartHost) return;

  const game = state.proximityGame;

  if (!game.currentRound) {
    const round = buildProximityRound(game.usedIds);
    if (!round) {
      cardHost.innerHTML = `<div class="game-score">No more tracks available.</div>`;
      return;
    }
    game.usedIds.add(round.source.track_id);
    round.choices.forEach(c => game.usedIds.add(c.track_id));
    game.currentRound = round;
    game.answered = false;
  }

  const round = game.currentRound;
  // LEFT CARD: source song + fingerprint
  cardHost.innerHTML = `
    <div class="tg-header">
      <div class="tg-score-row">
        <div class="game-score">Score ${game.score}</div>
        <button class="ghost-button tg-reset-btn" type="button">Reset</button>
      </div>
      <div class="tg-instructions">Which candidate is the closest neighbor?</div>
    </div>
    <div style="margin:10px 0 6px;font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.06em">Source song</div>
    <div style="font-size:14px;font-weight:800;color:var(--ink);margin-bottom:4px">${escapeHtml(round.source.name.split(" – ")[0])}</div>
    <div style="font-size:12px;color:var(--muted);margin-bottom:10px">${escapeHtml(round.source.name.split(" – ").slice(1).join(" – "))} · ${escapeHtml(titleCase(round.source.genre))}</div>
    ${spotifyEmbed(round.source.track_id)}
    <div style="margin:14px 0 4px;font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.06em">Source fingerprint</div>
    <div id="pg-source-radar"></div>
    <div id="pg-result" style="display:none;"></div>
    <div id="pg-reveal-area"></div>
  `;

  // RIGHT PANEL: two candidates
  chartHost.innerHTML = `
    <div class="tg-choices-header">
      <span>Pick the closest neighbor</span>
      <small>Which song's audio fingerprint sits nearest to the source?</small>
    </div>
    <div class="tg-choices" id="pg-choices">
      ${round.choices.map((choice, i) => `
        <button class="tg-choice-btn" data-choice="${i}" type="button">
          <div class="tg-choice-meta">
            <span class="tg-choice-num">${String.fromCharCode(65 + i)}</span>
            <div class="tg-choice-text">
              <span class="tg-choice-name">${escapeHtml(choice.name.split(" – ")[0])}</span>
              <span class="tg-choice-genre">${escapeHtml(choice.name.split(" – ").slice(1).join(" – "))} · ${escapeHtml(titleCase(choice.genre))}</span>
            </div>
          </div>
          <div class="tg-choice-embed" id="pg-embed-${i}"></div>
        </button>
      `).join("")}
    </div>
  `;

  // Draw source radar
  drawFingerprintRadar(d3.select("#pg-source-radar"), round.sourceSk, true);

  // Inject embeds into candidates
  round.choices.forEach((choice, i) => {
    const el = chartHost.querySelector(`#pg-embed-${i}`);
    if (el && choice.track_id) el.innerHTML = spotifyEmbed(choice.track_id);
  });

  // Reset
  cardHost.querySelector(".tg-reset-btn").addEventListener("click", () => {
    state.proximityGame = { round: 0, score: 0, answered: false, history: [], streak: 0, currentRound: null, usedIds: new Set() };
    renderProximityGame();
    renderTakeaways();
  });

  // Choice buttons
  chartHost.querySelectorAll(".tg-choice-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const choice = round.choices[+btn.dataset.choice];
      answerProximityRound(round, choice);
    });
  });
}

function answerProximityRound(round, choice) {
  const game = state.proximityGame;
  if (game.answered) return;
  game.answered = true;

  const correct = choice.id === round.answer.id;
  if (correct) {
    game.score += 1;
    game.streak = (game.streak || 0) + 1;
  } else {
    game.streak = 0;
  }
  game.history.push({ choice, correct, round });

  const cardHost  = document.querySelector("#proximity-game-card");
  const chartHost = document.querySelector("#proximity-game-chart");

  // Lock buttons and highlight
  chartHost.querySelectorAll(".tg-choice-btn").forEach(btn => {
    const c = round.choices[+btn.dataset.choice];
    if (c.id === round.answer.id) btn.classList.add("tg-correct");
    else if (c.id === choice.id && !correct) btn.classList.add("tg-wrong");
    btn.disabled = true;
  });

  // Result message
  const result = cardHost.querySelector("#pg-result");
  result.style.display = "block";
  result.innerHTML = `
    <div class="tg-result-inner ${correct ? "tg-result-correct" : "tg-result-wrong"}">
      <span class="tg-result-icon">${correct ? "✓" : "✗"}</span>
      <div class="tg-result-body">
        <strong>${correct ? "Correct!" : "Wrong!"}</strong>
        ${correct
          ? `<span>${escapeHtml(round.answer.name.split(" – ")[0])} is the nearest neighbor (distance ${round.answer.dist.toFixed(2)}).</span>`
          : `<span>The closer neighbor was <strong>${escapeHtml(round.answer.name.split(" – ")[0])}</strong> (dist ${round.answer.dist.toFixed(2)} vs ${round.choices.find(c => c.id !== round.answer.id)?.dist.toFixed(2)}).</span>`
        }
      </div>
    </div>
    <button class="primary-button tg-next-btn" type="button" style="margin-top:12px">Next round →</button>
  `;

  // Reveal: source + both candidates side-by-side
  const revealArea = cardHost.querySelector("#pg-reveal-area");
  revealArea.innerHTML = "";
  const revealSel = d3.select(revealArea);

  revealSel.append("div")
    .style("font-size", "12px")
    .style("font-weight", "800")
    .style("color", "var(--muted)")
    .style("text-transform", "uppercase")
    .style("letter-spacing", ".06em")
    .style("margin", "16px 0 8px")
    .text("Fingerprint comparison");

  const grid = revealSel.append("div")
    .style("display", "grid")
    .style("grid-template-columns", "repeat(3, 1fr)")
    .style("gap", "8px");

  // Source
  const srcCard = grid.append("div")
    .style("border", "1px solid rgba(255,199,68,.45)")
    .style("border-radius", "8px")
    .style("background", "rgba(248,193,74,.05)")
    .style("padding", "6px");
  srcCard.append("div")
    .style("font-size", "10px").style("font-weight", "750")
    .style("color", "var(--gold)").style("margin-bottom", "2px")
    .text("⬟ Source");
  drawFingerprintRadar(srcCard.append("div"), round.sourceSk, true);

  // Two candidates
  round.choices.forEach(c => {
    const isAnswer = c.id === round.answer.id;
    const wasChosen = c.id === choice.id;
    const card = grid.append("div")
      .style("border", isAnswer ? "1px solid rgba(59,224,167,.65)" : wasChosen && !correct ? "1px solid rgba(255,79,123,.65)" : "1px solid rgba(255,255,255,.08)")
      .style("border-radius", "8px")
      .style("background", isAnswer ? "rgba(59,224,167,.06)" : wasChosen && !correct ? "rgba(255,79,123,.06)" : "rgba(255,255,255,.02)")
      .style("padding", "6px");

    card.append("div")
      .style("font-size", "10px").style("font-weight", "750")
      .style("color", isAnswer ? "var(--mint)" : "var(--muted)")
      .style("margin-bottom", "2px").style("line-height", "1.3")
      .html(`${isAnswer ? "✓ " : ""}${escapeHtml(c.name.split(" – ")[0])}<br><span style="font-size:9px;color:var(--muted)">dist ${c.dist.toFixed(2)}</span>`);

    drawFingerprintRadar(card.append("div"), c, true);
  });

  result.querySelector(".tg-next-btn").addEventListener("click", () => {
    game.round += 1;
    game.currentRound = null;
    renderProximityGame();
    renderTakeaways();
  });
}

function representativeSongs(genre, trait, count) {
  return getGenreTracks(genre)
    .filter(d => Number.isFinite(d[trait]))
    .sort((a, b) => d3.descending(a[trait], b[trait]) || d3.descending(a.popularity, b.popularity))
    .slice(0, count);
}

function topPopularTracks(genre, count) {
  return getGenreTracks(genre)
    .filter(d => d.track_id && Number.isFinite(d.popularity))
    .sort((a, b) => d3.descending(a.popularity, b.popularity))
    .slice(0, count);
}

function topGenresForFeature(key, count) {
  return [...state.genreRows].sort((a, b) => d3.descending(a[key], b[key])).slice(0, count);
}

function topGenresBy(key, count) {
  const rows = [...state.genreRows];
  const scored = rows.map(row => {
    const pop = state.byPopularGenre.get(row.genre) || {};
    const popularity = scoreMagnitude(pop);
    const distinctive = scoreMagnitude(row);
    const value = key === "popularity" ? popularity : key === "distinctive" ? distinctive : row[key];
    return { ...row, rankValue: value };
  });
  if (state.popularityDirection === "bottom") {
    scored.sort((a, b) => d3.ascending(a.rankValue, b.rankValue));
  } else {
    scored.sort((a, b) => d3.descending(a.rankValue, b.rankValue));
  }
  return scored.slice(0, count);
}

function scoreMagnitude(row) {
  return d3.mean(activeFeatures, feature => Math.abs(row[feature.key] || 0));
}

function errorSize(genreValue, popularValue) {
  return clamp(0.12 + Math.abs(genreValue - popularValue) * 0.12, 0.12, 0.45);
}

function playFeatureSketch(key, value) {
  const base = {};
  activeFeatures.forEach(feature => base[feature.key] = feature.key === key ? value : 0);
  playSongSketch(base, 0.9);
}

function playSongSketch(song, duration = 0.85) {
  audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
  const now = audioContext.currentTime;
  const tempo = clamp(116 + (song.tempo || 0) * 16 + (song.danceability || 0) * 6, 78, 168);
  const energy = clamp((song.energy || 0) / 3 + 0.55, 0.18, 1);
  const bright = clamp((song.loudness || 0) / 3 + 0.55, 0.18, 1);
  const speech = clamp((song.speechiness || 0) / 3 + 0.55, 0.15, 1);
  const beat = 60 / tempo;
  const master = audioContext.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
  master.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  master.connect(audioContext.destination);

  d3.range(Math.ceil(duration / beat)).forEach(i => {
    const t = now + i * beat;
    const kick = audioContext.createOscillator();
    const kg = audioContext.createGain();
    kick.type = "sine";
    kick.frequency.setValueAtTime(92, t);
    kick.frequency.exponentialRampToValueAtTime(44, t + 0.12);
    kg.gain.setValueAtTime(0.0001, t);
    kg.gain.exponentialRampToValueAtTime(0.22 * energy, t + 0.01);
    kg.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    kick.connect(kg).connect(master);
    kick.start(t);
    kick.stop(t + 0.18);
  });

  const notes = speech > 0.62 ? [0, 2, 5, 7] : [0, 4, 7, 11];
  notes.forEach((step, i) => {
    const t = now + i * duration / notes.length;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = bright > 0.6 ? "sawtooth" : "triangle";
    osc.frequency.setValueAtTime(220 * Math.pow(2, step / 12), t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.08 + bright * 0.08, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration / notes.length);
    osc.connect(gain).connect(master);
    osc.start(t);
    osc.stop(t + duration / notes.length + 0.05);
  });
}

function gameSummary(title, score, total, body) {
  return `
    <div class="game-score">Final score ${score} / ${total}</div>
    <h3>${title}</h3>
    <p class="empty-state">${body}</p>
    <button class="primary-button" type="button">Play again</button>
  `;
}

function spotifyEmbed(trackId) {
  if (!trackId) return "";
  return `
    <iframe class="spotify-embed"
      src="https://open.spotify.com/embed/track/${trackId}?utm_source=generator"
      width="100%"
      height="80"
      frameborder="0"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"></iframe>
  `;
}

function getGenreTracks(genre) {
  return [...(state.tracksByGenre.get(genre) || [])];
}

function tracksWithTrait(genre, trait) {
  return getGenreTracks(genre)
    .filter(track => track.track_id && Number.isFinite(track[trait]))
    .sort((a, b) => d3.descending(a[trait], b[trait]) || d3.descending(a.popularity, b.popularity));
}

function trackToSketch(track) {
  return {
    id: track.track_id,
    track_id: track.track_id,
    raw: track,
    genre: track.genre,
    name: `${track.track_name} - ${track.artists}`,
    popularity: track.popularity,
    danceability: (track.danceability - 0.5) * 4,
    energy: (track.energy - 0.5) * 4,
    loudness: clamp((track.loudness + 10) / 4, -3, 3),
    speechiness: (track.speechiness - 0.08) * 10,
    tempo: (track.tempo - 120) / 28
  };
}

function installScrollSpy() {
  const links = [...document.querySelectorAll(".rail-mark")];
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      links.forEach(link => link.classList.toggle("active", link.dataset.section === entry.target.id));
    });
  }, { threshold: 0.35 });
  document.querySelectorAll(".story-section").forEach(section => observer.observe(section));
}

function featureByKey(key) {
  return features.find(feature => feature.key === key);
}

function titleCase(value) {
  return value.split("-").map(part => part ? part[0].toUpperCase() + part.slice(1) : part).join(" ");
}

function signed(value) {
  return `${value >= 0 ? "+" : ""}${Number(value).toFixed(2)}`;
}

function formatTrackTrait(key, value) {
  if (key === "tempo") return `${Math.round(value)} bpm`;
  if (key === "loudness") return `${value.toFixed(1)} dB`;
  if (key === "duration") return `${value.toFixed(2)} min`;
  return value.toFixed(3);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function hashCode(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
  return Math.abs(hash) || 1;
}

function shuffle(array) {
  return array.map(value => ({ value, sort: Math.random() })).sort((a, b) => a.sort - b.sort).map(d => d.value);
}

function showTooltip(event, html) {
  tooltip.html(html).style("opacity", 1).style("left", `${event.clientX + 14}px`).style("top", `${event.clientY + 14}px`);
}

function hideTooltip() {
  tooltip.style("opacity", 0);
}