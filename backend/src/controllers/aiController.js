const { GoogleGenerativeAI } = require('@google/generative-ai');
const Trip = require('../models/Trip');
const Itinerary = require('../models/Itinerary');
const logger = require('../utils/logger');
const ApiResponse = require('../utils/apiResponse');
const { getDestinationImageUrl } = require('../config/destinationImages');

// Initialize Gemini API client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    logger.warn('GEMINI_API_KEY is not configured or uses placeholder. Using mock AI services.');
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
};

/**
 * Interactive Travel Assistant Chat
 * POST /api/ai/chat
 */
exports.chatAssistant = async (req, res, next) => {
  try {
    const { message, tripId, chatHistory } = req.body;
    if (!message) {
      return res.status(400).json(ApiResponse.error('Message is required.'));
    }

    const client = getGeminiClient();
    let trip = null;
    let itinerary = null;

    if (tripId) {
      trip = await Trip.findById(tripId);
      itinerary = await Itinerary.findOne({ trip: tripId });
    }

    // A. Gemini API is active
    if (client) {
      try {
        const model = client.getGenerativeModel({
          model: 'gemini-1.5-flash',
          generationConfig: { responseMimeType: 'application/json' }
        });

        let prompt = '';
        if (trip && itinerary) {
          prompt = `
You are a helpful travel assistant for AI TripCraft. The user is currently viewing their itinerary to ${trip.destination}, ${trip.country}.
Active Trip Config: ${JSON.stringify(trip)}
Active Itinerary Config: ${JSON.stringify(itinerary)}

User message: "${message}"

Answer the user's question, offer suggestions, or if the user requests changes (like changing budget tier, shortening/extending days, adding/removing attractions, changing hotel/restaurant), reply with an updated itinerary structure.

Return ONLY a JSON object that adheres strictly to the following schema. Do NOT wrap the JSON in Markdown code fences or formatting.
{
  "reply": "Your conversational answer here...",
  "modified": true/false,
  "tripUpdates": {
    "budget": "Budget|Moderate|Luxury" (optional),
    "numberOfDays": 5 (optional),
    "transportPreference": "Public Transit|Car Rental|Walking|Flights|Taxi" (optional),
    "hotelPreference": "Hostel|Hotel|Resort|Airbnb|None" (optional)
  },
  "itineraryUpdates": {
    "days": [
      {
        "dayNumber": 1,
        "morningPlan": "...",
        "afternoonPlan": "...",
        "eveningPlan": "...",
        "recommendedAttractions": [],
        "restaurants": [],
        "localFood": [],
        "transportationTips": "...",
        "estimatedDailyBudget": 4000
      }
    ],
    "travelTips": [],
    "packingList": [],
    "hotels": []
  }
}
If modified is true, ensure tripUpdates or itineraryUpdates are populated. If extending/shortening trip, adjust the days list count accordingly.
`;
        } else {
          prompt = `
You are a helpful travel assistant for AI TripCraft.
User message: "${message}"
Chat History: ${JSON.stringify(chatHistory || [])}

Provide helpful travel suggestions, recommendations, or travel itineraries.
Return ONLY a JSON object that adheres strictly to the following schema. Do NOT wrap the JSON in Markdown code fences or formatting.
{
  "reply": "Your conversational answer here...",
  "modified": false
}
`;
        }

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();
        let parsed = JSON.parse(text);

        // Process database updates if AI requested changes
        if (parsed.modified && trip && itinerary) {
          if (parsed.tripUpdates) {
            Object.assign(trip, parsed.tripUpdates);
            await trip.save();
          }
          if (parsed.itineraryUpdates) {
            Object.assign(itinerary, parsed.itineraryUpdates);
            await itinerary.save();
          }
        }

        return res.status(200).json(ApiResponse.success('AI responded successfully.', parsed));

      } catch (geminiError) {
        logger.error(`Gemini Chat error: ${geminiError.message}`);
        // Fall through to mock logic on error
      }
    }

    // B. Fallback mock assistant logic
    let reply = "I am here to guide you! How can I help you customize your trip?";
    let modified = false;
    let tripUpdates = {};
    let itineraryUpdates = {};

    const lowMsg = message.toLowerCase();

    if (trip && itinerary) {
      if (lowMsg.includes('budget') || lowMsg.includes('cheaper') || lowMsg.includes('save')) {
        reply = "I've optimized your itinerary for a lighter budget tier. Lodgings and restaurants are adjusted to budget friendly options!";
        modified = true;
        tripUpdates.budget = 'Budget';
        
        // Lower daily budgets in itinerary
        const updatedDays = itinerary.days.map(day => ({
          ...day.toObject(),
          estimatedDailyBudget: Math.round(day.estimatedDailyBudget * 0.6)
        }));
        itineraryUpdates.days = updatedDays;
        
      } else if (lowMsg.includes('extend') || lowMsg.includes('longer')) {
        const currentDays = trip.numberOfDays;
        const targetDays = currentDays + 1;
        reply = `I have extended your trip to ${targetDays} days and added sightseeing recommendations for the extra day!`;
        modified = true;
        tripUpdates.numberOfDays = targetDays;
        
        const extraDay = {
          dayNumber: targetDays,
          morningPlan: 'Visit local historical monuments and explore local art museums.',
          afternoonPlan: 'Dine at a highly recommended traditional diner and stroll through local markets.',
          eveningPlan: 'Relax at a scenic park or garden lake, catching the sunset.',
          recommendedAttractions: ['Local Heritage Landmark', 'Handicraft Market'],
          restaurants: ['Classic Spice Family Restaurant'],
          localFood: ['Traditional street sweets'],
          transportationTips: 'Public transit and walks are suggested.',
          estimatedDailyBudget: 3500
        };
        itineraryUpdates.days = [...itinerary.days.map(d => d.toObject()), extraDay];

      } else if (lowMsg.includes('restaurant') || lowMsg.includes('food') || lowMsg.includes('vegetarian')) {
        reply = "I've added highly-rated local restaurants and popular street food spots matching your dietary tastes!";
        modified = true;
        // Inject a vegetarian food and restaurant to Day 1
        if (itinerary.days.length > 0) {
          const updatedDays = [...itinerary.days.map(d => d.toObject())];
          updatedDays[0].restaurants = ['Shree Balaji Pure Veg', ...updatedDays[0].restaurants];
          updatedDays[0].localFood = ['Pure veg thali', ...updatedDays[0].localFood];
          itineraryUpdates.days = updatedDays;
        }
      } else {
        reply = `Here are details for ${trip.destination}: The weather is pleasant. Make sure to carry comfortable walking shoes, keep digital copies of your tickets, and check opening hours online.`;
      }
    } else {
      if (lowMsg.includes('honeymoon')) {
        reply = "For an exquisite honeymoon, I highly recommend Udaipur (the City of Lakes), Kashmir (the Paradise on Earth), or Kerala's backwater houseboats. They offer premium resorts, private scenic boat rides, and romantic dinners.";
      } else if (lowMsg.includes('july') || lowMsg.includes('monsoon')) {
        reply = "In July, the finest places to visit are Ladakh (for spectacular weather and zero monsoon disruptions), Valley of Flowers in Uttarakhand, or Lonavala for lush green hills.";
      } else {
        reply = "Sure! I can help you plan. You can ask me about recommended spots, budget tips, packing guidelines, or weather updates.";
      }
    }

    // Save mock updates if modified
    if (modified && trip && itinerary) {
      if (Object.keys(tripUpdates).length > 0) {
        Object.assign(trip, tripUpdates);
        await trip.save();
      }
      if (Object.keys(itineraryUpdates).length > 0) {
        Object.assign(itinerary, itineraryUpdates);
        await itinerary.save();
      }
    }

    return res.status(200).json(ApiResponse.success('Mock AI response.', {
      reply,
      modified,
      tripUpdates,
      itineraryUpdates
    }));

  } catch (err) {
    next(err);
  }
};

/**
 * AI Destination Recommendation Engine
 * POST /api/ai/recommend
 */
exports.recommendDestinations = async (req, res, next) => {
  try {
    const { month, budget, tripType } = req.body;
    const client = getGeminiClient();

    const m = month || 'any month';
    const b = budget || 'Moderate';
    const t = tripType || 'Solo';

    if (client) {
      try {
        const model = client.getGenerativeModel({
          model: 'gemini-1.5-flash',
          generationConfig: { responseMimeType: 'application/json' }
        });

        const prompt = `
Recommend exactly 3 travel destinations in India for a trip in "${m}" with a "${b}" budget tier, suitable for a "${t}" trip style.
For each destination, return:
1. City name
2. State name
3. Image URL (Use a high quality Unsplash travel image)
4. Description
5. Why AI recommends it (detailed rationale)
6. Best time to visit

Return ONLY a JSON array adhering strictly to this schema:
[
  {
    "name": "Jaipur",
    "state": "Rajasthan",
    "imageUrl": "https://images.unsplash.com/photo-...",
    "description": "...",
    "reason": "...",
    "bestTime": "..."
  }
]
Do NOT wrap the JSON in Markdown code fences.
`;
        const result = await model.generateContent(prompt);
        const text = (await result.response).text().trim();
        const parsed = JSON.parse(text);
        return res.status(200).json(ApiResponse.success('AI recommendations compiled.', parsed));
      } catch (e) {
        logger.error(`Gemini Recommend error: ${e.message}`);
      }
    }

    // Mock recommendations matching parameters
    const mockRecs = [
      {
        name: 'Jaipur',
        state: 'Rajasthan',
        imageUrl: getDestinationImageUrl('Jaipur'),
        description: 'The historic Pink City, home to Royal Forts and Palaces.',
        reason: `Ideal for a ${t} style trip in ${m} because of the vibrant bazars, budget options matching ${b} tier, and historical heritage exploration.`,
        bestTime: 'October to March'
      },
      {
        name: 'Manali',
        state: 'Himachal Pradesh',
        imageUrl: getDestinationImageUrl('Manali'),
        description: 'Spectacular mountain valleys with adventure sports and snow views.',
        reason: `Perfect for outdoor activity and nature lovers looking for cool temperatures. Fits a ${b} budget tier.`,
        bestTime: 'September to June'
      },
      {
        name: 'Kashmir',
        state: 'Jammu & Kashmir',
        imageUrl: getDestinationImageUrl('Kashmir'),
        description: 'Stunning landscapes, serene lakes, houseboats and snow capped meadows.',
        reason: 'Offers breathtaking alpine meadows, Dal Lake shikhara rides and highly scenic stays.',
        bestTime: 'March to October'
      }
    ];

    return res.status(200).json(ApiResponse.success('Mock recommendations.', mockRecs));
  } catch (err) {
    next(err);
  }
};

/**
 * AI Personal Travel Insights
 * GET /api/ai/insights
 */
exports.getInsights = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const trips = await Trip.find({ user: userId }).sort({ createdAt: -1 }).limit(5);

    const client = getGeminiClient();

    if (client) {
      try {
        const model = client.getGenerativeModel({
          model: 'gemini-1.5-flash',
          generationConfig: { responseMimeType: 'application/json' }
        });

        const prompt = `
Based on these recent travel trips of a user: ${JSON.stringify(trips)}, generate a highly comprehensive list of personalized travel insights, warnings, and guidelines.
You must return exactly 13 items covering:
1. Trip summary / overview of the user's travel pattern.
2. Money saving tips.
3. Best route suggestions.
4. Weather warnings.
5. Crowd prediction metrics.
6. Local festivals & cultural events.
7. Travel advisories.
8. Recommended departure times.
9. Hotel style suggestions.
10. Restaurant/cuisine recommendations.
11. Packing list recommendations.
12. Health & hydration advice.
13. Regional emergency safety contacts.

Return ONLY a JSON array adhering to this schema:
[
  {
    "type": "summary|saving|route|warning|crowd|festival|advisory|departure|hotel|restaurant|packing|health|emergency",
    "text": "Detailed insight statement here..."
  }
]
`;
        const result = await model.generateContent(prompt);
        const text = (await result.response).text().trim();
        const parsed = JSON.parse(text);
        return ApiResponse.success(res, 'AI Insights compiled.', parsed);
      } catch (e) {
        logger.error(`Gemini Insights error: ${e.message}`);
      }
    }

    // Fallback Mock insights
    const mockInsights = [
      { type: 'summary', text: 'Trip Summary: Your travel patterns show a preference for scenic coastal and historical heritage zones with family groups.' },
      { type: 'saving', text: 'Money Saving: Opting for local homestays or Airbnb options instead of 5-star chains can save up to ₹9,800 on average duration trips.' },
      { type: 'route', text: 'Best Route: Prioritize state highway expressways and local train linkages to avoid metropolitan traffic grids.' },
      { type: 'warning', text: 'Weather Warning: Active monsoons in Southern and Himalayan regions can trigger landslides and route diversions. Check updates daily.' },
      { type: 'crowd', text: 'Crowd Prediction: Visited heritage spots peak in footfall between 11 AM - 3 PM. Plan key visits early at 8:00 AM.' },
      { type: 'festival', text: 'Local Festivals: Diwali and Dussehra celebrations will bring vibrant street decorations but also peak booking demands across India.' },
      { type: 'advisory', text: 'Travel Advisory: Pre-download offline regional maps on your device before entering mountainous forest reserves.' },
      { type: 'departure', text: 'Best Departure: Depart for highways before 6:00 AM to beat commercial transport trucks and traffic tolls.' },
      { type: 'hotel', text: 'Hotel Suggestion: Seek heritage guest lodges or certified backpacker hostels for high rating reviews and social events.' },
      { type: 'restaurant', text: 'Restaurant Suggestion: Dine at highly verified family kitchens and local dhabas for fresh regional recipes under ₹200.' },
      { type: 'packing', text: 'Packing Advice: Ensure you pack high-capacity battery power banks, quick-dry activewear, and sturdy trail walking shoes.' },
      { type: 'health', text: 'Health Advice: Drink bottled mineral water exclusively; carry rehydration tablets and a personal first-aid kit.' },
      { type: 'emergency', text: 'Emergency Contacts: Tourist police support desk line is active at 112; keep local hospital directories handy.' }
    ];

    return ApiResponse.success(res, 'AI Insights.', mockInsights);
  } catch (err) {
    next(err);
  }
};

/**
 * AI Smart Budget Optimizer
 * GET /api/ai/budget-tips
 */
exports.getBudgetTips = async (req, res, next) => {
  try {
    const { tripId } = req.query;
    if (!tripId) {
      return res.status(400).json(ApiResponse.error('tripId is required.'));
    }

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json(ApiResponse.error('Trip not found.'));
    }

    const client = getGeminiClient();

    if (client) {
      try {
        const model = client.getGenerativeModel({
          model: 'gemini-1.5-flash',
          generationConfig: { responseMimeType: 'application/json' }
        });

        const prompt = `
For this trip to ${trip.destination}, ${trip.country} (Budget Tier: ${trip.budget}, ${trip.numberOfDays} days, ${trip.numberOfTravelers} travelers), generate:
1. 3 budget saving tips.
2. 2 luxury upgrade options.
3. Cheaper local alternatives.

Return ONLY a JSON object adhering strictly to this schema:
{
  "savingTips": ["Tip 1", "Tip 2", "Tip 3"],
  "luxuryUpgrades": ["Upgrade 1", "Upgrade 2"],
  "alternatives": "Brief text on cheaper local dining or stays"
}
`;
        const result = await model.generateContent(prompt);
        const text = (await result.response).text().trim();
        const parsed = JSON.parse(text);
        return res.status(200).json(ApiResponse.success('AI Budget tips compiled.', parsed));
      } catch (e) {
        logger.error(`Gemini Budget tips error: ${e.message}`);
      }
    }

    // Fallback Mock budget tips
    const mockBudgetTips = {
      savingTips: [
        'Hire local auto rickshaws or e-rickshaws instead of booking direct private taxi cabs.',
        'Savor delicious authentic street foods and local family dhabas which cost under ₹200 per meal.',
        'Secure sightseeing entry tickets online in advance to bypass long queue convenience fees.'
      ],
      luxuryUpgrades: [
        'Treat yourself to a dinner at a royal heritage lake-view palace restaurant.',
        'Book a boutique private pool villa stay for one night.'
      ],
      alternatives: 'Instead of staying directly in premium center districts, seek lodgings 1-2 km away near transit routes to save up to 40%.'
    };

    return res.status(200).json(ApiResponse.success('AI Budget tips.', mockBudgetTips));
  } catch (err) {
    next(err);
  }
};
