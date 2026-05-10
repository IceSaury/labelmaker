import { useEffect, useState, useCallback } from 'react';
import { Table, Button, Space, Popconfirm, Typography, Pagination, message, Modal } from 'antd';
import { EyeOutlined, PrinterOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import Input from 'antd/es/input/Input';
import PrintPreview from '../components/PrintPreview';
import ItemDetails from '../components/ItemDetails';
import type { Item } from '../store/itemStore';

export default function ContainerList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [printItem, setPrintItem] = useState<Item | null>(null);
  const [detailItem, setDetailItem] = useState<Item | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchContainers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (search) params.search = search;
      const res = await api.get('/containers', { params });
      setItems(res.data.items);
      setTotal(res.data.total);
    } catch {
      message.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [page, search, t]);

  useEffect(() => {
    fetchContainers();
  }, [fetchContainers]);

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/items/${id}`);
      message.success(t('common.success'));
      setSelectedIds((prev) => prev.filter((sid) => sid !== id));
      fetchContainers();
    } catch {
      message.error(t('common.error'));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      await Promise.all(selectedIds.map((id) => api.delete(`/items/${id}`)));
      message.success(t('common.success'));
      setSelectedIds([]);
      fetchContainers();
    } catch {
      message.error(t('common.error'));
    }
  };

  const handleClearAll = () => {
    setSelectedIds([]);
  };

  const columns = [
    { title: t('item.uniqueCode'), dataIndex: 'uniqueCode', key: 'code', width: 160 },
    { title: t('container.containerName'), dataIndex: 'nameCn', key: 'nameCn' },
    { title: t('container.containerNameEn'), dataIndex: 'nameEn', key: 'nameEn' },
    {
      title: t('container.itemCount'),
      key: 'itemCount',
      width: 100,
      render: (_: unknown, record: Item) => record.containerItems?.length ?? 0,
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
      width: 200,
      render: (_: unknown, record: Item) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => setDetailItem(record)}
          />
          <Button
            size="small"
            icon={<PrinterOutlined />}
            onClick={() => setPrintItem(record)}
          >
            {t('container.printPackingList')}
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/containers/${record.id}/edit`)}
          />
          <Popconfirm title={t('common.confirm')} onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          {t('nav.containerList')}
        </Typography.Title>
        <Space>
          {selectedIds.length > 0 && (
            <>
              <Popconfirm title={t('common.confirm')} onConfirm={handleBatchDelete}>
                <Button danger>
                  {t('common.deleteSelected')} ({selectedIds.length})
                </Button>
              </Popconfirm>
              <Button onClick={handleClearAll}>{t('common.clearAll')}</Button>
            </>
          )}
        </Space>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Input
          prefix={<SearchOutlined />}
          placeholder={t('item.search')}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ width: 300 }}
          allowClear
        />
      </div>

      <Table
        rowSelection={{
          selectedRowKeys: selectedIds,
          onChange: (keys) => setSelectedIds(keys as string[]),
        }}
        dataSource={items}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
        scroll={{ x: 900 }}
      />

      {total > 20 && (
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Pagination
            current={page}
            total={total}
            pageSize={20}
            onChange={(p) => setPage(p)}
            showTotal={(t) => `Total ${t}`}
          />
        </div>
      )}

      <Modal
        title={t('common.detail')}
        open={!!detailItem}
        onCancel={() => setDetailItem(null)}
        footer={null}
        width={700}
      >
        {detailItem && <ItemDetails item={detailItem} />}
      </Modal>

      {printItem && (
        <PrintPreview
          items={[printItem]}
          open={!!printItem}
          onClose={() => setPrintItem(null)}
          mode="packing"
        />
      )}
    </div>
  );
}
