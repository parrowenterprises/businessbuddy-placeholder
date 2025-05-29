import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Job } from '../../lib/supabase';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import MainLayout from '../../components/layout/MainLayout';
import JobStatusBadge from '../../components/jobs/JobStatusBadge';
import toast from 'react-hot-toast';

type JobWithCustomer = Job & {
  customers: {
    name: string;
    email: string;
  };
};

export default function Jobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<JobWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Job['status'] | 'all'>('all');
  const [sortBy, setSortBy] = useState<'scheduled_date' | 'created_at'>('scheduled_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    loadJobs();
  }, [sortBy, sortOrder]);

  async function loadJobs() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('jobs')
        .select('*, customers(name, email)')
        .eq('user_id', user.id)
        .order(sortBy, { ascending: sortOrder === 'asc' });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error loading jobs:', error);
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.customers.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'Not scheduled';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <MainLayout>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Jobs</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage and track all your jobs
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 sm:flex sm:items-center sm:justify-between">
        <div className="relative flex-grow max-w-lg">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            placeholder="Search jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full rounded-md border-gray-300 pl-10 focus:border-primary focus:ring-primary sm:text-sm"
          />
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-4 sm:flex space-x-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as Job['status'] | 'all')}
            className="block w-full rounded-md border-gray-300 text-base focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
          >
            <option value="all">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field as typeof sortBy);
              setSortOrder(order as typeof sortOrder);
            }}
            className="block w-full rounded-md border-gray-300 text-base focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
          >
            <option value="scheduled_date-asc">Earliest First</option>
            <option value="scheduled_date-desc">Latest First</option>
            <option value="created_at-desc">Recently Created</option>
            <option value="created_at-asc">Oldest Created</option>
          </select>
        </div>
      </div>

      {/* Jobs List */}
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredJobs.length > 0 ? (
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Job Title
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Customer
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Scheduled Date
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredJobs.map((job) => (
                      <tr
                        key={job.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/jobs/${job.id}`)}
                      >
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {job.title}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {job.customers.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <JobStatusBadge status={job.status} />
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {formatDate(job.scheduled_date)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          ${job.total_amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">No jobs found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 