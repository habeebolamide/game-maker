import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { useGameStore } from '../../store/gameStore';

interface GamePreviewProps {
  isPreviewMode: boolean;
  onGameOver?: () => void;
}

export default function GamePreview({ isPreviewMode, onGameOver }: GamePreviewProps) {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const config = useGameStore((s) => s.config);

  useEffect(() => {
    if (!containerRef.current || !isPreviewMode) {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
      return;
    }

    const phaserConfig: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      backgroundColor: config.settings.backgroundColor || '#4488AA',
      scale: {
        mode: Phaser.Scale.FIT,                // Fit to container, keep ratio
        autoCenter: Phaser.Scale.CENTER_BOTH,  // Center if letterboxed
        width: config.settings.width,
        height: config.settings.height,
      },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: config.settings.gravity || 0, x: 0},
          debug: true,
        },
      },
      scene: {
        preload: function () {
            this.load.on('filecomplete', (key: string) => console.log(`Loaded asset: ${key}`));
            this.load.on('loaderror', (file: Phaser.Loader.File) => console.error(`Load error: ${file.key}`));

          this.load.image('bird', '/assets/bird.png');
          this.load.image('pipe', '/assets/pipe.png');
          this.load.image('ground', '/assets/ground.png');
          this.load.image('sky', '/assets/sky.png');
        },
        create: function () {
          const scene = this as Phaser.Scene;

          // Background fill full scaled area
          scene.add.image(0, 0, 'sky')
            .setOrigin(0)
            .setDisplaySize(scene.scale.width, scene.scale.height);

          // Add entities...
          config.entities.forEach((ent) => {
            if (ent.type === 'sprite' || ent.type === 'obstacle') {
              const sprite = scene.physics.add.sprite(
                ent.position?.x || 200,
                ent.position?.y || 300,
                ent.asset || 'bird'
              );
              sprite.setName(ent.id);

              if (ent.physics) {
                sprite.setGravityY(ent.physics.gravity ?? 500);
                sprite.setBounce(ent.physics.bounce ?? 0.2);
                sprite.body?.setAllowGravity(ent.physics.allowGravity ?? true);
              }
            }
          });

          // Jump example
          scene.input.keyboard?.on('keydown-SPACE', () => {
            const bird = scene.children.getByName('bird') as Phaser.Physics.Arcade.Sprite;
            if (bird) bird.setVelocityY(-350);
          });
          scene.input.on('pointerdown', () => {
            const bird = scene.children.getByName('bird') as Phaser.Physics.Arcade.Sprite;
            if (bird) bird.setVelocityY(-350);
          });

          // Procedural pipes (simple)
          scene.time.addEvent({
            delay: 2000,
            callback: () => {
              const y = Phaser.Math.Between(150, 450);
              const pipe = scene.physics.add.sprite(scene.scale.width + 100, y, 'pipe')
                .setVelocityX(-200);
              // Add collision with bird...
            },
            loop: true,
          });
        },
        update: function () {
          // Your loop logic
        },
      },
    };

    gameRef.current = new Phaser.Game(phaserConfig);

    // Force resize on mount + listen for window changes
    const resize = () => {
      if (gameRef.current) gameRef.current.scale.refresh();
    };
    window.addEventListener('resize', resize);
    resize(); // initial call

    return () => {
      window.removeEventListener('resize', resize);
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [config, isPreviewMode, onGameOver]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ width: '100%', height: '100%' }} // Critical: fill parent completely
    />
  );
}