const admin = require('firebase-admin');
require('dotenv').config({ path: './config.env' });

class FirestoreRepository {
  constructor() {
    this.initializeFirebase();
    this.db = admin.firestore();
  }

  // Initialize Firebase Admin SDK
  initializeFirebase() {
    if (admin.apps.length === 0) {
      // Initialize with service account key or default credentials
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID
        });
      } else {
        // Use default credentials (for local development with gcloud auth)
        admin.initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID || 'sitescout-dev'
        });
      }
    }
  }

  // Initialize collections and indexes
  async initialize() {
    try {
      // Firestore doesn't require explicit table creation
      // But we can create some initial documents to set up the structure
      console.log('✅ Firestore initialized');
    } catch (error) {
      console.error('❌ Error initializing Firestore:', error.message);
      throw error;
    }
  }

  // Save businesses to Firestore
  async saveBusinesses(businesses) {
    if (!businesses || businesses.length === 0) return [];

    const batch = this.db.batch();
    const savedBusinesses = [];

    try {
      for (const business of businesses) {
        const businessData = {
          googlePlaceId: business.google_place_id || business.place_id,
          name: business.name,
          category: business.category,
          address: business.address,
          phone: business.phone,
          website: business.website,
          rating: business.rating,
          reviewsCount: business.reviews_count || 0,
          latitude: business.location?.lat || business.latitude,
          longitude: business.location?.lng || business.longitude,
          hasWebsite: business.has_website || false,
          websiteUrl: business.website_url || business.website,
          detectionMethod: business.detection_method || 'unknown',
          confidenceScore: business.confidence_score || 0.0,
          websiteAge: business.website_age,
          isOutdated: business.is_outdated || false,
          presenceScore: business.presence_score?.score || 0.0,
          source: business.source || 'google_places',
          duplicateCount: business.duplicate_count || 1,
          duplicateSources: business.duplicate_sources || [],
          geocoded: business.geocoded || false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastVerified: business.last_verified ? admin.firestore.Timestamp.fromDate(new Date(business.last_verified)) : null
        };

        // Use google_place_id as document ID for easy updates
        const docRef = this.db.collection('businesses').doc(businessData.googlePlaceId);
        batch.set(docRef, businessData, { merge: true });
        savedBusinesses.push({ id: businessData.googlePlaceId, ...businessData });
      }

      await batch.commit();
      console.log(`💾 Saved ${savedBusinesses.length} businesses to Firestore`);
      return savedBusinesses;

    } catch (error) {
      console.error('❌ Error saving businesses to Firestore:', error.message);
      throw error;
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

    try {
      let query = this.db.collection('businesses')
        .where('hasWebsite', '==', false);

      if (city) {
        query = query.where('address', '>=', city)
                    .where('address', '<=', city + '\uf8ff');
      }

      if (category) {
        query = query.where('category', '==', category);
      }

      if (categories && categories.length > 0) {
        query = query.where('category', 'in', categories);
      }

      if (minRating > 0) {
        query = query.where('rating', '>=', minRating);
      }

      query = query.orderBy('presenceScore', 'desc')
                   .orderBy('rating', 'desc')
                   .orderBy('createdAt', 'desc')
                   .limit(limit);

      if (offset > 0) {
        // For pagination, we'd need to implement cursor-based pagination
        // This is a simplified version
        const snapshot = await query.get();
        const docs = snapshot.docs.slice(offset, offset + limit);
        return docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } else {
        const snapshot = await query.get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }

    } catch (error) {
      console.error('❌ Error getting businesses without websites:', error.message);
      throw error;
    }
  }

  // Get business by ID
  async getBusinessById(id) {
    try {
      const doc = await this.db.collection('businesses').doc(id).get();
      if (doc.exists) {
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting business by ID:', error.message);
      throw error;
    }
  }

  // Get business by Google Place ID
  async getBusinessByGooglePlaceId(googlePlaceId) {
    try {
      const doc = await this.db.collection('businesses').doc(googlePlaceId).get();
      if (doc.exists) {
        return { id: doc.id, ...doc.data() };
      }
      return null;
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
      const searchHistoryData = {
        userId: userId || null,
        location,
        city,
        state,
        categories: categories || [],
        radius,
        minRating,
        resultsCount,
        businessesWithoutWebsites,
        searchDurationMs,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await this.db.collection('searchHistory').add(searchHistoryData);
      return { id: docRef.id, ...searchHistoryData };
    } catch (error) {
      console.error('❌ Error saving search history:', error.message);
      throw error;
    }
  }

  // Get search history for a user
  async getSearchHistory(userId, limit = 20, offset = 0) {
    try {
      let query = this.db.collection('searchHistory')
        .orderBy('createdAt', 'desc')
        .limit(limit);

      if (userId) {
        query = query.where('userId', '==', userId);
      }

      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

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
      const exportRecord = {
        userId: userId || null,
        exportType,
        businessIds: businessIds || [],
        googlePlaceIds: googlePlaceIds || [],
        fileName,
        fileSize,
        downloadCount: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await this.db.collection('businessExports').add(exportRecord);
      return { id: docRef.id, ...exportRecord };
    } catch (error) {
      console.error('❌ Error saving business export:', error.message);
      throw error;
    }
  }

  // Get business statistics
  async getBusinessStatistics(filters = {}) {
    try {
      let query = this.db.collection('businesses');

      // Apply filters
      if (filters.city) {
        query = query.where('address', '>=', filters.city)
                    .where('address', '<=', filters.city + '\uf8ff');
      }

      if (filters.category) {
        query = query.where('category', '==', filters.category);
      }

      const snapshot = await query.get();
      const businesses = snapshot.docs.map(doc => doc.data());

      const stats = {
        totalBusinesses: businesses.length,
        withWebsites: businesses.filter(b => b.hasWebsite).length,
        withoutWebsites: businesses.filter(b => !b.hasWebsite).length,
        avgPresenceScore: businesses.reduce((sum, b) => sum + (b.presenceScore || 0), 0) / businesses.length || 0,
        avgRating: businesses.reduce((sum, b) => sum + (b.rating || 0), 0) / businesses.length || 0,
        addedToday: businesses.filter(b => {
          const today = new Date();
          const createdAt = b.createdAt?.toDate();
          return createdAt && createdAt.toDateString() === today.toDateString();
        }).length,
        updatedToday: businesses.filter(b => {
          const today = new Date();
          const updatedAt = b.updatedAt?.toDate();
          return updatedAt && updatedAt.toDateString() === today.toDateString();
        }).length
      };

      return stats;
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
      const updateData = {
        hasWebsite,
        websiteUrl,
        detectionMethod,
        confidenceScore,
        websiteAge,
        isOutdated,
        presenceScore,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastVerified: admin.firestore.FieldValue.serverTimestamp()
      };

      await this.db.collection('businesses').doc(googlePlaceId).update(updateData);
      
      const doc = await this.db.collection('businesses').doc(googlePlaceId).get();
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('❌ Error updating business verification:', error.message);
      throw error;
    }
  }

  // Batch update businesses
  async batchUpdateBusinesses(updates) {
    const batch = this.db.batch();

    try {
      for (const update of updates) {
        const { googlePlaceId, data } = update;
        const docRef = this.db.collection('businesses').doc(googlePlaceId);
        batch.update(docRef, {
          ...data,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      await batch.commit();
      console.log(`✅ Batch updated ${updates.length} businesses`);
    } catch (error) {
      console.error('❌ Error batch updating businesses:', error.message);
      throw error;
    }
  }

  // Search businesses with text search
  async searchBusinesses(searchTerm, filters = {}) {
    try {
      // Firestore doesn't have full-text search, so we'll do a simple name search
      let query = this.db.collection('businesses')
        .where('name', '>=', searchTerm)
        .where('name', '<=', searchTerm + '\uf8ff');

      if (filters.hasWebsite !== undefined) {
        query = query.where('hasWebsite', '==', filters.hasWebsite);
      }

      if (filters.category) {
        query = query.where('category', '==', filters.category);
      }

      const snapshot = await query.limit(50).get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    } catch (error) {
      console.error('❌ Error searching businesses:', error.message);
      throw error;
    }
  }

  // Close Firestore connection
  async close() {
    // Firestore doesn't require explicit connection closing
    console.log('📊 Firestore connection closed');
  }
}

module.exports = FirestoreRepository;


