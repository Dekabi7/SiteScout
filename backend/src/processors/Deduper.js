class Deduper {
  constructor() {
    this.similarityThreshold = 0.85; // Jaro-Winkler similarity threshold
    this.nameWeight = 0.4;
    this.addressWeight = 0.3;
    this.phoneWeight = 0.2;
    this.locationWeight = 0.1;
  }

  // Remove duplicates from a list of businesses
  dedupe(businesses) {
    const canonicalBusinesses = [];
    const processed = new Set();
    
    console.log(`🔍 Starting deduplication of ${businesses.length} businesses...`);
    
    for (let i = 0; i < businesses.length; i++) {
      if (processed.has(i)) continue;
      
      const current = businesses[i];
      const duplicates = [current];
      
      // Find all duplicates of the current business
      for (let j = i + 1; j < businesses.length; j++) {
        if (processed.has(j)) continue;
        
        const candidate = businesses[j];
        const similarity = this.calculateSimilarity(current, candidate);
        
        if (similarity >= this.similarityThreshold) {
          duplicates.push(candidate);
          processed.add(j);
        }
      }
      
      // Create canonical business from duplicates
      const canonical = this.createCanonicalBusiness(duplicates);
      canonicalBusinesses.push(canonical);
      processed.add(i);
      
      if (duplicates.length > 1) {
        console.log(`🔄 Merged ${duplicates.length} duplicates: ${canonical.name}`);
      }
    }
    
    console.log(`✅ Deduplication complete: ${canonicalBusinesses.length} unique businesses`);
    return canonicalBusinesses;
  }

  // Calculate similarity between two businesses using Jaro-Winkler
  calculateSimilarity(business1, business2) {
    const nameSim = this.jaroWinklerSimilarity(
      this.normalizeForComparison(business1.name),
      this.normalizeForComparison(business2.name)
    );
    
    const addressSim = this.jaroWinklerSimilarity(
      this.normalizeForComparison(business1.address),
      this.normalizeForComparison(business2.address)
    );
    
    const phoneSim = this.phoneSimilarity(business1.phone, business2.phone);
    const locationSim = this.locationSimilarity(business1.location, business2.location);
    
    // Weighted similarity score
    const weightedScore = 
      (nameSim * this.nameWeight) +
      (addressSim * this.addressWeight) +
      (phoneSim * this.phoneWeight) +
      (locationSim * this.locationWeight);
    
    return weightedScore;
  }

  // Jaro-Winkler similarity algorithm
  jaroWinklerSimilarity(s1, s2) {
    if (s1 === s2) return 1.0;
    if (!s1 || !s2) return 0.0;
    
    const len1 = s1.length;
    const len2 = s2.length;
    
    if (len1 === 0 || len2 === 0) return 0.0;
    
    const matchWindow = Math.floor(Math.max(len1, len2) / 2) - 1;
    if (matchWindow < 0) return 0.0;
    
    const s1Matches = new Array(len1).fill(false);
    const s2Matches = new Array(len2).fill(false);
    
    let matches = 0;
    let transpositions = 0;
    
    // Find matches
    for (let i = 0; i < len1; i++) {
      const start = Math.max(0, i - matchWindow);
      const end = Math.min(i + matchWindow + 1, len2);
      
      for (let j = start; j < end; j++) {
        if (s2Matches[j] || s1[i] !== s2[j]) continue;
        s1Matches[i] = true;
        s2Matches[j] = true;
        matches++;
        break;
      }
    }
    
    if (matches === 0) return 0.0;
    
    // Count transpositions
    let k = 0;
    for (let i = 0; i < len1; i++) {
      if (!s1Matches[i]) continue;
      while (!s2Matches[k]) k++;
      if (s1[i] !== s2[k]) transpositions++;
      k++;
    }
    
    const jaro = (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;
    
    // Winkler modification
    let prefix = 0;
    for (let i = 0; i < Math.min(len1, len2, 4); i++) {
      if (s1[i] === s2[i]) prefix++;
      else break;
    }
    
    return jaro + (0.1 * prefix * (1 - jaro));
  }

  // Normalize string for comparison
  normalizeForComparison(str) {
    if (!str) return '';
    
    return str
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  // Calculate phone similarity
  phoneSimilarity(phone1, phone2) {
    if (!phone1 || !phone2) return 0.0;
    if (phone1 === phone2) return 1.0;
    
    // Extract digits only
    const digits1 = phone1.replace(/\D/g, '');
    const digits2 = phone2.replace(/\D/g, '');
    
    if (digits1 === digits2) return 1.0;
    
    // Check if one is a subset of the other (e.g., one has country code)
    if (digits1.length > digits2.length) {
      return digits1.endsWith(digits2) ? 0.8 : 0.0;
    } else if (digits2.length > digits1.length) {
      return digits2.endsWith(digits1) ? 0.8 : 0.0;
    }
    
    // Use Jaro-Winkler for partial matches
    return this.jaroWinklerSimilarity(digits1, digits2);
  }

  // Calculate location similarity
  locationSimilarity(loc1, loc2) {
    if (!loc1 || !loc2) return 0.0;
    if (!loc1.lat || !loc1.lng || !loc2.lat || !loc2.lng) return 0.0;
    
    // Calculate distance in kilometers
    const distance = this.calculateDistance(loc1.lat, loc1.lng, loc2.lat, loc2.lng);
    
    // Convert distance to similarity (closer = more similar)
    if (distance < 0.1) return 1.0; // Same location
    if (distance < 0.5) return 0.9; // Very close
    if (distance < 1.0) return 0.7; // Close
    if (distance < 2.0) return 0.5; // Moderate
    if (distance < 5.0) return 0.3; // Far
    return 0.0; // Too far
  }

  // Calculate distance between two points using Haversine formula
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Convert degrees to radians
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Create canonical business from duplicates
  createCanonicalBusiness(duplicates) {
    if (duplicates.length === 1) return duplicates[0];
    
    // Sort by data quality (more complete data first)
    const sorted = duplicates.sort((a, b) => {
      const scoreA = this.calculateDataQuality(a);
      const scoreB = this.calculateDataQuality(b);
      return scoreB - scoreA;
    });
    
    const canonical = { ...sorted[0] };
    
    // Merge data from all duplicates
    canonical.duplicate_count = duplicates.length;
    canonical.duplicate_sources = duplicates.map(d => d.source || 'unknown');
    
    // Use the best data from each field
    for (const duplicate of duplicates) {
      if (duplicate.website && !canonical.website) {
        canonical.website = duplicate.website;
      }
      if (duplicate.phone && !canonical.phone) {
        canonical.phone = duplicate.phone;
      }
      if (duplicate.rating && (!canonical.rating || duplicate.rating > canonical.rating)) {
        canonical.rating = duplicate.rating;
      }
      if (duplicate.reviews_count && (!canonical.reviews_count || duplicate.reviews_count > canonical.reviews_count)) {
        canonical.reviews_count = duplicate.reviews_count;
      }
    }
    
    return canonical;
  }

  // Calculate data quality score
  calculateDataQuality(business) {
    let score = 0;
    
    if (business.name) score += 1;
    if (business.address) score += 1;
    if (business.phone) score += 1;
    if (business.website) score += 1;
    if (business.rating) score += 1;
    if (business.location) score += 1;
    
    return score;
  }
}

module.exports = Deduper;


