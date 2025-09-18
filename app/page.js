'use client';
import { useState } from 'react';
import UploadZone from '../components/UploadZone';
import Results from '../components/Results';

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  async function handleDrop(files) {
    setError('');
    setLoading(true);
    setData(null);

    try {
      const fd = new FormData();
      for (const f of files) fd.append('files', f);

      const res = await fetch('/api/parse', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Parsing failed');
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 820, margin: '40px auto', padding: 16 }}>
      <h1>Plan Decoder</h1>
      <p>Upload a statement (PDF or image). We’ll parse it and show fees, allocation, and holdings.</p>

      <div style={{ marginTop: 16 }}>
        <UploadZone onDrop={handleDrop} loading={loading} />
        {error && <p style={{ color: '#c33' }}>{error}</p>}
      </div>

      <div style={{ marginTop: 24 }}>
        <Results data={data} />
      </div>
    </main>
  );
}
