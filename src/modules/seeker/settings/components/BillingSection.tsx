import React from 'react';
import { CheckCircle2, Calendar, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BillingSection() {
  return (
    <section id="billing" className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="p-6 border-b border-slate-100">
        <h3 className="text-lg font-bold text-slate-900">Billing & Subscription</h3>
        <p className="text-sm text-slate-500">
          Manage your plan, billing cycle, and payment information.
        </p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="p-5 border border-primary/20 bg-primary/5 rounded-xl">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary text-white mb-2">
                    Current Plan
                  </span>
                  <h4 className="text-2xl font-bold text-slate-900">Professional Plan</h4>
                  <p className="text-sm text-slate-500 mt-1">
                    Billed annually ($240/year)
                  </p>
                </div>
                <Button variant="link" size="sm" className="font-bold px-0">
                  Upgrade Plan
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  'Unlimited Job Applications',
                  'AI Resume Optimizer',
                  'Priority Profile Listing',
                  'Early Access to New Jobs',
                ].map((feature) => (
                  <div key={feature} className="flex items-start gap-2">
                    <CheckCircle2 className="text-primary w-5 h-5 shrink-0" />
                    <span className="text-sm text-slate-700">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-primary/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="text-slate-400 w-5 h-5" />
                  <p className="text-sm text-slate-600">
                    Next billing date:{' '}
                    <span className="font-bold text-slate-900">October 12, 2024</span>
                  </p>
                </div>
                <Button variant="link" size="sm" className="font-semibold text-slate-500 hover:text-red-600 px-0">
                  Cancel Plan
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Payment Method
            </h4>
            <div className="p-4 border border-slate-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-12 bg-slate-100 rounded flex items-center justify-center">
                  <CreditCard className="text-slate-500 w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Visa •••• 4242</p>
                  <p className="text-xs text-slate-500 uppercase">Expires 12/26</p>
                </div>
              </div>
              <Button variant="link" size="sm" className="font-bold px-0">
                Edit
              </Button>
            </div>
            <Button variant="outline" size="sm" className="font-bold rounded-lg transition-colors">
              View Billing History
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}