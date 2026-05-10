import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      await login(values.username, values.password);
      message.success(t('common.success'));
      navigate('/dashboard');
    } catch {
      message.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Card style={{ width: 400, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
        <h1 style={{ textAlign: 'center', marginBottom: 32 }}>{t('app.title')}</h1>
        <Form name="login" onFinish={onFinish} size="large">
          <Form.Item name="username" rules={[{ required: true, message: t('user.username') }]}>
            <Input prefix={<UserOutlined />} placeholder={t('user.username')} />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: t('user.password') }]}>
            <Input.Password prefix={<LockOutlined />} placeholder={t('user.password')} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              {t('app.login')}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
