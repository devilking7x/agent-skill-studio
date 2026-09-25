import { useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Download,
  FolderDown,
  Pencil,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InstallBundleDialog } from "@/components/InstallBundleDialog";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSkills } from "@/hooks/useSkills";
import { useShortcut } from "@/hooks/useShortcuts";
import {
  copyToClipboard,
  downloadTextFile,
  hasErrors,
  serializeSkill,
  validateSkill,
} from "@/lib/skills";

export default function SkillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { getSkill, isEnabled, toggleEnabled, deleteSkill } = useSkills();
  const [showDelete, setShowDelete] = useState(false);
  const [showBundle, setShowBundle] = useState(false);

  const skill = id ? getSkill(id) : undefined;

  const handleExport = () => {
    if (!skill) return;
    downloadTextFile(`${skill.name}.md`, serializeSkill(skill));
    toast.success(`Exported ${skill.name}.md`);
  };

  // Ctrl/⌘+S exports the current skill as .md.
  useShortcut("s", handleExport, { ctrlOrCmd: true, ignoreWhenTyping: false });

  if (!skill) {
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

  const issues = validateSkill(skill);
  const valid = !hasErrors(issues);
  const enabled = isEnabled(skill.id);
  const markdown = serializeSkill(skill);

  const handleCopy = async () => {
    const ok = await copyToClipboard(markdown);
    if (ok) toast.success("Skill markdown copied to clipboard");
    else toast.error("Could not access the clipboard");
  };

  const confirmDelete = () => {
    deleteSkill(skill.id);
    toast.success(`Deleted "${skill.name}"`);
    navigate("/");
  };

  const frontmatterRows: [string, string][] = [
    ["name", skill.name],
    ["description", skill.description],
  ];
  if (skill.license) frontmatterRows.push(["license", skill.license]);
  if (skill.tags.length > 0) frontmatterRows.push(["tags", skill.tags.join(", ")]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-5 py-10">
        <Button variant="ghost" size="sm" asChild className="mb-6 -ml-2">
          <Link href="/">
            <ArrowLeft size={14} /> Library
          </Link>
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-mono text-2xl font-bold tracking-tight">{skill.name}</h1>
              <Badge variant={skill.source === "bundled" ? "secondary" : "default"}>
                {skill.source === "bundled" ? "Bundled" : "Custom"}
              </Badge>
              {valid ? (
                <Badge variant="outline" className="gap-1 text-emerald-500">
                  <CheckCircle2 size={13} /> Valid
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 text-amber-500">
                  <TriangleAlert size={13} /> {issues.length} issue
                  {issues.length === 1 ? "" : "s"}
                </Badge>
              )}
            </div>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {skill.description}
            </p>
            {skill.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {skill.tags.map((t) => (
                  <Badge key={t} variant="outline" className="font-normal">
                    {t}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Switch
              checked={enabled}
              onCheckedChange={() => toggleEnabled(skill.id)}
              aria-label={enabled ? "Disable skill" : "Enable skill"}
            />
            {enabled ? "Enabled" : "Disabled"}
          </label>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button size="sm" asChild>
            <Link href={`/skills/${skill.id}/edit`}>
              <Pencil size={14} /> Edit
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download size={14} /> Export .md
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowBundle(true)}>
            <FolderDown size={14} /> Install bundle
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy size={14} /> Copy markdown
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => setShowDelete(true)}
          >
            <Trash2 size={14} /> Delete
          </Button>
        </div>

        {issues.length > 0 && (
          <div className="mt-6 rounded-lg border p-4">
            <h3 className="mb-2 text-sm font-semibold">Validation</h3>
            <ul className="space-y-1.5">
              {issues.map((issue, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px]">
                  {issue.level === "error" ? (
                    <TriangleAlert size={14} className="mt-0.5 shrink-0 text-destructive" />
                  ) : (
                    <TriangleAlert size={14} className="mt-0.5 shrink-0 text-amber-500" />
                  )}
                  <span>
                    <code className="mr-1.5 font-mono text-[11px] text-muted-foreground">
                      {issue.field}
                    </code>
                    {issue.message}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Tabs defaultValue="preview" className="mt-6">
          <TabsList>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="frontmatter">Frontmatter</TabsTrigger>
            <TabsTrigger value="source">Source</TabsTrigger>
          </TabsList>
          <TabsContent value="preview">
            <div className="rounded-lg border bg-card p-6">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <Streamdown>{skill.body || "*No instructions yet.*"}</Streamdown>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="frontmatter">
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <tbody>
                  {frontmatterRows.map(([k, v]) => (
                    <tr key={k} className="border-b last:border-0">
                      <td className="w-32 bg-muted/50 px-4 py-2.5 font-mono text-xs text-muted-foreground">
                        {k}
                      </td>
                      <td className="px-4 py-2.5">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
          <TabsContent value="source">
            <div className="relative">
              <pre className="overflow-x-auto rounded-lg border bg-card p-5 font-mono text-[12.5px] leading-relaxed">
                {markdown}
              </pre>
              <Button
                variant="secondary"
                size="sm"
                className="absolute right-3 top-3"
                onClick={handleCopy}
              >
                <Copy size={13} /> Copy
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <p className="mt-6 text-xs text-muted-foreground">
          Created {new Date(skill.createdAt).toLocaleDateString()} · Updated{" "}
          {new Date(skill.updatedAt).toLocaleDateString()}
        </p>
      </div>

      <InstallBundleDialog skill={skill} open={showBundle} onOpenChange={setShowBundle} />

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this skill?</AlertDialogTitle>
            <AlertDialogDescription>
              "{skill.name}" will be removed from this browser. This cannot be undone
              {skill.source === "bundled" ? ", but you can restore it with Reset library" : ""}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
