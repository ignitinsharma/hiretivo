"use client";

import { useState } from "react";
import { CircleCheck, CirclePlus } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function PricingClient() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <>
      {/* Hero Section */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#0A0A0F] tracking-tight mb-6">
            Pricing that scales with your hiring
          </h1>
          <p className="text-lg md:text-xl text-slate-500 mb-10 max-w-2xl mx-auto">
            Choose the plan that fits your team&apos;s needs. Join 5,000+ remote-first companies.
          </p>

          {/* Toggle Switch */}
          <div className="flex items-center justify-center mb-16 relative z-30">
            <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center shadow-inner border border-slate-200">
              <button
                type="button"
                onClick={() => setIsAnnual(false)}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                  !isAnnual
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setIsAnnual(true)}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                  isAnnual
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                Annual
                <span className="bg-[#10b981] text-white text-[10px] px-2 py-0.5 rounded-full uppercase font-black tracking-wider pointer-events-none">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-stretch px-4 relative z-0">
          {/* Card 1: Free */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col h-full text-left">
            <div className="mb-6">
              <h3 className="text-slate-900 font-bold uppercase tracking-wider text-xs mb-2">Free</h3>
              <p className="text-slate-500 text-xs mb-4 min-h-[32px]">
                {isAnnual ? "Try Hiretivo, no credit card needed" : "Free Tier - Lead Generator"}
              </p>
              <div className="flex items-baseline gap-1">
                <span className={cn("font-extrabold text-slate-900", isAnnual ? "text-4xl" : "text-4xl")}>$0</span>
                <span className={cn("text-slate-500", isAnnual ? "text-sm font-medium ml-1" : "text-sm ml-1")}>/mo</span>
              </div>
              <p className="mt-2 text-slate-400 text-[10px]">Forever free</p>
            </div>
            <div className="h-px bg-slate-100 mb-6"></div>
            <ul className="space-y-3 mb-8 grow">
              <li className="flex items-start gap-2">
                <CircleCheck
                  className="mt-0.5 shrink-0 fill-brand-primary text-white"
                  size={16}
                  strokeWidth={2.5}
                  aria-hidden
                />
                <span className="text-slate-700 text-xs">1 active job post</span>
              </li>
              <li className="flex items-start gap-2">
                <CircleCheck
                  className="mt-0.5 shrink-0 fill-brand-primary text-white"
                  size={16}
                  strokeWidth={2.5}
                  aria-hidden
                />
                <span className="text-slate-700 text-xs">20 applicant views/mo</span>
              </li>
              <li className="flex items-start gap-2">
                <CircleCheck
                  className="mt-0.5 shrink-0 fill-brand-primary text-white"
                  size={16}
                  strokeWidth={2.5}
                  aria-hidden
                />
                <span className="text-slate-700 text-xs">Basic AI skill match</span>
              </li>
              <li className="flex items-start gap-2">
                <CircleCheck
                  className="mt-0.5 shrink-0 fill-brand-primary text-white"
                  size={16}
                  strokeWidth={2.5}
                  aria-hidden
                />
                <span className="text-slate-700 text-xs">Email support</span>
              </li>
            </ul>
            <button className="w-full py-3 border border-slate-200 text-slate-900 bg-white text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors mt-auto">
              Get started free
            </button>
          </div>

          {/* Card 2: Starter */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col h-full text-left">
            <div className="mb-6">
              <h3 className="text-slate-900 font-bold uppercase tracking-wider text-xs mb-2">Starter</h3>
              <p className="text-slate-500 text-xs mb-4 min-h-[32px]">
                {isAnnual ? "For small teams & early-stage startups" : "Essential hiring tools"}
              </p>
              <div className="flex items-baseline gap-1">
                <span className={cn("font-extrabold text-slate-900", isAnnual ? "text-4xl" : "text-4xl")}>
                  {isAnnual ? "$31" : "$49"}
                </span>
                <span className={cn("text-slate-500", isAnnual ? "text-sm font-medium ml-1" : "text-sm ml-1")}>/mo</span>
              </div>
            </div>
            
            {isAnnual ? (
              <div className="bg-indigo-50 p-2.5 rounded-lg mb-6 text-center">
                <p className="text-brand-primary text-[10px] font-bold">Save $120/yr · $375 billed annually</p>
              </div>
            ) : (
              <div className="bg-slate-50 p-2.5 rounded-lg mb-6 text-center">
                <p className="text-slate-600 text-[10px] font-bold">Billed monthly</p>
              </div>
            )}
            
            <ul className="space-y-3 mb-8 grow">
              <li className="flex items-start gap-2">
                <CircleCheck
                  className="mt-0.5 shrink-0 fill-brand-primary text-white"
                  size={16}
                  strokeWidth={2.5}
                  aria-hidden
                />
                <span className="text-slate-700 text-xs">3 active job posts</span>
              </li>
              <li className="flex items-start gap-2">
                <CircleCheck
                  className="mt-0.5 shrink-0 fill-brand-primary text-white"
                  size={16}
                  strokeWidth={2.5}
                  aria-hidden
                />
                <span className="text-slate-700 text-xs">AI skill matching</span>
              </li>
              <li className="flex items-start gap-2">
                <CircleCheck
                  className="mt-0.5 shrink-0 fill-brand-primary text-white"
                  size={16}
                  strokeWidth={2.5}
                  aria-hidden
                />
                <span className="text-slate-700 text-xs">Candidate contact access</span>
              </li>
              <li className="flex items-start gap-2">
                <CircleCheck
                  className="mt-0.5 shrink-0 fill-brand-primary text-white"
                  size={16}
                  strokeWidth={2.5}
                  aria-hidden
                />
                <span className="text-slate-700 text-xs">Resume search</span>
              </li>
              <li className="flex items-start gap-2">
                <CircleCheck
                  className="mt-0.5 shrink-0 fill-brand-primary text-white"
                  size={16}
                  strokeWidth={2.5}
                  aria-hidden
                />
                <span className="text-slate-700 text-xs">Basic analytics</span>
              </li>
              <li className="flex items-start gap-2">
                <CircleCheck
                  className="mt-0.5 shrink-0 fill-brand-primary text-white"
                  size={16}
                  strokeWidth={2.5}
                  aria-hidden
                />
                <span className="text-slate-700 text-xs">Email + chat support</span>
              </li>
            </ul>
            <button className="w-full py-3 border border-slate-200 text-slate-900 bg-white text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors mt-auto">
              Start Starter plan
            </button>
          </div>

          {/* Card 3: Growth (Featured) */}
          <div className="bg-brand-primary border-2 border-brand-primary p-6 rounded-2xl shadow-xl flex flex-col h-full text-left relative transform lg:scale-105 z-10 text-white">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-brand-primary text-[10px] font-black px-4 py-1 rounded-full uppercase shadow-md whitespace-nowrap">
              Most Popular
            </div>
            <div className="mb-6">
              <h3 className="text-indigo-100 font-bold uppercase tracking-wider text-xs mb-2">Growth</h3>
              <p className="text-indigo-100 text-xs mb-4 min-h-[32px]">
                {isAnnual ? "For Series A teams on a hiring sprint" : "Scale your engineering team"}
              </p>
              <div className="flex items-baseline gap-1">
                <span className={cn("font-extrabold", isAnnual ? "text-4xl text-white" : "text-4xl")}>
                  {isAnnual ? "$95" : "$149"}
                </span>
                <span className={cn("text-indigo-200", isAnnual ? "text-sm font-medium ml-1" : "text-sm ml-1")}>/mo</span>
              </div>
            </div>
            
            {isAnnual ? (
              <div className="bg-white/10 p-2.5 rounded-lg mb-6 text-center">
                <p className="text-white text-[10px] font-bold">Save $360/yr · $1,140 billed annually</p>
              </div>
            ) : (
              <div className="bg-white/10 p-2.5 rounded-lg mb-6 text-center">
                <p className="text-white text-[10px] font-bold">Billed monthly</p>
              </div>
            )}
            
            <ul className="space-y-3 mb-8 grow">
              <li className="flex items-start gap-2">
                <CircleCheck
                  className="mt-0.5 shrink-0 fill-white text-brand-primary"
                  size={16}
                  strokeWidth={2.5}
                  aria-hidden
                />
                <span className="text-indigo-50 text-xs">8 active job posts</span>
              </li>
              <li className="flex items-start gap-2">
                <CircleCheck
                  className="mt-0.5 shrink-0 fill-white text-brand-primary"
                  size={16}
                  strokeWidth={2.5}
                  aria-hidden
                />
                <span className="text-indigo-50 text-xs">Advanced AI ranking</span>
              </li>
              <li className="flex items-start gap-2">
                <CircleCheck
                  className="mt-0.5 shrink-0 fill-white text-brand-primary"
                  size={16}
                  strokeWidth={2.5}
                  aria-hidden
                />
                <span className="text-indigo-50 text-xs">Interview scheduling</span>
              </li>
              <li className="flex items-start gap-2">
                <CircleCheck
                  className="mt-0.5 shrink-0 fill-white text-brand-primary"
                  size={16}
                  strokeWidth={2.5}
                  aria-hidden
                />
                <span className="text-indigo-50 text-xs">ATS integration</span>
              </li>
              <li className="flex items-start gap-2">
                <CircleCheck
                  className="mt-0.5 shrink-0 fill-white text-brand-primary"
                  size={16}
                  strokeWidth={2.5}
                  aria-hidden
                />
                <span className="text-indigo-50 text-xs">Unlimited resume DB</span>
              </li>
              <li className="flex items-start gap-2">
                <CircleCheck
                  className="mt-0.5 shrink-0 fill-white text-brand-primary"
                  size={16}
                  strokeWidth={2.5}
                  aria-hidden
                />
                <span className="text-indigo-50 text-xs">Priority support</span>
              </li>
              <li className="flex items-start gap-2">
                <CircleCheck
                  className="mt-0.5 shrink-0 fill-white text-brand-primary"
                  size={16}
                  strokeWidth={2.5}
                  aria-hidden
                />
                <span className="text-indigo-50 text-xs">Team seats (3)</span>
              </li>
            </ul>
            <button className="w-full py-3 bg-white text-brand-primary text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors mt-auto shadow-lg">
              Start Growth plan
            </button>
          </div>

          {/* Card 4: Pro */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col h-full text-left">
            <div className="mb-6">
              <h3 className="text-slate-900 font-bold uppercase tracking-wider text-xs mb-2">Pro</h3>
              <p className="text-slate-500 text-xs mb-4 min-h-[32px]">For scaling teams, multiple departments</p>
              <div className="flex items-baseline gap-1">
                <span className={cn("font-extrabold text-slate-900", isAnnual ? "text-4xl" : "text-4xl")}>
                  {isAnnual ? "$191" : "$299"}
                </span>
                <span className={cn("text-slate-500", isAnnual ? "text-sm font-medium ml-1" : "text-sm ml-1")}>/mo</span>
              </div>
            </div>
            
            {isAnnual ? (
              <div className="bg-indigo-50 p-2.5 rounded-lg mb-6 text-center">
                <p className="text-brand-primary text-[10px] font-bold">Save $720/yr · $2,295 billed annually</p>
              </div>
            ) : (
              <div className="bg-slate-50 p-2.5 rounded-lg mb-6 text-center">
                <p className="text-slate-600 text-[10px] font-bold">Billed monthly</p>
              </div>
            )}
            
            <ul className="space-y-3 mb-8 grow">
              <li className="flex items-start gap-2">
                <CircleCheck
                  className="mt-0.5 shrink-0 fill-brand-primary text-white"
                  size={16}
                  strokeWidth={2.5}
                  aria-hidden
                />
                <span className="text-slate-700 text-xs">25 active job posts</span>
              </li>
              <li className="flex items-start gap-2">
                <CircleCheck
                  className="mt-0.5 shrink-0 fill-brand-primary text-white"
                  size={16}
                  strokeWidth={2.5}
                  aria-hidden
                />
                <span className="text-slate-700 text-xs">AI ranking + scoring</span>
              </li>
              <li className="flex items-start gap-2">
                <CircleCheck
                  className="mt-0.5 shrink-0 fill-brand-primary text-white"
                  size={16}
                  strokeWidth={2.5}
                  aria-hidden
                />
                <span className="text-slate-700 text-xs">Full ATS integration</span>
              </li>
              <li className="flex items-start gap-2">
                <CircleCheck
                  className="mt-0.5 shrink-0 fill-brand-primary text-white"
                  size={16}
                  strokeWidth={2.5}
                  aria-hidden
                />
                <span className="text-slate-700 text-xs">Custom pipeline stages</span>
              </li>
              <li className="flex items-start gap-2">
                <CircleCheck
                  className="mt-0.5 shrink-0 fill-brand-primary text-white"
                  size={16}
                  strokeWidth={2.5}
                  aria-hidden
                />
                <span className="text-slate-700 text-xs">Advanced analytics</span>
              </li>
              <li className="flex items-start gap-2">
                <CircleCheck
                  className="mt-0.5 shrink-0 fill-brand-primary text-white"
                  size={16}
                  strokeWidth={2.5}
                  aria-hidden
                />
                <span className="text-slate-700 text-xs">API access</span>
              </li>
              <li className="flex items-start gap-2">
                <CircleCheck
                  className="mt-0.5 shrink-0 fill-brand-primary text-white"
                  size={16}
                  strokeWidth={2.5}
                  aria-hidden
                />
                <span className="text-slate-700 text-xs">Team seats (10)</span>
              </li>
            </ul>
            <button className="w-full py-3 border border-slate-200 text-slate-900 bg-white text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors mt-auto">
              Start Pro plan
            </button>
          </div>

          {/* Card 5: Enterprise */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col h-full text-left">
            <div className="mb-6">
              <h3 className="text-slate-900 font-bold uppercase tracking-wider text-xs mb-2">Enterprise</h3>
              <p className="text-slate-500 text-xs mb-4 min-h-[32px]">For high-volume hiring orgs</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900">Custom</span>
              </div>
              <p className="mt-2 text-slate-400 text-[10px]">
                {isAnnual ? "Billed annually · Custom contract" : "Monthly billing - negotiated"}
              </p>
            </div>
            <div className="h-px bg-slate-100 mb-6"></div>
            <ul className="space-y-3 mb-8 grow">
              <li className="flex items-start gap-2">
                <CircleCheck
                  className="mt-0.5 shrink-0 fill-brand-primary text-white"
                  size={16}
                  strokeWidth={2.5}
                  aria-hidden
                />
                <span className="text-slate-700 text-xs">Unlimited job posts</span>
              </li>
              <li className="flex items-start gap-2">
                <CircleCheck
                  className="mt-0.5 shrink-0 fill-brand-primary text-white"
                  size={16}
                  strokeWidth={2.5}
                  aria-hidden
                />
                <span className="text-slate-700 text-xs">Dedicated AI models</span>
              </li>
              <li className="flex items-start gap-2">
                <CircleCheck
                  className="mt-0.5 shrink-0 fill-brand-primary text-white"
                  size={16}
                  strokeWidth={2.5}
                  aria-hidden
                />
                <span className="text-slate-700 text-xs">White-label option</span>
              </li>
              <li className="flex items-start gap-2">
                <CircleCheck
                  className="mt-0.5 shrink-0 fill-brand-primary text-white"
                  size={16}
                  strokeWidth={2.5}
                  aria-hidden
                />
                <span className="text-slate-700 text-xs">SSO / SAML</span>
              </li>
              <li className="flex items-start gap-2">
                <CircleCheck
                  className="mt-0.5 shrink-0 fill-brand-primary text-white"
                  size={16}
                  strokeWidth={2.5}
                  aria-hidden
                />
                <span className="text-slate-700 text-xs">SLA + dedicated CSM</span>
              </li>
              <li className="flex items-start gap-2">
                <CircleCheck
                  className="mt-0.5 shrink-0 fill-brand-primary text-white"
                  size={16}
                  strokeWidth={2.5}
                  aria-hidden
                />
                <span className="text-slate-700 text-xs">Custom integrations</span>
              </li>
              <li className="flex items-start gap-2">
                <CircleCheck
                  className="mt-0.5 shrink-0 fill-brand-primary text-white"
                  size={16}
                  strokeWidth={2.5}
                  aria-hidden
                />
                <span className="text-slate-700 text-xs">Unlimited seats</span>
              </li>
            </ul>
            <button className="w-full py-3 border border-slate-200 text-slate-900 bg-white text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors mt-auto">
              Contact sales
            </button>
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-24 px-6 overflow-x-auto border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-extrabold text-center text-slate-900 mb-16">
            Compare features
          </h2>
          <div className="min-w-[800px]">
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-left border-b border-slate-200">
                  <th className="py-6 px-4 text-sm font-bold text-slate-500 uppercase tracking-wider">Feature</th>
                  <th className="py-6 px-4 text-sm font-bold text-slate-900">Free</th>
                  <th className="py-6 px-4 text-sm font-bold text-slate-900">Starter</th>
                  <th className="py-6 px-4 text-sm font-bold text-brand-primary bg-brand-primary-light/50 rounded-t-xl">Growth</th>
                  <th className="py-6 px-4 text-sm font-bold text-slate-900">Pro</th>
                  <th className="py-6 px-4 text-sm font-bold text-slate-900">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-6 px-4 text-sm font-semibold text-slate-700">Active Jobs</td>
                  <td className="py-6 px-4 text-sm text-slate-600">1</td>
                  <td className="py-6 px-4 text-sm text-slate-600">3</td>
                  <td className="py-6 px-4 text-sm font-bold text-brand-primary bg-brand-primary-light/50">8</td>
                  <td className="py-6 px-4 text-sm text-slate-600">25</td>
                  <td className="py-6 px-4 text-sm text-slate-600">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-6 px-4 text-sm font-semibold text-slate-700">Applicant View Limit</td>
                  <td className="py-6 px-4 text-sm text-slate-600">20/mo</td>
                  <td className="py-6 px-4 text-sm text-slate-600">Unlimited</td>
                  <td className="py-6 px-4 text-sm font-bold text-brand-primary bg-brand-primary-light/50">Unlimited</td>
                  <td className="py-6 px-4 text-sm text-slate-600">Unlimited</td>
                  <td className="py-6 px-4 text-sm text-slate-600">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-6 px-4 text-sm font-semibold text-slate-700">AI Candidate Matching</td>
                  <td className="py-6 px-4 text-sm text-slate-600">Basic</td>
                  <td className="py-6 px-4 text-sm text-slate-600">Yes</td>
                  <td className="py-6 px-4 text-sm font-bold text-brand-primary bg-brand-primary-light/50">Yes</td>
                  <td className="py-6 px-4 text-sm text-slate-600">
                    {isAnnual ? "Advanced" : "Ranking + Scoring"}
                  </td>
                  <td className="py-6 px-4 text-sm text-slate-600">Advanced Assistant</td>
                </tr>
                <tr>
                  <td className="py-6 px-4 text-sm font-semibold text-slate-700">Candidate Contact Info</td>
                  <td className="py-6 px-4 text-sm text-slate-400">—</td>
                  <td className="py-6 px-4 text-sm text-emerald-500 font-bold">✓</td>
                  <td className="py-6 px-4 text-sm font-bold text-brand-primary bg-brand-primary-light/50">✓</td>
                  <td className="py-6 px-4 text-sm text-emerald-500 font-bold">✓</td>
                  <td className="py-6 px-4 text-sm text-emerald-500 font-bold">✓</td>
                </tr>
                <tr>
                  <td className="py-6 px-4 text-sm font-semibold text-slate-700">Resume Database Search</td>
                  <td className="py-6 px-4 text-sm text-slate-400">—</td>
                  <td className="py-6 px-4 text-sm text-emerald-500 font-bold">✓</td>
                  <td className="py-6 px-4 text-sm font-bold text-brand-primary bg-brand-primary-light/50">Unlimited</td>
                  <td className="py-6 px-4 text-sm text-emerald-500 font-bold">Unlimited</td>
                  <td className="py-6 px-4 text-sm text-emerald-500 font-bold">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-6 px-4 text-sm font-semibold text-slate-700">AI Candidate Ranking</td>
                  <td className="py-6 px-4 text-sm text-slate-400">—</td>
                  <td className="py-6 px-4 text-sm text-slate-400">—</td>
                  <td className="py-6 px-4 text-sm font-bold text-brand-primary bg-brand-primary-light/50">✓</td>
                  <td className="py-6 px-4 text-sm text-emerald-500 font-bold">✓</td>
                  <td className="py-6 px-4 text-sm text-emerald-500 font-bold">✓</td>
                </tr>
                <tr>
                  <td className="py-6 px-4 text-sm font-semibold text-slate-700">Smart Interview Scheduling</td>
                  <td className="py-6 px-4 text-sm text-slate-400">—</td>
                  <td className="py-6 px-4 text-sm text-slate-400">—</td>
                  <td className="py-6 px-4 text-sm font-bold text-brand-primary bg-brand-primary-light/50">✓</td>
                  <td className="py-6 px-4 text-sm text-emerald-500 font-bold">✓</td>
                  <td className="py-6 px-4 text-sm text-emerald-500 font-bold">✓</td>
                </tr>
                <tr>
                  <td className="py-6 px-4 text-sm font-semibold text-slate-700">ATS Dashboard</td>
                  <td className="py-6 px-4 text-sm text-slate-400">—</td>
                  <td className="py-6 px-4 text-sm text-slate-600">Basic</td>
                  <td className="py-6 px-4 text-sm font-bold text-brand-primary bg-brand-primary-light/50">✓</td>
                  <td className="py-6 px-4 text-sm text-slate-600">
                    {isAnnual ? "Full" : "Custom Pipeline"}
                  </td>
                  <td className="py-6 px-4 text-sm text-slate-600">Internal Integration</td>
                </tr>
                <tr>
                  <td className="py-6 px-4 text-sm font-semibold text-slate-700">API Access</td>
                  <td className="py-6 px-4 text-sm text-slate-400">—</td>
                  <td className="py-6 px-4 text-sm text-slate-400">—</td>
                  <td className="py-6 px-4 text-sm font-bold text-brand-primary bg-brand-primary-light/50">—</td>
                  <td className="py-6 px-4 text-sm text-emerald-500 font-bold">✓</td>
                  <td className="py-6 px-4 text-sm text-emerald-500 font-bold">✓</td>
                </tr>
                <tr className="border-b-0">
                  <td className="py-6 px-4 text-sm font-semibold text-slate-700">Support</td>
                  <td className="py-6 px-4 text-sm text-slate-600">Email</td>
                  <td className="py-6 px-4 text-sm text-slate-600">Email + Chat</td>
                  <td className="py-6 px-4 text-sm font-bold text-brand-primary bg-brand-primary-light/50 rounded-b-xl">Priority</td>
                  <td className="py-6 px-4 text-sm text-slate-600">
                    {isAnnual ? "Priority" : "Priority + Phone"}
                  </td>
                  <td className="py-6 px-4 text-sm text-slate-600">Dedicated Manager</td>
                </tr>
                <tr>
                  <td className="py-6 px-4 text-sm font-semibold text-slate-700">Team Seats</td>
                  <td className="py-6 px-4 text-sm text-slate-400">—</td>
                  <td className="py-6 px-4 text-sm text-slate-400">—</td>
                  <td className="py-6 px-4 text-sm font-bold text-brand-primary bg-brand-primary-light/50">3</td>
                  <td className="py-6 px-4 text-sm text-slate-600">10</td>
                  <td className="py-6 px-4 text-sm text-slate-600">Unlimited</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-extrabold text-center text-slate-900 mb-16">
            Frequently asked questions
          </h2>
          <div className="space-y-4">
            {/* FAQ Item 1 */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden group">
              <div className="p-6 flex items-center justify-between cursor-pointer">
                <h4 className="font-bold text-lg text-slate-900">Can I change plans later?</h4>
                <CirclePlus
                className="h-6 w-6 shrink-0 fill-slate-100 text-slate-500 transition-colors group-hover:fill-brand-primary-light group-hover:text-brand-primary"
                strokeWidth={2}
                aria-hidden
              />
              </div>
            </div>
            {/* FAQ Item 2 */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden group">
              <div className="p-6 flex items-center justify-between cursor-pointer">
                <h4 className="font-bold text-lg text-slate-900">What payment methods do you accept?</h4>
                <CirclePlus
                className="h-6 w-6 shrink-0 fill-slate-100 text-slate-500 transition-colors group-hover:fill-brand-primary-light group-hover:text-brand-primary"
                strokeWidth={2}
                aria-hidden
              />
              </div>
            </div>
            {/* FAQ Item 3 */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden group">
              <div className="p-6 flex items-center justify-between cursor-pointer">
                <h4 className="font-bold text-lg text-slate-900">Is there a free trial for Growth?</h4>
                <CirclePlus
                className="h-6 w-6 shrink-0 fill-slate-100 text-slate-500 transition-colors group-hover:fill-brand-primary-light group-hover:text-brand-primary"
                strokeWidth={2}
                aria-hidden
              />
              </div>
            </div>
            {/* FAQ Item 4 */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden group">
              <div className="p-6 flex items-center justify-between cursor-pointer">
                <h4 className="font-bold text-lg text-slate-900">What happens to my listings if I downgrade?</h4>
                <CirclePlus
                className="h-6 w-6 shrink-0 fill-slate-100 text-slate-500 transition-colors group-hover:fill-brand-primary-light group-hover:text-brand-primary"
                strokeWidth={2}
                aria-hidden
              />
              </div>
            </div>
          </div>
          <div className="mt-16 text-center">
            <p className="text-slate-500">
              Still have questions?{" "}
              <Link className="text-brand-primary font-bold hover:underline decoration-2" href="/contact">
                Chat with our support team
              </Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
