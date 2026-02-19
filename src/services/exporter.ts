import { saveAs } from 'file-saver';
import type { GameConfig } from '../lib/templates';

export function exportGame(config: GameConfig, title: string = 'MyGame') {
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
  <style>
    body { margin:0; background:#000; overflow:hidden; }
    canvas { display:block; }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/phaser@3.80.0/dist/phaser.min.js"></script>
</head>
<body>
  <script>
    const gameConfig = ${JSON.stringify(config, null, 2)};

    const phaserConfig = {
      type: Phaser.AUTO,
      width: gameConfig.settings.width,
      height: gameConfig.settings.height,
      backgroundColor: gameConfig.settings.backgroundColor || '#4488AA',
      physics: {
        default: 'arcade',
        arcade: { gravity: { y: gameConfig.settings.gravity || 0 }, debug: false }
      },
      scene: {
        preload: function () {
          // Add asset loads based on config.entities (expand with real URLs)
          this.load.image('bird', 'https://labs.phaser.io/assets/sprites/yellowbird-midflap.png');
          this.load.image('pipe', 'https://labs.phaser.io/assets/sprites/pipe-green.png');
          // Add more dynamically if assets stored
        },
        create: function () {
          const scene = this;

          // Recreate entities from config
          gameConfig.entities.forEach(ent => {
            if (ent.type === 'sprite') {
              const sprite = scene.physics.add.sprite(ent.position?.x || 400, ent.position?.y || 300, ent.asset || 'bird');
              if (ent.physics) {
                sprite.setGravityY(ent.physics.gravity ?? 0);
                sprite.setVelocity(ent.physics.velocity?.x ?? 0, ent.physics.velocity?.y ?? 0);
                sprite.setBounce(ent.physics.bounce ?? 0);
              }
            }
          });

          // Basic input for Flappy-like
          scene.input.keyboard.on('keydown-SPACE', () => {
            const bird = scene.children.getByName('bird');
            if (bird) bird.setVelocityY(-300);
          });

          // Add your event logic here (simple if/else for now)
          gameConfig.events.forEach(ev => {
            if (ev.trigger.type === 'input' && ev.trigger.params?.key === 'space') {
              // Already handled above; expand for others
            }
            // Collision example (expand with physics.add.collider)
          });
        },
        update: function () {
          // Procedural logic, e.g. pipes
        }
      }
    };

    new Phaser.Game(phaserConfig);
  </script>
</body>
</html>
  `;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  saveAs(blob, `${title.replace(/\s+/g, '_')}.html`);
}