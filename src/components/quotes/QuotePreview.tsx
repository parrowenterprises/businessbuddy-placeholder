import type { Quote, QuoteService, Customer, Profile } from '../../lib/supabase';
import QuoteStatusBadge from './QuoteStatusBadge';

interface QuotePreviewProps {
  quote: Quote & {
    quote_services: QuoteService[];
    customers: Pick<Customer, 'id' | 'name' | 'email' | 'phone' | 'address'>;
  };
  businessProfile: Profile;
  onApprove?: () => void;
  onReject?: () => void;
  isCustomerView?: boolean;
}

export default function QuotePreview({
  quote,
  businessProfile,
  onApprove,
  onReject,
  isCustomerView = false,
}: QuotePreviewProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateTotal = () => {
    return quote.quote_services.reduce(
      (sum, service) => sum + service.price * service.quantity,
      0
    );
  };

  return (
    <div className="bg-white">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 sm:py-24">
        <div className="max-w-xl">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                Quote #{quote.id.slice(0, 8)}
              </h1>
              <QuoteStatusBadge status={quote.status} />
            </div>
            <p className="text-sm text-gray-500">
              Created on {formatDate(quote.created_at)}
            </p>
            <p className="text-sm text-gray-500">
              Valid until {formatDate(quote.valid_until)}
            </p>
          </div>

          {/* Business Info */}
          <div className="mt-8">
            <h2 className="sr-only">Business Information</h2>
            <dl className="space-y-2">
              <div>
                <dt className="sr-only">Company name</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {businessProfile.business_name}
                </dd>
              </div>
              <div>
                <dt className="sr-only">Phone number</dt>
                <dd className="text-sm text-gray-500">{businessProfile.phone}</dd>
              </div>
            </dl>
          </div>

          {/* Customer Info */}
          <div className="mt-8 border-t border-gray-200 pt-8">
            <h2 className="sr-only">Customer Information</h2>
            <dl className="space-y-2">
              <div>
                <dt className="sr-only">Customer name</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {quote.customers.name}
                </dd>
              </div>
              <div>
                <dt className="sr-only">Email address</dt>
                <dd className="text-sm text-gray-500">{quote.customers.email}</dd>
              </div>
              <div>
                <dt className="sr-only">Address</dt>
                <dd className="text-sm text-gray-500">{quote.customers.address}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Services */}
        <div className="mt-16">
          <h2 className="sr-only">Services</h2>
          <table className="mt-4 w-full text-gray-500 sm:mt-6">
            <caption className="sr-only">Services</caption>
            <thead className="sr-only text-left text-sm text-gray-500 sm:not-sr-only">
              <tr>
                <th scope="col" className="py-3 pr-8 font-normal sm:w-2/5 sm:pr-16">
                  Service
                </th>
                <th
                  scope="col"
                  className="hidden w-1/5 py-3 pr-8 font-normal sm:table-cell"
                >
                  Quantity
                </th>
                <th
                  scope="col"
                  className="hidden w-1/5 py-3 pr-8 font-normal sm:table-cell"
                >
                  Price
                </th>
                <th scope="col" className="w-1/5 py-3 pr-8 font-normal">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 border-b border-gray-200 text-sm">
              {quote.quote_services.map((service) => (
                <tr key={service.id}>
                  <td className="py-6 pr-8">
                    <div className="flex flex-col">
                      <div className="font-medium text-gray-900">
                        {service.service_name}
                      </div>
                      {service.notes && (
                        <div className="mt-1 text-gray-500">{service.notes}</div>
                      )}
                    </div>
                  </td>
                  <td className="hidden py-6 pr-8 sm:table-cell">
                    {service.quantity}
                  </td>
                  <td className="hidden py-6 pr-8 sm:table-cell">
                    ${service.price.toLocaleString()}
                  </td>
                  <td className="py-6 pr-8 font-medium text-gray-900">
                    ${(service.price * service.quantity).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Total */}
          <div className="mt-8 flex justify-end">
            <div className="w-full max-w-md">
              <div className="flex items-center justify-between border-t border-gray-200 pt-8">
                <div className="text-base font-medium text-gray-900">Total</div>
                <div className="text-base font-medium text-gray-900">
                  ${calculateTotal().toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {quote.notes && (
          <div className="mt-16 border-t border-gray-200 pt-8">
            <h2 className="text-sm font-medium text-gray-900">Notes</h2>
            <div
              className="prose prose-sm mt-4 text-gray-500"
              dangerouslySetInnerHTML={{ __html: quote.notes }}
            />
          </div>
        )}

        {/* Actions */}
        {isCustomerView && quote.status === 'sent' && (
          <div className="mt-16 border-t border-gray-200 pt-8">
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onReject}
                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Reject Quote
              </button>
              <button
                type="button"
                onClick={onApprove}
                className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
              >
                Approve Quote
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 