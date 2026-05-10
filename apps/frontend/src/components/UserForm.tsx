import { useEffect } from 'react';
import { Modal, Form, Input, Select } from 'antd';
import { useTranslation } from 'react-i18next';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: { username: string; password: string; role: string }) => void;
  loading: boolean;
  title: string;
  initialValues?: { username?: string; role?: string };
  showUsername?: boolean;
}

export default function UserForm({
  open,
  onClose,
  onSubmit,
  loading,
  title,
  initialValues,
  showUsername = true,
}: Props) {
  const { t } = useTranslation();
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.resetFields();
      if (initialValues) {
        form.setFieldsValue(initialValues);
      }
    }
  }, [open, form, initialValues]);

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        {showUsername && (
          <Form.Item
            name="username"
            label={t('user.username')}
            rules={[{ required: true, min: 3 }]}
          >
            <Input />
          </Form.Item>
        )}
        <Form.Item
          name="password"
          label={t('user.password')}
          rules={[{ required: true, min: 6 }]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item
          name="role"
          label={t('user.role')}
          rules={[{ required: true }]}
          initialValue="operator"
        >
          <Select>
            <Select.Option value="operator">{t('user.operator')}</Select.Option>
            <Select.Option value="admin">{t('user.admin')}</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
}
