'use client';

import React from 'react';
import { useForm as useHookForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';

export function PersonalInfoSection() {
  const { register, handleSubmit } = useHookForm({
    defaultValues: {
      fullName: 'Alex Rivera',
      location: '',
      website: '',
    },
  });

  const onSubmit = (data: any) => {
    console.log(data);
  };

  return (
    <section id="account" className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="p-6 border-b border-slate-100">
        <h3 className="text-lg font-bold text-slate-900">Personal Information</h3>
        <p className="text-sm text-slate-500">
          This information will be displayed on your public profile.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="p-6 space-y-8">
          <div className="flex items-center gap-6">
            <div className="h-[72px] w-[72px] rounded-full overflow-hidden border-2 border-slate-100 bg-slate-50 flex items-center justify-center font-bold text-slate-400 text-xl">
              AR
            </div>
            <div className="flex items-center gap-4">
              <Button type="button" variant="link" size="sm" className="font-semibold px-0">
                Change photo
              </Button>
              <Button type="button" variant="link" size="sm" className="font-semibold text-slate-500 px-0">
                Remove
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Full Name</label>
              <input
                {...register('fullName')}
                className="w-full rounded-lg border-slate-300 focus:border-primary focus:ring-primary text-sm"
                type="text"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Email Address</label>
              <div className="relative">
                <input
                  className="w-full rounded-lg border-slate-200 bg-slate-50 text-slate-500 text-sm pr-24"
                  disabled
                  type="email"
                  value="alex.rivera@example.com"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded">
                  Verified
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Location</label>
              <input
                {...register('location')}
                className="w-full rounded-lg border-slate-300 focus:border-primary focus:ring-primary text-sm"
                placeholder="e.g. San Francisco, CA"
                type="text"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Website</label>
              <input
                {...register('website')}
                className="w-full rounded-lg border-slate-300 focus:border-primary focus:ring-primary text-sm"
                placeholder="https://yourportfolio.com"
                type="url"
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 flex items-center justify-end gap-4">
          <Button type="button" variant="ghost" size="sm" className="font-medium">
            Cancel
          </Button>
          <Button type="submit" variant="brand" size="sm" className="px-5">
            Save Changes
          </Button>
        </div>
      </form>
    </section>
  );
}