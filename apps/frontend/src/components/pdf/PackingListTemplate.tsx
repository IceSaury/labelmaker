import { Font, Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import type { Item } from '../../store/itemStore';
import NotoSansSCRegular from '../../assets/fonts/NotoSansSC-Regular.ttf';
import NotoSansSCBold from '../../assets/fonts/NotoSansSC-Bold.ttf';

const base = typeof window !== 'undefined' ? window.location.origin : '';
Font.register({
  family: 'Noto Sans SC',
  fonts: [
    { src: `${base}${NotoSansSCRegular}`, fontWeight: 400 },
    { src: `${base}${NotoSansSCBold}`, fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Noto Sans SC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Noto Sans SC',
  },
  code: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Noto Sans SC',
    marginBottom: 4,
  },
  qr: {
    width: 70,
    height: 70,
  },
  subtitle: {
    fontSize: 10,
    color: '#555',
    marginBottom: 16,
  },
  table: {
    width: '100%',
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1.5,
    borderBottomColor: '#000',
    paddingBottom: 6,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
    paddingVertical: 4,
  },
  colNo: { width: '4%' },
  colCode: { width: '14%' },
  colMainName: { width: '24%' },
  colPartName: { width: '16%' },
  colQty: { width: '8%', textAlign: 'right' },
  colWeight: { width: '17%', textAlign: 'right' },
  colSize: { width: '17%', textAlign: 'right' },
  bold: {
    fontFamily: 'Noto Sans SC',
  },
  total: {
    flexDirection: 'row',
    borderTopWidth: 1.5,
    borderTopColor: '#000',
    paddingTop: 6,
  },
  footer: {
    marginTop: 24,
    fontSize: 9,
    color: '#555',
  },
});

interface PackingEntry {
  item: Item;
  quantity: number;
}

interface Props {
  container: Item;
  entries: PackingEntry[];
  qrDataURL: string;
  consignee?: string;
}

export default function PackingListTemplate({ container, entries, qrDataURL, consignee }: Props) {
  const totalWeight = entries.reduce((s, e) => s + (e.item.weightGross || 0) * e.quantity, 0);
  const totalQty = entries.reduce((s, e) => s + e.quantity, 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>PACKING LIST</Text>
            <Text style={styles.code}>{container.uniqueCode}</Text>
            <Text style={styles.subtitle}>
              {container.nameCn} / {container.nameEn}
            </Text>
          </View>
          {qrDataURL && <Image src={qrDataURL} style={styles.qr} />}
        </View>

        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={styles.colNo}>#</Text>
          <Text style={styles.colCode}>Code</Text>
          <Text style={styles.colMainName}>主品名 / Main Product</Text>
          <Text style={styles.colPartName}>部件名 / Part Name</Text>
          <Text style={styles.colQty}>Qty</Text>
          <Text style={styles.colWeight}>Weight (kg)</Text>
          <Text style={styles.colSize}>Size (cm)</Text>
        </View>

        {/* Table Rows */}
        {entries.map((entry, idx) => {
          const parent = entry.item.parent;
          const mainNameCn = parent ? parent.nameCn : entry.item.nameCn;
          const mainNameEn = parent ? parent.nameEn : entry.item.nameEn;
          const partName = parent ? entry.item.nameCn : '-';
          return (
            <View style={styles.tableRow} key={entry.item.id}>
              <Text style={styles.colNo}>{idx + 1}</Text>
              <Text style={styles.colCode}>{entry.item.uniqueCode}</Text>
              <View style={styles.colMainName}>
                <Text>{mainNameCn}</Text>
                <Text>{mainNameEn}</Text>
              </View>
              <Text style={styles.colPartName}>{partName}</Text>
              <Text style={styles.colQty}>{entry.quantity}</Text>
              <Text style={styles.colWeight}>
                {((entry.item.weightGross || 0) * entry.quantity).toFixed(1)}
              </Text>
              <Text style={styles.colSize}>
                {entry.item.length
                  ? `${entry.item.length}×${entry.item.width}×${entry.item.height}`
                  : '-'}
              </Text>
            </View>
          );
        })}

        {/* Totals */}
        <View style={styles.total}>
          <Text style={[styles.colNo, styles.bold]}>Total</Text>
          <Text style={styles.colCode} />
          <Text style={styles.colMainName} />
          <Text style={styles.colPartName} />
          <Text style={[styles.colQty, styles.bold]}>{totalQty}</Text>
          <Text style={[styles.colWeight, styles.bold]}>{totalWeight.toFixed(1)}</Text>
          <Text style={styles.colSize} />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {consignee && <Text>Consignee: {consignee}</Text>}
          <Text>MADE IN CHINA</Text>
        </View>
      </Page>
    </Document>
  );
}
