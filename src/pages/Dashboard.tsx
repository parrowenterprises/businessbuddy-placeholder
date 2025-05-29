import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Profile } from '../lib/supabase';

interface DashboardStats {
  jobsToday: number;
  pendingQuotes: number;
  pendingInvoices: number;
  weeklyEarnings: number;
  weeklyJobsCompleted: number;
}

interface RecentActivity {
  id: string;
  type: 'quote_approved' | 'job_completed' | 'payment_received';
  description: string;
  date: string;
}

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    jobsToday: 0,
    pendingQuotes: 0,
    pendingInvoices: 0,
    weeklyEarnings: 0,
    weeklyJobsCompleted: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        setProfile(profile);

        // TODO: Load real stats and activity from the database
        // For now, we'll show sample data
        setStats({
          jobsToday: 3,
          pendingQuotes: 2,
          pendingInvoices: 450,
          weeklyEarnings: 1200,
          weeklyJobsCompleted: 8,
        });

        setRecentActivity([
          {
            id: '1',
            type: 'quote_approved',
            description: 'Sarah M. approved kitchen cleaning quote',
            date: new Date().toISOString(),
          },
          {
            id: '2',
            type: 'job_completed',
            description: 'Lawn service for Johnson family completed',
            date: new Date().toISOString(),
          },
          {
            id: '3',
            type: 'payment_received',
            description: 'Payment received: $85 from Miller property',
            date: new Date().toISOString(),
          },
        ]);
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // New user onboarding view
  if (!profile?.business_name || !profile?.service_types?.length) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Welcome to BusinessBuddy! 👋
            </h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>Let's get your business organized in 3 simple steps:</p>
            </div>
            <div className="mt-5">
              <div className="space-y-4">
                <Link
                  to="/app/customers/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  1. Add your first customer
                </Link>
                <Link
                  to="/app/services"
                  className="block px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary bg-primary/10 hover:bg-primary/20"
                >
                  2. Set up your services
                </Link>
                <Link
                  to="/app/help"
                  className="block px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-600 bg-gray-100 hover:bg-gray-200"
                >
                  3. Get help if needed
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Returning user operational view
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Today's Focus */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Today's Focus</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{stats.jobsToday}</div>
            <div className="text-sm text-gray-500">jobs scheduled today</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{stats.pendingQuotes}</div>
            <div className="text-sm text-gray-500">quotes waiting for approval</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">${stats.pendingInvoices}</div>
            <div className="text-sm text-gray-500">pending invoices</div>
          </div>
        </div>
      </div>

      {/* This Week Summary */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">This Week</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-bold text-gray-900">${stats.weeklyEarnings}</div>
            <div className="text-sm text-gray-500">earned</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{stats.weeklyJobsCompleted}</div>
            <div className="text-sm text-gray-500">jobs completed</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/app/customers/new"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90"
          >
            Add Customer
          </Link>
          <Link
            to="/app/quotes/new"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary bg-primary/10 hover:bg-primary/20"
          >
            Create Quote
          </Link>
          <Link
            to="/app/jobs/schedule"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary bg-primary/10 hover:bg-primary/20"
          >
            Schedule Job
          </Link>
          <Link
            to="/app/invoices/new"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary bg-primary/10 hover:bg-primary/20"
          >
            Send Invoice
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
        <div className="flow-root">
          <ul role="list" className="-mb-8">
            {recentActivity.map((activity, activityIdx) => (
              <li key={activity.id}>
                <div className="relative pb-8">
                  {activityIdx !== recentActivity.length - 1 ? (
                    <span
                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                      aria-hidden="true"
                    />
                  ) : null}
                  <div className="relative flex space-x-3">
                    <div>
                      <span className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center ring-8 ring-white">
                        {activity.type === 'quote_approved' && '📋'}
                        {activity.type === 'job_completed' && '✅'}
                        {activity.type === 'payment_received' && '💰'}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p className="text-sm text-gray-500">{activity.description}</p>
                      </div>
                      <div className="text-right text-sm whitespace-nowrap text-gray-500">
                        <time dateTime={activity.date}>
                          {new Date(activity.date).toLocaleDateString()}
                        </time>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
} 