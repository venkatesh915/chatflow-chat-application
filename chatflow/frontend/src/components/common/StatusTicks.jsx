import React from 'react';
import { Check, CheckCheck } from 'lucide-react';

export const StatusTicks = ({ status = 'sent', size = 15 }) => {
  if (status === 'read') {
    return (
      <span className="status-ticks read" title="Read">
        <CheckCheck size={size} color="#53bdeb" strokeWidth={2.5} />
      </span>
    );
  }

  if (status === 'delivered') {
    return (
      <span className="status-ticks delivered" title="Delivered">
        <CheckCheck size={size} strokeWidth={2} />
      </span>
    );
  }

  return (
    <span className="status-ticks sent" title="Sent">
      <Check size={size} strokeWidth={2} />
    </span>
  );
};
