'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full text-center">
          <div className="mb-8">
            <svg
              viewBox="0 0 200 160"
              className="w-64 h-52 mx-auto"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="40" y="60" width="80" height="60" rx="4" fill="#F3F4F6" />
              <rect x="44" y="64" width="72" height="44" rx="2" fill="#5C54E6" fillOpacity="0.1" />
              <circle cx="80" cy="86" r="8" fill="#5C54E6" fillOpacity="0.3" />
              <rect x="120" y="70" width="40" height="4" rx="2" fill="#E5E7EB" />
              <rect x="120" y="80" width="32" height="4" rx="2" fill="#E5E7EB" />
              <rect x="120" y="90" width="24" height="4" rx="2" fill="#E5E7EB" />
              <circle cx="80" cy="40" r="20" fill="#5C54E6" fillOpacity="0.15" />
              <path
                d="M70 45C70 42.2386 72.2386 40 75 40C77.7614 40 80 42.2386 80 45C80 47.7614 77.7614 50 75 50C74.5 50 74 49.9 73.5 49.8"
                stroke="#5C54E6"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M68 30L75 22L82 30"
                stroke="#5C54E6"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="68" cy="30" r="3" fill="#5C54E6" />
              <circle cx="82" cy="30" r="3" fill="#5C54E6" />
              <path
                d="M30 130L60 145L90 130L120 145L150 130"
                stroke="#D1D5DB"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="30" cy="130" r="4" fill="#9CA3AF" />
              <circle cx="90" cy="130" r="4" fill="#9CA3AF" />
              <circle cx="150" cy="130" r="4" fill="#9CA3AF" />
            </svg>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
            Oops!
          </h1>

          <p className="text-lg text-gray-500 mb-8">
            We can&apos;t seem to find the page you&apos;re looking for.
          </p>

          <Link href="/">
            <Button
              size="lg"
              className="bg-brand-primary hover:bg-brand-primary/90 text-white gap-2"
            >
              <Home className="w-4 h-4" />
              Go back home
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
