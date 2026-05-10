import { Card, Row, Col, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { AppstoreOutlined, PartitionOutlined } from '@ant-design/icons';

interface Props {
  value: string;
  onChange: (type: string) => void;
}

export default function ItemTypeSelector({ value, onChange }: Props) {
  const { t } = useTranslation();

  const types = [
    {
      key: 'simple',
      icon: <AppstoreOutlined style={{ fontSize: 32, color: '#1890ff' }} />,
      title: t('item.simple'),
      desc: '单个独立包装，直接贴唛头',
    },
    {
      key: 'complex',
      icon: <PartitionOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
      title: t('item.complex'),
      desc: '一台设备拆分为多个部件包装',
    },
  ];

  return (
    <Row gutter={16}>
      {types.map((t) => (
        <Col span={12} key={t.key}>
          <Card
            hoverable
            style={{
              textAlign: 'center',
              border: value === t.key ? '2px solid #1890ff' : '1px solid #d9d9d9',
              cursor: 'pointer',
            }}
            onClick={() => onChange(t.key)}
          >
            <div style={{ marginBottom: 12 }}>{t.icon}</div>
            <Typography.Title level={5}>{t.title}</Typography.Title>
            <Typography.Text type="secondary">{t.desc}</Typography.Text>
          </Card>
        </Col>
      ))}
    </Row>
  );
}
