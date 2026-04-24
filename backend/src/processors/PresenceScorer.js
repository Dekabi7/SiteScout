class PresenceScorer {
  constructor() {
    this.rules = {
      // Website presence rules
      hasWebsite: {
        weight: 0.4,
        conditions: [
          { field: 'website', operator: 'exists', score: 0.8 },
          { field: 'website', operator: 'not_empty', score: 0.9 },
          { field: 'website', operator: 'valid_format', score: 0.7 }
        ]
      },
      
      // Business completeness rules
      businessCompleteness: {
        weight: 0.3,
        conditions: [
          { field: 'name', operator: 'exists', score: 0.3 },
          { field: 'address', operator: 'exists', score: 0.3 },
          { field: 'phone', operator: 'exists', score: 0.2 },
          { field: 'rating', operator: 'exists', score: 0.1 },
          { field: 'reviews_count', operator: 'exists', score: 0.1 }
        ]
      },
      
      // Data quality rules
      dataQuality: {
        weight: 0.2,
        conditions: [
          { field: 'name', operator: 'length_greater_than', value: 3, score: 0.2 },
          { field: 'address', operator: 'length_greater_than', value: 10, score: 0.2 },
          { field: 'phone', operator: 'valid_format', score: 0.3 },
          { field: 'rating', operator: 'range', min: 1, max: 5, score: 0.2 },
          { field: 'reviews_count', operator: 'greater_than', value: 0, score: 0.1 }
        ]
      },
      
      // Location accuracy rules
      locationAccuracy: {
        weight: 0.1,
        conditions: [
          { field: 'location', operator: 'exists', score: 0.5 },
          { field: 'location', operator: 'valid_coordinates', score: 0.5 }
        ]
      }
    };
  }

  // Score a business for website presence
  scoreBusiness(business) {
    const scores = {
      hasWebsite: this.scoreField(business, 'hasWebsite'),
      businessCompleteness: this.scoreField(business, 'businessCompleteness'),
      dataQuality: this.scoreField(business, 'dataQuality'),
      locationAccuracy: this.scoreField(business, 'locationAccuracy')
    };

    // Calculate weighted total score
    let totalScore = 0;
    let totalWeight = 0;

    for (const [ruleName, rule] of Object.entries(this.rules)) {
      const score = scores[ruleName];
      totalScore += score * rule.weight;
      totalWeight += rule.weight;
    }

    const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;

    return {
      score: Math.round(finalScore * 100) / 100,
      hasWebsite: this.determineWebsitePresence(business),
      confidence: this.calculateConfidence(business, finalScore),
      breakdown: scores,
      recommendations: this.generateRecommendations(business, scores)
    };
  }

  // Score a specific field based on rules
  scoreField(business, ruleName) {
    const rule = this.rules[ruleName];
    if (!rule) return 0;

    let score = 0;
    let conditionCount = 0;

    for (const condition of rule.conditions) {
      const conditionScore = this.evaluateCondition(business, condition);
      score += conditionScore;
      conditionCount++;
    }

    return conditionCount > 0 ? score / conditionCount : 0;
  }

  // Evaluate a single condition
  evaluateCondition(business, condition) {
    const { field, operator, value, min, max, score } = condition;
    const fieldValue = this.getFieldValue(business, field);

    switch (operator) {
      case 'exists':
        return fieldValue !== null && fieldValue !== undefined ? score : 0;
      
      case 'not_empty':
        return fieldValue && fieldValue.toString().trim().length > 0 ? score : 0;
      
      case 'valid_format':
        return this.isValidFormat(field, fieldValue) ? score : 0;
      
      case 'length_greater_than':
        return fieldValue && fieldValue.toString().length > value ? score : 0;
      
      case 'range':
        return fieldValue >= min && fieldValue <= max ? score : 0;
      
      case 'greater_than':
        return fieldValue > value ? score : 0;
      
      case 'valid_coordinates':
        return this.isValidCoordinates(fieldValue) ? score : 0;
      
      default:
        return 0;
    }
  }

  // Get field value from business object
  getFieldValue(business, field) {
    const fieldMap = {
      'website': business.website || business.website_url,
      'name': business.name,
      'address': business.address,
      'phone': business.phone,
      'rating': business.rating,
      'reviews_count': business.reviews_count,
      'location': business.location
    };

    return fieldMap[field];
  }

  // Check if field has valid format
  isValidFormat(field, value) {
    if (!value) return false;

    switch (field) {
      case 'website':
        return this.isValidUrl(value);
      case 'phone':
        return this.isValidPhone(value);
      case 'email':
        return this.isValidEmail(value);
      default:
        return true;
    }
  }

  // Check if URL is valid
  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Check if phone is valid
  isValidPhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length >= 10 && phoneRegex.test(cleanPhone);
  }

  // Check if email is valid
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Check if coordinates are valid
  isValidCoordinates(location) {
    if (!location || !location.lat || !location.lng) return false;
    
    const lat = parseFloat(location.lat);
    const lng = parseFloat(location.lng);
    
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  // Determine if business has a website
  determineWebsitePresence(business) {
    const website = business.website || business.website_url;
    
    if (!website) return false;
    
    // Check if it's a valid URL
    if (!this.isValidUrl(website)) return false;
    
    // Check if it's not a third-party platform
    const thirdPartyDomains = [
      'yelp.com', 'facebook.com', 'instagram.com', 'twitter.com',
      'google.com', 'maps.google.com', 'foursquare.com'
    ];
    
    const urlLower = website.toLowerCase();
    for (const domain of thirdPartyDomains) {
      if (urlLower.includes(domain)) return false;
    }
    
    return true;
  }

  // Calculate confidence score
  calculateConfidence(business, score) {
    let confidence = score;
    
    // Boost confidence for complete data
    const completenessScore = this.scoreField(business, 'businessCompleteness');
    if (completenessScore > 0.8) {
      confidence += 0.1;
    }
    
    // Reduce confidence for incomplete data
    if (completenessScore < 0.3) {
      confidence -= 0.2;
    }
    
    // Boost confidence for high-quality data
    const qualityScore = this.scoreField(business, 'dataQuality');
    if (qualityScore > 0.8) {
      confidence += 0.1;
    }
    
    return Math.max(0, Math.min(1, confidence));
  }

  // Generate recommendations for improving the business data
  generateRecommendations(business, scores) {
    const recommendations = [];
    
    if (scores.businessCompleteness < 0.5) {
      recommendations.push('Add missing business information (name, address, phone)');
    }
    
    if (scores.dataQuality < 0.5) {
      recommendations.push('Improve data quality and formatting');
    }
    
    if (scores.locationAccuracy < 0.5) {
      recommendations.push('Add or verify location coordinates');
    }
    
    if (!this.determineWebsitePresence(business)) {
      recommendations.push('Create a business website to improve online presence');
    }
    
    return recommendations;
  }

  // Batch score multiple businesses
  scoreBatch(businesses) {
    return businesses.map(business => ({
      ...business,
      presenceScore: this.scoreBusiness(business)
    }));
  }

  // Get businesses without websites (our target audience)
  filterBusinessesWithoutWebsites(businesses) {
    return businesses.filter(business => {
      const score = this.scoreBusiness(business);
      return !score.hasWebsite;
    });
  }

  // Get businesses with low online presence scores
  filterLowPresenceBusinesses(businesses, threshold = 0.3) {
    return businesses.filter(business => {
      const score = this.scoreBusiness(business);
      return score.score < threshold;
    });
  }

  // Get statistics about the business dataset
  getDatasetStatistics(businesses) {
    const scores = businesses.map(business => this.scoreBusiness(business));
    
    const stats = {
      total: businesses.length,
      withWebsites: scores.filter(s => s.hasWebsite).length,
      withoutWebsites: scores.filter(s => !s.hasWebsite).length,
      averageScore: scores.reduce((sum, s) => sum + s.score, 0) / scores.length,
      averageConfidence: scores.reduce((sum, s) => sum + s.confidence, 0) / scores.length,
      scoreDistribution: {
        high: scores.filter(s => s.score >= 0.8).length,
        medium: scores.filter(s => s.score >= 0.5 && s.score < 0.8).length,
        low: scores.filter(s => s.score < 0.5).length
      }
    };
    
    return stats;
  }
}

module.exports = PresenceScorer;


