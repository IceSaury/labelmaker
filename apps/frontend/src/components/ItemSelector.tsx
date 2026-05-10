import { useState, useEffect, useMemo } from 'react';
import { Select, Space, InputNumber, Button, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import type { Item } from '../store/itemStore';

interface Props {
  onAdd: (item: Item, quantity: number) => void;
  selectedIds: string[];
  currentContainerId?: string;
}

export default function ItemSelector({ onAdd, selectedIds, currentContainerId }: Props) {
  const { t } = useTranslation();
  const [items, setItems] = useState<Item[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [quantity, setQuantity] = useState(1);
  const [searching, setSearching] = useState(false);

  const fetchItems = async (search?: string) => {
    setSearching(true);
    try {
      const res = await api.get('/items', {
        params: { search: search || '', limit: '50' },
      });
      setItems(res.data.items || []);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleAdd = () => {
    if (!selectedId) return;
    const item = items.find((i) => i.id === selectedId);
    if (item) {
      onAdd(item, quantity);
      setSelectedId(undefined);
      setQuantity(1);
    }
  };

  const options = useMemo(() => {
    return items
      .filter((i) => !selectedIds.includes(i.id))
      .map((i) => {
        const otherContainer = i.containedIn?.[0]?.container;
        const isInOtherContainer =
          otherContainer != null && otherContainer.id !== (currentContainerId ?? '');
        return {
          value: i.id,
          label: `${i.uniqueCode} - ${i.nameCn} / ${i.nameEn}`,
          disabled: isInOtherContainer,
          tooltip: isInOtherContainer
            ? t('container.alreadyInContainer', { code: otherContainer!.uniqueCode })
            : undefined,
        };
      });
  }, [items, selectedIds, currentContainerId, t]);

  return (
    <Space>
      <Select
        showSearch
        value={selectedId}
        placeholder={t('item.search')}
        filterOption={false}
        onSearch={fetchItems}
        onChange={(val) => setSelectedId(val)}
        loading={searching}
        style={{ width: 300 }}
        options={options}
        optionRender={(option) =>
          option.data.tooltip ? (
            <Tooltip title={option.data.tooltip}>
              <span style={{ color: '#bfbfbf' }}>{option.label}</span>
            </Tooltip>
          ) : (
            <span>{option.label}</span>
          )
        }
      />
      <InputNumber
        min={1}
        value={quantity}
        onChange={(val) => setQuantity(val || 1)}
        style={{ width: 80 }}
        placeholder={t('container.quantity')}
      />
      <Button type="primary" onClick={handleAdd} disabled={!selectedId}>
        {t('container.addItems')}
      </Button>
    </Space>
  );
}
