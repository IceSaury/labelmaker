import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Statistic, Button, Space } from 'antd';
import { PlusOutlined, InboxOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import api from '../api/client';

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, simple: 0, complex: 0, container: 0 });

  useEffect(() => {
    api.get('/items', { params: { limit: '1' } }).then((res) => {
      setStats((s) => ({ ...s, total: res.data.total }));
    }).catch(() => {});
  }, []);

  return (
    <div>
      <h2>{t('app.dashboard')}</h2>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title={t('nav.itemsList')} value={stats.total} prefix={<InboxOutlined />} />
          </Card>
        </Col>
      </Row>
      <Space size="middle">
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/items/new')}>
          {t('nav.itemsNew')}
        </Button>
        <Button icon={<InboxOutlined />} onClick={() => navigate('/containers/new')}>
          {t('nav.containerNew')}
        </Button>
        <Button icon={<UnorderedListOutlined />} onClick={() => navigate('/items')}>
          {t('nav.itemsList')}
        </Button>
      </Space>
    </div>
  );
}
