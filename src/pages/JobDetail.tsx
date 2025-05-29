import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Job, JobStatus } from '../lib/supabase';
import { format, parseISO } from 'date-fns';

const statusColors: Record<JobStatus, { bg: string; text: string; label: string }> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Draft' },
  in_progress: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'In Progress' },
  completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' },
};

const JobDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchJob();
  }, [id]);

  const fetchJob = async () => {
    if (!id) return;
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          customers (
            id,
            name,
            email,
            phone,
            address
          ),
          job_services (
            id,
            name,
            description,
            price,
            quantity
          ),
          quotes (
            id,
            status
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setJob(data);
    } catch (error) {
      console.error('Error fetching job:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: JobStatus) => {
    if (!job) return;
    setUpdating(true);
    try {
      const updates: Partial<Job> = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('jobs')
        .update(updates)
        .eq('id', job.id);

      if (error) throw error;

      // Refresh job data
      fetchJob();
    } catch (error) {
      console.error('Error updating job:', error);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!job) {
    return <div>Job not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between md:space-x-5">
          <div className="flex items-start space-x-5">
            <div className="pt-1.5">
              <h1 className="text-2xl font-bold text-gray-900">
                Job for {job.customers.name}
              </h1>
              <p className="text-sm font-medium text-gray-500">
                Created on {format(parseISO(job.created_at), 'PPP')}
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-col-reverse justify-stretch space-y-4 space-y-reverse sm:flex-row-reverse sm:justify-end sm:space-x-3 sm:space-y-0 sm:space-x-reverse md:mt-0 md:flex-row md:space-x-3">
            {job.status === 'draft' && (
              <button
                type="button"
                onClick={() => handleStatusUpdate('in_progress')}
                disabled={updating}
                className="inline-flex items-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
              >
                Start Job
              </button>
            )}
            {job.status === 'in_progress' && (
              <button
                type="button"
                onClick={() => handleStatusUpdate('completed')}
                disabled={updating}
                className="inline-flex items-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
              >
                Complete Job
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Customer Details */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Customer Details</h3>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{job.customers.name}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Address</dt>
                  <dd className="mt-1 text-sm text-gray-900">{job.customers.address}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <a href={`tel:${job.customers.phone}`} className="text-primary hover:text-primary/90">
                      {job.customers.phone}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <a href={`mailto:${job.customers.email}`} className="text-primary hover:text-primary/90">
                      {job.customers.email}
                    </a>
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Job Status */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Job Status</h3>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[job.status].bg} ${statusColors[job.status].text}`}>
                      {statusColors[job.status].label}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Payment Status</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${job.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {job.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                    </span>
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
                  <dd className="mt-1 text-sm text-gray-900">${job.total_amount}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="mt-4">
          <h3 className="text-lg font-medium text-gray-900">Services</h3>
          <div className="mt-2 space-y-2">
            {job.job_services.map((service) => (
              <div key={service.id} className="bg-white p-4 rounded-lg shadow">
                <h4 className="font-medium">{service.name}</h4>
                <p className="text-gray-600">{service.description}</p>
                <div className="mt-2 flex justify-between">
                  <span>Quantity: {service.quantity}</span>
                  <span>Price: ${service.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quote Reference */}
        {job.quotes && (
          <div className="mt-4">
            <h3 className="text-lg font-medium text-gray-900">Original Quote</h3>
            <div className="mt-2">
              <Link
                to={`/app/quotes/${job.quotes.id}`}
                className="text-primary hover:text-primary/90"
              >
                View Quote #{job.quotes.id}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobDetail; 