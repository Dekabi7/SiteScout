-- Up Migration
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  subscription_status VARCHAR(50) DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS businesses (
  id SERIAL PRIMARY KEY,
  google_place_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  category VARCHAR(100),
  phone VARCHAR(50),
  website VARCHAR(255),
  rating DECIMAL(3, 2),
  reviews_count INTEGER,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  has_website BOOLEAN DEFAULT FALSE,
  website_url VARCHAR(255),
  data_source VARCHAR(50) DEFAULT 'google',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS saved_businesses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'new',
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, business_id)
);

CREATE TABLE IF NOT EXISTS search_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  location VARCHAR(255),
  category VARCHAR(100),
  results_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_businesses_google_place_id ON businesses(google_place_id);
CREATE INDEX IF NOT EXISTS idx_saved_businesses_user_id ON saved_businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);

-- Down Migration
DROP TABLE IF EXISTS search_history;
DROP TABLE IF EXISTS saved_businesses;
DROP TABLE IF EXISTS businesses;
DROP TABLE IF EXISTS users;
