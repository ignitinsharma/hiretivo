'use client';

import { Search, SlidersHorizontal, MapPin, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RecruiterHeader } from '@/components/layout/RecruiterHeader';

const MOCK_TALENT = [
  {
    id: '1',
    name: 'Sarah Chen',
    title: 'Senior Frontend Developer',
    skills: ['React', 'TypeScript', 'Next.js', 'Node.js'],
    experience: '5 years',
    location: 'San Francisco, CA',
    matchScore: 95,
    availability: 'Immediately',
  },
  {
    id: '2',
    name: 'Marcus Johnson',
    title: 'Full Stack Engineer',
    skills: ['Vue.js', 'Python', 'Django', 'PostgreSQL'],
    experience: '4 years',
    location: 'New York, NY',
    matchScore: 88,
    availability: '2 weeks',
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    title: 'Backend Developer',
    skills: ['Go', 'Kubernetes', 'AWS', 'Redis'],
    experience: '6 years',
    location: 'Austin, TX',
    matchScore: 82,
    availability: 'Immediately',
  },
  {
    id: '4',
    name: 'David Kim',
    title: 'DevOps Engineer',
    skills: ['Docker', 'Terraform', 'CI/CD', 'Linux'],
    experience: '3 years',
    location: 'Seattle, WA',
    matchScore: 76,
    availability: '1 month',
  },
  {
    id: '5',
    name: 'Lisa Wang',
    title: 'Product Designer',
    skills: ['Figma', 'UI/UX', 'Prototyping', 'Design Systems'],
    experience: '4 years',
    location: 'Los Angeles, CA',
    matchScore: 71,
    availability: 'Immediately',
  },
];

export default function FindTalentPage() {
  return (
    <div>
      <RecruiterHeader
        title="Find Talent"
        subtitle="Discover candidates that match your requirements"
        showPostJob={false}
      />

      <div className="p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-6">
          <div className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by skills, title, or name..."
                  className="pl-10 bg-gray-50 border-gray-200 h-11"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="gap-2 h-11">
                  <MapPin className="w-4 h-4" />
                  Location
                </Button>
                <Button variant="outline" className="gap-2 h-11">
                  <Briefcase className="w-4 h-4" />
                  Experience
                </Button>
                <Button variant="outline" className="gap-2 h-11">
                  <SlidersHorizontal className="w-4 h-4" />
                  More Filters
                </Button>
                <Button variant="primary" className="h-11">
                  Search
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_TALENT.map((candidate) => (
            <div
              key={candidate.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary font-semibold">
                    {candidate.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{candidate.name}</p>
                    <p className="text-sm text-gray-500">{candidate.title}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-brand-primary">
                    {candidate.matchScore}%
                  </p>
                  <p className="text-xs text-gray-500">match</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {candidate.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>{candidate.experience}</span>
                <span>{candidate.location}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-green-600 font-medium">
                  Available {candidate.availability}
                </span>
                <Button variant="primary" size="sm">
                  View Profile
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
