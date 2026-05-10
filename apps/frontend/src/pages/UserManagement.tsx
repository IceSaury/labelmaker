import { useState, useEffect, useCallback } from 'react';
import { Button, Typography, Space, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import UserTable from '../components/UserTable';
import UserForm from '../components/UserForm';
import api from '../api/client';

interface User {
  id: string;
  username: string;
  role: string;
  createdAt: string;
}

export default function UserManagement() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch {
      message.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreate = async (values: { username: string; password: string; role: string }) => {
    setCreateLoading(true);
    try {
      await api.post('/auth/register', values);
      message.success(t('common.success'));
      setCreateOpen(false);
      fetchUsers();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || t('common.error');
      message.error(msg);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/users/${id}`);
      message.success(t('common.success'));
      fetchUsers();
    } catch {
      message.error(t('common.error'));
    }
  };

  const handleChangePassword = async (values: { password: string }) => {
    if (!selectedUser) return;
    setPasswordLoading(true);
    try {
      await api.put(`/users/${selectedUser.id}/password`, values);
      message.success(t('common.success'));
      setPasswordOpen(false);
    } catch {
      message.error(t('common.error'));
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          {t('nav.users')}
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          {t('user.createUser')}
        </Button>
      </div>

      <UserTable
        users={users}
        loading={loading}
        onDelete={handleDelete}
        onChangePassword={(user) => {
          setSelectedUser(user);
          setPasswordOpen(true);
        }}
      />

      <UserForm
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        loading={createLoading}
        title={t('user.createUser')}
      />

      <UserForm
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        onSubmit={handleChangePassword}
        loading={passwordLoading}
        title={t('user.changePassword')}
        initialValues={selectedUser ? { username: selectedUser.username } : undefined}
        showUsername={false}
      />
    </div>
  );
}
