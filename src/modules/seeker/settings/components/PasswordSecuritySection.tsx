"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";

export function PasswordSecuritySection() {
  const { register, handleSubmit } = useForm();

  const onSubmit = (data: any) => {
    console.log(data);
  };

  return (
    <section
      id="security"
      className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"
    >
      <div className="p-6 border-b border-slate-100">
        <h3 className="text-lg font-bold text-slate-900">
          Password & Security
        </h3>
        <p className="text-sm text-slate-500">
          Ensure your account is using a long, random password to stay secure.
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-slate-700">
                Current Password
              </label>
              <input
                {...register("currentPassword")}
                className="w-full rounded-lg border-slate-300 focus:border-primary focus:ring-primary text-sm"
                placeholder="••••••••"
                type="password"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                New Password
              </label>
              <input
                {...register("newPassword")}
                className="w-full rounded-lg border-slate-300 focus:border-primary focus:ring-primary text-sm"
                placeholder="••••••••"
                type="password"
              />
              <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full w-2/3 bg-brand-primary"></div>
              </div>
              <p className="text-[10px] text-slate-400 font-medium uppercase">
                Strength: Strong
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Confirm New Password
              </label>
              <input
                {...register("confirmPassword")}
                className="w-full rounded-lg border-slate-300 focus:border-primary focus:ring-primary text-sm"
                placeholder="••••••••"
                type="password"
              />
            </div>
          </div>

          <Button type="submit" variant="default" size="sm" className="px-5">
            Update Password
          </Button>

          <div className="border-t border-slate-100 pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-slate-900">
                  Two-Factor Authentication (2FA)
                </p>
                <p className="text-xs text-slate-500">
                  Add an extra layer of security to your account.
                </p>
              </div>
              {/* Note: In a real app we'd use the switch from shadcn */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>
      </form>
    </section>
  );
}
