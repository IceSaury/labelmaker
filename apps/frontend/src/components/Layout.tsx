import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout as AntLayout, Menu, Button, Dropdown, theme } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlusOutlined,
  UnorderedListOutlined,
  InboxOutlined,
  DropboxOutlined,
  UserOutlined,
  LogoutOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';

const { Header, Sider, Content } = AntLayout;

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { token: themeToken } = theme.useToken();

  const isAdmin = user?.role === 'admin';

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: t('app.dashboard'),
    },
    {
      key: 'items-group',
      icon: <InboxOutlined />,
      label: t('nav.items'),
      children: [
        {
          key: '/items/new',
          icon: <PlusOutlined />,
          label: t('nav.itemsNew'),
        },
        {
          key: '/items',
          icon: <UnorderedListOutlined />,
          label: t('nav.itemsList'),
        },
      ],
    },
    {
      key: 'containers-group',
      icon: <DropboxOutlined />,
      label: t('nav.containers'),
      children: [
        {
          key: '/containers/new',
          icon: <PlusOutlined />,
          label: t('nav.containerNew'),
        },
        {
          key: '/containers',
          icon: <UnorderedListOutlined />,
          label: t('nav.containerList'),
        },
      ],
    },
    ...(isAdmin
      ? [
          {
            key: '/users',
            icon: <UserOutlined />,
            label: t('nav.users'),
          },
        ]
      : []),
  ];

  const handleMenuClick = (info: { key: string }) => {
    navigate(info.key);
  };

  const switchLanguage = () => {
    const next = i18n.language === 'zh' ? 'en' : 'zh';
    i18n.changeLanguage(next);
    localStorage.setItem('lang', next);
  };

  const langItems = [
    {
      key: 'zh',
      label: '中文',
    },
    {
      key: 'en',
      label: 'English',
    },
  ];

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('app.logout'),
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div
          style={{
            height: 48,
            margin: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: collapsed ? 14 : 16,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          {collapsed ? 'JOR' : t('app.title')}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={['items-group', 'containers-group']}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <AntLayout>
        <Header
          style={{
            padding: '0 24px',
            background: themeToken.colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Dropdown menu={{ items: langItems, onClick: ({ key }) => { i18n.changeLanguage(key); localStorage.setItem('lang', key); } }}>
              <Button type="text">{i18n.language === 'zh' ? '中文' : 'EN'}</Button>
            </Dropdown>
            <Dropdown menu={{ items: userMenuItems }}>
              <Button type="text" icon={<UserOutlined />}>
                {user?.username}
              </Button>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: 24,
            padding: 24,
            background: themeToken.colorBgContainer,
            borderRadius: themeToken.borderRadiusLG,
            minHeight: 280,
            overflow: 'auto',
          }}
        >
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
}
