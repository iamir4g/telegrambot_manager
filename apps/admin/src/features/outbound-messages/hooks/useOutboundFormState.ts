import { useEffect, useState } from 'react';
import type { OutboundFormValues, OutboundMessage } from '../model/types';

const empty: OutboundFormValues = { title: '', bodyHtml: '' };

export function useOutboundFormState() {
  const [values, setValues] = useState<OutboundFormValues>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);

  function startEdit(item: OutboundMessage) {
    setEditingId(item.id);
    setValues({ title: item.title, bodyHtml: item.bodyHtml });
  }

  function reset() {
    setEditingId(null);
    setValues(empty);
  }

  useEffect(() => {
    // keep stable setter identity for editor
  }, []);

  return {
    values,
    setValues,
    editingId,
    startEdit,
    reset,
    setTitle: (title: string) => setValues((v) => ({ ...v, title })),
    setBodyHtml: (bodyHtml: string) => setValues((v) => ({ ...v, bodyHtml })),
  };
}
