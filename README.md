# Zombie Game (protótipo estilo Dead Nation)

Twin-stick shooter top-down em **Phaser 3 + TypeScript + Vite**. Todos os assets são gerados em código:
nenhuma imagem ou áudio externo.

## Rodar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + build de produção
```

## Controles

| Ação | Teclado/Mouse | Gamepad |
|---|---|---|
| Mover | WASD | analógico esquerdo |
| Mirar | mouse | analógico direito |
| Atirar | botão esquerdo | analógico direito / R2 |
| Trocar arma | 1 / 2 / 3 ou roda do mouse | L1 / R1 |
| Reiniciar | R (após morrer) | |

## Estrutura

```
src/
  config.ts                     armas, zumbis e constantes (dados, não código)
  main.ts                       configuração do Phaser
  assets/pixelArt.ts            matrizes de sprites (jogador, zumbis) + paletas
  assets/proceduralTextures.ts  chão, carros, barril, projétil, decals, pickups
  audio/sfx.ts                  SFX procedurais (Web Audio)
  fx/FlashlightPipeline.ts      shader da lanterna (PostFX)
  entities/Zombie.ts            zumbi com pooling
  scenes/BootScene.ts           gera texturas e desbloqueia o áudio
  scenes/GameScene.ts           gameplay
  scenes/UIScene.ts             HUD (cena separada, fora do shader)
```

## Substituindo por arte final

Cada textura tem uma chave (`player`, `zombie_walker`, `car_red_h`...). Para trocar por PNG, carregue o
arquivo no `preload()` com a **mesma chave** e remova a geração correspondente em `generateAllTextures`.
Ajuste os raios de colisão em `config.ts` se o tamanho do sprite mudar.

## Próximos passos sugeridos

Flow field no lugar da perseguição direta, mapa no Tiled, mais tipos de zumbi (explosivo, spitter),
loja entre fases, co-op local (2 gamepads) ou online (Colyseus).
