import { useState } from 'react';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase';
import type { JobPhoto } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface JobPhotoUploadProps {
  jobId: string;
  photoType: JobPhoto['photo_type'];
  onPhotoUploaded: (photo: JobPhoto) => void;
}

export default function JobPhotoUpload({ jobId, photoType, onPhotoUploaded }: JobPhotoUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      setUploading(true);

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${jobId}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('job-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('job-photos')
        .getPublicUrl(fileName);

      // Create photo record
      const { data: photo, error: dbError } = await supabase
        .from('job_photos')
        .insert([
          {
            job_id: jobId,
            photo_url: publicUrl,
            photo_type: photoType,
          },
        ])
        .select()
        .single();

      if (dbError) throw dbError;

      onPhotoUploaded(photo);
      toast.success('Photo uploaded successfully');
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center justify-center w-full">
      <label
        htmlFor={`photo-upload-${photoType}`}
        className={`
          flex flex-col items-center justify-center w-full h-32
          border-2 border-gray-300 border-dashed rounded-lg
          cursor-pointer bg-gray-50 hover:bg-gray-100
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <PhotoIcon className="w-8 h-8 mb-3 text-gray-400" />
          <p className="mb-2 text-sm text-gray-500">
            <span className="font-semibold">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500">PNG, JPG, HEIC up to 10MB</p>
        </div>
        <input
          id={`photo-upload-${photoType}`}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </label>
    </div>
  );
} 