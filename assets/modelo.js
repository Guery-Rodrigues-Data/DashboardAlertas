/* ==========================================================================
   Modelo simulado da aba Dispositivo — TUDO MOCK.
   Em vez de números soltos por cartão, há UMA base de falhas (parque de dispositivos + falhas por dia)
   e todos os cartões são calculados dela para o período escolhido. Por isso os números batem entre si:
   total de falhas = soma da pizza de idade = soma de Tipo = soma de Fabricante = soma da série diária.

   - As falhas de um dia são sempre as mesmas (a semente depende da data), então voltar a um período
     mostra o mesmo resultado.
   - Hoje o modelo cobre os últimos 365 dias a partir de "hoje".
   - Calibrado só para parecer plausível (≈ 5,7 falhas/dia, parque de 545 dispositivos, como o Figma);
     NÃO é dado real nem tem a definição de cada métrica validada (ver README).
   ========================================================================== */

const MODELO = (() => {
  const DIAS_BASE = 365;
  const PARQUE = 545;
  const MS_DIA = 86400000;
  const CRITICIDADES = ["Crítico", "Alta", "Média", "Baixa"];

  // alarme -> criticidade (decisão do protótipo)
  const ALARMES = [
    { n: "Falha na comunicação", crit: "Alta", peso: 24 },
    { n: "Sem Comunicação / Offline", crit: "Crítico", peso: 8 },
    { n: "Porta aberta", crit: "Baixa", peso: 14 },
    { n: "Porta Gabinete Aberta", crit: "Baixa", peso: 6 },
    { n: "Queima total do vermelho", crit: "Crítico", peso: 5 },
    { n: "Falha na Ativação do Relé", crit: "Média", peso: 8 },
    { n: "Falha no PCD", crit: "Crítico", peso: 11 },
    { n: "Falha Sincronia GPS", crit: "Média", peso: 8 },
    { n: "Subtensão Elétrica", crit: "Alta", peso: 10 },
    { n: "Semáforo Piscante Amarelo", crit: "Média", peso: 6 },
  ];
  const IDX = Object.fromEntries(ALARMES.map((a, i) => [a.n, i]));

  const TIPOS = [
    { tipo: "Controlador", prefixo: "SEM", peso: 0.4,
      marcas: [{ fab: "Traffix Inc.", modelo: "SEM-400 Pro", peso: 0.7 }, { fab: "Siemens | Sitraffic", modelo: "Sitraffic SEM-200", peso: 0.3 }],
      alarmes: ["Falha na comunicação", "Sem Comunicação / Offline", "Queima total do vermelho", "Falha na Ativação do Relé", "Falha no PCD", "Semáforo Piscante Amarelo", "Subtensão Elétrica", "Porta Gabinete Aberta", "Falha Sincronia GPS"] },
    { tipo: "Câmera", prefixo: "CAM", peso: 0.25,
      marcas: [{ fab: "Hikvision", modelo: "SmartCam CAM-X", peso: 0.6 }, { fab: "Bosch", modelo: "Bosch DINION", peso: 0.4 }],
      alarmes: ["Falha na comunicação", "Sem Comunicação / Offline", "Subtensão Elétrica", "Falha Sincronia GPS"] },
    { tipo: "Nobreak | UPS", prefixo: "DEV", peso: 0.15,
      marcas: [{ fab: "Eaton Power", modelo: "UPS-DEV 1000", peso: 0.7 }, { fab: "APC", modelo: "Smart-UPS 1500", peso: 0.3 }],
      alarmes: ["Subtensão Elétrica", "Porta aberta", "Sem Comunicação / Offline"] },
    { tipo: "Detector", prefixo: "DET", peso: 0.12,
      marcas: [{ fab: "Siemens | Sitraffic", modelo: "Sitraffic DET-900", peso: 0.6 }, { fab: "Bosch", modelo: "Bosch DET-5", peso: 0.4 }],
      alarmes: ["Falha na comunicação", "Sem Comunicação / Offline", "Falha no PCD"] },
    { tipo: "Sensor de movimento", prefixo: "SNS", peso: 0.08,
      marcas: [{ fab: "Bosch", modelo: "Bosch BSM-20", peso: 1 }],
      alarmes: ["Falha na comunicação", "Sem Comunicação / Offline", "Porta aberta"] },
  ];

  const FAIXAS = [
    { id: "lt3", rotulo: "< 3 anos", rotuloLegenda: "< 3 Anos:", cor: "#f3443c", ate: 3 },
    { id: "3a5", rotulo: "3 a 5 anos", rotuloLegenda: "3 a 5 Anos:", cor: "#ec928e", ate: 5 },
    { id: "5a8", rotulo: "5 a 8 anos", rotuloLegenda: "5 a 8 Anos:", cor: "#f3bd5e", ate: 8 },
    { id: "gt8", rotulo: "> 8 anos", rotuloLegenda: "> 8 Anos:", cor: "#0f66b3", ate: Infinity },
  ];
  const faixaDaIdade = (anos) => FAIXAS.findIndex((f) => anos < f.ate);

  /* ---------- aleatório com semente ---------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const sorteioPonderado = (rnd, pesos) => {
    let r = rnd() * pesos.reduce((a, b) => a + b, 0);
    for (let i = 0; i < pesos.length; i++) { r -= pesos[i]; if (r < 0) return i; }
    return pesos.length - 1;
  };
  function poisson(rnd, lambda) {
    const L = Math.exp(-lambda);
    let k = 0, p = 1;
    do { k++; p *= rnd(); } while (p > L);
    return k - 1;
  }

  /* ---------- parque de dispositivos (fixo) ---------- */
  function gerarParque() {
    const rnd = mulberry32(20261002);
    const lista = [];
    TIPOS.forEach((t) => {
      const n = Math.round(PARQUE * t.peso);
      for (let i = 0; i < n; i++) {
        const marca = t.marcas[sorteioPonderado(rnd, t.marcas.map((m) => m.peso))];
        const idade = 0.3 + rnd() * 10.2;
        // alarme "preferido" do dispositivo: faz a matriz Dispositivo x Alarme ter padrões
        const pref = t.alarmes[sorteioPonderado(rnd, t.alarmes.map((a) => ALARMES[IDX[a]].peso))];
        lista.push({ id: `${t.prefixo}-${1000 + lista.length}`, tipo: t.tipo, fab: marca.fab, modelo: marca.modelo, idade, faixa: faixaDaIdade(idade), pref, permitidos: t.alarmes });
      }
    });
    // peso de falha por dispositivo: poucos concentram a maioria das falhas (cauda longa)
    const ordem = lista.map((_, i) => i).sort(() => rnd() - 0.5);
    ordem.forEach((di, rank) => { lista[di].peso = rank < 70 ? 1 / Math.pow(rank + 3, 1.05) : 0.0004; });
    return lista;
  }

  /* ---------- falhas por dia (a semente depende da data) ---------- */
  const FATOR_SEMANA = [0.7, 1.05, 1.1, 1.1, 1.05, 1.0, 0.75]; // dom..sáb
  const chaveDia = (d) => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();

  function eventosDoDia(dia, parque, pesosDev) {
    const rnd = mulberry32(chaveDia(dia) * 2654435761 % 4294967296);
    const idxDia = Math.floor(Date.UTC(dia.getFullYear(), dia.getMonth(), dia.getDate()) / MS_DIA);
    let lambda = 5.7 * FATOR_SEMANA[dia.getDay()] * (1 + 0.18 * Math.sin(idxDia / 23));
    if (chaveDia(dia) % 29 === 0) lambda *= 2.1; // dia ruim ocasional
    const n = poisson(rnd, lambda);
    const out = [];
    for (let k = 0; k < n; k++) {
      const di = sorteioPonderado(rnd, pesosDev);
      const d = parque[di];
      const alarme = rnd() < 0.65 ? d.pref : d.permitidos[sorteioPonderado(rnd, d.permitidos.map((a) => ALARMES[IDX[a]].peso))];
      out.push({ dia: idxDia, h: Math.floor(rnd() * 24), dev: di, alarme: IDX[alarme], crit: ALARMES[IDX[alarme]].crit });
    }
    return out;
  }

  const cache = {};
  function base(hoje) {
    const k = chaveDia(hoje);
    if (cache[k]) return cache[k];
    const parque = gerarParque();
    const pesos = parque.map((d) => d.peso);
    const eventos = [];
    for (let i = DIAS_BASE - 1; i >= 0; i--) {
      const dia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - i);
      eventos.push(...eventosDoDia(dia, parque, pesos));
    }
    return (cache[k] = { parque, eventos });
  }

  const diaIdx = (d) => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / MS_DIA);
  const rotuloDia = (idx) => { const d = new Date(idx * MS_DIA); return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}`; };
  const rotuloDiaCompleto = (idx) => `${rotuloDia(idx)}/${new Date(idx * MS_DIA).getUTCFullYear()}`;

  function dataMinima(hoje) { return new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - (DIAS_BASE - 1)); }

  // degrau "redondo" do eixo Y: 5 intervalos; devolve o máximo do eixo (5 x degrau)
  function maximoDoEixo(max) {
    const passos = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];
    const s = passos.find((p) => p * 5 >= max) || 1000;
    return s * 5;
  }

  const contar = (arr, chave) => { const m = new Map(); arr.forEach((x) => { const k = chave(x); m.set(k, (m.get(k) || 0) + 1); }); return m; };
  const ordenar = (m) => [...m.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]), "pt-BR"));

  /* ---------- agregação do período ---------- */
  function resumir(de, ate, filtros, hoje) {
    const { parque, eventos } = base(hoje);
    const i0 = diaIdx(de), i1 = diaIdx(ate);
    const dias = i1 - i0 + 1;
    const okCrit = (e) => !filtros || filtros.crit.includes(e.crit);
    const okAlarme = (e) => !filtros || filtros.alarmes.includes(ALARMES[e.alarme].n);
    // tipo: lista marcada (todos por padrão). dispositivos: lista vazia = todos; com itens = só esses.
    const okTipo = (e) => !filtros || !filtros.tipos || filtros.tipos.includes(parque[e.dev].tipo);
    const okDisp = (e) => !filtros || !filtros.dispositivos || !filtros.dispositivos.length || filtros.dispositivos.includes(parque[e.dev].id);
    const ev = eventos.filter((e) => e.dia >= i0 && e.dia <= i1 && okCrit(e) && okAlarme(e) && okTipo(e) && okDisp(e));
    const total = ev.length;

    // série para o gráfico: por hora se o período tem até 2 dias; senão por dia
    const porHora = dias <= 2;
    const nPontos = porHora ? dias * 24 : dias;
    const valores = Object.fromEntries(CRITICIDADES.map((c) => [c, new Array(nPontos).fill(0)]));
    ev.forEach((e) => { valores[e.crit][porHora ? (e.dia - i0) * 24 + e.h : e.dia - i0]++; });
    const rotulos = [], rotulosTip = [];
    for (let p = 0; p < nPontos; p++) {
      if (porHora) {
        const di = i0 + Math.floor(p / 24), h = p % 24;
        rotulos.push(dias === 1 ? `${h}h` : (h % 6 === 0 ? `${rotuloDia(di)} ${h}h` : ""));
        rotulosTip.push(`${rotuloDia(di)} ${String(h).padStart(2, "0")}h`);
      } else { rotulos.push(rotuloDia(i0 + p)); rotulosTip.push(rotuloDiaCompleto(i0 + p)); }
    }
    const maxValor = Math.max(0, ...CRITICIDADES.flatMap((c) => valores[c]));

    // por dispositivo / alarme / tipo / fabricante / modelo / faixa
    const porDev = ordenar(contar(ev, (e) => e.dev));
    const porAlarme = ordenar(contar(ev, (e) => e.alarme));
    const porTipo = ordenar(contar(ev, (e) => parque[e.dev].tipo));
    const porFab = ordenar(contar(ev, (e) => parque[e.dev].fab));
    const porModelo = ordenar(contar(ev, (e) => parque[e.dev].modelo));
    const faixas = FAIXAS.map((f, i) => ({ ...f, v: ev.filter((e) => parque[e.dev].faixa === i).length }));

    // dispositivos distintos com falha por dia -> média diária
    const porDia = new Map();
    ev.forEach((e) => { if (!porDia.has(e.dia)) porDia.set(e.dia, new Set()); porDia.get(e.dia).add(e.dev); });
    const somaDisp = [...porDia.values()].reduce((a, s) => a + s.size, 0);

    const modeloDe = (nome) => { const d = parque.find((x) => x.modelo === nome); return d ? d.fab : ""; };
    const top7Dev = porDev.slice(0, 7).map(([di]) => di);
    const top7Alarmes = porAlarme.slice(0, 7).map(([ai]) => ai);
    const cel = (di, ai) => ev.filter((e) => e.dev === di && e.alarme === ai).length;
    const matrizV = top7Dev.map((di) => top7Alarmes.map((ai) => cel(di, ai)));
    const maxCel = Math.max(0, ...matrizV.flat());
    const tom = (v) => (maxCel && v >= 0.66 * maxCel ? "d" : maxCel && v >= 0.33 * maxCel ? "m" : "l");

    const topFaixa = faixas.reduce((a, f) => (f.v > a.v ? f : a), faixas[0]);
    const topAlarme = porAlarme[0] ? { n: ALARMES[porAlarme[0][0]].n, v: porAlarme[0][1] } : null;

    return {
      de, ate, dias, total,
      dispositivos: porDev.length,
      parque: PARQUE,
      mediaDiaria: dias ? somaDisp / dias : 0,
      topAlarme,
      alarmes: porAlarme.map(([ai, v]) => ({ n: ALARMES[ai].n, v })),
      topFaixa: total ? topFaixa : null,
      faixas,
      serie: { porHora, rotulos, rotulosTip, valores, maxValor, eixoMax: maximoDoEixo(maxValor) },
      topDispositivos: porDev.map(([di, f]) => ({ n: parque[di].id, tipo: parque[di].tipo, f })),
      tipos: porTipo.map(([n, f]) => ({ n, f })),
      fabricantes: porFab.map(([n, f]) => ({ n, f })),
      modelos: porModelo.map(([n, f]) => ({ n, fab: modeloDe(n), f })),
      matriz: {
        colunas: top7Alarmes.map((ai) => ({ t: ALARMES[ai].n })),
        linhas: top7Dev.map((di, r) => [parque[di].id, matrizV[r].map((v) => [v, tom(v)])]),
      },
    };
  }

  // período anterior de mesmo tamanho (para as variações); null se sair da base
  function resumirAnterior(de, ate, filtros, hoje) {
    const dias = diaIdx(ate) - diaIdx(de) + 1;
    const fim = new Date(de.getFullYear(), de.getMonth(), de.getDate() - 1);
    const ini = new Date(fim.getFullYear(), fim.getMonth(), fim.getDate() - (dias - 1));
    if (ini < dataMinima(hoje)) return null;
    return resumir(ini, fim, filtros, hoje);
  }

  // dispositivos do parque (para o filtro "Dispositivo"), por código
  function dispositivos(hoje) {
    return base(hoje).parque.map((d) => ({ id: d.id, tipo: d.tipo })).sort((a, b) => a.id.localeCompare(b.id));
  }

  return { resumir, resumirAnterior, dataMinima, maximoDoEixo, dispositivos, ALARMES, FAIXAS, CRITICIDADES, PARQUE, DIAS_BASE, TIPOS: TIPOS.map((t) => t.tipo) };
})();

if (typeof module !== "undefined") module.exports = { MODELO };
