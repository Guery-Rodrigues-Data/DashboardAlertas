# Dashboard de Alertas — protótipo navegável

Site estático, sem build. Rode `_serve.ps1` (porta 8748, aparece no Painel de Protótipos) ou abra `index.html` direto. Rotas por hash:
`#/dispositivo`, `#/alarme`, `#/regiao`.

**Fonte visual:** Figma "Dash" (`v67Nif9g0hFtbPJbXgfIDH`), página com três seções (história 128759):

| Tela | Frame Web (1440 px) |
|---|---|
| Dispositivo | `51:5728` |
| Alarme | `51:4471` |
| Região | `51:3053` |

Só as versões **Web** foram implementadas. Os frames APP (375 px) e mobile (390 px, ocultos no Figma) ficaram de fora.

## O que funciona
- Abas Dispositivo / Alarme / Região.
- Botão de **data**: atalhos (Hoje, 7, 30 e 90 dias) e calendário com período (2 cliques, Aplicar). Não existe no Figma. **Na aba Dispositivo, muda os números** (ver abaixo); nas abas Alarme e Região só troca o rótulo.
- Botão **Filtros**: 4 campos tipo "select" (Criticidade, Alarmes, Tipo de dispositivo, Dispositivo). Cada um mostra um resumo ("Todos (10)", "Crítico, Alta", "3 de 10 selecionados") e, ao clicar, abre a lista com busca (só um aberto por vez). Padrão: tudo marcado. **Exceção — Dispositivo** (545 opções): vazio = todos; marcar itens restringe a eles; a lista vem ordenada pelos que mais falharam no período, com a contagem. Restaurar padrão / Cancelar / Aplicar; o botão mostra quantos campos estão restringidos. Não existe no Figma. **Na aba Dispositivo, filtra os números**; nas outras só guarda a escolha.
- Paginação "Pág 1 / 3" das listas (Top Sub Áreas, Top Corredores, Top Dispositivos, Tipo, Fabricante).
- Matriz da Região alterna **Sub área / Corredor**.
- **Gráficos de linhas** (Volume de Alarmes / Volume de Erros): hover mostra linha vertical, pontos e uma caixa com o dia e os 4 valores; ao sair, volta ao ponto de 25/07 (o destacado no Figma).
- **Gráficos de volume — alternância "Por criticidade | Total"** (canto do cartão, vale nas abas Alarme e Dispositivo): Total é uma linha só, com eixo próprio; no hover mostra o total e a composição por criticidade. É alternância, e não uma 5ª linha, porque o total esticaria o eixo e achataria as outras quatro. A legenda fica embaixo do gráfico. Não existe no Figma.

## O que é mock
- **Página 1 de cada lista e todos os números dos cartões** vêm do Figma.
- **Páginas 2 e 3 das listas** não existem no Figma: valores inventados (`mock: true` em `assets/data.js`).
- **Matriz de Região, aba Corredor**: o Figma só desenha "Sub área"; os números foram reaproveitados.
- **Data e Filtros**: popovers desenhados aqui (o Figma só traz os botões e, em Alarme, um `dtp-modal` cru). Abrem nas três telas.
- `w` das barras são larguras decorativas copiadas do Figma, não proporcionais ao valor.

- **Gráficos de linhas**: refeitos como SVG próprio (os SVGs do Figma, esticados, deformavam linhas e bolinhas em tela larga). Os 17 pontos por série vêm das curvas do Figma reamostradas (`DASH.volume`) — mock; a escala 0–10 e o eixo seguem o Figma.

## Pontos do Figma mantidos como estão (provável placeholder)
"Súbtítulo de explicação" (grafia), "140falhas" (sem espaço), colunas "Subtensão Elétrica" ×3 e ids
repetidos (DEV-1145 ×3, DET-8821 ×2) nas matrizes, "35 ~ 35%" em todas as linhas de Tipo de
dispositivo, "Hikvision" duas vezes em Fabricante, lista Top Alarmes repetida (10 linhas, 5 distintas).

## Assets
`assets/img/<origem>-<hash>.<ext>`: exportados do Figma em 02/10/2026 (as URLs do Figma expiram em
7 dias, por isso estão locais). O prefixo diz de qual bloco veio — duas pizzas têm o mesmo nome de
arquivo no Figma e conteúdo diferente.

## Ajustes de encaixe em tela larga (diferem do Figma de propósito)
- Largura **fluida** (o Figma é 1440 px fixo); testado em mente para ~1920 px.
- Altura dos gráficos de linha **190 px** (Figma: 226 px) — variável `--chart-h` em `styles.css`.
- Alarme: "Top Alarmes" e "Duração Média" mostram **5 linhas** (o Figma repete as mesmas 5 duas vezes).
- Região: o mapa estica até a altura da lista (Figma: 751 px fixo) e a imagem escala com a largura.
- Cartões de pizza com largura em `clamp()` em vez de 380/580 px fixos.

## Subtítulos dos cartões (`DASH.subtitulos` em `data.js`)
Substituem o placeholder "Súbtítulo de explicação" do Figma. O texto é proposta; as definições abaixo **não estão validadas** com dev/operação:
- "Alarmes do período" (Criticidade): conta alarmes **abertos** no período ou alarmes **ativos agora**?
- "Tempo médio que cada tipo de alarme permanece ativo": abertura → encerramento? Alarmes ainda abertos entram?
- "Tempo de uso do dispositivo" (faixa de idade): contado da instalação? Existe esse campo no cadastro?
- "Participação ... no total de falhas": percentual sobre falhas ou sobre dispositivos?
- Todos usam "no período", que acompanha o botão de data.

## Aba Dispositivo dinâmica (`assets/modelo.js`)
Os números da aba Dispositivo **não são mais copiados do Figma**: saem de uma base simulada (545 dispositivos, ~5,7 falhas/dia, últimos 365 dias) e mudam com o período e os filtros. Tudo sai da mesma base, por isso **os totais batem**: total de falhas = soma da pizza de idade = soma de Tipo = Fabricante = Modelo = série do gráfico.
- As falhas de um dia são sempre as mesmas (a semente depende da data): voltar a um período mostra o mesmo resultado.
- Variação (seta + %): compara com o período anterior de mesmo tamanho. A seta mostra o sentido real; a cor diz se é bom ou ruim (**mais falhas = vermelho**, menos = verde). Sem período anterior na base, não aparece.
- Gráfico: por hora se o período tem até 2 dias; por dia nos demais. Eixo Y e datas se ajustam.
- Listas (Top Dispositivos, Tipo, Fabricante, Modelo): paginam conforme o resultado. Sem falhas, mostram "Sem falhas no período selecionado".
- Matriz: 7 dispositivos com mais falhas x 7 alarmes mais frequentes do período, **em ordem decrescente** (a 1ª linha é o dispositivo com mais falhas e a 1ª coluna o alarme mais frequente); cor da célula pela proporção do maior valor da matriz. Observação: a ordem das linhas é pelas falhas totais do dispositivo, não pela soma só das 7 colunas exibidas.
- Calendário bloqueia dias futuros e dias antes do início da base (365 dias).

**Definições NÃO validadas** (decididas no protótipo para os números fecharem):
- "Alarmes de Maior Ocorrência": nº de falhas do alarme mais frequente; o subtítulo mostra o nome do alarme (no Figma o subtítulo era "Falhas por equipamento", que não explica o 38).
- "Média Diária": média de dispositivos distintos com falha por dia.
- "% do parque afetado": dispositivos com falha / 545.
- "Faixa de Idade Crítica": faixa de idade com mais falhas; variação = falhas dessa faixa vs período anterior.
- Criticidade de cada alarme é decisão do protótipo (ex.: Falha no PCD = Crítico).
- Os números NÃO são calibrados com dado real: o total de 30 dias (~170–200) só foi escolhido para parecer com o Figma.
