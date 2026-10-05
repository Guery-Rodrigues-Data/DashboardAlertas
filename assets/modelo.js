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

  // alarme -> criticidade e duração média em minutos (decisões do protótipo; `dur` alimenta a aba Alarme)
  const ALARMES = [
    { n: "Falha na comunicação", crit: "Alta", peso: 24, dur: 28 },
    { n: "Sem Comunicação / Offline", crit: "Crítico", peso: 8, dur: 95 },
    { n: "Porta aberta", crit: "Baixa", peso: 14, dur: 40 },
    { n: "Porta Gabinete Aberta", crit: "Baixa", peso: 6, dur: 55 },
    { n: "Queima total do vermelho", crit: "Crítico", peso: 5, dur: 380 },
    { n: "Falha na Ativação do Relé", crit: "Média", peso: 8, dur: 150 },
    { n: "Falha no PCD", crit: "Crítico", peso: 11, dur: 210 },
    { n: "Falha Sincronia GPS", crit: "Média", peso: 8, dur: 70 },
    { n: "Subtensão Elétrica", crit: "Alta", peso: 10, dur: 45 },
    { n: "Semáforo Piscante Amarelo", crit: "Média", peso: 6, dur: 120 },
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

  // Regiões inventadas para o protótipo (não é o cadastro real). `raio` ≈ dispersão dos dispositivos, em graus.
  const SUBAREAS = [
    { n: "Centro Histórico", lat: -25.4296, lng: -49.2719, raio: 0.006, peso: 0.10, corredores: ["Rua XV de Novembro", "Av. Sete de Setembro", "Av. Visconde de Guarapuava"] },
    { n: "Zona Leste", lat: -25.4550, lng: -49.2150, raio: 0.014, peso: 0.17, corredores: ["Av. Brasil", "Rótula Radial Leste", "Av. Marechal Floriano"] },
    { n: "Zona Sul", lat: -25.5050, lng: -49.2850, raio: 0.016, peso: 0.15, corredores: ["Av. Linha Verde", "Av. Cruzeiro do Sul"] },
    { n: "Zona Norte", lat: -25.3750, lng: -49.2350, raio: 0.014, peso: 0.12, corredores: ["Av. Iguaçu"] },
    { n: "Zona Oeste", lat: -25.4350, lng: -49.3350, raio: 0.014, peso: 0.11, corredores: ["Av. Presidente Kennedy"] },
    { n: "Zona Nordeste", lat: -25.3850, lng: -49.2050, raio: 0.012, peso: 0.08, corredores: ["Av. Silva Jardim"] },
    { n: "Zona Sudeste", lat: -25.5100, lng: -49.2400, raio: 0.012, peso: 0.08, corredores: ["Rua Padre Anchieta"] },
    { n: "Zona Noroeste", lat: -25.3950, lng: -49.3100, raio: 0.012, peso: 0.07, corredores: ["Av. Iguaçu"] },
    { n: "Zona Sudoeste", lat: -25.4950, lng: -49.3400, raio: 0.012, peso: 0.07, corredores: ["Av. Presidente Kennedy"] },
    { n: "Distrito Industrial", lat: -25.4780, lng: -49.3500, raio: 0.010, peso: 0.05, corredores: ["Av. Linha Verde"] },
  ];
  const CENTRO_MAPA = [-25.4322, -49.2723];
  // Dispositivo sem sub área/corredor cadastrado continua nas contas, em "Sem sub área" / "Sem corredor".
  // O MAPA não usa região nenhuma: só a latitude/longitude do dispositivo.
  const subDe = (d) => d.subarea || "Sem sub área";
  const corDe = (d) => d.corredor || "Sem corredor";

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
    // sub área, corredor e coordenadas (inventados), com semente própria para não alterar o resto da base
    const rndR = mulberry32(31337);
    const gauss = () => Math.sqrt(-2 * Math.log(Math.max(rndR(), 1e-9))) * Math.cos(2 * Math.PI * rndR());
    lista.forEach((d) => {
      const sa = SUBAREAS[sorteioPonderado(rndR, SUBAREAS.map((x) => x.peso))];
      d.subarea = sa.n;
      d.corredor = sa.corredores[Math.floor(rndR() * sa.corredores.length)];
      d.lat = sa.lat + gauss() * sa.raio;
      d.lng = sa.lng + gauss() * sa.raio * 1.2;
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
      const alarme = rnd() < 0.5 ? d.pref : d.permitidos[sorteioPonderado(rnd, d.permitidos.map((a) => ALARMES[IDX[a]].peso))];
      const falha = { dia: idxDia, h: Math.floor(rnd() * 24), dev: di, alarme: IDX[alarme], crit: ALARMES[IDX[alarme]].crit };
      falha.dur = duracaoDe(falha, k);
      out.push(falha);
    }
    return out;
  }

  // Duração (min) de uma falha: exponencial com mínimo de 30% da média do tipo, sorteada com semente própria.
  function duracaoDe(e, k) {
    const semente = (e.dia * 73856093) ^ (e.h * 19349663) ^ (e.dev * 83492791) ^ (e.alarme * 2654435761) ^ (k * 40503);
    const u = Math.max(mulberry32(semente)(), 1e-6);
    return Math.max(1, Math.round(ALARMES[e.alarme].dur * (0.3 + 0.7 * -Math.log(u))));
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

  /* ---------- agregação do período ----------
     `filtros` = painel Filtros (restringe a tela toda). `selecao` = cliques na tela (tipo, fabricante, modelo,
     faixa de idade, dispositivo, alarme): restringe os OUTROS cartões, mas o cartão de onde veio o clique
     continua mostrando todas as opções (para trocar a seleção), com a escolhida em destaque na tela. */
  const DIMS_SELECAO = ["tipos", "fabricantes", "modelos", "faixas", "dispositivos", "alarmes", "crits", "subareas", "corredores"];
  const selecaoVazia = () => Object.fromEntries(DIMS_SELECAO.map((d) => [d, []]));

  function resumir(de, ate, filtros, hoje, selecao) {
    const { parque, eventos } = base(hoje);
    const sel = selecao || selecaoVazia();
    const i0 = diaIdx(de), i1 = diaIdx(ate);
    const dias = i1 - i0 + 1;
    const okCrit = (e) => !filtros || filtros.crit.includes(e.crit);
    const okAlarme = (e) => !filtros || filtros.alarmes.includes(ALARMES[e.alarme].n);
    // tipo/fabricante/modelo/faixa: lista marcada (todos por padrão). dispositivos: lista vazia = todos; com itens = só esses.
    const okTipo = (e) => !filtros || !filtros.tipos || filtros.tipos.includes(parque[e.dev].tipo);
    const okFab = (e) => !filtros || !filtros.fabricantes || filtros.fabricantes.includes(parque[e.dev].fab);
    const okModelo = (e) => !filtros || !filtros.modelos || filtros.modelos.includes(parque[e.dev].modelo);
    const okFaixa = (e) => !filtros || !filtros.faixas || filtros.faixas.includes(FAIXAS[parque[e.dev].faixa].id);
    // sub área/corredor: lista marcada; "Sem sub área"/"Sem corredor" cobre dispositivo sem cadastro
    const okSub = (e) => !filtros || !filtros.subareas || filtros.subareas.includes(subDe(parque[e.dev]));
    const okCor = (e) => !filtros || !filtros.corredores || filtros.corredores.includes(corDe(parque[e.dev]));
    const okDisp = (e) => !filtros || !filtros.dispositivos || !filtros.dispositivos.length || filtros.dispositivos.includes(parque[e.dev].id);
    // eventos do período que passam pelo painel de filtros
    const base0 = eventos.filter((e) => e.dia >= i0 && e.dia <= i1 && okCrit(e) && okAlarme(e) && okTipo(e) && okFab(e) && okModelo(e) && okFaixa(e) && okSub(e) && okCor(e) && okDisp(e));
    // seleção por clique: valor do evento em cada dimensão; `exceto` = dimensões que NÃO se aplicam (o cartão de origem)
    const valorDe = {
      tipos: (e) => parque[e.dev].tipo, fabricantes: (e) => parque[e.dev].fab, modelos: (e) => parque[e.dev].modelo,
      faixas: (e) => FAIXAS[parque[e.dev].faixa].id, dispositivos: (e) => parque[e.dev].id, alarmes: (e) => ALARMES[e.alarme].n, crits: (e) => e.crit,
      subareas: (e) => subDe(parque[e.dev]), corredores: (e) => corDe(parque[e.dev]),
    };
    const evSem = (exceto) => base0.filter((e) => DIMS_SELECAO.every((d) => exceto.includes(d) || !sel[d].length || sel[d].includes(valorDe[d](e))));
    const ev = evSem([]);
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
    // total por ponto e, para o hover, quais dispositivos falharam em cada ponto (mais falhas primeiro)
    const totais = Array.from({ length: nPontos }, (_, p) => CRITICIDADES.reduce((a, c) => a + valores[c][p], 0));
    const porPonto = Array.from({ length: nPontos }, () => new Map());
    ev.forEach((e) => { const m = porPonto[porHora ? (e.dia - i0) * 24 + e.h : e.dia - i0]; m.set(e.dev, (m.get(e.dev) || 0) + 1); });
    const dispositivosPorPonto = porPonto.map((m) => [...m.entries()]
      .map(([di, f]) => ({ n: parque[di].id, tipo: parque[di].tipo, f }))
      .sort((a, b) => b.f - a.f || a.n.localeCompare(b.n)));

    const porPontoAl = Array.from({ length: nPontos }, () => new Map());
    ev.forEach((e) => { const m = porPontoAl[porHora ? (e.dia - i0) * 24 + e.h : e.dia - i0]; m.set(e.alarme, (m.get(e.alarme) || 0) + 1); });
    const alarmesPorPonto = porPontoAl.map((m) => [...m.entries()]
      .map(([ai, f]) => ({ n: ALARMES[ai].n, f }))
      .sort((a, b) => b.f - a.f || a.n.localeCompare(b.n, "pt-BR")));

    // cartões "seletores": cada um ignora a PRÓPRIA seleção (continua mostrando todas as opções)
    const comPct = (lista, base) => lista.map((x) => ({ ...x, pct: base ? Math.round((x.f / base) * 100) : 0 }));
    const evTipo = evSem(["tipos"]), evFab = evSem(["fabricantes"]), evModelo = evSem(["modelos"]), evFaixa = evSem(["faixas"]), evDev = evSem(["dispositivos"]);
    const modeloDe = (nome) => { const d = parque.find((x) => x.modelo === nome); return d ? d.fab : ""; };
    const tipos = comPct(ordenar(contar(evTipo, (e) => parque[e.dev].tipo)).map(([n, f]) => ({ n, f })), evTipo.length);
    const fabricantes = comPct(ordenar(contar(evFab, (e) => parque[e.dev].fab)).map(([n, f]) => ({ n, f })), evFab.length);
    const modelos = comPct(ordenar(contar(evModelo, (e) => parque[e.dev].modelo)).map(([n, f]) => ({ n, fab: modeloDe(n), f })), evModelo.length);
    const faixas = FAIXAS.map((f, i) => ({ ...f, v: evFaixa.filter((e) => parque[e.dev].faixa === i).length }));
    const topDispositivos = comPct(ordenar(contar(evDev, (e) => e.dev)).map(([di, f]) => ({ n: parque[di].id, tipo: parque[di].tipo, f })), evDev.length);

    // aba Alarme — pizza de criticidade (ignora a própria seleção) e listas de alarmes (idem)
    const evCrit = evSem(["crits"]), evAl = evSem(["alarmes"]);
    const criticidades = CRITICIDADES.map((c) => ({ n: c, v: evCrit.filter((e) => e.crit === c).length }));
    const alarmesLista = comPct(ordenar(contar(evAl, (e) => e.alarme)).map(([ai, f]) => ({ n: ALARMES[ai].n, f })), evAl.length);
    const durPorAl = new Map();
    evAl.forEach((e) => { const d = durPorAl.get(e.alarme) || { soma: 0, f: 0 }; d.soma += e.dur; d.f++; durPorAl.set(e.alarme, d); });
    const duracaoPorAlarme = [...durPorAl.entries()].map(([ai, d]) => ({ n: ALARMES[ai].n, v: d.soma / d.f, f: d.f }))
      .sort((a, b) => b.v - a.v || a.n.localeCompare(b.n, "pt-BR"));
    const durMedia = total ? ev.reduce((a, e) => a + e.dur, 0) / total : 0;
    const pctLongos = total ? Math.round((ev.filter((e) => e.dur > 240).length / total) * 100) : 0;
    const tiposDeAlarme = new Set(ev.map((e) => e.alarme)).size;

    // cartões "resultado": usam todas as seleções
    const porDev = ordenar(contar(ev, (e) => e.dev));
    const porAlarme = ordenar(contar(ev, (e) => e.alarme));
    const faixasEv = FAIXAS.map((f, i) => ({ ...f, v: ev.filter((e) => parque[e.dev].faixa === i).length }));

    // dispositivos distintos com falha por dia -> média diária
    const porDia = new Map();
    ev.forEach((e) => { if (!porDia.has(e.dia)) porDia.set(e.dia, new Set()); porDia.get(e.dia).add(e.dev); });
    const somaDisp = [...porDia.values()].reduce((a, s) => a + s.size, 0);

    // Matriz genérica. Linhas = `chave(e)` (dispositivo, sub área ou corredor), do que mais falha para o que menos;
    // colunas = os 7 alarmes mais frequentes + "Outros alarmes" + "Total". A tela pagina as linhas. A conta de cada
    // linha fecha: células + "Outros alarmes" = Total. O mapa de calor (d/m/l) usa o maior valor de TODAS as
    // linhas, para a cor ser comparável entre páginas. É "seletora" da própria dimensão e de alarme (a tela
    // ignora essas duas seleções ao montar `evM`).
    function montarMatrizPor(evM, chave) {
      const totalM = evM.length;
      const porLinha = ordenar(contar(evM, chave));
      const porAlarmeM = ordenar(contar(evM, (e) => e.alarme));
      if (!porLinha.length) return { colunas: [], linhas: [] };
      const colunasAl = porAlarmeM.slice(0, 7).map(([ai]) => ai);
      const cont = new Map();
      evM.forEach((e) => { const k = `${chave(e)}|${e.alarme}`; cont.set(k, (cont.get(k) || 0) + 1); });
      const nucleo = porLinha.map(([nome, tot]) => ({ nome, tot, cels: colunasAl.map((ai) => cont.get(`${nome}|${ai}`) || 0) }));
      const maxCel = Math.max(0, ...nucleo.flatMap((l) => l.cels));
      const tom = (v) => (maxCel && v >= 0.66 * maxCel ? "d" : maxCel && v >= 0.33 * maxCel ? "m" : "l");
      const porAl = new Map(porAlarmeM);
      const temOutrosAl = totalM - colunasAl.reduce((a, ai) => a + (porAl.get(ai) || 0), 0) > 0;
      const naColuna = new Set(colunasAl);
      // quais alarmes estão dentro de "Outros alarmes": no cabeçalho, no período todo; na célula, só da linha (hover na tela)
      const outrosGeral = porAlarmeM.filter(([ai]) => !naColuna.has(ai)).map(([ai, v]) => ({ n: ALARMES[ai].n, v }));
      const outrosDaLinha = (nome) => ALARMES.map((a, ai) => ({ n: a.n, ai, v: cont.get(`${nome}|${ai}`) || 0 }))
        .filter((x) => !naColuna.has(x.ai) && x.v > 0).sort((a, b) => b.v - a.v || a.n.localeCompare(b.n, "pt-BR")).map(({ n, v }) => ({ n, v }));
      const colunas = [...colunasAl.map((ai) => ({ t: ALARMES[ai].n })), ...(temOutrosAl ? [{ t: "Outros alarmes", outros: { titulo: "Outros alarmes no período", itens: outrosGeral } }] : []), { t: "Total" }];
      const linhas = nucleo.map((l) => {
        const cels = l.cels.map((v) => [v, tom(v)]);
        if (temOutrosAl) cels.push([l.tot - l.cels.reduce((a, b) => a + b, 0), "n", { titulo: `Outros alarmes · ${l.nome}`, itens: outrosDaLinha(l.nome) }]);
        cels.push([l.tot, "n"]);
        return [l.nome, cels];
      });
      return { colunas, linhas };
    }
    const matrizDisp = montarMatrizPor(evSem(["dispositivos", "alarmes"]), (e) => parque[e.dev].id);
    const matrizSub = montarMatrizPor(evSem(["subareas", "alarmes"]), (e) => subDe(parque[e.dev]));
    const matrizCor = montarMatrizPor(evSem(["corredores", "alarmes"]), (e) => corDe(parque[e.dev]));

    // aba Região: listas "seletoras" (ignoram a própria seleção), resultados (todas as seleções) e pontos do mapa
    const evSub = evSem(["subareas"]), evCor = evSem(["corredores"]);
    const ativos = (fn) => { const m = new Map(); parque.forEach((d) => m.set(fn(d), (m.get(fn(d)) || 0) + 1)); return m; };
    const ativosSub = ativos(subDe), ativosCor = ativos(corDe);
    const subareas = comPct(ordenar(contar(evSub, (e) => subDe(parque[e.dev]))).map(([n, f]) => ({ n, f, ativos: ativosSub.get(n) })), evSub.length);
    const corredores = comPct(ordenar(contar(evCor, (e) => corDe(parque[e.dev]))).map(([n, f]) => ({ n, f, ativos: ativosCor.get(n) })), evCor.length);
    const subareasEv = ordenar(contar(ev, (e) => subDe(parque[e.dev]))).map(([n, f]) => ({ n, f }));
    const corredoresEv = ordenar(contar(ev, (e) => corDe(parque[e.dev]))).map(([n, f]) => ({ n, f }));
    // pontos do mapa de calor: SÓ latitude/longitude e nº de falhas do dispositivo (quem não tem coordenada fica de fora do mapa)
    const mapa = porDev.filter(([di]) => Number.isFinite(parque[di].lat) && Number.isFinite(parque[di].lng))
      .map(([di, f]) => ({ lat: parque[di].lat, lng: parque[di].lng, f }));

    const topFaixa = faixasEv.reduce((a, f) => (f.v > a.v ? f : a), faixasEv[0]);
    const topAlarme = porAlarme[0] ? { n: ALARMES[porAlarme[0][0]].n, v: porAlarme[0][1] } : null;

    return {
      de, ate, dias, total,
      dispositivos: porDev.length,
      parque: PARQUE,
      mediaDiaria: dias ? somaDisp / dias : 0,
      topAlarme,
      alarmes: porAlarme.map(([ai, v]) => ({ n: ALARMES[ai].n, v })),
      topFaixa: total ? topFaixa : null,
      faixas,       // pizza (ignora a seleção de faixa)
      faixasEv,     // contagem por faixa com todas as seleções (para a variação do cartão)
      serie: { porHora, rotulos, rotulosTip, valores, maxValor, eixoMax: maximoDoEixo(maxValor), totais, eixoMaxTotal: maximoDoEixo(Math.max(0, ...totais)), dispositivos: dispositivosPorPonto, alarmes: alarmesPorPonto },
      topDispositivos, tipos, fabricantes, modelos,
      criticidades, alarmesLista, duracaoPorAlarme, durMedia, pctLongos, tiposDeAlarme,
      matriz: matrizDisp, matrizSubareas: matrizSub, matrizCorredores: matrizCor,
      subareas, corredores, subareasEv, corredoresEv, mapa,
    };
  }

  // período anterior de mesmo tamanho (para as variações); null se sair da base
  function resumirAnterior(de, ate, filtros, hoje, selecao) {
    const dias = diaIdx(ate) - diaIdx(de) + 1;
    const fim = new Date(de.getFullYear(), de.getMonth(), de.getDate() - 1);
    const ini = new Date(fim.getFullYear(), fim.getMonth(), fim.getDate() - (dias - 1));
    if (ini < dataMinima(hoje)) return null;
    return resumir(ini, fim, filtros, hoje, selecao);
  }

  // dispositivos do parque (para o filtro "Dispositivo"), por código
  function dispositivos(hoje) {
    return base(hoje).parque.map((d) => ({ id: d.id, tipo: d.tipo })).sort((a, b) => a.id.localeCompare(b.id));
  }

  const FABRICANTES = [...new Set(TIPOS.flatMap((t) => t.marcas.map((m) => m.fab)))];
  const MODELOS = TIPOS.flatMap((t) => t.marcas.map((m) => m.modelo));
  // catálogo para os filtros em cascata (tipo > fabricante > modelo; sub área > corredor)
  const CATALOGO = {
    tipos: TIPOS.map((t) => ({ tipo: t.tipo, marcas: t.marcas.map((m) => ({ fab: m.fab, modelo: m.modelo })) })),
    subareas: SUBAREAS.map((s) => ({ n: s.n, corredores: [...s.corredores] })),
    semSubarea: "Sem sub área", semCorredor: "Sem corredor",
  };
  return { CATALOGO, resumir, resumirAnterior, selecaoVazia, SUBAREAS, CENTRO_MAPA, dataMinima, maximoDoEixo, dispositivos, ALARMES, FAIXAS, CRITICIDADES, PARQUE, DIAS_BASE, FABRICANTES, MODELOS, TIPOS: TIPOS.map((t) => t.tipo) };
})();

if (typeof module !== "undefined") module.exports = { MODELO };
