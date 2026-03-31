'use client';

import { User, Building, Bell, Shield, CreditCard, Globe } from 'lucide-react';
import { RecruiterHeader } from '@/components/layout/RecruiterHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

const SETTINGS_TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'company', label: 'Company', icon: Building },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'integrations', label: 'Integrations', icon: Globe },
];

export default function SettingsPage() {
  return (
    <div>
      <RecruiterHeader title="Settings" subtitle="Manage your account and preferences" />

      <div className="p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex flex-col md:flex-row">
            <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-gray-100 p-4">
              <nav className="space-y-1">
                {SETTINGS_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      tab.id === 'profile'
                        ? 'bg-brand-primary/10 text-brand-primary'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </aside>

            <div className="flex-1 p-6">
              <div className="max-w-xl">
                <h2 className="text-lg font-bold text-gray-900 mb-6">Profile Settings</h2>

                <div className="space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary text-2xl font-bold">
                      AC
                    </div>
                    <div>
                      <Button variant="outline" size="sm">
                        Change Avatar
                      </Button>
                      <p className="text-xs text-gray-500 mt-1">
                        JPG, PNG or GIF. Max 2MB.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        First Name
                      </label>
                      <Input defaultValue="John" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Last Name
                      </label>
                      <Input defaultValue="Doe" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email
                    </label>
                    <Input type="email" defaultValue="john.doe@acmecorp.com" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Job Title
                    </label>
                    <Input defaultValue="Head of Engineering" />
                  </div>

                  <div className="flex items-center justify-between py-4 border-t border-gray-100">
                    <div>
                      <p className="font-medium text-gray-900">Email Notifications</p>
                      <p className="text-sm text-gray-500">
                        Receive email updates about your job postings
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between py-4 border-t border-gray-100">
                    <div>
                      <p className="font-medium text-gray-900">Application Alerts</p>
                      <p className="text-sm text-gray-500">
                        Get notified when new candidates apply
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="pt-4">
                    <Button className="bg-brand-primary hover:bg-brand-primary/90 text-white">
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
