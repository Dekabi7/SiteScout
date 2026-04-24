const axios = require('axios');

class UrlVerifier {
  constructor() {
    this.timeout = 8000;
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    this.parkingKeywords = [
      'parking', 'parked', 'domain', 'expired', 'for sale', 'buy this domain',
      'coming soon', 'under construction', 'maintenance', 'temporarily unavailable',
      'domain parking', 'parked domain', 'this domain is for sale'
    ];
  }

  // Verify if a URL is a real business website
  async verifyUrl(url) {
    if (!url) {
      return {
        isValid: false,
        confidence: 0.0,
        reason: 'No URL provided'
      };
    }

    try {
      const normalizedUrl = this.normalizeUrl(url);
      
      // Check if URL is accessible
      const response = await axios.get(normalizedUrl, {
        timeout: this.timeout,
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive'
        },
        validateStatus: (status) => status < 400,
        maxRedirects: 5
      });

      if (response.status >= 400) {
        return {
          isValid: false,
          confidence: 0.0,
          reason: `HTTP ${response.status} error`
        };
      }

      // Analyze the content
      const content = response.data;
      const analysis = this.analyzeContent(content, normalizedUrl);
      
      return {
        isValid: analysis.isValid,
        confidence: analysis.confidence,
        reason: analysis.reason,
        websiteAge: analysis.websiteAge,
        isOutdated: analysis.isOutdated,
        hasBusinessContent: analysis.hasBusinessContent
      };

    } catch (error) {
      return {
        isValid: false,
        confidence: 0.0,
        reason: `Connection error: ${error.message}`
      };
    }
  }

  // Normalize URL
  normalizeUrl(url) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  }

  // Analyze website content
  analyzeContent(html, url) {
    const analysis = {
      isValid: true,
      confidence: 0.9,
      reason: 'Valid business website',
      websiteAge: 'unknown',
      isOutdated: false,
      hasBusinessContent: false
    };

    const htmlLower = html.toLowerCase();
    const urlLower = url.toLowerCase();

    // Check for parking page indicators
    const parkingScore = this.checkParkingIndicators(htmlLower);
    if (parkingScore > 0.7) {
      analysis.isValid = false;
      analysis.confidence = 0.9;
      analysis.reason = 'Domain parking page detected';
      return analysis;
    }

    // Check for third-party platforms
    const thirdPartyScore = this.checkThirdPartyPlatforms(urlLower, htmlLower);
    if (thirdPartyScore > 0.8) {
      analysis.isValid = false;
      analysis.confidence = 0.9;
      analysis.reason = 'Third-party platform (not a business website)';
      return analysis;
    }

    // Check for business content
    const businessContentScore = this.checkBusinessContent(htmlLower);
    analysis.hasBusinessContent = businessContentScore > 0.5;
    
    if (analysis.hasBusinessContent) {
      analysis.confidence = Math.min(0.95, analysis.confidence + 0.1);
    }

    // Check for outdated technology
    const outdatedScore = this.checkOutdatedTechnology(htmlLower);
    if (outdatedScore > 0.6) {
      analysis.isOutdated = true;
      analysis.confidence -= 0.2;
    }

    // Check for website age indicators
    const ageAnalysis = this.analyzeWebsiteAge(htmlLower);
    analysis.websiteAge = ageAnalysis.age;
    if (ageAnalysis.isOld) {
      analysis.isOutdated = true;
      analysis.confidence -= 0.1;
    }

    // Final confidence adjustment
    analysis.confidence = Math.max(0.1, Math.min(1.0, analysis.confidence));

    return analysis;
  }

  // Check for parking page indicators
  checkParkingIndicators(html) {
    let score = 0;
    let matches = 0;

    for (const keyword of this.parkingKeywords) {
      if (html.includes(keyword)) {
        score += 1;
        matches++;
      }
    }

    // Check for common parking page patterns
    const parkingPatterns = [
      'domain parking',
      'parked domain',
      'this domain is for sale',
      'domain for sale',
      'buy this domain',
      'domain expired',
      'coming soon',
      'under construction',
      'temporarily unavailable'
    ];

    for (const pattern of parkingPatterns) {
      if (html.includes(pattern)) {
        score += 2;
        matches++;
      }
    }

    // Check for minimal content (typical of parking pages)
    const textContent = html.replace(/<[^>]*>/g, '').trim();
    if (textContent.length < 500) {
      score += 1;
    }

    return matches > 0 ? score / (matches + 1) : 0;
  }

  // Check for third-party platforms
  checkThirdPartyPlatforms(url, html) {
    const thirdPartyDomains = [
      'yelp.com', 'facebook.com', 'instagram.com', 'twitter.com',
      'google.com/maps', 'maps.google.com', 'foursquare.com',
      'tripadvisor.com', 'opentable.com', 'grubhub.com',
      'doordash.com', 'ubereats.com', 'postmates.com',
      'yellowpages.com', 'whitepages.com', 'superpages.com',
      'citysearch.com', 'angieslist.com', 'thumbtack.com',
      'homeadvisor.com', 'nextdoor.com', 'linkedin.com'
    ];

    for (const domain of thirdPartyDomains) {
      if (url.includes(domain) || html.includes(domain)) {
        return 1.0;
      }
    }

    return 0.0;
  }

  // Check for business content
  checkBusinessContent(html) {
    const businessKeywords = [
      'about us', 'contact us', 'services', 'products', 'hours',
      'location', 'phone', 'email', 'address', 'menu', 'pricing',
      'appointment', 'booking', 'reservation', 'order', 'shop',
      'store', 'gallery', 'testimonials', 'reviews'
    ];

    let score = 0;
    for (const keyword of businessKeywords) {
      if (html.includes(keyword)) {
        score += 1;
      }
    }

    return Math.min(1.0, score / 10); // Normalize to 0-1
  }

  // Check for outdated technology
  checkOutdatedTechnology(html) {
    let score = 0;
    let indicators = 0;

    // Flash (very outdated)
    if (html.includes('flash') || html.includes('swf')) {
      score += 3;
      indicators++;
    }

    // Old HTML patterns
    if (html.includes('<table') && html.includes('width=')) {
      score += 1;
      indicators++;
    }

    // Old meta tags
    if (html.includes('meta name="generator" content="FrontPage"')) {
      score += 2;
      indicators++;
    }

    // Frames (very outdated)
    if (html.includes('<frame') || html.includes('<frameset')) {
      score += 2;
      indicators++;
    }

    return indicators > 0 ? score / (indicators + 1) : 0;
  }

  // Analyze website age
  analyzeWebsiteAge(html) {
    const analysis = {
      age: 'unknown',
      isOld: false
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
        const age = currentYear - oldestYear;
        
        if (age > 5) {
          analysis.isOld = true;
          analysis.age = `${age} years old`;
        } else {
          analysis.age = `${age} years old`;
        }
      }
    }

    return analysis;
  }

  // Batch verify multiple URLs
  async verifyBatch(urls) {
    const results = [];
    
    // Process in batches to avoid overwhelming servers
    const batchSize = 5;
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      const batchPromises = batch.map(url => this.verifyUrl(url));
      
      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      } catch (error) {
        console.error(`Error verifying batch ${i}-${i + batchSize}:`, error.message);
        // Add failed results
        results.push(...batch.map(url => ({
          isValid: false,
          confidence: 0.0,
          reason: 'Batch verification failed'
        })));
      }
      
      // Delay between batches
      if (i + batchSize < urls.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }
}

module.exports = UrlVerifier;


