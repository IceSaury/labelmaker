import { Font, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import type { Item } from '../../store/itemStore';
import NotoSansSCRegular from '../../assets/fonts/NotoSansSC-Regular.ttf';
import NotoSansSCBold from '../../assets/fonts/NotoSansSC-Bold.ttf';

// Register font so PDFViewer's iframe context can access it
const base = typeof window !== 'undefined' ? window.location.origin : '';
Font.register({
  family: 'Noto Sans SC',
  fonts: [
    { src: `${base}${NotoSansSCRegular}`, fontWeight: 400 },
    { src: `${base}${NotoSansSCBold}`, fontWeight: 700 },
  ],
});

// Label: 150mm × 100mm landscape → 425.20pt × 283.46pt
const styles = StyleSheet.create({
  page: {
    width: 425.20,
    height: 283.46,
    padding: 14,
    fontFamily: 'Noto Sans SC',
    fontSize: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  code: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Noto Sans SC',
  },
  qr: {
    width: 80,
    height: 80,
  },
  names: {
    marginBottom: 6,
  },
  nameCn: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Noto Sans SC',
  },
  nameEn: {
    fontSize: 14,
    marginTop: 2,
  },
  nameAr: {
    fontSize: 14,
    fontFamily: 'Noto Sans SC',
    marginTop: 2,
  },
  partLabel: {
    fontSize: 12,
    color: '#555',
    marginTop: 2,
  },
  specs: {
    marginBottom: 6,
    gap: 4,
  },
  specItem: {
    fontSize: 13,
    marginBottom: 2,
  },
  madeIn: {
    borderWidth: 2,
    borderColor: '#000',
    padding: 5,
    marginBottom: 6,
    alignItems: 'center',
  },
  madeInText: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Noto Sans SC',
    letterSpacing: 2,
  },
  consignee: {
    fontSize: 11,
    color: '#333',
  },
});

interface Props {
  item: Item;
  qrDataURL: string;
  consignee?: string;
  parentName?: string;
}

export default function LabelTemplate({ item, qrDataURL, consignee, parentName }: Props) {
  return (
    <View style={styles.page}>
      {/* Header: code + QR */}
      <View style={styles.header}>
        <View>
          <Text style={styles.code}>{item.uniqueCode}</Text>
        </View>
        {qrDataURL && <Image src={qrDataURL} style={styles.qr} />}
      </View>

      {/* Names */}
      <View style={styles.names}>
        <Text style={styles.nameCn}>{item.nameCn}</Text>
        <Text style={styles.nameEn}>{item.nameEn}</Text>
        {item.nameAr && <Text style={styles.nameAr}>{item.nameAr}</Text>}
        {item.partDescription && (
          <Text style={styles.partLabel}>
            {parentName ? `${parentName} - ${item.partDescription}` : `Part: ${item.partDescription}`}
          </Text>
        )}
      </View>

      {/* Specs — bilingual */}
      <View style={styles.specs}>
        {item.weightGross != null && (
          <Text style={styles.specItem}>毛重 / Gross Weight: {item.weightGross}kg</Text>
        )}
        {item.weightNet != null && (
          <Text style={styles.specItem}>净重 / Net Weight: {item.weightNet}kg</Text>
        )}
        {item.length != null && item.width != null && item.height != null && (
          <Text style={styles.specItem}>
            尺寸 / Size: {item.length}×{item.width}×{item.height}cm
          </Text>
        )}
      </View>

      {/* Made in China — bilingual */}
      <View style={styles.madeIn}>
        <Text style={styles.madeInText}>中国制造 / MADE IN CHINA</Text>
      </View>

      {/* Consignee */}
      {consignee && (
        <View>
          <Text style={styles.consignee}>收货人 / Consignee: {consignee}</Text>
        </View>
      )}
    </View>
  );
}
