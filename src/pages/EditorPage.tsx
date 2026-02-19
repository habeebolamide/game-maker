import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useGameStore } from '../store/gameStore';
import { useAuth } from '../hooks/useAuth';
import GamePreview from '../components/game/GamePreview';
import EventModal from '../components/editor/EventModal';
import { exportGame } from '../services/exporter';
import { toast } from 'react-hot-toast/headless';

export default function EditorPage() {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    // All hooks at the top - unconditional
    const {
        config,
        setConfig,
        selectedEntityId,
        selectEntity,
        updateEntity,
        addEvent,
        removeEvent,
        isSaving,
        saveToSupabase
    } = useGameStore();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [localProjectId, setLocalProjectId] = useState(projectId);
    const lastSaved = useGameStore(s => s.lastSaved);

    // Load project data once we have projectId and user

    useEffect(() => {
        if (!projectId || !user) return;

        const loadProject = async () => {
            try {
                setLoading(true);
                setError(null);

                const { data, error } = await supabase
                    .from('projects')
                    .select('config, title')
                    .eq('id', projectId)
                    .eq('user_id', user.id)
                    .single();

                if (error) throw error;

                if (data) {
                    setConfig({
                        title: data.title,
                        ...data.config,
                    });
                    setLocalProjectId(projectId);
                } else {
                    setError('Project not found or you do not have access');
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load project');
            } finally {
                setLoading(false);
            }
        };


        loadProject();

        useGameStore.getState().setProjectId(projectId!);



    }, [projectId, user, setConfig]);

    // Auto-save when config changes (debounce in store recommended in production)
    useEffect(() => {
        if (!localProjectId) return;
        saveToSupabase();
    }, [config, localProjectId, saveToSupabase]);

    // ────────────────────────────────────────────────
    // Early returns - now safe because all hooks are above
    // ────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 flex items-center justify-center text-white text-xl">
                Loading your creation...
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 flex flex-col items-center justify-center text-red-300">
                <p className="text-2xl mb-6">{error}</p>
                <button
                    onClick={() => navigate('/')}
                    className="bg-indigo-600 hover:bg-indigo-700 px-8 py-4 rounded-xl text-white font-medium shadow-lg shadow-indigo-500/30 transition-all hover:scale-105"
                >
                    Back to Gallery
                </button>
            </div>
        );
    }

    const addSprite = () => {
        const newId = useGameStore.getState().getNextSpriteId();

        const newSprite = {
            id: newId,
            type: 'sprite' as const,
            asset: 'bird', // default placeholder
            position: { x: 300 + Math.random() * 200, y: 200 + Math.random() * 200 },
            physics: {
                gravity: 500,
                bounce: 0.2,
                allowGravity: true,
            },
            bodySize: { width: 68, height: 48 }, // approx bird size
        };

        useGameStore.getState().addEntity(newSprite);
        selectEntity(newSprite.id); // auto-select for properties editing
        // Optional: 
        toast.success('Sprite added!')
    };

    const addBackground = () => {
        const newBg = {
            id: `bg-${Date.now()}`,
            type: 'background' as const,
            asset: 'sky', // or 'ground'
            position: { x: config.settings.width / 2, y: config.settings.height / 2 },
        };

        useGameStore.getState().addEntity(newBg);
        toast.success('Background added!')
    };

    // ────────────────────────────────────────────────
    // Main render
    // ────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 text-white flex flex-col overflow-hidden">
            {/* Header */}
            <header className="bg-gray-900/60 backdrop-blur-md border-b border-indigo-500/30 px-6 py-4 flex items-center justify-between shadow-lg z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 bg-gray-700/60 hover:bg-gray-600/60 px-5 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-md shadow-gray-900/40 border border-gray-600/50"
                    >
                        ← Back to Gallery
                    </button>

                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
                        {config.title || 'Untitled Masterpiece'}
                    </h1>
                    {lastSaved && (
                        <span className="text-sm text-gray-400 mt-1">
                            Last saved: {lastSaved.toLocaleTimeString()}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsPreviewMode(!isPreviewMode)}
                        className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg ${isPreviewMode
                            ? 'bg-red-600 hover:bg-red-700 shadow-red-500/30'
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-500/30 hover:scale-105'
                            }`}
                    >
                        {isPreviewMode ? 'Stop Playtest' : 'Playtest'}
                    </button>

                    <button
                        onClick={saveToSupabase}
                        disabled={isSaving}
                        className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg bg-green-600 hover:bg-green-700 shadow-green-500/30 hover:scale-105 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                    >
                        {isSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                        onClick={() => exportGame(config, config.title)}
                        className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg shadow-purple-500/30 hover:scale-105"
                    >
                        Export Game
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar */}
                <aside className="w-72 bg-gray-800/40 backdrop-blur-lg border-r border-gray-700/50 p-6 overflow-y-auto">
                    <h2 className="text-2xl font-semibold mb-6 text-indigo-300">Tools & Assets</h2>
                    <div className="space-y-4">
                        <button onClick={addSprite} className="w-full bg-gray-700/60 hover:bg-gray-600/60 p-4 rounded-xl text-left transition-all hover:scale-[1.02] hover:shadow-md hover:shadow-indigo-500/20">
                            + Add Sprite
                        </button>
                        <button onClick={addBackground} className="w-full bg-gray-700/60 hover:bg-gray-600/60 p-4 rounded-xl text-left transition-all hover:scale-[1.02] hover:shadow-md hover:shadow-indigo-500/20">
                            + Add Background
                        </button>
                        <button
                            onClick={() => setIsEventModalOpen(true)}
                            className="w-full bg-gray-700/60 hover:bg-gray-600/60 p-4 rounded-xl text-left transition-all hover:scale-[1.02] hover:shadow-md hover:shadow-indigo-500/20"
                        >
                            + Add Event / Logic
                        </button>
                    </div>
                </aside>

                {/* Main Canvas */}
                <main className="flex-1 flex items-center justify-center bg-black/40 relative overflow-hidden">
                    {isPreviewMode ? (
                        <div className="w-full h-full flex items-center justify-center">
                            <GamePreview
                                isPreviewMode={isPreviewMode}
                                onGameOver={() => {
                                    alert('Game Over!');
                                    setIsPreviewMode(false);
                                }}
                            />
                        </div>
                    ) : (
                        <div
                            className="relative border-4 border-dashed border-indigo-500/40 rounded-2xl overflow-hidden shadow-2xl shadow-indigo-500/10 bg-gray-900/30 backdrop-blur-sm"
                            style={{
                                width: `${config.settings.width}px`,
                                height: `${config.settings.height}px`,
                                maxWidth: '90vw',
                                maxHeight: '80vh',
                            }}
                        >
                            <div className="absolute inset-0 flex items-center justify-center text-indigo-300/60 text-3xl font-bold pointer-events-none">
                                Editor Mode - Drag Assets Here (Coming Soon!)
                            </div>

                            {config.entities.map((entity) => (
                                <div
                                    key={entity.id}
                                    onClick={() => selectEntity(entity.id)}
                                    className={`absolute bg-gradient-to-br from-indigo-600/60 to-purple-600/60 p-5 rounded-xl cursor-pointer transition-all duration-300 backdrop-blur-sm border border-indigo-400/30 ${selectedEntityId === entity.id
                                        ? 'ring-4 ring-indigo-400 scale-110 shadow-2xl shadow-indigo-500/50 z-10'
                                        : 'hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/30'
                                        }`}
                                    style={{
                                        left: `${entity.position?.x ?? 100}px`,
                                        top: `${entity.position?.y ?? 100}px`,
                                    }}
                                >
                                    <span className="font-bold">{entity.id}</span>
                                    <br />
                                    <span className="text-sm opacity-80">{entity.type}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </main>

                {/* Right Panel - Properties */}
                <aside className="w-96 bg-gray-800/40 backdrop-blur-lg border-l border-gray-700/50 p-6 overflow-y-auto">
                    <h2 className="text-2xl font-semibold mb-6 text-purple-300">Properties Inspector</h2>

                    {selectedEntityId ? (
                        <div className="space-y-6">
                            <div className="bg-gray-700/50 p-5 rounded-xl border border-gray-600/50">
                                <p className="font-medium text-lg mb-4 text-indigo-300">
                                    Editing: <span className="text-white">{selectedEntityId}</span>
                                </p>

                                <label className="block text-sm font-medium text-gray-300 mb-2">X Position</label>
                                <input
                                    type="number"
                                    value={config.entities.find((e) => e.id === selectedEntityId)?.position?.x ?? 0}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value, 10) || 0;
                                        updateEntity(selectedEntityId, {
                                            position: {
                                                ...(config.entities.find((e) => e.id === selectedEntityId)?.position ?? { x: 0, y: 0 }),
                                                x: val,
                                            },
                                        });
                                    }}
                                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                                />

                                {/* Add more fields: Y, scale, rotation, gravity, etc. */}
                            </div>

                            <button
                                onClick={() => {
                                    if (selectedEntityId) {
                                        useGameStore.getState().removeEntity(selectedEntityId);
                                        // Optional: toast.success('Entity deleted');
                                    }
                                }}
                                className="w-full bg-red-600/80 hover:bg-red-700 p-4 rounded-xl font-medium transition-all hover:scale-105 shadow-md shadow-red-500/30"
                            >
                                Delete Entity
                            </button>

                            <div className="mt-10">
                                <h3 className="text-xl font-semibold mb-4 text-indigo-300">Events & Logic</h3>
                                {config.events.length === 0 ? (
                                    <p className="text-gray-400">No events defined yet — add one to bring your game to life!</p>
                                ) : (
                                    <ul className="space-y-3">
                                        {config.events.map((ev) => (
                                            <li
                                                key={ev.id}
                                                className="bg-gray-700/50 p-4 rounded-xl border border-gray-600/50 flex justify-between items-center"
                                            >
                                                <div>
                                                    <span className="font-medium">{ev.trigger.type.toUpperCase()}</span> →{' '}
                                                    <span className="text-purple-300">{ev.action.type}</span>
                                                </div>
                                                <button
                                                    onClick={() => removeEvent(ev.id)}
                                                    className="text-red-400 hover:text-red-300"
                                                >
                                                    Remove
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-400 text-center py-10">
                            Select an entity in the scene to edit its properties.
                        </p>
                    )}
                </aside>

                <EventModal
                    isOpen={isEventModalOpen}
                    onClose={() => setIsEventModalOpen(false)}
                    onSave={(newEvent) => {
                        addEvent(newEvent);
                        setIsEventModalOpen(false);
                    }}
                />
            </div>
        </div>
    );
}