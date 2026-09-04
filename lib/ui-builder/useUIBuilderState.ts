"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { DEFAULT_DESIGN_TOKENS, mergeDesignTokens, type DesignTokens } from "@/lib/ui-builder/types";

// Phase 132 — the UI Builder's centralized state tree (spec item: "Manage
// states reactively using a centralized state tree (e.g. React Context /
// Redux / Zustand) tracking styles, layout arrays, and global tokens").
// Built on React's built-in useReducer rather than pulling in Zustand/Redux
// as a new dependency — this app has no global client-state library today,
// and a plain reducer gives the same "one state tree, dispatch-driven
// updates, easy to reason about" shape the spec asks for without adding a
// package this sandbox can't verify resolves cleanly in a real build (no
// working dev server here — see EXECUTION_PLAN.md's sandbox-limitations
// note). `layout arrays` (section reorder) aren't modeled yet — see Phase
// 132's documented scope: Typography + Color are the two modules with real
// controls this phase; Image/Lighting and Layout/Reorder are next.
//
// This is a hook, not a Context provider, because the only consumer is
// UIBuilderShell.tsx itself (one page, not shared across a tree of
// components), so Context's main benefit — avoiding prop drilling across
// many components — doesn't apply yet. If a later phase splits the builder
// into multiple sibling components that all need this state, wrapping this
// hook's return value in a Context.Provider is a small, additive change.

type HistoryState = {
  past: DesignTokens[];
  present: DesignTokens;
  future: DesignTokens[];
};

type Action =
  | { type: "SET"; tokens: DesignTokens }
  | { type: "PATCH"; patch: Partial<DesignTokens> }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "LOAD"; tokens: DesignTokens };

function reducer(state: HistoryState, action: Action): HistoryState {
  switch (action.type) {
    case "LOAD":
      // Loading from the server (initial fetch, or "discard draft") resets
      // history — undoing past what was ever loaded doesn't make sense.
      return { past: [], present: action.tokens, future: [] };
    case "SET":
      return { past: [...state.past, state.present], present: action.tokens, future: [] };
    case "PATCH": {
      const next = mergeDesignTokens({ ...state.present, ...action.patch });
      return { past: [...state.past, state.present], present: next, future: [] };
    }
    case "UNDO": {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      return { past: state.past.slice(0, -1), present: previous, future: [state.present, ...state.future] };
    }
    case "REDO": {
      if (state.future.length === 0) return state;
      const [next, ...rest] = state.future;
      return { past: [...state.past, state.present], present: next, future: rest };
    }
    default:
      return state;
  }
}

const AUTOSAVE_DEBOUNCE_MS = 1200;

export function useUIBuilderState() {
  const [history, dispatch] = useReducer(reducer, {
    past: [],
    present: DEFAULT_DESIGN_TOKENS,
    future: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPublishedAt, setLastPublishedAt] = useState<string | null>(null);
  const [source, setSource] = useState<"draft" | "published" | "default" | null>(null);

  // Initial load — draft if one exists, else published, else defaults (see
  // app/api/admin/ui-builder/draft/route.ts's GET).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/ui-builder/draft");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Could not load.");
        if (!cancelled) {
          dispatch({ type: "LOAD", tokens: mergeDesignTokens(data.tokens) });
          setSource(data.source ?? null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load the builder.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Debounced autosave to the draft table on every change (spec item:
  // "Draft changes save automatically to a staging/draft state database
  // table"). Skipped while loading, so the initial fetch doesn't
  // immediately re-save what it just loaded.
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (loading) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(async () => {
      setSaving(true);
      try {
        await fetch("/api/admin/ui-builder/draft", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(history.present),
        });
      } catch {
        // Autosave failures aren't surfaced as a blocking error — the
        // in-memory state (and Undo/Redo) is still fully usable, and the
        // next successful autosave (or an explicit Publish) recovers.
      } finally {
        setSaving(false);
      }
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history.present, loading]);

  const setColor = useCallback((key: keyof DesignTokens["colors"], value: string) => {
    dispatch({ type: "PATCH", patch: { colors: { ...history.present.colors, [key]: value } } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history.present.colors]);

  const setTypography = useCallback(
    (key: keyof DesignTokens["typography"], value: string | number) => {
      dispatch({ type: "PATCH", patch: { typography: { ...history.present.typography, [key]: value } } });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [history.present.typography]
  );

  const undo = useCallback(() => dispatch({ type: "UNDO" }), []);
  const redo = useCallback(() => dispatch({ type: "REDO" }), []);

  const discardDraft = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/ui-builder/draft", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Could not discard draft.");
      dispatch({ type: "LOAD", tokens: mergeDesignTokens(data.tokens) });
      setSource("published");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not discard draft.");
    }
  }, []);

  const publish = useCallback(async () => {
    setPublishing(true);
    setError(null);
    try {
      // Flush the pending autosave first so Publish always reflects the
      // very latest edit, not whatever was saved 1.2s ago.
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
      await fetch("/api/admin/ui-builder/draft", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(history.present),
      });
      const res = await fetch("/api/admin/ui-builder/publish", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Could not publish.");
      setLastPublishedAt(data.publishedAt ?? new Date().toISOString());
      setSource("published");
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not publish.");
      return false;
    } finally {
      setPublishing(false);
    }
  }, [history.present]);

  return useMemo(
    () => ({
      tokens: history.present,
      canUndo: history.past.length > 0,
      canRedo: history.future.length > 0,
      loading,
      saving,
      publishing,
      error,
      lastPublishedAt,
      source,
      setColor,
      setTypography,
      undo,
      redo,
      discardDraft,
      publish,
      clearError: () => setError(null),
    }),
    [history, loading, saving, publishing, error, lastPublishedAt, source, setColor, setTypography, undo, redo, discardDraft, publish]
  );
}
