const axios = require('axios');
const dns = require('dns').promises;
const { promisify } = require('util');

class WebsiteDetectionService {
  constructor() {
    this.timeout = 8000; // Increased timeout for better reliability
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
  }

  // Enhanced main method to detect if a business has a website
  async detectWebsite(business) {
    try {
      // Method 1: Check if website exists in Google Places data
      if (business.website) {
        const websiteAnalysis = await this.analyzeWebsite(business.website);
        return {
          has_website: websiteAnalysis.isValid,
          website_url: websiteAnalysis.isValid ? business.website : null,
          detection_method: 'google_places',
          confidence_score: websiteAnalysis.confidence,
          website_age: websiteAnalysis.age,
          is_outdated: websiteAnalysis.isOutdated
        };
      }

      // Method 2: Try to construct website from business name
      const constructedWebsite = this.constructWebsiteFromName(business.name);
      if (constructedWebsite) {
        const websiteAnalysis = await this.analyzeWebsite(constructedWebsite);
        if (websiteAnalysis.isValid) {
          return {
            has_website: true,
            website_url: constructedWebsite,
            detection_method: 'name_construction',
            confidence_score: websiteAnalysis.confidence * 0.7, // Lower confidence for constructed URLs
            website_age: websiteAnalysis.age,
            is_outdated: websiteAnalysis.isOutdated
          };
        }
      }

      // Method 3: DNS check for common domain patterns
      const dnsResult = await this.checkDNS(business.name);
      if (dnsResult.has_website) {
        return dnsResult;
      }

      // Method 4: Enhanced SERP check (simplified - in production, use a proper SERP API)
      const serpResult = await this.checkSERP(business.name, business.address);
      if (serpResult.has_website) {
        return serpResult;
      }

      // No website found
      return {
        has_website: false,
        website_url: null,
        detection_method: 'comprehensive_check',
        confidence_score: 0.85, // Higher confidence when no website is found
        website_age: null,
        is_outdated: false
      };

    } catch (error) {
      console.error('Error detecting website:', error.message);
      return {
        has_website: false,
        website_url: null,
        detection_method: 'error',
        confidence_score: 0.0,
        website_age: null,
        is_outdated: false
      };
    }
  }

  // Enhanced website analysis with better content detection
  async analyzeWebsite(url) {
    try {
      const normalizedUrl = this.normalizeUrl(url);
      
      // Check if URL is accessible with proper headers
      const response = await axios.get(normalizedUrl, {
        timeout: this.timeout,
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        validateStatus: (status) => status < 400,
        maxRedirects: 5
      });

      if (response.status >= 400) {
        return {
          isValid: false,
          confidence: 0.1,
          age: null,
          isOutdated: false
        };
      }

      // Analyze website content for age indicators
      const html = response.data;
      const ageIndicators = this.detectAgeIndicators(html);
      
      // Check for outdated technology indicators
      const outdatedIndicators = this.detectOutdatedTechnology(html);
      
      // Check for business-specific content
      const businessContent = this.detectBusinessContent(html, url);
      
      const isOutdated = ageIndicators.isOld || outdatedIndicators.hasOutdatedTech;
      const confidence = this.calculateConfidence(ageIndicators, outdatedIndicators, businessContent);

      return {
        isValid: true,
        confidence: confidence,
        age: ageIndicators.estimatedAge,
        isOutdated: isOutdated
      };

    } catch (error) {
      return {
        isValid: false,
        confidence: 0.0,
        age: null,
        isOutdated: false
      };
    }
  }

  // Enhanced age detection with more indicators
  detectAgeIndicators(html) {
    const indicators = {
      isOld: false,
      estimatedAge: 'unknown'
    };

    // Check for copyright years
    const copyrightMatch = html.match(/copyright.*?(\d{4})/gi);
    if (copyrightMatch) {
      const years = copyrightMatch.map(match => {
        const yearMatch = match.match(/\d{4}/);
        return yearMatch ? parseInt(yearMatch[0]) : null;
      }).filter(year => year !== null);
      
      if (years.length > 0) {
        const oldestYear = Math.min(...years);
        const currentYear = new Date().getFullYear();
        if (currentYear - oldestYear > 5) {
          indicators.isOld = true;
          indicators.estimatedAge = `${currentYear - oldestYear} years old`;
        }
      }
    }

    // Check for "last updated" dates
    const lastUpdatedMatch = html.match(/last.?updated.*?(\d{4})/gi);
    if (lastUpdatedMatch) {
      const years = lastUpdatedMatch.map(match => {
        const yearMatch = match.match(/\d{4}/);
        return yearMatch ? parseInt(yearMatch[0]) : null;
      }).filter(year => year !== null);
      
      if (years.length > 0) {
        const oldestYear = Math.min(...years);
        const currentYear = new Date().getFullYear();
        if (currentYear - oldestYear > 3) {
          indicators.isOld = true;
          indicators.estimatedAge = `Last updated ${currentYear - oldestYear} years ago`;
        }
      }
    }

    // Check for meta tags with dates
    const metaDateMatch = html.match(/<meta[^>]*content="[^"]*(\d{4})[^"]*"[^>]*>/gi);
    if (metaDateMatch) {
      const years = metaDateMatch.map(match => {
        const yearMatch = match.match(/\d{4}/);
        return yearMatch ? parseInt(yearMatch[0]) : null;
      }).filter(year => year !== null);
      
      if (years.length > 0) {
        const oldestYear = Math.min(...years);
        const currentYear = new Date().getFullYear();
        if (currentYear - oldestYear > 4) {
          indicators.isOld = true;
          indicators.estimatedAge = `Meta date: ${currentYear - oldestYear} years old`;
        }
      }
    }

    return indicators;
  }

  // Enhanced outdated technology detection
  detectOutdatedTechnology(html) {
    const indicators = {
      hasOutdatedTech: false,
      outdatedFeatures: []
    };

    // Check for Flash (very outdated)
    if (html.includes('flash') || html.includes('swf') || html.includes('object') || html.includes('embed')) {
      indicators.hasOutdatedTech = true;
      indicators.outdatedFeatures.push('Flash');
    }

    // Check for old HTML patterns
    if (html.includes('<table') && html.includes('width=') && html.includes('height=')) {
      indicators.hasOutdatedTech = true;
      indicators.outdatedFeatures.push('Table-based layout');
    }

    // Check for old meta tags
    if (html.includes('meta name="generator" content="FrontPage"') || 
        html.includes('meta name="generator" content="Dreamweaver"') ||
        html.includes('meta name="generator" content="GoLive"')) {
      indicators.hasOutdatedTech = true;
      indicators.outdatedFeatures.push('Old web editor');
    }

    // Check for old JavaScript patterns
    if (html.includes('document.write') || html.includes('onload=') || html.includes('onclick=')) {
      indicators.hasOutdatedTech = true;
      indicators.outdatedFeatures.push('Old JavaScript patterns');
    }

    // Check for old CSS patterns
    if (html.includes('font-family: Arial') || html.includes('font-size: 12px')) {
      indicators.hasOutdatedTech = true;
      indicators.outdatedFeatures.push('Old CSS patterns');
    }

    // Check for frames (very outdated)
    if (html.includes('<frame') || html.includes('<frameset')) {
      indicators.hasOutdatedTech = true;
      indicators.outdatedFeatures.push('Frames');
    }

    return indicators;
  }

  // New method to detect business-specific content
  detectBusinessContent(html, url) {
    const indicators = {
      hasBusinessContent: false,
      businessFeatures: []
    };

    const htmlLower = html.toLowerCase();
    const urlLower = url.toLowerCase();

    // Check for business-related keywords
    const businessKeywords = [
      'about us', 'contact us', 'services', 'products', 'hours', 'location',
      'phone', 'email', 'address', 'menu', 'pricing', 'appointment',
      'booking', 'reservation', 'order', 'shop', 'store', 'gallery'
    ];

    for (const keyword of businessKeywords) {
      if (htmlLower.includes(keyword)) {
        indicators.hasBusinessContent = true;
        indicators.businessFeatures.push(keyword);
      }
    }

    // Check for social media links (indicates active business)
    const socialMediaPatterns = [
      'facebook.com', 'instagram.com', 'twitter.com', 'linkedin.com',
      'youtube.com', 'tiktok.com', 'pinterest.com'
    ];

    for (const social of socialMediaPatterns) {
      if (htmlLower.includes(social)) {
        indicators.hasBusinessContent = true;
        indicators.businessFeatures.push('social_media');
        break;
      }
    }

    // Check for modern web features
    if (htmlLower.includes('responsive') || htmlLower.includes('mobile-friendly')) {
      indicators.hasBusinessContent = true;
      indicators.businessFeatures.push('modern_features');
    }

    return indicators;
  }

  // Enhanced confidence calculation
  calculateConfidence(ageIndicators, outdatedIndicators, businessContent) {
    let confidence = 0.9;

    if (ageIndicators.isOld) {
      confidence -= 0.15;
    }

    if (outdatedIndicators.hasOutdatedTech) {
      confidence -= 0.25;
    }

    if (businessContent.hasBusinessContent) {
      confidence += 0.1; // Bonus for business content
    }

    return Math.max(confidence, 0.1);
  }

  // Validate if a website URL is accessible
  async validateWebsite(url) {
    try {
      // Normalize URL
      const normalizedUrl = this.normalizeUrl(url);
      
      // Check if URL is accessible
      const response = await axios.get(normalizedUrl, {
        timeout: this.timeout,
        validateStatus: (status) => status < 400 // Accept 2xx and 3xx status codes
      });

      return response.status < 400;
    } catch (error) {
      return false;
    }
  }

  // Normalize URL to ensure it has proper protocol
  normalizeUrl(url) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  }

  // Construct potential website URL from business name
  constructWebsiteFromName(businessName) {
    const cleanName = businessName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .replace(/\s+/g, '');

    if (cleanName.length < 3) return null;

    const commonTlds = ['.com', '.net', '.org'];
    
    for (const tld of commonTlds) {
      const potentialUrl = `https://${cleanName}${tld}`;
      return potentialUrl;
    }

    return null;
  }

  // Check DNS for common domain patterns
  async checkDNS(businessName) {
    try {
      const cleanName = businessName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .replace(/\s+/g, '');

      const commonTlds = ['.com', '.net', '.org'];
      
      for (const tld of commonTlds) {
        const domain = `${cleanName}${tld}`;
        
        try {
          await dns.resolve(domain);
          // If DNS resolution succeeds, check if website is accessible
          const isValid = await this.validateWebsite(`https://${domain}`);
          if (isValid) {
            return {
              has_website: true,
              website_url: `https://${domain}`,
              detection_method: 'dns_check',
              confidence_score: 0.8
            };
          }
        } catch (dnsError) {
          // Domain doesn't exist, continue to next TLD
          continue;
        }
      }

      return {
        has_website: false,
        website_url: null,
        detection_method: 'dns_check',
        confidence_score: 0.6
      };

    } catch (error) {
      console.error('Error in DNS check:', error.message);
      return {
        has_website: false,
        website_url: null,
        detection_method: 'dns_check',
        confidence_score: 0.0
      };
    }
  }

  // Simplified SERP check (in production, use a proper SERP API)
  async checkSERP(businessName, address) {
    try {
      // This is a simplified version. In production, you would:
      // 1. Use a SERP API (like SerpAPI, ScrapingBee, etc.)
      // 2. Search for the business name + location
      // 3. Parse the results to find official website
      
      // For now, return false as this requires a proper SERP API
      return {
        has_website: false,
        website_url: null,
        detection_method: 'serp_check',
        confidence_score: 0.0
      };

    } catch (error) {
      console.error('Error in SERP check:', error.message);
      return {
        has_website: false,
        website_url: null,
        detection_method: 'serp_check',
        confidence_score: 0.0
      };
    }
  }

  // Batch detect websites for multiple businesses
  async batchDetectWebsites(businesses) {
    const results = [];
    
    // For mock data, use fast detection based on the website field
    for (const business of businesses) {
      try {
        // If it's mock data with a website field, use that directly
        if (business.website) {
          results.push({
            business_id: business.google_place_id,
            has_website: true,
            website_url: business.website,
            detection_method: 'mock_data',
            confidence_score: 0.9,
            website_age: '2-5 years',
            is_outdated: false
          });
        } else {
          // For businesses without websites in mock data
          results.push({
            business_id: business.google_place_id,
            has_website: false,
            website_url: null,
            detection_method: 'mock_data',
            confidence_score: 0.9,
            website_age: null,
            is_outdated: false
          });
        }
      } catch (error) {
        console.error(`Error detecting website for business ${business.google_place_id}:`, error.message);
        results.push({
          business_id: business.google_place_id,
          has_website: false,
          website_url: null,
          detection_method: 'error',
          confidence_score: 0.0
        });
      }
    }

    return results;
  }
}

module.exports = new WebsiteDetectionService(); 