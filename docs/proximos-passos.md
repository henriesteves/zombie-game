# Próximos passos

Lista para uma IA executar **um passo por vez**. Não comece o passo seguinte se a validação do atual falhou.

A lista anterior (pausa, respiro que recolhe a horda, laser, bloater, recorde, gamepad e partição da cena) está feita. Esta é a seguinte.

## Regras

- Código, nomes e comentários novos em inglês. Textos da tela continuam em português.
- Constantes de jogo ficam em `src/config.ts`. Não duplique números na cena.
- Não refaça o que já existe: flow field, rua, ondas, combo, laser, explosão de carro, lanterna com postes e fogo visual, hit-stop, sangue que seca, pausa, recolhimento do respiro, bloater, recorde local, Start e A no gamepad.
- Recurso novo não nasce em `GameScene.ts` se couber num módulo que já existe (`combat`, `pickups`, `ai`, `fx`, `waves`). A cena continua abaixo de 600 linhas.
- Não adicione co-op, Colyseus, Tiled, loja, lança-chamas, mina nem ranking online nesta lista.
- Não faça commit a menos que a pessoa peça.
- Cada passo termina com `npm test` e `npm run build` sem erro.

## Como validar no navegador

1. `npm run dev`
2. Abra o endereço que o Vite imprimir.
3. Clique em "clique para jogar".
4. Confira o comportamento descrito no passo. Um print da tela parada não basta: exercite a ação.

---

## Passo 1 — Fogo que queima

**Objetivo.** O carro destruído acende um fogo, mas ele só ilumina. Quem fica em cima não perde vida.

**Fazer.** Enquanto o fogo existe, zumbi e jogador dentro de um raio menor que `CAR_BLAST_RADIUS` perdem vida em ticks. O tick e o dano ficam em `config.ts`, menores que `CAR_ZOMBIE_DAMAGE` e `CAR_PLAYER_DAMAGE`. Não dispara alarme, não cria outro carro e não conta um abate extra além do que `killZombie` já faz. Um bloater que morre no fogo estoura uma vez, como qualquer outra morte. Na pausa o fogo não ticka. Ao apagar, o dano para.

**Não fazer.** Não mude o raio da explosão do carro nem a duração visual que já existe.

**Validação.** Teste: um ponto dentro do raio do fogo é atingido; um ponto fora não é. No jogo: estoure um carro, fique na chama e a vida desce; saia e ela para. Um zumbi parado na chama perde vida. `npm test` e `npm run build` passam.

**Pronto quando.** Os dois pontos do teste e os dois gestos no jogo acontecem.

---

## Passo 2 — Dash

**Objetivo.** O jogador não tem como sair de um cerco além de andar.

**Fazer.** Espaço no teclado e o botão da direita do gamepad (B / Circle) disparam um impulso na direção do movimento. Se estiver parado, o impulso segue a mira. Dura pouco, tem recarga, e mostra um rastro curto. Não dispara durante a pausa, a morte, a recarga ou um hit-stop. A pausa congela o impulso que já começou; ao soltar, o tempo restante continua. Morrer no meio cancela. R no restart não deixa o dash preso.

**Não fazer.** Não dê invulnerabilidade. Não use o analógico direito: ele continua sendo mira e tiro.

**Validação.** No jogo: segure uma direção, aperte Espaço, e o deslocamento nesse instante é maior que o passo normal. Aperte de novo na hora: não sai outro. Esc no meio para o corpo; Esc de novo completa o resto. Sem controle, o teclado basta. `npm run build` passa.

**Pronto quando.** Os três gestos acontecem e o tiro no analógico direito não virou dash.

---

## Passo 3 — Zumbi que cospe

**Objetivo.** Falta um tipo que ameaça à distância.

**Fazer.** Quinto tipo, `spitter`, com textura própria em `pixelArt.ts`. Mais lento que o runner, para fora do contato e solta um projétil lento na direção do jogador. O projétil machuca só o jogador, some no impacto ou no fim da vida, e não atravessa prédio. Não é bala das armas e não estoura como bloater. Só entra no spawn a partir da onda 4, com chance baixa, e nunca no respiro.

**Validação.** Teste de `pickSpawnKind` ou da função nova: onda 3 nunca devolve `spitter`; onda 4 com o roll da faixa dele devolve `spitter`; respiro não devolve. No jogo: um spitter isolado acerta o jogador sem encostar; um prédio no meio segura o projétil. `npm test` e `npm run build` passam.

**Pronto quando.** Os três casos acontecem.

---

## Passo 4 — Pontos que sobem do corpo

**Objetivo.** O combo muda o score, mas o número some no canto.

**Fazer.** Cada abate solta um texto `+N` na posição do zumbi. `N` é o que entrou no score naquele abate, já com o multiplicador do combo, sem somar de novo. O texto sobe e some. Na pausa ele congela; ao continuar, termina o movimento. Não aparece para zumbi só recolhido no respiro.

**Validação.** Mate um zumbi de 10 pontos sem combo: aparece `+10` e o score sobe 10, não 20. Mate outro dentro da janela do combo: o texto mostra o valor multiplicado. Esc no meio deixa o texto parado. `npm run build` passa.

**Pronto quando.** Os dois números batem com o score e a pausa segura o texto.

---

## Passo 5 — Pouca vida

**Objetivo.** A barra fica vermelha, mas a partida não avisa que a morte está perto.

**Fazer.** Abaixo de um limite em `config.ts`, a barra do HUD pulsa e um batimento toca em intervalo. Quanto menor a vida, mais rápido o intervalo, com um piso. Acima do limite, o som para. Morrer ou curar para cima do limite para na hora. Pausa suspende o som; soltar a pausa não dispara um batimento extra.

**Não fazer.** Não crie outro PostFX. O pulso fica na barra que já existe em `UIScene`.

**Validação.** No jogo: desça a vida até o limite e o batimento começa; pegue vida até passar do limite e ele para. Esc cala; Esc de novo não solta dois batimentos juntos. `npm run build` passa.

**Pronto quando.** Os três gestos acontecem.

---

## Passo 6 — Seta para zumbi fora da tela

**Objetivo.** A horda chega pelas costas e a lanterna não mostra.

**Fazer.** Para cada zumbi ativo fora do retângulo da câmera, uma seta na borda do HUD aponta para ele. Teto de setas ao mesmo tempo, constante em `config.ts`. Zumbi dentro da tela não ganha seta. Zumbi morto ou recolhido no respiro perde a seta. As setas ficam na `UIScene`, para a lanterna não apagá-las. Na pausa elas continuam visíveis e não giram, porque os zumbis não andam.

**Validação.** No jogo: deixe um zumbi sair da tela e a seta aparece na borda correspondente; quando ele entra na tela, a seta some. Recolha a horda no respiro e as setas dos que sumiram somem junto. `npm run build` passa.

**Pronto quando.** Os dois gestos acontecem e a seta continua legível no escuro.

---

## Passo 7 — Carro avisa antes de estourar

**Objetivo.** O carro explode nos `CAR_HITS`, mas até lá parece inteiro.

**Fazer.** A partir de um limiar de acertos, menor que `CAR_HITS` e declarado em `config.ts`, o carro solta fumaça. A explosão, o alarme e o loot continuam no mesmo acerto de hoje. Fumaça não dá dano. Carro destruído não fica fumegando por cima da explosão.

**Validação.** Teste: abaixo do limiar a função não pede fumaça; no limiar pede; em `CAR_HITS` ainda é explosão, não só fumaça. No jogo: atire até a fumaça aparecer e o carro continuar inteiro; mais tiros estouram como antes. `npm test` e `npm run build` passam.

**Pronto quando.** O teste e os tiros no carro batem com esses dois momentos.

---

## Passo 8 — Empurrão ao levar dano

**Objetivo.** O zumbi encosta e a vida desce, mas o corpo não sai do lugar.

**Fazer.** Dano de zumbi, explosão e fogo empurra o jogador para longe da origem do dano por um impulso curto. Um empurrão novo substitui o anterior; não soma velocidade até lançar o jogador no infinito. Pausa congela o impulso. Morte zera. Dash e empurrão no mesmo instante: o empurrão vence.

**Não fazer.** Não empurre o jogador quando a vida não desce (cura, pickup recusado, dano zero).

**Validação.** No jogo: deixe um zumbi encostar e o jogador se afasta dele. Estoure um barril ao lado e o jogador sai do centro da explosão. Cure com a vida cheia: não há empurrão. `npm run build` passa.

**Pronto quando.** Os três casos acontecem e o jogador não atravessa o mapa num único hit.

---

## Fora desta lista

Não implementar agora: segundo jogador, rede, mapa em Tiled, loja, lança-chamas, mina, ranking online. Quando esta lista acabar, peça uma lista nova.
