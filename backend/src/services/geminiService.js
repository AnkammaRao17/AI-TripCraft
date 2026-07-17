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
  ]
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
  
  const sampleAttractions = [
    'Historic Old Town & Central Square',
    'Main Museum of Fine Arts',
    'Panoramic City Hill Lookout',
    'Botanical Gardens & Riverside Walk',
    'Local Cathedral & Landmark Bridge',
    'Artisanal Street Market',
    'Cultural Arts Theater & Opera House'
  ];
  
  const sampleRestaurants = [
    'La Petit Bistro (French fusion)',
    'The Green Garden Cafe (Organic salads)',
    'Traditional Tavern (Local recipes)',
    'The View Rooftop (Cocktails and skewers)',
    'Street Food Stalls (Quick snacks)',
    'Mama\'s Kitchen (Homemade traditional food)'
  ];

  const sampleFoods = [
    'Traditional baked pastries',
    'Slow-cooked local stew',
    'Savory street dumplings',
    'Freshly ground local roast coffee',
    'Artisanal honey and cheeses'
  ];

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
      morningPlan: `Start your morning by visiting the famous ${attraction1}. Stroll around and admire the architectural details while capturing photos in the soft morning light.`,
      afternoonPlan: `Head to ${rest1} for a delicious lunch. Spend your afternoon exploring the ${attraction2}, diving deep into the local history and exhibits.`,
      eveningPlan: `Enjoy an elegant dinner at ${rest2}. Conclude your evening with a pleasant stroll along the active district and soak in the vibrant atmosphere.`,
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

  const sampleHotels = {
    'Budget': [`Backpackers Central Hostel (Social, shared rooms near core transit)`, `Eco City Lodge (Private basic rooms)`, `Youth Travel Stay (Clean budget rooms)`],
    'Moderate': [`Grand Plaza Hotel (Comfortable suites, central location)`, `Scenic Boutique Inn (Quaint local style)`, `Comfort Suites & Spa (Pool and gym included)`],
    'Luxury': [`The Ritz Grand Resort (5-star luxury, rooftop pools, premium spa)`, `Luxe Palace & Towers (Historic landmark hotel)`, `Vanderbilt Five-Star Hotel (Private butler service)`]
  };
  const hotels = sampleHotels[budget] || sampleHotels.Moderate;

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
    hotels
  };
};

module.exports = {
  generateItinerary,
};
