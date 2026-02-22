import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Basic validation to prevent app crash on invalid URL (like a documentation link)
const isValidUrl = (url) => {
    try {
        const u = new URL(url);
        return u.protocol === 'https:' && u.host.includes('.supabase.');
    } catch {
        return false;
    }
};

export const supabase = (isValidUrl(supabaseUrl) && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : {
        // Mock client for when Envs are missing/invalid to prevent crashes
        auth: {
            getSession: async () => ({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
            signInWithPassword: async () => ({ data: {}, error: new Error("Supabase not configured") }),
            signOut: async () => { }
        },
        from: () => ({
            select: () => ({
                eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }),
                order: () => Promise.resolve({ data: [], error: null })
            }),
            insert: () => Promise.resolve({ data: null, error: null }),
            update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
            delete: () => ({ eq: () => Promise.resolve({ data: null, error: null }) })
        }),
        storage: {
            from: () => ({
                upload: async () => ({ data: null, error: new Error("Supabase not configured") }),
                getPublicUrl: () => ({ data: { publicUrl: '' } })
            })
        },
        channel: () => ({
            on: function () { return this; },
            subscribe: () => { }
        }),
        removeChannel: () => { }
    };
