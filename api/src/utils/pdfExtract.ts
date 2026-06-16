import { PDFParse } from 'pdf-parse';
import { MAX_PDF_BYTES, MAX_PDF_EXTRACT_CHARS } from '../constants/ai';

export interface PdfExtractResult {
  text: string;
  pageCount: number;
  truncated: boolean;
}

export async function extractPdfText(pdfBase64: string): Promise<PdfExtractResult> {
  const buffer = Buffer.from(pdfBase64, 'base64');

  if (buffer.length === 0) {
    throw new Error('PDF file is empty');
  }

  if (buffer.length > MAX_PDF_BYTES) {
    throw new Error(`PDF is too large. Maximum size is ${Math.round(MAX_PDF_BYTES / 1024 / 1024)}MB.`);
  }

  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    const raw = (result.text ?? '')
      .replace(/\u0000/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (raw.length < 40) {
      throw new Error(
        'This PDF has little or no selectable text. It may be scanned — try the Image tab with photos of the pages.',
      );
    }

    const truncated = raw.length > MAX_PDF_EXTRACT_CHARS;
    const text = truncated ? raw.slice(0, MAX_PDF_EXTRACT_CHARS) : raw;

    return {
      text,
      pageCount: result.total ?? 0,
      truncated,
    };
  } finally {
    await parser.destroy();
  }
}

export function chunkText(text: string, chunkSize: number, maxChunks: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length && chunks.length < maxChunks; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}
