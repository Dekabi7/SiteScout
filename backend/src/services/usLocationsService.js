const axios = require('axios');

class USLocationsService {
  constructor() {
    // Comprehensive list of major US cities with their coordinates and zipcodes
    this.usCities = {
      'new york': {
        name: 'New York',
        state: 'NY',
        coordinates: { lat: 40.7128, lng: -74.0060 },
        zipcodes: ['10001', '10002', '10003', '10004', '10005', '10006', '10007', '10008', '10009', '10010'],
        formatted_address: 'New York, NY, USA'
      },
      'los angeles': {
        name: 'Los Angeles',
        state: 'CA',
        coordinates: { lat: 34.0522, lng: -118.2437 },
        zipcodes: ['90001', '90002', '90003', '90004', '90005', '90006', '90007', '90008', '90009', '90010'],
        formatted_address: 'Los Angeles, CA, USA'
      },
      'chicago': {
        name: 'Chicago',
        state: 'IL',
        coordinates: { lat: 41.8781, lng: -87.6298 },
        zipcodes: ['60601', '60602', '60603', '60604', '60605', '60606', '60607', '60608', '60609', '60610'],
        formatted_address: 'Chicago, IL, USA'
      },
      'houston': {
        name: 'Houston',
        state: 'TX',
        coordinates: { lat: 29.7604, lng: -95.3698 },
        zipcodes: ['77001', '77002', '77003', '77004', '77005', '77006', '77007', '77008', '77009', '77010'],
        formatted_address: 'Houston, TX, USA'
      },
      'phoenix': {
        name: 'Phoenix',
        state: 'AZ',
        coordinates: { lat: 33.4484, lng: -112.0740 },
        zipcodes: ['85001', '85002', '85003', '85004', '85005', '85006', '85007', '85008', '85009', '85010'],
        formatted_address: 'Phoenix, AZ, USA'
      },
      'philadelphia': {
        name: 'Philadelphia',
        state: 'PA',
        coordinates: { lat: 39.9526, lng: -75.1652 },
        zipcodes: ['19101', '19102', '19103', '19104', '19105', '19106', '19107', '19108', '19109', '19110'],
        formatted_address: 'Philadelphia, PA, USA'
      },
      'san antonio': {
        name: 'San Antonio',
        state: 'TX',
        coordinates: { lat: 29.4241, lng: -98.4936 },
        zipcodes: ['78201', '78202', '78203', '78204', '78205', '78206', '78207', '78208', '78209', '78210'],
        formatted_address: 'San Antonio, TX, USA'
      },
      'san diego': {
        name: 'San Diego',
        state: 'CA',
        coordinates: { lat: 32.7157, lng: -117.1611 },
        zipcodes: ['92101', '92102', '92103', '92104', '92105', '92106', '92107', '92108', '92109', '92110'],
        formatted_address: 'San Diego, CA, USA'
      },
      'dallas': {
        name: 'Dallas',
        state: 'TX',
        coordinates: { lat: 32.7767, lng: -96.7970 },
        zipcodes: ['75201', '75202', '75203', '75204', '75205', '75206', '75207', '75208', '75209', '75210'],
        formatted_address: 'Dallas, TX, USA'
      },
      'san jose': {
        name: 'San Jose',
        state: 'CA',
        coordinates: { lat: 37.3382, lng: -121.8863 },
        zipcodes: ['95101', '95102', '95103', '95104', '95105', '95106', '95107', '95108', '95109', '95110'],
        formatted_address: 'San Jose, CA, USA'
      },
      'austin': {
        name: 'Austin',
        state: 'TX',
        coordinates: { lat: 30.2672, lng: -97.7431 },
        zipcodes: ['73301', '73344', '78610', '78612', '78613', '78615', '78616', '78617', '78620', '78621'],
        formatted_address: 'Austin, TX, USA'
      },
      'jacksonville': {
        name: 'Jacksonville',
        state: 'FL',
        coordinates: { lat: 30.3322, lng: -81.6557 },
        zipcodes: ['32099', '32201', '32202', '32203', '32204', '32205', '32206', '32207', '32208', '32209'],
        formatted_address: 'Jacksonville, FL, USA'
      },
      'fort worth': {
        name: 'Fort Worth',
        state: 'TX',
        coordinates: { lat: 32.7555, lng: -97.3308 },
        zipcodes: ['76101', '76102', '76103', '76104', '76105', '76106', '76107', '76108', '76109', '76110'],
        formatted_address: 'Fort Worth, TX, USA'
      },
      'columbus': {
        name: 'Columbus',
        state: 'OH',
        coordinates: { lat: 39.9612, lng: -82.9988 },
        zipcodes: ['43085', '43201', '43202', '43203', '43204', '43205', '43206', '43207', '43208', '43209'],
        formatted_address: 'Columbus, OH, USA'
      },
      'charlotte': {
        name: 'Charlotte',
        state: 'NC',
        coordinates: { lat: 35.2271, lng: -80.8431 },
        zipcodes: ['28201', '28202', '28203', '28204', '28205', '28206', '28207', '28208', '28209', '28210'],
        formatted_address: 'Charlotte, NC, USA'
      },
      'san francisco': {
        name: 'San Francisco',
        state: 'CA',
        coordinates: { lat: 37.7749, lng: -122.4194 },
        zipcodes: ['94102', '94103', '94104', '94105', '94107', '94108', '94109', '94110', '94111', '94112'],
        formatted_address: 'San Francisco, CA, USA'
      },
      'indianapolis': {
        name: 'Indianapolis',
        state: 'IN',
        coordinates: { lat: 39.7684, lng: -86.1581 },
        zipcodes: ['46201', '46202', '46203', '46204', '46205', '46206', '46207', '46208', '46209', '46210'],
        formatted_address: 'Indianapolis, IN, USA'
      },
      'seattle': {
        name: 'Seattle',
        state: 'WA',
        coordinates: { lat: 47.6062, lng: -122.3321 },
        zipcodes: ['98101', '98102', '98103', '98104', '98105', '98106', '98107', '98108', '98109', '98110'],
        formatted_address: 'Seattle, WA, USA'
      },
      'denver': {
        name: 'Denver',
        state: 'CO',
        coordinates: { lat: 39.7392, lng: -104.9903 },
        zipcodes: ['80012', '80014', '80022', '80033', '80046', '80123', '80201', '80202', '80203', '80204'],
        formatted_address: 'Denver, CO, USA'
      },
      'washington': {
        name: 'Washington',
        state: 'DC',
        coordinates: { lat: 38.9072, lng: -77.0369 },
        zipcodes: ['20001', '20002', '20003', '20004', '20005', '20006', '20007', '20008', '20009', '20010'],
        formatted_address: 'Washington, DC, USA'
      },
      'boston': {
        name: 'Boston',
        state: 'MA',
        coordinates: { lat: 42.3601, lng: -71.0589 },
        zipcodes: ['02101', '02102', '02103', '02104', '02105', '02106', '02107', '02108', '02109', '02110'],
        formatted_address: 'Boston, MA, USA'
      },
      'el paso': {
        name: 'El Paso',
        state: 'TX',
        coordinates: { lat: 31.7619, lng: -106.4850 },
        zipcodes: ['79901', '79902', '79903', '79904', '79905', '79906', '79907', '79908', '79909', '79910'],
        formatted_address: 'El Paso, TX, USA'
      },
      'nashville': {
        name: 'Nashville',
        state: 'TN',
        coordinates: { lat: 36.1627, lng: -86.7816 },
        zipcodes: ['37201', '37202', '37203', '37204', '37205', '37206', '37207', '37208', '37209', '37210'],
        formatted_address: 'Nashville, TN, USA'
      },
      'detroit': {
        name: 'Detroit',
        state: 'MI',
        coordinates: { lat: 42.3314, lng: -83.0458 },
        zipcodes: ['48201', '48202', '48203', '48204', '48205', '48206', '48207', '48208', '48209', '48210'],
        formatted_address: 'Detroit, MI, USA'
      },
      'oklahoma city': {
        name: 'Oklahoma City',
        state: 'OK',
        coordinates: { lat: 35.4676, lng: -97.5164 },
        zipcodes: ['73101', '73102', '73103', '73104', '73105', '73106', '73107', '73108', '73109', '73110'],
        formatted_address: 'Oklahoma City, OK, USA'
      },
      'portland': {
        name: 'Portland',
        state: 'OR',
        coordinates: { lat: 45.5152, lng: -122.6784 },
        zipcodes: ['97086', '97201', '97202', '97203', '97204', '97205', '97206', '97207', '97208', '97209'],
        formatted_address: 'Portland, OR, USA'
      },
      'las vegas': {
        name: 'Las Vegas',
        state: 'NV',
        coordinates: { lat: 36.1699, lng: -115.1398 },
        zipcodes: ['89030', '89031', '89032', '89044', '89074', '89081', '89086', '89101', '89102', '89103'],
        formatted_address: 'Las Vegas, NV, USA'
      },
      'memphis': {
        name: 'Memphis',
        state: 'TN',
        coordinates: { lat: 35.1495, lng: -90.0490 },
        zipcodes: ['38101', '38102', '38103', '38104', '38105', '38106', '38107', '38108', '38109', '38110'],
        formatted_address: 'Memphis, TN, USA'
      },
      'louisville': {
        name: 'Louisville',
        state: 'KY',
        coordinates: { lat: 38.2527, lng: -85.7585 },
        zipcodes: ['40023', '40025', '40026', '40027', '40033', '40041', '40045', '40047', '40050', '40055'],
        formatted_address: 'Louisville, KY, USA'
      },
      'baltimore': {
        name: 'Baltimore',
        state: 'MD',
        coordinates: { lat: 39.2904, lng: -76.6122 },
        zipcodes: ['21201', '21202', '21203', '21204', '21205', '21206', '21207', '21208', '21209', '21210'],
        formatted_address: 'Baltimore, MD, USA'
      },
      'milwaukee': {
        name: 'Milwaukee',
        state: 'WI',
        coordinates: { lat: 43.0389, lng: -87.9065 },
        zipcodes: ['53201', '53202', '53203', '53204', '53205', '53206', '53207', '53208', '53209', '53210'],
        formatted_address: 'Milwaukee, WI, USA'
      },
      'albuquerque': {
        name: 'Albuquerque',
        state: 'NM',
        coordinates: { lat: 35.0844, lng: -106.6504 },
        zipcodes: ['87101', '87102', '87103', '87104', '87105', '87106', '87107', '87108', '87109', '87110'],
        formatted_address: 'Albuquerque, NM, USA'
      },
      'tucson': {
        name: 'Tucson',
        state: 'AZ',
        coordinates: { lat: 32.2226, lng: -110.9747 },
        zipcodes: ['85701', '85702', '85703', '85704', '85705', '85706', '85707', '85708', '85709', '85710'],
        formatted_address: 'Tucson, AZ, USA'
      },
      'fresno': {
        name: 'Fresno',
        state: 'CA',
        coordinates: { lat: 36.7378, lng: -119.7871 },
        zipcodes: ['93650', '93701', '93702', '93703', '93704', '93705', '93706', '93707', '93708', '93709'],
        formatted_address: 'Fresno, CA, USA'
      },
      'sacramento': {
        name: 'Sacramento',
        state: 'CA',
        coordinates: { lat: 38.5816, lng: -121.4944 },
        zipcodes: ['94203', '94204', '94205', '94206', '94207', '94208', '94209', '94211', '94229', '94230'],
        formatted_address: 'Sacramento, CA, USA'
      },
      'atlanta': {
        name: 'Atlanta',
        state: 'GA',
        coordinates: { lat: 33.7490, lng: -84.3880 },
        zipcodes: ['30060', '30061', '30062', '30063', '30064', '30065', '30066', '30067', '30068', '30069'],
        formatted_address: 'Atlanta, GA, USA'
      },
      'kansas city': {
        name: 'Kansas City',
        state: 'MO',
        coordinates: { lat: 39.0997, lng: -94.5786 },
        zipcodes: ['64101', '64102', '64103', '64104', '64105', '64106', '64107', '64108', '64109', '64110'],
        formatted_address: 'Kansas City, MO, USA'
      },
      'miami': {
        name: 'Miami',
        state: 'FL',
        coordinates: { lat: 25.7617, lng: -80.1918 },
        zipcodes: ['33101', '33102', '33103', '33104', '33105', '33106', '33107', '33108', '33109', '33110'],
        formatted_address: 'Miami, FL, USA'
      },
      'raleigh': {
        name: 'Raleigh',
        state: 'NC',
        coordinates: { lat: 35.7796, lng: -78.6382 },
        zipcodes: ['27513', '27529', '27540', '27545', '27587', '27601', '27602', '27603', '27604', '27605'],
        formatted_address: 'Raleigh, NC, USA'
      },
      'omaha': {
        name: 'Omaha',
        state: 'NE',
        coordinates: { lat: 41.2565, lng: -95.9345 },
        zipcodes: ['68046', '68101', '68102', '68103', '68104', '68105', '68106', '68107', '68108', '68109'],
        formatted_address: 'Omaha, NE, USA'
      },
      'minneapolis': {
        name: 'Minneapolis',
        state: 'MN',
        coordinates: { lat: 44.9778, lng: -93.2650 },
        zipcodes: ['55401', '55402', '55403', '55404', '55405', '55406', '55407', '55408', '55409', '55410'],
        formatted_address: 'Minneapolis, MN, USA'
      },
      'cleveland': {
        name: 'Cleveland',
        state: 'OH',
        coordinates: { lat: 41.4993, lng: -81.6944 },
        zipcodes: ['44101', '44102', '44103', '44104', '44105', '44106', '44107', '44108', '44109', '44110'],
        formatted_address: 'Cleveland, OH, USA'
      },
      'tulsa': {
        name: 'Tulsa',
        state: 'OK',
        coordinates: { lat: 36.1540, lng: -95.9928 },
        zipcodes: ['74101', '74102', '74103', '74104', '74105', '74106', '74107', '74108', '74109', '74110'],
        formatted_address: 'Tulsa, OK, USA'
      },
      'arlington': {
        name: 'Arlington',
        state: 'TX',
        coordinates: { lat: 32.7357, lng: -97.1081 },
        zipcodes: ['76001', '76002', '76003', '76004', '76005', '76006', '76007', '76008', '76009', '76010'],
        formatted_address: 'Arlington, TX, USA'
      },
      'new orleans': {
        name: 'New Orleans',
        state: 'LA',
        coordinates: { lat: 29.9511, lng: -90.0715 },
        zipcodes: ['70112', '70113', '70114', '70115', '70116', '70117', '70118', '70119', '70120', '70121'],
        formatted_address: 'New Orleans, LA, USA'
      },
      'wichita': {
        name: 'Wichita',
        state: 'KS',
        coordinates: { lat: 37.6872, lng: -97.3301 },
        zipcodes: ['67037', '67201', '67202', '67203', '67204', '67205', '67206', '67207', '67208', '67209'],
        formatted_address: 'Wichita, KS, USA'
      },
      'cincinnati': {
        name: 'Cincinnati',
        state: 'OH',
        coordinates: { lat: 39.1031, lng: -84.5120 },
        zipcodes: ['45201', '45202', '45203', '45204', '45205', '45206', '45207', '45208', '45209', '45210'],
        formatted_address: 'Cincinnati, OH, USA'
      }
    };
  }

  // Get city suggestions for autocomplete
  async getCitySuggestions(query, country = null) {
    try {
      if (!query || query.length < 2) {
        return [];
      }

      const queryLower = query.toLowerCase();
      const suggestions = [];

      // Search through cities
      for (const [cityKey, cityData] of Object.entries(this.usCities)) {
        if (cityKey.includes(queryLower) || queryLower.includes(cityKey)) {
          suggestions.push({
            description: cityData.formatted_address,
            place_id: `us_${cityKey.replace(/\s+/g, '_')}`,
            structured_formatting: {
              main_text: cityData.name,
              secondary_text: `${cityData.state}, USA`
            },
            coordinates: cityData.coordinates,
            zipcodes: cityData.zipcodes
          });
        }
      }

      // Search through zipcodes if query looks like a zipcode
      if (/^\d{3,5}$/.test(query)) {
        for (const [cityKey, cityData] of Object.entries(this.usCities)) {
          if (cityData.zipcodes.some(zip => zip.includes(query))) {
            suggestions.push({
              description: `${query} - ${cityData.name}, ${cityData.state}`,
              place_id: `us_zip_${query}`,
              structured_formatting: {
                main_text: query,
                secondary_text: `${cityData.name}, ${cityData.state}`
              },
              coordinates: cityData.coordinates,
              zipcodes: [query]
            });
          }
        }
      }

      // Search through states
      const stateAbbreviations = {
        'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
        'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
        'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
        'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
        'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
        'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
        'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
        'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
        'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
        'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming'
      };

      for (const [abbr, stateName] of Object.entries(stateAbbreviations)) {
        if (abbr.toLowerCase().includes(queryLower) || stateName.toLowerCase().includes(queryLower)) {
          suggestions.push({
            description: `${stateName}, USA`,
            place_id: `us_state_${abbr}`,
            structured_formatting: {
              main_text: stateName,
              secondary_text: 'USA'
            },
            coordinates: null,
            zipcodes: []
          });
        }
      }

      // Sort suggestions by relevance (exact matches first, then partial matches)
      suggestions.sort((a, b) => {
        const aExact = a.structured_formatting.main_text.toLowerCase() === queryLower;
        const bExact = b.structured_formatting.main_text.toLowerCase() === queryLower;
        
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        return a.structured_formatting.main_text.length - b.structured_formatting.main_text.length;
      });

      return suggestions.slice(0, 10); // Limit to 10 suggestions
    } catch (error) {
      console.error('Error getting city suggestions:', error.message);
      return [];
    }
  }

  // Get coordinates for a location
  async getCoordinates(location) {
    try {
      const queryLower = location.toLowerCase();
      
      // Search through cities
      for (const [cityKey, cityData] of Object.entries(this.usCities)) {
        if (cityKey.includes(queryLower) || queryLower.includes(cityKey)) {
          return cityData.coordinates;
        }
      }

      // Search through zipcodes
      if (/^\d{3,5}$/.test(location)) {
        for (const [cityKey, cityData] of Object.entries(this.usCities)) {
          if (cityData.zipcodes.some(zip => zip.includes(location))) {
            return cityData.coordinates;
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting coordinates:', error.message);
      return null;
    }
  }

  // Get formatted address for a location
  async getFormattedAddress(location) {
    try {
      const queryLower = location.toLowerCase();
      
      // Search through cities
      for (const [cityKey, cityData] of Object.entries(this.usCities)) {
        if (cityKey.includes(queryLower) || queryLower.includes(cityKey)) {
          return cityData.formatted_address;
        }
      }

      // Search through zipcodes
      if (/^\d{3,5}$/.test(location)) {
        for (const [cityKey, cityData] of Object.entries(this.usCities)) {
          if (cityData.zipcodes.some(zip => zip.includes(location))) {
            return `${location} - ${cityData.name}, ${cityData.state}`;
          }
        }
      }

      return location;
    } catch (error) {
      console.error('Error getting formatted address:', error.message);
      return location;
    }
  }
}

module.exports = new USLocationsService();
