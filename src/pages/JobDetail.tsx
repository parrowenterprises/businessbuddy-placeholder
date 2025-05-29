import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Job, JobStatus } from '../lib/supabase';

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
            service_name,
            notes,
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

  if (!job || !job.customers) {
    return <div>Job not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Job for {job.customers.name}
              </h1>
              <p className="mt-1 text-sm text-gray-500">Job #{job.id}</p>
            </div>
            <div className="flex items-center space-x-4">
              {job.status === 'draft' && (
                <button
                  onClick={() => handleStatusUpdate('scheduled')}
                  className="btn btn-primary"
                  disabled={updating}
                >
                  Schedule Job
                </button>
              )}
              {/* Add more status update buttons as needed */}
            </div>
          </div>

          {/* Job Details */}
          <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Job Details
              </h3>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Customer</dt>
                  <dd className="mt-1 text-sm text-gray-900">{job.customers.name}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Address</dt>
                  <dd className="mt-1 text-sm text-gray-900">{job.customers.address}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <a href={`tel:${job.customers.phone}`} className="text-primary hover:text-primary/90">
                      {job.customers.phone}
                    </a>
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <a href={`mailto:${job.customers.email}`} className="text-primary hover:text-primary/90">
                      {job.customers.email}
                    </a>
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-sm text-gray-900">{job.description}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Services */}
          <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Services
              </h3>
            </div>
            <div className="border-t border-gray-200">
              <ul className="divide-y divide-gray-200">
                {job.job_services?.map((service) => (
                  <li key={service.id} className="px-4 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {service.service_name}
                        </p>
                        <p className="text-sm text-gray-500">{service.notes}</p>
                      </div>
                      <div className="text-sm text-gray-900">
                        ${service.price.toFixed(2)} x {service.quantity}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Quote Link */}
          {job.quotes && (
            <div className="mt-8">
              <Link
                to={`/app/quotes/${job.quotes.id}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90"
              >
                View Quote #{job.quotes.id}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobDetail; 