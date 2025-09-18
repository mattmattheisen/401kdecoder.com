'use client';
import { useCallback } from 'react';

export default function UploadZone({ onDrop, loading }) {
  const handleChange = useCallback(
    (e) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onDrop(files);
      }
    },
    [onDrop]
  );

  return (
    <div style={{ border: '2px dashed #666', padding: 20, textAlign: 'center' }}>
      <p>{loading ? 'Uploading...' : 'Drop or select a file'}</p>
      <input
        type="file"
        accept=".pdf,image/*"
        multiple
        onChange={handleChange}
        disabled={loading}
      />
    </div>
  );
}
