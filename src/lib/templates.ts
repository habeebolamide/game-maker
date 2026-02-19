export interface GameEvent {
  id: string; // unique per event
  trigger: {
    type: 'input' | 'collision' | 'update' | 'timer';
    params?: Record<string, any>; // e.g. { key: 'space' } or { entityA: 'bird', entityB: 'pipe' }
  };
  action: {
    type: 'jump' | 'addScore' | 'destroy' | 'gameOver' | 'spawn' | 'setVelocity';
    target?: string; // entity id, or 'all'
    params?: Record<string, any>; // e.g. { force: -300 } for jump
  };
}

export interface GameConfig {
  title: string;
  settings: {
    width: number;
    height: number;
    backgroundColor?: string;
    gravity?: number;
  };
  entities: Array<{
    id: string;
    type: 'sprite' | 'group' | 'background' | 'obstacle';
    asset?: string; // image key or URL
    position?: { x: number; y: number };
    physics?: {
      immovable?: boolean;
      gravity?: number;
      velocity?: { x: number; y: number };
      bounce?: number;
      allowGravity?: boolean;
    };
    bodySize?: { width: number; height: number }; // for collision
  }>;
  events: GameEvent[];
  
  // Add scoring, UI, etc. later
}

export const templates: Record<string, GameConfig> = {
  flappy: {
    title: 'Flappy Bird Clone',
    settings: {
      width: 800,
      height: 600,
      gravity: 500,
    },
    entities: [
      {
        id: 'bird',
        type: 'sprite',
        asset: 'bird.png', // We'll use Phaser defaults or URLs for now
        position: { x: 200, y: 300 },
        physics: { gravity: 500, bounce: 0.2 },
      },
      {
        id: 'ground',
        type: 'background',
        asset: 'ground.png',
        position: { x: 400, y: 580 },
      },
      // Pipes will be procedural later
    ],
    events: [
    {
      id: 'jump-input',
      trigger: { type: 'input', params: { key: 'space' } },
      action: { type: 'jump', target: 'bird', params: { force: -300 } },
    },
    {
      id: 'collision-pipe',
      trigger: { type: 'collision', params: { entityA: 'bird', entityB: 'pipe' } },
      action: { type: 'gameOver', target: 'global' },
    },
  ],
  },

  invaders: {
    title: 'Space Invaders Clone',
    settings: {
      width: 800,
      height: 600,
      backgroundColor: '#000033',
    },
    entities: [
      {
        id: 'player',
        type: 'sprite',
        asset: 'player.png',
        position: { x: 400, y: 550 },
      },
      {
        id: 'aliens',
        type: 'group',
        asset: 'alien.png',
        // Position handled in Phaser create
      },
    ],
    events: [
      { id: 'move-left', trigger: { type: 'input', params: { key: 'left' } }, action: { type: 'setVelocity', target: 'player', params: { x: -200, y: 0 } } },
      { id: 'move-right', trigger: { type: 'input', params: { key: 'right' } }, action: { type: 'setVelocity', target: 'player', params: { x: 200, y: 0 } } },
      { id: 'shoot', trigger: { type: 'input', params: { key: 'space' } }, action: { type: 'spawn', target: 'bullet' } },
      // Collision bullet:alien → destroy + score
    ],
  },

  runner: {
    title: 'Endless Runner Clone',
    settings: {
      width: 800,
      height: 600,
      gravity: 800,
    },
    entities: [
      {
        id: 'player',
        type: 'sprite',
        asset: 'runner.png',
        position: { x: 150, y: 400 },
        physics: { gravity: 800 },
      },
      // Obstacles spawned procedurally
    ],
    events: [
      { id: 'jump', trigger: { type: 'input', params: { key: 'space' } }, action: { type: 'jump', target: 'player' } },
      { id: 'gameOver', trigger: { type: 'collision', params: { entityA: 'player', entityB: 'obstacle' } }, action: { type: 'gameOver', target: 'global' } },
    ],
  },
};

export const blankTemplate: GameConfig = {
  title: 'Blank Project',
  settings: { width: 800, height: 600 },
  entities: [],
  events: [],
};