import { Font } from '@react-pdf/renderer';
import NotoSansSCRegular from './assets/fonts/NotoSansSC-Regular.ttf';
import NotoSansSCBold from './assets/fonts/NotoSansSC-Bold.ttf';

// Prepend origin so font URLs resolve inside PDFViewer's blob-URL iframe
const base = window.location.origin;

Font.register({
  family: 'Noto Sans SC',
  fonts: [
    { src: `${base}${NotoSansSCRegular}`, fontWeight: 400 },
    { src: `${base}${NotoSansSCBold}`, fontWeight: 700 },
  ],
});
