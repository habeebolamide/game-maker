import { create } from 'zustand';
import type { GameConfig, GameEvent } from '../lib/templates';
import { debounce } from 'lodash';
import { supabase } from '../lib/supabase';

interface GameState {
    config: GameConfig;
    selectedEntityId: string | null;
    projectId: string | null;  // Add projectId to the store if it's part of your state
    setConfig: (config: GameConfig) => void;
    updateConfig: (updates: Partial<GameConfig>) => void;
    selectEntity: (id: string | null) => void;
    updateEntity: (id: string, updates: Partial<GameConfig['entities'][0]>) => void;
    addEntity: (entity: GameConfig['entities'][0]) => void;
    addEvent: (event: GameEvent) => void;
    removeEvent: (id: string) => void;
    updateEvent: (id: string, updates: Partial<GameEvent>) => void;
    isSaving: boolean;
    lastSaved: Date | null;
    saveToSupabase: () => Promise<void>;
}

export const useGameStore = create<GameState>((set, get) => ({
    config: { title: 'Untitled', settings: { width: 800, height: 600 }, entities: [], events: [] },
    selectedEntityId: null,
    projectId: null, // Add projectId initialization if necessary

    setConfig: (config) => set({ config }),
    updateConfig: (updates) => set((state) => ({ config: { ...state.config, ...updates } })),
    selectEntity: (id) => set({ selectedEntityId: id }),
    updateEntity: (id, updates) =>
        set((state) => ({
            config: {
                ...state.config,
                entities: state.config.entities.map((e) =>
                    e.id === id ? { ...e, ...updates } : e
                ),
            },
        })),
    addEntity: (entity) =>
        set((state) => ({
            config: {
                ...state.config,
                entities: [...state.config.entities, entity],
            },
        })),
    addEvent: (event) => set((state) => ({
        config: { ...state.config, events: [...state.config.events, event] },
    })),
    removeEvent: (id) => set((state) => ({
        config: { ...state.config, events: state.config.events.filter(e => e.id !== id) },
    })),
    updateEvent: (id, updates) => set((state) => ({
        config: {
            ...state.config,
            events: state.config.events.map(e => e.id === id ? { ...e, ...updates } : e),
        },
    })),
    isSaving: false,
    lastSaved: null,

    // Type assertion for debounce
    saveToSupabase: debounce(async (): Promise<void> => {
        const { config, projectId } = get(); // Assume we add projectId to store or pass it
        if (!projectId) return;

        set({ isSaving: true });

        try {
            const { error } = await supabase
                .from('projects')
                .update({
                    title: config.title,
                    config: config, // JSONB handles object
                    updated_at: new Date().toISOString(),
                })
                .eq('id', projectId);

            if (error) throw error;

            set({ lastSaved: new Date() });
        } catch (err) {
            console.error('Save failed:', err);
            alert('Save failed – check console');
        } finally {
            set({ isSaving: false });
        }
    }, 2000) as () => Promise<void>, // Explicit type assertion to ensure correct return type
}));
