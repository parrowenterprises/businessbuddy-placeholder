import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import MainLayout from '../../components/layout/MainLayout';
import CustomerForm from '../../components/customers/CustomerForm';
import UpgradeModal from '../../components/customers/UpgradeModal';
import toast from 'react-hot-toast';

export default function CustomerCreate() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    checkCustomerLimit();
  }, []);

  async function checkCustomerLimit() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's subscription tier
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', user.id)
        .single();

      if (profile?.subscription_tier === 'free') {
        // Check customer count
        const { count } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (count && count >= 10) {
          setShowUpgradeModal(true);
        }
      }
    } catch (error) {
      console.error('Error checking customer limit:', error);
    }
  }

  const handleCreateCustomer = async (customerData: {
    name: string;
    email: string;
    phone: string;
    address: string;
    notes?: string;
  }) => {
    try {
      setIsSubmitting(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get coordinates from address
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(customerData.address)}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
      );
      const geocodeData = await response.json();
      
      let coordinates = null;
      if (geocodeData.results?.[0]?.geometry?.location) {
        coordinates = geocodeData.results[0].geometry.location;
      }

      const { data, error } = await supabase
        .from('customers')
        .insert([
          {
            user_id: user.id,
            ...customerData,
            ...(coordinates && {
              lat: coordinates.lat,
              lng: coordinates.lng,
            }),
            total_spent: 0,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      toast.success('Customer created successfully');
      navigate(`/customers/${data.id}`);
    } catch (error) {
      console.error('Error creating customer:', error);
      toast.error('Failed to create customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Add New Customer</h1>
        </div>
        <div className="mt-6">
          <CustomerForm
            onSubmit={handleCreateCustomer}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>

      <UpgradeModal
        open={showUpgradeModal}
        onClose={() => navigate('/customers')}
      />
    </MainLayout>
  );
} 