import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import type { DropResult } from 'react-beautiful-dnd';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { Customer, Service, Quote, QuoteService } from '../../lib/supabase';
import { supabase } from '../../lib/supabase';

interface QuoteFormProps {
  customer?: Customer;
  quote?: Quote & { quote_services: QuoteService[] };
  onSubmit: (quoteData: {
    customer_id: string;
    services: {
      service_name: string;
      price: number;
      quantity: number;
      notes?: string;
    }[];
    notes?: string;
    valid_until: string;
  }) => Promise<void>;
  isSubmitting: boolean;
}

interface DraggableQuoteService {
  id: string;
  service_name: string;
  price: number;
  quantity: number;
  notes: string;
}

export default function QuoteForm({ customer, quote, onSubmit, isSubmitting }: QuoteFormProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<DraggableQuoteService[]>(
    quote?.quote_services.map(service => ({
      id: service.id,
      service_name: service.service_name,
      price: service.price,
      quantity: service.quantity,
      notes: service.notes || '',
    })) || []
  );
  const [notes, setNotes] = useState(quote?.notes || '');
  const [validUntil, setValidUntil] = useState(
    quote?.valid_until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    if (result.source.droppableId === 'services' && result.destination.droppableId === 'selected') {
      const service = services[result.source.index];
      const newQuoteService: DraggableQuoteService = {
        id: `temp-${Date.now()}`,
        service_name: service.name,
        price: service.default_price,
        quantity: 1,
        notes: '',
      };
      setSelectedServices([...selectedServices, newQuoteService]);
    }
  };

  const updateServiceQuantity = (index: number, quantity: number) => {
    const newServices = [...selectedServices];
    newServices[index] = { ...newServices[index], quantity };
    setSelectedServices(newServices);
  };

  const updateServicePrice = (index: number, price: number) => {
    const newServices = [...selectedServices];
    newServices[index] = { ...newServices[index], price };
    setSelectedServices(newServices);
  };

  const updateServiceNotes = (index: number, notes: string) => {
    const newServices = [...selectedServices];
    newServices[index] = { ...newServices[index], notes };
    setSelectedServices(newServices);
  };

  const removeService = (index: number) => {
    const newServices = [...selectedServices];
    newServices.splice(index, 1);
    setSelectedServices(newServices);
  };

  const calculateTotal = () => {
    return selectedServices.reduce((sum, service) => sum + service.price * service.quantity, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedServices.length === 0) return;

    await onSubmit({
      customer_id: customer?.id || quote?.customer_id || '',
      services: selectedServices.map(({ service_name, price, quantity, notes }) => ({
        service_name,
        price,
        quantity,
        notes,
      })),
      notes,
      valid_until: validUntil,
    });
  };

  if (loading) {
    return <div className="animate-pulse">Loading services...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Available Services */}
          <div>
            <h3 className="text-lg font-medium text-gray-900">Available Services</h3>
            <Droppable droppableId="services">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="mt-4 bg-gray-50 p-4 rounded-lg min-h-[200px]"
                >
                  {services.map((service, index) => (
                    <Draggable key={service.id} draggableId={service.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="bg-white p-4 rounded-md shadow-sm mb-2 cursor-move hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium">{service.name}</h4>
                              <p className="text-sm text-gray-500">${service.default_price}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const newQuoteService: DraggableQuoteService = {
                                  id: `temp-${Date.now()}`,
                                  service_name: service.name,
                                  price: service.default_price,
                                  quantity: 1,
                                  notes: '',
                                };
                                setSelectedServices([...selectedServices, newQuoteService]);
                              }}
                              className="text-primary hover:text-primary/80"
                            >
                              <PlusIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>

          {/* Selected Services */}
          <div>
            <h3 className="text-lg font-medium text-gray-900">Quote Items</h3>
            <Droppable droppableId="selected">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="mt-4 space-y-4"
                >
                  {selectedServices.map((service, index) => (
                    <div key={service.id} className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="flex justify-between items-start">
                        <div className="flex-grow">
                          <h4 className="font-medium">{service.service_name}</h4>
                          <div className="mt-2 grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm text-gray-600">Price</label>
                              <input
                                type="number"
                                value={service.price}
                                onChange={(e) => updateServicePrice(index, Number(e.target.value))}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-600">Quantity</label>
                              <input
                                type="number"
                                value={service.quantity}
                                onChange={(e) => updateServiceQuantity(index, Number(e.target.value))}
                                min="1"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                              />
                            </div>
                          </div>
                          <div className="mt-2">
                            <label className="block text-sm text-gray-600">Notes</label>
                            <input
                              type="text"
                              value={service.notes}
                              onChange={(e) => updateServiceNotes(index, e.target.value)}
                              placeholder="Optional notes..."
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeService(index)}
                          className="ml-4 text-gray-400 hover:text-red-500"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>

            {/* Quote Total */}
            <div className="mt-6 bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center text-lg font-medium">
                <span>Total:</span>
                <span>${calculateTotal().toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quote Details */}
        <div className="space-y-4">
          <div>
            <label htmlFor="validUntil" className="block text-sm font-medium text-gray-700">
              Valid Until
            </label>
            <input
              type="date"
              id="validUntil"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes or terms..."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || selectedServices.length === 0}
            className="inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : quote ? 'Update Quote' : 'Create Quote'}
          </button>
        </div>
      </DragDropContext>
    </form>
  );
} 