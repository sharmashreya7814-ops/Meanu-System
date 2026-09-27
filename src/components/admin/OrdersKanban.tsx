import React, { useState } from 'react';
import {
  ChefHat,
  Clock,
  CheckCircle,
  AlertTriangle,
  Filter,
  User,
  Phone,
  MessageSquare,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { Order, OrderStatus } from '../../types/index.js';

interface OrdersKanbanProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: OrderStatus, reason?: string) => void;
  onRefresh: () => void;
  loading?: boolean;
}

export const OrdersKanban: React.FC<OrdersKanbanProps> = ({
  orders,
  onUpdateStatus,
  onRefresh,
  loading = false,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'ACTIVE') {
      return ['NEW', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED'].includes(o.status);
    }
    return o.status === statusFilter;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'NEW':
        return 'bg-blue-900/60 text-blue-300 border-blue-700 animate-pulse';
      case 'ACCEPTED':
        return 'bg-indigo-900/60 text-indigo-300 border-indigo-700';
      case 'PREPARING':
        return 'bg-amber-900/60 text-amber-300 border-amber-700';
      case 'READY':
        return 'bg-emerald-900/60 text-emerald-300 border-emerald-700';
      case 'SERVED':
        return 'bg-teal-900/60 text-teal-300 border-teal-700';
      case 'COMPLETED':
        return 'bg-slate-800 text-slate-400 border-slate-700';
      case 'CANCELLED':
        return 'bg-red-950/60 text-red-400 border-red-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getElapsedMinutes = (dateStr: string) => {
    const elapsedMs = Date.now() - new Date(dateStr).getTime();
    return Math.max(1, Math.floor(elapsedMs / (1000 * 60)));
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">
            Live Kitchen Operations
          </span>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Order Dispatch & KDS
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh KDS</span>
          </button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar p-1 bg-slate-950 border border-slate-800 rounded-xl">
        {[
          { key: 'ALL', label: 'All Orders' },
          { key: 'ACTIVE', label: 'Active Pipeline' },
          { key: 'NEW', label: 'New' },
          { key: 'ACCEPTED', label: 'Accepted' },
          { key: 'PREPARING', label: 'Cooking' },
          { key: 'READY', label: 'Ready for Service' },
          { key: 'SERVED', label: 'Served' },
          { key: 'COMPLETED', label: 'Completed' },
          { key: 'CANCELLED', label: 'Cancelled' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === tab.key
                ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs">
          No orders found matching the filter &quot;{statusFilter}&quot;.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const elapsed = getElapsedMinutes(order.createdAt);
            const isUrgent = elapsed > 20 && ['NEW', 'ACCEPTED', 'PREPARING'].includes(order.status);

            return (
              <div
                key={order.id}
                className={`bg-slate-950 border rounded-2xl p-5 flex flex-col justify-between transition-all ${
                  isUrgent ? 'border-amber-600/80 shadow-lg shadow-amber-950/30' : 'border-slate-800'
                }`}
              >
                <div>
                  {/* Card Header: Table + Status */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-white">
                          Table {order.table?.tableNumber || 'Assigned'}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          #{order.orderNumber}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">
                        {order.table?.tableName || 'Dining Area'}
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`text-[10px] font-mono px-2.5 py-0.5 rounded-md border font-semibold ${getStatusBadge(
                          order.status,
                        )}`}
                      >
                        {order.status}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {elapsed}m ago
                      </span>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="p-2.5 bg-slate-900 border border-slate-800/80 rounded-xl mb-3 flex items-center justify-between text-xs text-slate-300">
                    <span className="flex items-center gap-1.5 font-medium">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {order.customer?.name || 'Guest'}
                    </span>
                    <span className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
                      <Phone className="w-3 h-3" />
                      {order.customer?.mobileNumber || 'N/A'}
                    </span>
                  </div>

                  {/* Item Tickets */}
                  <div className="space-y-2 mb-4">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Ordered Items ({order.items.reduce((acc, i) => acc + i.quantity, 0)})
                    </div>

                    <div className="space-y-1.5 divide-y divide-slate-900 text-xs">
                      {order.items.map((item) => (
                        <div key={item.id} className="pt-1.5 first:pt-0 flex items-start justify-between">
                          <div>
                            <span className="font-bold text-slate-200">
                              {item.quantity}x
                            </span>{' '}
                            <span className="text-slate-300">{item.name}</span>
                            {item.specialInstructions && (
                              <div className="text-[11px] italic text-amber-400 flex items-center gap-1 mt-0.5">
                                <MessageSquare className="w-3 h-3 shrink-0" />
                                <span>Note: &quot;{item.specialInstructions}&quot;</span>
                              </div>
                            )}
                          </div>
                          <span className="font-mono text-slate-400 text-[11px]">
                            ${item.itemTotal.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {order.specialInstructions && (
                      <div className="p-2.5 bg-amber-950/40 border border-amber-800/60 rounded-lg text-xs text-amber-300 mt-2">
                        <strong>Table Special Note:</strong> &quot;{order.specialInstructions}&quot;
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Action Buttons */}
                <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-mono font-bold text-white">
                    Total: ${order.totalAmount.toFixed(2)}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {order.status === 'NEW' && (
                      <button
                        onClick={() => onUpdateStatus(order.id, 'ACCEPTED')}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Accept Ticket
                      </button>
                    )}

                    {order.status === 'ACCEPTED' && (
                      <button
                        onClick={() => onUpdateStatus(order.id, 'PREPARING')}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <ChefHat className="w-3.5 h-3.5" /> Start Cooking
                      </button>
                    )}

                    {order.status === 'PREPARING' && (
                      <button
                        onClick={() => onUpdateStatus(order.id, 'READY')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Mark Ready
                      </button>
                    )}

                    {order.status === 'READY' && (
                      <button
                        onClick={() => onUpdateStatus(order.id, 'SERVED')}
                        className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Mark Served
                      </button>
                    )}

                    {order.status === 'SERVED' && (
                      <button
                        onClick={() => onUpdateStatus(order.id, 'COMPLETED')}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Complete Order
                      </button>
                    )}

                    {['NEW', 'ACCEPTED', 'PREPARING'].includes(order.status) && (
                      <button
                        onClick={() => {
                          const reason = prompt('Enter cancellation reason (e.g. out of ingredients):');
                          if (reason !== null) {
                            onUpdateStatus(order.id, 'CANCELLED', reason);
                          }
                        }}
                        className="px-2 py-1 text-slate-500 hover:text-red-400 text-xs transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
