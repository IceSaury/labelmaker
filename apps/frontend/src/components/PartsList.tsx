import { Form, Input, InputNumber, Button, Card, Row, Col, message } from 'antd';
import { DeleteOutlined, TranslationOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import api from '../api/client';

export default function PartsList() {
  const { t } = useTranslation();
  const form = Form.useFormInstance();

  return (
    <Form.List name="parts">
      {(fields, { add, remove }) => (
        <>
          {fields.map(({ key, name, ...restField }) => (
            <Card
              key={key}
              size="small"
              title={`${t('item.parts')} #${name + 1}`}
              extra={
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => remove(name)}
                />
              }
              style={{ marginBottom: 12 }}
            >
              <Row gutter={12}>
                <Col span={8}>
                  <Form.Item
                    {...restField}
                    name={[name, 'nameCn']}
                    label={t('item.nameCn')}
                    rules={[{ required: true }]}
                  >
                    <Input suffix={<Button type="text" size="small" icon={<TranslationOutlined />} onClick={async () => {
                      const cn = form.getFieldValue(['parts', name, 'nameCn']);
                      if (!cn) { message.warning('请先输入中文品名'); return; }
                      try {
                        const res = await api.post('/translate', { text: cn, sourceLang: 'zh', targetLang: 'en' });
                        form.setFields([{ name: ['parts', name, 'nameEn'], value: res.data.translated }]);
                        message.success(t('item.translateSuccess'));
                      } catch { message.error(t('item.translateError')); }
                    }} title={t('item.translate')} />} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    {...restField}
                    name={[name, 'nameEn']}
                    label={t('item.nameEn')}
                    rules={[{ required: true }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item {...restField} name={[name, 'nameAr']} label={t('item.nameAr')}>
                    <Input dir="rtl" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item {...restField} name={[name, 'partDescription']} label={t('item.partDescription')}>
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item {...restField} name={[name, 'weightGross']} label={t('item.weightGross')}>
                    <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item {...restField} name={[name, 'weightNet']} label={t('item.weightNet')}>
                    <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={8}>
                  <Form.Item {...restField} name={[name, 'length']} label={t('item.length')}>
                    <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item {...restField} name={[name, 'width']} label={t('item.width')}>
                    <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item {...restField} name={[name, 'height']} label={t('item.height')}>
                    <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          ))}
          <Button type="dashed" onClick={() => add()} block>
            {t('item.addPart')}
          </Button>
        </>
      )}
    </Form.List>
  );
}
