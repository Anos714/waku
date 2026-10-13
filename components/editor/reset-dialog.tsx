"use client";

import { RotateCcw } from "@/components/icons/ui-icons";
import { useEditor } from "./editor-provider";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function ResetDialog() {
  const { resetToDemo } = useEditor();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset to the demo profile?</DialogTitle>
          <DialogDescription>
            Your current draft is replaced with the bundled example profile and
            removed from this browser. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Keep my draft
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button type="button" variant="default" onClick={resetToDemo}>
              <RotateCcw className="h-4 w-4" />
              Reset everything
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
