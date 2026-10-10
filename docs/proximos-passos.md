# Próximos passos

Lista para uma IA executar **um passo por vez**. Não comece o passo seguinte se a validação do atual falhou.

A lista anterior (fogo que queima, dash, spitter, pontos que sobem do corpo, pouca vida, seta fora da tela, fumaça do carro e empurrão) está feita. Esta é a seguinte.

## Regras

- Código, nomes e comentários novos em inglês. Textos da tela continuam em português.
- Constantes de jogo ficam em `src/config.ts`. Não duplique números na cena.
- Não refaça o que já existe: flow field, rua, ondas, combo, laser, explosão de carro, lanterna com postes e fogo que queima, hit-stop, sangue que seca, pausa, recolhimento do respiro, bloater, recorde local, Start e A no gamepad, dash, spitter, texto `+N`, batimento da vida baixa, setas do HUD, fumaça do carro e empurrão.
- Recurso novo não nasce em `GameScene.ts` se couber num módulo que já existe (`combat`, `pickups`, `ai`, `fx`, `waves`). A cena continua abaixo de 600 linhas. Ela já está perto desse teto: uma chamada curta na cena, o resto no módulo.
- Não adicione co-op, Colyseus, Tiled, loja, lança-chamas, mina nem ranking online nesta lista.
- Não faça commit a menos que a pessoa peça.
- Cada passo termina com `npm test` e `npm run build` sem erro.

## Como validar no navegador

1. `npm run dev`
2. Abra o endereço que o Vite imprimir.
3. Clique em "clique para jogar".
4. Confira o comportamento descrito no passo. Um print da tela parada não basta: exercite a ação.

---

## Passo 1 — Marca do dash

**Objetivo.** O dash existe, mas depois do impulso não há como saber quando ele volta.

**Fazer.** Uma marca pequena no HUD, na `UIScene`, mostra o quanto falta da recarga que `DashState` já guarda. Não crie um segundo relógio. Recarga cheia: a marca some ou fica quieta. No meio: ela acompanha o restante. Pausa não avança esse restante, porque o dash já congela quando `velocity` não é chamado. Morrer ou reiniciar esconde a marca. Não mude `DASH_MS`, `DASH_SPEED`, Espaço nem o botão B.

**Não fazer.** Não crie outro PostFX. Não dê invulnerabilidade ao dash.

**Validação.** Teste: restante zero está pronto; restante igual à recarga está no começo; um valor no meio cai entre os dois. No jogo: dispare o dash e a marca aparece; Esc no meio não a completa; Esc de novo continua do mesmo ponto; quando ela acaba, Espaço dispara outro dash. `npm test` e `npm run build` passam.

**Pronto quando.** A marca e a recarga real concordam nos três momentos.

---

## Passo 2 — Spitter segura o cuspe

**Objetivo.** O globo sai no mesmo frame em que o spitter entra na distância.

**Fazer.** Antes do projétil, o spitter segura por `SPITTER_WINDUP_MS` em `config.ts`, menor que `SPITTER_COOLDOWN_MS`, e troca de cor. O projétil só nasce quando a espera acaba, o spitter ainda está ativo e ainda está na distância. Se ele sair da distância ou morrer no meio, o projétil não sai e a recarga do cuspe conta essa tentativa. Pausa congela a espera. Uma espera completa gera um projétil, não dois. Não mude velocidade, dano, vida nem o fato de o prédio segurar o globo.

**Validação.** Teste: espera incompleta não pede disparo; espera completa dentro da distância pede um; espera completa fora da distância ou com o spitter inativo não pede. No jogo: um spitter isolado muda de cor e só então cospe; saia da distância durante a cor e nada chega. `npm test` e `npm run build` passam.

**Pronto quando.** Os três casos do teste acontecem e o prédio continua segurando o globo que sai.

---

## Passo 3 — Caixa que se aproxima

**Objetivo.** A caixa caída no escuro só entra no inventário se o jogador pisar nela.

**Fazer.** Caixa ativa dentro de um raio em `config.ts`, menor que 120, anda na direção do jogador a uma velocidade também em `config.ts`. Só coleta no overlap que já existe. Vida cheia não puxa caixa de vida e não a destrói. Arma cheia não puxa a caixa dessa arma. Fora do raio, a caixa fica onde está. Pausa congela o deslize. O prazo de sumiço da caixa continua valendo.

**Não fazer.** Não puxe caixa do outro lado da rua. Não colete através de prédio.

**Validação.** Teste: dentro do raio e aceita, o passo chega mais perto; fora do raio, a posição não muda; tipo recusado, a posição não muda. No jogo: deixe uma caixa de SMG perto e ela vem; afaste-se além do raio e ela para; com a vida cheia, a caixa de vida não vem. Esc no meio deixa a caixa parada. `npm test` e `npm run build` passam.

**Pronto quando.** Os três casos do teste e os três gestos no jogo acontecem.

---

## Passo 4 — Horda em volta, não em cima

**Objetivo.** Vários zumbis ocupam o mesmo ponto do jogador.

**Fazer.** Zumbi ativo dentro de um raio do jogador, em `config.ts`, recebe um empurrão para fora, somado à direção que já tem, com teto de comprimento também em `config.ts`. Fora do raio, o empurrão é zero. Não substitui o flow field. Não empurra zumbi inativo. Brute em investida ou em preparação não recebe esse empurrão. Pausa já não roda a horda, então o empurrão também não roda.

**Não fazer.** Não empurre o jogador neste passo. O empurrão do jogador continua só no dano.

**Validação.** Teste: ponto dentro do raio devolve um vetor para fora, com comprimento até o teto; ponto fora devolve vetor zero. No jogo: dois walkers que alcançam o jogador não ficam no mesmo coordenada; um brute no meio da investida não é desviado para o lado. `npm test` e `npm run build` passam.

**Pronto quando.** O teste e os dois encontros no jogo acontecem.

---

## Passo 5 — Munição baixa

**Objetivo.** A SMG e a shotgun chegam a zero, fazem um clique e voltam para a pistola sem aviso.

**Fazer.** Abaixo de uma fração de `ammoMax` em `config.ts`, o número da munição no HUD muda de cor. A pistola, com munição infinita, não muda. Ao chegar a zero, o clique e a volta para a pistola continuam como hoje, e a cor volta ao normal junto com a pistola. Pegar munição até passar da fração restaura a cor. Não é animação com relógio: pausa não entra nisso.

**Não fazer.** Não mude os números de `WEAPONS` nem o tamanho do pickup.

**Validação.** Teste: acima da fração não avisa; abaixo avisa; munição infinita nunca avisa; zero de arma finita avisa. No jogo: gaste a SMG até o número mudar de cor; pegue munição de SMG até passar da fração e a cor volta; a pistola fica na cor de sempre. `npm test` e `npm run build` passam.

**Pronto quando.** Os quatro casos do teste e os três gestos no jogo acontecem.

---

## Passo 6 — Seta diz o tipo

**Objetivo.** Toda seta é da mesma cor, e um spitter fora da tela parece um walker.

**Fazer.** Cada tipo de zumbi tem uma cor de seta. A conta da borda, o teto e o sumiço continuam os que já existem em `offscreen-arrows`. Zumbi dentro da tela não ganha seta. Zumbi morto ou recolhido no respiro continua sem seta. As setas continuam na `UIScene`. Na pausa elas continuam visíveis e não giram.

**Não fazer.** Não aumente `OFFSCREEN_ARROW_CAP`. Não desenhe seta em cima de zumbi que já está na tela.

**Validação.** Teste: walker e spitter fora da tela, na mesma situação, devolvem cores diferentes; um ponto dentro da tela não devolve seta. No jogo: um spitter fora por uma borda e um walker fora por outra mostram duas cores; quando o spitter entra na tela, só a seta do walker fica. `npm test` e `npm run build` passam.

**Pronto quando.** As duas cores do teste aparecem no HUD e a seta do spitter some quando ele entra.

---

## Passo 7 — Corpo que fica

**Objetivo.** O abate vira sangue e o sprite some no mesmo frame.

**Fazer.** Cada abate deixa um corpo sem física no lugar da morte. Ele some depois de um tempo em `config.ts`. Não é zumbi: não dá ponto de novo, não ganha seta, não machuca, não bloqueia o flow field e não estoura como bloater. O fade só anda quando o mundo anda; na pausa o corpo fica. Zumbi só recolhido no respiro não deixa corpo. Reiniciar limpa os corpos. Um bloater morto estoura uma vez e deixa um corpo.

**Validação.** Teste: abate pede corpo; recolhimento do respiro não pede. Com o relógio parado, a transparência do corpo não muda. No jogo: mate um walker e o corpo fica; Esc no meio o segura; mate um bloater e há uma explosão e um corpo. `npm test` e `npm run build` passam.

**Pronto quando.** O abate deixa corpo, o respiro não deixa, e a pausa segura o que já está no chão.

---

## Passo 8 — Bloater incha

**Objetivo.** O bloater estoura, mas até o tiro fatal parece um zumbi comum.

**Fazer.** Abaixo de uma fração da vida máxima, em `config.ts`, e ainda vivo, o bloater fica maior que o tamanho normal. Acima da fração, tamanho normal. O tiro que mata continua estourando uma vez, pelo caminho que já existe. Se um único tiro leva a vida de cheia a zero, estoura uma vez também, sem ficar inchado depois de morto. Morrer cancela o inchaço. Não mude `BLOATER_BLAST_RADIUS` nem os danos da explosão.

**Não fazer.** Não faça o inchaço disparar uma segunda explosão.

**Validação.** Teste: vida acima da fração pede tamanho normal; vida abaixo e maior que zero pede inchado; vida zero não pede inchado. No jogo: atire num bloater até ele crescer e continuar vivo; o tiro seguinte estoura uma vez. `npm test` e `npm run build` passam.

**Pronto quando.** O teste separa os três estados e o bloater do jogo cresce antes do estouro.

---

## Fora desta lista

Não implementar agora: segundo jogador, rede, mapa em Tiled, loja, lança-chamas, mina, ranking online. Quando esta lista acabar, peça uma lista nova.
