import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Input, Button, Space, message, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import ItemSelector from '../components/ItemSelector';
import ContainerContents from '../components/ContainerContents';
import { useItemStore, type Item } from '../store/itemStore';
import api from '../api/client';

interface ContainerEntry {
  item: Item;
  quantity: number;
}

export default function ContainerForm() {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language.startsWith('zh');
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();
  const [entries, setEntries] = useState<ContainerEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { createItem, updateItem, fetchItem, currentItem } = useItemStore();
  const isEdit = !!id;

  useEffect(() => {
    if (id) {
      fetchItem(id);
    }
  }, [id, fetchItem]);

  useEffect(() => {
    if (isEdit && currentItem) {
      form.setFieldsValue(currentItem);
      if (currentItem.containerItems) {
        const valid = currentItem.containerItems
          .filter((ci) => ci.item != null) as { item: Item; quantity: number }[];
        setEntries(valid.map((ci) => ({ item: ci.item, quantity: ci.quantity })));
      }
    }
  }, [currentItem, isEdit, form]);

  const handleAddItem = (item: Item, quantity: number) => {
    if (entries.find((e) => e.item.id === item.id)) {
      message.warning('Item already in container');
      return;
    }
    setEntries([...entries, { item, quantity }]);
  };

  const handleRemove = (itemId: string) => {
    setEntries(entries.filter((e) => e.item.id !== itemId));
  };

  const handleQuantityChange = (itemId: string, quantity: number) => {
    setEntries(entries.map((e) => (e.item.id === itemId ? { ...e, quantity } : e)));
  };

  const onFinish = async () => {
    setLoading(true);
    try {
      const values = form.getFieldsValue();
      const { id: _id, uniqueCode, createdAt, updatedAt, createdBy, parts, parentId, parent, isContainer, containerItems, containedIn, type: _type, ...rawValues } = values;
      const data: Record<string, unknown> = Object.fromEntries(
        Object.entries(rawValues).filter(([, v]) => v != null),
      );
      data.type = 'container';

      let itemId: string;
      if (isEdit && id) {
        await updateItem(id, data);
        itemId = id;
      } else {
        const item = await createItem(data);
        itemId = item.id;
      }

      // Replace all items in container
      await api.put(`/containers/${itemId}/items`, {
        items: entries.map((e) => ({ itemId: e.item.id, quantity: e.quantity })),
      });

      message.success(t('common.success'));
      navigate('/containers');
    } catch {
      message.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Typography.Title level={3}>
        {isEdit ? t('item.edit') : t('nav.containerNew')}
      </Typography.Title>

      <Form form={form} layout="vertical" onFinish={onFinish} style={{ maxWidth: 1000 }}>
        <Form.Item name="nameCn" label={t('container.name')} rules={isZh ? [{ required: true }] : []}>
          <Input placeholder={t('item.nameCn')} />
        </Form.Item>
        <Form.Item name="nameEn" label={t('item.nameEn')} rules={[{ required: true }]}>
          <Input placeholder={t('item.nameEn')} />
        </Form.Item>
        <Form.Item name="nameAr" label={t('item.nameAr')}>
          <Input dir="rtl" />
        </Form.Item>
      </Form>

      <div style={{ marginBottom: 16 }}>
        <ItemSelector onAdd={handleAddItem} selectedIds={entries.map((e) => e.item.id)} currentContainerId={id} />
      </div>

      {entries.length > 0 && (
        <ContainerContents
          items={entries}
          onQuantityChange={handleQuantityChange}
          onRemove={handleRemove}
        />
      )}

      <Space style={{ marginTop: 24 }}>
        <Button type="primary" onClick={() => form.submit()} loading={loading}>
          {t('common.save')}
        </Button>
        <Button onClick={() => navigate(-1)}>{t('common.cancel')}</Button>
      </Space>
    </div>
  );
}
