# Zombie Game (protótipo estilo Dead Nation)

Twin-stick shooter top-down em **Phaser 3 + TypeScript + Vite**. Todos os assets são gerados em código:
nenhuma imagem ou áudio externo.

A partida acontece numa rua entre prédios. Cada onda solta uma horda finita. O respiro, com um cache no
centro, só começa quando essa horda acaba. O combo multiplica o score dos abates em sequência. A mira é um laser vermelho
que para no primeiro prédio, carro, barril ou zumbi. Carro destruído vira explosão de carro: dano em
área, fogo e alarme que puxa mais zumbis.

## Rodar

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # regras puras, sem abrir o Phaser
npm run build    # type-check + build de produção
```

## Controles

| Ação | Teclado/Mouse | Gamepad |
|---|---|---|
| Mover | WASD | analógico esquerdo |
| Mirar | mouse | analógico direito |
| Atirar | botão esquerdo | analógico direito / R2 |
| Trocar arma | segure Q e aponte, ou 1–5, ou a roda | segure Y e o analógico direito, ou L1 / R1 |
| Pausar | Esc | Start |
| Reiniciar | R (após morrer) | A (após morrer) |

## Estrutura

```
src/
  config.ts                     armas, zumbis, ondas e constantes (dados, não código)
  main.ts                       configuração do Phaser
  ai/flow-field.ts              campo de fluxo em volta de prédios, carros e barris
  ai/horde.ts                   separação, sombra e direção da horda
  combat/laser-sight.ts         mira laser
  combat/explosions.ts          barril, carro, bloater e corrente
  pickups/drops.ts              caixas, vida e cache do respiro
  waves/wave-director.ts        luta, respiro, modificador da onda e tipo do spawn
  world/street.ts               prédios, carros da guia, barris e postes
  world/street-view.ts          coloca a rua na cena
  spawn/offscreen-point.ts      spawn na rua, fora da câmera
  assets/pixel-frames.ts        matrizes de sprites (parado, passo, morte) + paletas
  assets/pixelArt.ts            pinta essas matrizes no Phaser
  assets/proceduralTextures.ts  chão, carros, barril, projétil, decals, pickups
  audio/sfx.ts                  SFX procedurais (Web Audio, compressor)
  fx/FlashlightPipeline.ts      shader da lanterna (PostFX)
  entities/Zombie.ts            zumbi com pooling e investida do brute
  scenes/BootScene.ts           gera texturas e desbloqueia o áudio
  scenes/GameScene.ts           gameplay
  scenes/UIScene.ts             HUD (cena separada, fora do shader)
```

## Substituindo por arte final

Cada textura tem uma chave (`player`, `zombie_walker`, `car_red_h`...). O passo e a morte usam essa chave
com sufixo `_step` e `_dead`. Para trocar por PNG, carregue o arquivo no `preload()` com a **mesma chave**
e remova a geração correspondente em `generateAllTextures`.
Ajuste os raios de colisão em `config.ts` se o tamanho do sprite mudar.

## Próximos passos

A lista executável está em [docs/proximos-passos.md](docs/proximos-passos.md).
