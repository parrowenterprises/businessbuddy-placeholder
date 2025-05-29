import { useParams } from 'react-router-dom';
import InvoiceHistory from '../components/invoices/InvoiceHistory';

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  
  if (!id) {
    return <div>Customer not found</div>;
  }

  return (
    <div>
      <InvoiceHistory customerId={id} />
    </div>
  );
} 