import { Link } from "wouter";
import { CheckCircle2, Copy, Download, Eye, Pencil, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  copyToClipboard,
  downloadTextFile,
  hasErrors,
  serializeSkill,
  validateSkill,
  type Skill,
} from "@/lib/skills";
import { cn } from "@/lib/utils";

interface SkillCardProps {
  skill: Skill;
  enabled: boolean;
  onToggleEnabled: (id: string) => void;
  onDelete: (skill: Skill) => void;
}

export function SkillCard({ skill, enabled, onToggleEnabled, onDelete }: SkillCardProps) {
  const issues = validateSkill(skill);
  const valid = !hasErrors(issues);
  const warnings = issues.filter((i) => i.level === "warning").length;

  const handleExport = () => {
    downloadTextFile(`${skill.name}.md`, serializeSkill(skill));
    toast.success(`Exported ${skill.name}.md`);
  };

  const handleCopy = async () => {
    const ok = await copyToClipboard(serializeSkill(skill));
    if (ok) toast.success("Skill markdown copied to clipboard");
    else toast.error("Could not access the clipboard");
  };

  return (
    <Card className={cn("flex flex-col transition-opacity", !enabled && "opacity-60")}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <code className="font-mono text-[15px] font-semibold tracking-tight">
                {skill.name}
              </code>
              <Badge variant={skill.source === "bundled" ? "secondary" : "default"}>
                {skill.source === "bundled" ? "Bundled" : "Custom"}
              </Badge>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {valid ? (
              <span
                className="inline-flex items-center gap-1 text-xs text-emerald-500"
                title={warnings > 0 ? `${warnings} warning(s)` : "Valid skill"}
              >
                <CheckCircle2 size={15} />
                {warnings > 0 && <span>{warnings}</span>}
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1 text-xs text-amber-500"
                title={issues.map((i) => i.message).join("\n")}
              >
                <TriangleAlert size={15} />
                {issues.length}
              </span>
            )}
            <Switch
              checked={enabled}
              onCheckedChange={() => onToggleEnabled(skill.id)}
              aria-label={enabled ? `Disable ${skill.name}` : `Enable ${skill.name}`}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-3">
        <p className="line-clamp-2 text-sm text-muted-foreground">{skill.description}</p>
        {skill.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {skill.tags.map((t) => (
              <Badge key={t} variant="outline" className="font-normal">
                {t}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex items-center gap-1 border-t pt-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/skills/${skill.id}`}>
            <Eye size={14} /> View
          </Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/skills/${skill.id}/edit`}>
            <Pencil size={14} /> Edit
          </Link>
        </Button>
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" title="Copy markdown" onClick={handleCopy}>
            <Copy size={14} />
          </Button>
          <Button variant="ghost" size="icon-sm" title="Download .md" onClick={handleExport}>
            <Download size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            title="Delete skill"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(skill)}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
