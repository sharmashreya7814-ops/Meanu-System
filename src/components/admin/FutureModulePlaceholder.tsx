import React from 'react';
import {
  Users,
  CreditCard,
  TrendingUp,
  FileText,
  Settings,
  Layers,
  ArrowRight,
  ShieldCheck,
  Database,
} from 'lucide-react';
import { AdminTab } from './AdminLayout.js';

interface FutureModulePlaceholderProps {
  module: AdminTab;
  restaurantName: string;
}

export const FutureModulePlaceholder: React.FC<FutureModulePlaceholderProps> = ({
  module,
  restaurantName,
}) => {
  const moduleInfo: Record<
    string,
    {
      title: string;
      icon: React.ComponentType<{ className?: string }>;
      description: string;
      schemaModels: string[];
      plannedFeatures: string[];
    }
  > = {
    customers: {
      title: 'Customer Directory & Dining Profiles',
      icon: Users,
      description: 'Persistent guest history, repeat visit tracking, dietary allergy records, and VIP recognition.',
      schemaModels: ['Customer', 'Order', 'OrderItem'],
      plannedFeatures: [
        'Repeat visit frequency & average order size',
        'Dietary preferences & allergy history',
        'SMS order completion notifications',
        'Customer loyalty points & custom table tags',
      ],
    },
    billing: {
      title: 'Digital Billing & Invoicing Engine',
      icon: FileText,
      description: 'Automated tax calculation, itemized split bills, service charge distribution, and digital receipt generation.',
      schemaModels: ['Order', 'OrderItem', 'Restaurant'],
      plannedFeatures: [
        'Itemized table bill printing & PDF dispatch',
        'Configurable tax rates & service fee models',
        'Per-seat bill splitting calculations',
        'Digital QR invoice for instant download',
      ],
    },
    payments: {
      title: 'Contactless Digital Payments',
      icon: CreditCard,
      description: 'Integrated Stripe, Apple Pay, Google Pay, UPI and tableside payment settlement with instant status sync.',
      schemaModels: ['Payment', 'PaymentMethod', 'Order'],
      plannedFeatures: [
        'Card, UPI, Apple Pay & Google Pay checkout at table',
        'Tip calculation & server payout allocation',
        'Automated payment reconciliation with POS',
        'Instant refund processing & dispute audit trail',
      ],
    },
    analytics: {
      title: 'Revenue Analytics & Profit/Loss (P&L)',
      icon: TrendingUp,
      description: 'Comprehensive business intelligence tracking menu item margins (Selling Price - Cost Price), peak dining hours, and table turnover velocity.',
      schemaModels: ['Order', 'OrderItem', 'MenuItem', 'Table'],
      plannedFeatures: [
        'Menu engineering matrix (Stars, Plowhorses, Puzzles, Dogs)',
        'Gross profit margin analysis per dish',
        'Hourly table turnover velocity charts',
        'Category-level revenue contribution breakdown',
      ],
    },
    reports: {
      title: 'Financial & Operational Reports',
      icon: FileText,
      description: 'End-of-day Z-reports, tax audit exports, COGS reconciliation, and kitchen prep efficiency audits.',
      schemaModels: ['Order', 'Restaurant', 'Table'],
      plannedFeatures: [
        'Automated Daily / Monthly Z-Report generator',
        'CSV/Excel accounting ledger exports',
        'Kitchen ticket fulfillment latency logs',
        'Food cost variance vs stock consumption',
      ],
    },
    settings: {
      title: 'Restaurant Tenant & Branding Settings',
      icon: Settings,
      description: 'Custom theme presets (Veg/Non-Veg/Custom), brand palette injection, tax configurations, currency symbols, and operating hours.',
      schemaModels: ['Restaurant', 'ThemeConfig'],
      plannedFeatures: [
        'Live CSS palette and typography theme editor',
        'Currency, tax rate, and service fee rate adjusters',
        'Operating hours & kitchen auto-accept toggles',
        'Multi-tenant staff RBAC & manager permission keys',
      ],
    },
  };

  const info = moduleInfo[module] || {
    title: `${module.toUpperCase()} Management`,
    icon: Layers,
    description: 'Planned system expansion module for restaurant operations.',
    schemaModels: ['Restaurant'],
    plannedFeatures: ['Modular expansion ready in database architecture'],
  };

  const Icon = info.icon;

  return (
    <div className="p-6 md:p-8 max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-sm">
            Phase 2 Architecture Ready
          </span>
          <span className="text-xs text-slate-500">·</span>
          <span className="text-xs font-mono text-emerald-400">{restaurantName}</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Icon className="w-6 h-6 text-emerald-400" />
          <span>{info.title}</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
          {info.description}
        </p>
      </div>

      {/* Database Schema Support Card */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-white">
          <Database className="w-4 h-4 text-purple-400" />
          <span>Prisma Schema & Relational Models Already Designed:</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {info.schemaModels.map((model) => (
            <span
              key={model}
              className="px-2.5 py-1 bg-purple-950/60 border border-purple-800/80 rounded-lg text-xs font-mono text-purple-300"
            >
              model {model}
            </span>
          ))}
        </div>
        <p className="text-[11px] text-slate-500">
          The database schema includes foreign keys, cost price tracking, and order timestamps so this module can be enabled without database migrations or breaking changes.
        </p>
      </div>

      {/* Planned Feature Capabilities */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
        <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
          Architecture Roadmap Capabilities
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {info.plannedFeatures.map((feat, idx) => (
            <div
              key={idx}
              className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-start gap-2.5 text-xs text-slate-300"
            >
              <div className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-bold">
                ✓
              </div>
              <span className="leading-snug">{feat}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
