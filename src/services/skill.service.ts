import { apiClient } from '@/lib/axios';

export interface SkillItem {
  id: string;
  name: string;
  slug: string;
  category: string;
}

export interface CreateSkillInput {
  name: string;
  slug: string;
  category: string;
}

export const skillService = {
  getSkills: async (): Promise<SkillItem[]> => {
    const { data } = await apiClient.get<SkillItem[]>('/skills');
    return data;
  },

  createSkill: async (payload: CreateSkillInput): Promise<SkillItem> => {
    const { data } = await apiClient.post<SkillItem>('/skills', payload);
    return data;
  },
};
