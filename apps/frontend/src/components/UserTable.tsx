import { Table, Button, Tag, Popconfirm, Space } from 'antd';
import { DeleteOutlined, KeyOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

interface User {
  id: string;
  username: string;
  role: string;
  createdAt: string;
}

interface Props {
  users: User[];
  loading: boolean;
  onDelete: (id: string) => void;
  onChangePassword: (user: User) => void;
}

export default function UserTable({ users, loading, onDelete, onChangePassword }: Props) {
  const { t } = useTranslation();

  const columns = [
    { title: t('user.username'), dataIndex: 'username', key: 'username' },
    {
      title: t('user.role'),
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={role === 'admin' ? 'red' : 'blue'}>
          {role === 'admin' ? t('user.admin') : t('user.operator')}
        </Tag>
      ),
    },
    {
      title: t('item.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (d: string) => new Date(d).toLocaleDateString(),
    },
    {
      title: t('item.actions'),
      key: 'actions',
      render: (_: unknown, record: User) => (
        <Space>
          <Button
            size="small"
            icon={<KeyOutlined />}
            onClick={() => onChangePassword(record)}
          >
            {t('user.changePassword')}
          </Button>
          <Popconfirm
            title={t('user.deleteConfirm')}
            onConfirm={() => onDelete(record.id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      dataSource={users}
      columns={columns}
      rowKey="id"
      loading={loading}
      pagination={false}
    />
  );
}
