import QRCode from 'qrcode';

export async function generateQRDataURL(uniqueCode: string, frontendUrl: string): Promise<string> {
  const url = `${frontendUrl}/view/${uniqueCode}`;
  return QRCode.toDataURL(url, {
    width: 200,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
  });
}
