import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Button, Space, message, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import ItemTypeSelector from '../components/ItemTypeSelector';
import SimpleItemForm from '../components/SimpleItemForm';
import ComplexItemForm from '../components/ComplexItemForm';
import { useItemStore } from '../store/itemStore';
import { useAuthStore } from '../store/authStore';

export default function ItemForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [type, setType] = useState('simple');
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const { createItem, updateItem, fetchItem, currentItem } = useItemStore();
  const isEdit = !!id;

  useEffect(() => {
    if (id) {
      fetchItem(id);
    }
  }, [id, fetchItem]);

  useEffect(() => {
    if (isEdit && currentItem) {
      setType(currentItem.type);
      const { id: _id, uniqueCode, createdAt, updatedAt, createdBy, parentId, parent, isContainer, containerItems, containedIn, type: _type, parts: rawParts, ...rest } = currentItem as Record<string, unknown>;
      const values: Record<string, unknown> = { ...rest, type: currentItem.type };
      if (Array.isArray(rawParts)) {
        values.parts = (rawParts as Record<string, unknown>[]).map((p) => ({
          nameCn: p.nameCn,
          nameEn: p.nameEn,
          nameAr: p.nameAr,
          partDescription: p.partDescription,
          weightGross: p.weightGross,
          weightNet: p.weightNet,
          length: p.length,
          width: p.width,
          height: p.height,
        }));
      }
      form.setFieldsValue(values);
    }
  }, [currentItem, isEdit, form]);

  const onFinish = async () => {
    setLoading(true);
    try {
      const values = form.getFieldsValue();
      const { id: _id, uniqueCode, createdAt, updatedAt, createdBy, parentId, parent, isContainer, containerItems, containedIn, ...rawValues } = values;
      const data = Object.fromEntries(
        Object.entries({ ...rawValues }).filter(([, v]) => v != null),
      );
      data.type = type;
      // Strip null values from nested parts too
      if (Array.isArray(data.parts)) {
        data.parts = (data.parts as Record<string, unknown>[]).map((p) =>
          Object.fromEntries(Object.entries(p).filter(([, v]) => v != null)),
        );
      }
      if (isEdit && id) {
        await updateItem(id, data);
      } else {
        await createItem(data);
      }
      message.success(t('common.success'));
      navigate('/items');
    } catch {
      message.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const user = useAuthStore((s) => s.user);

  return (
    <div>
      <Typography.Title level={3}>
        {isEdit ? t('item.edit') : t('nav.itemsNew')}
      </Typography.Title>

      {!isEdit && <ItemTypeSelector value={type} onChange={setType} />}

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        style={{ marginTop: 24, maxWidth: 1000 }}
        initialValues={{ type: 'simple' }}
      >
        <Form.Item name="type" hidden>
          <input type="hidden" />
        </Form.Item>

        {type === 'simple' && <SimpleItemForm />}
        {type === 'complex' && <ComplexItemForm />}
        {type === 'container' && <SimpleItemForm />}

        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            {t('common.save')}
          </Button>
          <Button onClick={() => navigate(-1)}>{t('common.cancel')}</Button>
        </Space>
      </Form>
    </div>
  );
}
