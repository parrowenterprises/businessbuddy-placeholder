import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Service {
  id: string;
  name: string;
  default_price: number;
  description: string;
  is_custom: boolean;
}

type ServiceType = 'cleaning' | 'yard_work' | 'handyman' | 'laundry';

const defaultServices: Record<ServiceType, Array<Omit<Service, 'id' | 'is_custom'>>> = {
  cleaning: [
    { name: 'Regular House Cleaning', default_price: 100, description: 'Standard cleaning service for homes' },
    { name: 'Deep Cleaning', default_price: 175, description: 'Thorough deep cleaning service' },
    { name: 'Move In/Out Cleaning', default_price: 250, description: 'Complete cleaning for moving' },
    { name: 'Window Cleaning', default_price: 75, description: 'Interior and exterior window cleaning' },
  ],
  yard_work: [
    { name: 'Lawn Mowing', default_price: 45, description: 'Regular lawn maintenance' },
    { name: 'Hedge Trimming', default_price: 60, description: 'Shaping and trimming hedges' },
    { name: 'Leaf Cleanup', default_price: 75, description: 'Removal of fallen leaves' },
    { name: 'Garden Maintenance', default_price: 60, description: 'General garden upkeep' },
  ],
  handyman: [
    { name: 'Basic Repairs', default_price: 75, description: 'Minor home repairs' },
    { name: 'Painting', default_price: 350, description: 'Interior/exterior painting' },
    { name: 'Minor Plumbing', default_price: 100, description: 'Basic plumbing fixes' },
    { name: 'Furniture Assembly', default_price: 60, description: 'Assembly of furniture items' },
  ],
  laundry: [
    { name: 'Wash & Fold', default_price: 20, description: 'Per load of laundry' },
    { name: 'Pickup & Delivery', default_price: 25, description: 'Laundry pickup service' },
    { name: 'Dry Cleaning', default_price: 20, description: 'Per garment' },
    { name: 'Ironing Service', default_price: 20, description: 'Per item' },
  ],
};

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [newService, setNewService] = useState({
    name: '',
    default_price: 0,
    description: '',
  });

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userServices, error } = await supabase
        .from('services')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;

      setServices(userServices || []);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddService(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('services')
        .insert([
          {
            user_id: user.id,
            name: newService.name,
            default_price: newService.default_price,
            description: newService.description,
            is_custom: true,
          },
        ]);

      if (error) throw error;

      setNewService({ name: '', default_price: 0, description: '' });
      loadServices();
    } catch (error) {
      console.error('Error adding service:', error);
    }
  }

  async function handleUpdateService(e: React.FormEvent) {
    e.preventDefault();
    if (!editingService) return;

    try {
      const { error } = await supabase
        .from('services')
        .update({
          name: editingService.name,
          default_price: editingService.default_price,
          description: editingService.description,
        })
        .eq('id', editingService.id);

      if (error) throw error;

      setEditingService(null);
      loadServices();
    } catch (error) {
      console.error('Error updating service:', error);
    }
  }

  async function handleDeleteService(id: string) {
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;

      loadServices();
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  }

  async function handlePopulateDefaultServices() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('service_types')
        .eq('id', user.id)
        .single();

      if (!profile?.service_types?.length) return;

      const servicesToAdd = profile.service_types.flatMap((type: ServiceType) => 
        defaultServices[type].map(service => ({
          user_id: user.id,
          ...service,
          is_custom: false,
        }))
      );

      const { error } = await supabase
        .from('services')
        .insert(servicesToAdd);

      if (error) throw error;

      loadServices();
    } catch (error) {
      console.error('Error populating default services:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Services</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your service catalog and pricing
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          {services.length === 0 && (
            <button
              onClick={handlePopulateDefaultServices}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:w-auto"
            >
              Add Default Services
            </button>
          )}
        </div>
      </div>

      {/* Service List */}
      <div className="mt-8 flex flex-col">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Service
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Price
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Description
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {services.map((service) => (
                    <tr key={service.id}>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                        {service.name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                        ${service.default_price}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        {service.description}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => setEditingService(service)}
                          className="text-primary hover:text-primary/90 mr-4"
                        >
                          Edit
                        </button>
                        {service.is_custom && (
                          <button
                            onClick={() => handleDeleteService(service.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add New Service Form */}
      <div className="mt-10">
        <h2 className="text-lg font-medium text-gray-900">Add Custom Service</h2>
        <form onSubmit={handleAddService} className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Service Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              required
              value={newService.name}
              onChange={(e) => setNewService({ ...newService, name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">
              Default Price
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                name="price"
                id="price"
                required
                min="0"
                step="0.01"
                value={newService.default_price}
                onChange={(e) => setNewService({ ...newService, default_price: parseFloat(e.target.value) })}
                className="mt-1 block w-full pl-7 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={newService.description}
              onChange={(e) => setNewService({ ...newService, description: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:text-sm"
            >
              Add Service
            </button>
          </div>
        </form>
      </div>

      {/* Edit Service Modal */}
      {editingService && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

            <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <form onSubmit={handleUpdateService}>
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Edit Service</h3>
                  <div className="mt-6 grid grid-cols-1 gap-y-6">
                    <div>
                      <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">
                        Service Name
                      </label>
                      <input
                        type="text"
                        id="edit-name"
                        required
                        value={editingService.name}
                        onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="edit-price" className="block text-sm font-medium text-gray-700">
                        Default Price
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                          type="number"
                          id="edit-price"
                          required
                          min="0"
                          step="0.01"
                          value={editingService.default_price}
                          onChange={(e) => setEditingService({ ...editingService, default_price: parseFloat(e.target.value) })}
                          className="mt-1 block w-full pl-7 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        id="edit-description"
                        rows={3}
                        value={editingService.description}
                        onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:col-start-2 sm:text-sm"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingService(null)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:col-start-1 sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 