import { useState } from 'react';
import type { GameEvent } from '../../lib/templates';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: GameEvent) => void;
  initialEvent?: GameEvent;
}

export default function EventModal({ isOpen, onClose, onSave, initialEvent }: EventModalProps) {
  const [triggerType, setTriggerType] = useState(initialEvent?.trigger.type || 'input');
  const [actionType, setActionType] = useState(initialEvent?.action.type || 'jump');
  // Add more state for params as needed

  if (!isOpen) return null;

  const handleSave = () => {
    const newEvent: GameEvent = {
      id: initialEvent?.id || `event-${Date.now()}`,
      trigger: { type: triggerType as any, params: {} }, // expand params later
      action: { type: actionType as any, target: 'bird', params: {} },
    };
    onSave(newEvent);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-800/90 backdrop-blur-lg p-8 rounded-2xl border border-indigo-500/30 w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6 text-indigo-300">Add / Edit Event</h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Trigger</label>
            <select
              value={triggerType}
              onChange={e => setTriggerType(e.target.value as "input" | "collision" | "update" | "timer")}
              className="w-full p-3 bg-gray-700 rounded-lg text-white"
            >
              <option value="input">Input (key press / tap)</option>
              <option value="collision">Collision</option>
              <option value="update">Every frame (update)</option>
              <option value="timer">Timer</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Action</label>
            <select
              value={actionType}
              onChange={e => setActionType(e.target.value as "jump" | "addScore" | "destroy" | "gameOver" | "spawn" | "setVelocity")}
              className="w-full p-3 bg-gray-700 rounded-lg text-white"
            >
              <option value="jump">Jump / Impulse</option>
              <option value="addScore">Add Score</option>
              <option value="destroy">Destroy Entity</option>
              <option value="gameOver">Game Over</option>
              <option value="spawn">Spawn Entity</option>
              <option value="setVelocity">Set Velocity</option>
            </select>
          </div>

          {/* Add param inputs later, e.g. force value for jump */}
        </div>

        <div className="mt-8 flex gap-4">
          <button
            onClick={handleSave}
            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 p-4 rounded-xl font-medium transition-all"
          >
            Save Event
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 p-4 rounded-xl font-medium transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}