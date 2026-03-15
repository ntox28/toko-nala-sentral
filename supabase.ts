import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wypzvbfvnrqfoebrgxnx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5cHp2YmZ2bnJxZm9lYnJneG54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MDc4OTksImV4cCI6MjA4OTA4Mzg5OX0.HA-_I3efKKow8aPSl6ZkZgUcSZbpELdfctfKy28OCV8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const uploadProductImage = async (file: File): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `product-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('products')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
};
