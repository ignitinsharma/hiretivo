/* eslint-disable @next/next/no-page-custom-font */
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  User,
  Shield,
  CreditCard,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { RecruiterHeader } from "@/components/layout/RecruiterHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { BillingTabContent } from "@/modules/billing/components/BillingTabContent";
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
import {
  RecruiterProfileSettingsSchema,
  ChangePasswordSchema,
} from "@/lib/validations/interview.schema";
import type {
  RecruiterProfileSettingsInput,
  ChangePasswordInput,
} from "@/lib/validations/interview.schema";

const SETTINGS_TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "billing", label: "Billing", icon: CreditCard },
];

interface SettingsData {
  name: string;
  email: string;
  companyName: string;
  bio: string;
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface ProfileTabProps {
  settingsData: SettingsData | undefined;
  isSettingsLoading: boolean;
  isSettingsError: boolean;
}

function ProfileTabContent({
  settingsData,
  isSettingsLoading,
  isSettingsError,
}: ProfileTabProps) {
  const queryClient = useQueryClient();

  const profileForm = useForm<RecruiterProfileSettingsInput>({
    resolver: zodResolver(RecruiterProfileSettingsSchema),
    defaultValues: { name: "", companyName: "", bio: "" },
  });

  useEffect(() => {
    if (settingsData) {
      profileForm.reset({
        name: settingsData.name,
        companyName: settingsData.companyName,
        bio: settingsData.bio,
      });
    }
  }, [settingsData]);

  const saveProfileMutation = useMutation({
    mutationFn: async (values: RecruiterProfileSettingsInput) => {
      const res = await fetch("/api/recruiter/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Failed to save");
    },
    onSuccess: () => {
      toast.success("Settings saved.");
      queryClient.invalidateQueries({ queryKey: ["recruiter-settings"] });
    },
    onError: () => toast.error("Failed to save settings. Try again."),
  });

  return (
    <div className="max-w-xl">
      <h2 className="text-lg font-bold text-gray-900 mb-6">Profile Settings</h2>

      {isSettingsError && (
        <p className="text-sm text-red-500 mb-4">
          Failed to load settings. Try again.
        </p>
      )}

      <form
        onSubmit={profileForm.handleSubmit((data) =>
          saveProfileMutation.mutate(data),
        )}
      >
        <div className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary text-2xl font-bold">
              {settingsData?.name
                ? settingsData.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                : "??"}
            </div>
          </div>

          <div>
            <label
              htmlFor="profile-name"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Name
            </label>
            {isSettingsLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Input
                id="profile-name"
                {...profileForm.register("name")}
                aria-invalid={!!profileForm.formState.errors.name}
              />
            )}
            {profileForm.formState.errors.name && (
              <p className="text-xs text-red-500 mt-1">
                {profileForm.formState.errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="profile-email"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Email
            </label>
            {isSettingsLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Input
                id="profile-email"
                type="email"
                value={settingsData?.email ?? ""}
                readOnly
                className="bg-gray-50 text-gray-500"
              />
            )}
          </div>

          <div>
            <label
              htmlFor="profile-company"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Company Name
            </label>
            {isSettingsLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Input
                id="profile-company"
                {...profileForm.register("companyName")}
                aria-invalid={!!profileForm.formState.errors.companyName}
              />
            )}
            {profileForm.formState.errors.companyName && (
              <p className="text-xs text-red-500 mt-1">
                {profileForm.formState.errors.companyName.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="profile-bio"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Bio
            </label>
            {isSettingsLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <Textarea
                id="profile-bio"
                rows={3}
                {...profileForm.register("bio")}
              />
            )}
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              className="bg-brand-primary hover:bg-brand-primary/90 text-white"
              disabled={saveProfileMutation.isPending || isSettingsLoading}
            >
              {saveProfileMutation.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

function SecurityTabContent() {
  const securityForm = useForm<ChangePasswordInput>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (values: ChangePasswordInput) => {
      const res = await fetch("/api/auth/change-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Failed to update password");
      }
    },
    onSuccess: () => {
      toast.success("Password updated successfully.");
      securityForm.reset();
    },
    onError: (error: Error) => {
      if (error.message === "Current password is incorrect.") {
        securityForm.setError("currentPassword", {
          message: "Current password is incorrect.",
        });
      } else {
        toast.error("Failed to update password. Try again.");
      }
    },
  });

  return (
    <div className="max-w-xl">
      <h2 className="text-lg font-bold text-gray-900 mb-6">Security</h2>

      <form
        onSubmit={securityForm.handleSubmit((data) =>
          changePasswordMutation.mutate(data),
        )}
      >
        <div className="space-y-6">
          <div>
            <label
              htmlFor="currentPassword"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Current Password
            </label>
            <Input
              id="currentPassword"
              type="password"
              {...securityForm.register("currentPassword")}
              aria-invalid={!!securityForm.formState.errors.currentPassword}
            />
            {securityForm.formState.errors.currentPassword && (
              <p className="text-xs text-red-500 mt-1">
                {securityForm.formState.errors.currentPassword.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              New Password
            </label>
            <Input
              id="newPassword"
              type="password"
              {...securityForm.register("newPassword")}
              aria-invalid={!!securityForm.formState.errors.newPassword}
            />
            {securityForm.formState.errors.newPassword && (
              <p className="text-xs text-red-500 mt-1">
                {securityForm.formState.errors.newPassword.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Confirm New Password
            </label>
            <Input
              id="confirmPassword"
              type="password"
              {...securityForm.register("confirmPassword")}
              aria-invalid={!!securityForm.formState.errors.confirmPassword}
            />
            {securityForm.formState.errors.confirmPassword && (
              <p className="text-xs text-red-500 mt-1">
                {securityForm.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              className="bg-brand-primary hover:bg-brand-primary/90 text-white"
              disabled={changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending
                ? "Updating…"
                : "Update Password"}
            </Button>
          </div>
        </div>
      </form>

      <DeleteAccountSection />
    </div>
  );
}

function DeleteAccountSection() {
  const [confirmText, setConfirmText] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch("/api/auth/delete-account", { method: "POST" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(body.error ?? "Failed to delete account");
        return;
      }
      toast.success("Account deleted");
      window.location.href = "/";
    } catch {
      toast.error("Failed to delete account");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="mt-8 pt-8 border-t border-gray-200">
      <h3 className="text-lg font-bold text-red-600 mb-2">Delete Account</h3>
      <p className="text-sm text-gray-600 mb-4">
        Once you delete your account, there is no going back. Please be certain.
      </p>
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm">
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
              account and remove your data from our servers. If you have an
              active subscription, it will be cancelled.
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
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");

  const {
    data: settingsQueryData,
    isLoading: isSettingsLoading,
    isError: isSettingsError,
  } = useQuery<{ data: SettingsData }>({
    queryKey: ["recruiter-settings"],
    queryFn: async () => {
      const res = await fetch("/api/recruiter/settings");
      if (!res.ok) throw new Error("Failed to load settings");
      return res.json() as Promise<{ data: SettingsData }>;
    },
    staleTime: 60_000,
  });

  const settingsData = settingsQueryData?.data;

  return (
    <div>
      <RecruiterHeader
        title="Settings"
        subtitle="Manage your account and preferences"
      />

      <div className="p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex flex-col md:flex-row">
            <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-gray-100 p-4">
              <nav className="space-y-1">
                {SETTINGS_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    aria-current={tab.id === activeTab ? "page" : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      tab.id === activeTab
                        ? "bg-brand-primary/10 text-brand-primary"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </aside>

            <div className="flex-1 p-6">
              {activeTab === "profile" && (
                <ProfileTabContent
                  settingsData={settingsData}
                  isSettingsLoading={isSettingsLoading}
                  isSettingsError={isSettingsError}
                />
              )}
              {activeTab === "security" && <SecurityTabContent />}
              {activeTab === "billing" && <BillingTabContent />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
