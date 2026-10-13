"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  useWatch,
  useForm,
  type Resolver,
  type UseFormReturn,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema } from "@/lib/validation/profile";
import { clearDraft, loadDraft, saveDraft } from "@/lib/profile/storage";
import { createDemoProfile } from "@/lib/profile/demo";
import type { Profile } from "@/types";

interface EditorContextValue {
  form: UseFormReturn<Profile>;
  /** Live values for the preview — updates on every keystroke. */
  profile: Profile;
  isDirty: boolean;
  savedAt: Date | null;
  resetToDemo: () => void;
  /** Slug of the user's first page, when a local draft was imported on sign-in. */
  importedSlug: string | null;
  setImportedSlug: (slug: string | null) => void;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export function useEditor(): EditorContextValue {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error("useEditor must be used inside <EditorProvider>");
  }
  return context;
}

/**
 * The server-side snapshot. Rendering starts from the bundled demo profile on
 * both the server and the browser's hydration pass, then switches to a saved
 * local draft after mount — so localStorage never causes a hydration mismatch.
 */
const SERVER_SNAPSHOT = createDemoProfile();

function subscribeNoop() {
  return () => {};
}

export function EditorProvider({ children }: { children: React.ReactNode }) {
  // Cached client read; refreshed once per provider mount.
  const snapshotRef = useRef<Profile | null>(null);
  const getSnapshot = useCallback(() => {
    if (snapshotRef.current === null) {
      snapshotRef.current = loadDraft();
    }
    return snapshotRef.current;
  }, []);

  const draft = useSyncExternalStore(
    subscribeNoop,
    getSnapshot,
    () => SERVER_SNAPSHOT,
  );

  const form = useForm<Profile>({
    // The zod schema declares defaults, so its input type is wider than
    // Profile; the editor always holds a complete Profile and casts the
    // resolver to match.
    resolver: zodResolver(profileSchema) as unknown as Resolver<Profile>,
    defaultValues: draft,
    // Re-applies values when the snapshot swaps from the demo profile to the
    // restored local draft after mount.
    values: draft,
    mode: "onChange",
  });

  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [importedSlug, setImportedSlug] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // useWatch subscribes to every field, so the preview re-renders on each
  // keystroke and control change — not only on the first dirty transition.
  const profile = useWatch({ control: form.control }) as Profile;

  // Persist drafts locally (debounced). Nothing is published anywhere.
  useEffect(() => {
    const subscription = form.subscribe({
      formState: {
        values: true,
        isDirty: true,
      },
      callback: ({ values, isDirty: dirty }) => {
        setIsDirty(Boolean(dirty));
        if (!values) return;
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
          saveDraft(values as Profile);
          setSavedAt(new Date());
        }, 350);
      },
    });

    return () => {
      subscription();
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [form]);

  const resetToDemo = useCallback(() => {
    clearDraft();
    const demo = createDemoProfile();
    snapshotRef.current = demo;
    form.reset(demo, { keepDirty: false });
    setSavedAt(new Date());
    setIsDirty(false);
  }, [form]);

  const value = useMemo<EditorContextValue>(
    () => ({
      form,
      profile,
      isDirty,
      savedAt,
      resetToDemo,
      importedSlug,
      setImportedSlug,
    }),
    [form, profile, isDirty, savedAt, resetToDemo, importedSlug],
  );

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}
