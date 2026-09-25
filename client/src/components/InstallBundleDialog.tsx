import { useState } from "react";
import { Download, FolderDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  HARNESSES,
  downloadInstallBundle,
  skillInstallPath,
  type Harness,
} from "@/lib/harnesses";
import type { Skill } from "@/lib/skills";
import { cn } from "@/lib/utils";

interface InstallBundleDialogProps {
  skill: Skill;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * One-click install bundle: pick the agent harness, download a .zip that
 * mirrors the harness's skill directory layout — extracting it into a
 * project root installs the skill.
 */
export function InstallBundleDialog({ skill, open, onOpenChange }: InstallBundleDialogProps) {
  const [harness, setHarness] = useState<Harness>(HARNESSES[0]);

  const handleDownload = () => {
    downloadInstallBundle(harness, skill);
    toast.success(`Downloaded ${skill.name}.${harness.id}.zip`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderDown size={17} />
            Install bundle
          </DialogTitle>
          <DialogDescription>
            Pick your agent harness. The bundle contains{" "}
            <code className="font-mono">{skill.name}/SKILL.md</code> at the exact
            path the harness expects, plus install instructions — just extract
            the zip into your project root.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2" role="radiogroup" aria-label="Agent harness">
          {HARNESSES.map((h) => {
            const selected = h.id === harness.id;
            return (
              <button
                key={h.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setHarness(h)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
                  selected
                    ? "border-primary bg-primary/5"
                    : "hover:border-muted-foreground/40",
                )}
              >
                <span>
                  <span className="block text-sm font-semibold">
                    {h.label}
                    <span className="ml-2 font-normal text-muted-foreground">
                      {h.vendor}
                    </span>
                  </span>
                  <code className="mt-0.5 block font-mono text-xs text-muted-foreground">
                    {h.baseDir}/
                  </code>
                </span>
                <span
                  className={cn(
                    "grid h-4 w-4 shrink-0 place-items-center rounded-full border",
                    selected && "border-primary",
                  )}
                >
                  {selected && <span className="h-2 w-2 rounded-full bg-primary" />}
                </span>
              </button>
            );
          })}
        </div>

        <div className="rounded-lg border bg-muted/40 p-3.5 text-[13px]">
          <p className="mb-1 font-semibold">Installs to</p>
          <code className="font-mono text-xs break-all">
            {"<project-root>/"}
            {skillInstallPath(harness, skill.name)}
          </code>
          <p className="mt-2 leading-relaxed text-muted-foreground">
            {harness.installNote}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleDownload}>
            <Download size={14} /> Download .zip
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
