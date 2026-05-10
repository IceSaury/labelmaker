import { pdf } from '@react-pdf/renderer';
import type { Item } from '../store/itemStore';

export async function generateLabelPDF(
  template: React.ReactElement,
): Promise<Blob> {
  const doc = pdf(template);
  const blob = await doc.toBlob();
  return blob;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function printBlob(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (win) {
    win.onload = () => {
      win.print();
    };
  }
}
