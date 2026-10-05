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
- Paginação "Pág 1 / 3" das listas (Top Sub Áreas, Top Corredores, Falhas por Dispositivo, Tipo, Fabricante).
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
dispositivo, "Hikvision" duas vezes em Fabricante, lista Ocorrências por Alarme repetida (10 linhas, 5 distintas).

## Assets
`assets/img/<origem>-<hash>.<ext>`: exportados do Figma em 02/10/2026 (as URLs do Figma expiram em
7 dias, por isso estão locais). O prefixo diz de qual bloco veio — duas pizzas têm o mesmo nome de
arquivo no Figma e conteúdo diferente.

## Ajustes de encaixe em tela larga (diferem do Figma de propósito)
- Largura **fluida** (o Figma é 1440 px fixo); testado em mente para ~1920 px.
- Altura dos gráficos de linha **190 px** (Figma: 226 px) — variável `--chart-h` em `styles.css`.
- Alarme: "Ocorrências por Alarme" e "Duração Média" mostram **5 linhas** (o Figma repete as mesmas 5 duas vezes).
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
- Gráfico "Volume de Erros": **uma linha só, o Total** (sem toggle e sem legenda; a criticidade fica no filtro e não no gráfico). Por hora se o período tem até 2 dias; por dia nos demais. Eixo Y e datas se ajustam. **O hover lista os dispositivos que falharam naquele dia** (até 6, com tipo e nº de falhas; o resto vira "+ N dispositivos"), e a soma da lista é igual ao total do ponto. O toggle "Por criticidade / Total" existe só na aba Alarme.
- Pizza de faixa de idade (SVG próprio): **o % só aparece ao passar o mouse na fatia** (a legenda ao lado já traz o percentual); as outras fatias esmaecem. A pizza de Criticidade da aba Alarme é imagem do Figma e continua com os % fixos.
- Listas (Falhas por Dispositivo, Tipo, Fabricante, Modelo): paginam conforme o resultado. Sem falhas, mostram "Sem falhas no período selecionado".
- Matriz: lista **todos os dispositivos com falha**, do que mais falha para o que menos falha, **paginada de 7 em 7**, contra os 7 alarmes mais frequentes do período (também em ordem decrescente), + colunas **Outros alarmes** e **Total**. A conta de cada dispositivo fecha (células + Outros alarmes = Total, igual ao Falhas por Dispositivo). **As colunas de alarme são ordenadas pelos valores das linhas da página, de cima para baixo**: a 1ª coluna é o alarme que mais deu no dispositivo da 1ª linha (o que mais falha), e empate desempata pela 2ª linha, e assim por diante; a 1ª linha fica em ordem decrescente da esquerda para a direita. **Colunas sem nenhuma falha nos dispositivos da página não aparecem** (nem "Outros alarmes" quando vazio; "Total" sempre fica). A ordem e o conjunto de colunas mudam ao paginar (as 7 colunas escolhidas continuam sendo os 7 alarmes mais frequentes do período inteiro). O mapa de calor usa o maior valor de todas as páginas, então a cor é comparável entre páginas; Outros alarmes e Total são cinza. Não há linha de Total nem "Outros dispositivos". **Hover em "Outros alarmes"**: no cabeçalho, lista os demais alarmes do período inteiro; na célula de um dispositivo, lista os alarmes dele que ficaram fora das 7 colunas, com a contagem (a soma é o número da célula).
- Calendário bloqueia dias futuros e dias antes do início da base (365 dias).

**Definições NÃO validadas** (decididas no protótipo para os números fecharem):
- "Alarmes de Maior Ocorrência": nº de falhas do alarme mais frequente; o subtítulo mostra o nome do alarme (no Figma o subtítulo era "Falhas por equipamento", que não explica o 38).
- "Média Diária": média de dispositivos distintos com falha por dia.
- "% do parque afetado": dispositivos com falha / 545.
- "Faixa de Idade Crítica": faixa de idade com mais falhas; variação = falhas dessa faixa vs período anterior.
- Criticidade de cada alarme é decisão do protótipo (ex.: Falha no PCD = Crítico).
- Os números NÃO são calibrados com dado real: o total de 30 dias (~170–200) só foi escolhido para parecer com o Figma.

## Seleção por clique (aba Dispositivo)
Clicar na tela filtra o resto dela na hora (como em ferramentas de BI): **Tipo de dispositivo, Fabricante, Modelo, Falhas por Dispositivo, fatias da pizza (e itens da legenda), nome do dispositivo na matriz e título de alarme na matriz**.
- Clique de novo no mesmo item = limpa; **Ctrl/Cmd+clique** = seleciona vários. A barra "Seleção" no topo mostra o que está ativo, cada item removível, e "Limpar seleção".
- O cartão de onde veio o clique **continua mostrando todas as opções**, com a escolhida em destaque (as outras esmaecem), para dar para trocar. Os demais cartões (números, gráfico, outras listas) passam a refletir só a seleção. A matriz funciona assim para dispositivo e alarme.
- É **independente do painel Filtros**: o painel restringe a tela toda; a seleção por clique restringe os outros cartões. As duas valem ao mesmo tempo.
- Os percentuais de cada lista são sobre o total dela com as demais seleções aplicadas (sem a própria).

## Aba Alarme dinâmica
Mesma base da aba Dispositivo (`assets/modelo.js`): **um alarme é uma falha**, então o "Total de Alarmes" daqui é igual ao "Total de falhas" de lá. Período, painel de Filtros e seleção por clique valem nas duas abas (a seleção é compartilhada: escolher um alarme aqui também filtra a aba Dispositivo).
- **Cartões:** Total de Alarmes (nº de tipos distintos), Média Diária (alarmes/dia), Alarme de Maior Ocorrência (nome + % do total) e Tempo Médio de Alarme Ativo (+ % dos alarmes com mais de 4h). Variação vs período anterior de mesmo tamanho (mais = vermelho).
- **Pizza de criticidade** (SVG; % no hover; clicar numa fatia filtra) e **Volume de Alarmes** com o toggle "Por criticidade | Total"; o hover mostra só a criticidade (no modo Total, o total e a composição por criticidade); por hora se o período é de até 2 dias.
- **Ocorrências por Alarme** (por nº de ocorrências) e **Duração Média de Alarmes** (maior para a menor, em "x h y min"): mostram **todos os tipos de alarme (hoje 10) de uma vez**, com paginação de **10 por página** (hoje aparece "Pág 1 / 1", igual aos cartões vizinhos; se o catálogo crescer, pagina sozinho); o cartão de duração ("Duração por Alarme") tem o toggle **Média | Total** (padrão Média): Média = quanto cada ocorrência demora; Total = média × ocorrências = onde o tempo foi gasto (mistura frequência e duração, então o ranking se parece mais com o Ocorrências por Alarme); clicar num alarme filtra a tela. O catálogo do backend tem ~30 tipos, então a paginação passa a valer quando a tela for ligada a ele.
- **Duração**: cada falha ganha uma duração simulada (exponencial, com média por tipo de alarme: de 28 min em Falha na comunicação a 380 min em Queima total do vermelho). **NÃO é dado real e a definição de "tempo ativo" não está validada** (abertura → encerramento? alarmes ainda abertos entram?).
- A matriz "Alarme" que existe oculta no Figma não foi implementada.

## Aba Região dinâmica
Mesma base (`assets/modelo.js`) com **regiões INVENTADAS** (só para ter uma ideia; não é o cadastro real): 10 sub áreas com centro em Curitiba (Centro Histórico, Zona Leste, Zona Sul…) e 12 corredores, e cada um dos 545 dispositivos recebe uma sub área, um corredor e coordenadas (sorteio com semente própria: nenhum número das outras abas mudou). Período, painel de Filtros e seleção por clique valem aqui também; **a seleção é compartilhada com as outras abas**.
- **Cartões:** Total de Alarmes (em quantas sub áreas), Sub Área mais crítica (e % do total da cidade) e Corredor mais afetado, com variação vs período anterior.
- **Falhas por Sub Área / Falhas por Corredor** (lado a lado com o mapa, numa linha só, sem o título "Regiões"; o mapa acompanha a altura das listas, ~370 px, e a matriz sobe) (antes "Top …": a lista mostra todas, não só as primeiras), paginadas de 5 em 5, com "• N Ativos" = dispositivos do cadastro na região (**definição não validada**). Clicar numa região filtra a tela. Dispositivo sem sub área ou corredor cadastrado aparece como "Sem sub área" / "Sem corredor" (as contas continuam fechando).
- **Mapa de calor de verdade:** Leaflet 1.9.4 + leaflet.heat (CDN unpkg) sobre o mapa-base Esri Light Gray (sem chave, igual ao cockpit). Precisa de internet. O calor é montado **só com a latitude/longitude e o nº de falhas de cada dispositivo**, sem usar sub área nem corredor (se a operação ainda não cadastrou as regiões, o mapa continua completo; dispositivo sem coordenada fica de fora do mapa). **Não há pontinhos de dispositivos**, só o calor, com as cores da legenda do Figma. O mapa **enquadra o calor** quando a seleção de região ou dispositivo muda. O mapa é criado uma vez e re-encaixado a cada desenho da tela, para não piscar.
- **Matriz Região x Alarme** (Sub área | Corredor): mesmas regras da matriz de Dispositivo (paginada, colunas ordenadas pela 1ª linha, colunas vazias escondidas, Outros alarmes/Total, hover em "Outros alarmes").
