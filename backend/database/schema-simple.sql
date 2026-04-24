-- Users table for authentication and plan management
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    google_id VARCHAR(255),
    plan_type VARCHAR(20) DEFAULT 'starter' CHECK (plan_type IN ('starter', 'pro', 'agency', 'founding')),
    
    -- Usage tracking
    daily_search_count INTEGER DEFAULT 0,
    daily_city_count INTEGER DEFAULT 0,
    monthly_export_count INTEGER DEFAULT 0,
    monthly_ai_email_count INTEGER DEFAULT 0,
    saved_leads_count INTEGER DEFAULT 0,
    
    -- Limits (set based on plan_type)
    daily_search_limit INTEGER DEFAULT 10,
    daily_city_limit INTEGER DEFAULT 1,
    monthly_export_limit INTEGER DEFAULT 0,
    bulk_export_size INTEGER DEFAULT 0,
    saved_leads_limit INTEGER DEFAULT 0,
    monthly_ai_email_limit INTEGER DEFAULT 0,
    ai_templates_limit INTEGER DEFAULT 0,
    team_members_limit INTEGER DEFAULT 1,
    
    -- Timestamps
    last_search_reset TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_export_reset TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Businesses table to store discovered businesses
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    address TEXT,
    phone VARCHAR(20),
    website VARCHAR(255),
    rating DECIMAL(3,2),
    reviews_count INTEGER,
    google_place_id VARCHAR(255) UNIQUE,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Website detection results
CREATE TABLE website_detections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    has_website BOOLEAN NOT NULL,
    detection_method VARCHAR(50), -- 'google_places', 'dns_check', 'serp_check'
    website_url VARCHAR(255),
    confidence_score DECIMAL(3,2),
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Search history for analytics
CREATE TABLE searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    location VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    radius INTEGER,
    min_rating DECIMAL(3,2),
    results_count INTEGER,
    search_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Export history for rate limiting
CREATE TABLE exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    search_id UUID REFERENCES searches(id),
    export_type VARCHAR(20) DEFAULT 'csv',
    records_count INTEGER,
    exported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_businesses_category ON businesses(category);
CREATE INDEX idx_businesses_rating ON businesses(rating);
CREATE INDEX idx_website_detections_has_website ON website_detections(has_website);
CREATE INDEX idx_searches_user_id ON searches(user_id);
CREATE INDEX idx_exports_user_id ON exports(user_id);
CREATE INDEX idx_exports_exported_at ON exports(exported_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();