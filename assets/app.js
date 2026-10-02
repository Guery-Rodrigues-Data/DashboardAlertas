/* ==========================================================================
   Dashboard de Alertas — renderização das três visões (Dispositivo, Alarme, Região),
   roteamento por hash (#/dispositivo, #/alarme, #/regiao) e as poucas interações do protótipo:
   abas, painel Filtros, paginação das listas e a troca Sub área/Corredor da matriz.
   Os renderizadores são funções puras que devolvem HTML (para dar para testar no Node).
   ========================================================================== */

const img = (tag, arquivo, w, h, extra = "") => `<img src="assets/img/${tag}-${arquivo}" alt="" ${w ? `width="${w}"` : ""} ${h ? `height="${h}"` : ""} ${extra}>`;

const ROTAS = [
  { id: "dispositivo", rotulo: "Dispositivo" },
  { id: "alarme", rotulo: "Alarme" },
  { id: "regiao", rotulo: "Região" },
];

/* Estado de tela: página de cada lista paginada e aba da matriz da Região. */
const estado = {
  pag: { subareas: 0, corredores: 0, topDisp: 0, tipos: 0, fabricantes: 0, modelos: 0, matriz: 0 },
  selecao: MODELO.selecaoVazia(), // cliques na tela (aba Dispositivo): tipo, fabricante, modelo, faixa, dispositivo, alarme
  modoVolume: "criticidade", // gráfico de volume: "criticidade" (4 linhas) ou "total" (1 linha)
  totalPag: {}, // nº de páginas das listas dinâmicas (preenchido ao desenhar a tela)
  matrizRegiao: "subarea",
};

/* ---------- blocos reutilizáveis ---------- */

// Seta de tendência: arquivos por tela (a arte é a mesma, o Figma exporta com hash diferente por bloco).
function trend(tom, txt, setas, opcoes = {}) {
  const arq = tom === "ok" ? setas.ok : setas.bad;
  const cls = ["trend", tom, opcoes.px4 ? "px4" : "", ].join(" ").trim();
  return `<div class="${cls}"><div class="trend-ico">${img(arq[0], arq[1], 10, 10)}</div><span class="trend-txt ${opcoes.lh1 ? "lh1" : ""}">${txt}</span></div>`;
}

function iconeBox(tag, arquivo, pad46 = false) {
  return `<div class="kpi-icon-box ${pad46 ? "pad46" : ""}">${img(tag, arquivo, 20, 20)}</div>`;
}
function iconeCheio(tag, arquivo) {
  return `<div class="kpi-icon-full">${img(tag, arquivo, 28, 28)}</div>`;
}
// Ícone com folga negativa (Group exportado maior que o quadro): w/h do quadro + inset do Figma.
function iconeInset(tag, arquivo, w, h, inset, pad46 = false) {
  return `<div class="kpi-icon-box ${pad46 ? "pad46" : ""}"><div class="kpi-icon-inset" style="width:${w}px;height:${h}px"><div style="inset:${inset}">${img(tag, arquivo)}</div></div></div>`;
}

function kpiCard({ titulo, tituloLh, icone, numeros, sub, subClasse }) {
  return `
    <div class="card kpi">
      <div class="kpi-info">
        <div class="kpi-head">
          <span class="kpi-title ${tituloLh || "lh125"}">${titulo}</span>
          ${icone}
        </div>
        ${numeros}
      </div>
      <span class="kpi-sub ${subClasse || "w600"}">${sub}</span>
    </div>`;
}

const kpiNumeros = (valor, trendHtml, classe = "") => `
  <div class="kpi-numbers"><span class="kpi-big ${classe}">${valor}</span>${trendHtml}</div>`;

function cabecalho({ icone, titulo, sub, classeTitulo = "", semSub = false }) {
  return `
    <div class="head">
      <div class="head-title">${icone}<span class="t ${classeTitulo}">${titulo}</span></div>
      ${semSub ? "" : `<div class="head-sub">${sub || "Súbtítulo de explicação"}</div>`}
    </div>`;
}

const iconeTrendingUp = (tag) => `<div class="ico20"><div class="in16"><div>${img(tag, "a6d1d.svg")}</div></div></div>`;
const icone20 = (tag, arquivo) => `<div class="ico20">${img(tag, arquivo, 20, 20)}</div>`;

function barra(cls, w) {
  return `<div class="bar-track"><div class="bar-fill ${cls}" style="width:${w}%"></div></div>`;
}

function paginacao(chave, atual, total, w600 = false) {
  return `
    <div class="pagination">
      <span class="pg ${w600 ? "w600" : ""}">Pág ${atual + 1} / ${total}</span>
      <div class="pg-btns">
        <button type="button" class="pg-btn" data-pag="${chave}" data-dir="-1" aria-label="Página anterior" ${atual === 0 ? "disabled" : ""}>${img("reg", "6428f.svg", 14, 14)}</button>
        <button type="button" class="pg-btn" data-pag="${chave}" data-dir="1" aria-label="Próxima página" ${atual === total - 1 ? "disabled" : ""}>${img("reg", "e0d07.svg", 14, 14)}</button>
      </div>
    </div>`;
}

/* Linhas de barra em três formatos que o Figma usa. */
function linhaFalhas({ n, extra, f, w, c, vermelho }, { w64 = true, gap = 8 } = {}) {
  return `
    <div class="brow">
      <div class="brow-top">
        <div class="brow-name" style="gap:${gap}px"><span>${n}</span>${extra ? `<span class="tag">${extra}</span>` : ""}</div>
        <span class="brow-val ${w64 ? "w64" : ""}"><span class="n">${f} </span><span class="u">falhas</span></span>
      </div>
      ${barra(c, w)}
    </div>`;
}
function linhaRegiao({ n, ativos, f, w, c }) {
  return `
    <div class="brow">
      <div class="brow-top">
        <div class="brow-name lh125"><span class="nm">${n}</span><span class="tag b12">• ${ativos} Ativos</span></div>
        <span class="brow-val"><span class="n">${f} </span><span class="u">falhas</span></span>
      </div>
      ${barra(c, w)}
    </div>`;
}
// Seleção por clique: atributos e destaque (a opção escolhida fica em destaque, as outras esmaecem)
const attrSel = (sel) => (sel ? ` data-sel="${sel.campo}" data-val="${sel.val}"` : "");
function classeSel(sel) {
  if (!sel) return "";
  const atual = estado.selecao[sel.campo] || [];
  return atual.length ? (atual.includes(sel.val) ? " sel-on" : " sel-off") : "";
}

function linhaDispositivo({ n, tipo, f, w, c, gap10, sel }) {
  return `
    <div class="brow escuro${classeSel(sel)}"${attrSel(sel)}>
      <div class="brow-top">
        <div class="brow-name" style="gap:${gap10 ? 10 : 8}px"><span>${n}</span><span class="tag"><span style="font-weight:400">• </span>${tipo}</span></div>
        <span class="brow-val w64"><span class="n">${f} </span><span class="u">falhas</span></span>
      </div>
      ${barra(c, w)}
    </div>`;
}
function linhaPercentual({ n, t, w, c, gap10, sel }, { w64 = false } = {}) {
  return `
    <div class="brow${classeSel(sel)}"${attrSel(sel)}>
      <div class="brow-top">
        <div class="brow-name lh125" style="gap:${gap10 ? 10 : 8}px"><span class="nm">${n}</span></div>
        <span class="brow-val brow-pct ${w64 ? "w64" : ""}">${t}</span>
      </div>
      ${barra(c, w)}
    </div>`;
}
function linhaModelo({ n, fab, f, w, c, sel }) {
  return `
    <div class="brow${classeSel(sel)}"${attrSel(sel)}>
      <div class="brow-top">
        <div class="brow-name lh125"><span class="nm">${n}</span><span class="tag b12">• ${fab}</span></div>
        <span class="brow-val"><span class="n">${f} </span><span class="u">falhas</span></span>
      </div>
      ${barra(c, w)}
    </div>`;
}
function linhaDuracao({ n, v, u, w, c }) {
  return `
    <div class="brow">
      <div class="brow-top">
        <div class="brow-name"><span>${n}</span></div>
        <span class="brow-val w64"><span class="n">${v} </span><span class="u">${u}</span></span>
      </div>
      ${barra(c, w)}
    </div>`;
}

/* ---------- gráfico de linhas (Volume de Alarmes / Volume de Erros) ----------
   SVG próprio (os SVGs do Figma, esticados, deformavam linhas e bolinhas em tela larga).
   Recebe uma "spec": { eixoMax, rotulos[], rotulosTip[], valores: { Crítico: [...], Alta, Média, Baixa }, casas }.
   - Aba Dispositivo: a spec vem do modelo e muda com o período/filtros.
   - Aba Alarme: spec estática com a curva do Figma reamostrada (MOCK).
   Escala Y: 0..eixoMax, linha do topo a 11px do alto e linha do 0 na base (como o eixo do Figma). */

const SERIES_VOLUME = [
  { n: "Crítico", cor: "#b3261e" },
  { n: "Alta", cor: "#e94600" },
  { n: "Média", cor: "#e39610" },
  { n: "Baixa", cor: "#0f66b3" },
];
const GRAFICOS = []; // specs da tela atual; o índice vai em data-chart
const fmtValor = (spec, v) => (spec.casas ? v.toFixed(spec.casas).replace(".", ",") : String(Math.round(v)));
const topoDoValor = (spec, v) => `calc(11px + ${((spec.eixoMax - v) / spec.eixoMax).toFixed(4)} * (100% - 11px))`;
const idxPadrao = (spec) => Math.round(0.75 * (spec.rotulos.length - 1)); // Figma destaca 25/07 (~75% do eixo)

function especVolumeEstatica() {
  const k = { "Crítico": "crit", "Alta": "alta", "Média": "media", "Baixa": "baixa" };
  return { eixoMax: 10, casas: 1, rotulos: DASH.eixoX, rotulosTip: DASH.eixoX, valores: Object.fromEntries(SERIES_VOLUME.map((s) => [s.n, DASH.volume[k[s.n]]])) };
}

// Mostra no máximo ~17 rótulos no eixo X (os demais ficam vazios), alinhados ao centro de cada ponto.
function rotulosVisiveis(rotulos) {
  const cheios = rotulos.map((r, i) => (r ? i : -1)).filter((i) => i >= 0);
  const passo = Math.max(1, Math.ceil(cheios.length / 16));
  return cheios.filter((_, n) => n % passo === 0);
}

function graficoLinhas(spec) {
  const idx = GRAFICOS.push(spec) - 1;
  const N = spec.rotulos.length;
  const series = spec.series || SERIES_VOLUME;
  const passoY = spec.eixoMax / 5;
  const yAxis = [0, 1, 2, 3, 4, 5].map((i) => `
      <div class="y-item"><span class="y-label">${Math.round(spec.eixoMax - i * passoY)}</span><div class="y-line"></div></div>`).join("");
  const caminhos = series.map((s) => {
    const d = spec.valores[s.n].map((v, i) => `${i ? "L" : "M"}${((i / (N - 1)) * 1000).toFixed(1)} ${(((spec.eixoMax - v) / spec.eixoMax) * 1000).toFixed(1)}`).join(" ");
    return `<path d="${d}" stroke="${s.cor}"/>`;
  }).join("");
  const x = rotulosVisiveis(spec.rotulos).map((i) => `<div class="x-lbl" style="left:${((i / (N - 1)) * 100).toFixed(3)}%"><span>${spec.rotulos[i]}</span></div>`).join("");
  return `
    <div class="chart-canvas" data-chart="${idx}">
      <div class="y-axis">${yAxis}</div>
      <div class="chart-plot" data-plot>
        <div class="chart-area" data-area>
          <svg class="chart-svg" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">${caminhos}</svg>
          <div class="chart-cursor" data-cursor></div>
          ${series.map((s) => `<span class="chart-dot" data-dot="${s.n}" style="background:${s.cor}"></span>`).join("")}
          <div class="chart-tip" data-tip hidden></div>
        </div>
      </div>
      <div class="x-axis"><div class="x-area">${x}</div></div>
    </div>`;
}

// Hover da aba Dispositivo: quais dispositivos falharam naquele ponto (até 6; o resto vira "+ N").
const MAX_DISP_TIP = 6;
function htmlListaTip(lista) {
  if (!lista.length) return `<div class="tip-sep"></div><div class="tip-vazio">Nenhum dispositivo com falha</div>`;
  const linhas = lista.slice(0, MAX_DISP_TIP).map((d) =>
    `<div class="tip-row tip-dev"><span class="tip-id">${d.n}</span><span class="tip-tipo">${d.tipo}</span><b>${d.f}</b></div>`).join("");
  const mais = lista.length - MAX_DISP_TIP;
  return `<div class="tip-sep"></div><div class="tip-titulo">${lista.length} ${lista.length === 1 ? "dispositivo" : "dispositivos"}</div>${linhas}${mais > 0 ? `<div class="tip-mais">+ ${mais} ${mais === 1 ? "dispositivo" : "dispositivos"}</div>` : ""}`;
}

// Caixa flutuante (position: fixed, não é cortada pela matriz) com a lista de alarmes dentro de "Outros alarmes".
function mostrarOutros(alvo) {
  let box = document.getElementById("tipFlutuante");
  if (!box) { box = document.createElement("div"); box.id = "tipFlutuante"; box.className = "chart-tip flutuante"; document.body.appendChild(box); }
  const { titulo, itens } = JSON.parse(alvo.dataset.outros);
  box.innerHTML = `<strong>${titulo}</strong><div class="tip-sep"></div>${itens.map((i) => `<div class="tip-row"><span>${i.n}</span><b>${i.v}</b></div>`).join("") || '<div class="tip-vazio">Nenhum</div>'}`;
  box.hidden = false;
  box.style.left = "0px"; box.style.top = "0px";
  const r = alvo.getBoundingClientRect(), w = box.offsetWidth, h = box.offsetHeight;
  box.style.left = `${Math.min(Math.max(8, r.left + r.width / 2 - w / 2), innerWidth - w - 8)}px`;
  box.style.top = `${r.top - h - 8 >= 8 ? r.top - h - 8 : r.bottom + 8}px`;
}
function esconderOutros() { const box = document.getElementById("tipFlutuante"); if (box) box.hidden = true; }

// Move linha vertical, pontos e (opcional) a caixa de valores para o ponto `i`.
function posicionarGrafico(canvas, i, comTip) {
  const spec = GRAFICOS[Number(canvas.dataset.chart)];
  const N = spec.rotulos.length;
  const x = `${((i / (N - 1)) * 100).toFixed(3)}%`;
  const series = spec.series || SERIES_VOLUME;
  canvas.querySelector("[data-cursor]").style.left = x;
  series.forEach((s) => {
    const dot = canvas.querySelector(`[data-dot="${s.n}"]`);
    dot.style.left = x;
    dot.style.top = topoDoValor(spec, spec.valores[s.n][i]);
  });
  const tip = canvas.querySelector("[data-tip]");
  tip.hidden = !comTip;
  if (!comTip) return;
  const linha = (s, v, extra = "") => `<div class="tip-row${extra}"><span class="tip-dot" style="background:${s.cor}"></span><span>${s.n}</span><b>${fmtValor(spec, v)}</b></div>`;
  // no modo Total, a caixa mostra o total e, abaixo, a composição por criticidade
  const detalhe = spec.detalhe ? `<div class="tip-sep"></div>${SERIES_VOLUME.map((s) => linha(s, spec.detalhe[s.n][i], " tip-sub")).join("")}` : "";
  tip.innerHTML = `<strong>${spec.rotulosTip[i]}</strong>${series.map((s) => linha(s, spec.valores[s.n][i])).join("")}${detalhe}${spec.listaTip ? htmlListaTip(spec.listaTip[i]) : ""}`;
  tip.classList.toggle("largo", !!spec.listaTip);
  tip.style.left = x;
  tip.classList.toggle("to-left", i > (N - 1) / 2);
}

function iniciarGraficos() {
  document.querySelectorAll("[data-chart]").forEach((c) => posicionarGrafico(c, idxPadrao(GRAFICOS[Number(c.dataset.chart)]), false));
}

function indiceDoPonteiro(canvas, clientX) {
  const N = GRAFICOS[Number(canvas.dataset.chart)].rotulos.length;
  const r = canvas.querySelector("[data-area]").getBoundingClientRect();
  const f = Math.min(Math.max((clientX - r.left) / r.width, 0), 1);
  return Math.round(f * (N - 1));
}

/* ---------- alternância Por criticidade / Total ----------
   O total é a soma das 4 linhas e tem escala própria: por isso é uma alternância, e não uma 5ª linha
   (ela esticaria o eixo e achataria as outras quatro). */
const COR_TOTAL = "#404041";

function especTotal(spec) {
  const soma = spec.rotulos.map((_, i) => SERIES_VOLUME.reduce((a, s) => a + spec.valores[s.n][i], 0));
  return { ...spec, series: [{ n: "Total", cor: COR_TOTAL }], valores: { Total: soma }, detalhe: spec.valores, eixoMax: MODELO.maximoDoEixo(Math.max(0, ...soma)) };
}
const aplicarModoVolume = (spec) => (estado.modoVolume === "total" ? especTotal(spec) : spec);

const chaveLegenda = (cor, n) => `<div class="chart-key"><span class="dot8" style="background:${cor}"></span><span>${n}</span></div>`;

// alternância pequena, no canto do cabeçalho do cartão
function toggleVolume() {
  const total = estado.modoVolume === "total";
  return `
    <div class="mx-seg small" role="tablist" aria-label="Mostrar o volume por">
      <button type="button" role="tab" data-vol="criticidade" class="${total ? "" : "is-on"}">Por criticidade</button>
      <button type="button" role="tab" data-vol="total" class="${total ? "is-on" : ""}">Total</button>
    </div>`;
}

// legenda embaixo do gráfico
function legendaVolume() {
  const total = estado.modoVolume === "total";
  return `<div class="chart-legend">${total ? chaveLegenda(COR_TOTAL, "Total") : SERIES_VOLUME.map((s) => chaveLegenda(s.cor, s.n)).join("")}</div>`;
}

/* ---------- matriz de correlação ---------- */

// Colunas de alarme ordenadas pelos valores das linhas da página, de cima para baixo: a 1ª coluna é o alarme que
// mais deu no dispositivo da 1ª linha (o que mais falha); empate → desempata pela 2ª linha, e assim por diante;
// persistindo o empate, vale a ordem global do período. Assim a 1ª linha fica em ordem decrescente da esquerda
// para a direita. Coluna sem nenhuma falha nos dispositivos da página (só "–") NÃO é mostrada, nem "Outros
// alarmes" quando vazio; "Total" fica sempre, no fim.
function ordenarColunasDaPagina(colunas, linhas) {
  const fixas = (c) => c.t === "Outros alarmes" || c.t === "Total";
  const nCore = colunas.filter((c) => !fixas(c)).length;
  const compara = (a, b) => {
    for (const l of linhas) { const d = l[1][b][0] - l[1][a][0]; if (d) return d; }
    return a - b;
  };
  const soma = (j) => linhas.reduce((a, l) => a + l[1][j][0], 0);
  const ordem = [...Array(nCore).keys()].filter((j) => soma(j) > 0).sort(compara);
  const extras = colunas.map((_, j) => j).slice(nCore).filter((j) => colunas[j].t === "Total" || soma(j) > 0);
  const reordena = (arr) => [...ordem.map((j) => arr[j]), ...extras.map((j) => arr[j])];
  return { colunas: reordena(colunas), linhas: linhas.map(([nome, cels]) => [nome, reordena(cels)]) };
}

// Conteúdo da caixa flutuante ("Outros alarmes") vai num atributo data-outros (JSON escapado).
const attrOutros = (extra) => ` data-outros="${JSON.stringify(extra).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;")}"`;

function matriz(titulo, descricao, colunas, linhas, { seletor = "", rodape = "", selLinhas = null } = {}) {
  const cab = colunas.map((c) => `<div class="mx-col ${c.py8 ? "py8" : ""} ${c.b11 ? "b11" : ""}${c.outros ? " tem-outros" : ""}${classeSel(c.sel)}"${c.outros ? attrOutros(c.outros) : ""}${attrSel(c.sel)}><span>${c.t}</span></div>`).join("");
  const corpo = linhas.map(([nome, celulas]) => `
      <div class="mx-line body${selLinhas ? classeSel({ campo: selLinhas, val: nome }).replace("sel-on", "sel-on-linha") : ""}">
        <div class="mx-cell row-name"${selLinhas ? attrSel({ campo: selLinhas, val: nome }) : ""}>${nome}</div>
        ${celulas.map(([v, tom, extra]) => `<div class="mx-cell ${tom}${v === 0 ? " zero" : ""}${extra && v > 0 ? " tem-outros" : ""}"${extra && v > 0 ? attrOutros(extra) : ""}>${v === 0 ? "–" : v}</div>`).join("")}
      </div>`).join("");
  return `
    <section class="card">
      <div class="mx-head-row">
        <div class="mx-head-text">
          <div class="head-title">${icone20("reg", "3af6c.svg")}<span class="t">${titulo}</span></div>
          <span class="head-sub">${descricao}</span>
        </div>
        ${seletor}
      </div>
      <div class="matrix">
        <div class="mx-line mx-head"><div class="mx-col blank" style="height:auto"><span>&nbsp;</span></div>${cab}</div>
        ${corpo}
      </div>
      ${rodape}
    </section>`;
}

/* ---------- telas ---------- */

function telaRegiao() {
  const d = DASH.regiao;
  const setas = { ok: ["reg", "2937e.svg"], bad: ["reg", "7e314.svg"] };
  const icones = [
    iconeBox("reg", "f5917.svg"),
    iconeCheio("reg", "6158d.svg"),
    iconeCheio("reg", "694cb.svg"),
  ];
  const kpis = d.kpis.map((k, i) => kpiCard({
    titulo: k.titulo,
    icone: icones[i],
    numeros: kpiNumeros(k.valor, trend(k.trend.tom, k.trend.txt, setas, { px4: k.trend.tom === "ok" || false }), "nolt"),
    sub: k.sub,
  })).join("");

  const sub = d.subareas[estado.pag.subareas];
  const cor = d.corredores[estado.pag.corredores];
  const secao = (icone, titulo, linhas, chave, atual, total) => `
    <div class="reg-section">
      <div class="head-row" style="justify-content:flex-start;gap:4px">${icone}<span class="kpi-title lh125" style="font-size:14px">${titulo}</span></div>
      <div class="rows">${linhas.map(linhaRegiao).join("")}</div>
      ${paginacao(chave, atual, total)}
    </div>`;

  const seletor = `
    <div class="mx-seg" role="tablist" aria-label="Agrupar matriz por">
      <button type="button" role="tab" data-mx="subarea" class="${estado.matrizRegiao === "subarea" ? "is-on" : ""}">Sub área</button>
      <button type="button" role="tab" data-mx="corredor" class="${estado.matrizRegiao === "corredor" ? "is-on" : ""}">Corredor</button>
    </div>`;
  const linhas = estado.matrizRegiao === "subarea" ? d.matrizSubarea : d.matrizCorredor;

  return `
    <div class="row">${kpis}</div>
    <div class="row">
      <section class="reg-card">
        <div class="head">
          <h2 class="reg-title">Regiões</h2>
          <p class="reg-desc">Sub-áreas e corredores com maior concentração de falhas no período.</p>
        </div>
        <div class="reg-sections">
          ${secao(icone20("reg", "155e2.svg"), "Top Sub Áreas Ofensoras", sub, "subareas", estado.pag.subareas, d.subareas.length)}
          ${secao(icone20("reg", "02fb0.svg"), "Top Corredores", cor, "corredores", estado.pag.corredores, d.corredores.length)}
        </div>
      </section>
      <section class="map-card">
        <img class="map-img" src="assets/img/reg-5b7d7.png" alt="" style="aspect-ratio:1055/712;left:-3.44cqw;width:152.4cqw;top:-4.53cqw">
        <img class="map-img" src="assets/img/reg-cd48d.png" alt="Mapa de calor de alarmes" style="aspect-ratio:1327/895;left:-8.19cqw;width:116.6cqw;top:-3.51cqw">
        <div class="map-title">Mapa de calor</div>
        <div class="legend-modal">
          <div class="lh"><span>Legenda</span>${img("reg", "3f3af.svg", 16, 16)}</div>
          <div class="lb">
            <div class="legend-grad"></div>
            <div class="legend-labels">
              ${[["90763.svg", "Muitos Alarmes"], ["2b745.svg", "Alarmes moderado"], ["e18a6.svg", "Poucos Alarmes"], ["b215c.svg", "Sem Alarmes"]]
                .map(([a, t]) => `<div class="legend-lvl">${img("reg", a, 8, 8)}<span>${t}</span></div>`).join("")}
            </div>
          </div>
        </div>
      </section>
    </div>
    ${matriz("Matriz de Correlação: Região vs. Alarme", "Analise a incidência de alarmes por região para identificação de padrões", d.colunas, linhas, { seletor })}`;
}

function telaAlarme() {
  const d = DASH.alarme;
  const setas = { ok: ["alkpi", "13b09.svg"], bad: ["alkpi", "7e314.svg"] };
  const kpis = [
    kpiCard({ titulo: "Total de Alarmes", tituloLh: "lh1", icone: iconeBox("alkpi", "f5917.svg"), numeros: kpiNumeros("106", trend("ok", "14,3%", setas, { px4: true, lh1: true })), sub: "7 tipos de alarme distintos", subClasse: "w500" }),
    kpiCard({ titulo: "Média Diária", tituloLh: "lh1", icone: iconeCheio("alkpi", "811c0.svg"), numeros: kpiNumeros("4,6", trend("bad", "6,3%", setas, { px4: true })), sub: "Frequência diária de alarmes", subClasse: "w500" }),
    kpiCard({
      titulo: "Alarmes de Maior Ocorrência", tituloLh: "lh1", icone: iconeInset("alkpi", "f348a.svg", 16.097, 16.003, "-4.06% -4.69% -4.66% -4.66%"),
      numeros: `<div class="kpi-body h23"><span class="kpi-body-text">Falha na comunicação</span></div>`, sub: "Responsável por 23% do total", subClasse: "w500",
    }),
    kpiCard({
      titulo: "Tempo Médio de Alarme Ativo", tituloLh: "lh1", icone: iconeInset("alkpi", "c80a1.svg", 16.004, 16.097, "-4.06% -4.69% -4.66% -4.66%"),
      numeros: `<div class="kpi-body"><span class="kpi-big black">42 <small>min</small></span>${trend("bad", "5,8%", setas)}</div>`, sub: "18% dos alarmes ficam ativos por mais de 4h", subClasse: "w500",
    }),
  ].join("");

  const pizza = `
    <div class="pie">
      ${img("aldist", "1dd45.svg")}
      <div class="pie-labels">${d.pizzaLabels.map(([t, x, y]) => `<span class="pct" style="left:${x}px;top:${y}px">${t}</span>`).join("")}</div>
    </div>`;
  const legenda = d.criticidade.map((c) => `
    <div class="legend-item">${img("aldist", `${c.dot}.svg`, 6, 6)}<div class="lt"><span style="color:${c.cor}">${c.n}</span><b>${c.v}</b></div></div>`).join("");

  return `
    <div class="row">${kpis}</div>
    <div class="row">
      <section class="card card-20 pie-card" style="flex:0 0 clamp(340px,22%,420px)">
        ${cabecalho({ icone: icone20("aldist", "04c43.svg"), titulo: "Distribuição por Criticidade", sub: DASH.subtitulos.criticidade })}
        <div class="pie-body">${pizza}<div class="legend">${legenda}</div></div>
      </section>
      <section class="card card-20" style="flex:1 1 0;align-items:center">
        <div class="head-row">
          <div class="head">
            <div class="head-title"><div class="ico20" style="padding:4px">${img("aldist", "5f4b6.svg", 16, 16)}</div><span class="t">Volume de Alarmes</span></div>
            <div class="head-sub">${DASH.subtitulos.volumeAlarmes}</div>
          </div>
          ${toggleVolume()}
        </div>
        ${graficoLinhas(aplicarModoVolume(especVolumeEstatica()))}
        ${legendaVolume()}
      </section>
    </div>
    <div class="row">
      <section class="card card-20" style="flex:1 1 0">
        ${cabecalho({ icone: iconeTrendingUp("aldur"), titulo: "Top Alarmes", sub: DASH.subtitulos.topAlarmes })}
        <div class="rows">${d.topAlarmes.slice(0, 5).map((r) => linhaFalhas({ n: r.n, f: r.f, w: r.w, c: r.c })).join("")}</div>
      </section>
      <section class="card" style="flex:1 1 0">
        ${cabecalho({ icone: icone20("aldur", "77437.svg"), titulo: "Duração Média de Alarmes", sub: DASH.subtitulos.duracao })}
        <div class="rows">${d.duracao.slice(0, 5).map(linhaDuracao).join("")}</div>
      </section>
    </div>`;
}

/* ---------- Dispositivo (dinâmica: tudo calculado do modelo para o período e filtros escolhidos) ---------- */

const TAM_PAG = { topDisp: 5, tipos: 5, fabricantes: 5, modelos: 4, matriz: 7 };

const fmtInt = (n) => Math.round(n).toLocaleString("pt-BR");
const fmtDec = (n) => n.toFixed(1).replace(".", ",");
const corPorValor = (v, max) => { const r = max ? v / max : 0; return r >= 0.66 ? "b-error" : r >= 0.33 ? "b-orange" : r >= 0.15 ? "b-warning" : "b-info"; };
const larguraBarra = (v, max) => (max ? Math.max(4, (v / max) * 88) : 0); // 88% no maior: sobra folga como no Figma

// Seta de variação: o sentido é o real (subiu/desceu); a cor diz se é bom ou ruim (mais falhas = ruim).
const SETA_VAR = '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M7.917 5L5 2.083L2.083 5M5 2.083V7.917" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
function variacao(atual, anterior) {
  return anterior == null || anterior === 0 ? null : ((atual - anterior) / anterior) * 100;
}
function trendVar(pct) {
  if (pct == null) return "";
  const sobe = pct >= 0;
  return `<div class="trend ${sobe ? "bad" : "ok"} px4" title="Variação em relação ao período anterior de mesmo tamanho"><div class="trend-ico dyn ${sobe ? "up" : "down"}">${SETA_VAR}</div><span class="trend-txt lh1">${fmtDec(Math.abs(pct))}%</span></div>`;
}

// "5 a 8 anos" -> números em destaque, palavras pequenas e cinza (como no Figma)
function rotuloFaixaKpi(rotulo) {
  return rotulo.split(/(\d+)/).filter((t) => t.trim()).map((t) => (/^\d+$/.test(t) ? t : `<small>${t.trim().replace("<", "&lt;").replace(">", "&gt;")}</small>`)).join(" ");
}

function pagina(lista, chave) {
  const tam = TAM_PAG[chave];
  const total = Math.max(1, Math.ceil(lista.length / tam));
  const atual = Math.min(estado.pag[chave] || 0, total - 1);
  estado.pag[chave] = atual;
  estado.totalPag[chave] = total;
  return { itens: lista.slice(atual * tam, atual * tam + tam), atual, total };
}
const vazio = (txt = "Sem falhas no período selecionado.") => `<div class="lista-vazia">${txt}</div>`;

// Pizza em SVG (sem imagem): fatias a partir do topo, no sentido horário. O % de cada fatia só aparece
// quando o mouse está em cima dela (a legenda ao lado já traz o percentual).
function pizza(fatias) {
  const total = fatias.reduce((a, f) => a + f.v, 0);
  const R = 94.6, C = 94.6;
  if (!total) return `<div class="pie"><svg viewBox="0 0 189.2 189.2" width="189.2" height="189.2"><circle cx="${C}" cy="${C}" r="${R}" fill="#e5e5e5"/></svg><span class="pct pie-vazio">Sem dados</span></div>`;
  let ang = -Math.PI / 2;
  const ponto = (a, r) => [C + r * Math.cos(a), C + r * Math.sin(a)];
  const partes = [], rotulos = [];
  fatias.forEach((f, idx) => {
    if (!f.v) return;
    const fim = ang + (f.v / total) * Math.PI * 2;
    if (f.v === total) partes.push(`<circle class="fatia${classeSel({ campo: "faixas", val: f.id })}" data-sel="faixas" data-val="${f.id}" data-fatia="${idx}" cx="${C}" cy="${C}" r="${R}" fill="${f.cor}"/>`);
    else {
      const [x1, y1] = ponto(ang, R), [x2, y2] = ponto(fim, R);
      partes.push(`<path class="fatia${classeSel({ campo: "faixas", val: f.id })}" data-sel="faixas" data-val="${f.id}" data-fatia="${idx}" d="M${C} ${C} L${x1.toFixed(2)} ${y1.toFixed(2)} A${R} ${R} 0 ${fim - ang > Math.PI ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z" fill="${f.cor}" stroke="#fff" stroke-width="1.5"/>`);
    }
    const pct = Math.round((f.v / total) * 100);
    const [lx, ly] = ponto((ang + fim) / 2, f.v === total ? 0 : R * 0.62);
    rotulos.push(`<span class="pct" data-fatia="${idx}" hidden style="left:${lx.toFixed(1)}px;top:${ly.toFixed(1)}px">${pct}%</span>`);
    ang = fim;
  });
  return `<div class="pie"><svg viewBox="0 0 189.2 189.2" width="189.2" height="189.2">${partes.join("")}</svg>${rotulos.join("")}</div>`;
}

/* ---------- seleção por clique (aba Dispositivo) ----------
   Clicar em um tipo, fabricante, modelo, dispositivo, fatia da pizza ou alarme da matriz filtra o resto da
   tela na hora. Clicar de novo no mesmo item limpa; Ctrl/Cmd+clique seleciona vários. */
const ROTULO_CAMPO_SEL = { tipos: "Tipo", fabricantes: "Fabricante", modelos: "Modelo", faixas: "Idade", dispositivos: "Dispositivo", alarmes: "Alarme" };
const rotuloValSel = (campo, val) => (campo === "faixas" ? (MODELO.FAIXAS.find((f) => f.id === val) || {}).rotulo || val : val);

function htmlChipsSelecao() {
  const chips = Object.entries(estado.selecao).flatMap(([campo, vals]) => vals.map((v) =>
    `<button type="button" class="chip-sel" data-chip="${campo}" data-val="${v}" title="Remover da seleção">${ROTULO_CAMPO_SEL[campo]}: <b>${rotuloValSel(campo, v)}</b><span aria-hidden="true">×</span></button>`));
  if (!chips.length) return `<div class="chips-sel dica">Clique em um tipo, fabricante, modelo, dispositivo, fatia da pizza ou alarme da matriz para filtrar a tela. Ctrl+clique seleciona vários.</div>`;
  return `<div class="chips-sel"><span class="chips-rotulo">Seleção:</span>${chips.join("")}<button type="button" class="pop-link" data-limpar-selecao>Limpar seleção</button></div>`;
}

function mudouSelecao() {
  Object.keys(estado.pag).forEach((k) => { estado.pag[k] = 0; });
  render();
}
function alternarSelecao(campo, val, multi) {
  const atual = estado.selecao[campo];
  estado.selecao[campo] = multi ? (atual.includes(val) ? atual.filter((x) => x !== val) : [...atual, val]) : (atual.length === 1 && atual[0] === val ? [] : [val]);
  mudouSelecao();
}

// Mostra (ou esconde, com idx = null) o % da fatia sob o mouse.
function mostrarFatia(pie, idx) {
  pie.querySelectorAll(".pct[data-fatia]").forEach((el) => { el.hidden = idx == null || el.dataset.fatia !== String(idx); });
}

function telaDispositivo() {
  const p = estado.periodo;
  const hojeRef = hoje();
  const r = MODELO.resumir(p.de, p.ate, estado.filtros, hojeRef, estado.selecao);
  const ant = MODELO.resumirAnterior(p.de, p.ate, estado.filtros, hojeRef, estado.selecao);
  estado.totalPag = {};

  /* --- cartões do topo --- */
  const setas = {};
  const faixaAnt = ant && r.topFaixa ? ant.faixasEv.find((f) => f.id === r.topFaixa.id).v : null;
  const alarmeAnt = ant && r.topAlarme ? (ant.alarmes.find((a) => a.n === r.topAlarme.n) || { v: 0 }).v : null;
  const kpis = [
    kpiCard({ titulo: "Total de falhas ", icone: `<div class="kpi-icon-box pad46">${img("dpkpi", "04c43.svg", 20, 20)}</div>`,
      numeros: `<div class="kpi-body"><span class="kpi-big black">${fmtInt(r.total)}</span>${trendVar(variacao(r.total, ant && ant.total))}</div>`, sub: "Falhas no período" }),
    kpiCard({ titulo: "Dispositivos com Falha", icone: iconeBox("dpkpi", "f5917.svg"),
      numeros: kpiNumeros(fmtInt(r.dispositivos), trendVar(variacao(r.dispositivos, ant && ant.dispositivos))), sub: `${fmtDec((r.dispositivos / r.parque) * 100)}% do parque afetado` }),
    kpiCard({ titulo: "Média Diária", icone: iconeCheio("dpkpi", "811c0.svg"),
      numeros: kpiNumeros(fmtDec(r.mediaDiaria), trendVar(variacao(r.mediaDiaria, ant && ant.mediaDiaria))), sub: "Dispositivos com erro/dia" }),
    kpiCard({ titulo: "Alarmes de Maior Ocorrência", icone: iconeInset("dpkpi", "617ff.svg", 16.004, 16.097, "-4.06% -4.69% -4.66% -4.66%"),
      numeros: `<div class="kpi-body h23" style="gap:8px"><span class="kpi-body-text">${r.topAlarme ? fmtInt(r.topAlarme.v) : "0"}</span>${r.topAlarme ? trendVar(variacao(r.topAlarme.v, alarmeAnt)) : ""}</div>`,
      sub: r.topAlarme ? r.topAlarme.n : "Sem falhas no período" }),
    kpiCard({ titulo: "Faixa de Idade Crítica", icone: iconeInset("dpkpi", "cd44e.svg", 16.063, 16.063, "-4.28% -4.67% -4.67% -4.28%", true),
      numeros: `<div class="kpi-body"><span class="kpi-big black uma-cor">${r.topFaixa ? rotuloFaixaKpi(r.topFaixa.rotulo) : "—"}</span>${r.topFaixa ? trendVar(variacao(r.topFaixa.v, faixaAnt)) : ""}</div>`,
      sub: r.topFaixa ? `${Math.round((r.topFaixa.v / r.total) * 100)}% dos erros no período` : "Sem falhas no período" }),
  ].join("");

  /* --- gráfico: série do período --- */
  // só o Total (a criticidade já está no filtro e na matriz); o hover lista os dispositivos que falharam
  const spec = { eixoMax: r.serie.eixoMaxTotal, casas: 0, rotulos: r.serie.rotulos, rotulosTip: r.serie.rotulosTip,
    series: [{ n: "Falhas", cor: COR_TOTAL }], valores: { "Falhas": r.serie.totais }, listaTip: r.serie.dispositivos };

  /* --- listas paginadas --- */
  const top = pagina(r.topDispositivos, "topDisp");
  const maxTop = r.topDispositivos[0] ? r.topDispositivos[0].f : 0;
  const tipos = pagina(r.tipos, "tipos");
  const fabs = pagina(r.fabricantes, "fabricantes");
  const modelos = pagina(r.modelos, "modelos");
  const totFaixas = r.faixas.reduce((a, f) => a + f.v, 0);
  const pctFaixa = (v) => (totFaixas ? Math.round((v / totFaixas) * 100) : 0);
  const linhasTop = top.itens.map((d) => linhaDispositivo({ ...d, w: larguraBarra(d.f, maxTop), c: corPorValor(d.f, maxTop), sel: { campo: "dispositivos", val: d.n } })).join("");
  const linhasTipos = tipos.itens.map((d) => linhaPercentual({ n: d.n, t: `${d.f} ~ ${d.pct}%`, w: larguraBarra(d.f, r.tipos[0].f), c: corPorValor(d.f, r.tipos[0].f), sel: { campo: "tipos", val: d.n } }, { w64: true })).join("");
  const linhasFabs = fabs.itens.map((d) => linhaPercentual({ n: d.n, t: `${d.pct}%`, w: larguraBarra(d.f, r.fabricantes[0].f), c: corPorValor(d.f, r.fabricantes[0].f), sel: { campo: "fabricantes", val: d.n } })).join("");
  const linhasModelos = modelos.itens.map((d) => linhaModelo({ ...d, w: larguraBarra(d.f, r.modelos[0].f), c: corPorValor(d.f, r.modelos[0].f), sel: { campo: "modelos", val: d.n } })).join("");

  const legenda = r.faixas.map((f) => `
    <div class="legend-item g8${classeSel({ campo: "faixas", val: f.id })}" data-sel="faixas" data-val="${f.id}"><span class="dot10" style="background:${f.cor}"></span><div class="lt2"><span>${f.rotuloLegenda}</span> <b>${f.v} (${pctFaixa(f.v)}%)</b></div></div>`).join("");

  const mx = r.matriz;
  const mxPag = pagina(mx.linhas, "matriz");
  const mxVis = ordenarColunasDaPagina(mx.colunas, mxPag.itens);
  // cabeçalhos de alarme são clicáveis (menos "Outros alarmes" e "Total")
  mxVis.colunas = mxVis.colunas.map((c) => (c.outros || c.t === "Total" ? c : { ...c, sel: { campo: "alarmes", val: c.t } }));
  return `
    ${htmlChipsSelecao()}
    <div class="row">${kpis}</div>
    <section class="card card-20" style="align-items:center">
      <div class="head-row">
        <div class="head">
          <div class="head-title"><div class="ico20" style="padding:4px">${img("dpvol", "5f4b6.svg", 16, 16)}</div><span class="t lh125">Volume de Erros</span></div>
          <div class="head-sub">${DASH.subtitulos.volumeErros}</div>
        </div>
      </div>
      ${graficoLinhas(spec)}
    </section>
    <div class="row">
      <section class="card card-20" style="flex:1 1 0">
        ${cabecalho({ icone: iconeTrendingUp("dptop"), titulo: "Top Dispositivos", classeTitulo: "lh125", sub: DASH.subtitulos.topDispositivos })}
        <div class="rows gap24">${linhasTop || vazio()}</div>
        ${paginacao("topDisp", top.atual, top.total)}
      </section>
      <section class="card card-20 pie-card" style="flex:0 0 clamp(480px,32%,620px)">
        ${cabecalho({ icone: icone20("dptop", "04c43.svg"), titulo: "Distribuição de falhas por faixa de idade", classeTitulo: "t16", sub: DASH.subtitulos.faixaIdade })}
        <div class="pie-body">${pizza(r.faixas)}<div class="legend auto">${legenda}</div></div>
      </section>
    </div>
    <div class="row">
      <section class="card card-20" style="flex:1 1 0">
        ${cabecalho({ icone: iconeTrendingUp("dptipo"), titulo: "Tipo de dispositivo", classeTitulo: "lh125", sub: DASH.subtitulos.tipoDispositivo })}
        <div class="rows">${linhasTipos || vazio()}</div>
        ${paginacao("tipos", tipos.atual, tipos.total)}
      </section>
      <section class="card card-20" style="flex:1 1 0">
        ${cabecalho({ icone: iconeTrendingUp("dptop"), titulo: "Fabricante", classeTitulo: "lh125", sub: DASH.subtitulos.fabricante })}
        <div class="rows">${linhasFabs || vazio()}</div>
        ${paginacao("fabricantes", fabs.atual, fabs.total)}
      </section>
      <section class="card card-20" style="flex:1 1 0;justify-content:space-between">
        ${cabecalho({ icone: iconeTrendingUp("dptipo"), titulo: "Modelo", classeTitulo: "lh125", sub: DASH.subtitulos.modelo })}
        <div class="rows" style="flex:1;justify-content:space-between;padding:16px 0">${linhasModelos || vazio()}</div>
        ${paginacao("modelos", modelos.atual, modelos.total, true)}
      </section>
    </div>
    ${mx.linhas.length ? matriz("Matriz de Correlação: Dispositivo vs. Alarme", "Dispositivos (linhas) do que mais falha para o que menos falha; alarmes (colunas) começando pelo que mais deu no primeiro dispositivo da página, só os que aparecem nela. Use a paginação para ver os demais", mxVis.colunas, mxVis.linhas, { rodape: paginacao("matriz", mxPag.atual, mxPag.total), selLinhas: "dispositivos" })
      : `<section class="card"><div class="head-title"><span class="t">Matriz de Correlação: Dispositivo vs. Alarme</span></div>${vazio()}</section>`}`;
}

const TELAS = { dispositivo: telaDispositivo, alarme: telaAlarme, regiao: telaRegiao };

/* ---------- período (botão de data) ----------
   Não existe no Figma. Atalhos + calendário; "Aplicar" só troca o rótulo do botão (os dados são mock). */

const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
let HOJE_FIXO = null; // só para teste no Node
const dia = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const hoje = () => HOJE_FIXO || dia(new Date());
const addDias = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const mesmoDia = (a, b) => !!a && !!b && a.getTime() === b.getTime();
const p2 = (n) => String(n).padStart(2, "0");
const fmtData = (d) => `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()}`;
const chaveData = (d) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
const deChave = (k) => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };

const PRESETS = [
  { id: "hoje", chip: "Hoje", rotulo: "Hoje", botao: "Hoje", faixa: (t) => [t, t] },
  { id: "7d", chip: "7 dias", rotulo: "Últimos 7 dias", botao: "Últimos 7 Dias", faixa: (t) => [addDias(t, -6), t] },
  { id: "30d", chip: "30 dias", rotulo: "Últimos 30 dias", botao: "Últimos 30 Dias", faixa: (t) => [addDias(t, -29), t] },
  { id: "90d", chip: "90 dias", rotulo: "Últimos 90 dias", botao: "Últimos 90 Dias", faixa: (t) => [addDias(t, -89), t] },
];

function periodoDoPreset(id) {
  const p = PRESETS.find((x) => x.id === id);
  const [de, ate] = p.faixa(hoje());
  return { id, de, ate };
}
function rotuloPeriodo(p) {
  if (p.id !== "custom") return PRESETS.find((x) => x.id === p.id).botao;
  return mesmoDia(p.de, p.ate) ? fmtData(p.de) : `${fmtData(p.de)} – ${fmtData(p.ate)}`;
}

// Estado: `periodo` aplicado; `rascunhoData` é o que está sendo escolhido no popover aberto.
estado.periodo = periodoDoPreset("30d");
let rascunhoData = null;
let aguardandoFim = false;

// Primeiro clique define o início; o segundo fecha o período (se for antes do início, inverte).
function escolherDia(r, d, esperandoFim) {
  if (!esperandoFim) return { de: d, ate: d, esperando: true };
  return d < r.de ? { de: d, ate: r.de, esperando: false } : { de: r.de, ate: d, esperando: false };
}

const MESES_CURTOS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const SETA_TITULO = '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 3.5l3 3 3-3" stroke="#737373" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

// Visão de meses (abre ao clicar no título): escolher um mês volta para os dias dele.
function htmlMeses(r) {
  const t = hoje();
  const ano = r.mes.getFullYear();
  const botoes = MESES_CURTOS.map((nome, i) => {
    const minimo = MODELO.dataMinima(t);
    const fim = new Date(ano, i + 1, 0);
    const futuro = ano > t.getFullYear() || (ano === t.getFullYear() && i > t.getMonth()) || fim < minimo;
    const cls = ["dp-mes", ano === r.mes.getFullYear() && i === r.mes.getMonth() ? "is-on" : "", ano === t.getFullYear() && i === t.getMonth() ? "is-today" : ""].filter(Boolean).join(" ");
    return `<button type="button" class="${cls}" data-mesidx="${i}" ${futuro ? "disabled" : ""}>${nome}</button>`;
  }).join("");
  return `
    <div class="dp-cal-head">
      <button type="button" class="dp-nav" data-ano="-1" aria-label="Ano anterior">${img("reg", "6428f.svg", 14, 14)}</button>
      <button type="button" class="dp-title is-open" data-visao="dias" aria-label="Voltar para os dias">${ano}${SETA_TITULO}</button>
      <button type="button" class="dp-nav" data-ano="1" aria-label="Próximo ano" ${ano >= t.getFullYear() ? "disabled" : ""}>${img("reg", "e0d07.svg", 14, 14)}</button>
    </div>
    <div class="dp-months">${botoes}</div>`;
}

function htmlCalendario(r) {
  if (r.visao === "meses") return htmlMeses(r);
  const t = hoje();
  const minimo = MODELO.dataMinima(t);
  const mes = r.mes;
  const total = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
  const vazios = new Date(mes.getFullYear(), mes.getMonth(), 1).getDay();
  const ehUltimoMes = mes.getFullYear() === t.getFullYear() && mes.getMonth() === t.getMonth();
  let cel = "";
  for (let i = 0; i < vazios; i++) cel += '<div class="dp-blank"></div>';
  for (let n = 1; n <= total; n++) {
    const d = new Date(mes.getFullYear(), mes.getMonth(), n);
    const ini = mesmoDia(d, r.de), fim = mesmoDia(d, r.ate);
    const dentro = r.de && r.ate && d > r.de && d < r.ate;
    const cls = ["dp-day", dentro ? "in-range" : "", ini ? "is-start is-edge" : "", fim ? "is-end is-edge" : "", mesmoDia(d, t) ? "is-today" : ""].filter(Boolean).join(" ");
    cel += `<button type="button" class="${cls}" data-dia="${chaveData(d)}" ${d > t || d < minimo ? "disabled" : ""}><span>${n}</span></button>`;
  }
  return `
    <div class="dp-cal-head">
      <button type="button" class="dp-nav" data-mes="-1" aria-label="Mês anterior" ${mes <= new Date(minimo.getFullYear(), minimo.getMonth(), 1) ? "disabled" : ""}>${img("reg", "6428f.svg", 14, 14)}</button>
      <button type="button" class="dp-title" data-visao="meses" aria-label="Escolher o mês">${MESES[mes.getMonth()]} de ${mes.getFullYear()}${SETA_TITULO}</button>
      <button type="button" class="dp-nav" data-mes="1" aria-label="Próximo mês" ${ehUltimoMes ? "disabled" : ""}>${img("reg", "e0d07.svg", 14, 14)}</button>
    </div>
    <div class="dp-grid">${["D", "S", "T", "Q", "Q", "S", "S"].map((w) => `<div class="dp-wd">${w}</div>`).join("")}${cel}</div>`;
}

function htmlData(r) {
  const presets = PRESETS.map((p) => `<button type="button" data-preset="${p.id}" class="${r.id === p.id ? "is-on" : ""}" title="${p.rotulo}">${p.chip}</button>`).join("")
    + (r.id === "custom" ? '<button type="button" class="is-on" disabled>Personalizado</button>' : "");
  return `
    <div class="dp-body">
      <div class="dp-cal">${htmlCalendario(r)}</div>
      <div class="dp-presets">${presets}</div>
    </div>
    <div class="pop-foot">
      <button type="button" class="pop-btn" data-act="data-cancelar">Cancelar</button>
      <button type="button" class="pop-btn primary" data-act="data-aplicar">Aplicar</button>
    </div>`;
}

/* ---------- filtros (botão Filtros) ----------
   Cada filtro é um campo "select": mostra um resumo e, ao clicar, abre a lista (com busca onde há muitas
   opções). Só um campo fica aberto por vez, para o painel não crescer. Não existe no Figma. */

const CRITICIDADES = [
  { n: "Crítico", cor: "#b3261e" }, { n: "Alta", cor: "#e94600" }, { n: "Média", cor: "#e39610" }, { n: "Baixa", cor: "#0f66b3" },
];
const ALARMES_FILTRO = MODELO.ALARMES.map((a) => a.n); // os mesmos alarmes que aparecem nas telas
const TIPOS_FILTRO = MODELO.TIPOS;
let DISPOSITIVOS_FILTRO = null; // 545 itens; só é montado quando alguém abre o campo
const dispositivosFiltro = () => DISPOSITIVOS_FILTRO || (DISPOSITIVOS_FILTRO = MODELO.dispositivos(hoje()));

const CAMPOS_FILTRO = [
  { id: "crit", rotulo: "Criticidade", busca: false },
  { id: "alarmes", rotulo: "Alarmes", busca: true, placeholder: "Pesquisar alarme" },
  { id: "tipos", rotulo: "Tipo de dispositivo", busca: false },
  { id: "dispositivos", rotulo: "Dispositivo", busca: true, placeholder: "Pesquisar por código (ex.: SEM-1044)" },
];
const opcoesTotais = (id) => ({ crit: CRITICIDADES.length, alarmes: ALARMES_FILTRO.length, tipos: TIPOS_FILTRO.length, dispositivos: MODELO.PARQUE })[id];

// Padrão: tudo marcado (= nada filtrado). Exceção: "Dispositivo" tem 545 opções, então lista vazia = todos;
// marcar itens restringe a eles.
const filtrosPadrao = () => ({ crit: CRITICIDADES.map((c) => c.n), alarmes: [...ALARMES_FILTRO], tipos: [...TIPOS_FILTRO], dispositivos: [] });
estado.filtros = filtrosPadrao();
let rascunhoFiltros = null; // cópia editável + `aberto` (campo com a lista aberta)

const restritoCampo = (id, f) => (id === "dispositivos" ? f.dispositivos.length > 0 : f[id].length < opcoesTotais(id));
// O contador do botão mostra quantos campos estão restringidos (0 = tudo marcado, sem badge).
const totalFiltros = (f) => CAMPOS_FILTRO.filter((c) => restritoCampo(c.id, f)).length;
const filtrosValidos = (f) => f.crit.length > 0 && f.alarmes.length > 0 && f.tipos.length > 0; // "Dispositivo" vazio = todos

function resumoCampo(id, f) {
  const sel = f[id];
  if (id === "dispositivos") return sel.length ? (sel.length <= 2 ? sel.join(", ") : `${sel.length} selecionados`) : `Todos (${MODELO.PARQUE})`;
  const tot = opcoesTotais(id);
  if (sel.length === tot) return `Todos (${tot})`;
  if (!sel.length) return "Nenhum";
  return sel.length <= 2 ? sel.join(", ") : `${sel.length} de ${tot} selecionados`;
}

function textoLinkTodos(id, f) {
  if (id === "dispositivos") return f.dispositivos.length ? "Limpar seleção" : "";
  return f[id].length === opcoesTotais(id) ? "Desmarcar todos" : "Marcar todos";
}

function opcoesDoCampo(id) {
  if (id === "crit") return CRITICIDADES.map((c) => ({ v: c.n, cor: c.cor }));
  if (id === "alarmes") return ALARMES_FILTRO.map((n) => ({ v: n }));
  if (id === "tipos") return TIPOS_FILTRO.map((n) => ({ v: n }));
  // dispositivos que mais falharam no período (com os demais filtros) primeiro, com a contagem ao lado;
  // a maioria dos 545 não tem falha no período, e escolher "às cegas" daria tela vazia
  const r = MODELO.resumir(estado.periodo.de, estado.periodo.ate, { ...estado.filtros, dispositivos: [] }, hoje());
  const falhas = new Map(r.topDispositivos.map((d) => [d.n, d.f]));
  return dispositivosFiltro()
    .map((d) => { const f = falhas.get(d.id) || 0; return { v: d.id, f, sub: `${d.tipo} · ${f ? `${f} ${f === 1 ? "falha" : "falhas"}` : "sem falhas"}` }; })
    .sort((a, b) => b.f - a.f || a.v.localeCompare(b.v));
}

const ICONE_BUSCA = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="#737373" stroke-width="1.5"/><path d="M11 11l3.5 3.5" stroke="#737373" stroke-width="1.5" stroke-linecap="round"/></svg>';

function htmlCampoFiltro(c, r) {
  const aberto = r.aberto === c.id;
  const sel = r[c.id];
  const link = textoLinkTodos(c.id, r);
  const lista = !aberto ? "" : opcoesDoCampo(c.id).map((o) => `
      <label class="flt-check" data-nome="${`${o.v} ${o.sub || ""}`.toLowerCase()}"><input type="checkbox" data-flt="${c.id}" value="${o.v}" ${sel.includes(o.v) ? "checked" : ""}>${o.cor ? `<span class="dot" style="background:${o.cor}"></span>` : ""}<span>${o.v}</span>${o.sub ? `<span class="cnt">${o.sub}</span>` : ""}</label>`).join("");
  const vazioInvalido = c.id !== "dispositivos" && sel.length === 0;
  return `
    <div class="flt-field${aberto ? " is-open" : ""}">
      <div class="flt-label">${c.rotulo}</div>
      <button type="button" class="flt-select${vazioInvalido ? " is-erro" : ""}" data-act="flt-campo" data-campo="${c.id}" aria-expanded="${aberto}">
        <span class="flt-resumo" data-resumo="${c.id}">${resumoCampo(c.id, r)}</span>
        <span class="ico12">${img("reg", "739b6.svg", 16, 16)}</span>
      </button>
      ${aberto ? `
      <div class="flt-drop">
        ${c.busca ? `<div class="flt-search">${ICONE_BUSCA}<input type="search" data-busca="${c.id}" placeholder="${c.placeholder}" autocomplete="off"></div>` : ""}
        <div class="flt-tools"><button type="button" class="pop-link" data-act="flt-todos" data-campo="${c.id}" data-link="${c.id}" ${link ? "" : "hidden"}>${link}</button></div>
        <div class="flt-list" data-lista="${c.id}">${lista}<div class="flt-empty" data-vazio hidden>Nada encontrado.</div></div>
      </div>` : ""}
    </div>`;
}

function htmlFiltros(r) {
  const ok = filtrosValidos(r);
  return `
    <div class="flt-head"><strong>Filtros</strong><button type="button" class="pop-link" data-act="flt-limpar">Restaurar padrão</button></div>
    <div class="flt-fields">${CAMPOS_FILTRO.map((c) => htmlCampoFiltro(c, r)).join("")}</div>
    <div class="flt-erro" id="fltErro" ${ok ? "hidden" : ""}>Deixe ao menos uma opção marcada em cada campo.</div>
    <div class="pop-foot">
      <button type="button" class="pop-btn" data-act="flt-cancelar">Cancelar</button>
      <button type="button" class="pop-btn primary" id="fltAplicar" data-act="flt-aplicar" ${ok ? "" : "disabled"}>Aplicar</button>
    </div>`;
}

// Depois de marcar/desmarcar: atualiza resumo, link "marcar todos" e a validação sem redesenhar a lista.
function sincronizarFiltros(campo) {
  const f = rascunhoFiltros;
  const resumo = document.querySelector(`[data-resumo="${campo}"]`);
  if (resumo) resumo.textContent = resumoCampo(campo, f);
  const link = document.querySelector(`[data-link="${campo}"]`);
  if (link) { const t = textoLinkTodos(campo, f); link.textContent = t; link.hidden = !t; }
  const ok = filtrosValidos(f);
  $("#fltAplicar").disabled = !ok;
  $("#fltErro").hidden = ok;
  const sel = document.querySelector(`.flt-select[data-campo="${campo}"]`);
  if (sel) sel.classList.toggle("is-erro", campo !== "dispositivos" && f[campo].length === 0);
}

const copiarFiltros = (f) => ({ crit: [...f.crit], alarmes: [...f.alarmes], tipos: [...f.tipos], dispositivos: [...f.dispositivos] });

/* ---------- popovers: abrir/fechar ---------- */

const POPS = {
  data: { btn: "#btnData", box: "#dateModal" },
  filtros: { btn: "#btnFiltros", box: "#filterModal" },
};

function fecharPopovers() {
  for (const { btn, box } of Object.values(POPS)) {
    $(box).hidden = true;
    $(btn).setAttribute("aria-expanded", "false");
  }
}

function abrirPopover(qual) {
  const jaAberto = !$(POPS[qual].box).hidden;
  fecharPopovers();
  if (jaAberto) return;
  if (qual === "data") {
    const p = estado.periodo;
    rascunhoData = { ...p, mes: new Date(p.ate.getFullYear(), p.ate.getMonth(), 1), visao: "dias" };
    aguardandoFim = false;
    $(POPS.data.box).innerHTML = htmlData(rascunhoData);
  } else {
    rascunhoFiltros = { ...copiarFiltros(estado.filtros), aberto: null };
    $(POPS.filtros.box).innerHTML = htmlFiltros(rascunhoFiltros);
  }
  $(POPS[qual].box).hidden = false;
  $(POPS[qual].btn).setAttribute("aria-expanded", "true");
}

// Depois de aplicar período ou filtros: volta as listas à página 1 e recalcula a tela.
function aplicarMudancas() {
  atualizarBotoes();
  Object.keys(estado.pag).forEach((k) => { estado.pag[k] = 0; });
  render();
}

function atualizarBotoes() {
  $("#dataLabel").textContent = rotuloPeriodo(estado.periodo);
  const n = totalFiltros(estado.filtros);
  const b = $("#filtroBadge");
  b.hidden = n === 0;
  b.textContent = n;
}

// Devolve true se o clique foi tratado por um dos popovers.
function aoClicarPopover(e) {
  const alvo = e.target;
  const preset = alvo.closest("[data-preset]");
  if (preset) {
    estado.periodo = periodoDoPreset(preset.dataset.preset);
    aplicarMudancas(); fecharPopovers(); return true;
  }
  const diaBtn = alvo.closest("[data-dia]");
  if (diaBtn) {
    const r = escolherDia(rascunhoData, deChave(diaBtn.dataset.dia), aguardandoFim);
    rascunhoData.de = r.de; rascunhoData.ate = r.ate; rascunhoData.id = "custom";
    aguardandoFim = r.esperando;
    $(POPS.data.box).innerHTML = htmlData(rascunhoData); return true;
  }
  const visaoBtn = alvo.closest("[data-visao]");
  if (visaoBtn) {
    rascunhoData.visao = visaoBtn.dataset.visao;
    $(POPS.data.box).innerHTML = htmlData(rascunhoData); return true;
  }
  const anoBtn = alvo.closest("[data-ano]");
  if (anoBtn) {
    const m = rascunhoData.mes;
    const novo = new Date(m.getFullYear() + Number(anoBtn.dataset.ano), m.getMonth(), 1);
    const limite = new Date(hoje().getFullYear(), hoje().getMonth(), 1);
    rascunhoData.mes = novo > limite ? limite : novo; // nunca passa do mês atual
    $(POPS.data.box).innerHTML = htmlData(rascunhoData); return true;
  }
  const mesIdx = alvo.closest("[data-mesidx]");
  if (mesIdx) {
    rascunhoData.mes = new Date(rascunhoData.mes.getFullYear(), Number(mesIdx.dataset.mesidx), 1);
    rascunhoData.visao = "dias";
    $(POPS.data.box).innerHTML = htmlData(rascunhoData); return true;
  }
  const mesBtn = alvo.closest("[data-mes]");
  if (mesBtn) {
    const m = rascunhoData.mes;
    rascunhoData.mes = new Date(m.getFullYear(), m.getMonth() + Number(mesBtn.dataset.mes), 1);
    $(POPS.data.box).innerHTML = htmlData(rascunhoData); return true;
  }
  const act = alvo.closest("[data-act]");
  if (!act) return false;
  switch (act.dataset.act) {
    case "data-aplicar": estado.periodo = { id: rascunhoData.id, de: rascunhoData.de, ate: rascunhoData.ate }; aplicarMudancas(); fecharPopovers(); break;
    case "data-cancelar": case "flt-cancelar": fecharPopovers(); break;
    case "flt-aplicar": estado.filtros = copiarFiltros(rascunhoFiltros); aplicarMudancas(); fecharPopovers(); break;
    case "flt-limpar": rascunhoFiltros = { ...filtrosPadrao(), aberto: null }; $(POPS.filtros.box).innerHTML = htmlFiltros(rascunhoFiltros); break;
    case "flt-campo": {
      const campo = act.dataset.campo;
      rascunhoFiltros.aberto = rascunhoFiltros.aberto === campo ? null : campo;
      $(POPS.filtros.box).innerHTML = htmlFiltros(rascunhoFiltros);
      const busca = document.querySelector("[data-busca]");
      if (busca) busca.focus();
      break;
    }
    case "flt-todos": {
      const campo = act.dataset.campo;
      if (campo === "dispositivos") rascunhoFiltros.dispositivos = [];
      else rascunhoFiltros[campo] = rascunhoFiltros[campo].length === opcoesTotais(campo) ? [] : opcoesDoCampo(campo).map((o) => o.v);
      $(POPS.filtros.box).innerHTML = htmlFiltros(rascunhoFiltros);
      break;
    }
  }
  return true;
}

/* ---------- roteamento e eventos ---------- */

function rotaAtual() {
  const id = (location.hash || "").replace(/^#\/?/, "");
  return ROTAS.some((r) => r.id === id) ? id : "dispositivo";
}

function renderAbas(ativa) {
  const inativas = ROTAS.filter((r) => r.id !== ativa).map((r) => r.id);
  $("#tabs").innerHTML = ROTAS.map((r) => {
    if (r.id === ativa) return `<a class="tab is-active" href="#/${r.id}" aria-current="page">${r.rotulo}</a>`;
    return `<a class="tab ${inativas.indexOf(r.id) === 0 ? "is-inactive-a" : "is-inactive-b"}" href="#/${r.id}">${r.rotulo}</a>`;
  }).join("");
}

function render() {
  const id = rotaAtual();
  renderAbas(id);
  GRAFICOS.length = 0;
  $("#view").innerHTML = TELAS[id]();
  iniciarGraficos();
  document.title = `Dashboard de Alertas — ${ROTAS.find((r) => r.id === id).rotulo}`;
}

function $(sel) { return document.querySelector(sel); }

function iniciar() {
  atualizarBotoes();
  render();
  window.addEventListener("hashchange", () => { fecharPopovers(); render(); window.scrollTo(0, 0); });

  document.addEventListener("click", (e) => {
    // A verificação vem antes de qualquer re-render: re-renderizar solta o elemento clicado do DOM.
    const dentro = !!e.target.closest(".filter-wrap");
    if (!dentro) fecharPopovers();
    if (e.target.closest("#btnData")) { abrirPopover("data"); return; }
    if (e.target.closest("#btnFiltros")) { abrirPopover("filtros"); return; }
    if (dentro && aoClicarPopover(e)) return;

    const s = e.target.closest("[data-sel]");
    if (s) { alternarSelecao(s.dataset.sel, s.dataset.val, e.ctrlKey || e.metaKey); return; }
    const chip = e.target.closest("[data-chip]");
    if (chip) { estado.selecao[chip.dataset.chip] = estado.selecao[chip.dataset.chip].filter((x) => x !== chip.dataset.val); mudouSelecao(); return; }
    if (e.target.closest("[data-limpar-selecao]")) { estado.selecao = MODELO.selecaoVazia(); mudouSelecao(); return; }

    const pag = e.target.closest("[data-pag]");
    if (pag) {
      const chave = pag.dataset.pag;
      const total = estado.totalPag[chave] || { subareas: DASH.regiao.subareas.length, corredores: DASH.regiao.corredores.length }[chave];
      if (total) { estado.pag[chave] = Math.min(Math.max(estado.pag[chave] + Number(pag.dataset.dir), 0), total - 1); render(); }
      return;
    }
    const vol = e.target.closest("[data-vol]");
    if (vol) { estado.modoVolume = vol.dataset.vol; render(); return; }
    const mx = e.target.closest("[data-mx]");
    if (mx) { estado.matrizRegiao = mx.dataset.mx; render(); }
  });

  // marcar/desmarcar no painel de filtros (rascunho) e busca dentro do campo aberto
  document.addEventListener("change", (e) => {
    const cb = e.target.closest("input[data-flt]");
    if (!cb || !rascunhoFiltros) return;
    const lista = rascunhoFiltros[cb.dataset.flt];
    const i = lista.indexOf(cb.value);
    if (cb.checked && i < 0) lista.push(cb.value);
    if (!cb.checked && i >= 0) lista.splice(i, 1);
    sincronizarFiltros(cb.dataset.flt);
  });
  document.addEventListener("input", (e) => {
    const campo = e.target.dataset && e.target.dataset.busca;
    if (!campo) return;
    const q = e.target.value.trim().toLowerCase();
    let visiveis = 0;
    document.querySelectorAll(`[data-lista="${campo}"] [data-nome]`).forEach((el) => {
      const ok = !q || el.dataset.nome.includes(q);
      el.hidden = !ok;
      if (ok) visiveis++;
    });
    document.querySelector(`[data-lista="${campo}"] [data-vazio]`).hidden = visiveis > 0;
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") fecharPopovers(); });

  // hover em "Outros alarmes" (cabeçalho ou célula): mostra quais alarmes são
  document.addEventListener("mouseover", (e) => {
    const a = e.target.closest && e.target.closest("[data-outros]");
    if (a) mostrarOutros(a);
  });
  document.addEventListener("mouseout", (e) => {
    const a = e.target.closest && e.target.closest("[data-outros]");
    if (a && !(e.relatedTarget && a.contains(e.relatedTarget))) esconderOutros();
  });
  window.addEventListener("scroll", esconderOutros, { passive: true });

  // hover da pizza: o % aparece só na fatia sob o mouse
  document.addEventListener("mouseover", (e) => {
    const f = e.target.closest && e.target.closest(".fatia");
    if (f) mostrarFatia(f.closest(".pie"), f.dataset.fatia);
  });
  document.addEventListener("mouseout", (e) => {
    const f = e.target.closest && e.target.closest(".fatia");
    if (!f || (e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest(".fatia") && e.relatedTarget.closest(".pie") === f.closest(".pie"))) return;
    mostrarFatia(f.closest(".pie"), null);
  });

  // hover do gráfico de linhas: segue o ponteiro; ao sair, volta ao ponto padrão
  document.addEventListener("mousemove", (e) => {
    const plot = e.target.closest && e.target.closest("[data-plot]");
    if (!plot) return;
    const canvas = plot.closest("[data-chart]");
    posicionarGrafico(canvas, indiceDoPonteiro(canvas, e.clientX), true);
  });
  document.addEventListener("mouseout", (e) => {
    const plot = e.target.closest && e.target.closest("[data-plot]");
    if (!plot || (e.relatedTarget && plot.contains(e.relatedTarget))) return;
    const canvas = plot.closest("[data-chart]"); posicionarGrafico(canvas, idxPadrao(GRAFICOS[Number(canvas.dataset.chart)]), false);
  });
}

if (typeof document !== "undefined" && document.getElementById("view")) iniciar();
if (typeof module !== "undefined") module.exports = { TELAS, estado };
