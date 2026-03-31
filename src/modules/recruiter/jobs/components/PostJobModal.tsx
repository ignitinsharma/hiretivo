'use client';

import React from 'react';
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

export function PostJobModal() {
  const { isPostJobModalOpen, closePostJobModal } = useUIStore();

  return (
    <Dialog open={isPostJobModalOpen} onOpenChange={closePostJobModal}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-slate-100 pb-4 mb-4">
          <DialogTitle className="text-xl font-bold tracking-tight text-slate-900">
            Post a New Role
          </DialogTitle>
        </DialogHeader>

        <form className="space-y-6">
          <div>
            <Label className="block text-sm font-semibold text-slate-700 mb-2">Job Title</Label>
            <Input placeholder="e.g. Senior Software Engineer" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="block text-sm font-semibold text-slate-700 mb-2">Category</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="engineering">Engineering</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="block text-sm font-semibold text-slate-700 mb-2">Job Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="block text-sm font-semibold text-slate-700 mb-2">Experience Level</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entry">Entry Level</SelectItem>
                  <SelectItem value="mid">Mid-level</SelectItem>
                  <SelectItem value="senior">Senior</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="block text-sm font-semibold text-slate-700 mb-2">Compensation Range</Label>
              <Input placeholder="e.g. $120k - $150k" />
            </div>
          </div>

          <div>
            <Label className="block text-sm font-semibold text-slate-700 mb-2">Job Description</Label>
            <Textarea 
              placeholder="Describe the role, responsibilities, and impact..." 
              className="resize-none min-h-[120px]" 
            />
          </div>

          <div>
            <Label className="block text-sm font-semibold text-slate-700 mb-2">Required Skills</Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {['React', 'TypeScript', 'Node.js'].map(skill => (
                <span key={skill} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 border border-primary/20">
                  {skill} 
                  <X className="w-3 h-3 cursor-pointer opacity-60 hover:opacity-100" />
                </span>
              ))}
            </div>
            <div className="relative">
              <Input placeholder="Add more skills..." className="pr-10" />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-primary flex items-center">
                <PlusCircle className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-4 mt-6">
            <Button type="button" variant="ghost" className="font-bold text-slate-600" onClick={closePostJobModal}>
              Cancel
            </Button>
            <Button type="submit" className="font-bold bg-slate-900 text-white hover:bg-slate-800">
              Publish Job Post
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}