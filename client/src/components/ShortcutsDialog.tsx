import { Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { APP_SHORTCUTS } from "@/hooks/useShortcuts";

/** Discoverable list of keyboard shortcuts, opened from the header. */
export function ShortcutsDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          title="Keyboard shortcuts"
          aria-label="Keyboard shortcuts"
        >
          <Keyboard size={17} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>
            Work faster without leaving the keyboard.
          </DialogDescription>
        </DialogHeader>
        <ul className="divide-y rounded-lg border">
          {APP_SHORTCUTS.map((s, i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm">{s.description}</p>
                <p className="text-xs text-muted-foreground">{s.where}</p>
              </div>
              <KbdGroup className="shrink-0">
                {s.keys.map((k) => (
                  <Kbd key={k}>{k}</Kbd>
                ))}
              </KbdGroup>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          On macOS use <Kbd>⌘</Kbd> instead of <Kbd>Ctrl</Kbd>.
        </p>
      </DialogContent>
    </Dialog>
  );
}
