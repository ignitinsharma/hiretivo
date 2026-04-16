"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function DangerZoneSection() {
  const [confirmText, setConfirmText] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/delete-account", { method: "POST" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Failed to delete account");
      }
    },
    onSuccess: () => {
      toast.success("Account deleted");
      window.location.href = "/";
    },
    onError: (error: Error) => {
      toast.error(error.message ?? "Failed to delete account");
    },
  });

  const handleDelete = () => {
    if (confirmText !== "DELETE") return;
    deleteMutation.mutate();
    setIsDeleting(true);
  };

  return (
    <section
      id="danger"
      className="bg-[#FFF5F5] border-l-4 border-red-600 border-t border-b border-r border-red-100 rounded-xl overflow-hidden shadow-sm"
    >
      <div className="p-6">
        <h3 className="text-lg font-bold text-red-600">Danger Zone</h3>
        <div className="mt-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="max-w-md">
              <p className="text-sm font-bold text-slate-900">Delete Account</p>
              <p className="text-xs text-slate-600">
                Permanently delete your account and all data. This action is
                irreversible.
              </p>
            </div>
            <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="rounded-lg whitespace-nowrap">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    Are you absolutely sure?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your
                    account and remove your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="my-4">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Type <span className="font-bold text-red-600">DELETE</span> to
                    confirm
                  </label>
                  <Input
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="DELETE"
                    className="max-w-xs"
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={confirmText !== "DELETE" || isDeleting}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isDeleting ? "Deleting..." : "Delete Account"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </section>
  );
}
