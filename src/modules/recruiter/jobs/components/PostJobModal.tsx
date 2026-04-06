'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUIStore } from '@/store/use-ui-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, PlusCircle } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { parseSalaryText } from '@/lib/utils/salary';

interface JobFormValues {
  title: string;
  category: string;
  jobType: string;
  experienceLevel: string;
  compensation: string;
  description: string;
  selectedSkillIds: string[];
}

export function PostJobModal() {
  const { isPostJobModalOpen, closePostJobModal, editJobId } = useUIStore();
  const queryClient = useQueryClient();
  const [skillSearch, setSkillSearch] = useState('');
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workType, setWorkType] = useState<'REMOTE' | 'HYBRID' | 'ONSITE'>('REMOTE');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowSkillDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const DEFAULT_CATEGORIES = ['Engineering', 'Design', 'Marketing', 'Data', 'DevOps', 'Product', 'Other'];

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
  } = useForm<JobFormValues>({
    defaultValues: {
      title: '',
      category: '',
      jobType: '',
      experienceLevel: '',
      compensation: '',
      description: '',
      selectedSkillIds: [],
    },
  });

  const selectedSkillIds = watch('selectedSkillIds');

  const { data: skills = [], isLoading: skillsLoading } = useQuery({
    queryKey: ['skills'],
    queryFn: () => fetch('/api/skills').then((r) => r.json()),
    enabled: isPostJobModalOpen,
  });

  const { data: editJob } = useQuery({
    queryKey: ['job', editJobId],
    queryFn: () => fetch(`/api/jobs/${editJobId}`).then((r) => r.json()),
    enabled: isPostJobModalOpen && !!editJobId,
  });

  useEffect(() => {
    if (editJob && editJobId) {
      const formatSalary = (val: number | null) => {
        if (val == null) return '';
        if (val >= 1000) return `${val / 1000}k`;
        return String(val);
      };

      const salaryText = editJob.salaryMin != null
        ? `$${formatSalary(editJob.salaryMin)}${editJob.salaryMax != null ? ` - $${formatSalary(editJob.salaryMax)}` : ''}`
        : '';

      setWorkType(editJob.workType ?? 'REMOTE');

      reset({
        title: editJob.title || '',
        category: editJob.category || '',
        jobType: editJob.jobType?.toLowerCase().replace('_', '-') || '',
        experienceLevel: editJob.experienceLevel || '',
        compensation: salaryText,
        description: editJob.description || '',
        selectedSkillIds: editJob.skills?.map((s: { skillId: string }) => s.skillId) || [],
      });
    } else if (!editJobId) {
      setWorkType('REMOTE');
      reset({
        title: '',
        category: '',
        jobType: '',
        experienceLevel: '',
        compensation: '',
        description: '',
        selectedSkillIds: [],
      });
    }
  }, [editJob, editJobId, reset]);

  const onSubmit = async (data: JobFormValues) => {
    const { salaryMin, salaryMax, currency } = parseSalaryText(data.compensation);

    const payload = {
      title: data.title,
      description: data.description,
      jobType: data.jobType.toUpperCase().replace('-', '_'),
      applyType: 'INTERNAL' as const,
      workType,
      experienceLevel: data.experienceLevel,
      category: data.category,
      salaryMin,
      salaryMax,
      currency,
      skills: data.selectedSkillIds.map((id) => ({
        skillId: id,
        level: 'INTERMEDIATE' as const,
      })),
    };

    setIsSubmitting(true);

    try {
      const url = editJobId ? `/api/jobs/${editJobId}` : '/api/jobs';
      const method = editJobId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          toast.error(result.error || 'Upgrade your plan to post more jobs');
        } else if (res.status === 400) {
          toast.error(result.error || 'Validation failed');
        } else {
          toast.error('Something went wrong');
        }
        return;
      }

      toast.success(editJobId ? 'Job updated!' : 'Job posted!');
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      closePostJobModal();
      reset();
    } catch {
      toast.error('Failed to submit job');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSkills = skills.filter((s: { name: string }) =>
    s.name.toLowerCase().includes(skillSearch.toLowerCase())
  );

  const selectedSkillsData = selectedSkillIds
    .map((id: string) => skills.find((s: { id: string }) => s.id === id))
    .filter(Boolean);

  return (
    <Dialog open={isPostJobModalOpen} onOpenChange={(open) => { if (!open) closePostJobModal(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-slate-100 pb-4 mb-4">
          <DialogTitle className="text-xl font-bold tracking-tight text-slate-900">
            {editJobId ? 'Edit Job Post' : 'Post a New Role'}
          </DialogTitle>
        </DialogHeader>

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <Label className="block text-sm font-semibold text-slate-700 mb-2">Job Title</Label>
            <Input placeholder="e.g. Senior Software Engineer" {...register('title')} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="block text-sm font-semibold text-slate-700 mb-2">Category</Label>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {(() => {
                        const categoryNames = skills.map((s: { category: string }) => s.category) as string[];
                        const uniqueCategories = categoryNames.filter((cat: string, i: number) => categoryNames.indexOf(cat) === i);
                        const categories = uniqueCategories.length > 0 ? uniqueCategories : DEFAULT_CATEGORIES;
                        return categories.map((cat: string) => (
                          <SelectItem key={cat} value={cat.toLowerCase()}>{cat}</SelectItem>
                        ));
                      })()}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label className="block text-sm font-semibold text-slate-700 mb-2">Work Type</Label>
              <Select value={workType} onValueChange={(v) => setWorkType(v as 'REMOTE' | 'HYBRID' | 'ONSITE')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Work Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REMOTE">Remote</SelectItem>
                  <SelectItem value="HYBRID">Hybrid</SelectItem>
                  <SelectItem value="ONSITE">Onsite</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="block text-sm font-semibold text-slate-700 mb-2">Job Type</Label>
              <Controller
                control={control}
                name="jobType"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label className="block text-sm font-semibold text-slate-700 mb-2">Experience Level</Label>
              <Controller
                control={control}
                name="experienceLevel"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entry">Entry Level</SelectItem>
                      <SelectItem value="mid">Mid-level</SelectItem>
                      <SelectItem value="senior">Senior</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="block text-sm font-semibold text-slate-700 mb-2">Experience Level</Label>
              <Controller
                control={control}
                name="experienceLevel"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entry">Entry Level</SelectItem>
                      <SelectItem value="mid">Mid-level</SelectItem>
                      <SelectItem value="senior">Senior</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label className="block text-sm font-semibold text-slate-700 mb-2">Compensation Range</Label>
              <Input placeholder="e.g. $120k - $150k" {...register('compensation')} />
            </div>
          </div>

          <div>
            <Label className="block text-sm font-semibold text-slate-700 mb-2">Job Description</Label>
            <Textarea
              placeholder="Describe the role, responsibilities, and impact..."
              className="resize-none min-h-[120px]"
              {...register('description')}
            />
          </div>

          <div>
            <Label className="block text-sm font-semibold text-slate-700 mb-2">Required Skills</Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedSkillsData.map((skill: { id: string; name: string }) => (
                <span key={skill.id} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 border border-primary/20">
                  {skill.name}
                  <X
                    className="w-3 h-3 cursor-pointer opacity-60 hover:opacity-100"
                    onClick={() =>
                      setValue(
                        'selectedSkillIds',
                        selectedSkillIds.filter((id: string) => id !== skill.id)
                      )
                    }
                  />
                </span>
              ))}
            </div>
            <div className="relative" ref={dropdownRef}>
              <Input
                placeholder={skillsLoading ? 'Loading skills...' : 'Add more skills...'}
                className="pr-10"
                value={skillSearch}
                onChange={(e) => {
                  setSkillSearch(e.target.value);
                  setShowSkillDropdown(true);
                }}
                onFocus={() => setShowSkillDropdown(true)}
                disabled={skillsLoading}
              />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-primary flex items-center">
                <PlusCircle className="w-5 h-5" />
              </button>
              {showSkillDropdown && skillSearch && filteredSkills.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {filteredSkills
                    .filter((s: { id: string }) => !selectedSkillIds.includes(s.id))
                    .slice(0, 10)
                    .map((skill: { id: string; name: string; category: string }) => (
                      <button
                        key={skill.id}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm"
                        onClick={() => {
                          setValue('selectedSkillIds', [...selectedSkillIds, skill.id]);
                          setSkillSearch('');
                          setShowSkillDropdown(false);
                        }}
                      >
                        {skill.name} <span className="text-slate-400 text-xs">({skill.category})</span>
                      </button>
                    ))}
                </div>
              )}
              {showSkillDropdown && skillSearch && filteredSkills.length === 0 && !skillsLoading && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg p-3 text-sm text-slate-500 text-center">
                  No skills found
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-4 mt-6">
            <Button type="button" variant="ghost" className="font-bold text-slate-600" onClick={closePostJobModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="font-bold bg-slate-900 text-white hover:bg-slate-800"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Publishing...' : 'Publish Job Post'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
