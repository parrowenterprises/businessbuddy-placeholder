import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  UserGroupIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { supabase } from '../lib/supabase';
import MainLayout from '../components/layout/MainLayout';

interface DashboardStats {
  totalCustomers: number;
  activeQuotes: number;
  scheduledJobs: number;
  monthlyRevenue: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    activeQuotes: 0,
    scheduledJobs: 0,
    monthlyRevenue: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch total customers
      const { count: customerCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Fetch active quotes
      const { count: quoteCount } = await supabase
        .from('quotes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'sent');

      // Fetch scheduled jobs
      const { count: jobCount } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'scheduled');

      // Fetch monthly revenue
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: jobs } = await supabase
        .from('jobs')
        .select('total_amount')
        .eq('user_id', user.id)
        .eq('status', 'paid')
        .gte('completed_date', startOfMonth.toISOString());

      const monthlyRevenue = jobs?.reduce((sum, job) => sum + (job.total_amount || 0), 0) || 0;

      setStats({
        totalCustomers: customerCount || 0,
        activeQuotes: quoteCount || 0,
        scheduledJobs: jobCount || 0,
        monthlyRevenue,
      });
    };

    fetchStats();
  }, []);

  const cards = [
    {
      name: 'Total Customers',
      value: stats.totalCustomers,
      href: '/customers',
      icon: UserGroupIcon,
    },
    {
      name: 'Active Quotes',
      value: stats.activeQuotes,
      href: '/quotes',
      icon: DocumentTextIcon,
    },
    {
      name: 'Scheduled Jobs',
      value: stats.scheduledJobs,
      href: '/jobs',
      icon: ClipboardDocumentListIcon,
    },
    {
      name: 'Monthly Revenue',
      value: `$${stats.monthlyRevenue.toLocaleString()}`,
      href: '/jobs',
      icon: BanknotesIcon,
    },
  ];

  const quickActions = [
    {
      name: 'Add Customer',
      href: '/customers/new',
      icon: UserGroupIcon,
      description: 'Add a new customer to your business',
    },
    {
      name: 'Create Quote',
      href: '/quotes/new',
      icon: DocumentTextIcon,
      description: 'Create a new quote for a customer',
    },
    {
      name: 'Schedule Job',
      href: '/jobs/new',
      icon: CalendarIcon,
      description: 'Schedule a new job on your calendar',
    },
    {
      name: 'View Reports',
      href: '/reports',
      icon: ArrowTrendingUpIcon,
      description: 'See how your business is growing',
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-700">
            Get an overview of your business performance and quick access to common actions.
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <Link
              key={card.name}
              to={card.href}
              className="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow hover:bg-gray-50 sm:px-6 sm:pt-6"
            >
              <dt>
                <div className="absolute rounded-md bg-primary/10 p-3">
                  <card.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <p className="ml-16 truncate text-sm font-medium text-gray-500">{card.name}</p>
              </dt>
              <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
              </dd>
              <div className="absolute inset-x-0 bottom-0 bg-gray-50 px-4 py-4 sm:px-6">
                <div className="text-sm">
                  <span className="font-medium text-primary">
                    View all <span className="sr-only">{card.name}</span>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-base font-semibold leading-6 text-gray-900">Quick actions</h2>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                to={action.href}
                className="relative flex items-center space-x-4 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-primary/60 hover:bg-primary/5"
              >
                <div className="flex-shrink-0">
                  <action.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-sm font-medium text-gray-900">{action.name}</p>
                  <p className="truncate text-sm text-gray-500">{action.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 