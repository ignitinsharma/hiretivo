import React from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserCircle, Mail, Briefcase, MapPin, Globe } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function ProfilePage() {
  const session = await auth();

  const profile = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          name: true,
          email: true,
          image: true,
          seekerProfile: {
            select: {
              headline: true,
              bio: true,
              primaryRole: true,
              location: true,
              githubUrl: true,
              linkedinUrl: true,
              websiteUrl: true,
            },
          },
        },
      })
    : null;

  const sp = profile?.seekerProfile;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-card border border-brand-border shadow-card p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-pill bg-brand-primary/10 flex items-center justify-center">
            <UserCircle className="w-8 h-8 text-brand-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{profile?.name ?? "Your Name"}</h1>
            {sp?.headline && (
              <p className="text-sm text-gray-500">{sp.headline}</p>
            )}
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {profile?.email && (
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Mail className="w-4 h-4 text-gray-400" />
              {profile.email}
            </div>
          )}
          {sp?.primaryRole && (
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Briefcase className="w-4 h-4 text-gray-400" />
              {sp.primaryRole}
            </div>
          )}
          {sp?.location && (
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400" />
              {sp.location}
            </div>
          )}
          {sp?.websiteUrl && (
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Globe className="w-4 h-4 text-gray-400" />
              <a href={sp.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">
                {sp.websiteUrl}
              </a>
            </div>
          )}
        </div>

        {sp?.bio && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">About</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{sp.bio}</p>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-brand-border">
          <Button asChild variant="secondary" size="sm">
            <Link href="/settings">Edit profile</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
