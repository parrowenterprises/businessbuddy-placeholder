import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Customer } from '../../lib/supabase';
import { PhoneIcon, EnvelopeIcon, MapPinIcon, PencilIcon } from '@heroicons/react/24/outline';
import MainLayout from '../../components/layout/MainLayout';
import CustomerForm from '../../components/customers/CustomerForm';
import InvoiceHistory from '../../components/invoices/InvoiceHistory';
import toast from 'react-hot-toast';

interface CustomerWithJobs extends Customer {
  jobs: {
    id: string;
    title: string;
    status: string;
    total_amount: number;
    completed_at: string | null;
  }[];
}

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<CustomerWithJobs | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);

  useEffect(() => {
    loadCustomer();
  }, [id]);

  useEffect(() => {
    if (customer?.lat && customer?.lng) {
      initMap();
    }
  }, [customer?.lat, customer?.lng]);

  async function loadCustomer() {
    try {
      if (!id) return;

      const { data, error } = await supabase
        .from('customers')
        .select('*, jobs(id, title, status, total_amount, completed_at)')
        .eq('id', id)
        .single();

      if (error) throw error;
      setCustomer(data);

      // If we don't have coordinates, get them from the address
      if (data && (!data.lat || !data.lng)) {
        const coordinates = await getCoordinates(data.address);
        if (coordinates) {
          await updateCustomerCoordinates(data.id, coordinates.lat, coordinates.lng);
          setCustomer(prev => prev ? { ...prev, ...coordinates } : null);
        }
      }
    } catch (error) {
      console.error('Error loading customer:', error);
      toast.error('Failed to load customer');
    } finally {
      setLoading(false);
    }
  }

  async function getCoordinates(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      
      if (data.results?.[0]?.geometry?.location) {
        return data.results[0].geometry.location;
      }
      return null;
    } catch (error) {
      console.error('Error getting coordinates:', error);
      return null;
    }
  }

  async function updateCustomerCoordinates(customerId: string, lat: number, lng: number) {
    try {
      const { error } = await supabase
        .from('customers')
        .update({ lat, lng })
        .eq('id', customerId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating coordinates:', error);
    }
  }

  function initMap() {
    if (!customer?.lat || !customer?.lng) return;

    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    const newMap = new google.maps.Map(mapElement, {
      center: { lat: customer.lat, lng: customer.lng },
      zoom: 15,
    });

    const newMarker = new google.maps.Marker({
      position: { lat: customer.lat, lng: customer.lng },
      map: newMap,
      title: customer.name,
    });

    setMap(newMap);
    setMarker(newMarker);
  }

  const handleUpdateCustomer = async (updatedData: Partial<Customer>) => {
    try {
      setIsSubmitting(true);

      if (!id) return;

      // Get coordinates for the new address if it changed
      let coordinates = null;
      if (updatedData.address && updatedData.address !== customer?.address) {
        coordinates = await getCoordinates(updatedData.address);
      }

      const { error } = await supabase
        .from('customers')
        .update({
          ...updatedData,
          ...(coordinates && { lat: coordinates.lat, lng: coordinates.lng }),
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Customer updated successfully');
      setIsEditing(false);
      loadCustomer();
    } catch (error) {
      console.error('Error updating customer:', error);
      toast.error('Failed to update customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (!customer) {
    return (
      <MainLayout>
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">Customer not found</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {isEditing ? (
          <div className="max-w-3xl mx-auto">
            <div className="sm:flex sm:items-center sm:justify-between">
              <h1 className="text-2xl font-semibold text-gray-900">Edit Customer</h1>
              <button
                onClick={() => setIsEditing(false)}
                className="mt-4 sm:mt-0 text-sm text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
            </div>
            <div className="mt-6">
              <CustomerForm
                customer={customer}
                onSubmit={handleUpdateCustomer}
                isSubmitting={isSubmitting}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="sm:flex sm:items-center sm:justify-between">
              <h1 className="text-2xl font-semibold text-gray-900">{customer.name}</h1>
              <button
                onClick={() => setIsEditing(true)}
                className="mt-4 sm:mt-0 inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
              >
                <PencilIcon className="h-4 w-4 mr-1" />
                Edit
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Customer Info */}
              <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg font-medium text-gray-900">Contact Information</h2>
                  <div className="mt-4 space-y-4">
                    {customer.phone && (
                      <div className="flex items-center">
                        <PhoneIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <a href={`tel:${customer.phone}`} className="text-gray-600 hover:text-primary">
                          {customer.phone}
                        </a>
                      </div>
                    )}
                    {customer.email && (
                      <div className="flex items-center">
                        <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <a href={`mailto:${customer.email}`} className="text-gray-600 hover:text-primary">
                          {customer.email}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center">
                      <MapPinIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(customer.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-primary"
                      >
                        {customer.address}
                      </a>
                    </div>
                  </div>
                  {customer.notes && (
                    <div className="mt-6">
                      <h3 className="text-sm font-medium text-gray-900">Notes</h3>
                      <p className="mt-2 text-sm text-gray-600">{customer.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Map */}
              <div className="bg-white shadow sm:rounded-lg overflow-hidden">
                <div id="map" className="h-64 w-full"></div>
              </div>

              {/* Job History */}
              <div className="lg:col-span-2">
                <div className="bg-white shadow sm:rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h2 className="text-lg font-medium text-gray-900">Job History</h2>
                    {customer.jobs && customer.jobs.length > 0 ? (
                      <div className="mt-4 flow-root">
                        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                            <table className="min-w-full divide-y divide-gray-300">
                              <thead>
                                <tr>
                                  <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                                    Job
                                  </th>
                                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                    Status
                                  </th>
                                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                    Amount
                                  </th>
                                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                    Completed
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {customer.jobs.map((job) => (
                                  <tr
                                    key={job.id}
                                    className="hover:bg-gray-50 cursor-pointer"
                                    onClick={() => navigate(`/jobs/${job.id}`)}
                                  >
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900">
                                      {job.title}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                      {job.status}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                      ${job.total_amount.toLocaleString()}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                      {job.completed_at
                                        ? new Date(job.completed_at).toLocaleDateString()
                                        : '-'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-gray-500">No jobs found</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice History */}
            <div className="mt-8">
              <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg font-medium text-gray-900">Invoice History</h2>
                  <div className="mt-4">
                    <InvoiceHistory customerId={id} />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
} 