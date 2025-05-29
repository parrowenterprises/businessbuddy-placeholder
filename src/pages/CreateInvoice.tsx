import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Job, JobService, Customer, Profile } from '../lib/supabase';
import { format, addDays } from 'date-fns';
import toast from 'react-hot-toast';

interface JobWithDetails extends Job {
  job_services: JobService[];
  customers: Customer;
}

export default function CreateInvoice() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<JobWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [paymentTerms, setPaymentTerms] = useState('net_30');
  const [notes, setNotes] = useState('');
  const [businessProfile, setBusinessProfile] = useState<Profile | null>(null);

  useEffect(() => {
    loadJob();
    loadBusinessProfile();
  }, [jobId]);

  async function loadBusinessProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setBusinessProfile(data);
    } catch (error) {
      console.error('Error loading business profile:', error);
    }
  }

  async function loadJob() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          job_services (*),
          customers (*)
        `)
        .eq('id', jobId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setJob(data);
    } catch (error) {
      console.error('Error loading job:', error);
      navigate('/app/jobs');
    } finally {
      setLoading(false);
    }
  }

  const handleGenerateInvoice = async () => {
    if (!job || !businessProfile) return;
    setGenerating(true);

    try {
      // Calculate due date based on payment terms
      const dueDate = addDays(new Date(), paymentTerms === 'net_30' ? 30 : 15);

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert([
          {
            user_id: job.user_id,
            customer_id: job.customer_id,
            job_id: job.id,
            status: 'draft',
            total_amount: job.total_amount,
            amount_paid: 0,
            due_date: dueDate.toISOString(),
            payment_terms: paymentTerms,
            notes: notes,
          },
        ])
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Update job payment status
      const { error: jobError } = await supabase
        .from('jobs')
        .update({ payment_status: 'unpaid' })
        .eq('id', job.id);

      if (jobError) throw jobError;

      toast.success('Invoice generated successfully');
      navigate(`/app/invoices/${invoice.id}`);
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast.error('Failed to generate invoice');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">Job not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Generate Invoice</h1>
          <p className="mt-2 text-sm text-gray-700">
            Create an invoice for {job.customers.name}
          </p>
        </div>
      </div>

      <div className="mt-8 bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {/* Job Details */}
          <div className="border-b border-gray-200 pb-5">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Job Details</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Customer</dt>
                <dd className="mt-1 text-sm text-gray-900">{job.customers.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
                <dd className="mt-1 text-sm text-gray-900">${job.total_amount}</dd>
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="mt-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Services</h3>
            <div className="mt-4 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead>
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                        Service
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Quantity
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Price
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {job.job_services.map((service) => (
                      <tr key={service.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900">
                          {service.service_name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {service.quantity}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          ${service.price}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          ${service.price * service.quantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Invoice Settings */}
          <div className="mt-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Invoice Settings</h3>
            <div className="mt-4 grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="payment_terms" className="block text-sm font-medium text-gray-700">
                  Payment Terms
                </label>
                <select
                  id="payment_terms"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                >
                  <option value="net_15">Net 15</option>
                  <option value="net_30">Net 30</option>
                </select>
              </div>
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  placeholder="Add any additional notes for the invoice..."
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/app/jobs')}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleGenerateInvoice}
              disabled={generating}
              className="inline-flex items-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Generate Invoice'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 