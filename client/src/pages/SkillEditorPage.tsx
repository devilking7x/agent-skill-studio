import { useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SkillEditor } from "@/components/SkillEditor";
import { useSkills } from "@/hooks/useSkills";
import { takeImportDraft } from "@/lib/importDraft";
import type { SkillDraft } from "@/lib/skills";

const EMPTY_DRAFT: SkillDraft = {
  name: "",
  description: "",
  tags: [],
  license: "",
  body: "",
};

export default function SkillEditorPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { getSkill, addSkill, updateSkill, skills } = useSkills();

  const isEdit = Boolean(id);
  const existing = id ? getSkill(id) : undefined;

  // One-shot imported draft (from the Import .md flow). useState initializer
  // runs once per mount, so the draft is consumed exactly once.
  const [imported] = useState<SkillDraft | null>(() =>
    isEdit ? null : takeImportDraft(),
  );

  if (isEdit && !existing) {
    return (
      <div className="mx-auto grid max-w-2xl place-items-center px-5 py-32 text-center">
        <div>
          <p className="text-lg font-semibold">Skill not found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            It may have been deleted, or the link is wrong.
          </p>
          <Button asChild className="mt-5">
            <Link href="/">Back to library</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Bundled skills are edited as a copy: keep the original intact and create
  // a custom skill, so "Reset library" can always restore the original.
  const editingBundledCopy = isEdit && existing?.source === "bundled";

  const initial: SkillDraft = existing
    ? {
        name: editingBundledCopy ? `${existing.name}-custom` : existing.name,
        description: existing.description,
        tags: existing.tags,
        license: existing.license ?? "",
        body: existing.body,
      }
    : (imported ?? EMPTY_DRAFT);

  const existingNames = skills.map((s) => s.name);
  const heading = isEdit
    ? editingBundledCopy
      ? `Customize "${existing?.name}"`
      : `Edit "${existing?.name}"`
    : imported
      ? "Review imported skill"
      : "New skill";

  const handleSave = (draft: SkillDraft) => {
    if (isEdit && existing && !editingBundledCopy) {
      updateSkill(existing.id, draft);
      toast.success(`Saved "${draft.name}"`);
      navigate(`/skills/${existing.id}`);
    } else {
      const created = addSkill(draft);
      toast.success(
        editingBundledCopy
          ? `Saved as a custom copy "${created.name}"`
          : `Created "${created.name}"`,
      );
      navigate(`/skills/${created.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SkillEditor
        initial={initial}
        existingNames={existingNames}
        excludeName={existing && !editingBundledCopy ? existing.name : undefined}
        heading={heading}
        subheading={
          editingBundledCopy
            ? "Bundled skills stay pristine — your edits are saved as a separate custom skill."
            : "Fill in the frontmatter and instructions. Validation runs live as you type."
        }
        saveLabel={isEdit && !editingBundledCopy ? "Save changes" : "Create skill"}
        onSave={handleSave}
        onCancel={() =>
          navigate(isEdit && existing ? `/skills/${existing.id}` : "/")
        }
      />
    </div>
  );
}
