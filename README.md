# BusinessBuddy.online

A freemium SaaS platform for people starting service-based side hustles. Perfect for house cleaning, yard work, handyman services, and laundry businesses.

## Core Mission

This platform generates revenue to support the fight against child sex trafficking. Every dollar earned goes toward this critical mission, making this project about much more than just software - it's about creating sustainable funding for protecting children.

## Features

- 🧑‍💼 Simple Customer Management
- 📝 Professional Quote Creation
- 📅 Job Scheduling
- 💰 Easy Invoicing & Payments
- 📱 Mobile-First Design
- 🎯 Elementary School Simple UX

## Tech Stack

- Frontend: React 18 + TypeScript + Vite
- Styling: Tailwind CSS
- Database: Supabase (PostgreSQL)
- Authentication: Supabase Auth
- Payments: Stripe
- Maps: Google Maps API
- Hosting: Netlify

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/businessbuddy.git
   cd businessbuddy
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_test_key
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   VITE_APP_URL=http://localhost:5173
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Database Setup

1. Create a new Supabase project
2. Run the following SQL to set up the database schema:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  business_name TEXT,
  service_types TEXT[],
  phone TEXT,
  subscription_tier TEXT DEFAULT 'free',
  customer_limit INTEGER DEFAULT 10,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create customers table
CREATE TABLE customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create services table
CREATE TABLE services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  default_price DECIMAL(10,2),
  description TEXT,
  is_custom BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create quotes table
CREATE TABLE quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('draft', 'sent', 'approved', 'rejected', 'expired')) DEFAULT 'draft',
  total_amount DECIMAL(10,2),
  valid_until TIMESTAMP,
  notes TEXT,
  customer_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  sent_at TIMESTAMP,
  approved_at TIMESTAMP,
  rejected_at TIMESTAMP
);

-- Create quote services table
CREATE TABLE quote_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create jobs table (modified to link with quotes)
CREATE TABLE jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES quotes(id),
  status TEXT CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'paid')),
  total_amount DECIMAL(10,2),
  scheduled_date TIMESTAMP,
  completed_date TIMESTAMP,
  payment_status TEXT CHECK (payment_status IN ('unpaid', 'partial', 'paid')) DEFAULT 'unpaid',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create job services table
CREATE TABLE job_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Set up RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_services ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users manage own profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users manage own customers" ON customers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own services" ON services FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own quotes" ON quotes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own quote_services" ON quote_services FOR ALL USING (auth.uid() = (SELECT user_id FROM quotes WHERE quotes.id = quote_id));
CREATE POLICY "Users manage own jobs" ON jobs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own job_services" ON job_services FOR ALL USING (auth.uid() = (SELECT user_id FROM jobs WHERE jobs.id = job_id));
```

## Development

### Code Style

- Follow the TypeScript + ESLint configuration
- Use Prettier for code formatting
- Follow React best practices and hooks guidelines

### Git Workflow

1. Create feature branches from `main`
2. Use conventional commits
3. Create pull requests for review
4. Squash and merge to main

### Testing

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e
```

## Deployment

The app is automatically deployed to Netlify when changes are pushed to the `main` branch.

### Manual Deployment

```bash
# Build the app
npm run build

# Deploy to Netlify
netlify deploy --prod
```

## Business Model

### Free Tier - "Starter"
- Up to 10 customers
- Basic job tracking and scheduling
- Simple invoicing with payment links
- Core business workflow
- "Powered by BusinessBuddy" branding

### Paid Tier - "Professional" ($19/month)
- Unlimited customers
- Remove BusinessBuddy branding
- Priority customer support
- Advanced reporting features
- Customer payment portal (future)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.

## Support

For support, email support@businessbuddy.online or join our Slack community.
