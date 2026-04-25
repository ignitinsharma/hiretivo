/* eslint-disable @next/next/no-page-custom-font */
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { User, Shield, CreditCard, CheckCircle2, Zap } from "lucide-react";
import { RecruiterHeader } from "@/components/layout/RecruiterHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  RecruiterProfileSettingsSchema,
  ChangePasswordSchema,
} from "@/lib/validations/interview.schema";
import { authService } from "@/services/auth.service";
import { billingService } from "@/services/billing.service";
import { recruiterService } from "@/services/recruiter.service";
import type {
  RecruiterProfileSettingsInput,
  ChangePasswordInput,
} from "@/lib/validations/interview.schema";
import { PlanTier } from "@/constants/enums";

type TabId = "profile" | "security" | "billing";

const SETTINGS_TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "billing", label: "Billing", icon: CreditCard },
];

interface SettingsData {
  name: string;
  email: string;
  companyName: string;
  bio: string;
  companySize: string;
  industry: string;
  website: string;
}

// ── Profile tab ───────────────────────────────────────────────────────────────

interface ProfileTabProps {
  settingsData: SettingsData | undefined;
  isSettingsLoading: boolean;
  isSettingsError: boolean;
}

function ProfileTabContent({ settingsData, isSettingsLoading, isSettingsError }: ProfileTabProps) {
  const queryClient = useQueryClient();

  const form = useForm<RecruiterProfileSettingsInput>({
    resolver: zodResolver(RecruiterProfileSettingsSchema),
    defaultValues: { name: "", companyName: "", bio: "", companySize: "", industry: "", website: "" },
  });

  useEffect(() => {
    if (settingsData) {
      form.reset({
        name: settingsData.name,
        companyName: settingsData.companyName,
        bio: settingsData.bio,
        companySize: settingsData.companySize,
        industry: settingsData.industry,
        website: settingsData.website,
      });
    }
  }, [settingsData, form]);

  const saveMutation = useMutation({
    mutationFn: recruiterService.updateSettings,
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
        <p className="text-sm text-red-500 mb-4">Failed to load settings. Try again.</p>
      )}

      <form onSubmit={form.handleSubmit((data) => saveMutation.mutate(data))}>
        <div className="space-y-6">
          <div>
            <label htmlFor="profile-name" className="block text-sm font-medium text-gray-700 mb-1.5">
              Name
            </label>
            {isSettingsLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Input id="profile-name" {...form.register("name")} aria-invalid={!!form.formState.errors.name} />
            )}
            {form.formState.errors.name && (
              <p className="text-xs text-red-500 mt-1">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="profile-email" className="block text-sm font-medium text-gray-700 mb-1.5">
              Email
            </label>
            {isSettingsLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Input id="profile-email" type="email" value={settingsData?.email ?? ""} readOnly className="bg-gray-50 text-gray-500" />
            )}
          </div>

          <div>
            <label htmlFor="profile-company" className="block text-sm font-medium text-gray-700 mb-1.5">
              Company Name
            </label>
            {isSettingsLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Input id="profile-company" {...form.register("companyName")} aria-invalid={!!form.formState.errors.companyName} />
            )}
            {form.formState.errors.companyName && (
              <p className="text-xs text-red-500 mt-1">{form.formState.errors.companyName.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="profile-size" className="block text-sm font-medium text-gray-700 mb-1.5">
                Company Size
              </label>
              {isSettingsLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Input id="profile-size" placeholder="e.g. 11–50 employees" {...form.register("companySize")} />
              )}
            </div>

            <div>
              <label htmlFor="profile-industry" className="block text-sm font-medium text-gray-700 mb-1.5">
                Industry
              </label>
              {isSettingsLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Input id="profile-industry" placeholder="e.g. Software / SaaS" {...form.register("industry")} />
              )}
            </div>
          </div>

          <div>
            <label htmlFor="profile-website" className="block text-sm font-medium text-gray-700 mb-1.5">
              Website
            </label>
            {isSettingsLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Input id="profile-website" type="url" placeholder="https://yourcompany.com" {...form.register("website")} aria-invalid={!!form.formState.errors.website} />
            )}
            {form.formState.errors.website && (
              <p className="text-xs text-red-500 mt-1">{form.formState.errors.website.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="profile-bio" className="block text-sm font-medium text-gray-700 mb-1.5">
              Bio
            </label>
            {isSettingsLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <Textarea id="profile-bio" rows={3} {...form.register("bio")} />
            )}
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              className="bg-brand-primary hover:bg-brand-primary/90 text-white"
              disabled={saveMutation.isPending || isSettingsLoading}
            >
              {saveMutation.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ── Security tab ──────────────────────────────────────────────────────────────

function SecurityTabContent() {
  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const mutation = useMutation({
    mutationFn: authService.changePassword,
    onSuccess: () => {
      toast.success("Password updated successfully.");
      form.reset();
    },
    onError: (error: Error) => {
      if (error.message === "Current password is incorrect.") {
        form.setError("currentPassword", { message: "Current password is incorrect." });
      } else {
        toast.error("Failed to update password. Try again.");
      }
    },
  });

  return (
    <div className="max-w-xl">
      <h2 className="text-lg font-bold text-gray-900 mb-6">Security</h2>

      <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))}>
        <div className="space-y-6">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
              Current Password
            </label>
            <Input id="currentPassword" type="password" {...form.register("currentPassword")} aria-invalid={!!form.formState.errors.currentPassword} />
            {form.formState.errors.currentPassword && (
              <p className="text-xs text-red-500 mt-1">{form.formState.errors.currentPassword.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
              New Password
            </label>
            <Input id="newPassword" type="password" {...form.register("newPassword")} aria-invalid={!!form.formState.errors.newPassword} />
            {form.formState.errors.newPassword && (
              <p className="text-xs text-red-500 mt-1">{form.formState.errors.newPassword.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
              Confirm New Password
            </label>
            <Input id="confirmPassword" type="password" {...form.register("confirmPassword")} aria-invalid={!!form.formState.errors.confirmPassword} />
            {form.formState.errors.confirmPassword && (
              <p className="text-xs text-red-500 mt-1">{form.formState.errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              className="bg-brand-primary hover:bg-brand-primary/90 text-white"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Updating…" : "Update Password"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ── Billing tab ───────────────────────────────────────────────────────────────

const FREE_FEATURES = ["5 active job posts", "Basic applicant management", "Email support"];
const PRO_FEATURES = [
  "Unlimited job posts",
  "AI candidate ranking",
  "Interview scheduling",
  "Analytics dashboard",
  "Priority support",
];

function BillingTabContent() {
  const { data: session } = useSession();
  const plan = (session?.user as { plan?: string } | undefined)?.plan ?? PlanTier.FREE;
  const isPro = plan === PlanTier.PRO;

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const url = await billingService.createCheckoutSession();
      window.location.href = url;
    },
    onError: () => toast.error("Could not start checkout. Try again."),
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const url = await billingService.createPortalSession();
      window.location.href = url;
    },
    onError: () => toast.error("Could not open billing portal. Try again."),
  });

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-bold text-gray-900 mb-6">Billing & Subscription</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className={`p-5 rounded-xl border-2 transition-colors ${!isPro ? "border-brand-primary bg-brand-primary/5" : "border-gray-200"}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-gray-900">Free</span>
            {!isPro && (
              <span className="px-2 py-0.5 bg-brand-primary text-white text-[10px] font-bold uppercase rounded">
                Current
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-4">$0</p>
          <ul className="space-y-2">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle2 className="w-4 h-4 text-gray-400 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className={`p-5 rounded-xl border-2 transition-colors ${isPro ? "border-brand-primary bg-brand-primary/5" : "border-gray-200"}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-brand-primary" />
              <span className="font-bold text-gray-900">Pro</span>
            </div>
            {isPro && (
              <span className="px-2 py-0.5 bg-brand-primary text-white text-[10px] font-bold uppercase rounded">
                Current
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-4">
            $149 <span className="text-sm font-normal text-gray-500">/month</span>
          </p>
          <ul className="space-y-2 mb-5">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle2 className="w-4 h-4 text-brand-primary shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          {isPro ? (
            <Button variant="outline" size="sm" onClick={() => portalMutation.mutate()} disabled={portalMutation.isPending}>
              {portalMutation.isPending ? "Opening…" : "Manage Billing"}
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={() => checkoutMutation.mutate()} disabled={checkoutMutation.isPending}>
              {checkoutMutation.isPending ? "Loading…" : "Upgrade to Pro"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  const {
    data: settingsQueryData,
    isLoading: isSettingsLoading,
    isError: isSettingsError,
  } = useQuery<{ data: SettingsData }>({
    queryKey: ["recruiter-settings"],
    queryFn: recruiterService.getSettings,
    staleTime: 60_000,
  });

  const settingsData = settingsQueryData?.data;

  return (
    <div className="w-full p-6">
      <RecruiterHeader title="Settings" subtitle="Manage your account and preferences" />

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm mt-6">
        <div className="flex flex-col md:flex-row">
          <aside className="w-full md:w-56 border-b md:border-b-0 md:border-r border-gray-100 p-4">
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
  );
}
