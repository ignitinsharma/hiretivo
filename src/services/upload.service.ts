import { apiClient } from '@/lib/axios';

export interface UploadResponse {
  key: string;
  url: string;
}

interface DataResponse<T> {
  data: T;
}

async function postFile(path: string, file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await apiClient.post<DataResponse<UploadResponse>>(
    path,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );

  return data.data;
}

export const uploadService = {
  uploadAvatar: (file: File) => postFile('/upload/avatar', file),
  uploadResume: (file: File) => postFile('/upload/resume', file),
  uploadCompanyLogo: (file: File) => postFile('/upload/company-logo', file),
};
