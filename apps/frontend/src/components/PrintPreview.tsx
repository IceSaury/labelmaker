import { useState, useEffect } from 'react';
import { Modal, Button, Space, Spin, message } from 'antd';
import { PrinterOutlined, DownloadOutlined } from '@ant-design/icons';
import { Document, Page, PDFViewer, pdf } from '@react-pdf/renderer';
import { useTranslation } from 'react-i18next';
import LabelTemplate from './pdf/LabelTemplate';
import PackingListTemplate from './pdf/PackingListTemplate';
import { downloadBlob, printBlob } from '../utils/pdfGenerator';
import api from '../api/client';
import type { Item } from '../store/itemStore';

interface Props {
  items: Item[];
  open: boolean;
  onClose: () => void;
  mode: 'label' | 'packing';
  parentNameCn?: string;
  parentNameEn?: string;
}

export default function PrintPreview({ items, open, onClose, mode, parentNameCn, parentNameEn }: Props) {
  const { t } = useTranslation();
  const [qrDataURLs, setQrDataURLs] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<{ item: Item; quantity: number }[]>([]);

  useEffect(() => {
    if (!open || items.length === 0) return;
    setLoading(true);

    const loadQRCodes = async () => {
      const QRCode = await import('qrcode');
      const frontendUrl = import.meta.env.VITE_PUBLIC_URL || window.location.origin;
      const map = new Map<string, string>();
      for (const it of items) {
        try {
          const url = await QRCode.toDataURL(`${frontendUrl}/view/${it.uniqueCode}`, {
            width: 200,
            margin: 2,
          });
          map.set(it.id, url);
        } catch { /* skip */ }
      }
      setQrDataURLs(map);
    };

    // If packing list, fetch container contents
    const container = items[0];
    if (mode === 'packing' && container.isContainer) {
      api.get(`/containers/${container.id}`).then((res) => {
        const result: { item: Item; quantity: number }[] = [];
        for (const ci of res.data.containerItems || []) {
          if (ci.item) {
            result.push({ item: ci.item, quantity: ci.quantity });
          }
        }
        setEntries(result);
        setLoading(false);
      }).catch(() => setLoading(false));
    }

    loadQRCodes().then(() => {
      if (mode !== 'packing') setLoading(false);
    });
  }, [open, items, mode]);

  const handleDownload = async () => {
    try {
      let doc: React.ReactElement;
      if (mode === 'packing') {
        doc = <PackingListTemplate container={items[0]} entries={entries} qrDataURL={qrDataURLs.get(items[0]?.id) ?? ''} />;
      } else {
        doc = (
          <Document>
            {items.map((it) => (
              <Page key={it.id} size={[425.20, 283.46]}>
                <LabelTemplate
                  item={it}
                  qrDataURL={qrDataURLs.get(it.id) ?? ''}
                  parentNameCn={it.parentId ? parentNameCn : undefined}
                  parentNameEn={it.parentId ? parentNameEn : undefined}
                />
              </Page>
            ))}
          </Document>
        );
      }
      const blob = await pdf(doc).toBlob();
      downloadBlob(blob, `${items[0]?.uniqueCode ?? 'labels'}_label.pdf`);
    } catch {
      message.error('PDF generation failed');
    }
  };

  const handlePrint = async () => {
    try {
      let doc: React.ReactElement;
      if (mode === 'packing') {
        doc = <PackingListTemplate container={items[0]} entries={entries} qrDataURL={qrDataURLs.get(items[0]?.id) ?? ''} />;
      } else {
        doc = (
          <Document>
            {items.map((it) => (
              <Page key={it.id} size={[425.20, 283.46]}>
                <LabelTemplate
                  item={it}
                  qrDataURL={qrDataURLs.get(it.id) ?? ''}
                  parentNameCn={it.parentId ? parentNameCn : undefined}
                  parentNameEn={it.parentId ? parentNameEn : undefined}
                />
              </Page>
            ))}
          </Document>
        );
      }
      const blob = await pdf(doc).toBlob();
      printBlob(blob);
    } catch {
      message.error('Print failed');
    }
  };

  const previewDoc = (() => {
    if (mode === 'packing') {
      return <PackingListTemplate container={items[0]} entries={entries} qrDataURL={qrDataURLs.get(items[0]?.id) ?? ''} />;
    }
    return (
      <Document>
        {items.map((it) => (
          <Page key={it.id} size={[425.20, 283.46]}>
            <LabelTemplate
              item={it}
              qrDataURL={qrDataURLs.get(it.id) ?? ''}
              parentNameCn={it.parentId ? parentNameCn : undefined}
              parentNameEn={it.parentId ? parentNameEn : undefined}
            />
          </Page>
        ))}
      </Document>
    );
  })();

  return (
    <Modal
      title={mode === 'label' ? t('item.print') : t('container.printPackingList')}
      open={open}
      onCancel={onClose}
      width={900}
      footer={
        <Space>
          <Button icon={<DownloadOutlined />} onClick={handleDownload}>
            Download PDF
          </Button>
          <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
            Print
          </Button>
        </Space>
      }
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin />
        </div>
      ) : (
        <div style={{ height: 500 }}>
          <PDFViewer width="100%" height="100%">
            {previewDoc}
          </PDFViewer>
        </div>
      )}
    </Modal>
  );
}
