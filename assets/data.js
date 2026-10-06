/* ==========================================================================
   Dados do protótipo. Tudo MOCK.
   - Página 1 de cada lista e todos os números dos cartões são copiados do Figma (frames *-Web).
   - Páginas 2 e 3 das listas paginadas ("Pág 1 / 3") NÃO existem no Figma: valores inventados só
     para a paginação funcionar. Marcadas com `mock: true`.
   - `w` é a largura da barra em % da trilha (medida dos px do Figma / largura da trilha), não
     é proporcional ao valor — o design usa larguras decorativas. `c` é a cor do degradê.
   ========================================================================== */

const DASH = {};

/* ---------- Região ---------- */
DASH.regiao = {
  kpis: [
    { titulo: "Total de Alarmes", valor: "384", trend: { tom: "ok", txt: "14,3%" }, sub: "Falhas em 4 regiões diferentes" },
    { titulo: "Sub Área mais crítica", valor: "Zona Leste", trend: { tom: "ok", txt: "14,3%" }, sub: "140falhas (37% do total da cidade)" },
    { titulo: "Corredor mais afetado", valor: "Av. Brasil", trend: { tom: "bad", txt: "5,8%" }, sub: "48 falhas registradas no período" },
  ],
  subareas: [
    [
      { n: "Zona Leste", ativos: 233, f: 64, w: 75, c: "b-error" },
      { n: "Zona Sul", ativos: 233, f: 36, w: 60.5, c: "b-orange" },
      { n: "Zona Norte", ativos: 233, f: 25, w: 49.5, c: "b-warning" },
      { n: "Zona Oeste", ativos: 233, f: 22, w: 45.4, c: "b-warning" },
      { n: "Centro Histórico", ativos: 233, f: 11, w: 31.9, c: "b-info" },
    ],
    [ // mock
      { n: "Zona Nordeste", ativos: 198, f: 9, w: 24, c: "b-info", mock: true },
      { n: "Zona Sudeste", ativos: 176, f: 8, w: 21, c: "b-info", mock: true },
      { n: "Zona Noroeste", ativos: 154, f: 6, w: 17, c: "b-info", mock: true },
      { n: "Zona Sudoeste", ativos: 141, f: 5, w: 14, c: "b-info", mock: true },
      { n: "Distrito Industrial", ativos: 88, f: 3, w: 9, c: "b-info", mock: true },
    ],
    [ // mock
      { n: "Bairro Alto", ativos: 64, f: 2, w: 6, c: "b-info", mock: true },
      { n: "Cidade Industrial", ativos: 59, f: 2, w: 6, c: "b-info", mock: true },
      { n: "Santa Felicidade", ativos: 41, f: 1, w: 3, c: "b-info", mock: true },
    ],
  ],
  corredores: [
    [
      { n: "Corredor Av. Brasil", ativos: 233, f: 64, w: 75, c: "b-error" },
      { n: "Av. Linha Verde", ativos: 233, f: 36, w: 60.5, c: "b-orange" },
      { n: "Rótula Radial Leste", ativos: 233, f: 25, w: 49.5, c: "b-warning" },
      { n: "Av. Marechal", ativos: 233, f: 22, w: 45.4, c: "b-warning" },
      { n: "Av.Cruzeiro do Sul", ativos: 233, f: 11, w: 31.9, c: "b-info" },
    ],
    [ // mock
      { n: "Av. Sete de Setembro", ativos: 120, f: 9, w: 24, c: "b-info", mock: true },
      { n: "Av. Visconde de Guarapuava", ativos: 96, f: 8, w: 21, c: "b-info", mock: true },
      { n: "Rua XV de Novembro", ativos: 88, f: 6, w: 17, c: "b-info", mock: true },
      { n: "Av. Iguaçu", ativos: 77, f: 5, w: 14, c: "b-info", mock: true },
      { n: "Av. Silva Jardim", ativos: 61, f: 3, w: 9, c: "b-info", mock: true },
    ],
    [ // mock
      { n: "Av. Mal. Floriano", ativos: 55, f: 2, w: 6, c: "b-info", mock: true },
      { n: "Av. Presidente Kennedy", ativos: 49, f: 2, w: 6, c: "b-info", mock: true },
      { n: "Rua Padre Anchieta", ativos: 38, f: 1, w: 3, c: "b-info", mock: true },
    ],
  ],
  colunas: [
    { t: "Falha Sincronia GPS" }, { t: "Subtensão Elétrica" }, { t: "Sem Comunicação / Offline" },
    { t: "Subtensão Elétrica" }, { t: "Semáforo Piscante Amarelo", py8: false }, { t: "Porta Gabinete Aberta", py8: true },
    { t: "Subtensão Elétrica", b11: true, py8: true },
  ],
  // tom: d = escuro, m = médio, l = claro (cores copiadas célula a célula do Figma; não derivam do valor)
  matrizSubarea: [
    ["Zona Leste", [[30, "d"], [3, "m"], [26, "d"], [6, "l"], [12, "m"], [3, "l"], [2, "l"]]],
    ["Zona Sul", [[4, "m"], [30, "l"], [3, "l"], [27, "d"], [4, "m"], [1, "l"], [4, "m"]]],
    ["Zona Norte", [[4, "d"], [30, "m"], [3, "m"], [27, "l"], [4, "d"], [1, "l"], [4, "d"]]],
    ["Zona Oeste", [[4, "m"], [30, "d"], [3, "l"], [27, "m"], [4, "l"], [1, "d"], [4, "l"]]],
    ["Centro Histórico", [[4, "l"], [30, "m"], [3, "m"], [27, "l"], [4, "l"], [1, "m"], [4, "d"]]],
  ],
  // MOCK: o Figma só desenha a aba "Sub área". Corredor reaproveita os mesmos números.
  matrizCorredor: [
    ["Corredor Av. Brasil", [[30, "d"], [3, "m"], [26, "d"], [6, "l"], [12, "m"], [3, "l"], [2, "l"]]],
    ["Av. Linha Verde", [[4, "m"], [30, "l"], [3, "l"], [27, "d"], [4, "m"], [1, "l"], [4, "m"]]],
    ["Rótula Radial Leste", [[4, "d"], [30, "m"], [3, "m"], [27, "l"], [4, "d"], [1, "l"], [4, "d"]]],
    ["Av. Marechal", [[4, "m"], [30, "d"], [3, "l"], [27, "m"], [4, "l"], [1, "d"], [4, "l"]]],
    ["Av.Cruzeiro do Sul", [[4, "l"], [30, "m"], [3, "m"], [27, "l"], [4, "l"], [1, "m"], [4, "d"]]],
  ],
};

/* ---------- Alarme ---------- */
DASH.alarme = {
  criticidade: [
    { n: "Crítico", v: 106, cor: "#b3261e", dot: "8d212" },
    { n: "Alta", v: 29, cor: "#e94600", dot: "0b325" },
    { n: "Média", v: 78, cor: "#e39610", dot: "50aa1" },
    { n: "Baixa", v: 32, cor: "#0f66b3", dot: "82727" },
  ],
  pizzaLabels: [["10%", 127, 132], ["52%", 0, 0], ["21%", 0, 111], ["17%", 156, 20]],
  topAlarmes: [
    { n: "Falha na comunicação", f: 168, w: 73, c: "b-error", vermelho: true },
    { n: "Porta aberta", f: 84, w: 55.2, c: "b-orange" },
    { n: "Queima total do vermelho", f: 16, w: 21.2, c: "b-info" },
    { n: "Falha na Ativação do Relé", f: 28, w: 30.8, c: "b-warning" },
    { n: "Falha no PCD", f: 72, w: 40.5, c: "b-orange" },
    { n: "Falha na comunicação", f: 168, w: 73, c: "b-error", vermelho: true },
    { n: "Porta aberta", f: 84, w: 55.2, c: "b-orange" },
    { n: "Queima total do vermelho", f: 16, w: 21.2, c: "b-info" },
    { n: "Falha na Ativação do Relé", f: 28, w: 30.8, c: "b-warning" },
    { n: "Falha no PCD", f: 72, w: 40.5, c: "b-orange" },
  ],
  // O Figma repete as mesmas linhas de "Top Alarmes" e usa "28 min" só na primeira linha.
  duracao: [
    { n: "Falha na comunicação", v: 28, u: "min", w: 73, c: "b-error", vermelho: true },
    { n: "Porta aberta", v: 84, u: "falhas", w: 55.2, c: "b-orange" },
    { n: "Queima total do vermelho", v: 16, u: "falhas", w: 21.2, c: "b-info" },
    { n: "Falha na Ativação do Relé", v: 28, u: "falhas", w: 30.8, c: "b-warning" },
    { n: "Falha no PCD", v: 72, u: "falhas", w: 40.5, c: "b-orange" },
    { n: "Falha na comunicação", v: 168, u: "falhas", w: 73, c: "b-error", vermelho: true },
    { n: "Porta aberta", v: 84, u: "falhas", w: 55.2, c: "b-orange" },
    { n: "Queima total do vermelho", v: 16, u: "falhas", w: 21.2, c: "b-info" },
    { n: "Falha na Ativação do Relé", v: 28, u: "falhas", w: 30.8, c: "b-warning" },
    { n: "Falha no PCD", v: 72, u: "falhas", w: 40.5, c: "b-orange" },
  ],
};

/* Eixo X e séries do gráfico de linhas (iguais nas telas Alarme e Dispositivo). */
DASH.eixoX = ["01/07", "03/07", "05/07", "07/07", "09/07", "11/07", "13/07", "15/07", "17/07", "19/07", "21/07", "23/07", "25/07", "27/07", "29/07", "31/07", "02/08"];
DASH.eixoY = [10, 8, 6, 4, 2, 0];

/* Volume diário (17 pontos, um por rótulo de DASH.eixoX). MOCK: curvas do Figma reamostradas; mesma série nas telas Alarme e Dispositivo. */
DASH.volume = {"crit": [3.4, 4.4, 4.3, 4.7, 6.0, 5.4, 6.4, 6.6, 6.2, 7.6, 6.9, 7.3, 7.9, 7.0, 8.4, 7.3, 5.7], "alta": [1.6, 2.2, 2.8, 3.2, 3.6, 2.9, 3.5, 3.7, 3.6, 4.4, 3.8, 4.2, 4.7, 4.1, 4.9, 4.1, 2.8], "media": [5.3, 5.9, 5.2, 5.6, 7.8, 6.8, 8.1, 8.2, 7.5, 8.3, 6.5, 6.4, 7.0, 6.6, 7.5, 6.0, 4.0], "baixa": [0.6, 1.1, 0.8, 0.9, 1.8, 1.3, 1.5, 1.4, 1.2, 2.0, 1.4, 1.4, 1.5, 0.9, 1.3, 0.9, 0.2]};

/* Subtítulos dos cartões (a linha pequena abaixo do título). No Figma é o placeholder "Súbtítulo de explicação".
   Texto proposto — as DEFINIÇÕES por trás (o que conta, de quando a quando) NÃO estão validadas, ver README. */
DASH.subtitulos = {
  criticidade: "Alarmes do período por nível de criticidade",
  volumeAlarmes: "Alarmes no período, separados por criticidade",
  topAlarmes: "Quantas vezes cada tipo de alarme ocorreu no período, do mais para o menos frequente. Passe o mouse para ver os dispositivos; clique para listar todos",
  duracao: "Tempo médio que cada ocorrência de cada tipo de alarme permanece ativa",
  regioes: "Sub áreas e corredores com maior concentração de falhas no período.",
  porSubarea: "Falhas e dispositivos ativos em cada sub área, da que mais falha para a que menos",
  porCorredor: "Falhas e dispositivos ativos em cada corredor, do que mais falha para o que menos",
  duracaoMax: "Maior duração de uma única ocorrência de cada alarme no período",
  volumeErros: "Falhas de dispositivos no período; passe o mouse para ver quais dispositivos falharam",
  topDispositivos: "Falhas de cada dispositivo no período, do maior para o menor",
  faixaIdade: "Falhas agrupadas pelo tempo de uso do dispositivo",
  tipoDispositivo: "Participação de cada tipo de dispositivo no total de falhas",
  fabricante: "Participação de cada fabricante no total de falhas",
  modelo: "Modelos com mais falhas, com o fabricante de cada um",
};
