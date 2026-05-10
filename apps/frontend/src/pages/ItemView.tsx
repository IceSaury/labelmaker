import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Typography, Spin, Descriptions, Tag, Divider, Card } from 'antd';
import type { Item } from '../store/itemStore';
import api from '../api/client';

const typeColors: Record<string, string> = {
  simple: 'blue',
  complex: 'green',
  container: 'orange',
};

const typeLabels: Record<string, string> = {
  simple: 'Single / 裸装',
  complex: 'Equipment / 设备',
  container: 'Container / 容器',
};

export default function ItemView() {
  const { uniqueCode } = useParams<{ uniqueCode: string }>();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!uniqueCode) return;
    setLoading(true);
    api
      .get(`/items/code/${uniqueCode}`)
      .then((res) => {
        setItem(res.data);
        document.title = `${res.data.uniqueCode} - ${res.data.nameCn}`;
        setLoading(false);
      })
      .catch(() => {
        setError('Item not found / 货物未找到');
        setLoading(false);
      });
  }, [uniqueCode]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Typography.Title level={4} type="danger">
          {error || 'Not found'}
        </Typography.Title>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <Typography.Text type="secondary" style={{ fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' }}>
          Jordan Export Label / 约旦出口唛头
        </Typography.Text>

        {/* Arabic name — most prominent for Middle East customs */}
        {item.nameAr && (
          <Typography.Title level={2} style={{ marginTop: 8, marginBottom: 4 }}>
            <span dir="rtl">{item.nameAr}</span>
          </Typography.Title>
        )}

        <Typography.Title level={3} style={{ marginTop: 4, marginBottom: 4 }}>
          {item.nameCn}
        </Typography.Title>
        <Typography.Title level={4} style={{ margin: 0, fontWeight: 400, color: '#555' }}>
          {item.nameEn}
        </Typography.Title>

        <Typography.Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
          Code: {item.uniqueCode}
        </Typography.Text>
      </div>

      {/* Details */}
      <Card bordered style={{ marginBottom: 16 }}>
        <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
          <Descriptions.Item label="Code / 编号">
            <strong>{item.uniqueCode}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Type / 类型">
            <Tag color={typeColors[item.type]}>{typeLabels[item.type]}</Tag>
          </Descriptions.Item>
          {item.partDescription && (
            <Descriptions.Item label="Part / 部件说明" span={2}>
              {item.partDescription}
            </Descriptions.Item>
          )}
          {item.weightGross != null && (
            <Descriptions.Item label="Gross Weight / 毛重">
              {item.weightGross} kg
            </Descriptions.Item>
          )}
          {item.weightNet != null && (
            <Descriptions.Item label="Net Weight / 净重">
              {item.weightNet} kg
            </Descriptions.Item>
          )}
          {item.length != null && item.width != null && item.height != null && (
            <Descriptions.Item label="Size / 尺寸">
              {item.length} × {item.width} × {item.height} cm
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* Parts for complex items */}
      {item.parts && item.parts.length > 0 && (
        <Card bordered style={{ marginBottom: 16 }}>
          <Typography.Title level={5} style={{ marginTop: 0 }}>
            Parts / 部件清单 ({item.parts.length})
          </Typography.Title>
          {item.parts.map((part, idx) => (
            <Card key={part.id} size="small" style={{ marginBottom: 8 }}>
              <Typography.Text strong>
                #{idx + 1} {part.uniqueCode}
              </Typography.Text>
              <br />
              <Typography.Text>{part.nameCn} / {part.nameEn}</Typography.Text>
              {part.partDescription && (
                <>
                  <br />
                  <Typography.Text type="secondary">{part.partDescription}</Typography.Text>
                </>
              )}
              {(part.weightGross != null || part.length != null) && (
                <>
                  <br />
                  <Typography.Text type="secondary">
                    {part.weightGross != null && `Gross: ${part.weightGross}kg `}
                    {part.length != null && `Size: ${part.length}×${part.width}×${part.height}cm`}
                  </Typography.Text>
                </>
              )}
            </Card>
          ))}
        </Card>
      )}

      {/* Container contents */}
      {item.containerItems && item.containerItems.length > 0 && (
        <Card bordered style={{ marginBottom: 16 }}>
          <Typography.Title level={5} style={{ marginTop: 0 }}>
            Contents / 装箱内容 ({item.containerItems.length})
          </Typography.Title>
          {item.containerItems.map((ci, idx) => (
            <div key={ci.id ?? idx} style={{ padding: '4px 0', borderBottom: '1px solid #f0f0f0' }}>
              <Typography.Text strong>#{idx + 1} </Typography.Text>
              <Typography.Text>{ci.item?.uniqueCode ?? ci.itemId}</Typography.Text>
              <Typography.Text> — {ci.item?.nameCn} / {ci.item?.nameEn}</Typography.Text>
              <Typography.Text type="secondary"> × {ci.quantity}</Typography.Text>
            </div>
          ))}
        </Card>
      )}

      {/* Parent info for parts */}
      {item.parent && (
        <Card bordered style={{ marginBottom: 16 }}>
          <Typography.Title level={5} style={{ marginTop: 0 }}>
            Main Equipment / 主设备
          </Typography.Title>
          <Typography.Text>
            {item.parent.uniqueCode} — {item.parent.nameCn} / {item.parent.nameEn}
          </Typography.Text>
        </Card>
      )}

      {/* Footer */}
      <Divider />
      <div style={{ textAlign: 'center' }}>
        <Typography.Text strong style={{ fontSize: 14, letterSpacing: 2 }}>
          MADE IN CHINA / 中国制造
        </Typography.Text>
        <br />
        <Typography.Text type="secondary" style={{ fontSize: 10 }}>
          Jordan Export — Bayan Customs Compliance / 约旦出口 — 巴彦系统合规唛头
        </Typography.Text>
      </div>
    </div>
  );
}
