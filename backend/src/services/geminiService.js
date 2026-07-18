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

Return ONLY a JSON object that adheres strictly to the following schema. Do NOT wrap the JSON in Markdown code fences or formatting.
Schema:
{
  "days": [
    {
      "dayNumber": 1,
      "morningPlan": "Detail morning plans, sights, activities.",
      "afternoonPlan": "Detail afternoon plans, sights, activities.",
      "eveningPlan": "Detail evening plans, nightlife, dinners.",
      "recommendedAttractions": ["Attraction A", "Attraction B"],
      "restaurants": ["Restaurant name (Brief note)"],
      "localFood": ["Specific dish/food to try in this city"],
      "transportationTips": "Specific tip on getting around this day",
      "estimatedDailyBudget": 4500 (approx. INR amount, number only)
    }
  ],
  "travelTips": [
    "Tip 1",
    "Tip 2",
    "Tip 3"
  ],
  "packingList": [
    "Packing item 1",
    "Packing item 2",
    "Packing item 3"
  ],
  "hotels": [
    "Hotel option 1 (Brief description)",
    "Hotel option 2 (Brief description)",
    "Hotel option 3 (Brief description)"
  ],
  "hiddenGems": [
    "Hidden local attraction 1",
    "Hidden local attraction 2"
  ],
  "safetyTips": [
    "Safety recommendation 1",
    "Safety recommendation 2"
  ],
  "photographySpots": [
    "Scenic photo spot 1",
    "Scenic photo spot 2"
  ],
  "bestVisitingTime": "Best season, months, or morning hours to explore this region",
  "budgetOptimization": "Specific recommendations on transit passes, budget homestays, and street food to save money"
}
Ensure that all day numbers from 1 to ${daysCount} are included in the 'days' array. The budget should correspond to the ${budgetText} tier. Keep output localized, realistic, and specific to ${destination}.
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
  const { destination, country, numberOfDays, budget } = trip;
  
  const dailyBudgets = {
    'Budget': 1500,
    'Moderate': 4000,
    'Luxury': 12000,
  };
  const baseBudget = dailyBudgets[budget] || 3000;
  
  const destLower = destination.toLowerCase();

  let sampleAttractions = [];
  let sampleRestaurants = [];
  let sampleFoods = [];
  let hotels = [];
  let hiddenGems = [];
  let safetyTips = [];
  let photographySpots = [];
  let bestVisitingTime = '';
  let budgetOptimization = '';

  if (destLower.includes('goa')) {
    sampleAttractions = ['Calangute Beach coastline', 'Basilica of Bom Jesus', 'Fort Aguada lighthouse', 'Dudhsagar Waterfalls', 'Anjuna Flea Market', 'Baga Beach shacks', 'Mangueshi Temple'];
    sampleRestaurants = ['Britto\'s Beach Shack', 'Curlies Vagator', 'Gunpowder Restaurant', 'Thalassa Greek Tavern', 'Fisherman\'s Wharf'];
    sampleFoods = ['Goan fish curry rice', 'Pork vindaloo stew', 'Bebinca multi-layered cake', 'Chicken cafreal grill', 'Feni heritage cocktail'];

    hotels = budget === 'Budget' ? ['Zostel Goa, Vagator (Social hostel)', 'Roadhouse Backpackers Stay'] :
             budget === 'Luxury' ? ['Taj Exotica Resort Benaulim (Luxury royal style)', 'W Goa, Vagator'] :
             ['Cidade de Goa Heritage Resort', 'Goan Heritage Resort Calangute'];

    hiddenGems = ['Cola Beach freshwater lagoon', 'Chorao Island mangrove bird sanctuary', 'Netravali Bubble Lake'];
    safetyTips = ['Avoid swimming in beaches during high tide flags.', 'Rent two-wheelers only from licensed black-yellow plate vendors.', 'Respect local silence rules in churches and heritage spots.'];
    photographySpots = ['Fort Aguada panoramic sea viewpoint', 'Fontainhas Latin Quarter colorful Portuguese corridors', 'Dudhsagar waterfall bridge crossings'];
    bestVisitingTime = 'November to February is the finest time, featuring cool breezes, vibrant night markets, and beach parties.';
    budgetOptimization = 'Rent a local scooter (₹400/day) instead of booking private cabs. Dine at local beach shacks to save up to ₹1,500 daily.';
  } else if (destLower.includes('jaipur')) {
    sampleAttractions = ['Amber Palace & Fortress', 'Hawa Mahal Palace of Winds', 'City Palace museum', 'Jantar Mantar Observatory', 'Nahargarh Fort ramparts', 'Birla Mandir Temple'];
    sampleRestaurants = ['Laxmi Mishthan Bhandar (LMB)', 'Rawat Sweets & Restaurant', 'Peacock Rooftop Resto', 'Spice Court Jaipur', 'Suvarna Mahal Palace Dining'];
    sampleFoods = ['Dal Baati Churma royal platter', 'Pyaaz Kachori pastries', 'Gatte ki Sabzi curry', 'Lal Maas spiced lamb', 'Mawa Kachori dessert'];

    hotels = budget === 'Budget' ? ['Zostel Jaipur, Old City (Vibrant hostel)', 'Pearl Palace Backpacker Lodge'] :
             budget === 'Luxury' ? ['Rambagh Palace (5-star heritage royalty)', 'ITC Rajputana Jaipur'] :
             ['Umaid Bhawan Boutique Hotel', 'Pearl Palace Heritage Stay'];

    hiddenGems = ['Panna Meena ka Kund ancient stepwell', 'Galta Ji natural water monkey temple', 'Amer Fort backwall sunrise trail'];
    safetyTips = ['Negotiate prices with local auto rickshaw drivers beforehand.', 'Buy the composite monuments ticket to save entry fees.', 'Beware of pushy jewelry and gemstone vendors.'];
    photographySpots = ['Hawa Mahal street face facade', 'Patrika Gate pink heritage columns', 'Sunset panoramas from Nahargarh Fort heights'];
    bestVisitingTime = 'October to March offers cool desert climate, perfect for exploring fort ramparts and palaces.';
    budgetOptimization = 'Buy a composite entry ticket (covers Amber, Hawa Mahal, Albert Hall) for major savings. Eat delicious Pyaaz Kachoris at Rawat for under ₹100.';
  } else if (destLower.includes('manali')) {
    sampleAttractions = ['Solang Valley adventure point', 'Hadimba Devi pine temple', 'Jogini Waterfalls trail', 'Rohtang Pass snow lookout', 'Old Manali Cafe Street', 'Vashisht Hot Water Springs'];
    sampleRestaurants = ['The Johnson\'s Cafe & Lodge', 'Cafe 1947 (Old Manali)', 'Lazy Dog Riverside Cafe', 'Il Forno Italian Woodfire', 'Chopsticks Tibetan Diner'];
    sampleFoods = ['Steamed Siddu with ghee', 'Fresh pan-fried trout fish', 'Kadhi Chawal comfort bowl', 'Hot Tibetan thukpa noodles', 'Apple honey brew'];

    hotels = budget === 'Budget' ? ['Zostel Manali, Old Town (Social hostel)', 'Alt Life Backpacker Hub'] :
             budget === 'Luxury' ? ['Span Resort & Spa (Luxury riverside villas)', 'The Solang Valley Resort'] :
             ['Manu Allaya Resort & Spa', 'The Johnson Lodge Boutique Stay'];

    hiddenGems = ['Sajla waterfall secret pool', 'Hampta Pass glacier base camp', 'Soyal village heritage wooden houses'];
    safetyTips = ['Check Rohtang Pass permit rules online in advance.', 'Avoid driving in snow or heavy rainfall landslide weather.', 'Keep warm jackets ready even in summers.'];
    photographySpots = ['Rohtang snow line range panorama', 'Hadimba pine forest paths', 'Jogini waterfall mist bridge'];
    bestVisitingTime = 'October to June is recommended. Go in winter for snow sports, or summer to escape plains heat.';
    budgetOptimization = 'Use shared local shuttle buses instead of private SUVs to commute to Solang. Old Manali offers budget stays starting at ₹600/night.';
  } else {
    // Default generic but REAL Indian travel options
    sampleAttractions = ['Central Historic Palace Museum', 'Vibrant Local Artisans Bazaar', 'Scenic Sunset Hill Vista', 'Eco Botanical Gardens', 'Local Heritage Cathedral'];
    sampleRestaurants = ['The Saffron Kitchen', 'Traditional Spice Court', 'Lakeside Rooftop Cafe', 'Grand Raj Family Diner', 'Royal Heritage Kitchen'];
    sampleFoods = ['Regional Special Spiced Thali', 'Street Chat & Sweet Pastries', 'Fragrant Filter Coffee', 'Slow-cooked Stew & Rice', 'Tandoori Platters'];

    hotels = budget === 'Budget' ? ['Local Backpacker Zostel (Social shared rooms)', 'Clean City Transit Lodge'] :
             budget === 'Luxury' ? ['Grand Palace Heritage Hotel (5-star luxury)', 'The Royal Resort & Spa'] :
             ['Comfort Inn & Suites', 'Scenic Boutique Heritage Stay'];

    hiddenGems = ['Ancient stepwell ruins', 'Scenic hilltop sunset clearing', 'Quiet local lake reserve'];
    safetyTips = ['Carry a reusable water bottle; consume filtered water only.', 'Keep offline navigation coordinates downloaded on mobile.', 'Always seek permission before photographing people or temple interiors.'];
    photographySpots = ['Heritage entrance arches', 'Vibrant marketplace spices', 'Panoramic hilltop vantage views'];
    bestVisitingTime = 'October to March is generally the finest sightseeing weather across most Indian destinations.';
    budgetOptimization = 'Opt for shared auto-rickshaws or local buses. Enjoy meals at popular local diners which cost less than ₹200.';
  }

  const days = [];
  for (let i = 1; i <= numberOfDays; i++) {
    const attraction1 = sampleAttractions[(i * 2 - 2) % sampleAttractions.length];
    const attraction2 = sampleAttractions[(i * 2 - 1) % sampleAttractions.length];
    const rest1 = sampleRestaurants[(i * 2 - 2) % sampleRestaurants.length];
    const rest2 = sampleRestaurants[(i * 2 - 1) % sampleRestaurants.length];
    const food1 = sampleFoods[(i - 1) % sampleFoods.length];
    const food2 = sampleFoods[i % sampleFoods.length];

    days.push({
      dayNumber: i,
      morningPlan: `Start your morning by visiting the famous ${attraction1}. Stroll around and admire the details while capturing photos in the soft morning light.`,
      afternoonPlan: `Head to ${rest1} for a delicious lunch. Spend your afternoon exploring the ${attraction2}, diving deep into the local history and exhibits.`,
      eveningPlan: `Enjoy an elegant dinner at ${rest2}. Conclude your evening with a pleasant stroll and soak in the vibrant atmosphere.`,
      recommendedAttractions: [attraction1, attraction2],
      restaurants: [rest1, rest2],
      localFood: [food1, food2],
      transportationTips: `Ideal to travel by ${trip.transportPreference || 'Public Transit'} for this route. Consider buying a daily travel pass to save costs.`,
      estimatedDailyBudget: Math.round(baseBudget * (0.8 + Math.random() * 0.4)),
    });
  }

  const travelTips = [
    `Always carry a refillable water bottle, and note that tipping around 10% is customary at local restaurants.`,
    `Download offline maps of ${destination} on Google Maps in advance to save mobile data.`,
    `Try starting your days early (before 9:00 AM) to beat the main crowd at the core attractions.`,
    `Check weather forecasts daily; carry a compact umbrella if there is any chance of rain.`
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
    hotels,
    hiddenGems,
    safetyTips,
    photographySpots,
    bestVisitingTime,
    budgetOptimization
  };
};

module.exports = {
  generateItinerary,
};
