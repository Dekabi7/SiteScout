const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all saved businesses for a user
router.get('/', async (req, res) => {
  try {
    // TODO: Get user ID from auth middleware
    const userId = 1; // Mock user ID for now

    const result = await db.query(
      `SELECT b.*, sb.notes, sb.status, sb.saved_at 
       FROM saved_businesses sb
       JOIN businesses b ON sb.business_id = b.id
       WHERE sb.user_id = $1
       ORDER BY sb.saved_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows,
      total: result.rowCount
    });
  } catch (error) {
    console.error('Error fetching saved businesses:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Save a business
router.post('/', async (req, res) => {
  const { business } = req.body;

  if (!business || !business.id) {
    return res.status(400).json({ error: 'Invalid business data' });
  }

  // TODO: Get user ID from auth middleware
  const userId = 1; // Mock user ID for now

  try {
    // 1. Insert or update business in 'businesses' table
    const businessResult = await db.query(
      `INSERT INTO businesses (
        google_place_id, name, category, address, phone, rating, reviews_count, website_url, has_website
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (google_place_id) DO UPDATE SET
        name = EXCLUDED.name,
        category = EXCLUDED.category,
        address = EXCLUDED.address,
        phone = EXCLUDED.phone,
        rating = EXCLUDED.rating,
        reviews_count = EXCLUDED.reviews_count,
        website_url = EXCLUDED.website_url,
        has_website = EXCLUDED.has_website
      RETURNING id`,
      [
        business.id, // google_place_id
        business.name,
        business.category,
        business.address,
        business.phone,
        business.rating,
        business.reviews_count,
        business.website_url,
        !!business.website_url // has_website
      ]
    );

    const businessId = businessResult.rows[0].id;

    // 2. Link to user in 'saved_businesses' table
    await db.query(
      `INSERT INTO saved_businesses (user_id, business_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, business_id) DO NOTHING`,
      [userId, businessId]
    );

    res.json({
      success: true,
      message: 'Business saved successfully'
    });
  } catch (error) {
    console.error('Error saving business:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Remove a saved business
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  // TODO: Get user ID from auth middleware
  const userId = 1; // Mock user ID for now

  try {
    // We need to find the internal business ID first, or assume the frontend sends the internal ID?
    // The frontend currently sends the google_place_id as 'id' in the saved list if we just return what we saved.
    // But the GET route returns 'id' from 'businesses' table which is the internal ID.
    // Let's assume the frontend sends the internal ID for deletion if it came from the GET list.
    // BUT, the Dashboard sends google_place_id for saving.
    // The Saved page uses the ID returned by GET.

    // Let's handle both cases or clarify.
    // For now, let's assume the ID passed here is the internal business ID (from the saved page).

    await db.query(
      `DELETE FROM saved_businesses WHERE user_id = $1 AND business_id = $2`,
      [userId, id]
    );

    res.json({
      success: true,
      message: 'Business removed from saved list'
    });
  } catch (error) {
    console.error('Error removing business:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
