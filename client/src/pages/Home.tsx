import { useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  FileUp,
  Moon,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import { toast } from "sonner";
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
import { Input } from "@/components/ui/input";
import { SkillCard } from "@/components/SkillCard";
import { useTheme } from "@/contexts/ThemeContext";
import { useSkills } from "@/hooks/useSkills";
import { setImportDraft } from "@/lib/importDraft";
import {
  nameFromFilename,
  parseSkillMarkdown,
  type Skill,
  type SkillDraft,
} from "@/lib/skills";
import { cn } from "@/lib/utils";

export default function Home() {
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const {
    skills,
    allTags,
    isEnabled,
    toggleEnabled,
    deleteSkill,
    resetAll,
  } = useSkills();

  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Skill | null>(null);
  const [showReset, setShowReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return skills.filter((s) => {
      if (activeTag && !s.tags.includes(activeTag)) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [skills, query, activeTag]);

  const enabledCount = useMemo(() => skills.filter((s) => isEnabled(s.id)).length, [skills, isEnabled]);

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseSkillMarkdown(text);
      const draft: SkillDraft = {
        name: parsed.name || nameFromFilename(file.name),
        description: parsed.description,
        tags: parsed.tags,
        license: parsed.license ?? "",
        body: parsed.body,
      };
      setImportDraft(draft);
      navigate("/new");
      toast.info("Skill imported — review it and hit save");
    } catch {
      toast.error("Could not read that file");
    }
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteSkill(deleteTarget.id);
    toast.success(`Deleted "${deleteTarget.name}"`);
    setDeleteTarget(null);
  };

  const confirmReset = () => {
    resetAll();
    setQuery("");
    setActiveTag(null);
    setShowReset(false);
    toast.success("Library reset to bundled defaults");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight">Agent Skill Studio</span>
                <Badge variant="outline" className="text-[9px] tracking-[0.14em]">
                  OPEN SOURCE
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Local-first manager for AI agent skills
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            >
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </Button>
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <FileUp size={14} /> Import .md
            </Button>
            <Button size="sm" asChild>
              <Link href="/new">
                <Plus size={14} /> New skill
              </Link>
            </Button>
          </div>
        </div>
      </header>
      <input
        ref={fileRef}
        type="file"
        accept=".md,.markdown,text/markdown"
        className="hidden"
        onChange={handleImportFile}
      />

      <main className="mx-auto max-w-6xl px-5 pb-20">
        {/* Hero */}
        <div className="py-10">
          <div className="eyebrow">
            <Sparkles size={14} /> LOCAL-FIRST SKILL MANAGER
          </div>
          <h1 className="hero">Every skill your agents use, in one studio.</h1>
          <p className="hero-sub">
            Create, validate, organize, and export <code>SKILL.md</code> files for Claude
            Code and other agent harnesses — all in your browser, nothing leaves your
            machine.
          </p>
          <div className="mt-5 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>
              <strong className="text-foreground">{skills.length}</strong> skills
            </span>
            <span>
              <strong className="text-foreground">{enabledCount}</strong> enabled
            </span>
            <span>
              <strong className="text-foreground">{allTags.length}</strong> tags
            </span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search skills by name, description, or tag…"
                className="pl-9"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReset(true)}
              className="shrink-0 text-muted-foreground"
              title="Remove custom skills and restore bundled defaults"
            >
              <RotateCcw size={14} /> Reset library
            </Button>
          </div>
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <Badge
                variant={activeTag === null ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setActiveTag(null)}
              >
                All
              </Badge>
              {allTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={activeTag === tag ? "default" : "outline"}
                  className={cn("cursor-pointer font-normal", activeTag !== tag && "hover:border-primary")}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((skill) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                enabled={isEnabled(skill.id)}
                onToggleEnabled={toggleEnabled}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        ) : (
          <div className="grid place-items-center rounded-xl border border-dashed py-20 text-center">
            <div>
              <p className="font-semibold">No skills found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {query || activeTag
                  ? "Try a different search or clear the tag filter."
                  : "Create your first skill to get started."}
              </p>
              {(query || activeTag) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    setQuery("");
                    setActiveTag(null);
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        Agent Skill Studio — your skills never leave this browser.
      </footer>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this skill?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.source === "bundled" ? (
                <>
                  "<code className="font-mono">{deleteTarget?.name}</code>" is a bundled
                  skill. It will be hidden, and you can bring it back any time with
                  "Reset library".
                </>
              ) : (
                <>
                  "<code className="font-mono">{deleteTarget?.name}</code>" will be
                  permanently removed from this browser. This cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset confirmation */}
      <AlertDialog open={showReset} onOpenChange={setShowReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset library?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes all your custom skills, restores the bundled samples, and
              re-enables everything. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReset}>Reset</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
