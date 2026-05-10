import { Input, Select, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
}

export default function SearchBar({ search, onSearchChange, typeFilter, onTypeFilterChange }: Props) {
  const { t } = useTranslation();

  return (
    <Space>
      <Input
        prefix={<SearchOutlined />}
        placeholder={t('item.search')}
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        style={{ width: 300 }}
        allowClear
      />
      <Select
        value={typeFilter}
        onChange={onTypeFilterChange}
        style={{ width: 150 }}
        options={[
          { value: 'all', label: t('item.all') },
          { value: 'simple', label: t('item.simple') },
          { value: 'complex', label: t('item.complex') },
        ]}
      />
    </Space>
  );
}
