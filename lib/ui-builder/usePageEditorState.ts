"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";

// Phase 133 — same reducer-based history-stack shape as
// lib/ui-builder/useUIBuilderState.ts (the global theme tokens hook), but
// operating on a page's flat `{ contentId: value }` field map instead of
// the fixed DesignTokens shape, and re-loadable per page (switching pages
// resets history — undoing past a page you've navigated away from doesn't
// make sense, matching the spec's own "reset or scope history appropriately
// when switching pages" requirement).
type Fields = Record<string, string>;

type HistoryState = {
  past: Fields[];
  present: Fields;
  future: Fields[];
};

type Action =
  | { type: "LOAD"; fields: Fields }
  | { type: "SET_FIELD"; contentId: string; value: string }
  | { type: "UNDO" }
  | { type: "REDO" };

function reducer(state: HistoryState, action: Action): HistoryState {
  switch (action.type) {
    case "LOAD":
      return { past: [], present: action.fields, future: [] };
    case "SET_FIELD":
      return {
        past: [...state.past, state.present],
        present: { ...state.present, [action.contentId]: action.value },
        future: [],
      };
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

const AUTOSAVE_DEBOUNCE_MS = 800;

export function usePageEditorState(pageKey: string | null, supportsVisualEditor: boolean) {
  const [history, dispatch] = useReducer(reducer, { past: [], present: {}, future: [] });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPublishedAt, setLastPublishedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!pageKey || !supportsVisualEditor) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await fetch(`/api/admin/ui-builder/page-content/draft?pageKey=${encodeURIComponent(pageKey)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Could not load this page's content.");
        if (!cancelled) dispatch({ type: "LOAD", fields: data.fields ?? {} });
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load this page's content.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pageKey, supportsVisualEditor]);

  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!pageKey || !supportsVisualEditor || loading) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(async () => {
      setSaving(true);
      try {
        await fetch(`/api/admin/ui-builder/page-content/draft?pageKey=${encodeURIComponent(pageKey)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(history.present),
        });
      } catch {
        // Same as the global builder: autosave failure isn't a blocking
        // error, in-memory state (and Undo/Redo) is still fully usable.
      } finally {
        setSaving(false);
      }
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history.present, loading, pageKey, supportsVisualEditor]);

  const setField = useCallback((contentId: string, value: string) => {
    dispatch({ type: "SET_FIELD", contentId, value });
  }, []);

  const undo = useCallback(() => dispatch({ type: "UNDO" }), []);
  const redo = useCallback(() => dispatch({ type: "REDO" }), []);

  const discardDraft = useCallback(async () => {
    if (!pageKey) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/ui-builder/page-content/draft?pageKey=${encodeURIComponent(pageKey)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Could not discard draft.");
      dispatch({ type: "LOAD", fields: data.fields ?? {} });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not discard draft.");
    }
  }, [pageKey]);

  const publish = useCallback(async () => {
    if (!pageKey) return false;
    setPublishing(true);
    setError(null);
    try {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
      await fetch(`/api/admin/ui-builder/page-content/draft?pageKey=${encodeURIComponent(pageKey)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(history.present),
      });
      const res = await fetch("/api/admin/ui-builder/page-content/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Could not publish.");
      setLastPublishedAt(data.publishedAt ?? new Date().toISOString());
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not publish.");
      return false;
    } finally {
      setPublishing(false);
    }
  }, [pageKey, history.present]);

  return useMemo(
    () => ({
      fields: history.present,
      canUndo: history.past.length > 0,
      canRedo: history.future.length > 0,
      loading,
      saving,
      publishing,
      error,
      lastPublishedAt,
      setField,
      undo,
      redo,
      discardDraft,
      publish,
      clearError: () => setError(null),
    }),
    [history, loading, saving, publishing, error, lastPublishedAt, setField, undo, redo, discardDraft, publish]
  );
}
