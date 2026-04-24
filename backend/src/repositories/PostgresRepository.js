const { Pool } = require('pg');
require('dotenv').config({ path: './config.env' });

class PostgresRepository {
  constructor() {
    this.pool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'sitescout',
      password: process.env.DB_PASSWORD || 'password',
      port: process.env.DB_PORT || 5432,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('connect', () => {
      console.log('📊 Connected to PostgreSQL database');
    });

    this.pool.on('error', (err) => {
      console.error('❌ Unexpected error on idle client', err);
    });
  }

  // Initialize database tables
  async initialize() {
    try {
      await this.createTables();
      console.log('✅ Database tables initialized');
    } catch (error) {
      console.error('❌ Error initializing database:', error.message);
      throw error;
    }
  }

  // Create database tables
  async createTables() {
    const createBusinessesTable = `
      CREATE TABLE IF NOT EXISTS businesses (
        id SERIAL PRIMARY KEY,
        google_place_id VARCHAR(255) UNIQUE,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        address TEXT,
        phone VARCHAR(50),
        website VARCHAR(500),
        rating DECIMAL(2,1),
        reviews_count INTEGER DEFAULT 0,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        has_website BOOLEAN DEFAULT FALSE,
        website_url VARCHAR(500),
        detection_method VARCHAR(100),
        confidence_score DECIMAL(3,2) DEFAULT 0.0,
        website_age VARCHAR(100),
        is_outdated BOOLEAN DEFAULT FALSE,
        presence_score DECIMAL(3,2) DEFAULT 0.0,
        source VARCHAR(100) DEFAULT 'google_places',
        duplicate_count INTEGER DEFAULT 1,
        duplicate_sources TEXT[],
        geocoded BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_verified TIMESTAMP
      )
    `;

    const createSearchHistoryTable = `
      CREATE TABLE IF NOT EXISTS search_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        location VARCHAR(255) NOT NULL,
        city VARCHAR(100),
        state VARCHAR(100),
        categories TEXT[],
        radius INTEGER DEFAULT 5000,
        min_rating DECIMAL(2,1) DEFAULT 0.0,
        results_count INTEGER DEFAULT 0,
        businesses_without_websites INTEGER DEFAULT 0,
        search_duration_ms INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createBusinessExportsTable = `
      CREATE TABLE IF NOT EXISTS business_exports (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        export_type VARCHAR(50) DEFAULT 'csv',
        business_ids INTEGER[],
        google_place_ids TEXT[],
        file_name VARCHAR(255),
        file_size INTEGER,
        download_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_businesses_google_place_id ON businesses(google_place_id);
      CREATE INDEX IF NOT EXISTS idx_businesses_has_website ON businesses(has_website);
      CREATE INDEX IF NOT EXISTS idx_businesses_category ON businesses(category);
      CREATE INDEX IF NOT EXISTS idx_businesses_location ON businesses(latitude, longitude);
      CREATE INDEX IF NOT EXISTS idx_businesses_created_at ON businesses(created_at);
      CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
      CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON search_history(created_at);
    `;

    await this.pool.query(createBusinessesTable);
    await this.pool.query(createSearchHistoryTable);
    await this.pool.query(createBusinessExportsTable);
    await this.pool.query(createIndexes);
  }

  // Save businesses to database
  async saveBusinesses(businesses) {
    if (!businesses || businesses.length === 0) return [];

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      const savedBusinesses = [];
      
      for (const business of businesses) {
        const insertQuery = `
          INSERT INTO businesses (
            google_place_id, name, category, address, phone, website,
            rating, reviews_count, latitude, longitude, has_website,
            website_url, detection_method, confidence_score, website_age,
            is_outdated, presence_score, source, duplicate_count,
            duplicate_sources, geocoded, last_verified
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
          ON CONFLICT (google_place_id) 
          DO UPDATE SET
            name = EXCLUDED.name,
            category = EXCLUDED.category,
            address = EXCLUDED.address,
            phone = EXCLUDED.phone,
            website = EXCLUDED.website,
            rating = EXCLUDED.rating,
            reviews_count = EXCLUDED.reviews_count,
            latitude = EXCLUDED.latitude,
            longitude = EXCLUDED.longitude,
            has_website = EXCLUDED.has_website,
            website_url = EXCLUDED.website_url,
            detection_method = EXCLUDED.detection_method,
            confidence_score = EXCLUDED.confidence_score,
            website_age = EXCLUDED.website_age,
            is_outdated = EXCLUDED.is_outdated,
            presence_score = EXCLUDED.presence_score,
            source = EXCLUDED.source,
            duplicate_count = EXCLUDED.duplicate_count,
            duplicate_sources = EXCLUDED.duplicate_sources,
            geocoded = EXCLUDED.geocoded,
            updated_at = CURRENT_TIMESTAMP,
            last_verified = EXCLUDED.last_verified
          RETURNING *
        `;

        const values = [
          business.google_place_id || business.place_id,
          business.name,
          business.category,
          business.address,
          business.phone,
          business.website,
          business.rating,
          business.reviews_count || 0,
          business.location?.lat || business.latitude,
          business.location?.lng || business.longitude,
          business.has_website || false,
          business.website_url || business.website,
          business.detection_method || 'unknown',
          business.confidence_score || 0.0,
          business.website_age,
          business.is_outdated || false,
          business.presence_score?.score || 0.0,
          business.source || 'google_places',
          business.duplicate_count || 1,
          business.duplicate_sources || [],
          business.geocoded || false,
          business.last_verified || new Date()
        ];

        const result = await client.query(insertQuery, values);
        savedBusinesses.push(result.rows[0]);
      }

      await client.query('COMMIT');
      console.log(`💾 Saved ${savedBusinesses.length} businesses to database`);
      return savedBusinesses;

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error saving businesses:', error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  // Get businesses without websites
  async getBusinessesWithoutWebsites(filters = {}) {
    const {
      city,
      state,
      category,
      categories,
      minRating = 0,
      limit = 100,
      offset = 0
    } = filters;

    let whereConditions = ['has_website = FALSE'];
    let queryParams = [];
    let paramCount = 0;

    if (city) {
      paramCount++;
      whereConditions.push(`LOWER(address) LIKE LOWER($${paramCount})`);
      queryParams.push(`%${city}%`);
    }

    if (state) {
      paramCount++;
      whereConditions.push(`LOWER(address) LIKE LOWER($${paramCount})`);
      queryParams.push(`%${state}%`);
    }

    if (category) {
      paramCount++;
      whereConditions.push(`category = $${paramCount}`);
      queryParams.push(category);
    }

    if (categories && categories.length > 0) {
      paramCount++;
      whereConditions.push(`category = ANY($${paramCount})`);
      queryParams.push(categories);
    }

    if (minRating > 0) {
      paramCount++;
      whereConditions.push(`rating >= $${paramCount}`);
      queryParams.push(minRating);
    }

    const query = `
      SELECT * FROM businesses 
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY presence_score DESC, rating DESC, created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(limit, offset);

    try {
      const result = await this.pool.query(query, queryParams);
      return result.rows;
    } catch (error) {
      console.error('❌ Error getting businesses without websites:', error.message);
      throw error;
    }
  }

  // Get business by ID
  async getBusinessById(id) {
    try {
      const result = await this.pool.query(
        'SELECT * FROM businesses WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Error getting business by ID:', error.message);
      throw error;
    }
  }

  // Get business by Google Place ID
  async getBusinessByGooglePlaceId(googlePlaceId) {
    try {
      const result = await this.pool.query(
        'SELECT * FROM businesses WHERE google_place_id = $1',
        [googlePlaceId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Error getting business by Google Place ID:', error.message);
      throw error;
    }
  }

  // Save search history
  async saveSearchHistory(searchData) {
    const {
      userId,
      location,
      city,
      state,
      categories,
      radius,
      minRating,
      resultsCount,
      businessesWithoutWebsites,
      searchDurationMs
    } = searchData;

    try {
      const result = await this.pool.query(
        `INSERT INTO search_history (
          user_id, location, city, state, categories, radius, min_rating,
          results_count, businesses_without_websites, search_duration_ms
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          userId,
          location,
          city,
          state,
          categories,
          radius,
          minRating,
          resultsCount,
          businessesWithoutWebsites,
          searchDurationMs
        ]
      );
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error saving search history:', error.message);
      throw error;
    }
  }

  // Get search history for a user
  async getSearchHistory(userId, limit = 20, offset = 0) {
    try {
      const result = await this.pool.query(
        `SELECT * FROM search_history 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );
      return result.rows;
    } catch (error) {
      console.error('❌ Error getting search history:', error.message);
      throw error;
    }
  }

  // Save business export
  async saveBusinessExport(exportData) {
    const {
      userId,
      exportType,
      businessIds,
      googlePlaceIds,
      fileName,
      fileSize
    } = exportData;

    try {
      const result = await this.pool.query(
        `INSERT INTO business_exports (
          user_id, export_type, business_ids, google_place_ids, file_name, file_size
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [userId, exportType, businessIds, googlePlaceIds, fileName, fileSize]
      );
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error saving business export:', error.message);
      throw error;
    }
  }

  // Get business statistics
  async getBusinessStatistics(filters = {}) {
    const { city, state, category } = filters;
    
    let whereConditions = [];
    let queryParams = [];
    let paramCount = 0;

    if (city) {
      paramCount++;
      whereConditions.push(`LOWER(address) LIKE LOWER($${paramCount})`);
      queryParams.push(`%${city}%`);
    }

    if (state) {
      paramCount++;
      whereConditions.push(`LOWER(address) LIKE LOWER($${paramCount})`);
      queryParams.push(`%${state}%`);
    }

    if (category) {
      paramCount++;
      whereConditions.push(`category = $${paramCount}`);
      queryParams.push(category);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    try {
      const result = await this.pool.query(`
        SELECT 
          COUNT(*) as total_businesses,
          COUNT(CASE WHEN has_website = TRUE THEN 1 END) as with_websites,
          COUNT(CASE WHEN has_website = FALSE THEN 1 END) as without_websites,
          AVG(presence_score) as avg_presence_score,
          AVG(rating) as avg_rating,
          COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as added_today,
          COUNT(CASE WHEN updated_at >= CURRENT_DATE THEN 1 END) as updated_today
        FROM businesses 
        ${whereClause}
      `, queryParams);

      return result.rows[0];
    } catch (error) {
      console.error('❌ Error getting business statistics:', error.message);
      throw error;
    }
  }

  // Update business verification status
  async updateBusinessVerification(googlePlaceId, verificationData) {
    const {
      hasWebsite,
      websiteUrl,
      detectionMethod,
      confidenceScore,
      websiteAge,
      isOutdated,
      presenceScore
    } = verificationData;

    try {
      const result = await this.pool.query(
        `UPDATE businesses SET
          has_website = $1,
          website_url = $2,
          detection_method = $3,
          confidence_score = $4,
          website_age = $5,
          is_outdated = $6,
          presence_score = $7,
          updated_at = CURRENT_TIMESTAMP,
          last_verified = CURRENT_TIMESTAMP
        WHERE google_place_id = $8
        RETURNING *`,
        [
          hasWebsite,
          websiteUrl,
          detectionMethod,
          confidenceScore,
          websiteAge,
          isOutdated,
          presenceScore,
          googlePlaceId
        ]
      );
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error updating business verification:', error.message);
      throw error;
    }
  }

  // Close database connection
  async close() {
    await this.pool.end();
    console.log('📊 Database connection closed');
  }
}

module.exports = PostgresRepository;


