# BusinessBuddy.online

A freemium SaaS platform for service-based side hustles. Perfect for busy people managing house cleaning, yard work, handyman, or laundry services.

## Mission

Every dollar earned through BusinessBuddy.online supports the fight against child sex trafficking. We're building more than software - we're creating sustainable funding to protect children.

## Features

### Free Tier
- Manage up to 10 customers
- Create professional quotes
- Schedule and track jobs
- Send invoices with payment links
- Core business workflow
- "Powered by BusinessBuddy" branding

### Professional Tier ($19/month)
- Unlimited customers
- Remove BusinessBuddy branding
- Priority customer support
- Advanced reporting features
- Customer payment portal (coming soon)

## Tech Stack

- Frontend: React 18 + TypeScript + Vite
- Styling: Tailwind CSS
- Database: Supabase (PostgreSQL)
- Authentication: Supabase Auth
- Payments: Stripe
- Maps: Google Maps API
- Hosting: Netlify

## Development

### Prerequisites

- Node.js 18+
- npm 9+
- Supabase account
- Stripe account
- Google Maps API key

### Environment Setup

1. Clone the repository
2. Copy `.env.example` to `.env`
3. Fill in your environment variables:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   VITE_APP_URL=http://localhost:5173
   ```

### Installation

```bash
npm install
npm run dev
```

### Build

```bash
npm run build
```

### Deploy

```bash
# Deployments are automated via Netlify
git push origin main
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Proprietary - All Rights Reserved

## Support

For support, email support@businessbuddy.online
