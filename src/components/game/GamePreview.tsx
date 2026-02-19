import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { useGameStore } from '../../store/gameStore';

interface GamePreviewProps {
    isPreviewMode: boolean; // true = run game loop, false = static editor view
    onGameOver?: () => void; // optional callback
}

export default function GamePreview({ isPreviewMode, onGameOver }: GamePreviewProps) {
    const gameRef = useRef<Phaser.Game | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const config = useGameStore((s) => s.config);

    useEffect(() => {
        if (!containerRef.current || !isPreviewMode) {
            // Cleanup if switching modes
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
            return;
        }

        const phaserConfig: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            width: config.settings.width,
            height: config.settings.height,
            parent: containerRef.current,
            backgroundColor: config.settings.backgroundColor || '#4488AA',
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: config.settings.gravity || 0, x: 0 },
                    debug: true, // show physics bodies in dev
                },
            },
            scene: {
                preload: function () {
                    // Load assets (use public URLs or local imports later)
                    this.load.image('bird', 'https://labs.phaser.io/assets/sprites/yellowbird-midflap.png');
                    this.load.image('pipe', 'https://labs.phaser.io/assets/sprites/pipe-green.png');
                    this.load.image('ground', 'https://labs.phaser.io/assets/sprites/platform.png');
                },
                create: function () {
                    const scene = this as Phaser.Scene;

                    // Background or simple color
                    scene.add.rectangle(0, 0, config.settings.width * 2, config.settings.height * 2, 0x4488aa).setOrigin(0);

                    // Add entities from config
                    config.entities.forEach((ent) => {
                        if (ent.type === 'sprite' || ent.type === 'obstacle') {
                            const sprite = scene.physics.add.sprite(
                                ent.position?.x || 100,
                                ent.position?.y || 100,
                                ent.asset || 'bird'
                            );

                            if (ent.physics) {
                                sprite.setGravityY(ent.physics.gravity ?? 0);
                                sprite.setVelocity(ent.physics.velocity?.x ?? 0, ent.physics.velocity?.y ?? 0);
                                sprite.setBounce(ent.physics.bounce ?? 0);
                                sprite.body?.setAllowGravity(ent.physics.allowGravity ?? true);
                                if (ent.bodySize) {
                                    sprite.body?.setSize(ent.bodySize.width, ent.bodySize.height);
                                }
                            }

                            // Tag for later reference (e.g. collisions)
                            sprite.setData('entityId', ent.id);
                        }
                    });

                    config.events.forEach((ev) => {
                        if (ev.trigger.type === 'input' && ev.trigger.params?.key === 'space') {
                            scene.input.keyboard?.on('keydown-SPACE', () => {
                                const target = scene.children.getByName(ev.action.target || 'bird') as Phaser.Physics.Arcade.Sprite;
                                if (target && ev.action.type === 'jump') {
                                    target.setVelocityY(ev.action.params?.force || -300);
                                }
                            });
                        }

                        if (ev.trigger.type === 'collision') {
                            // Example: assume we have bird and pipe sprites
                            const bird = scene.children.getByName('bird') as Phaser.Physics.Arcade.Sprite;
                            const pipe = scene.physics.add.group(); // or specific
                            scene.physics.add.collider(bird, pipe, () => {
                                if (ev.action.type === 'gameOver') {
                                    if (onGameOver) onGameOver();
                                }
                            });
                        }
                    });

                    // Example: Flappy-specific - make bird jump on space/click
                    scene.input.keyboard?.on('keydown-SPACE', () => {
                        const bird = scene.children.getByName('bird') as Phaser.Physics.Arcade.Sprite; // or find by data
                        if (bird) bird.setVelocityY(-300); // jump impulse
                    });
                    scene.input.on('pointerdown', () => {
                        const bird = scene.children.getByName('bird') as Phaser.Physics.Arcade.Sprite;
                        if (bird) bird.setVelocityY(-300);
                    });

                    scene.time.addEvent({
                        delay: 2000,
                        callback: () => {
                            const pipeTop = scene.physics.add.sprite(config.settings.width + 100, Phaser.Math.Between(100, 300), 'pipe');
                            pipeTop.setVelocityX(-200);
                            pipeTop.setFlipY(true); // top pipe
                            // Add bottom pipe, gap, etc.
                        },
                        loop: true,
                    });

                    // Simple pipe movement / generation (expand later)
                    // For demo: add one pipe moving left
                    const pipe = scene.physics.add.sprite(700, 300, 'pipe');
                    pipe.setVelocityX(-200);
                    pipe.setImmovable(true);

                    // Collision example
                    scene.physics.add.collider(
                        scene.children.getByName('bird') as Phaser.GameObjects.GameObject,
                        pipe,
                        () => {
                            if (onGameOver) onGameOver();
                            // Or scene.scene.restart();
                        }
                    );
                },
                update: function () {
                    
                    // Game loop logic (e.g. spawn pipes, check out of bounds)
                },
            },
        };

        gameRef.current = new Phaser.Game(phaserConfig);

        return () => {
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
            style={{ width: config.settings.width, height: config.settings.height }}
        />
    );
}