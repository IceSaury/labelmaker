import { Table, Button, InputNumber, Space, Popconfirm, Typography } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { Item } from '../store/itemStore';

interface ContainerEntry {
  item: Item;
  quantity: number;
}

interface Props {
  items: ContainerEntry[];
  onQuantityChange: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
}

export default function ContainerContents({ items, onQuantityChange, onRemove }: Props) {
  const { t } = useTranslation();

  const totalWeight = items.reduce((sum, e) => sum + (e.item.weightGross || 0) * e.quantity, 0);
  const totalVolume = items.reduce(
    (sum, e) => sum + ((e.item.length || 0) * (e.item.width || 0) * (e.item.height || 0)) / 1_000_000 * e.quantity,
    0,
  );

  const columns = [
    { title: '#', render: (_: unknown, __: unknown, idx: number) => idx + 1, width: 50 },
    { title: t('item.uniqueCode'), dataIndex: ['item', 'uniqueCode'], key: 'code' },
    { title: t('item.nameCn'), dataIndex: ['item', 'nameCn'], key: 'nameCn' },
    { title: t('item.nameEn'), dataIndex: ['item', 'nameEn'], key: 'nameEn' },
    {
      title: t('container.quantity'),
      key: 'quantity',
      render: (_: unknown, record: ContainerEntry) => (
        <InputNumber
          min={1}
          value={record.quantity}
          onChange={(v) => onQuantityChange(record.item.id, v || 1)}
          style={{ width: 70 }}
        />
      ),
    },
    {
      title: t('item.weightGross'),
      key: 'weight',
      render: (_: unknown, record: ContainerEntry) =>
        `${((record.item.weightGross || 0) * record.quantity).toFixed(1)} kg`,
    },
    {
      title: t('item.actions'),
      key: 'actions',
      render: (_: unknown, record: ContainerEntry) => (
        <Popconfirm title={t('common.confirm')} onConfirm={() => onRemove(record.item.id)}>
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ marginTop: 24 }}>
      <Typography.Title level={5}>{t('container.contents')}</Typography.Title>
      <Table
        dataSource={items}
        columns={columns}
        rowKey={(r) => r.item.id}
        pagination={false}
        size="small"
        summary={() => (
          <Table.Summary.Row>
            <Table.Summary.Cell index={0} colSpan={4}>
              <strong>{t('container.totalWeight')}</strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={1}>
              <strong>{items.reduce((s, e) => s + e.quantity, 0)}</strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={2}>
              <strong>{totalWeight.toFixed(1)} kg</strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={3} />
          </Table.Summary.Row>
        )}
      />
    </div>
  );
}
