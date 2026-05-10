import { useEffect, useState, useCallback } from 'react';
import { Typography, Space, Pagination, Button, Modal, Select, Popconfirm, message } from 'antd';
import { PrinterOutlined, InboxOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import SearchBar from '../components/SearchBar';
import ItemTable from '../components/ItemTable';
import PrintPreview from '../components/PrintPreview';
import { useItemStore, type Item } from '../store/itemStore';
import { Document, Page, pdf } from '@react-pdf/renderer';
import LabelTemplate from '../components/pdf/LabelTemplate';
import { downloadBlob } from '../utils/pdfGenerator';
import api from '../api/client';

export default function ItemList() {
  const { t } = useTranslation();
  const { items, total, page, totalPages, loading, fetchItems, deleteItem } = useItemStore();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewItems, setPreviewItems] = useState<Item[] | null>(null);
  const [previewParentName, setPreviewParentName] = useState<string | undefined>();

  const loadItems = useCallback((p?: number) => {
    const pageNum = p ?? 1;
    const params: Record<string, string> = { page: String(pageNum), limit: '20', groupByParent: 'true' };
    if (search) params.search = search;
    if (typeFilter !== 'all') params.type = typeFilter;
    fetchItems(params);
  }, [search, typeFilter, fetchItems]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleSearch = (value: string) => {
    setSearch(value);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteItem(id);
      message.success(t('common.success'));
      setSelectedIds((prev) => prev.filter((sid) => sid !== id));
      loadItems();
    } catch {
      message.error(t('common.error'));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      await Promise.all(selectedIds.map((id) => deleteItem(id)));
      message.success(t('common.success'));
      setSelectedIds([]);
      loadItems();
    } catch {
      message.error(t('common.error'));
    }
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleBatchPrint = async () => {
    if (selectedIds.length === 0) return;
    try {
      for (const id of selectedIds) {
        const res = await api.get(`/items/${id}`);
        const item = res.data;
        const { default: QRCode } = await import('qrcode');
        const qrDataURL = await QRCode.toDataURL(
          `${import.meta.env.VITE_PUBLIC_URL || window.location.origin}/view/${item.uniqueCode}`,
          { width: 200, margin: 2 },
        );
        const doc = (
          <Document>
            <Page size={[425.20, 283.46]}>
              <LabelTemplate item={item} qrDataURL={qrDataURL} />
            </Page>
          </Document>
        );
        const blob = await pdf(doc).toBlob();
        downloadBlob(blob, `${item.uniqueCode}_label.pdf`);
      }
      message.success(`Generated ${selectedIds.length} labels`);
    } catch {
      message.error(t('common.error'));
    }
  };

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [targetContainerId, setTargetContainerId] = useState<string | null>(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const [containerOptions, setContainerOptions] = useState<{ value: string; label: string }[]>([]);

  const openAssignModal = async () => {
    setAssignModalOpen(true);
    setTargetContainerId(null);
    try {
      const res = await api.get('/containers', { params: { limit: '100' } });
      setContainerOptions(
        res.data.items.map((c: Item) => ({
          value: c.id,
          label: `${c.uniqueCode} - ${c.nameCn} / ${c.nameEn}`,
        })),
      );
    } catch {
      message.error(t('common.error'));
    }
  };

  const handleAssignToContainer = async () => {
    if (!targetContainerId || selectedIds.length === 0) return;
    setAssignLoading(true);
    try {
      await api.post(`/containers/${targetContainerId}/add-items`, {
        items: selectedIds.map((id) => ({ itemId: id, quantity: 1 })),
      });
      message.success(t('item.assignedToContainer'));
      setAssignModalOpen(false);
      setSelectedIds([]);
      loadItems();
    } catch {
      message.error(t('common.error'));
    } finally {
      setAssignLoading(false);
    }
  };

  const handlePrint = (item: Item) => {
    setPreviewItems([item]);
    setPreviewParentName(undefined);
  };

  const handlePrintPart = (part: Item, parentName: string) => {
    setPreviewItems([part]);
    setPreviewParentName(parentName);
  };

  const handlePrintAllParts = (item: Item) => {
    if (!item.parts || item.parts.length === 0) return;
    setPreviewItems([item, ...item.parts]);
    setPreviewParentName(item.nameCn);
  };

  const handleClosePreview = () => {
    setPreviewItems(null);
    setPreviewParentName(undefined);
  };

  const handlePageChange = (newPage: number) => {
    loadItems(newPage);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          {t('nav.itemsList')}
        </Typography.Title>
        <Space>
          {selectedIds.length > 0 && (
            <>
              <Button icon={<PrinterOutlined />} onClick={handleBatchPrint}>
                Batch Print ({selectedIds.length})
              </Button>
              <Button icon={<InboxOutlined />} onClick={openAssignModal}>
                {t('item.putIntoContainer')} ({selectedIds.length})
              </Button>
              <Popconfirm title={t('common.confirm')} onConfirm={handleBatchDelete}>
                <Button danger icon={<DeleteOutlined />}>
                  {t('common.deleteSelected')} ({selectedIds.length})
                </Button>
              </Popconfirm>
            </>
          )}
          {selectedIds.length > 0 && (
            <Button onClick={handleClearSelection}>{t('common.clearAll')}</Button>
          )}
        </Space>
      </div>

      <div style={{ marginBottom: 16 }}>
        <SearchBar
          search={search}
          onSearchChange={handleSearch}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
        />
      </div>

      <ItemTable
        items={items}
        loading={loading}
        onDelete={handleDelete}
        onPrint={handlePrint}
        onPrintPart={handlePrintPart}
        onPrintAllParts={handlePrintAllParts}
        selectedIds={selectedIds}
        onSelectChange={setSelectedIds}
      />

      {totalPages > 1 && (
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Pagination
            current={page}
            total={total}
            pageSize={20}
            onChange={handlePageChange}
            showTotal={(t) => `Total ${t} items`}
          />
        </div>
      )}

      {previewItems && previewItems.length > 0 && (
        <PrintPreview
          items={previewItems}
          open={previewItems.length > 0}
          onClose={handleClosePreview}
          mode="label"
          parentName={previewParentName}
        />
      )}

      <Modal
        title={t('item.putIntoContainer')}
        open={assignModalOpen}
        onOk={handleAssignToContainer}
        onCancel={() => setAssignModalOpen(false)}
        confirmLoading={assignLoading}
        okButtonProps={{ disabled: !targetContainerId }}
      >
        <Typography.Text style={{ display: 'block', marginBottom: 16 }}>
          {t('item.selectedItems', { count: selectedIds.length })}
        </Typography.Text>
        <Select
          showSearch
          placeholder={t('container.title')}
          value={targetContainerId}
          onChange={setTargetContainerId}
          style={{ width: '100%' }}
          options={containerOptions}
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
        />
      </Modal>
    </div>
  );
}
