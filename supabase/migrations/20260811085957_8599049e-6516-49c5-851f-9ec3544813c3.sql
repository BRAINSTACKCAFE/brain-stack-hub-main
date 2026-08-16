ALTER TABLE public.request_documents
  ADD COLUMN IF NOT EXISTS file_name TEXT,
  ADD COLUMN IF NOT EXISTS content_type TEXT,
  ADD COLUMN IF NOT EXISTS size_bytes BIGINT;

COMMENT ON COLUMN public.request_documents.label IS 'The form field name this document belongs to';
COMMENT ON COLUMN public.request_documents.file_name IS 'Original uploaded file name';
COMMENT ON COLUMN public.request_documents.content_type IS 'MIME type of the uploaded file';
COMMENT ON COLUMN public.request_documents.size_bytes IS 'File size in bytes';