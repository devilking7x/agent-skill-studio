import { useCallback, useEffect, useMemo, useState } from "react";
import { nanoid } from "nanoid";
import { BUNDLED_SKILLS } from "@/data/bundledSkills";
import { storage, type Skill, type SkillDraft } from "@/lib/skills";

export interface SkillsApi {
  /** All visible skills: bundled (minus deleted) + user skills, sorted by name. */
  skills: Skill[];
  userSkills: Skill[];
  disabledIds: string[];
  isEnabled: (id: string) => boolean;
  toggleEnabled: (id: string) => void;
  getSkill: (id: string) => Skill | undefined;
  addSkill: (draft: SkillDraft) => Skill;
  updateSkill: (id: string, draft: SkillDraft) => Skill | undefined;
  deleteSkill: (id: string) => void;
  resetAll: () => void;
  allTags: string[];
}

export function useSkills(): SkillsApi {
  const [userSkills, setUserSkills] = useState<Skill[]>(() => storage.loadUserSkills());
  const [disabledIds, setDisabledIds] = useState<string[]>(() => storage.loadDisabledIds());
  const [deletedBundled, setDeletedBundled] = useState<string[]>(() =>
    storage.loadDeletedBundled(),
  );

  useEffect(() => storage.saveUserSkills(userSkills), [userSkills]);
  useEffect(() => storage.saveDisabledIds(disabledIds), [disabledIds]);
  useEffect(() => storage.saveDeletedBundled(deletedBundled), [deletedBundled]);

  const skills = useMemo(() => {
    const visible = BUNDLED_SKILLS.filter((s) => !deletedBundled.includes(s.id));
    return [...visible, ...userSkills].sort((a, b) => a.name.localeCompare(b.name));
  }, [userSkills, deletedBundled]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    skills.forEach((s) => s.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [skills]);

  const isEnabled = useCallback((id: string) => !disabledIds.includes(id), [disabledIds]);

  const toggleEnabled = useCallback((id: string) => {
    setDisabledIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const getSkill = useCallback(
    (id: string) => skills.find((s) => s.id === id),
    [skills],
  );

  const addSkill = useCallback((draft: SkillDraft): Skill => {
    const now = Date.now();
    const skill: Skill = {
      id: nanoid(10),
      name: draft.name.trim(),
      description: draft.description.trim(),
      tags: draft.tags.map((t) => t.trim()).filter(Boolean),
      body: draft.body,
      license: draft.license?.trim() || undefined,
      source: "user",
      createdAt: now,
      updatedAt: now,
    };
    setUserSkills((prev) => [...prev, skill]);
    return skill;
  }, []);

  const updateSkill = useCallback(
    (id: string, draft: SkillDraft): Skill | undefined => {
      let updated: Skill | undefined;
      setUserSkills((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s;
          updated = {
            ...s,
            name: draft.name.trim(),
            description: draft.description.trim(),
            tags: draft.tags.map((t) => t.trim()).filter(Boolean),
            body: draft.body,
            license: draft.license?.trim() || undefined,
            updatedAt: Date.now(),
          };
          return updated;
        }),
      );
      return updated;
    },
    [],
  );

  const deleteSkill = useCallback(
    (id: string) => {
      const skill = skills.find((s) => s.id === id);
      if (!skill) return;
      if (skill.source === "bundled") {
        setDeletedBundled((prev) => [...prev, id]);
      } else {
        setUserSkills((prev) => prev.filter((s) => s.id !== id));
      }
      setDisabledIds((prev) => prev.filter((x) => x !== id));
    },
    [skills],
  );

  const resetAll = useCallback(() => {
    storage.resetAll();
    setUserSkills([]);
    setDisabledIds([]);
    setDeletedBundled([]);
  }, []);

  return {
    skills,
    userSkills,
    disabledIds,
    isEnabled,
    toggleEnabled,
    getSkill,
    addSkill,
    updateSkill,
    deleteSkill,
    resetAll,
    allTags,
  };
}
