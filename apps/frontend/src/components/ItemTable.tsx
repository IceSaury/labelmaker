import { useState } from 'react';
import { Table, Tag, Button, Space, Popconfirm, Modal } from 'antd';
import { Link } from 'react-router-dom';
import { EyeOutlined, PrinterOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import ItemDetails from './ItemDetails';
import type { Item } from '../store/itemStore';

const typeColors: Record<string, string> = {
  simple: 'blue',
  complex: 'green',
  container: 'orange',
};

interface Props {
  items: Item[];
  loading: boolean;
  onDelete: (id: string) => void;
  onPrint: (item: Item) => void;
  onPrintPart: (part: Item, parentName: string) => void;
  onPrintAllParts: (item: Item) => void;
  selectedIds: string[];
  onSelectChange: (ids: string[]) => void;
}

function PartSubTable({ parts, parentName, onPrintPart }: { parts: Item[]; parentName: string; onPrintPart: (part: Item, parentName: string) => void }) {
  const { t } = useTranslation();
  const partColumns = [
    { title: t('item.uniqueCode'), dataIndex: 'uniqueCode', key: 'code', width: 150 },
    { title: t('item.partDescription'), dataIndex: 'partDescription', key: 'desc' },
    { title: t('item.nameCn'), dataIndex: 'nameCn', key: 'nameCn' },
    { title: t('item.nameEn'), dataIndex: 'nameEn', key: 'nameEn' },
    {
      title: t('item.weight'),
      key: 'weight',
      width: 100,
      render: (_: unknown, r: Item) =>
        r.weightGross != null ? `${r.weightGross} kg` : '-',
    },
    {
      title: t('item.size'),
      key: 'size',
      width: 120,
      render: (_: unknown, r: Item) =>
        r.length != null ? `${r.length}×${r.width}×${r.height}` : '-',
    },
    {
      title: t('item.actions'),
      key: 'actions',
      width: 100,
      render: (_: unknown, r: Item) => (
        <Button
          size="small"
          icon={<PrinterOutlined />}
          onClick={() => onPrintPart(r, parentName)}
        />
      ),
    },
  ];

  return (
    <Table
      dataSource={parts}
      columns={partColumns}
      rowKey="id"
      pagination={false}
      size="small"
    />
  );
}

export default function ItemTable({
  items,
  loading,
  onDelete,
  onPrint,
  onPrintPart,
  onPrintAllParts,
  selectedIds,
  onSelectChange,
}: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [detailItem, setDetailItem] = useState<Item | null>(null);

  const columns = [
    { title: t('item.uniqueCode'), dataIndex: 'uniqueCode', key: 'code', width: 160 },
    { title: t('item.nameCn'), dataIndex: 'nameCn', key: 'nameCn' },
    { title: t('item.nameEn'), dataIndex: 'nameEn', key: 'nameEn' },
    {
      title: t('item.type'),
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => (
        <Tag color={typeColors[type]}>{t(`item.${type}`)}</Tag>
      ),
    },
    {
      title: t('item.belongsToContainer'),
      key: 'container',
      width: 140,
      render: (_: unknown, record: Item) => {
        const ci = record.containedIn?.[0];
        if (!ci?.container) {
          return <Tag color="green">{t('item.standalone')}</Tag>;
        }
        return <Link to={`/containers/${ci.container.id}/edit`}>{ci.container.uniqueCode}</Link>;
      },
    },
    {
      title: t('item.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (d: string) => new Date(d).toLocaleDateString(),
    },
    {
      title: t('item.actions'),
      key: 'actions',
      width: 260,
      render: (_: unknown, record: Item) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => setDetailItem(record)}
          />
          {!(record.type === 'complex' && (record.parts?.length ?? 0) > 0) && (
            <Button
              size="small"
              icon={<PrinterOutlined />}
              onClick={() => onPrint(record)}
            >
              {t('item.print')}
            </Button>
          )}
          {record.type === 'complex' && (record.parts?.length ?? 0) > 0 && (
            <Button
              size="small"
              icon={<PrinterOutlined />}
              onClick={() => onPrintAllParts(record)}
            >
              {t('item.printAllLabels')}
            </Button>
          )}
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/items/${record.id}/edit`)}
          />
          <Popconfirm title={t('common.confirm')} onConfirm={() => onDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Table
        rowSelection={{
          selectedRowKeys: selectedIds,
          onChange: (keys) => onSelectChange(keys as string[]),
        }}
        expandable={{
          rowExpandable: (record) => record.type === 'complex' && (record.parts?.length ?? 0) > 0,
          expandedRowRender: (record) => (
            <PartSubTable
              parts={record.parts!}
              parentName={record.nameCn}
              onPrintPart={onPrintPart}
            />
          ),
          defaultExpandAllRows: false,
        }}
        dataSource={items}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
        scroll={{ x: 1100 }}
      />
      <Modal
        title={t('common.detail')}
        open={!!detailItem}
        onCancel={() => setDetailItem(null)}
        footer={null}
        width={700}
      >
        {detailItem && <ItemDetails item={detailItem} />}
      </Modal>
    </>
  );
}
