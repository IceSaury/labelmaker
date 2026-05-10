import { Descriptions, Tag } from 'antd';
import type { Item } from '../store/itemStore';

interface Props {
  item: Item;
}

const typeColors: Record<string, string> = {
  simple: 'blue',
  complex: 'green',
  container: 'orange',
};

const typeLabels: Record<string, string> = {
  simple: 'Single / 裸装',
  complex: 'Equipment / 设备',
  container: 'Container / 容器',
};

export default function ItemDetails({ item }: Props) {
  return (
    <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
      <Descriptions.Item label="Code / 编号">
        <strong>{item.uniqueCode}</strong>
      </Descriptions.Item>
      <Descriptions.Item label="Type / 类型">
        <Tag color={typeColors[item.type]}>{typeLabels[item.type]}</Tag>
      </Descriptions.Item>
      <Descriptions.Item label="Name (CN) / 品名">
        {item.nameCn}
      </Descriptions.Item>
      <Descriptions.Item label="Name (EN)">
        {item.nameEn}
      </Descriptions.Item>
      {item.nameAr && (
        <Descriptions.Item label="الاسم (AR)" span={2}>
          <span dir="rtl" style={{ fontSize: 16 }}>{item.nameAr}</span>
        </Descriptions.Item>
      )}
      {item.partDescription && (
        <Descriptions.Item label="Part / 部件" span={2}>
          {item.partDescription}
        </Descriptions.Item>
      )}
      {item.weightGross != null && (
        <Descriptions.Item label="Gross Weight / 毛重">
          {item.weightGross} kg
        </Descriptions.Item>
      )}
      {item.weightNet != null && (
        <Descriptions.Item label="Net Weight / 净重">
          {item.weightNet} kg
        </Descriptions.Item>
      )}
      {item.length != null && item.width != null && item.height != null && (
        <Descriptions.Item label="Size / 尺寸">
          {item.length} × {item.width} × {item.height} cm
        </Descriptions.Item>
      )}
    </Descriptions>
  );
}
