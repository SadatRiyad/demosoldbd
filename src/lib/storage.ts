import { supabase } from "@/integrations/supabase/client";

export async function uploadPublicFile(opts: {
  bucket: "avatars" | "brand" | "deals";
  path: string;
  file: File;
}) {
  const { bucket, path, file } = opts;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
