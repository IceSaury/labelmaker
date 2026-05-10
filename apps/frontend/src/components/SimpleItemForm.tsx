import { Form, Input, InputNumber, Button, Row, Col, message } from 'antd';
import { TranslationOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import api from '../api/client';

export default function SimpleItemForm() {
  const { t } = useTranslation();
  const form = Form.useFormInstance();

  const handleTranslate = async () => {
    const nameCn = form.getFieldValue('nameCn');
    if (!nameCn) {
      message.warning('请先输入中文品名');
      return;
    }
    try {
      const res = await api.post('/translate', { text: nameCn, sourceLang: 'zh', targetLang: 'en' });
      form.setFieldsValue({ nameEn: res.data.translated });
      message.success(t('item.translateSuccess'));
    } catch {
      message.error(t('item.translateError'));
    }
  };

  return (
    <>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="nameCn" label={t('item.nameCn')} rules={[{ required: true }]}>
            <Input suffix={<Button type="text" size="small" icon={<TranslationOutlined />} onClick={handleTranslate} title={t('item.translate')} />} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="nameEn" label={t('item.nameEn')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="nameAr" label={t('item.nameAr')}>
            <Input dir="rtl" />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="weightGross" label={t('item.weightGross')}>
            <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="weightNet" label={t('item.weightNet')}>
            <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="length" label={t('item.length')}>
            <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="width" label={t('item.width')}>
            <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="height" label={t('item.height')}>
            <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
}
