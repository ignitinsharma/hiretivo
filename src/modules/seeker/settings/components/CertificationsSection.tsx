"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  CertificationInputSchema,
  type CertificationInput,
} from "@/lib/validations/certification.schema";
import { seekerService } from "@/services/seeker.service";
import type { CertificationItem } from "@/services/seeker.service";

interface CertificationFormProps {
  initialValues?: CertificationInput;
  onSave: (data: CertificationInput) => void;
  onCancel: () => void;
  isSaving: boolean;
}

/*
 * CertificationForm
 * Inline add/edit form for one certification entry.
 */
function CertificationForm({ initialValues, onSave, onCancel, isSaving }: CertificationFormProps) {
  const form = useForm<CertificationInput>({
    resolver: zodResolver(CertificationInputSchema),
    defaultValues: initialValues ?? {
      name: "",
      issuer: "",
      issueDate: "",
      expiryDate: "",
      credentialUrl: "",
    },
  });

  return (
    <form onSubmit={form.handleSubmit(onSave)} className="space-y-4 rounded-xl border border-brand-border p-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-brand-foreground">Name</label>
          <Input {...form.register("name")} placeholder="AWS Certified Solutions Architect" aria-invalid={!!form.formState.errors.name} />
          {form.formState.errors.name && <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-brand-foreground">Issuer</label>
          <Input {...form.register("issuer")} placeholder="Amazon Web Services" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-brand-foreground">Issue Date (MM/YYYY)</label>
          <Input {...form.register("issueDate")} placeholder="01/2023" aria-invalid={!!form.formState.errors.issueDate} />
          {form.formState.errors.issueDate && <p className="text-xs text-red-500">{form.formState.errors.issueDate.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-brand-foreground">Expiry Date (MM/YYYY)</label>
          <Input {...form.register("expiryDate")} placeholder="01/2026" aria-invalid={!!form.formState.errors.expiryDate} />
          {form.formState.errors.expiryDate && <p className="text-xs text-red-500">{form.formState.errors.expiryDate.message}</p>}
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-sm font-semibold text-brand-foreground">Credential URL</label>
          <Input {...form.register("credentialUrl")} placeholder="https://..." aria-invalid={!!form.formState.errors.credentialUrl} />
          {form.formState.errors.credentialUrl && <p className="text-xs text-red-500">{form.formState.errors.credentialUrl.message}</p>}
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="default" size="sm" onClick={onCancel} disabled={isSaving}>Cancel</Button>
        <Button type="submit" variant="primary" size="sm" disabled={isSaving}>{isSaving ? "Saving..." : "Save"}</Button>
      </div>
    </form>
  );
}

/*
 * CertificationsSection
 * Seeker settings panel for managing certifications. Full-replace list
 * editor mirroring WorkExperienceSection's add/edit/remove pattern.
 */
export function CertificationsSection() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery<{ data: { certifications: CertificationItem[] } }>({
    queryKey: ["seeker-certifications"],
    queryFn: seekerService.getCertifications,
    staleTime: 60_000,
  });
  const items = data?.data.certifications ?? [];

  const [entries, setEntries] = useState<CertificationItem[]>([]);
  const [addingNew, setAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    setEntries(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (updated: CertificationItem[]) =>
      seekerService.updateCertifications(updated.map(({ id: _id, ...rest }) => rest)),
    onSuccess: () => {
      toast.success("Certifications updated.");
      queryClient.invalidateQueries({ queryKey: ["seeker-certifications"] });
      setAddingNew(false);
      setEditingId(null);
    },
    onError: () => toast.error("Failed to save. Try again."),
  });

  const handleAdd = (data: CertificationInput): void => {
    const newEntries = [...entries, { id: `temp-${Date.now()}`, ...data }];
    setEntries(newEntries);
    saveMutation.mutate(newEntries);
  };

  const handleEdit = (id: string, data: CertificationInput): void => {
    const newEntries = entries.map((e) => (e.id === id ? { id, ...data } : e));
    setEntries(newEntries);
    saveMutation.mutate(newEntries);
  };

  const handleRemove = (id: string): void => {
    const newEntries = entries.filter((e) => e.id !== id);
    setEntries(newEntries);
    saveMutation.mutate(newEntries);
  };

  return (
    <section id="certifications" className="rounded-xl border border-brand-border bg-white">
      <div className="flex items-start justify-between gap-4 border-b border-brand-border p-6">
        <div>
          <h3 className="text-lg font-bold text-brand-foreground">Certifications</h3>
          <p className="text-sm text-brand-foreground-muted">Add certifications to strengthen your profile.</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => { setAddingNew(true); setEditingId(null); }}
          disabled={isLoading || addingNew}
          aria-label="Add certification"
        >
          <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Add
        </Button>
      </div>

      <div className="space-y-4 p-6">
        {isError && <p className="text-sm text-red-500">Failed to load certifications.</p>}
        {isLoading ? (
          <p className="text-sm text-brand-foreground-muted">Loading...</p>
        ) : (
          <>
            {entries.map((entry) => (
              <div key={entry.id}>
                {editingId === entry.id ? (
                  <CertificationForm
                    initialValues={entry}
                    onSave={(data) => handleEdit(entry.id, data)}
                    onCancel={() => setEditingId(null)}
                    isSaving={saveMutation.isPending}
                  />
                ) : (
                  <div className="flex items-start justify-between gap-2 rounded-xl border border-brand-border p-4">
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-brand-foreground">{entry.name}</p>
                      {entry.issuer && <p className="text-xs text-brand-foreground-muted">{entry.issuer}</p>}
                      {entry.issueDate && (
                        <p className="text-xs text-brand-foreground-muted">
                          {entry.issueDate}{entry.expiryDate ? ` – ${entry.expiryDate}` : ""}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button type="button" variant="ghost" size="icon" onClick={() => { setEditingId(entry.id); setAddingNew(false); }} aria-label={`Edit ${entry.name}`}>
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" onClick={() => handleRemove(entry.id)} disabled={saveMutation.isPending} aria-label={`Remove ${entry.name}`}>
                        <Trash2 className="h-4 w-4 text-red-500" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {entries.length === 0 && !addingNew && (
              <p className="text-sm text-brand-foreground-muted">No certifications added yet.</p>
            )}

            {addingNew && (
              <CertificationForm onSave={handleAdd} onCancel={() => setAddingNew(false)} isSaving={saveMutation.isPending} />
            )}
          </>
        )}
      </div>
    </section>
  );
}
