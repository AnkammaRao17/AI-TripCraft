const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

// Initialize Gemini API client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    logger.warn('GEMINI_API_KEY is not configured or uses placeholder. Falling back to Mock Generator.');
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
};

/**
 * Generate itinerary based on user input
 * @param {Object} trip - Trip configuration object
 */
const generateItinerary = async (trip) => {
  const client = getGeminiClient();
  const daysCount = trip.numberOfDays;
  const budgetText = trip.budget;
  const destination = trip.destination;
  const country = trip.country;
  const tripType = trip.tripType;
  const interests = trip.interests.join(', ') || 'General Sightseeing';
  const foodPref = trip.foodPreference;
  const transportPref = trip.transportPreference;
  const hotelPref = trip.hotelPreference;
  const travelers = trip.numberOfTravelers;

  if (!client) {
    return generateMockItinerary(trip);
  }

  try {
    // We use gemini-1.5-flash as the default fast & reliable model
    const model = client.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const prompt = `
Generate a travel itinerary for a ${daysCount}-day trip to ${destination}, ${country}.
Trip details:
- Trip Type: ${tripType}
- Travelers: ${travelers}
- Budget Tier: ${budgetText}
- Interests: ${interests}
- Transportation Preference: ${transportPref}
- Hotel Preference: ${hotelPref}
- Food Preference: ${foodPref}

All monetary budgets and pricing must be generated strictly in Indian Rupees (INR) represented as numeric values without currency symbols.

CRITICAL INSTRUCTIONS FOR DESTINATION-SPECIFICITY AND REALISM:
1. DO NOT use generic placeholder data, names, or repetitive templates.
   - For example, NEVER use generic attraction names like "Central Historic Palace Museum", "Vibrant Local Artisans Bazaar", "Scenic Sunset Hill Vista", "Eco Botanical Gardens", "Local Heritage Cathedral", "Morning Tour Stop", "Local Landmark", "Sunset Garden".
   - NEVER use generic timeline events like "Breakfast at Stay" or generic placeholders.
   - Generate actual real tourist attractions, landmarks, beaches, parks, or historical sites that exist in ${destination}.
   - Generate actual real hotels located in ${destination} for the 'hotels' array (e.g. for Goa: Taj Exotica, Grand Hyatt, W Goa; for Delhi: Leela Palace, ITC Maurya, etc. depending on budget preference).
   - Generate actual real restaurants located in ${destination} for the 'restaurants' list (e.g. for Goa: Thalassa, Fisherman's Wharf, Souza Lobo; for Mumbai: Britannia & Co, Leopold Cafe, etc.).
2. TIMELINE & HOURS:
   - Generate realistic hourly schedules for morningPlan, afternoonPlan, and eveningPlan (e.g. "09:00 AM: Visit [Real Attraction]. 01:30 PM: Lunch at [Real Restaurant]. 06:00 PM: Sunset Walk...").
   - Timings and pace must vary across destinations based on real travel distances, geography (e.g. mountain travel takes longer, city travel has metro/train timings, beach travel is relaxed).
3. TRANSPORTATION:
   - Calculate and specify realistic local transport options. (e.g. Goa -> Scooter/Taxi; Delhi -> Metro/Cab; Mumbai -> Local Train/Metro/Taxi; Ladakh -> SUV/Bike; Manali -> Taxi/Private Cab; Hampi -> Bicycle/Auto).
   - Reflect these transport modes in the transportationTips and plans.
4. FOOD & LOCAL EXPERIENCES:
   - Recommend actual regional dishes and delicacies of ${destination} in the localFood field (e.g. Goa -> Goan Fish Curry, Bebinca; Jaipur -> Dal Baati Churma, Ghewar; Kerala -> Appam, Kerala Sadya; Delhi -> Chole Bhature, Butter Chicken).
5. WEATHER:
   - Match the weather parameters and tips to the actual climate of ${destination} (Goa -> Tropical/Humid, Ladakh -> Cold/Arid, Manali -> Cold/Snowy, Rajasthan -> Hot/Dry, Kerala -> Humid/Tropical).
6. BUDGET:
   - Customize the daily budgets and total cost based on the destination cost index, travelers, and season.

Return ONLY a JSON object that adheres strictly to the following schema. Do NOT wrap the JSON in Markdown code fences or formatting.
Schema:
{
  "days": [
    {
      "dayNumber": 1,
      "morningPlan": "Realistic hourly schedule starting in morning (e.g., 08:30 AM: ...)",
      "afternoonPlan": "Realistic hourly schedule for afternoon (e.g., 01:00 PM: ...)",
      "eveningPlan": "Realistic hourly schedule for evening and night (e.g., 06:30 PM: ...)",
      "recommendedAttractions": ["Real Attraction A", "Real Attraction B"],
      "restaurants": ["Real Restaurant name (Brief local note)"],
      "localFood": ["Real local dish/cuisine to try"],
      "transportationTips": "Realistic mode of transport and route details for this day (e.g. 'Rent a scooter to drive along the coastal road')",
      "estimatedDailyBudget": 4500
    }
  ],
  "travelTips": [
    "Real tip 1",
    "Real tip 2"
  ],
  "packingList": [
    "Item 1",
    "Item 2"
  ],
  "hotels": [
    "Real Hotel option 1 (Brief description of amenities/location)",
    "Real Hotel option 2 (Brief description of amenities/location)",
    "Real Hotel option 3 (Brief description of amenities/location)"
  ],
  "hiddenGems": [
    "Real hidden local attraction 1",
    "Real hidden local attraction 2"
  ],
  "safetyTips": [
    "Real safety recommendation 1"
  ],
  "photographySpots": [
    "Real scenic photo spot 1"
  ],
  "bestVisitingTime": "Real best season, months, or morning hours to explore this region",
  "budgetOptimization": "Specific recommendations on local transit passes, budget homestays, and street food to save money"
}
Ensure that all day numbers from 1 to ${daysCount} are included in the 'days' array. Keep output highly localized, realistic, and specific to ${destination}.
`;

    logger.info(`Sending prompt to Gemini for ${destination} (${daysCount} days)...`);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      const parsedData = JSON.parse(text);
      if (!parsedData.days || !Array.isArray(parsedData.days) || parsedData.days.length === 0) {
        throw new Error('Invalid JSON structure returned by Gemini');
      }
      return parsedData;
    } catch (parseError) {
      logger.error(`Error parsing Gemini JSON output: ${parseError.message}`);
      logger.debug(`Gemini raw output: ${text}`);
      // Try string regex cleanup as fallback
      const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanedText);
    }
  } catch (error) {
    logger.error(`Gemini API call failed: ${error.message}. Falling back to Mock Generator.`);
    return generateMockItinerary(trip);
  }
};

/**
 * Generates high-quality mock data when Gemini key is not configured or rate-limited
 */
const generateMockItinerary = (trip) => {
  const { destination, numberOfDays, budget } = trip;
  
  const dailyBudgets = {
    'Budget': 1500,
    'Moderate': 4000,
    'Luxury': 12000,
  };
  let baseBudget = dailyBudgets[budget] || 3000;
  
  const destLower = destination.toLowerCase();

  // Apply cost scaling based on destination
  let costMultiplier = 1.0;
  if (destLower.includes('goa')) costMultiplier = 1.25;
  else if (destLower.includes('manali')) costMultiplier = 1.1;
  else if (destLower.includes('mumbai')) costMultiplier = 1.35;
  else if (destLower.includes('delhi')) costMultiplier = 0.95;
  else if (destLower.includes('kerala')) costMultiplier = 1.15;
  else if (destLower.includes('ladakh')) costMultiplier = 1.3;
  else if (destLower.includes('hampi')) costMultiplier = 0.8;
  else if (destLower.includes('varanasi')) costMultiplier = 0.85;
  else if (destLower.includes('andaman')) costMultiplier = 1.45;
  
  baseBudget = Math.round(baseBudget * costMultiplier);

  const capDest = destination.charAt(0).toUpperCase() + destination.slice(1);
  let data = {};

  if (destLower.includes('goa')) {
    data = {
      attractions: ['Baga Beach', 'Calangute Beach', 'Fort Aguada', 'Dudhsagar Falls', 'Basilica of Bom Jesus', 'Chapora Fort', 'Anjuna Beach'],
      restaurants: ['Thalassa Greek Tavern', 'Fisherman\'s Wharf', 'Souza Lobo beachside', 'Curlies Beach Shack', 'Gunpowder Restaurant'],
      foods: ['Goan Fish Curry', 'Bebinca', 'Pork Vindaloo', 'Chicken Cafreal', 'Feni heritage cocktail'],
      hotels: budget === 'Budget' ? ['Zostel Goa, Vagator (Social hostel)', 'Roadhouse Backpackers stay'] :
              budget === 'Luxury' ? ['Taj Exotica Goa Resort', 'Grand Hyatt Goa Resort', 'W Goa, Vagator'] :
              ['Cidade de Goa Heritage Resort', 'Goan Heritage Resort Calangute'],
      hiddenGems: ['Cola Beach freshwater lagoon', 'Chorao Island bird sanctuary', 'Netravali Bubble Lake'],
      safetyTips: ['Avoid swimming during high tide flags.', 'Rent two-wheelers only from licensed black-yellow plate vendors.', 'Respect local silence rules in heritage churches.'],
      photographySpots: ['Fontainhas Latin Quarter Portuguese corridors', 'Fort Aguada panoramic sea viewpoint', 'Dudhsagar waterfall bridge'],
      bestVisitingTime: 'November to February (pleasant tropical climate, vibrant markets and beach shacks)',
      budgetOptimization: 'Rent a local scooter (₹400/day). Dine at beach shacks instead of fine dining restaurants.',
      weather: 'Tropical',
      transport: ['Scooter', 'Taxi', 'Walking on beaches'],
      dayTemplates: [
        {
          morning: 'Ride a scooter to the historic Fort Aguada. Climb the lighthouse for panoramic views of the Arabian Sea.',
          afternoon: 'Enjoy lunch at Souza Lobo. Spend the afternoon walking and relaxing along Calangute Beach.',
          evening: 'Visit Baga Beach for sunset. Indulge in parasailing and jet skiing, followed by a beachfront dinner at Britto\'s.',
          transit: 'Rent local scooters (₹400/day) for local transit.'
        },
        {
          morning: 'Visit the Basilica of Bom Jesus in Old Goa, a beautiful UNESCO World Heritage site.',
          afternoon: 'Have Goan Fish Curry at Fisherman\'s Wharf. Explore the colorful lanes of Fontainhas Latin Quarter.',
          evening: 'Drive to Chapora Fort for a scenic sunset over the river estuary, followed by dinner at Gunpowder.',
          transit: 'Scooter ride or local yellow-black taxi.'
        },
        {
          morning: 'Trek to Dudhsagar Waterfalls through the lush green jungle tracks.',
          afternoon: 'Enjoy a spice plantation tour with a traditional buffet lunch.',
          evening: 'Relax on Anjuna Beach and walk around the flea markets.',
          transit: 'Jungle jeep safari and scooter ride.'
        }
      ]
    };
  } else if (destLower.includes('manali')) {
    data = {
      attractions: ['Solang Valley', 'Rohtang Pass', 'Hidimba Temple', 'Mall Road', 'Old Manali', 'Jogini Waterfalls'],
      restaurants: ['The Johnson\'s Cafe', 'Cafe 1947', 'Lazy Dog Riverside Cafe', 'Il Forno', 'Chopsticks Tibetan Diner'],
      foods: ['Steamed Siddu with ghee', 'Fresh pan-fried trout fish', 'Hot Tibetan thukpa', 'Kadhi Chawal comfort bowl'],
      hotels: budget === 'Budget' ? ['Zostel Manali, Old Town', 'Alt Life Backpacker Hub'] :
              budget === 'Luxury' ? ['The Himalayan (Castle style)', 'Manu Allaya Resort', 'Snow Valley Resort'] :
              ['The Johnson Lodge Boutique Stay', 'Manu Allaya Resort & Spa'],
      hiddenGems: ['Sajla waterfall secret pool', 'Hampta Pass glacier base', 'Soyal village wooden houses'],
      safetyTips: ['Check Rohtang Pass permit rules online in advance.', 'Avoid driving in snow or heavy rainfall landslide weather.', 'Keep warm jackets ready even in summers.'],
      photographySpots: ['Rohtang snow line range panorama', 'Hadimba pine forest paths', 'Jogini waterfall mist bridge'],
      bestVisitingTime: 'October to June (winter for snow sports, summer to escape plains heat)',
      budgetOptimization: 'Use shared local shuttle buses instead of private cabs. Old Manali offers budget stays.',
      weather: 'Snow (seasonal)',
      transport: ['Taxi', 'Private Cab'],
      dayTemplates: [
        {
          morning: 'Visit Hidimba Devi Temple nestled inside towering pine forests.',
          afternoon: 'Lunch at Johnson\'s Cafe. Explore the quirky cafes and shops in Old Manali.',
          evening: 'Walk Mall Road, purchase local wooden crafts, and dine at Chopsticks.',
          transit: 'Private cab or walk.'
        },
        {
          morning: 'Travel to Solang Valley. Enjoy snow activities like skiing or paragliding.',
          afternoon: 'Lunch at a mountainside cafe. Enjoy a cable car ride with panoramic valley views.',
          evening: 'Walk alongside Beas River, and dine at Cafe 1947.',
          transit: 'Local mountain taxi.'
        },
        {
          morning: 'Excursion to Rohtang Pass to play in deep snow at high altitudes.',
          afternoon: 'Have hot instant noodles on the pass. Soak in the Himalayan glacier views.',
          evening: 'Warm up at Vashisht hot springs, and have woodfire pizza at Il Forno.',
          transit: 'Private SUV cab.'
        }
      ]
    };
  } else if (destLower.includes('jaipur')) {
    data = {
      attractions: ['Hawa Mahal', 'Amber Fort', 'Jal Mahal', 'City Palace', 'Nahargarh Fort', 'Patrika Gate'],
      restaurants: ['Laxmi Mishthan Bhandar (LMB)', 'Rawat Sweets', 'Peacock Rooftop Resto', 'Spice Court Jaipur', 'Suvarna Mahal'],
      foods: ['Dal Baati', 'Ghewar', 'Rajasthani Thali', 'Lal Maas', 'Pyaaz Kachori'],
      hotels: budget === 'Budget' ? ['Zostel Jaipur, Old City', 'Pearl Palace Lodge'] :
              budget === 'Luxury' ? ['Rambagh Palace (Heritage royalty)', 'ITC Rajputana Jaipur'] :
              ['Umaid Bhawan Boutique Hotel', 'Pearl Palace Heritage Stay'],
      hiddenGems: ['Panna Meena ka Kund ancient stepwell', 'Galta Ji natural water monkey temple', 'Amer Fort backwall sunrise trail'],
      safetyTips: ['Negotiate prices with local auto drivers beforehand.', 'Buy the composite monuments ticket to save entry fees.', 'Beware of pushy jewelry vendors.'],
      photographySpots: ['Hawa Mahal street face facade', 'Patrika Gate pink heritage columns', 'Sunset panoramas from Nahargarh Fort heights'],
      bestVisitingTime: 'October to March (pleasant winter climate, ideal for exploring forts)',
      budgetOptimization: 'Buy a composite entry ticket. Eat delicious Pyaaz Kachoris at Rawat for under ₹100.',
      weather: 'Hot',
      transport: ['Auto', 'Cab'],
      dayTemplates: [
        {
          morning: 'Visit the facade of Hawa Mahal (Palace of Winds) and the City Palace museum.',
          afternoon: 'Enjoy Rajasthani Thali at LMB. Stroll around Johari Bazaar.',
          evening: 'Capture sunset views of Jal Mahal (Water Palace), and have dinner at Peacock Rooftop.',
          transit: 'Local auto rickshaw.'
        },
        {
          morning: 'Explore the grand Amber Fort ramparts and climb up to Jaigarh Fort.',
          afternoon: 'Lunch at Spice Court. Visit the ancient Panna Meena Ka Kund stepwell.',
          evening: 'Watch the sun set over the Pink City from Nahargarh Fort heights.',
          transit: 'Local cab or auto.'
        }
      ]
    };
  } else if (destLower.includes('mumbai')) {
    data = {
      attractions: ['Gateway of India', 'Marine Drive', 'Juhu Beach', 'Siddhivinayak Temple', 'Bandra Fort', 'Chhatrapati Shivaji Terminus'],
      restaurants: ['Britannia & Co.', 'Leopold Cafe', 'Bademiya', 'Mahesh Lunch Home', 'The Table'],
      foods: ['Pav Bhaji', 'Vada Pav', 'Misal Pav', 'Bombay Sandwich', 'Keema Pav'],
      hotels: budget === 'Budget' ? ['Zostel Mumbai', 'Backpacker Panda Colaba'] :
              budget === 'Luxury' ? ['Taj Mahal Palace', 'Trident Nariman Point'] :
              ['Fariyas Hotel Colaba', 'Hotel Marine Plaza'],
      hiddenGems: ['Banganga Tank ancient water reserve', 'Sewri Mudflats flamingo watching', 'Khotachiwadi heritage village'],
      safetyTips: ['Avoid local train travel during peak rush hours (8-11 AM, 6-9 PM).', 'Keep cash handy for taxi fares.', 'Stay hydrated during humid days.'],
      photographySpots: ['Gateway of India at sunrise', 'Bandra-Worli Sea Link from Bandra Fort', 'Marine Drive curve lights'],
      bestVisitingTime: 'October to March (pleasant breeze and cooler nights)',
      budgetOptimization: 'Travel by Local Train or Metro instead of taxis. Eat street food at Juhu Chowpatty.',
      weather: 'Humid',
      transport: ['Metro', 'Local Train', 'Taxi'],
      dayTemplates: [
        {
          morning: 'Explore the Gateway of India and walk around Colaba area.',
          afternoon: 'Lunch at Leopold Cafe. Shop for souvenirs at Colaba Causeway.',
          evening: 'Stroll along Marine Drive to watch sunset, and dine at Mahesh Lunch Home.',
          transit: 'Local train or cab.'
        },
        {
          morning: 'Visit the historic Chhatrapati Shivaji Terminus (CSMT) and Fort architecture.',
          afternoon: 'Lunch at Britannia & Co. Ride the local train to Bandra.',
          evening: 'Visit Bandra Fort for views of the Sea Link, followed by dinner at The Table.',
          transit: 'Local Train and Auto.'
        }
      ]
    };
  } else if (destLower.includes('delhi')) {
    data = {
      attractions: ['India Gate', 'Red Fort', 'Lotus Temple', 'Qutub Minar', 'Humayun\'s Tomb', 'Chandni Chowk'],
      restaurants: ['Karim\'s', 'Paranthe Wali Gali', 'Bukhara', 'Indian Accent', 'Saravana Bhavan'],
      foods: ['Butter Chicken', 'Chole Bhature', 'Paranthas', 'Dahi Bhalla', 'Tandoori Kebabs'],
      hotels: budget === 'Budget' ? ['Zostel Delhi, Paharganj', 'Smyle Inn Hostel'] :
              budget === 'Luxury' ? ['The Leela Palace', 'ITC Maurya'] :
              ['Connaught Royale Delhi', 'The Park New Delhi'],
      hiddenGems: ['Agrasen ki Baoli stepwell', 'Sanjay Van forest walk', 'Majnu ka Tilla Tibetan colony'],
      safetyTips: ['Use Delhi Metro female-only coaches if traveling alone.', 'Avoid unauthorized tour guides.', 'Keep personal belongings safe in crowded bazaars.'],
      photographySpots: ['Humayun\'s Tomb sandstone symmetry', 'Lotus Temple white marble arches', 'Agrasen ki Baoli steps'],
      bestVisitingTime: 'October to March (glorious cool winter days)',
      budgetOptimization: 'Delhi Metro tourist card for unlimited travel. Dine at Connaught Place canteens.',
      weather: 'Hot/Cold (extreme)',
      transport: ['Metro', 'Cab'],
      dayTemplates: [
        {
          morning: 'Explore Red Fort and enjoy a rickshaw ride through the narrow lanes of Chandni Chowk.',
          afternoon: 'Dine at Paranthe Wali Gali. Visit the serene Agrasen Ki Baoli stepwell.',
          evening: 'Walk around India Gate under the evening lights, followed by dinner at Karim\'s.',
          transit: 'Delhi Metro and walking.'
        },
        {
          morning: 'Visit the ancient Qutub Minar complex and stroll in its manicured gardens.',
          afternoon: 'Lunch at Saravana Bhavan. Shop at Connaught Place and Janpath.',
          evening: 'Visit the majestic Lotus Temple, and have an iconic dinner at Bukhara.',
          transit: 'Delhi Metro.'
        }
      ]
    };
  } else if (destLower.includes('kerala')) {
    data = {
      attractions: ['Munnar', 'Alleppey', 'Thekkady', 'Kumarakom', 'Fort Kochi'],
      restaurants: ['Kashi Art Cafe', 'Grand Pavilion', 'Paragon Restaurant', 'Toddy Shop diners', 'Sree Krishna Inn'],
      foods: ['Kerala Sadya', 'Karimeen Pollichathu', 'Idiyappam with Egg Roast', 'Banana Fritters'],
      hotels: budget === 'Budget' ? ['Zostel Alleppey', 'Munnar Backpackers Cabin'] :
              budget === 'Luxury' ? ['Kumarakom Lake Resort', 'Brunton Boatyard Fort Kochi'] :
              ['Munnar Tea Country Resort', 'Spice Village Thekkady'],
      hiddenGems: ['Marari Beach quiet sands', 'Gavi forest trail', 'Munroe Island canal cruise'],
      safetyTips: ['Book houseboats only from registered operators.', 'Carry mosquito repellent for forest areas.', 'Wear appropriate clothing in temples.'],
      photographySpots: ['Chinese Fishing Nets Fort Kochi sunset', 'Houseboat backwaters', 'Munnar emerald tea garden slopes'],
      bestVisitingTime: 'September to March (cool post-monsoon climate)',
      budgetOptimization: 'Use government public ferries in Alleppey instead of private houseboats.',
      weather: 'Humid',
      transport: ['Houseboat', 'Taxi', 'Auto'],
      dayTemplates: [
        {
          morning: 'Walk Fort Kochi, view Chinese Fishing Nets and historical St. Francis Church.',
          afternoon: 'Lunch at Kashi Art Cafe. Explore Fort Kochi heritage streets.',
          evening: 'Watch a Kathakali show and Kalaripayattu performance, followed by dinner at Grand Pavilion.',
          transit: 'Auto rickshaw or walking.'
        },
        {
          morning: 'Drive to Munnar and tour the sprawling tea gardens.',
          afternoon: 'Enjoy lunch at Munnar resort. Visit the Tea Museum to see tea processing.',
          evening: 'Walk through emerald tea plantations and take scenic photographs.',
          transit: 'Private cab.'
        },
        {
          morning: 'Travel to Alleppey and board a traditional thatched houseboat.',
          afternoon: 'Enjoy a cruise through the backwater canals with traditional fish lunch served onboard.',
          evening: 'Watch sunset over the paddy fields from the houseboat deck, and sleep onboard.',
          transit: 'Houseboat.'
        }
      ]
    };
  } else if (destLower.includes('ladakh') || destLower.includes('leh')) {
    data = {
      attractions: ['Pangong Lake', 'Nubra Valley', 'Khardung La', 'Magnetic Hill', 'Thiksey Monastery', 'Leh Palace'],
      restaurants: ['The Tibetan Kitchen', 'Chopsticks Noodle Bar', 'Bon Appetit', 'Gesemo Restaurant', 'Lamayuru Restaurant'],
      foods: ['Thukpa soup', 'Momos', 'Skyu pasta', 'Butter Tea', 'Khambir bread'],
      hotels: budget === 'Budget' ? ['Zostel Leh', 'Himalayan Homestays'] :
              budget === 'Luxury' ? ['The Grand Dragon Ladakh', 'Gomang Boutique Hotel'] :
              ['Hotel Singge Palace', 'Lharimo Leh'],
      hiddenGems: ['Turtuk Balti village', 'Tso Moriri high lake', 'Basgo Monastery ruins'],
      safetyTips: ['Acclimatize in Leh for 48 hours to avoid high-altitude sickness.', 'Carry warm windcheaters.', 'Drink plenty of water.'],
      photographySpots: ['Deep blue Pangong Lake against mountains', 'Thiksey Monastery valley view', 'Khardung La signboards'],
      bestVisitingTime: 'June to September (warm days, clear skies, and pass roads open)',
      budgetOptimization: 'Join shared taxis at Leh stand to split fuel costs. Choose cozy local homestays.',
      weather: 'Cold',
      transport: ['Bike', 'SUV'],
      dayTemplates: [
        {
          morning: 'Rest for acclimatization. In late morning, visit the historic Leh Palace.',
          afternoon: 'Lunch at Chopsticks. Visit the Shanti Stupa for panoramic Leh views.',
          evening: 'Enjoy momos and thukpa dinner at The Tibetan Kitchen.',
          transit: 'Walk or local taxi.'
        },
        {
          morning: 'Drive through Khardung La pass (highest motorable pass) to Nubra Valley.',
          afternoon: 'Reach Hunder, ride double-humped Bactrian camels across the sand dunes.',
          evening: 'Stay at an eco-camp in Hunder and enjoy a bonfire under the stars.',
          transit: 'Private SUV.'
        },
        {
          morning: 'Travel from Nubra to the stunning Pangong Lake via Shyok route.',
          afternoon: 'Lunch at a lakeside camp. Relax and enjoy the changing lake colors.',
          evening: 'Walk along Pangong shore at sunset, and dine at lakeside camp.',
          transit: 'Private SUV.'
        }
      ]
    };
  } else if (destLower.includes('hampi')) {
    data = {
      attractions: ['Virupaksha Temple', 'Vittala Temple', 'Stone Chariot', 'Lotus Mahal', 'Hampi Bazaar', 'Matanga Hill'],
      restaurants: ['Mango Tree Restaurant', 'Laughing Buddha Cafe', 'Gopi Roof Restaurant', 'Chillout Cafe'],
      foods: ['South Indian Banana Leaf Meal', 'Idli Vada', 'Filter Coffee', 'Mirchi Bajji'],
      hotels: budget === 'Budget' ? ['Hampi Backpackers', 'Gopi Guest House'] :
              budget === 'Luxury' ? ['Evolve Back Kamalapura Palace', 'Shivavilas Palace'] :
              ['Heritage Resort Hampi', 'Hampi\'s Boulders Resort'],
      hiddenGems: ['Sanapur Lake coracle ride', 'Hippie Island trails', 'Anegundi ancient village'],
      safetyTips: ['Hampi involves extensive walking in sun; wear a wide hat and sunscreen.', 'Hire only government-certified guides.', 'Stay hydrated.'],
      photographySpots: ['Stone Chariot symmetry', 'Matanga Hill sunset ruins', 'Lotus Mahal carvings'],
      bestVisitingTime: 'October to March (cooler weather makes exploring ruins pleasant)',
      budgetOptimization: 'Rent a bicycle (₹150/day). Cross the river using shared motor boats.',
      weather: 'Hot/Dry',
      transport: ['Bicycle', 'Auto', 'Walking'],
      dayTemplates: [
        {
          morning: 'Visit the historic active Virupaksha Temple and stroll Hampi Bazaar.',
          afternoon: 'Lunch at Mango Tree. Walk up Hemakuta Hill to see ruins.',
          evening: 'Hike up Matanga Hill for a gorgeous golden sunset, and dine at Gopi Roof.',
          transit: 'Walk and auto.'
        },
        {
          morning: 'Rent a bicycle to visit Vittala Temple and the iconic Stone Chariot.',
          afternoon: 'Lunch at Laughing Buddha. Explore the Lotus Mahal and Elephant Stables.',
          evening: 'Take a scenic coracle boat ride on the Tungabhadra River, followed by dinner at Chillout Cafe.',
          transit: 'Bicycle riding.'
        }
      ]
    };
  } else if (destLower.includes('varanasi')) {
    data = {
      attractions: ['Kashi Vishwanath Temple', 'Dashashwamedh Ghat', 'Assi Ghat', 'Sarnath', 'Manikarnika Ghat'],
      restaurants: ['Blue Lassi Shop', 'Kashi Chat Bhandar', 'Deena Chat Bhandar', 'Brown Bread Bakery'],
      foods: ['Kachori Sabzi', 'Sweet Lassi', 'Banarasi Paan', 'Tamatar Chaat', 'Rabri Malaiyo'],
      hotels: budget === 'Budget' ? ['Zostel Varanasi', 'Hostelna Varanasi'] :
              budget === 'Luxury' ? ['BrijRama Palace (Ghat hotel)', 'Taj Ganges Varanasi'] :
              ['Alka Hotel (Ghat front)', 'Hotel Ganges View'],
      hiddenGems: ['Lolark Kund ancient stepwell', 'Kabir Chaura Math spiritual retreat', 'Vyas Temple cross-river'],
      safetyTips: ['Beware of aggressive vendors and boatmen; negotiate beforehand.', 'Respect cremation privacy at Manikarnika Ghat.', 'Dress conservatively.'],
      photographySpots: ['Ganga Aarti lamps at sunset', 'Sunrise boat silhouettes', 'Assi Ghat sadhus'],
      bestVisitingTime: 'October to March (cool mornings and pleasant breeze on the river)',
      budgetOptimization: 'Take shared autos or walk. Eat street food at Kashi Chat Bhandar.',
      weather: 'Subtropical',
      transport: ['Auto', 'Cycle Rickshaw', 'Walking'],
      dayTemplates: [
        {
          morning: 'Take a magical sunrise boat ride along the Ganges river ghats.',
          afternoon: 'Lunch at Brown Bread Bakery. Stroll through the labyrinth of narrow alleys.',
          evening: 'Attend the grand Ganga Aarti fire ceremony at Dashashwamedh Ghat, followed by dinner at Kashi Chat.',
          transit: 'Cycle rickshaw and walking.'
        },
        {
          morning: 'Visit the sacred Kashi Vishwanath temple (Golden Temple).',
          afternoon: 'Take a short trip to Sarnath (where Buddha gave his first sermon).',
          evening: 'Try the famous sweet lassi at Blue Lassi and eat Banarasi Paan.',
          transit: 'Local auto rickshaw.'
        }
      ]
    };
  } else if (destLower.includes('andaman')) {
    data = {
      attractions: ['Radhanagar Beach', 'Cellular Jail', 'Ross Island', 'Elephant Beach', 'Bharatpur Beach'],
      restaurants: ['Full Moon Cafe', 'Something Different', 'Red Snapper Havelock', 'Anju Coco Resto'],
      foods: ['Seafood Platter', 'Coconut water', 'Grilled Snapper', 'Crab Curry'],
      hotels: budget === 'Budget' ? ['Andaman Backpackers', 'Green Valley Resort'] :
              budget === 'Luxury' ? ['Taj Exotica Resort & Spa', 'Barefoot at Havelock'] :
              ['Symphony Palms Beach Resort', 'Sea Shell Resort Neil'],
      hiddenGems: ['Chidiyatapu sunset point', 'Neil\'s Cove secret lagoon', 'Parrot Island bird flocking'],
      safetyTips: ['Observe swimming safety zones.', 'Do not collect seashells or touch live corals (illegal).', 'Keep watch on ferry timings.'],
      photographySpots: ['Bent tree at Radhanagar Beach', 'Cellular Jail watchtower', 'Neil Island natural bridge'],
      bestVisitingTime: 'October to May (clear warm skies, ideal for water sports)',
      budgetOptimization: 'Book government ferries in advance. Rent scooters on islands.',
      weather: 'Tropical',
      transport: ['Ferry', 'Scooter', 'Cab'],
      dayTemplates: [
        {
          morning: 'Arrive at Port Blair, explore the historical Cellular Jail.',
          afternoon: 'Lunch at a local diner. Take a boat to Ross Island ruins.',
          evening: 'Watch the Cellular Jail Sound & Light show, and dine at Port Blair.',
          transit: 'Ferry and cab.'
        },
        {
          morning: 'Board the early catamaran ferry to Havelock Island.',
          afternoon: 'Check in your hotel, have lunch at Anju Coco. Rest a bit.',
          evening: 'Walk around Radhanagar Beach to witness one of Asia\'s most beautiful sunsets.',
          transit: 'Catamaran ferry and scooter.'
        },
        {
          morning: 'Take a speed boat to Elephant Beach for snorkeling or sea walking.',
          afternoon: 'Enjoy fresh coconut water and lunch at Full Moon Cafe.',
          evening: 'Try a scuba diving session in Havelock reefs, and dine at Red Snapper.',
          transit: 'Speedboat and scooter.'
        }
      ]
    };
  } else {
    // Dynamic fallback generation based on the destination name
    data = {
      attractions: [
        `${capDest} Historic Fort`, `${capDest} Central Museum`, `${capDest} Botanical Gardens`,
        `Scenic ${capDest} Valley Overlook`, `${capDest} Heritage Palace`, `Vibrant ${capDest} Local Bazaar`,
        `Lakeside Promenade in ${capDest}`
      ],
      restaurants: [`${capDest} Royal Spices`, `${capDest} Heritage Kitchen`, `Lakeside Rooftop Cafe in ${capDest}`, `The Curry House`],
      foods: [`Traditional ${capDest} Spiced Thali`, `Local street food platter`, `Freshly brewed regional beverage`],
      hotels: budget === 'Budget' ? [`${capDest} Backpacker Zostel`, `${capDest} City Transit Lodge`] :
              budget === 'Luxury' ? [`${capDest} Grand Palace Heritage Hotel`, `${capDest} Royal Resort & Spa`] :
              [`${capDest} Comfort Inn & Suites`, `${capDest} Scenic Boutique Stay`],
      hiddenGems: [`Secret hilltop sunset spot in ${capDest}`, `Ancient stepwell ruins outside ${capDest}`],
      safetyTips: [`Carry filtered bottled water.`, `Negotiate local taxi/auto rates before embarking.`],
      photographySpots: [`Panoramic views from the ${capDest} hilltop viewpoint`, `Vibrant spices in the local markets`],
      bestVisitingTime: 'October to March is generally the finest weather for sightseeing.',
      budgetOptimization: `Opt for shared auto-rickshaws or public transit. Eat at popular local diners.`,
      weather: 'Temperate/Tropical',
      transport: ['Auto', 'Cab', 'Walking'],
      dayTemplates: [
        {
          morning: `Visit the famous ${capDest} Historic Fort. Climb to the ramparts for a bird's eye view.`,
          afternoon: `Enjoy lunch at ${capDest} Heritage Kitchen. Afterward, explore the ${capDest} Central Museum.`,
          evening: `Stroll through the ${capDest} Local Bazaar, taste local food, and enjoy dinner at Lakeside Rooftop Cafe.`,
          transit: `Walk or take a local auto rickshaw.`
        },
        {
          morning: `Visit the tranquil ${capDest} Botanical Gardens to enjoy local flora and peaceful paths.`,
          afternoon: `Dine at ${capDest} Royal Spices for lunch. Check out the ancient stepwell ruins nearby.`,
          evening: `Head to the scenic ${capDest} Valley Overlook for sunset. Relish dinner at The Curry House.`,
          transit: `Hire a local taxi.`
        }
      ]
    };
  }

  const days = [];
  const templates = data.dayTemplates || [];
  for (let i = 1; i <= numberOfDays; i++) {
    const template = templates[(i - 1) % templates.length] || {
      morning: `Visit the famous ${data.attractions[(i * 2 - 2) % data.attractions.length]}. Stroll around and admire the details while capturing photos in the soft morning light.`,
      afternoon: `Head to ${data.restaurants[(i * 2 - 2) % data.restaurants.length]} for lunch. Spend your afternoon exploring the ${data.attractions[(i * 2 - 1) % data.attractions.length]}.`,
      evening: `Enjoy a delicious dinner at ${data.restaurants[(i * 2 - 1) % data.restaurants.length]}. Conclude your evening with a pleasant stroll and soak in the vibrant atmosphere.`,
      transit: `Ideal to travel by local ${data.transport ? data.transport[0] : 'transport'}.`
    };

    const attraction1 = data.attractions[(i * 2 - 2) % data.attractions.length] || `${capDest} Landmark A`;
    const attraction2 = data.attractions[(i * 2 - 1) % data.attractions.length] || `${capDest} Landmark B`;
    const rest1 = data.restaurants[(i * 2 - 2) % data.restaurants.length] || `${capDest} Eatery A`;
    const rest2 = data.restaurants[(i * 2 - 1) % data.restaurants.length] || `${capDest} Eatery B`;
    const food1 = data.foods[(i - 1) % data.foods.length] || 'Local Specialty';
    const food2 = data.foods[i % data.foods.length] || 'Traditional Dish';

    let dayMorning, dayAfternoon, dayEvening;
    let transportTips;

    // Inject realistic hours in the description!
    if (destLower.includes('goa') || destLower.includes('andaman')) {
      dayMorning = `09:00 AM: ${template.morning}`;
      dayAfternoon = `01:00 PM: ${template.afternoon}`;
      dayEvening = `06:00 PM: ${template.evening}`;
      transportTips = `Scooter or local taxi is perfect. ${template.transit}`;
    } else if (destLower.includes('ladakh')) {
      dayMorning = `07:30 AM: ${template.morning}`;
      dayAfternoon = `12:30 PM: ${template.afternoon}`;
      dayEvening = `05:30 PM: ${template.evening}`;
      transportTips = `SUV or heavy bike. ${template.transit}`;
    } else if (destLower.includes('delhi')) {
      dayMorning = `08:30 AM: ${template.morning}`;
      dayAfternoon = `01:30 PM: ${template.afternoon}`;
      dayEvening = `06:30 PM: ${template.evening}`;
      transportTips = `Delhi Metro is fast. ${template.transit}`;
    } else if (destLower.includes('mumbai')) {
      dayMorning = `08:00 AM: ${template.morning}`;
      dayAfternoon = `01:00 PM: ${template.afternoon}`;
      dayEvening = `07:00 PM: ${template.evening}`;
      transportTips = `Local train and metro are best. ${template.transit}`;
    } else if (destLower.includes('manali')) {
      dayMorning = `08:30 AM: ${template.morning}`;
      dayAfternoon = `01:00 PM: ${template.afternoon}`;
      dayEvening = `06:00 PM: ${template.evening}`;
      transportTips = `Private cab or taxi. ${template.transit}`;
    } else {
      dayMorning = `09:00 AM: ${template.morning}`;
      dayAfternoon = `01:30 PM: ${template.afternoon}`;
      dayEvening = `06:30 PM: ${template.evening}`;
      transportTips = template.transit;
    }

    days.push({
      dayNumber: i,
      morningPlan: dayMorning,
      afternoonPlan: dayAfternoon,
      eveningPlan: dayEvening,
      recommendedAttractions: [attraction1, attraction2],
      restaurants: [rest1, rest2],
      localFood: [food1, food2],
      transportationTips: transportTips,
      estimatedDailyBudget: Math.round(baseBudget * (0.8 + (i % 3) * 0.2)),
    });
  }

  const travelTips = [
    `Carry dynamic maps and offline coordinates of ${destination} in advance.`,
    `Tipping around 10% is customary at local restaurants.`,
    `Try starting your days early to beat the main crowd at the core attractions.`,
    `Check weather forecasts daily; carry appropriate clothing matching the ${data.weather || 'local'} climate.`
  ];

  const samplePacking = {
    'Solo': ['Light daypack', 'Reusable water bottle', 'Local transit card', 'Comfortable walking sneakers', 'Compact umbrella'],
    'Family': ['Travel first aid kit', 'Snacks for the road', 'Kid-friendly entertainment/tablet', 'Wet wipes & sanitizers', 'Camera'],
    'Couple': ['Stylish evening wear', 'Travel-size perfumes', 'Light jacket', 'Sunglasses', 'Shared power bank'],
    'Friends': ['Multi-port charger', 'Portable Bluetooth speaker', 'Casual activewear', 'Card games', 'Hydroflask'],
    'Business': ['Laptop & chargers', 'Business casual outfits', 'Notebook & pen', 'Travel steamer', 'Noise-cancelling headphones']
  };
  const basePacking = ['Passport & visa', 'Credit cards & cash', 'Mobile phone & charger', 'Toothbrush & toiletries', 'Comfortable walking shoes'];
  const typePacking = samplePacking[trip.tripType] || samplePacking.Solo;
  const packingList = [...basePacking, ...typePacking];

  return {
    days,
    travelTips,
    packingList,
    hotels: data.hotels || [],
    hiddenGems: data.hiddenGems || [],
    safetyTips: data.safetyTips || [],
    photographySpots: data.photographySpots || [],
    bestVisitingTime: data.bestVisitingTime || '',
    budgetOptimization: data.budgetOptimization || ''
  };
};

module.exports = {
  generateItinerary,
};
