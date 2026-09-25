import { useMemo, useState } from "react";
import { CheckCircle2, Eye, PencilLine, TriangleAlert } from "lucide-react";
import { Streamdown } from "streamdown";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useShortcut } from "@/hooks/useShortcuts";
import {
  hasErrors,
  validateSkill,
  type SkillDraft,
} from "@/lib/skills";
import { cn } from "@/lib/utils";

interface SkillEditorProps {
  initial: SkillDraft;
  existingNames: string[];
  /** Original name of the skill being edited (excluded from duplicate check). */
  excludeName?: string;
  heading: string;
  subheading: string;
  saveLabel: string;
  onSave: (draft: SkillDraft) => void;
  onCancel: () => void;
}

export function SkillEditor({
  initial,
  existingNames,
  excludeName,
  heading,
  subheading,
  saveLabel,
  onSave,
  onCancel,
}: SkillEditorProps) {
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [tagsInput, setTagsInput] = useState(initial.tags.join(", "));
  const [license, setLicense] = useState(initial.license ?? "");
  const [body, setBody] = useState(initial.body);
  const [touched, setTouched] = useState(false);

  const draft: SkillDraft = useMemo(
    () => ({
      name,
      description,
      tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
      license,
      body,
    }),
    [name, description, tagsInput, license, body],
  );

  const issues = useMemo(() => {
    const names = excludeName ? existingNames.filter((n) => n !== excludeName) : existingNames;
    return validateSkill(draft, names);
  }, [draft, existingNames, excludeName]);
  const errors = issues.filter((i) => i.level === "error");
  const warnings = issues.filter((i) => i.level === "warning");
  const showIssues = touched || name !== initial.name || description !== initial.description;

  const issuesFor = (field: "name" | "description" | "body") =>
    issues.filter((i) => i.field === field);

  const handleSave = () => {
    setTouched(true);
    if (hasErrors(issues)) return;
    onSave(draft);
  };

  // Ctrl/⌘+S saves the draft from anywhere in the editor.
  useShortcut("s", handleSave, { ctrlOrCmd: true, ignoreWhenTyping: false });

  const fieldClass = (field: "name" | "description" | "body") =>
    cn(
      issuesFor(field).some((i) => i.level === "error") &&
        "border-destructive focus-visible:ring-destructive",
    );

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{heading}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{subheading}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="skill-name">Name</Label>
            <Input
              id="skill-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-awesome-skill"
              className={cn("font-mono", fieldClass("name"))}
              spellCheck={false}
            />
            <p className="text-xs text-muted-foreground">
              Lowercase letters, numbers, and hyphens only · max 64 characters.
            </p>
            {showIssues && <FieldIssues field="name" issues={issues} />}
          </div>

          <div className="space-y-2">
            <Label htmlFor="skill-description">Description</Label>
            <Textarea
              id="skill-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this skill does and when an agent should use it…"
              rows={3}
              className={fieldClass("description")}
            />
            {showIssues && <FieldIssues field="description" issues={issues} />}
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="skill-tags">Tags</Label>
              <Input
                id="skill-tags"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="review, quality"
                spellCheck={false}
              />
              <p className="text-xs text-muted-foreground">Comma-separated.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="skill-license">License (optional)</Label>
              <Input
                id="skill-license"
                value={license}
                onChange={(e) => setLicense(e.target.value)}
                placeholder="MIT"
                spellCheck={false}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="skill-body">Instructions (markdown)</Label>
              <span className="text-xs text-muted-foreground">{body.length} chars</span>
            </div>
            <Tabs defaultValue="write" className="w-full">
              <TabsList className="mb-2">
                <TabsTrigger value="write">
                  <PencilLine size={14} className="mr-1.5" /> Write
                </TabsTrigger>
                <TabsTrigger value="preview">
                  <Eye size={14} className="mr-1.5" /> Preview
                </TabsTrigger>
              </TabsList>
              <TabsContent value="write">
                <Textarea
                  id="skill-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={"# My Skill\n\nInstructions the agent should follow…"}
                  rows={18}
                  className={cn("font-mono text-[13px] leading-relaxed", fieldClass("body"))}
                  spellCheck={false}
                />
              </TabsContent>
              <TabsContent value="preview">
                <div className="min-h-[300px] rounded-md border bg-card p-5">
                  {body.trim() ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <Streamdown>{body}</Streamdown>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Nothing to preview yet — write some instructions first.
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
            {showIssues && <FieldIssues field="body" issues={issues} />}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleSave}>{saveLabel}</Button>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <span className="ml-1 hidden items-center gap-1 text-xs text-muted-foreground sm:inline-flex">
              <KbdGroup>
                <Kbd>Ctrl</Kbd>
                <Kbd>S</Kbd>
              </KbdGroup>
              to save
            </span>
          </div>
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-lg border bg-card p-5">
            <h3 className="mb-3 text-sm font-semibold">Live validation</h3>
            {issues.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-emerald-500">
                <CheckCircle2 size={16} />
                Valid skill — ready to save.
              </div>
            ) : (
              <ul className="space-y-2.5">
                {issues.map((issue, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px]">
                    {issue.level === "error" ? (
                      <TriangleAlert size={15} className="mt-0.5 shrink-0 text-destructive" />
                    ) : (
                      <TriangleAlert size={15} className="mt-0.5 shrink-0 text-amber-500" />
                    )}
                    <span>
                      <Badge variant="outline" className="mr-1.5 font-mono text-[10px]">
                        {issue.field}
                      </Badge>
                      {issue.message}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 border-t pt-4 text-xs leading-relaxed text-muted-foreground">
              <p className="mb-1 font-semibold text-foreground">SKILL.md spec</p>
              <p>
                <code className="font-mono">name</code> and{" "}
                <code className="font-mono">description</code> are required in the
                frontmatter. The body holds the instructions your agent follows.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function FieldIssues({
  field,
  issues,
}: {
  field: "name" | "description" | "body";
  issues: ReturnType<typeof validateSkill>;
}) {
  const list = issues.filter((i) => i.field === field);
  if (list.length === 0) return null;
  return (
    <div className="space-y-1.5">
      {list.map((issue, i) => (
        <Alert
          key={i}
          variant={issue.level === "error" ? "destructive" : "default"}
          className="py-2"
        >
          <AlertDescription className="text-xs">{issue.message}</AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
