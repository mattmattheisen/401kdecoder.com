// app/api/parse/route.js
import { NextResponse } from 'next/server';
import pdf from 'pdf-parse';
import { parseStatement } from '../../../lib/parseStatement';

export const runtime = 'nodejs'; // ensure Node runtime on Vercel

export async function POST(req) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files');
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // For now, handle the first PDF only.
    const f = files[0];
    const buf = Buffer.from(await f.arrayBuffer());

    let text = '';
    if ((f.type || '').includes('pdf') || /\.pdf$/i.test(f.name || '')) {
      const result = await pdf(buf);
      text = result.text || '';
    } else {
      // Non-PDF (image) not supported yet in this minimal step.
      // We can add OCR in a later step.
      return NextResponse.json({ error: 'Please upload a PDF statement for now.' }, { status: 415 });
    }

    const parsed = parseStatement(text);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error('Parse error:', err);
    return NextResponse.json({ error: 'Failed to parse file' }, { status: 500 });
  }
}
