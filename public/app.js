(() => {
  'use strict';

  const LIVE_BASE = 'https://data.poliwave.com/live/br/presidente-2026';
  const MUNI_GEO_BASE = 'https://cdn.jsdelivr.net/gh/tbrugz/geodata-br@master/geojson';
  const POLL_MS = 15_000;
  const WIDTH = 760;
  const HEIGHT = 580;

  const UF_IBGE = {
    ac: 12, al: 27, am: 13, ap: 16, ba: 29, ce: 23, df: 53,
    es: 32, go: 52, ma: 21, mg: 31, ms: 50, mt: 51, pa: 15,
    pb: 25, pe: 26, pi: 22, pr: 41, rj: 33, rn: 24, ro: 11,
    rr: 14, rs: 43, sc: 42, se: 28, sp: 35, to: 17
  };

  const REGION_CODES = {
    North: ['ac', 'am', 'ap', 'pa', 'ro', 'rr', 'to'],
    Northeast: ['al', 'ba', 'ce', 'ma', 'pb', 'pe', 'pi', 'rn', 'se'],
    Southeast: ['es', 'mg', 'rj', 'sp'],
    South: ['pr', 'rs', 'sc'],
    'Center-West': ['df', 'go', 'ms', 'mt'],
    Overseas: ['zz']
  };

  const I18N = {
    en: {
      eyebrow: 'Brazil · Presidential runoff',
      title: 'Live path to 50% + 1',
      dek: 'What has been counted, where the remaining vote sits and how each candidate can reach a majority.',
      counted: 'Counted', currentLeader: 'Current leader', baselineFinish: 'Baseline finish',
      baselinePattern: 'First-round local pattern', votesAhead: 'Votes still ahead',
      brazil: 'Brazil', backBrazil: 'Back to Brazil', stillToCount: 'Still to count',
      estimatedLean: 'Estimated lean', exploreState: 'Explore state', states: 'States',
      municipalities: 'Municipalities', mapHint: 'Click a state to drill into municipality results',
      muniHint: 'Click a municipality for its count. Drag or pinch to explore.', liveChanges: 'Live changes',
      pathMajority: 'Path to a majority', pathExplainer: 'Solid is counted. Pale is the baseline estimate still ahead.',
      candidateNeeds: 'What each candidate needs', resultsSource: 'Results source',
      boundarySource: 'Municipal boundaries', selectState: 'Choose a state…',
      mapCountryHeading: 'Where the remaining vote is', mapCountrySub: 'Click a state to open its municipalities.',
      mapStateHeading: '{state}, municipality by municipality', mapStateSub: 'The whole state is framed. Select any municipality for detail.',
      loadingMunicipalities: 'Loading municipalities…', checkingEvery: 'Checking every 15 seconds.',
      nextCheck: 'Live · next check in {seconds}s', fallbackNext: 'Snapshot fallback · retry in {seconds}s',
      final: 'Count complete', sourceAt: 'Source updated {time}',
      connected: 'Live connection established', connectedMeta: 'Watching the national and state count',
      nationalUpdate: '{votes} new valid votes nationally', nationalMeta: '{counted}% of polling stations counted',
      stateUpdate: '{name} added {votes} votes', stateMeta: 'Now {counted}% counted · click to inspect',
      muniUpdate: '{name} added {votes} votes', muniMeta: '{state} · now {counted}% counted',
      noChanges: 'No new changes yet', noChangesMeta: 'New batches will appear here as they arrive',
      whatNext: 'What comes next', regionKicker: 'Estimated uncounted valid vote by region.',
      stateNext: 'Municipalities still ahead', stateNextKicker: 'Largest estimated uncounted municipal totals in {state}.',
      projected: 'Projected', current: 'Current', majority: 'Majority',
      needsVotes: 'Lula needs {lula} and Flávio needs {flavio} of the estimated remaining vote.',
      needsShare: 'That is {lulaPct}% for Lula and {flavioPct}% for Flávio.',
      majorityReached: '{name} has passed the modeled majority threshold.',
      validVotes: 'Valid votes', leader: 'Leader', estimatedFinish: 'Estimated finish',
      pollingPlaces: 'Polling stations', remaining: 'Still ahead',
      currentSplit: 'Current split', projectedSplit: 'Projected split',
      noMunicipalData: 'Municipality detail is not available yet for this state.',
      detailPrompt: 'Select a state or municipality to inspect the count.',
      methodology: '<strong>How the estimate works:</strong> the live count is official-source data carried by the public Poliwave tracker. Remaining valid vote in each place is estimated from first-round turnout, then split at that place’s first-round Lula–Flávio two-way share. It is a counting-path model, not a race call.',
      failedLive: 'The live endpoint did not answer. Showing the most recent saved snapshot and retrying automatically.',
      failedMunicipal: 'Municipality detail could not be loaded. The state view is still available.',
      remainingLegend: 'More votes still ahead', countedLegend: 'More complete',
      lulaLegend: 'Lula lean', flavioLegend: 'Flávio lean',
      north: 'North', northeast: 'Northeast', southeast: 'Southeast', south: 'South',
      centerWest: 'Center-West', overseas: 'Overseas',
      updatedAgo: '{seconds}s ago', justNow: 'now', clickZoom: 'Click to zoom',
      wonBy: '{name} +{margin} pts', tied: 'Tied', votes: 'votes'
    },
    pt: {
      eyebrow: 'Brasil · 2º turno presidencial',
      title: 'Caminho ao vivo para 50% + 1',
      dek: 'O que já foi apurado, onde estão os votos restantes e como cada candidato pode chegar à maioria.',
      counted: 'Apurado', currentLeader: 'Líder atual', baselineFinish: 'Projeção-base',
      baselinePattern: 'Padrão local do 1º turno', votesAhead: 'Votos a apurar',
      brazil: 'Brasil', backBrazil: 'Voltar ao Brasil', stillToCount: 'Falta apurar',
      estimatedLean: 'Tendência estimada', exploreState: 'Explorar estado', states: 'Estados',
      municipalities: 'Municípios', mapHint: 'Clique em um estado para abrir os resultados municipais',
      muniHint: 'Clique em um município para ver a apuração. Arraste ou use pinça para explorar.', liveChanges: 'Atualizações ao vivo',
      pathMajority: 'Caminho para a maioria', pathExplainer: 'A cor sólida é o apurado. A clara é a estimativa-base restante.',
      candidateNeeds: 'O que cada candidato precisa', resultsSource: 'Fonte dos resultados',
      boundarySource: 'Limites municipais', selectState: 'Escolha um estado…',
      mapCountryHeading: 'Onde estão os votos restantes', mapCountrySub: 'Clique em um estado para abrir seus municípios.',
      mapStateHeading: '{state}, município por município', mapStateSub: 'O estado inteiro está enquadrado. Selecione um município para ver detalhes.',
      loadingMunicipalities: 'Carregando municípios…', checkingEvery: 'Verificação a cada 15 segundos.',
      nextCheck: 'Ao vivo · próxima verificação em {seconds}s', fallbackNext: 'Snapshot salvo · nova tentativa em {seconds}s',
      final: 'Apuração concluída', sourceAt: 'Fonte atualizada às {time}',
      connected: 'Conexão ao vivo estabelecida', connectedMeta: 'Acompanhando a apuração nacional e estadual',
      nationalUpdate: '{votes} novos votos válidos no país', nationalMeta: '{counted}% das seções apuradas',
      stateUpdate: '{name} somou {votes} votos', stateMeta: 'Agora {counted}% apurado · clique para ver',
      muniUpdate: '{name} somou {votes} votos', muniMeta: '{state} · agora {counted}% apurado',
      noChanges: 'Nenhuma mudança nova ainda', noChangesMeta: 'Novos lotes aparecerão aqui quando chegarem',
      whatNext: 'O que vem agora', regionKicker: 'Estimativa de votos válidos ainda não apurados por região.',
      stateNext: 'Municípios ainda por apurar', stateNextKicker: 'Maiores totais municipais estimados ainda não apurados em {state}.',
      projected: 'Projetado', current: 'Atual', majority: 'Maioria',
      needsVotes: 'Lula precisa de {lula} e Flávio de {flavio} dos votos restantes estimados.',
      needsShare: 'Isso representa {lulaPct}% para Lula e {flavioPct}% para Flávio.',
      majorityReached: '{name} ultrapassou o limite de maioria do modelo.',
      validVotes: 'Votos válidos', leader: 'Líder', estimatedFinish: 'Projeção final',
      pollingPlaces: 'Seções eleitorais', remaining: 'Falta apurar',
      currentSplit: 'Divisão atual', projectedSplit: 'Divisão projetada',
      noMunicipalData: 'Os detalhes municipais ainda não estão disponíveis para este estado.',
      detailPrompt: 'Selecione um estado ou município para examinar a apuração.',
      methodology: '<strong>Como funciona a estimativa:</strong> a apuração ao vivo usa dados de fonte oficial transmitidos pelo painel público Poliwave. O voto válido restante em cada local é estimado pelo comparecimento do primeiro turno e dividido pela proporção Lula–Flávio daquele local no primeiro turno. É um modelo do caminho da apuração, não uma declaração de vencedor.',
      failedLive: 'A fonte ao vivo não respondeu. Exibindo o snapshot salvo mais recente e tentando novamente automaticamente.',
      failedMunicipal: 'Os detalhes municipais não puderam ser carregados. A visão estadual continua disponível.',
      remainingLegend: 'Mais votos a apurar', countedLegend: 'Mais completo',
      lulaLegend: 'Tendência Lula', flavioLegend: 'Tendência Flávio',
      north: 'Norte', northeast: 'Nordeste', southeast: 'Sudeste', south: 'Sul',
      centerWest: 'Centro-Oeste', overseas: 'Exterior',
      updatedAgo: 'há {seconds}s', justNow: 'agora', clickZoom: 'Clique para aproximar',
      wonBy: '{name} +{margin} pts', tied: 'Empate', votes: 'votos'
    }
  };

  const app = {
    data: null,
    geo: null,
    locale: localStorage.getItem('bel26-language') || (new URLSearchParams(location.search).get('lang') === 'pt' ? 'pt' : 'en'),
    view: 'remaining',
    level: 'country',
    selectedState: null,
    selectedMuni: null,
    places: null,
    detail: null,
    municipalities: [],
    lastLive: null,
    lastDetail: null,
    liveOk: false,
    nextPollAt: Date.now() + POLL_MS,
    feed: [],
    muniGeoCache: new Map(),
    loadToken: 0,
    svg: null,
    root: null,
    stateLayer: null,
    muniLayer: null,
    labelLayer: null,
    projection: null,
    path: null,
    zoom: null,
    currentTransform: null
  };

  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const finite = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));

  function t(key, vars = {}) {
    let value = I18N[app.locale][key] ?? I18N.en[key] ?? key;
    Object.entries(vars).forEach(([name, replacement]) => {
      value = value.replaceAll(`{${name}}`, String(replacement));
    });
    return value;
  }

  const localeCode = () => app.locale === 'pt' ? 'pt-BR' : 'en-US';
  const formatNumber = value => new Intl.NumberFormat(localeCode(), { maximumFractionDigits: 0 }).format(finite(value));
  const formatCompact = value => new Intl.NumberFormat(localeCode(), { notation: 'compact', maximumFractionDigits: 1 }).format(finite(value));
  const formatPct = (value, digits = 1) => new Intl.NumberFormat(localeCode(), { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(finite(value));
  const formatTime = value => {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat(localeCode(), { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(date) : '—';
  };

  function stateByCode(code) {
    return app.data?.states.find(row => row.code === String(code).toLowerCase());
  }

  function currentWinner(row, projected = false) {
    const lula = finite(projected ? row.projectedL : row.currentL);
    const flavio = finite(projected ? row.projectedF : row.currentF);
    if (lula === flavio) return { name: t('tied'), className: '', margin: 0 };
    const total = Math.max(1, lula + flavio);
    return {
      name: lula > flavio ? 'Lula' : 'Flávio',
      className: lula > flavio ? 'lula' : 'flavio',
      margin: Math.abs(lula - flavio) / total * 100
    };
  }

  async function getJson(url) {
    const separator = url.includes('?') ? '&' : '?';
    const response = await fetch(`${url}${separator}t=${Math.floor(Date.now() / 15_000)}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return response.json();
  }

  function regionName(name) {
    const key = { North: 'north', Northeast: 'northeast', Southeast: 'southeast', South: 'south', 'Center-West': 'centerWest', Overseas: 'overseas' }[name];
    return key ? t(key) : name;
  }

  function applyTranslations() {
    document.documentElement.lang = app.locale === 'pt' ? 'pt-BR' : 'en';
    $$('[data-i18n]').forEach(node => { node.textContent = t(node.dataset.i18n); });
    $$('[data-language]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.language === app.locale)));
    $('#method-copy').innerHTML = t('methodology');
    $('#map-loading-copy').textContent = t('loadingMunicipalities');
    populateStateSelect();
    if (app.data) renderAll();
  }

  function populateStateSelect() {
    const select = $('#state-select');
    const selected = app.selectedState || '';
    const rows = (app.data?.states || []).filter(row => row.code !== 'zz').sort((a, b) => a.name.localeCompare(b.name, localeCode()));
    select.innerHTML = `<option value="">${esc(t('selectState'))}</option>` + rows.map(row => `<option value="${row.code}">${esc(row.name)} · ${formatPct(row.countedPct)}%</option>`).join('');
    select.value = selected;
  }

  function normaliseState(previous, current) {
    const baselineL = finite(previous.baselineL) || .5;
    const currentValid = finite(current?.valid);
    const expectedValid = Math.max(finite(previous.expectedValid), currentValid);
    const remaining = Math.max(0, expectedValid - currentValid);
    const currentL = finite(current?.votes?.['13']);
    const currentF = finite(current?.votes?.['22']);
    const projectedL = currentL + remaining * baselineL;
    const projectedF = currentF + remaining * (1 - baselineL);
    return {
      ...previous,
      countedPct: finite(current?.counted),
      reported: finite(current?.polls?.reported),
      totalPolls: finite(current?.polls?.total) || finite(previous.totalPolls),
      currentValid, currentL, currentF, expectedValid, remaining,
      remainingL: remaining * baselineL,
      remainingF: remaining * (1 - baselineL),
      projectedL, projectedF,
      projectedLeader: projectedL >= projectedF ? 'Lula' : 'Flávio',
      projectedMargin: expectedValid ? Math.abs(projectedL - projectedF) / expectedValid : 0
    };
  }

  function overlayLive(latest) {
    app.data.states = app.data.states.map(row => normaliseState(row, latest.regions?.[row.code]));
    const sum = key => app.data.states.reduce((total, row) => total + finite(row[key]), 0);
    const national = latest.national || {};
    const expectedValid = sum('expectedValid');
    app.data.national = {
      countedPct: finite(national.counted),
      reported: finite(national.polls?.reported),
      totalPolls: finite(national.polls?.total),
      currentValid: finite(national.valid),
      currentL: finite(national.votes?.['13']),
      currentF: finite(national.votes?.['22']),
      expectedValid,
      projectedL: sum('projectedL'),
      projectedF: sum('projectedF'),
      majority: Math.floor(expectedValid / 2) + 1
    };
    app.data.regions = Object.entries(REGION_CODES).map(([name, codes]) => {
      const rows = app.data.states.filter(row => codes.includes(row.code));
      return {
        name,
        remaining: rows.reduce((sumValue, row) => sumValue + row.remaining, 0),
        remainingL: rows.reduce((sumValue, row) => sumValue + row.remainingL, 0),
        remainingF: rows.reduce((sumValue, row) => sumValue + row.remainingF, 0)
      };
    }).sort((a, b) => b.remaining - a.remaining);
    app.data.topRemaining = [...app.data.states].filter(row => row.code !== 'zz').sort((a, b) => b.remaining - a.remaining).slice(0, 8);
    app.data.meta.sourceTime = latest.sourceTime || latest.fetchedAt || app.data.meta.sourceTime;
    app.data.meta.final = app.data.national.countedPct >= 99.999 || (app.data.national.totalPolls > 0 && app.data.national.reported >= app.data.national.totalPolls);
  }

  function addFeed(item) {
    app.feed.unshift({ ...item, id: `${Date.now()}-${Math.random()}`, fresh: true });
    app.feed = app.feed.slice(0, 30);
    setTimeout(() => {
      const match = app.feed.find(row => row.id === item.id);
      if (match) match.fresh = false;
    }, 700);
  }

  function captureLiveChanges(previous, next) {
    if (!previous) {
      app.feed.unshift({ type: 'live', titleKey: 'connected', metaKey: 'connectedMeta', at: Date.now(), fresh: true });
      return;
    }
    if ((previous.sourceTime || '') === (next.sourceTime || '')) return;
    const nationalDelta = finite(next.national?.valid) - finite(previous.national?.valid);
    if (nationalDelta > 0) {
      app.feed.unshift({
        type: 'live', titleKey: 'nationalUpdate', titleVars: { votes: formatNumber(nationalDelta) },
        metaKey: 'nationalMeta', metaVars: { counted: formatPct(next.national?.counted) },
        at: next.sourceTime || Date.now(), fresh: true
      });
    }
    const deltas = Object.entries(next.regions || {}).map(([code, row]) => ({
      code,
      delta: finite(row.valid) - finite(previous.regions?.[code]?.valid),
      counted: finite(row.counted)
    })).filter(row => row.delta > 0 && row.code !== 'zz').sort((a, b) => b.delta - a.delta).slice(0, 5);
    deltas.reverse().forEach(change => {
      const state = stateByCode(change.code);
      if (!state) return;
      app.feed.unshift({
        type: 'state', stateCode: change.code, titleKey: 'stateUpdate',
        titleVars: { name: state.name, votes: formatNumber(change.delta) },
        metaKey: 'stateMeta', metaVars: { counted: formatPct(change.counted) },
        at: next.sourceTime || Date.now(), fresh: true
      });
    });
    app.feed = app.feed.slice(0, 30);
  }

  function buildMunicipalities(stateCode, detail = app.detail) {
    if (!app.places || !detail) return [];
    const rows = [];
    Object.entries(app.places).forEach(([tseCode, place]) => {
      if (String(place.parent || '').toLowerCase() !== stateCode) return;
      const current = detail.units?.[tseCode] || {};
      const first = place.firstRound || place.base || {};
      const firstL = finite(first.votes?.['13']);
      const firstF = finite(first.votes?.['22']);
      const baselineL = firstL + firstF ? firstL / (firstL + firstF) : .5;
      const currentValid = finite(current.valid);
      const expectedValid = Math.max(finite(first.valid), currentValid);
      const remaining = Math.max(0, expectedValid - currentValid);
      const currentL = finite(current.votes?.['13']);
      const currentF = finite(current.votes?.['22']);
      const projectedL = currentL + remaining * baselineL;
      const projectedF = currentF + remaining * (1 - baselineL);
      rows.push({
        tseCode, geoId: String(place.geo || ''), name: place.name || tseCode,
        countedPct: finite(current.counted), reported: finite(current.polls?.reported),
        totalPolls: finite(current.polls?.total) || finite(first.polls?.total),
        currentValid, currentL, currentF, expectedValid, remaining,
        remainingL: remaining * baselineL, remainingF: remaining * (1 - baselineL),
        baselineL, baselineF: 1 - baselineL, projectedL, projectedF,
        projectedLeader: projectedL >= projectedF ? 'Lula' : 'Flávio',
        projectedMargin: expectedValid ? Math.abs(projectedL - projectedF) / expectedValid : 0
      });
    });
    return rows;
  }

  function bindMunicipalityResultsToShapes() {
    if (!app.muniLayer) return;
    const resultsByGeo = new Map(app.municipalities.map(row => [row.geoId, row]));
    app.muniLayer.selectAll('.muni-shape').each(function(feature) {
      feature.properties.result = resultsByGeo.get(String(feature.properties.id));
    });
  }

  function captureMunicipalityChanges(previous, next, stateCode) {
    if (!previous || !next || previous.fetchedAt === next.fetchedAt) return;
    const byTse = new Map(app.municipalities.map(row => [row.tseCode, row]));
    const changes = Object.entries(next.units || {}).map(([code, unit]) => {
      const place = byTse.get(code);
      return place ? { place, delta: finite(unit.valid) - finite(previous.units?.[code]?.valid), counted: finite(unit.counted) } : null;
    }).filter(row => row && row.delta > 0).sort((a, b) => b.delta - a.delta).slice(0, 6);
    const state = stateByCode(stateCode);
    changes.reverse().forEach(change => {
      app.feed.unshift({
        type: 'muni', stateCode, geoId: change.place.geoId,
        titleKey: 'muniUpdate', titleVars: { name: change.place.name, votes: formatNumber(change.delta) },
        metaKey: 'muniMeta', metaVars: { state: state?.name || stateCode.toUpperCase(), counted: formatPct(change.counted) },
        at: next.fetchedAt || Date.now(), fresh: true
      });
    });
    app.feed = app.feed.slice(0, 30);
  }

  async function ensurePlaces() {
    if (!app.places) app.places = await getJson(`${LIVE_BASE}/places.json`);
    return app.places;
  }

  async function getMunicipalityGeo(stateCode) {
    if (app.muniGeoCache.has(stateCode)) return app.muniGeoCache.get(stateCode);
    const geo = await getJson(`${MUNI_GEO_BASE}/geojs-${UF_IBGE[stateCode]}-mun.json`);
    app.muniGeoCache.set(stateCode, geo);
    return geo;
  }

  async function refreshDetail(stateCode, initial = false) {
    await ensurePlaces();
    const next = await getJson(`${LIVE_BASE}/detail.json`);
    if (!initial) captureMunicipalityChanges(app.lastDetail, next, stateCode);
    app.detail = next;
    app.lastDetail = next;
    app.municipalities = buildMunicipalities(stateCode, next);
  }

  function setupMap() {
    app.svg = d3.select('#brazil-map').attr('viewBox', `0 0 ${WIDTH} ${HEIGHT}`);
    app.svg.selectAll('*').remove();
    app.root = app.svg.append('g').attr('class', 'map-root');
    app.stateLayer = app.root.append('g').attr('class', 'state-layer');
    app.muniLayer = app.root.append('g').attr('class', 'municipality-layer');
    app.labelLayer = app.root.append('g').attr('class', 'label-layer');
    app.projection = d3.geoMercator().fitExtent([[42, 24], [WIDTH - 42, HEIGHT - 28]], app.geo);
    app.path = d3.geoPath(app.projection);
    app.zoom = d3.zoom().scaleExtent([1, 18]).on('zoom', event => {
      app.currentTransform = event.transform;
      app.root.attr('transform', event.transform);
    });
    app.svg.call(app.zoom).on('dblclick.zoom', null);
    drawCountry();
  }

  function keyboardActivate(event, handler) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handler();
    }
  }

  function drawCountry() {
    const features = app.geo.features.filter(feature => stateByCode(feature.properties.sigla.toLowerCase()));
    const paths = app.stateLayer.selectAll('path').data(features, feature => feature.properties.sigla);
    paths.join('path')
      .attr('class', 'map-shape state-shape')
      .attr('d', app.path)
      .attr('tabindex', 0)
      .attr('role', 'button')
      .attr('aria-label', feature => feature.properties.name)
      .on('click', (_, feature) => drillState(feature.properties.sigla.toLowerCase()))
      .on('keydown', (event, feature) => keyboardActivate(event, () => drillState(feature.properties.sigla.toLowerCase())))
      .each(function(feature) {
        const node = d3.select(this);
        node.selectAll('title').data([feature]).join('title').text(row => tooltipFor(stateByCode(row.properties.sigla.toLowerCase())));
      });
    app.labelLayer.selectAll('text').data(features, feature => feature.properties.sigla).join('text')
      .attr('class', 'state-label')
      .attr('x', feature => app.path.centroid(feature)[0])
      .attr('y', feature => app.path.centroid(feature)[1] + 4)
      .text(feature => feature.properties.sigla);
    updateMapFills();
  }

  function tooltipFor(row) {
    if (!row) return '';
    const winner = currentWinner(row, true);
    return `${row.name} · ${formatPct(row.countedPct)}% ${t('counted').toLowerCase()} · ${formatCompact(row.remaining)} ${t('remaining').toLowerCase()} · ${winner.name}`;
  }

  function mapRows() {
    return app.level === 'state' && app.municipalities.length ? app.municipalities : app.data.states.filter(row => row.code !== 'zz');
  }

  function fillFor(row, maximum) {
    if (!row) return '#1b3028';
    if (app.view === 'counted') {
      return d3.interpolateRgb('#173027', '#63e39b')(clamp(row.countedPct / 100, 0, 1));
    }
    if (app.view === 'lean') {
      const winner = currentWinner(row, true);
      const base = winner.name === 'Lula' ? '#f04444' : winner.name === 'Flávio' ? '#4b8df8' : '#75857e';
      return d3.interpolateRgb('#23342d', base)(.3 + clamp(winner.margin / 30, 0, 1) * .7);
    }
    const strength = maximum ? Math.sqrt(clamp(row.remaining / maximum, 0, 1)) : 0;
    return d3.interpolateRgb('#172a23', '#e3b341')(.12 + strength * .88);
  }

  function updateMapFills() {
    if (!app.data || !app.stateLayer) return;
    const stateMax = d3.max(app.data.states.filter(row => row.code !== 'zz'), row => row.remaining) || 1;
    app.stateLayer.selectAll('.state-shape')
      .attr('fill', feature => fillFor(stateByCode(feature.properties.sigla.toLowerCase()), stateMax))
      .classed('dimmed', feature => app.level === 'state' && feature.properties.sigla.toLowerCase() !== app.selectedState)
      .classed('selected', feature => feature.properties.sigla.toLowerCase() === app.selectedState)
      .each(function(feature) { d3.select(this).select('title').text(tooltipFor(stateByCode(feature.properties.sigla.toLowerCase()))); });
    const muniMax = d3.max(app.municipalities, row => row.remaining) || 1;
    app.muniLayer.selectAll('.muni-shape')
      .attr('fill', feature => fillFor(feature.properties.result, muniMax))
      .classed('selected', feature => feature.properties.result?.geoId === app.selectedMuni)
      .each(function(feature) { d3.select(this).select('title').text(tooltipFor(feature.properties.result)); });
    drawLegend();
  }

  function drawLegend() {
    const legend = $('#map-legend');
    if (app.view === 'lean') {
      legend.innerHTML = `<span class="legend-key"><span class="swatch" style="background:var(--lula)"></span>${esc(t('lulaLegend'))}</span><span class="legend-key"><span class="swatch" style="background:var(--flavio)"></span>${esc(t('flavioLegend'))}</span>`;
    } else {
      const color = app.view === 'counted' ? 'var(--green)' : 'var(--neutral)';
      legend.innerHTML = `<span class="legend-key"><span class="swatch" style="background:${color};opacity:.28"></span>${esc(app.view === 'counted' ? '0%' : '0')}</span><span class="legend-key"><span class="swatch" style="background:${color}"></span>${esc(t(app.view === 'counted' ? 'countedLegend' : 'remainingLegend'))}</span>`;
    }
  }

  function zoomToFeature(feature, duration = 1250, scaleCap = 11) {
    const [[x0, y0], [x1, y1]] = app.path.bounds(feature);
    const dx = Math.max(1, x1 - x0);
    const dy = Math.max(1, y1 - y0);
    const scale = Math.min(scaleCap, .87 / Math.max(dx / WIDTH, dy / HEIGHT));
    const x = (x0 + x1) / 2;
    const y = (y0 + y1) / 2;
    const transform = d3.zoomIdentity.translate(WIDTH / 2, HEIGHT / 2).scale(scale).translate(-x, -y);
    return app.svg.transition().duration(duration).ease(d3.easeCubicOut).call(app.zoom.transform, transform).end().catch(() => {});
  }

  async function drawMunicipalities(stateCode, focusGeoId = null) {
    const token = ++app.loadToken;
    $('#map-loading').hidden = false;
    try {
      const [geo] = await Promise.all([
        getMunicipalityGeo(stateCode),
        refreshDetail(stateCode, !app.lastDetail)
      ]);
      if (token !== app.loadToken || app.selectedState !== stateCode) return;
      const resultsByGeo = new Map(app.municipalities.map(row => [row.geoId, row]));
      geo.features.forEach(feature => { feature.properties.result = resultsByGeo.get(String(feature.properties.id)); });
      app.muniLayer.selectAll('path').remove();
      app.muniLayer.selectAll('path').data(geo.features, feature => feature.properties.id).join('path')
        .attr('class', 'map-shape muni-shape')
        .attr('d', app.path)
        .attr('opacity', 0)
        .attr('tabindex', 0)
        .attr('role', 'button')
        .attr('aria-label', feature => feature.properties.name)
        .on('click', (_, feature) => focusMunicipality(String(feature.properties.id)))
        .on('keydown', (event, feature) => keyboardActivate(event, () => focusMunicipality(String(feature.properties.id))))
        .each(function(feature) {
          d3.select(this).append('title').text(tooltipFor(feature.properties.result) || feature.properties.name);
        })
        .transition().duration(420).attr('opacity', 1);
      if (focusGeoId) await focusMunicipality(focusGeoId, false);
      updateMapFills();
      renderAll();
      clearError();
    } catch (error) {
      showError(t('failedMunicipal'));
      console.error(error);
      renderAll();
    } finally {
      if (token === app.loadToken) $('#map-loading').hidden = true;
    }
  }

  async function drillState(stateCode, focusGeoId = null, scroll = false) {
    const state = stateByCode(stateCode);
    const feature = app.geo.features.find(row => row.properties.sigla.toLowerCase() === stateCode);
    if (!state || !feature) return;
    app.level = 'state';
    app.selectedState = stateCode;
    app.selectedMuni = null;
    app.municipalities = [];
    app.detail = null;
    populateStateSelect();
    renderAll();
    updateMapFills();
    if (scroll) $('#map-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    zoomToFeature(feature);
    await drawMunicipalities(stateCode, focusGeoId);
  }

  async function focusMunicipality(geoId, scroll = true) {
    const feature = app.muniLayer.selectAll('.muni-shape').data().find(row => String(row.properties.id) === String(geoId));
    if (!feature) return;
    app.selectedMuni = String(geoId);
    updateMapFills();
    renderAll();
    if (scroll) $('#map-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    await zoomToFeature(feature, 1050, 16);
  }

  function resetCountry() {
    app.loadToken += 1;
    app.level = 'country';
    app.selectedState = null;
    app.selectedMuni = null;
    app.municipalities = [];
    app.detail = null;
    app.muniLayer.selectAll('*').remove();
    app.svg.transition().duration(900).ease(d3.easeCubicOut).call(app.zoom.transform, d3.zoomIdentity);
    populateStateSelect();
    updateMapFills();
    renderAll();
  }

  function renderHeader() {
    const national = app.data.national;
    const winner = currentWinner(national);
    const projected = currentWinner(national, true);
    const currentTotal = Math.max(1, national.currentL + national.currentF);
    const projectedTotal = Math.max(1, national.projectedL + national.projectedF);
    $('#counted-value').textContent = `${formatPct(national.countedPct)}%`;
    $('#counted-sub').textContent = `${formatNumber(national.reported)} / ${formatNumber(national.totalPolls)} ${t('pollingPlaces').toLowerCase()}`;
    $('#leader-value').innerHTML = `<span class="${winner.className}">${esc(winner.name)}</span>`;
    $('#leader-sub').textContent = `${formatPct(Math.max(national.currentL, national.currentF) / currentTotal * 100)}% · ${formatNumber(Math.abs(national.currentL - national.currentF))} ${t('votes')}`;
    $('#projection-value').innerHTML = `<span class="${projected.className}">${esc(projected.name)} ${formatPct(Math.max(national.projectedL, national.projectedF) / projectedTotal * 100)}%</span>`;
    const remaining = Math.max(0, national.expectedValid - national.currentValid);
    $('#remaining-value').textContent = formatCompact(remaining);
    $('#remaining-sub').textContent = `${formatNumber(remaining)} ${t('votes')}`;
    $('#source-time').textContent = t('sourceAt', { time: formatTime(app.data.meta.sourceTime) });
  }

  function renderStatus() {
    const seconds = Math.max(0, Math.ceil((app.nextPollAt - Date.now()) / 1000));
    const node = $('#live-status');
    node.classList.toggle('fallback', !app.liveOk);
    node.classList.toggle('final', Boolean(app.data?.meta.final));
    $('#status-text').textContent = app.data?.meta.final ? t('final') : t(app.liveOk ? 'nextCheck' : 'fallbackNext', { seconds });
    $('#feed-kicker').textContent = app.data?.meta.final ? t('final') : t('checkingEvery');
  }

  function renderNavigation() {
    const state = stateByCode(app.selectedState);
    const muni = app.municipalities.find(row => row.geoId === app.selectedMuni);
    $('#state-separator').hidden = !state;
    $('#state-crumb').hidden = !state;
    $('#state-crumb').textContent = state?.name || '';
    $('#state-crumb').classList.toggle('active', Boolean(state && !muni));
    $('#muni-separator').hidden = !muni;
    $('#muni-crumb').hidden = !muni;
    $('#muni-crumb').textContent = muni?.name || '';
    $('#back-country').hidden = app.level === 'country';
    $('#map-level-badge').textContent = t(app.level === 'country' ? 'states' : 'municipalities');
    $('#map-heading').textContent = app.level === 'country' ? t('mapCountryHeading') : t('mapStateHeading', { state: state?.name || '' });
    $('#map-subheading').textContent = app.level === 'country' ? t('mapCountrySub') : t('mapStateSub');
    $('#map-hint').textContent = t(app.level === 'country' ? 'mapHint' : 'muniHint');
    app.labelLayer?.transition().duration(260).style('opacity', app.level === 'country' ? 1 : 0);
  }

  function renderFeed() {
    const feed = $('#change-feed');
    const rows = app.feed.length ? app.feed : [{ type: 'static', titleKey: 'noChanges', metaKey: 'noChangesMeta', at: Date.now() }];
    feed.innerHTML = rows.map(row => {
      const title = t(row.titleKey, row.titleVars);
      const meta = t(row.metaKey, row.metaVars);
      const age = Math.max(0, Math.floor((Date.now() - new Date(row.at).getTime()) / 1000));
      const time = age < 4 ? t('justNow') : t('updatedAgo', { seconds: age });
      const clickable = row.stateCode ? '' : ' static';
      return `<button type="button" class="feed-item${clickable}${row.fresh ? ' new' : ''}" data-feed-id="${esc(row.id || '')}" ${row.stateCode ? '' : 'disabled'}>
        <span class="feed-dot ${esc(row.type)}"></span>
        <span class="feed-copy"><strong>${esc(title)}</strong><span class="feed-meta">${esc(meta)}</span></span>
        <span class="feed-time">${esc(time)}</span>
      </button>`;
    }).join('');
    feed.querySelectorAll('[data-feed-id]').forEach(button => button.addEventListener('click', () => {
      const row = app.feed.find(item => item.id === button.dataset.feedId);
      if (row?.stateCode) drillState(row.stateCode, row.geoId || null, true);
    }));
  }

  function drawPath() {
    const data = app.data.national;
    const rows = [
      { name: 'Lula', current: data.currentL, projected: data.projectedL, color: '#f04444' },
      { name: 'Flávio', current: data.currentF, projected: data.projectedF, color: '#4b8df8' }
    ];
    const width = 360;
    const height = 132;
    const margin = { top: 23, right: 9, bottom: 14, left: 62 };
    const inner = width - margin.left - margin.right;
    const scale = d3.scaleLinear().domain([0, Math.max(data.expectedValid, data.projectedL, data.projectedF, 1)]).range([0, inner]);
    const svg = d3.select('#path-chart').attr('viewBox', `0 0 ${width} ${height}`);
    svg.selectAll('*').remove();
    const group = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    rows.forEach((row, index) => {
      const y = index * 48;
      group.append('text').attr('class', 'chart-label').attr('x', -8).attr('y', y + 14).attr('text-anchor', 'end').text(row.name);
      group.append('rect').attr('class', 'chart-track').attr('x', 0).attr('y', y).attr('width', inner).attr('height', 17).attr('rx', 4);
      group.append('rect').attr('x', 0).attr('y', y).attr('width', scale(row.projected)).attr('height', 17).attr('rx', 4).attr('fill', row.color).attr('opacity', .34);
      group.append('rect').attr('x', 0).attr('y', y).attr('width', scale(row.current)).attr('height', 17).attr('rx', 4).attr('fill', row.color);
      group.append('text').attr('class', 'chart-muted').attr('x', 0).attr('y', y + 32).text(`${t('current')} ${formatCompact(row.current)} · ${t('projected')} ${formatCompact(row.projected)}`);
    });
    group.append('line').attr('class', 'majority-line').attr('x1', scale(data.majority)).attr('x2', scale(data.majority)).attr('y1', -7).attr('y2', 73);
    group.append('text').attr('class', 'chart-muted').attr('x', scale(data.majority)).attr('y', -10).attr('text-anchor', 'middle').text(t('majority'));
    const remaining = Math.max(0, data.expectedValid - data.currentValid);
    const lulaNeed = Math.max(0, data.majority - data.currentL);
    const flavioNeed = Math.max(0, data.majority - data.currentF);
    if (lulaNeed === 0 || flavioNeed === 0) {
      $('#needs-copy').textContent = t('majorityReached', { name: lulaNeed === 0 ? 'Lula' : 'Flávio' });
    } else {
      $('#needs-copy').innerHTML = `${esc(t('needsVotes', { lula: formatCompact(lulaNeed), flavio: formatCompact(flavioNeed) }))}<br>${esc(t('needsShare', { lulaPct: formatPct(remaining ? lulaNeed / remaining * 100 : 0), flavioPct: formatPct(remaining ? flavioNeed / remaining * 100 : 0) }))}`;
    }
  }

  function drawContextBars(rows) {
    const width = 360;
    const barHeight = 25;
    const height = Math.max(45, rows.length * barHeight + 9);
    const labelWidth = 85;
    const barWidth = width - labelWidth - 12;
    const max = d3.max(rows, row => row.remaining) || 1;
    const svg = d3.select('#region-chart').attr('viewBox', `0 0 ${width} ${height}`);
    svg.selectAll('*').remove();
    rows.forEach((row, index) => {
      const y = index * barHeight;
      const totalWidth = row.remaining / max * barWidth;
      const lulaWidth = row.remaining ? totalWidth * row.remainingL / row.remaining : 0;
      svg.append('text').attr('class', 'chart-muted').attr('x', labelWidth - 7).attr('y', y + 14).attr('text-anchor', 'end').text(row.displayName);
      svg.append('rect').attr('class', 'chart-track').attr('x', labelWidth).attr('y', y + 3).attr('width', barWidth).attr('height', 12).attr('rx', 3);
      svg.append('rect').attr('x', labelWidth).attr('y', y + 3).attr('width', lulaWidth).attr('height', 12).attr('rx', 3).attr('fill', '#f04444').attr('opacity', .72);
      svg.append('rect').attr('x', labelWidth + lulaWidth).attr('y', y + 3).attr('width', Math.max(0, totalWidth - lulaWidth)).attr('height', 12).attr('rx', 3).attr('fill', '#4b8df8').attr('opacity', .72);
      svg.append('text').attr('class', 'chart-muted').attr('x', Math.min(width - 2, labelWidth + totalWidth + 5)).attr('y', y + 14).text(formatCompact(row.remaining));
    });
  }

  function renderContext() {
    const country = app.level === 'country';
    const state = stateByCode(app.selectedState);
    $('#context-title').textContent = t(country ? 'whatNext' : 'stateNext');
    $('#context-kicker').textContent = country ? t('regionKicker') : t('stateNextKicker', { state: state?.name || '' });
    if (country) {
      const regionRows = app.data.regions.filter(row => row.name !== 'Overseas').slice(0, 5).map(row => ({ ...row, displayName: regionName(row.name) }));
      drawContextBars(regionRows);
      const max = d3.max(app.data.topRemaining, row => row.remaining) || 1;
      $('#next-list').innerHTML = app.data.topRemaining.slice(0, 7).map(row => `<button class="next-row" type="button" data-state="${row.code}"><span class="next-name">${esc(row.name)}</span><strong>${formatCompact(row.remaining)}</strong><span class="mini-track"><span class="mini-fill" style="display:block;width:${row.remaining / max * 100}%;background:${row.projectedLeader === 'Lula' ? 'var(--lula)' : 'var(--flavio)'}"></span></span></button>`).join('');
      $('#next-list').querySelectorAll('[data-state]').forEach(button => button.addEventListener('click', () => drillState(button.dataset.state)));
    } else {
      const sorted = [...app.municipalities].sort((a, b) => b.remaining - a.remaining);
      const top = sorted.slice(0, 6).map(row => ({ ...row, displayName: row.name.length > 12 ? `${row.name.slice(0, 11)}…` : row.name }));
      drawContextBars(top);
      if (!sorted.length) {
        $('#next-list').innerHTML = `<div class="muted">${esc(t('noMunicipalData'))}</div>`;
        return;
      }
      const max = sorted[0]?.remaining || 1;
      $('#next-list').innerHTML = sorted.slice(0, 8).map(row => `<button class="next-row" type="button" data-muni="${esc(row.geoId)}"><span class="next-name">${esc(row.name)}</span><strong>${formatCompact(row.remaining)}</strong><span class="mini-track"><span class="mini-fill" style="display:block;width:${row.remaining / max * 100}%;background:${row.projectedLeader === 'Lula' ? 'var(--lula)' : 'var(--flavio)'}"></span></span></button>`).join('');
      $('#next-list').querySelectorAll('[data-muni]').forEach(button => button.addEventListener('click', () => focusMunicipality(button.dataset.muni)));
    }
  }

  function renderDetail() {
    const state = stateByCode(app.selectedState);
    const row = app.selectedMuni ? app.municipalities.find(item => item.geoId === app.selectedMuni) : state || app.data.national;
    const name = app.selectedMuni ? row?.name : state?.name || t('brazil');
    if (!row) {
      $('#place-detail').innerHTML = `<div class="muted">${esc(t('detailPrompt'))}</div>`;
      return;
    }
    const winner = currentWinner(row);
    const projected = currentWinner(row, true);
    const currentTotal = Math.max(1, row.currentL + row.currentF);
    const projectedTotal = Math.max(1, row.projectedL + row.projectedF);
    const polls = row.totalPolls ? `${formatNumber(row.reported)} / ${formatNumber(row.totalPolls)}` : '—';
    $('#place-detail').innerHTML = `
      <div class="detail-name"><div class="eyebrow">${app.selectedMuni ? esc(state?.abbr || '') : app.level === 'country' ? '' : esc(state?.abbr || '')}</div><h2>${esc(name)}</h2><div class="muted">${formatPct(row.countedPct)}% ${esc(t('counted').toLowerCase())}</div></div>
      <div class="detail-item"><div class="detail-label">${esc(t('validVotes'))}</div><div class="detail-value">${formatNumber(row.currentValid)}</div></div>
      <div class="detail-item"><div class="detail-label">${esc(t('pollingPlaces'))}</div><div class="detail-value">${polls}</div></div>
      <div class="detail-item"><div class="detail-label">${esc(t('currentSplit'))}</div><div class="detail-value ${winner.className}">${esc(winner.name)} ${formatPct(Math.max(row.currentL, row.currentF) / currentTotal * 100)}%</div></div>
      <div class="detail-item"><div class="detail-label">${esc(t('projectedSplit'))}</div><div class="detail-value ${projected.className}">${esc(projected.name)} ${formatPct(Math.max(row.projectedL, row.projectedF) / projectedTotal * 100)}%</div></div>`;
  }

  function renderAll() {
    if (!app.data) return;
    renderHeader();
    renderStatus();
    renderNavigation();
    renderFeed();
    drawPath();
    renderContext();
    renderDetail();
    updateMapFills();
  }

  function showError(message) {
    const box = $('#error-box');
    box.textContent = message;
    box.classList.add('visible');
  }

  function clearError() {
    $('#error-box').classList.remove('visible');
  }

  async function pollLive() {
    if (app.data?.meta.final) return;
    app.nextPollAt = Date.now() + POLL_MS;
    try {
      const latestPromise = getJson(`${LIVE_BASE}/latest.json`);
      const detailPromise = app.selectedState ? getJson(`${LIVE_BASE}/detail.json`) : null;
      const [latest, detail] = await Promise.all([latestPromise, detailPromise]);
      captureLiveChanges(app.lastLive, latest);
      app.lastLive = latest;
      overlayLive(latest);
      if (detail && app.selectedState) {
        await ensurePlaces();
        const previousDetail = app.lastDetail;
        app.detail = detail;
        app.municipalities = buildMunicipalities(app.selectedState, detail);
        bindMunicipalityResultsToShapes();
        captureMunicipalityChanges(previousDetail, detail, app.selectedState);
        app.lastDetail = detail;
      }
      app.liveOk = true;
      clearError();
      populateStateSelect();
      renderAll();
    } catch (error) {
      app.liveOk = false;
      showError(t('failedLive'));
      renderStatus();
      console.error(error);
    } finally {
      app.nextPollAt = Date.now() + POLL_MS;
    }
  }

  function bindEvents() {
    $$('[data-language]').forEach(button => button.addEventListener('click', () => {
      app.locale = button.dataset.language;
      localStorage.setItem('bel26-language', app.locale);
      applyTranslations();
    }));
    $$('[data-view]').forEach(button => button.addEventListener('click', () => {
      app.view = button.dataset.view;
      $$('[data-view]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      updateMapFills();
    }));
    $('#state-select').addEventListener('change', event => event.target.value ? drillState(event.target.value) : resetCountry());
    $('#back-country').addEventListener('click', resetCountry);
    $('#country-crumb').addEventListener('click', resetCountry);
    $('#state-crumb').addEventListener('click', () => {
      const feature = app.geo.features.find(row => row.properties.sigla.toLowerCase() === app.selectedState);
      app.selectedMuni = null;
      if (feature) zoomToFeature(feature);
      renderAll();
    });
  }

  async function init() {
    bindEvents();
    applyTranslations();
    try {
      const [data, geo] = await Promise.all([fetch('./data/results.json', { cache: 'no-store' }).then(response => response.json()), fetch('./data/brazil-states.json').then(response => response.json())]);
      app.data = data;
      app.geo = geo;
      setupMap();
      populateStateSelect();
      renderAll();
      await pollLive();
      setInterval(pollLive, POLL_MS);
      setInterval(() => {
        renderStatus();
        if (Date.now() % 5_000 < 1_100) renderFeed();
      }, 1000);
    } catch (error) {
      showError(error.message || String(error));
      console.error(error);
    }
  }

  init();
})();
