-- Policies for the request-documents bucket
CREATE POLICY "Users can upload their own request documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'request-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can read their own request documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'request-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own request documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'request-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Service role can manage request documents"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'request-documents')
WITH CHECK (bucket_id = 'request-documents');