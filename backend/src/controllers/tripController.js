const Trip = require('../models/Trip');
const Itinerary = require('../models/Itinerary');
const Favorite = require('../models/Favorite');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const geminiService = require('../services/geminiService');
const weatherService = require('../services/weatherService');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

// Auto calculate budget based on preferences and budget tier
const calculateEstimatedBudget = (days, budgetTier, travelers, transportPref, hotelPref) => {
  // Rates per day per traveler in INR
  const rates = {
    Budget: { hotel: 1500, food: 600, transport: 400, attractions: 300 },
    Moderate: { hotel: 4500, food: 1500, transport: 1000, attractions: 800 },
    Luxury: { hotel: 15000, food: 4500, transport: 3000, attractions: 2000 }
  };

  const selectedRate = rates[budgetTier] || rates.Moderate;

  // Modifiers based on preferences
  let hotelModifier = 1.0;
  if (hotelPref === 'Hostel') hotelModifier = 0.5;
  if (hotelPref === 'Resort') hotelModifier = 1.6;
  if (hotelPref === 'Airbnb') hotelModifier = 0.8;
  if (hotelPref === 'None') hotelModifier = 0.0;

  let transportModifier = 1.0;
  if (transportPref === 'Walking') transportModifier = 0.1;
  if (transportPref === 'Car Rental') transportModifier = 1.5;
  if (transportPref === 'Taxi') transportModifier = 1.3;
  if (transportPref === 'Flights') transportModifier = 2.0;

  const hotelCost = Math.round(selectedRate.hotel * days * travelers * hotelModifier);
  const foodCost = Math.round(selectedRate.food * days * travelers);
  const transportCost = Math.round(selectedRate.transport * days * travelers * transportModifier);
  const attractionsCost = Math.round(selectedRate.attractions * days * travelers);

  const total = hotelCost + foodCost + transportCost + attractionsCost;

  return {
    hotelCost,
    foodCost,
    transportCost,
    attractionsCost,
    total
  };
};

// @desc    Create a new trip and generate its AI itinerary
// @route   POST /api/trips
// @access  Private
const createTrip = async (req, res, next) => {
  try {
    const {
      destination,
      country,
      startDate,
      numberOfDays,
      budget,
      numberOfTravelers,
      interests,
      transportPreference,
      hotelPreference,
      foodPreference,
      tripType
    } = req.body;

    // Calculate budget breakdown
    const estimatedBudgetBreakdown = calculateEstimatedBudget(
      parseInt(numberOfDays),
      budget,
      parseInt(numberOfTravelers || 1),
      transportPreference,
      hotelPreference
    );

    // Create Trip configuration
    const trip = new Trip({
      user: req.user.id,
      destination,
      country,
      startDate,
      numberOfDays,
      budget,
      numberOfTravelers: numberOfTravelers || 1,
      interests: interests || [],
      transportPreference: transportPreference || 'Public Transit',
      hotelPreference: hotelPreference || 'Hotel',
      foodPreference: foodPreference || 'Any',
      tripType,
      estimatedBudgetBreakdown
    });

    await trip.save();
    logger.info(`Trip created in DB: ${trip._id} for user ${req.user.email}`);

    // Generate AI Itinerary using Gemini
    let itineraryData;
    try {
      itineraryData = await geminiService.generateItinerary(trip);
    } catch (aiError) {
      logger.error(`AI Generation failed for Trip ${trip._id}: ${aiError.message}`);
      // Return mock itinerary details so the client succeeds
      itineraryData = geminiService.generateMockItinerary(trip);
    }

    const itinerary = new Itinerary({
      trip: trip._id,
      user: req.user.id,
      days: itineraryData.days,
      travelTips: itineraryData.travelTips || [],
      packingList: itineraryData.packingList || [],
      hotels: itineraryData.hotels || [],
      hiddenGems: itineraryData.hiddenGems || [],
      safetyTips: itineraryData.safetyTips || [],
      photographySpots: itineraryData.photographySpots || [],
      bestVisitingTime: itineraryData.bestVisitingTime || '',
      budgetOptimization: itineraryData.budgetOptimization || ''
    });

    await itinerary.save();
    logger.info(`Itinerary linked to Trip: ${trip._id}`);

    return ApiResponse.success(res, 'Trip and AI Itinerary generated successfully', {
      trip,
      itinerary
    }, 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's trips with search, filter, and pagination
// @route   GET /api/trips
// @access  Private
const getUserTrips = async (req, res, next) => {
  try {
    const {
      search,      // Search city/country
      budget,      // Budget tier
      tripType,    // Trip Type
      duration,    // Number of days filter
      country,     // Country exact filter
      page = 1,
      limit = 6
    } = req.query;

    const query = { user: req.user.id };

    // Apply Search
    if (search) {
      query.$or = [
        { destination: { $regex: search, $options: 'i' } },
        { country: { $regex: search, $options: 'i' } }
      ];
    }

    // Apply Filters
    if (budget) query.budget = budget;
    if (tripType) query.tripType = tripType;
    if (country) query.country = { $regex: country, $options: 'i' };
    if (duration) {
      // Allow exact match or ranges
      if (duration === 'short') query.numberOfDays = { $lte: 3 };
      else if (duration === 'medium') query.numberOfDays = { $gt: 3, $lte: 7 };
      else if (duration === 'long') query.numberOfDays = { $gt: 7 };
      else query.numberOfDays = parseInt(duration);
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const totalTrips = await Trip.countDocuments(query);
    const trips = await Trip.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return ApiResponse.success(res, 'Trips retrieved successfully', {
      trips,
      pagination: {
        total: totalTrips,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalTrips / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get trip and itinerary details by ID
// @route   GET /api/trips/:id
// @access  Private
const getTripById = async (req, res, next) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, user: req.user.id });
    if (!trip) {
      return ApiResponse.error(res, 'Trip not found', 404);
    }

    const itinerary = await Itinerary.findOne({ trip: trip._id });
    
    // Check if favorited
    const isFavorited = await Favorite.exists({ user: req.user.id, trip: trip._id });

    return ApiResponse.success(res, 'Trip details retrieved', {
      trip,
      itinerary,
      isFavorited: !!isFavorited
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a trip config and budget
// @route   PUT /api/trips/:id
// @access  Private
const updateTrip = async (req, res, next) => {
  try {
    const {
      destination,
      country,
      startDate,
      numberOfDays,
      budget,
      numberOfTravelers,
      interests,
      transportPreference,
      hotelPreference,
      foodPreference,
      tripType
    } = req.body;

    const trip = await Trip.findOne({ _id: req.params.id, user: req.user.id });
    if (!trip) {
      return ApiResponse.error(res, 'Trip not found', 404);
    }

    // Update fields
    if (destination !== undefined) trip.destination = destination;
    if (country !== undefined) trip.country = country;
    if (startDate !== undefined) trip.startDate = startDate;
    if (numberOfDays !== undefined) trip.numberOfDays = numberOfDays;
    if (budget !== undefined) trip.budget = budget;
    if (numberOfTravelers !== undefined) trip.numberOfTravelers = numberOfTravelers;
    if (interests !== undefined) trip.interests = interests;
    if (transportPreference !== undefined) trip.transportPreference = transportPreference;
    if (hotelPreference !== undefined) trip.hotelPreference = hotelPreference;
    if (foodPreference !== undefined) trip.foodPreference = foodPreference;
    if (tripType !== undefined) trip.tripType = tripType;

    // Recalculate budget breakdown
    trip.estimatedBudgetBreakdown = calculateEstimatedBudget(
      trip.numberOfDays,
      trip.budget,
      trip.numberOfTravelers,
      trip.transportPreference,
      trip.hotelPreference
    );

    await trip.save();
    logger.info(`Trip ${trip._id} configuration updated.`);

    return ApiResponse.success(res, 'Trip configuration updated successfully', { trip });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a trip and its resources
// @route   DELETE /api/trips/:id
// @access  Private
const deleteTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!trip) {
      return ApiResponse.error(res, 'Trip not found', 404);
    }

    // Delete corresponding itinerary
    await Itinerary.findOneAndDelete({ trip: trip._id });
    // Delete favorites
    await Favorite.deleteMany({ trip: trip._id });

    logger.info(`Trip ${req.params.id} and its itineraries deleted.`);
    return ApiResponse.success(res, 'Trip deleted successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Duplicate an existing trip (clones options and itinerary)
// @route   POST /api/trips/:id/duplicate
// @access  Private
const duplicateTrip = async (req, res, next) => {
  try {
    const sourceTrip = await Trip.findOne({ _id: req.params.id, user: req.user.id });
    if (!sourceTrip) {
      return ApiResponse.error(res, 'Source trip not found', 404);
    }

    const sourceItinerary = await Itinerary.findOne({ trip: sourceTrip._id });

    // Create cloned Trip
    const clonedTrip = new Trip({
      user: req.user.id,
      destination: `${sourceTrip.destination} (Copy)`,
      country: sourceTrip.country,
      startDate: sourceTrip.startDate,
      numberOfDays: sourceTrip.numberOfDays,
      budget: sourceTrip.budget,
      numberOfTravelers: sourceTrip.numberOfTravelers,
      interests: sourceTrip.interests,
      transportPreference: sourceTrip.transportPreference,
      hotelPreference: sourceTrip.hotelPreference,
      foodPreference: sourceTrip.foodPreference,
      tripType: sourceTrip.tripType,
      estimatedBudgetBreakdown: sourceTrip.estimatedBudgetBreakdown
    });

    await clonedTrip.save();

    // Create cloned Itinerary
    if (sourceItinerary) {
      const clonedItinerary = new Itinerary({
        trip: clonedTrip._id,
        user: req.user.id,
        days: sourceItinerary.days,
        travelTips: sourceItinerary.travelTips
      });
      await clonedItinerary.save();
    }

    logger.info(`Trip duplicated successfully: cloned ${sourceTrip._id} to ${clonedTrip._id}`);

    return ApiResponse.success(res, 'Trip duplicated successfully', {
      trip: clonedTrip
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current weather & 5-day forecast for trip destination
// @route   GET /api/trips/:id/weather
// @access  Private
const getTripWeather = async (req, res, next) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, user: req.user.id });
    if (!trip) {
      return ApiResponse.error(res, 'Trip not found', 404);
    }

    const weather = await weatherService.getWeatherByCity(trip.destination);
    return ApiResponse.success(res, 'Weather forecast retrieved', weather);
  } catch (error) {
    next(error);
  }
};

// @desc    Get user personal statistics
// @route   GET /api/trips/stats
// @access  Private
const getUserStats = async (req, res, next) => {
  try {
    const filter = { user: req.user.id };

    // 1. Total counts
    const totalTrips = await Trip.countDocuments(filter);

    // 2. Budget Distribution
    const budgetStats = await Trip.aggregate([
      { $match: filter },
      { $group: { _id: '$budget', count: { $sum: 1 } } }
    ]);
    const budgetDistribution = { Budget: 0, Moderate: 0, Luxury: 0 };
    budgetStats.forEach((stat) => {
      if (budgetDistribution[stat._id] !== undefined) {
        budgetDistribution[stat._id] = stat.count;
      }
    });

    // 3. Trips Per Month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1); // Start of month

    const monthlyStats = await Trip.aggregate([
      { 
        $match: {
          ...filter,
          createdAt: { $gte: sixMonthsAgo }
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const tripsPerMonth = [];

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      tripsPerMonth.push({
        label: `${months[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`,
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        count: 0
      });
    }

    monthlyStats.forEach((stat) => {
      const target = tripsPerMonth.find(
        (m) => m.year === stat._id.year && m.month === stat._id.month
      );
      if (target) {
        target.count = stat.count;
      }
    });

    return ApiResponse.success(res, 'Statistics retrieved successfully', {
      summary: {
        totalTrips
      },
      charts: {
        budgetDistribution,
        tripsPerMonth: tripsPerMonth.map((m) => ({ label: m.label, count: m.count }))
      }
    });
  } catch (error) {
    next(error);
  }
};

const https = require('https');

const downloadImage = (url) => {
  return new Promise((resolve, reject) => {
    if (!url || !url.startsWith('http')) {
      return reject(new Error('Invalid image URL'));
    }
    const req = https.get(url, { timeout: 3000 }, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to load image, status code: ${res.statusCode}`));
      }
      const data = [];
      res.on('data', (chunk) => data.push(chunk));
      res.on('end', () => resolve(Buffer.concat(data)));
    });
    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
};

const generateTripPDF = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json(ApiResponse.error('Trip not found.'));
    }
    const itinerary = await Itinerary.findOne({ trip: trip._id });
    if (!itinerary) {
      return res.status(404).json(ApiResponse.error('Itinerary not found.'));
    }

    // Letter size is 612 x 792. Margins: 50. Printable height: 792 - 50 = 742.
    const doc = new PDFDocument({ margin: 50, bufferPages: true });
    const cleanDest = trip.destination.replace(/[^a-zA-Z0-9]/g, '_');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=AITripCraft_${cleanDest}.pdf`);

    doc.pipe(res);

    // Track pages that contain actual content (excluding running headers/footers)
    const pageHasContent = [];
    const markPageHasContent = () => {
      const pageIndex = doc.bufferedPageRange().count - 1;
      pageHasContent[pageIndex] = true;
    };

    // ==========================================
    // PAGE 1: COVER PAGE
    // ==========================================
    markPageHasContent();
    
    // Cover colored top banner
    doc.fillColor('#7c5cff').rect(0, 0, 612, 190).fill();
    doc.fillColor('#ffffff').fontSize(32).font('Helvetica-Bold').text('AI TRIPCRAFT', 50, 50);
    doc.fontSize(14).font('Helvetica').text('Smart Tailored Itinerary & Travel Brochure', 50, 95);
    doc.fontSize(10).text('Powered by Google Gemini AI', 50, 120);

    // Resolve cover image from unique database mapping
    const { DESTINATION_IMAGES } = require('../config/destinationImages');
    const normalized = trip.destination.toLowerCase().trim().replace(/,\s*\w+$/, '');
    const coverUrlsList = DESTINATION_IMAGES[normalized] || [];
    let coverImgBuffer = null;

    for (const url of coverUrlsList) {
      if (url && url.startsWith('http') && !url.startsWith('data:')) {
        try {
          coverImgBuffer = await downloadImage(url);
          if (coverImgBuffer) {
            break;
          }
        } catch (err) {
          logger.error(`Error downloading PDF cover image candidate ${url}: ${err.message}`);
        }
      }
    }

    // Draw hero image or dynamic fallback vector card
    if (coverImgBuffer) {
      try {
        doc.image(coverImgBuffer, 340, 220, { width: 220, height: 130 });
        doc.strokeColor('#7c5cff').lineWidth(2).rect(340, 220, 220, 130).stroke();
      } catch (imgErr) {
        logger.error(`Error rendering downloaded PDF image: ${imgErr.message}`);
        // Render fallback vector card
        doc.fillColor('#1e293b').roundedRect(340, 220, 220, 130, 6).fill();
        doc.strokeColor('#7c5cff').lineWidth(2).roundedRect(340, 220, 220, 130, 6).stroke();
        doc.fillColor('#ffffff').fontSize(14).font('Helvetica-Bold').text(trip.destination, 350, 260, { width: 200, align: 'center' });
        doc.fontSize(9).font('Helvetica').fillColor('#94a3b8').text('Image Unavailable', 350, 285, { width: 200, align: 'center' });
      }
    } else {
      // Vector fallback card
      doc.fillColor('#1e293b').roundedRect(340, 220, 220, 130, 6).fill();
      doc.strokeColor('#7c5cff').lineWidth(2).roundedRect(340, 220, 220, 130, 6).stroke();
      doc.fillColor('#ffffff').fontSize(14).font('Helvetica-Bold').text(trip.destination, 350, 260, { width: 200, align: 'center' });
      doc.fontSize(9).font('Helvetica').fillColor('#94a3b8').text('Image Unavailable', 350, 285, { width: 200, align: 'center' });
    }

    // Left Column details (y = 220 to 350)
    doc.fillColor('#111827').fontSize(18).font('Helvetica-Bold').text(`Destination: ${trip.destination}`, 50, 220, { width: 280 });
    doc.fontSize(12).font('Helvetica').fillColor('#374151');
    doc.text(`Country: ${trip.country}`, 50, 255);
    doc.text(`Duration: ${trip.numberOfDays} Days`, 50, 275);
    doc.text(`Travel Date: ${new Date(trip.startDate).toDateString()}`, 50, 295);
    doc.text(`Travelers Count: ${trip.numberOfTravelers} Person(s)`, 50, 315);
    doc.text(`Budget Tier Category: ${trip.budget}`, 50, 335);

    // Separator line
    doc.strokeColor('#E5E7EB').lineWidth(1.5).moveTo(50, 365).lineTo(562, 365).stroke();

    // Packing guidelines (Checklist layout)
    doc.fillColor('#111827').fontSize(13).font('Helvetica-Bold').text('Required Packing Checklist', 50, 385);
    const packing = itinerary.packingList || [];
    const maxPackingItems = Math.min(packing.length, 12);
    doc.fontSize(9).font('Helvetica').fillColor('#4B5563');

    for (let index = 0; index < maxPackingItems; index++) {
      const item = packing[index];
      const col = index % 2 === 0 ? 55 : 310;
      const itemY = 410 + Math.floor(index / 2) * 22;
      doc.text(`[  ]  ${item}`, col, itemY);
    }

    // Safety & Advisories at bottom of Cover Page
    doc.fillColor('#111827').fontSize(13).font('Helvetica-Bold').text('Safety & Advisories', 50, 560);
    const safety = itinerary.safetyTips || ['Always stay alert and carry copy documents.', 'Keep local currency in hand.', 'Confirm directions with trusted operators.'];
    let safetyTipY = 585;
    safety.slice(0, 3).forEach((tip) => {
      doc.fontSize(9).font('Helvetica').fillColor('#4B5563').text(`•  ${tip}`, 55, safetyTipY, { width: 500 });
      safetyTipY += 20;
    });

    // ==========================================
    // DYNAMIC PAGES (PAGE 2 ONWARDS)
    // ==========================================
    doc.addPage();
    let currentY = 50;

    const ensureSpace = (heightNeeded) => {
      // Letter height is 792. printable bottom threshold: 730
      // Prevent redundant page breaks if we are already at the top of a new page
      if (currentY > 50 && currentY + heightNeeded > 730) {
        doc.addPage();
        currentY = 50;
        return true;
      }
      return false;
    };

    const drawSectionHeader = (title) => {
      ensureSpace(40);
      markPageHasContent();
      doc.fillColor('#111827').fontSize(14).font('Helvetica-Bold').text(title, 50, currentY);
      doc.strokeColor('#E5E7EB').lineWidth(1).moveTo(50, currentY + 18).lineTo(562, currentY + 18).stroke();
      currentY += 32;
    };

    // 1. Budget Breakdown Table
    drawSectionHeader('Estimated Budget Breakdown');
    const breakdown = trip.estimatedBudgetBreakdown;
    
    // Draw table header
    doc.fillColor('#F1F5F9').rect(50, currentY, 512, 22).fill();
    doc.fillColor('#1F2937').fontSize(9.5).font('Helvetica-Bold').text('Expense Category', 60, currentY + 6);
    doc.text('Estimated Cost (INR)', 400, currentY + 6, { align: 'right', width: 150 });
    currentY += 22;

    const budgetRows = [
      { name: 'Hotel & Accommodation Cost Estimate', cost: breakdown.hotelCost },
      { name: 'Food & Fine Dining Cost Estimate', cost: breakdown.foodCost },
      { name: 'Transit & Transportation Cost Estimate', cost: breakdown.transportCost },
      { name: 'Sightseeing & Attractions cost', cost: breakdown.attractionsCost }
    ];

    budgetRows.forEach((row) => {
      doc.strokeColor('#E5E7EB').lineWidth(0.5).moveTo(50, currentY + 22).lineTo(562, currentY + 22).stroke();
      doc.fillColor('#4B5563').fontSize(9).font('Helvetica').text(row.name, 60, currentY + 6);
      doc.text(`INR ${row.cost.toLocaleString('en-IN')}`, 400, currentY + 6, { align: 'right', width: 150 });
      currentY += 22;
    });

    // Total row
    doc.fillColor('#E8E7FF').rect(50, currentY, 512, 24).fill();
    doc.fillColor('#7c5cff').fontSize(9.5).font('Helvetica-Bold').text('Grand Total Budget Estimate', 60, currentY + 7);
    doc.text(`INR ${breakdown.total.toLocaleString('en-IN')}`, 400, currentY + 7, { align: 'right', width: 150 });
    currentY += 38;

    // 2. Recommended Accommodations Stays
    drawSectionHeader('Recommended Stays & Accommodations');
    const hotels = itinerary.hotels || ['Grand Heritage Suites', 'Taj Palace Retreat', 'Royal Garden Inn'];
    
    hotels.slice(0, 3).forEach((hotel) => {
      ensureSpace(55);
      markPageHasContent();
      doc.strokeColor('#E5E7EB').lineWidth(0.5).roundedRect(50, currentY, 512, 45, 4).stroke();
      doc.fillColor('#111827').fontSize(10).font('Helvetica-Bold').text(hotel, 60, currentY + 10);
      doc.fontSize(8.5).font('Helvetica').fillColor('#6B7280').text('Rating: 4.8 / 5  |  Category: Tailored Premium  |  Distance: Near Tourist Core', 60, currentY + 25);
      
      let price = 'Moderate Tier';
      if (trip.budget === 'Budget') price = 'INR 1,800/night';
      else if (trip.budget === 'Luxury') price = 'INR 14,000/night';
      else price = 'INR 5,500/night';
      
      doc.fillColor('#10B981').fontSize(10).font('Helvetica-Bold').text(price, 400, currentY + 17, { align: 'right', width: 150 });
      currentY += 52;
    });
    currentY += 10;

    // 3. Recommended Dining
    drawSectionHeader('Recommended Dining & Local Cuisines');
    const sampleRests = itinerary.days[0]?.restaurants || ['Saffron Fine Dine', 'Local Heritage Bistro', 'Authentic Family Diner'];
    
    sampleRests.slice(0, 3).forEach((rest) => {
      ensureSpace(55);
      markPageHasContent();
      doc.strokeColor('#E5E7EB').lineWidth(0.5).roundedRect(50, currentY, 512, 45, 4).stroke();
      doc.fillColor('#111827').fontSize(10).font('Helvetica-Bold').text(rest, 60, currentY + 10);
      doc.fontSize(8.5).font('Helvetica').fillColor('#6B7280').text('Cuisine Type: Multi-Cuisine Local Traditional  |  Operating Hours: 11:00 AM - 11:00 PM', 60, currentY + 25);
      doc.fillColor('#7c5cff').fontSize(10).font('Helvetica-Bold').text('Avg Cost: Moderate', 400, currentY + 17, { align: 'right', width: 150 });
      currentY += 52;
    });

    // ==========================================
    // PAGE 3: DAY-BY-DAY TIMELINE SCHEDULE & MAPS
    // ==========================================
    doc.addPage();
    currentY = 50;

    drawSectionHeader('Day-by-Day Travel Timeline & Direction Route Maps');

    itinerary.days.forEach((day, dayIdx) => {
      // Calculate dynamic height for the day plan block
      const headerH = 20;
      const morningH = doc.heightOfString(day.morningPlan, { width: 430 }) + 20;
      const afternoonH = doc.heightOfString(day.afternoonPlan, { width: 430 }) + 20;
      const eveningH = doc.heightOfString(day.eveningPlan, { width: 430 }) + 20;
      const allowanceH = 20;
      const totalBlockHeight = headerH + morningH + afternoonH + eveningH + allowanceH + 20;

      // Check space on current page, if not enough, move block to next page
      ensureSpace(totalBlockHeight);
      markPageHasContent();

      // Draw day card outer frame
      doc.fillColor('#F9FAFB').roundedRect(50, currentY, 512, totalBlockHeight - 10, 6).fill();
      doc.strokeColor('#7c5cff').lineWidth(1).roundedRect(50, currentY, 512, totalBlockHeight - 10, 6).stroke();

      // Day Title
      doc.fillColor('#7c5cff').fontSize(10.5).font('Helvetica-Bold').text(`DAY ${day.dayNumber} - SCHEDULE & GEOGRAPHIC ROUTE MAP`, 60, currentY + 12);
      
      // Draw Vector Map timeline line indicator
      let timelineY = currentY + 32;
      doc.strokeColor('#CBD5E1').lineWidth(1.5).moveTo(75, timelineY).lineTo(75, timelineY + morningH + afternoonH + eveningH - 15).stroke();
      
      // Stop 1: Morning
      doc.fillColor('#fbbf24').circle(75, timelineY + 8, 4).fill();
      doc.fillColor('#1F2937').fontSize(9).font('Helvetica-Bold').text('Morning Sightseeing Stop:', 90, timelineY);
      doc.fillColor('#4B5563').fontSize(8.5).font('Helvetica').text(day.morningPlan, 90, timelineY + 12, { width: 440 });
      timelineY += morningH;

      // Stop 2: Afternoon
      doc.fillColor('#f97316').circle(75, timelineY + 8, 4).fill();
      doc.fillColor('#1F2937').fontSize(9).font('Helvetica-Bold').text('Lunch & Afternoon Sights:', 90, timelineY);
      doc.fillColor('#4B5563').fontSize(8.5).font('Helvetica').text(day.afternoonPlan, 90, timelineY + 12, { width: 440 });
      timelineY += afternoonH;

      // Stop 3: Evening
      doc.fillColor('#c084fc').circle(75, timelineY + 8, 4).fill();
      doc.fillColor('#1F2937').fontSize(9).font('Helvetica-Bold').text('Evening Leisure Experience:', 90, timelineY);
      doc.fillColor('#4B5563').fontSize(8.5).font('Helvetica').text(day.eveningPlan, 90, timelineY + 12, { width: 440 });
      timelineY += eveningH;

      // Daily Budget Summary
      doc.fillColor('#7c5cff').fontSize(9).font('Helvetica-Bold').text(`Day Allowance budget: INR ${day.estimatedDailyBudget}`, 60, currentY + totalBlockHeight - 22);

      currentY += totalBlockHeight + 5;
    });

    // ==========================================
    // CLIMATE, WEATHER & EMERGENCY DIRECTORY
    // ==========================================
    ensureSpace(160);

    drawSectionHeader('Destination Climate & Weather Outlook');
    doc.fillColor('#111827').fontSize(10).font('Helvetica-Bold').text('Visiting Weather Overview:', 50, currentY);
    doc.fontSize(9.5).font('Helvetica').fillColor('#4B5563').text(itinerary.bestVisitingTime || 'Pleasant weather year-round, ideal visiting between October and April.', 50, currentY + 15, { width: 512 });
    currentY += 45;

    drawSectionHeader('Emergency Assistance Directory');
    doc.fontSize(9.5).font('Helvetica').fillColor('#4B5563');
    doc.text('•  National Security Emergency Desk Response Hotline: 112 (Police, Medical, Fire)', 50, currentY);
    doc.text('•  Local Tourism Support Directory: Direct desk support available 24/7.', 50, currentY + 15);
    currentY += 40;

    // Draw Simulated Google Maps QR Code
    ensureSpace(110);
    markPageHasContent();
    doc.strokeColor('#7c5cff').lineWidth(2).rect(50, currentY, 80, 80).stroke();
    doc.fillColor('#111827');
    doc.rect(58, currentY + 8, 20, 20).fill();
    doc.rect(102, currentY + 8, 20, 20).fill();
    doc.rect(58, currentY + 52, 20, 20).fill();
    doc.rect(82, currentY + 30, 20, 20).fill();

    doc.fontSize(9.5).fillColor('#6B7280').text('Scan this custom QR code to view live Google Maps directions, active routes, custom itineraries, hotel navigation paths, and local sightseeing logs online.', 150, currentY + 20, { width: 400 });
    currentY += 100;

    // ==========================================
    // STAMP HEADER AND FOOTER ON ALL PAGES
    // ==========================================
    const pagesRange = doc.bufferedPageRange();
    const validPageIndices = [];

    // Filter pages to ensure only pages with valid travel content are stamped and kept
    for (let i = 0; i < pagesRange.count; i++) {
      if (pageHasContent[i] || i === 0) { // Always preserve cover page (page index 0)
        validPageIndices.push(i);
      }
    }

    // Stamp header and footers exclusively on valid pages with correct page labels
    validPageIndices.forEach((realIdx, displayIdx) => {
      doc.switchToPage(realIdx);
      
      // Draw running header (on pages > 0)
      if (displayIdx > 0) {
        doc.strokeColor('#E5E7EB').lineWidth(0.5).moveTo(50, 35).lineTo(562, 35).stroke();
        doc.fillColor('#94A3B8').fontSize(8).font('Helvetica').text(`AI TRIPCRAFT TRAVEL GUIDE  |  ITINERARY FOR ${trip.destination.toUpperCase()}`, 50, 22);
      }
      
      // Draw running footer on all pages
      doc.strokeColor('#E5E7EB').lineWidth(0.5).moveTo(50, 750).lineTo(562, 750).stroke();
      doc.fillColor('#94A3B8').fontSize(8).font('Helvetica').text(`Page ${displayIdx + 1} of ${validPageIndices.length}  |  AI TripCraft Premium Travel Catalog`, 50, 758, { align: 'center' });
    });

    // Prune blank and empty pages from PDFKit internal dictionary tree structure before saving
    const rawPagesList = doc._root.data.Pages.data.Kids;
    const newKids = [];
    validPageIndices.forEach((idx) => {
      newKids.push(rawPagesList[idx]);
    });

    doc._root.data.Pages.data.Kids = newKids;
    doc._root.data.Pages.data.Count.value = newKids.length;

    doc.end();

  } catch (err) {
    logger.error(`Error compiling backend PDF: ${err.message}`);
    next(err);
  }
};

module.exports = {
  createTrip,
  getUserTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  duplicateTrip,
  getTripWeather,
  getUserStats,
  generateTripPDF
};
