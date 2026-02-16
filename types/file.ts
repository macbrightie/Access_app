export interface FileRecord {
  id: string;
  slug: string;
  file_path: string;
  edit_token: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export type FileUploadResponse = {
  success: boolean;
  slug?: string;
  edit_token?: string;
  error?: string;
}
