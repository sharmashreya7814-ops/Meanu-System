import React, { useState } from 'react';
import {
  QrCode,
  Plus,
  ExternalLink,
  Users,
  Printer,
  CheckCircle2,
  X,
} from 'lucide-react';
import { Restaurant, Table } from '../../types/index.js';
import { QRCodeDisplay } from '../common/QRCodeDisplay.js';

interface TablesGridProps {
  restaurant: Restaurant;
  tables: Table[];
  onCreateTable: (data: { tableNumber: string; tableName: string; capacity: number }) => Promise<void>;
  onOpenCustomerView: (table: Table) => void;
}

export const TablesGrid: React.FC<TablesGridProps> = ({
  restaurant,
  tables,
  onCreateTable,
  onOpenCustomerView,
}) => {
  const [selectedTableForQR, setSelectedTableForQR] = useState<Table | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const [tableName, setTableName] = useState('');
  const [capacity, setCapacity] = useState(4);
  const [submitting, setSubmitting] = useState(false);

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumber.trim()) return;
    setSubmitting(true);
    try {
      await onCreateTable({
        tableNumber: tableNumber.trim(),
        tableName: tableName.trim() || `Table ${tableNumber.trim()}`,
        capacity: Number(capacity) || 4,
      });
      setIsAddModalOpen(false);
      setTableNumber('');
      setTableName('');
    } catch (err: any) {
      alert(err.message || 'Failed to add table');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">
            Dining Area & QR Management
          </span>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Tables & Printable QR Codes
          </h1>
          <p className="text-xs text-slate-400">
            Each table features a unique persistent QR deep-link that auto-identifies restaurant and seating
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Table</span>
        </button>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tables.map((table) => {
          const isOccupied = table.status === 'OCCUPIED';
          const tableUrl = `/restaurant/${restaurant.slug}/table/${table.id}`;

          return (
            <div
              key={table.id}
              className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-white font-mono">
                      Table {table.tableNumber}
                    </h3>
                    <span className="text-xs text-slate-400">
                      {table.tableName || 'Standard Seating'}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-semibold ${
                      isOccupied
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                        : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                    }`}
                  >
                    {table.status}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-4">
                  <Users className="w-3.5 h-3.5" />
                  <span>Capacity: {table.capacity} guests</span>
                </div>

                {/* QR Quick Visual Box */}
                <div
                  onClick={() => setSelectedTableForQR(table)}
                  className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-850 transition-colors mb-4 group"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-white p-1 flex items-center justify-center">
                      <QrCode className="w-6 h-6 text-slate-900" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors">
                        Table QR Flyer
                      </div>
                      <div className="text-[10px] text-slate-400">Click to view & print</div>
                    </div>
                  </div>
                  <Printer className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
                <button
                  onClick={() => setSelectedTableForQR(table)}
                  className="flex-1 py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5" /> QR Code
                </button>
                <button
                  onClick={() => onOpenCustomerView(table)}
                  className="flex-1 py-1.5 px-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Launch View
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* QR Code Modal Display */}
      {selectedTableForQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="relative w-full max-w-sm">
            <button
              onClick={() => setSelectedTableForQR(null)}
              className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-white flex items-center justify-center hover:bg-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <QRCodeDisplay
              url={`/restaurant/${restaurant.slug}/table/${selectedTableForQR.id}`}
              restaurantName={restaurant.name}
              tableName={selectedTableForQR.tableName || `Table ${selectedTableForQR.tableNumber}`}
              tableNumber={selectedTableForQR.tableNumber}
              size={240}
            />
          </div>
        </div>
      )}

      {/* Add Table Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1">Add Table to Dining Room</h2>
            <p className="text-xs text-slate-400 mb-4">
              Creates a dedicated QR ordering station linked to {restaurant.name}
            </p>

            <form onSubmit={handleAddTable} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Table Identifier / Number *
                </label>
                <input
                  type="text"
                  required
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="e.g. T-05, Booth-4, VIP-2"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Location / Table Name (Optional)
                </label>
                <input
                  type="text"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  placeholder="e.g. Garden Patio Bay 5"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Guest Capacity
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
