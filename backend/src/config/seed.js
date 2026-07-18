const mongoose = require('mongoose');
const User = require('../models/User');
const Destination = require('../models/Destination');
const Trip = require('../models/Trip');
const Itinerary = require('../models/Itinerary');
const Favorite = require('../models/Favorite');
const Review = require('../models/Review');
require('dotenv').config();
const { supplementaryDestinations } = require('./supplementarySeed');


const users = [
  {
    username: 'john_doe',
    email: 'john@gmail.com',
    password: 'userpassword123',
    role: 'user',
    emailVerified: true,
    profile: {
      firstName: 'John', lastName: 'Doe',
      phone: '+15550199',
      avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=john',
    },
  },
  {
    username: 'priya_traveler',
    email: 'priya@gmail.com',
    password: 'userpassword123',
    role: 'user',
    emailVerified: true,
    profile: {
      firstName: 'Priya', lastName: 'Sharma',
      phone: '+919876543210',
      avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=priya',
    },
  },
];

const destinations = [
  {
    "name": "Delhi",
    "country": "India",
    "state": "Delhi",
    "city": "New Delhi",
    "category": "Metro",
    "description": "India's capital territory — a sprawling metropolis blending Mughal grandeur, colonial legacy, and modern India. Home to UNESCO World Heritage Sites, vibrant street food, and political power.",
    "history": "Delhi has served as the capital of several empires. From the Tomar Rajputs to the Delhi Sultanate, the Mughal Empire, and then the British Raj, the city is layered with over 800 years of imperial history. Old Delhi, built by Mughal Emperor Shah Jahan in 1648, is a labyrinth of mosques, havelis, and spice markets.",
    "culture": "Delhi is a melting pot of cultures — Punjabi, Bihari, Rajasthani, and South Indian communities all coexist here. The city celebrates Diwali, Eid, Christmas, and Lohri with equal gusto. It has India's largest concentration of museums, galleries, and performing arts venues.",
    "language": "Hindi, Punjabi, Urdu, English",
    "currency": "Indian Rupee (INR)",
    "coordinates": {
      "lat": 28.6139,
      "lng": 77.209
    },
    "latitude": 28.6139,
    "longitude": 77.209,
    "imageUrl": "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80",
    "gallery": [
      "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1601342782939-35b11aed74e8?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=600&q=80"
    ],
    "climate": "Semi-arid",
    "weather": "Extreme: scorching summers (45°C), monsoon rains (Jul–Sep), foggy winters",
    "avgTemperature": "25°C annual average (ranges 5°C to 45°C)",
    "bestTime": "October to March",
    "nearbyAirport": "Indira Gandhi International Airport (DEL) — 16 km from city center",
    "metroAvailable": true,
    "publicTransport": "Extensive Delhi Metro (350+ stations), DTC buses, auto-rickshaws, e-rickshaws, Ola/Uber",
    "budget": "Moderate",
    "estimatedBudgetMin": 2500,
    "estimatedBudgetMax": 8000,
    "attractions": [
      "Red Fort (UNESCO)",
      "Qutub Minar (UNESCO)",
      "India Gate",
      "Lotus Temple",
      "Akshardham Temple",
      "Humayun's Tomb (UNESCO)",
      "Jama Masjid",
      "Chandni Chowk"
    ],
    "hiddenGems": [
      "Agrasen ki Baoli (stepwell)",
      "Mehrauli Archaeological Park",
      "Hauz Khas Village",
      "Majnu ka Tilla (Tibetan colony)",
      "Sanjay Van forest"
    ],
    "luxuryHotels": [
      "The Leela Palace New Delhi",
      "ITC Maurya",
      "The Imperial New Delhi"
    ],
    "budgetHotels": [
      "Zostel Delhi",
      "Moustache Delhi",
      "Hotel City Park (Paharganj)"
    ],
    "hotels": [
      "The Leela Palace New Delhi (Luxury)",
      "The Lalit New Delhi (Moderate)",
      "Zostel Delhi (Budget)"
    ],
    "restaurants": [
      "Indian Accent",
      "Karim's (Old Delhi)",
      "Pandara Road food strip",
      "Dilli Haat food court"
    ],
    "streetFood": [
      "Chole Bhature at Sitaram Diwan Chand",
      "Paranthe Wali Gali",
      "Jalebi at Old Famous Jalebi Wala",
      "Gol Gappa at Bengali Market"
    ],
    "localFoods": [
      "Nihari",
      "Butter Chicken",
      "Chole Bhature",
      "Chaat",
      "Gajar ka Halwa",
      "Daulat ki Chaat"
    ],
    "shoppingAreas": [
      "Connaught Place",
      "Lajpat Nagar Market",
      "Chandni Chowk",
      "Sarojini Nagar",
      "Select Citywalk Mall"
    ],
    "nightlife": [
      "Hauz Khas Village",
      "Connaught Place",
      "Cyber Hub Gurugram",
      "Aerocity hotel bars"
    ],
    "adventureActivities": [
      "Hot air ballooning over Agra day trip",
      "Cycling in Aravalli Biodiversity Park",
      "Karting at Buddh International Circuit nearby"
    ],
    "familyActivities": [
      "National Zoological Park",
      "Rail Museum",
      "National Science Centre",
      "Kingdom of Dreams Gurugram"
    ],
    "coupleActivities": [
      "Sunset at Humayun's Tomb",
      "Boat ride at India Gate lawns",
      "Dinner cruise on Yamuna"
    ],
    "soloTravelTips": "Delhi Metro is the safest, cheapest, and fastest way to move. Get a Metro card for convenience. Avoid autos without meters. Old Delhi is best explored on foot in the morning.",
    "safetyScore": 6,
    "averageRating": 4.2,
    "totalReviews": 8
  },
  {
    "name": "Mumbai",
    "country": "India",
    "state": "Maharashtra",
    "city": "Mumbai",
    "category": "Metro",
    "description": "The City of Dreams — India's financial capital and home of Bollywood. An electric mix of colonial architecture, chic cafes, chaotic local trains, and sun-drenched beaches.",
    "history": "Originally a cluster of seven islands inhabited by Koli fishermen, Mumbai was ceded to England in 1661 as part of a marriage dowry. The East India Company turned it into a major port city. Post-independence, it became the epicenter of India's commerce and film industry.",
    "culture": "Mumbai is a cosmopolitan megalopolis where Maharashtrian, Gujarati, Parsi, and South Indian cultures coexist. The city never sleeps — street food stalls, cricket matches on the Maidan, and late-night café culture define its pace.",
    "language": "Marathi, Hindi, English, Gujarati",
    "currency": "Indian Rupee (INR)",
    "coordinates": {
      "lat": 19.076,
      "lng": 72.8777
    },
    "latitude": 19.076,
    "longitude": 72.8777,
    "imageUrl": "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=800&q=80",
    "gallery": [
      "https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1580581096469-93d9e38c01ed?auto=format&fit=crop&w=600&q=80"
    ],
    "climate": "Tropical wet and dry",
    "weather": "Hot & humid summers, heavy monsoon (Jun–Sep), mild pleasant winters",
    "avgTemperature": "27°C annual average",
    "bestTime": "November to February",
    "nearbyAirport": "Chhatrapati Shivaji Maharaj International Airport (BOM) — 4 km from city",
    "metroAvailable": true,
    "publicTransport": "Iconic local trains (lifeline of Mumbai), BEST buses, Mumbai Metro, auto-rickshaws, Uber/Ola",
    "budget": "Moderate",
    "estimatedBudgetMin": 2000,
    "estimatedBudgetMax": 9000,
    "attractions": [
      "Gateway of India",
      "Marine Drive",
      "Elephanta Caves (UNESCO)",
      "Dharavi Slum Tour",
      "Siddhivinayak Temple",
      "Haji Ali Dargah",
      "Bollywood Studio Tour",
      "Chhatrapati Shivaji Terminus (UNESCO)"
    ],
    "hiddenGems": [
      "Banganga Tank",
      "Chor Bazaar antique market",
      "Worli Koliwada fishing village",
      "Gilbert Hill basalt column",
      "Kanheri Caves in SGNP"
    ],
    "luxuryHotels": [
      "The Taj Mahal Palace",
      "Oberoi Mumbai",
      "Four Seasons Mumbai"
    ],
    "budgetHotels": [
      "Zostel Mumbai",
      "YMCA Mumbai",
      "Hotel Residency Mumbai"
    ],
    "hotels": [
      "The Taj Mahal Palace (Luxury)",
      "Trident Nariman Point (Moderate)",
      "Zostel Mumbai (Budget)"
    ],
    "restaurants": [
      "Trishna (seafood)",
      "Café Mondegar (Colaba)",
      "Khyber (kebabs)",
      "Bade Miya (street kebabs)"
    ],
    "streetFood": [
      "Vada Pav at Ashok Vada Pav",
      "Pav Bhaji at Juhu Beach",
      "Bhel Puri at Chowpatty",
      "Kebabs at Bade Miya"
    ],
    "localFoods": [
      "Vada Pav",
      "Pav Bhaji",
      "Bombay Duck fish",
      "Modak",
      "Misal Pav",
      "Keema Pav"
    ],
    "shoppingAreas": [
      "Colaba Causeway",
      "Linking Road Bandra",
      "Fashion Street",
      "Zaveri Bazaar (jewelry)",
      "Phoenix Palladium Mall"
    ],
    "nightlife": [
      "Bandra (bars and pubs)",
      "Lower Parel clubs",
      "Juhu Beach nightlife",
      "Colaba lane cafes"
    ],
    "adventureActivities": [
      "Parasailing at Juhu",
      "Trek to Kanheri Caves",
      "Scuba diving at Tarkarli (day trip)",
      "Sailing at RWYC"
    ],
    "familyActivities": [
      "Essel World & Water Kingdom",
      "Taraporewala Aquarium",
      "Nehru Science Centre",
      "Film City tours"
    ],
    "coupleActivities": [
      "Sunset on Marine Drive",
      "Ferry to Elephanta Caves",
      "Dinner cruise in the harbor"
    ],
    "soloTravelTips": "The local train is the cheapest way around. Buy a day pass. CST and Churchgate are the main termini. Mumbai is generally safe at night in tourist areas. Try a Dabba meal for an authentic experience.",
    "safetyScore": 7,
    "averageRating": 4.4,
    "totalReviews": 10
  },
  {
    "name": "Kolkata",
    "country": "India",
    "state": "West Bengal",
    "city": "Kolkata",
    "category": "Metro",
    "description": "The City of Joy — a cultural powerhouse with colonial-era buildings, trams, literary cafes, and the vibrant Durga Puja festival. Kolkata is the intellectual and artistic soul of India.",
    "history": "Kolkata served as the capital of British India until 1911. Built by the East India Company around Fort William, it became the center of the Bengal Renaissance movement in the 19th century, producing Nobel laureates and freedom fighters.",
    "culture": "Home to one of the richest literary and artistic traditions in India. The city celebrates Durga Puja with elaborate pandals (temporary temples) that become public art installations. Famous for its sweets (mishti), football, and addiction to adda (intellectual conversation at tea stalls).",
    "language": "Bengali, Hindi, English",
    "currency": "Indian Rupee (INR)",
    "coordinates": {
      "lat": 22.5726,
      "lng": 88.3639
    },
    "latitude": 22.5726,
    "longitude": 88.3639,
    "imageUrl": "https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&w=800&q=80",
    "gallery": [
      "https://images.unsplash.com/photo-1590080875852-e3bfb7f3e00c?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1574878299280-c96ecfa14ff1?auto=format&fit=crop&w=600&q=80"
    ],
    "climate": "Tropical wet and dry",
    "weather": "Hot summers, heavy monsoon, mild pleasant winters",
    "avgTemperature": "27°C annual average",
    "bestTime": "October to March",
    "nearbyAirport": "Netaji Subhas Chandra Bose International Airport (CCU) — 17 km from city",
    "metroAvailable": true,
    "publicTransport": "Kolkata Metro (India's oldest metro), iconic yellow taxis, trams, buses, hand-pulled rickshaws (limited)",
    "budget": "Budget",
    "estimatedBudgetMin": 1500,
    "estimatedBudgetMax": 5000,
    "attractions": [
      "Victoria Memorial",
      "Howrah Bridge",
      "Dakshineswar Kali Temple",
      "Science City",
      "Indian Museum",
      "Marble Palace",
      "Kalighat Temple"
    ],
    "hiddenGems": [
      "Kumartuli potters' quarter",
      "Armenian Church (1724)",
      "Princep Ghat at sunset",
      "Book fair at Milan Mela",
      "College Street secondhand book stalls"
    ],
    "luxuryHotels": [
      "The Oberoi Grand",
      "ITC Royal Bengal",
      "Taj Bengal"
    ],
    "budgetHotels": [
      "Backpacker's Inn",
      "Hotel VIP Inn",
      "YMCA Kolkata"
    ],
    "hotels": [
      "The Oberoi Grand (Luxury)",
      "Kenilworth Hotel (Moderate)",
      "Backpacker's Inn (Budget)"
    ],
    "restaurants": [
      "Oh! Calcutta (Bengali cuisine)",
      "Peter Cat (Chelo Kebabs)",
      "Flurys (colonial café)",
      "Mocambo"
    ],
    "streetFood": [
      "Kathi Rolls at Nizam's",
      "Jhalmuri at roadside stalls",
      "Puchka (pani puri variant)",
      "Egg rolls at Park Street"
    ],
    "localFoods": [
      "Kathi Roll",
      "Mishti Doi",
      "Rasgolla",
      "Sandesh",
      "Hilsa fish curry",
      "Shorshe Ilish"
    ],
    "shoppingAreas": [
      "New Market",
      "Gariahat Market",
      "College Street",
      "Dakshinapan Emporium",
      "South City Mall"
    ],
    "nightlife": [
      "Park Street bars",
      "Tollygunge Club",
      "rooftop restaurants in Salt Lake"
    ],
    "adventureActivities": [
      "Sundarbans tiger safari (day trip)",
      "Boat ride on Hooghly River",
      "Cycling through North Kolkata"
    ],
    "familyActivities": [
      "Nicco Park",
      "Birla Planetarium",
      "Alipore Zoo",
      "Science City IMAX"
    ],
    "coupleActivities": [
      "Evening walk on Howrah Bridge",
      "Victoria Memorial gardens",
      "Ferry crossing at sunset"
    ],
    "soloTravelTips": "Kolkata is one of the safest metro cities in India. Yellow cabs are metered. The metro is affordable and reliable. Explore North Kolkata (Shyambazar, Sovabazar) on foot for heritage architecture.",
    "safetyScore": 8,
    "averageRating": 4.3,
    "totalReviews": 6
  },
  {
    "name": "Chennai",
    "country": "India",
    "state": "Tamil Nadu",
    "city": "Chennai",
    "category": "Metro",
    "description": "The Gateway to South India — a proud custodian of Dravidian culture, classical Carnatic music, and stunning temples. Chennai blends IT-modernity with one of India's longest urban beaches.",
    "history": "Founded by the British East India Company in 1639 with the construction of Fort St. George, Chennai (formerly Madras) was the first major base of the British in India. It has a deep Tamil cultural heritage stretching back millennia.",
    "culture": "The cultural capital of South India. Bharatanatyam dance, Carnatic music concerts (December music season), and Kolam street art are everyday expressions. The city has a strong film industry (Kollywood) and a deeply conservative yet welcoming population.",
    "language": "Tamil, English, Telugu",
    "currency": "Indian Rupee (INR)",
    "coordinates": {
      "lat": 13.0827,
      "lng": 80.2707
    },
    "latitude": 13.0827,
    "longitude": 80.2707,
    "imageUrl": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80",
    "gallery": [
      "https://images.unsplash.com/photo-1604403428907-673e7f4cd341?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=600&q=80"
    ],
    "climate": "Tropical wet and dry",
    "weather": "Hot year-round, heavy monsoon (Oct–Dec), mild Jan–Feb",
    "avgTemperature": "29°C annual average",
    "bestTime": "November to February",
    "nearbyAirport": "Chennai International Airport (MAA) — 14 km from city center",
    "metroAvailable": true,
    "publicTransport": "Chennai Metro, MTC buses, autos, Uber/Ola, suburban trains",
    "budget": "Budget",
    "estimatedBudgetMin": 1500,
    "estimatedBudgetMax": 6000,
    "attractions": [
      "Marina Beach (world's 2nd longest)",
      "Kapaleeshwarar Temple",
      "Fort St. George",
      "Government Museum",
      "Mahabalipuram (UNESCO day trip)",
      "Santhome Cathedral"
    ],
    "hiddenGems": [
      "Bessie Beach quieter stretch",
      "Cholamandal Artists' Village",
      "DakshinaChitra heritage museum",
      "Theosophical Society gardens"
    ],
    "luxuryHotels": [
      "ITC Grand Chola",
      "The Leela Chennai",
      "Taj Coromandel"
    ],
    "budgetHotels": [
      "Stops Hostel Chennai",
      "Hotel Pandian",
      "New Woodlands Hotel"
    ],
    "hotels": [
      "ITC Grand Chola (Luxury)",
      "The Raintree (Moderate)",
      "Stops Hostel Chennai (Budget)"
    ],
    "restaurants": [
      "Murugan Idli Shop",
      "Ratna Café (filter coffee)",
      "Junior Kuppanna (Chettinad)",
      "Saravana Bhavan"
    ],
    "streetFood": [
      "Idli-Sambar at Ratna Café",
      "Kothu Parotta at roadside stalls",
      "Sundal at Marina Beach",
      "Kuzhi Paniyaram"
    ],
    "localFoods": [
      "Chettinad Chicken Curry",
      "Idiyappam",
      "Dosa with various chutneys",
      "Filter Coffee",
      "Pongal",
      "Rasam"
    ],
    "shoppingAreas": [
      "T. Nagar (Ranganathan Street)",
      "Express Avenue Mall",
      "Pondy Bazaar",
      "Mylapore shops"
    ],
    "nightlife": [
      "OMR IT Corridor bars",
      "Mahabalipuram beach shacks (weekend trip)",
      "Nungambakkam restaurant scene"
    ],
    "adventureActivities": [
      "Surfing lessons at Kovalam Beach",
      "Cycling in ECR corridor",
      "Day trek to Yelagiri hills"
    ],
    "familyActivities": [
      "VGP Snow Kingdom",
      "Guindy National Park",
      "Crocodile Bank",
      "MGM Dizzee World"
    ],
    "coupleActivities": [
      "Sunset walk on Marina Beach",
      "Dinner at rooftop restaurants in Nungambakkam",
      "Day trip to Mahabalipuram shore temple"
    ],
    "soloTravelTips": "Chennai is among India's safest cities. The local people are helpful. Use Namma Metro for key routes. MTC app helps with bus routes. The Mylapore area is excellent for solo heritage exploration.",
    "safetyScore": 8,
    "averageRating": 4.1,
    "totalReviews": 5
  },
  {
    "name": "Manali",
    "country": "India",
    "state": "Himachal Pradesh",
    "city": "Manali",
    "category": "Hill Station",
    "description": "The Adventure Capital of India — perched in the Himalayan foothills at 2,050m. A year-round destination offering snow-capped peaks, Rohtang Pass, Solang Valley, river rafting, and ancient Buddhist monasteries.",
    "history": "Named after Manu, the Hindu deity who survived the primordial flood. The Kullu Valley was ruled by various hill states before merging with India in 1947. The old town of Vashisht has ancient hot springs mentioned in Vedic texts.",
    "culture": "A blend of Tibetan Buddhist culture and Hindu Kullu traditions. The Hadimba Temple, built in 1553, is one of the most sacred shrines in Himachal. The Kullu Dussehra festival draws pilgrims from across the mountains.",
    "language": "Hindi, Pahadi (local dialect), Tibetan (in Buddhist areas)",
    "currency": "Indian Rupee (INR)",
    "coordinates": {
      "lat": 32.2432,
      "lng": 77.1892
    },
    "latitude": 32.2432,
    "longitude": 77.1892,
    "imageUrl": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80",
    "gallery": [
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1600298882525-92d56fc1d20c?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1588083949404-c4f1ed1323b3?auto=format&fit=crop&w=600&q=80"
    ],
    "climate": "Alpine (highland)",
    "weather": "Snowy winters (Dec–Feb), mild summers (Mar–Jun), monsoon landslide risk (Jul–Sep)",
    "avgTemperature": "2°C in winter to 22°C in summer",
    "bestTime": "October to June (avoid monsoon)",
    "nearbyAirport": "Bhuntar Airport (KUU) — 50 km; Chandigarh (IXC) — 310 km",
    "metroAvailable": false,
    "publicTransport": "HRTC state buses from Delhi/Chandigarh, private taxis, shared jeeps for mountain routes",
    "budget": "Budget",
    "estimatedBudgetMin": 2000,
    "estimatedBudgetMax": 7000,
    "attractions": [
      "Rohtang Pass (3,978m)",
      "Solang Valley",
      "Hadimba Devi Temple",
      "Old Manali village",
      "Naggar Castle",
      "Kullu Valley",
      "Beas Kund trek"
    ],
    "hiddenGems": [
      "Sethan Village (secret powder skiing)",
      "Chandrakhani Pass trek",
      "Jana Falls",
      "Rashol village homestay"
    ],
    "luxuryHotels": [
      "Span Resort & Spa",
      "The Himalayan (Manali)",
      "Snowflakes by Leisure Hotels"
    ],
    "budgetHotels": [
      "Zostel Manali",
      "Banjara Camps (Solang)",
      "Hotel Holiday Inn Manali"
    ],
    "hotels": [
      "The Himalayan Manali (Luxury)",
      "Hotel Shingar (Moderate)",
      "Zostel Manali (Budget)"
    ],
    "restaurants": [
      "Lazy Dog Lounge",
      "Johnson's Café (Manali)",
      "Café 1947",
      "People Café in Old Manali"
    ],
    "streetFood": [
      "Thukpa noodle soup",
      "Siddu (local bread)",
      "Maggi at mountain dhabas",
      "Momos at Old Manali stalls"
    ],
    "localFoods": [
      "Dham (traditional feast)",
      "Siddu",
      "Chha Gosht (mutton)",
      "Babru (Himachali sweet)",
      "Trout fish"
    ],
    "shoppingAreas": [
      "Mall Road Manali",
      "Old Manali market (shawls, tribal jewelry)",
      "Tibetan Market (thangkas, prayer flags)"
    ],
    "nightlife": [
      "Old Manali cafes with bonfires",
      "DJ nights at Lazy Dog Lounge",
      "Campfire evenings at resorts"
    ],
    "adventureActivities": [
      "Skiing at Rohtang & Solang",
      "White-water rafting on Beas River",
      "Paragliding at Solang Valley",
      "Trekking to Beas Kund",
      "Mountain biking on Hampta Pass trail"
    ],
    "familyActivities": [
      "Snow activities in Solang Valley",
      "Hadimba Temple visit",
      "Yak rides for kids",
      "Manali Sanctuary"
    ],
    "coupleActivities": [
      "Sunset at Naggar Castle",
      "Stargazing at Rohtang",
      "Café hopping in Old Manali",
      "Couple spa at mountain resorts"
    ],
    "soloTravelTips": "Book buses in advance during peak season. Carry warm clothing even in summer for high altitude excursions. Old Manali is the backpacker's hub with cafes and budget stays. Altitude sickness is rare at Manali but stay hydrated.",
    "safetyScore": 8,
    "averageRating": 4.7,
    "totalReviews": 12
  },
  {
    "name": "Shimla",
    "country": "India",
    "state": "Himachal Pradesh",
    "city": "Shimla",
    "category": "Hill Station",
    "description": "The Queen of Hills — India's most iconic hill station, the former summer capital of British India. Victorian architecture, the famous toy train ride, and apple orchards make it timeless.",
    "history": "Shimla was a small village before the British discovered it in 1819. By 1864 it became the summer capital of British India. The legacy remains in the Gothic Christ Church, the Tudor-style Viceregal Lodge, and the colonnaded buildings of The Mall.",
    "culture": "Colonial British heritage blended with Himachali culture. The Mall remains the social center. The Jakhu Temple atop the hill is sacred. Local crafts include Kinnauri shawls and woodwork.",
    "language": "Hindi, Pahari, English",
    "currency": "Indian Rupee (INR)",
    "coordinates": {
      "lat": 31.1048,
      "lng": 77.1734
    },
    "latitude": 31.1048,
    "longitude": 77.1734,
    "imageUrl": "https://images.unsplash.com/photo-1614087932498-1c62a04ed3c5?auto=format&fit=crop&w=800&q=80",
    "gallery": [
      "https://images.unsplash.com/photo-1535530992830-e25d07cfa780?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=600&q=80"
    ],
    "climate": "Subtropical highland",
    "weather": "Cool summers (15–25°C), heavy snowfall Dec–Jan, pleasant spring/autumn",
    "avgTemperature": "13°C annual average",
    "bestTime": "March to June, October to November (for snow: Dec–Feb)",
    "nearbyAirport": "Shimla Airport (SLV) — 22 km; Chandigarh (IXC) — 115 km",
    "metroAvailable": false,
    "publicTransport": "Kalka–Shimla UNESCO Toy Train, HRTC buses, taxis, The Mall is pedestrian only",
    "budget": "Budget",
    "estimatedBudgetMin": 2000,
    "estimatedBudgetMax": 7000,
    "attractions": [
      "The Mall Road",
      "Kufri ski resort",
      "Jakhu Temple",
      "Christ Church",
      "Viceregal Lodge",
      "Toy Train (UNESCO)",
      "Chadwick Falls",
      "Tattapani hot springs"
    ],
    "hiddenGems": [
      "Chail (highest cricket ground in world)",
      "Narkanda apple orchards",
      "Hatu Peak",
      "Mashobra village"
    ],
    "luxuryHotels": [
      "Wildflower Hall (Oberoi)",
      "The Cecil (Maidens Hotel)",
      "Woodville Palace"
    ],
    "budgetHotels": [
      "Hotel Honey Moon Inn",
      "Zostel Shimla",
      "HPTDC Hotel Peterhof"
    ],
    "hotels": [
      "Wildflower Hall by Oberoi (Luxury)",
      "Hotel Combermere (Moderate)",
      "Zostel Shimla (Budget)"
    ],
    "restaurants": [
      "Ashiana & Goofa (HPTDC)",
      "Indian Coffee House (The Mall)",
      "Wake & Bake Café",
      "Seventeen 17 Restaurant"
    ],
    "streetFood": [
      "Siddu at dhabas",
      "Channa Madra",
      "Bhature at Baba Bakery",
      "Momos at Lower Bazar"
    ],
    "localFoods": [
      "Dham (festive platter)",
      "Chana Madra",
      "Patande (pancakes)",
      "Babru",
      "Fresh apple juice"
    ],
    "shoppingAreas": [
      "Lakkar Bazaar (wooden crafts)",
      "The Mall",
      "Lower Bazaar (local goods)",
      "HPCA Cricket Ground market"
    ],
    "nightlife": [
      "The Mall evening stroll",
      "Café scene near Ridge",
      "Bonfires at resort properties"
    ],
    "adventureActivities": [
      "Skiing at Kufri and Narkanda",
      "Trekking to Shali Tibba",
      "Mountain biking near Chail",
      "Ice skating at Snow Ice rink"
    ],
    "familyActivities": [
      "Ice Skating Rink",
      "Kufri Fun World",
      "Toy Train ride",
      "Jakhu Ropeway"
    ],
    "coupleActivities": [
      "Walk on The Mall at dusk",
      "Apple orchard visits in season",
      "Heritage hotel stays",
      "Sunset at Prospect Hill"
    ],
    "soloTravelTips": "Shimla's Mall Road is car-free — enjoy unhurried walks. Stay near The Mall for easy access. The Toy Train from Kalka is an experience in itself (book in advance). December–January guarantees snow.",
    "safetyScore": 9,
    "averageRating": 4.5,
    "totalReviews": 9
  },
  {
    "name": "Munnar",
    "country": "India",
    "state": "Kerala",
    "city": "Munnar",
    "category": "Hill Station",
    "description": "The Kashmir of the South — a breathtaking hill station in Kerala's Western Ghats covered in emerald tea plantations, mist-draped valleys, and cool mountain air.",
    "history": "Munnar was developed by the British as a major tea-growing region in the late 19th century. The High Range Club established by British planters still stands. The Tata Tea company has managed much of the area since independence.",
    "culture": "A unique blend of Kerala and Kannadiga tribal cultures (Muthuvan tribe). The area is predominantly Christian and Hindu. Onam harvest festival is celebrated with elaborate flower carpets (Pookalam).",
    "language": "Malayalam, Tamil, English",
    "currency": "Indian Rupee (INR)",
    "coordinates": {
      "lat": 10.0889,
      "lng": 77.0595
    },
    "latitude": 10.0889,
    "longitude": 77.0595,
    "imageUrl": "https://images.unsplash.com/photo-1544954412-78af02f2e6d5?auto=format&fit=crop&w=800&q=80",
    "gallery": [
      "https://images.unsplash.com/photo-1515859005217-8a1f08870f59?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1556909172-8c2f041fca1e?auto=format&fit=crop&w=600&q=80"
    ],
    "climate": "Highland subtropical",
    "weather": "Cool pleasant 10–20°C year-round, heavy monsoon Jun–Aug",
    "avgTemperature": "15°C average",
    "bestTime": "September to May",
    "nearbyAirport": "Cochin International Airport (COK) — 110 km; Madurai (IXM) — 150 km",
    "metroAvailable": false,
    "publicTransport": "KSRTC buses from Kochi/Coimbatore, private taxis, auto-rickshaws",
    "budget": "Moderate",
    "estimatedBudgetMin": 2500,
    "estimatedBudgetMax": 8000,
    "attractions": [
      "Eravikulam National Park (Nilgiri Tahr)",
      "Mattupetty Dam",
      "Anamudi Peak (South India's highest at 2,695m)",
      "Tea Museum (Tata Tea)",
      "Attukad Waterfalls",
      "Rajamala plateau"
    ],
    "hiddenGems": [
      "Kolukkumalai (world's highest tea estate)",
      "Chinnar Wildlife Sanctuary",
      "Meeshapulimala trek",
      "Vattavada vegetable village"
    ],
    "luxuryHotels": [
      "Windermere Estate",
      "Tea County by CGH Earth",
      "The Tall Trees Resort"
    ],
    "budgetHotels": [
      "Jungle Retreat Munnar",
      "KTDC Munnar Tea County",
      "Hotel Olive Brook"
    ],
    "hotels": [
      "Windermere Estate (Luxury)",
      "Misty Mountain Resort (Moderate)",
      "JJ Cottage (Budget)"
    ],
    "restaurants": [
      "Rapsy Restaurant",
      "Saravana Bhavan (Munnar)",
      "Copper Kettle (Munnar Town)",
      "Ecostreet Organic Café"
    ],
    "streetFood": [
      "Puttu and Kadala curry",
      "Banana leaf meals at local eateries",
      "Freshly brewed estate tea tastings"
    ],
    "localFoods": [
      "Kerala Sadya (banana leaf feast)",
      "Puttu & Kadala",
      "Appam with Stew",
      "Fish Moilee",
      "Fresh estate tea",
      "Spicy Mutton Curry"
    ],
    "shoppingAreas": [
      "Munnar Town market (teas, spices, chocolate)",
      "KTDC Sales Outlet",
      "Devikulam spice gardens"
    ],
    "nightlife": [
      "Bonfire evenings at resorts",
      "Stargazing at Rajamala",
      "Night walks with fireflies (monsoon season)"
    ],
    "adventureActivities": [
      "Trekking to Anamudi Peak",
      "Cycling through tea estates",
      "Rock climbing at Attukad",
      "Night safari at Eravikulam"
    ],
    "familyActivities": [
      "Tea Museum with factory tour",
      "Eravikulam to spot Nilgiri Tahr",
      "Elephant encounter at Chinnar",
      "Boating at Mattupetty"
    ],
    "coupleActivities": [
      "Sunrise at Rajamala",
      "Tea estate walks at dusk",
      "Private tree house stays",
      "Couple spa with forest views"
    ],
    "soloTravelTips": "Rent a two-wheeler to explore tea estates at your own pace. The best views are at sunrise at Rajamala and Kolukkumalai. Carry layers — it gets very cold at night. Local dhabas serve excellent Kerala breakfasts cheaply.",
    "safetyScore": 9,
    "averageRating": 4.8,
    "totalReviews": 14
  },
  {
    "name": "Ooty",
    "country": "India",
    "state": "Tamil Nadu",
    "city": "Ooty",
    "category": "Hill Station",
    "description": "The Queen of Hill Stations — a colonial retreat in the Nilgiri hills of Tamil Nadu, famous for its botanical gardens, Nilgiri Mountain Railway, and sprawling tea estates.",
    "history": "Ooty (Udhagamandalam) was discovered by British Collector John Sullivan in 1819. It quickly became the summer headquarters of the Madras Presidency. The Nilgiri Mountain Railway, completed in 1908, is a UNESCO World Heritage Site.",
    "culture": "A blend of Toda tribal culture (one of India's oldest tribes), Tamil, and British colonial heritage. The Nilgiri Biosphere Reserve is a UNESCO-designated region with immense biodiversity.",
    "language": "Tamil, Toda (tribal), Kannada, English",
    "currency": "Indian Rupee (INR)",
    "coordinates": {
      "lat": 11.4102,
      "lng": 76.695
    },
    "latitude": 11.4102,
    "longitude": 76.695,
    "imageUrl": "https://images.unsplash.com/photo-1540202404-1b927e27fa8b?auto=format&fit=crop&w=800&q=80",
    "gallery": [
      "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=600&q=80"
    ],
    "climate": "Subtropical highland",
    "weather": "Cool and misty, 5–25°C year round, monsoon Jun–Sep",
    "avgTemperature": "17°C average",
    "bestTime": "April to June, September to November",
    "nearbyAirport": "Coimbatore International Airport (CJB) — 90 km",
    "metroAvailable": false,
    "publicTransport": "TNSTC buses, taxis, iconic Nilgiri Mountain Railway (Mettupalayam to Ooty)",
    "budget": "Budget",
    "estimatedBudgetMin": 2000,
    "estimatedBudgetMax": 6000,
    "attractions": [
      "Government Botanical Garden",
      "Nilgiri Mountain Railway (UNESCO)",
      "Ooty Lake",
      "Doddabetta Peak (2,637m)",
      "Mudumalai National Park",
      "Pykara Lake and Falls"
    ],
    "hiddenGems": [
      "Emerald Lake (hidden valley)",
      "Avalanche Lake",
      "Parsons Valley (restricted access)",
      "Ebbanad Toda village"
    ],
    "luxuryHotels": [
      "Savoy Hotel (Ooty) – Taj",
      "Fortune Sullivan Court",
      "Monarch Monarch Ooty"
    ],
    "budgetHotels": [
      "YWCA Guest House Ooty",
      "Hotel Lake View",
      "Zostel Ooty"
    ],
    "hotels": [
      "Savoy Hotel Ooty – Taj (Luxury)",
      "Sterling Ooty (Moderate)",
      "YWCA Ooty (Budget)"
    ],
    "restaurants": [
      "Willy's Coffee Pub",
      "Hotel Nahar's restaurant",
      "Garden Restaurant (YWCA)",
      "Sidewalk Café"
    ],
    "streetFood": [
      "Homemade chocolates at Ooty Variety Hall",
      "Varkey (Kerala sweet bread)",
      "Nilgiri Tea tastings",
      "Ooty Varkey biscuits"
    ],
    "localFoods": [
      "Varkey",
      "Ooty Homemade Chocolates",
      "Fresh Nilgiri tea",
      "Badaga cuisine (Badaga chicken)"
    ],
    "shoppingAreas": [
      "Charing Cross market",
      "Commercial Road",
      "Municipal Market (fresh produce)"
    ],
    "nightlife": [
      "Resort bonfires",
      "Star gazing at Doddabetta",
      "Evening strolls around Ooty Lake"
    ],
    "adventureActivities": [
      "Trekking to Doddabetta Peak",
      "Boating on Ooty Lake",
      "Mountain biking on Nilgiri trails",
      "Safari at Mudumalai"
    ],
    "familyActivities": [
      "Nilgiri Mountain Railway (toy train)",
      "Botanical Garden",
      "Thread Garden (unique art)",
      "Ooty Lake boat rides"
    ],
    "coupleActivities": [
      "Sunrise at Doddabetta",
      "Rose Garden visits",
      "Picnic by Pykara Lake"
    ],
    "soloTravelTips": "The toy train from Mettupalayam is a must — book weeks in advance. Ooty is compact and walkable. Try the fresh homemade chocolates — local shops are scattered everywhere. Self-drive on mountain roads requires skill.",
    "safetyScore": 9,
    "averageRating": 4.4,
    "totalReviews": 7
  },
  {
    "name": "Coorg",
    "country": "India",
    "state": "Karnataka",
    "city": "Madikeri",
    "category": "Hill Station",
    "description": "The Scotland of India — Karnataka's misty coffee country with lush plantations, waterfalls, ancient temples, and the warm Kodava culture. Perfect for a slow-travel nature retreat.",
    "history": "Coorg (Kodagu) was ruled by the Haleri dynasty from 1600 until 1834, when the British annexed it. The Kodava people are known as fierce warriors — they're the only Indian community legally allowed to carry firearms without license.",
    "culture": "The Kodava culture is unique in India — matrilineal in parts, with distinctive customs, dress, and cuisine. Kodava Takk is a distinct language. The Puthari festival (harvest) in December is the most important cultural celebration.",
    "language": "Kodava Takk (Kodava language), Kannada, English",
    "currency": "Indian Rupee (INR)",
    "coordinates": {
      "lat": 12.42,
      "lng": 75.74
    },
    "latitude": 12.42,
    "longitude": 75.74,
    "imageUrl": "https://images.unsplash.com/photo-1590077428593-a55bb07c4665?auto=format&fit=crop&w=800&q=80",
    "gallery": [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80"
    ],
    "climate": "Tropical Highland",
    "weather": "Pleasant 15–25°C, very heavy monsoon (Jun–Sep), cool winters",
    "avgTemperature": "20°C average",
    "bestTime": "October to March",
    "nearbyAirport": "Mangalore Airport (IXE) — 130 km; Bengaluru (BLR) — 250 km",
    "metroAvailable": false,
    "publicTransport": "KSRTC buses from Bengaluru, private taxis",
    "budget": "Moderate",
    "estimatedBudgetMin": 3000,
    "estimatedBudgetMax": 10000,
    "attractions": [
      "Abbey Falls",
      "Raja's Seat viewpoint",
      "Iruppu Falls",
      "Dubare Elephant Camp",
      "Namdroling Monastery (Golden Temple)",
      "Talakaveri (origin of River Kaveri)"
    ],
    "hiddenGems": [
      "Mandalpatti viewpoint (accessible by jeep)",
      "Kotebetta Peak trek",
      "Honnamana Kere lake",
      "Chelavara Falls (off the tourist trail)"
    ],
    "luxuryHotels": [
      "Evolve Back Kuruba Safari Lodge",
      "Orange County Coorg",
      "Tamara Coorg"
    ],
    "budgetHotels": [
      "Coorg Lakeview Homestay",
      "Hotel Cauvery",
      "Coffee Estate Homestay"
    ],
    "hotels": [
      "Evolve Back Kuruba Safari Lodge (Luxury)",
      "Ambatty Greens Resort (Moderate)",
      "Coorg Coffee Estate Homestay (Budget)"
    ],
    "restaurants": [
      "Raintree Restaurant (Madikeri)",
      "East End Restaurant",
      "Hotel Capitol (local thali)"
    ],
    "streetFood": [
      "Akki Roti at local stalls",
      "Puttu at Madikeri town",
      "Fresh coffee estate tours with tastings"
    ],
    "localFoods": [
      "Pandi Curry (pork)",
      "Kadambuttu (steamed rice balls)",
      "Akki Roti",
      "Koli Curry (chicken)",
      "Coorg Honey",
      "Bamboo Shoot curry"
    ],
    "shoppingAreas": [
      "Madikeri Main Market (coffee, spices)",
      "Honey shop at Talakaveri",
      "Cauvery Handicrafts"
    ],
    "nightlife": [
      "Bonfire nights at plantation resorts",
      "Stargazing from coffee estates",
      "Evening village walks"
    ],
    "adventureActivities": [
      "White-water rafting on River Barapole",
      "Trekking to Tadiandamol Peak",
      "Rock climbing near Bhagamandala",
      "Bird watching at Nagarhole"
    ],
    "familyActivities": [
      "Elephant bathing at Dubare",
      "Namdroling Golden Temple",
      "Coffee estate and pepper garden tours"
    ],
    "coupleActivities": [
      "Misty sunrise at Raja's Seat",
      "Private plantation bungalow stays",
      "Riverside resort evenings"
    ],
    "soloTravelTips": "Rent a scooter in Madikeri for exploring nearby coffee estates. Most resorts include meals — opt for full board. Coorg is best explored slowly over 3+ days. Monsoon transforms it into a green paradise (if you don't mind the rain).",
    "safetyScore": 9,
    "averageRating": 4.7,
    "totalReviews": 11
  },
  {
    "name": "Jaipur",
    "country": "India",
    "state": "Rajasthan",
    "city": "Jaipur",
    "category": "Heritage",
    "description": "The Pink City — Rajasthan's royal capital, a jewel of Mughal and Rajput architecture. Home to palaces, forts, bazaars, elephants, and the legendary hospitality of Marwari culture.",
    "history": "Founded in 1727 by Maharaja Sawai Jai Singh II, Jaipur was one of the first planned cities in India. The city is painted pink (a symbol of hospitality) since 1876, when it was painted to welcome Prince Albert of Wales.",
    "culture": "Rich Rajput culture — famous for its folk music, classical dances (Ghoomar, Kathak), miniature paintings, block printing, and gemstone trading. The royal family still resides in the City Palace.",
    "language": "Hindi, Rajasthani (Dhundhari dialect)",
    "currency": "Indian Rupee (INR)",
    "coordinates": {
      "lat": 26.9124,
      "lng": 75.7873
    },
    "latitude": 26.9124,
    "longitude": 75.7873,
    "imageUrl": "https://images.unsplash.com/photo-1524613032530-449a5537e18e?auto=format&fit=crop&w=800&q=80",
    "gallery": [
      "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=600&q=80"
    ],
    "climate": "Semi-arid",
    "weather": "Hot summers (40°C+), mild monsoon, cool pleasant winters",
    "avgTemperature": "25°C annual average",
    "bestTime": "October to March",
    "nearbyAirport": "Jaipur International Airport (JAI) — 12 km",
    "metroAvailable": true,
    "publicTransport": "Jaipur Metro (limited), RSRTC buses, tuk-tuks (autos), Uber/Ola",
    "budget": "Moderate",
    "estimatedBudgetMin": 2000,
    "estimatedBudgetMax": 8000,
    "attractions": [
      "Amber Fort (UNESCO)",
      "City Palace",
      "Hawa Mahal (Palace of Winds)",
      "Jantar Mantar (UNESCO)",
      "Nahargarh Fort",
      "Jal Mahal (floating palace)",
      "Birla Mandir"
    ],
    "hiddenGems": [
      "Abhaneri Chand Baori (stepwell)",
      "Panna Meena Ka Kund",
      "Galta Ji (Monkey Temple)",
      "Samode Palace day trip"
    ],
    "luxuryHotels": [
      "Rambagh Palace (Taj)",
      "Taj Jai Mahal Palace",
      "Samode Palace"
    ],
    "budgetHotels": [
      "Zostel Jaipur",
      "Hotel Pearl Palace",
      "Moustache Jaipur"
    ],
    "hotels": [
      "Rambagh Palace – Taj (Luxury)",
      "Trident Jaipur (Moderate)",
      "Zostel Jaipur (Budget)"
    ],
    "restaurants": [
      "Suvarna Mahal (Rambagh Palace)",
      "Laxmi Mishtan Bhandar (LMB)",
      "Peacock Rooftop Restaurant",
      "Chokhi Dhani (folk village experience)"
    ],
    "streetFood": [
      "Pyaaz ki Kachori at LMB",
      "Dal Baati Churma at Chokhi Dhani",
      "Jalebi at Rawat Mishtan Bhandar",
      "Kulfi at Indira Bazaar"
    ],
    "localFoods": [
      "Dal Baati Churma",
      "Laal Maas (spicy mutton)",
      "Gatte ki Sabzi",
      "Pyaaz Kachori",
      "Ghewar (sweet)",
      "Mirchi Vada"
    ],
    "shoppingAreas": [
      "Johari Bazaar (gemstones)",
      "Bapu Bazaar (textiles)",
      "Tripolia Bazaar (bangles)",
      "Nehru Bazaar (juttis)",
      "MI Road"
    ],
    "nightlife": [
      "Chokhi Dhani folk performances",
      "Rooftop bars at luxury hotels",
      "Nahargarh Fort evening show"
    ],
    "adventureActivities": [
      "Hot air ballooning over Amber Fort",
      "Camel safari at Pushkar (day trip)",
      "Rock climbing at Aravalli ranges",
      "Cycling heritage trail"
    ],
    "familyActivities": [
      "Elephant experience at Amber Fort (sunrise)",
      "Jantar Mantar (astronomy instruments)",
      "Nahargarh Biological Park",
      "City Palace museum"
    ],
    "coupleActivities": [
      "Sunrise camel ride near Amer",
      "Sundowner at Nahargarh Fort",
      "Heritage hotel stay with lake views",
      "Romantic dinner at rooftop"
    ],
    "soloTravelTips": "The Pink City is best explored by hiring a heritage cycle rickshaw for the old city bazaars. Negotiate auto fares before boarding. Carry water — summer heat is intense. Most forts offer audio guides.",
    "safetyScore": 7,
    "averageRating": 4.6,
    "totalReviews": 15
  },
  {
    "name": "Varanasi",
    "country": "India",
    "state": "Uttar Pradesh",
    "city": "Varanasi",
    "category": "Heritage",
    "description": "The Spiritual Heart of India — one of the world's oldest continuously inhabited cities, stretching along the banks of the sacred Ganga. A city of rituals, silk weaving, and eternal devotion.",
    "history": "Varanasi (Kashi) has been continuously inhabited for at least 3,000 years. Mark Twain famously wrote: \"Varanasi is older than history, older than tradition, older even than legend.\" The city has been associated with learning, philosophy, and art since ancient times.",
    "culture": "Hinduism is woven into every aspect of daily life. The burning ghats (Manikarnika, Harishchandra) are in continuous operation 24/7 for over a millennium. Banarasi silk sarees, thumri music, and the evening Ganga Aarti are iconic expressions of Kashi's culture.",
    "language": "Hindi, Bhojpuri, Sanskrit (liturgical)",
    "currency": "Indian Rupee (INR)",
    "coordinates": {
      "lat": 25.3176,
      "lng": 82.9739
    },
    "latitude": 25.3176,
    "longitude": 82.9739,
    "imageUrl": "https://images.unsplash.com/photo-1561361058-c24cecae35ca?auto=format&fit=crop&w=800&q=80",
    "gallery": [
      "https://images.unsplash.com/photo-1600618528240-fb9fc964b853?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1590077428593-a55bb07c4665?auto=format&fit=crop&w=600&q=80"
    ],
    "climate": "Humid subtropical",
    "weather": "Extreme summers (45°C), mild winters (5–20°C), monsoon Jul–Sep",
    "avgTemperature": "26°C annual average",
    "bestTime": "October to March",
    "nearbyAirport": "Lal Bahadur Shastri Airport (VNS) — 26 km",
    "metroAvailable": false,
    "publicTransport": "Auto-rickshaws, cycle-rickshaws, e-rickshaws, boats on Ganga, UPSRTC buses",
    "budget": "Budget",
    "estimatedBudgetMin": 1500,
    "estimatedBudgetMax": 5000,
    "attractions": [
      "Dashashwamedh Ghat (Ganga Aarti)",
      "Kashi Vishwanath Temple",
      "Sarnath (Buddha's first sermon site)",
      "Manikarnika Ghat",
      "Ramnagar Fort",
      "Tulsi Manas Temple",
      "Morning boat ride on Ganga"
    ],
    "hiddenGems": [
      "Lalita Ghat during sunrise",
      "Banaras Hindu University campus",
      "Sankat Mochan Hanuman Temple (music festival)",
      "Godaulia Lane for textiles",
      "Panchganga Ghat"
    ],
    "luxuryHotels": [
      "Taj Ganges Varanasi",
      "Brijrama Palace (heritage)",
      "Nadesar Palace (Taj)"
    ],
    "budgetHotels": [
      "Stops Hostel Varanasi",
      "Hotel Surya",
      "Brown Bread Bakery Guesthouse"
    ],
    "hotels": [
      "Taj Ganges (Luxury)",
      "Rivatas by Ideal (Moderate)",
      "Stops Hostel Varanasi (Budget)"
    ],
    "restaurants": [
      "Aum Café (Blue Lassi nearby)",
      "Keshari Restaurant",
      "Pizzeria Vatika Café (quirky!)",
      "Kashi Chat Bhandar"
    ],
    "streetFood": [
      "Kachori Sabzi at Babu Store",
      "Malaiyyo in winter (only morning)",
      "Tamatar Chaat",
      "Banarasi Lassi at Blue Lassi shop"
    ],
    "localFoods": [
      "Banarasi Paan",
      "Tamatar Chaat",
      "Kachori Subzi",
      "Malaiyyo",
      "Baati Chokha",
      "Thandai (esp. during Holi)"
    ],
    "shoppingAreas": [
      "Vishwanath Gali (silk sarees)",
      "Godaulia market",
      "Thatheri Bazaar (brass goods)",
      "Chowk Market"
    ],
    "nightlife": [
      "Ganga Aarti at Dashashwamedh Ghat (7pm daily)",
      "Evening ghats walk",
      "Cultural music shows in guesthouses"
    ],
    "adventureActivities": [
      "Sunrise boat ride on Ganga",
      "Cycle tour of Old City",
      "Day trip to Vindhyachal and Mirzapur"
    ],
    "familyActivities": [
      "Sarnath Buddhist site and museum",
      "Ramnagar Fort and museum",
      "Morning puja and aarti experience"
    ],
    "coupleActivities": [
      "Private sunrise boat ride",
      "Ganga Aarti front-row seats (book boat early)",
      "Sunset stroll on ghats"
    ],
    "soloTravelTips": "Varanasi is best experienced early morning (pre-sunrise boat ride) and at dusk (Ganga Aarti). The narrow lanes of Old City can be disorienting — embrace it. Avoid touching leather goods near temples. Budget stays are very affordable near the ghats.",
    "safetyScore": 6,
    "averageRating": 4.5,
    "totalReviews": 10
  },
  {
    "name": "Hampi",
    "country": "India",
    "state": "Karnataka",
    "city": "Hosapete",
    "category": "Heritage",
    "description": "A UNESCO World Heritage City of surreal boulders and magnificent ruins — the former capital of the Vijayanagara Empire (14th–16th century). A photographer's paradise and history lover's dream.",
    "history": "Hampi was the wealthiest and one of the largest cities in the world at its peak (circa 1500 CE). The Vijayanagara kingdom stretched across South India. It was sacked and burned in 1565 by the Deccan Sultanates and never recovered. Today over 1,600 ruins remain.",
    "culture": "Hampi is a living pilgrimage site — the Virupaksha Temple remains an active place of worship since the 7th century. The Hampi Utsav festival (December) brings classical music and dance back to the ruins.",
    "language": "Kannada, Telugu, Hindi, English",
    "currency": "Indian Rupee (INR)",
    "coordinates": {
      "lat": 15.335,
      "lng": 76.46
    },
    "latitude": 15.335,
    "longitude": 76.46,
    "imageUrl": "https://images.unsplash.com/photo-1567591370984-5df38e10a9e8?auto=format&fit=crop&w=800&q=80",
    "gallery": [
      "https://images.unsplash.com/photo-1595658658481-d53d3f999875?auto=format&fit=crop&w=600&q=80"
    ],
    "climate": "Semi-arid",
    "weather": "Very hot summers (40°C+), mild monsoon, pleasant winters (20–28°C)",
    "avgTemperature": "27°C annual average",
    "bestTime": "November to February",
    "nearbyAirport": "Hubballi Airport (HBX) — 160 km; Bengaluru (BLR) — 340 km",
    "metroAvailable": false,
    "publicTransport": "Overnight buses from Bengaluru (8 hrs), taxis, bicycle/moped rental within Hampi",
    "budget": "Budget",
    "estimatedBudgetMin": 1500,
    "estimatedBudgetMax": 4000,
    "attractions": [
      "Virupaksha Temple",
      "Vittala Temple (Stone Chariot & musical pillars — UNESCO)",
      "Lotus Mahal & Elephant Stables",
      "Hemakuta Hill",
      "Matanga Hill (sunrise)",
      "Royal Enclosure",
      "Underground Shiva Temple"
    ],
    "hiddenGems": [
      "Sanapur Lake coracle rides",
      "Achyutaraya Temple (less crowded)",
      "Anegundi village across the river",
      "Tungabhadra River sunset bouldering",
      "Hippie Island (Virupapur Gaddi)"
    ],
    "luxuryHotels": [
      "Evolve Back Kamalapura Palace",
      "Hyatt Place Hampi (Hospet)"
    ],
    "budgetHotels": [
      "Goan Corner (Hampi Bazaar)",
      "Mango Tree Restaurant & Lodge",
      "Jungle Lodge Hampi"
    ],
    "hotels": [
      "Evolve Back Kamalapura Palace (Luxury)",
      "Hotel Mayura Bhuvaneshwari (Moderate)",
      "Goan Corner Guesthouse (Budget)"
    ],
    "restaurants": [
      "Mango Tree Restaurant (Riverside)",
      "Laughing Buddha",
      "Hampi Boulders Restaurant",
      "Ravi's Rose Restaurant"
    ],
    "streetFood": [
      "Banana Lassi at bazaar stalls",
      "Corn on the cob at Virupaksha entrance",
      "Vegetarian thalis at local eateries"
    ],
    "localFoods": [
      "Karnataka thali",
      "Bisi Bele Bath",
      "Jowar roti with curry",
      "Coconut chutney dishes",
      "Local palm jaggery sweets"
    ],
    "shoppingAreas": [
      "Hampi Bazaar (stone carvings, prints)",
      "Anegundi village crafts (block print fabrics)"
    ],
    "nightlife": [
      "Riverside bonfire at guesthouses",
      "Rooftop conversations at backpacker cafes",
      "Stargazing from boulders at night"
    ],
    "adventureActivities": [
      "Rock climbing on Hampi boulders",
      "Coracle (round boat) rides on Tungabhadra",
      "Cycling through ruins",
      "Cliff jumping at Sanapur Lake (seasonal)"
    ],
    "familyActivities": [
      "Vittala Temple musical pillars",
      "Elephant stable visits",
      "Boat crossing to Virupapur Gaddi"
    ],
    "coupleActivities": [
      "Sunrise at Matanga Hill",
      "Sunset at Hemakuta Hill",
      "Coracle ride at dusk",
      "Secluded boulder-top evenings"
    ],
    "soloTravelTips": "Hampi is a backpacker heaven. Rent a bicycle or scooter — it's the best way to cover the spread-out ruins. Stay in Hampi Bazaar for atmosphere or across the river for quiet. Carry cash — ATMs are unreliable.",
    "safetyScore": 8,
    "averageRating": 4.7,
    "totalReviews": 9
  },
  {
    "name": "Udaipur",
    "country": "India",
    "state": "Rajasthan",
    "city": "Udaipur",
    "category": "Heritage",
    "description": "The City of Lakes — Rajasthan's most romantic destination with shimmering lakes, marble palaces, and ornate havelis. Named the \"Venice of the East\" for its ethereal waterside grandeur.",
    "history": "Founded in 1559 by Maharana Udai Singh II of the Sisodia Rajput clan, Udaipur was the capital of the Mewar kingdom. The royal family never surrendered to the Mughal Empire — a point of immense cultural pride. The City Palace was continuously built by successive Maharanas over 400 years.",
    "culture": "Mewar culture is distinct in Rajasthan — more refined and artistic. The city is famous for its miniature paintings, Rajasthani folk dances (Ghoomar, Bhavai), and marionette puppet shows. Craft workshops on the ghats of Pichola Lake are a living tradition.",
    "language": "Rajasthani (Mewari dialect), Hindi",
    "currency": "Indian Rupee (INR)",
    "coordinates": {
      "lat": 24.5854,
      "lng": 73.7125
    },
    "latitude": 24.5854,
    "longitude": 73.7125,
    "imageUrl": "https://images.unsplash.com/photo-1587135941948-670b381f08ce?auto=format&fit=crop&w=800&q=80",
    "gallery": [
      "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1590077428593-a55bb07c4665?auto=format&fit=crop&w=600&q=80"
    ],
    "climate": "Semi-arid",
    "weather": "Hot summers, mild monsoon, cool pleasant winters",
    "avgTemperature": "24°C annual average",
    "bestTime": "October to March",
    "nearbyAirport": "Maharana Pratap Airport (UDR) — 24 km",
    "metroAvailable": false,
    "publicTransport": "Auto-rickshaws, cycle rickshaws, taxis, boat ferries on lakes",
    "budget": "Moderate",
    "estimatedBudgetMin": 2500,
    "estimatedBudgetMax": 10000,
    "attractions": [
      "Lake Pichola and Jag Mandir",
      "City Palace complex",
      "Lake Palace Hotel",
      "Sajjangarh (Monsoon Palace)",
      "Saheliyon ki Bari (garden)",
      "Jagdish Temple",
      "Fateh Sagar Lake"
    ],
    "hiddenGems": [
      "Bagore ki Haveli evening cultural show",
      "Shilpgram crafts village",
      "Ambrai Ghat evening",
      "Badi Lake (8 km outside, peaceful)",
      "Nathdwara Shrinathji Temple (day trip)"
    ],
    "luxuryHotels": [
      "Taj Lake Palace (floating palace hotel)",
      "The Leela Palace Udaipur",
      "Raas Devigarh"
    ],
    "budgetHotels": [
      "Zostel Udaipur",
      "Jheel Guest House",
      "Nukkad Hostel"
    ],
    "hotels": [
      "Taj Lake Palace (Luxury — on-water!)",
      "The Lalit Laxmi Vilas Palace (Moderate)",
      "Zostel Udaipur (Budget)"
    ],
    "restaurants": [
      "Upré by 1559 AD (lakeside)",
      "Ambrai Restaurant (views of City Palace)",
      "Jheel's Ginger Coffee Bar",
      "Savage Garden"
    ],
    "streetFood": [
      "Kachori at Suraj Bhan ki Mithaiyan",
      "Bhutte ka Kees",
      "Pyaaz ki Kachori",
      "Mawa Kachori at local shops"
    ],
    "localFoods": [
      "Dal Baati Churma",
      "Gatte ki Sabzi",
      "Ker Sangri (desert beans)",
      "Mawa Kachori",
      "Rabdi with malpua"
    ],
    "shoppingAreas": [
      "Hathi Pol (antiques, miniature paintings)",
      "Bada Bazaar",
      "Jagdish Temple market (silver jewelry)",
      "Shilpgram mela (seasonal)"
    ],
    "nightlife": [
      "Lake Pichola boat ride at dusk",
      "Bagore ki Haveli cultural show (evenings)",
      "Rooftop restaurants with palace views"
    ],
    "adventureActivities": [
      "Vintage car museum and rally",
      "Zip-lining at Zipline Udaipur",
      "ATV riding at Pratap Country Inn",
      "Day trek to Sajjangarh"
    ],
    "familyActivities": [
      "Boat ride on Lake Pichola",
      "City Palace museum",
      "Puppet shows at Bagore ki Haveli"
    ],
    "coupleActivities": [
      "Dinner on the Lake Palace (boat)",
      "Sunset at Doodh Talai Musical Garden",
      "Heritage hotel lakeside stay"
    ],
    "soloTravelTips": "Udaipur is one of India's most beautiful cities. Rent a bicycle and explore the ghats and lanes at your pace. Hire an audio guide at City Palace. Evenings are magical on Ambrai Ghat — bring a camera.",
    "safetyScore": 8,
    "averageRating": 4.8,
    "totalReviews": 13
  },
  {
    "name": "Goa",
    "country": "India",
    "state": "Goa",
    "city": "Panaji",
    "category": "Beach",
    "description": "India's beach paradise — 105 km of coastline, Portuguese heritage villages, vibrant parties, water sports, and Konkani seafood. A year-round destination for relaxation and revelry.",
    "history": "Goa was a Portuguese colony for 451 years (1510–1961), longer than any other Indian territory. This colonial legacy is embedded in the ornate Baroque churches (including UNESCO-listed Old Goa), the architecture of Panaji, the Konkani-Portuguese cuisine, and the Catholic heritage.",
    "culture": "A unique Catholic-Hindu culture. Carnival before Lent, Shigmo festival (Hindu Holi variant), and New Year's eve on the beaches are iconic events. Fado music meets Indian classical in Goa's unique Mando genre. Susegad (Goan concept of peaceful contentment) defines the lifestyle.",
    "language": "Konkani (official), Marathi, English, Portuguese (residual)",
    "currency": "Indian Rupee (INR)",
    "coordinates": {
      "lat": 15.2993,
      "lng": 74.124
    },
    "latitude": 15.2993,
    "longitude": 74.124,
    "imageUrl": "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80",
    "gallery": [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80"
    ],
    "climate": "Tropical Monsoon",
    "weather": "Hot and humid year-round (25–35°C), very heavy monsoon Jun–Sep, dry sunny Nov–May",
    "avgTemperature": "28°C average",
    "bestTime": "November to February",
    "nearbyAirport": "Manohar International Airport (GOX) — 25 km from Panaji",
    "metroAvailable": false,
    "publicTransport": "Rent a scooter/bike (most popular), Kadamba buses, taxis, tourist buses from Panaji",
    "budget": "Moderate",
    "estimatedBudgetMin": 2500,
    "estimatedBudgetMax": 12000,
    "attractions": [
      "Baga and Calangute Beaches",
      "Anjuna Flea Market (Wednesday)",
      "Old Goa Churches (UNESCO)",
      "Dudhsagar Falls",
      "Chapora Fort (Dil Chahta Hai fame)",
      "Palolem Beach (peaceful South Goa)",
      "Casino cruise on Mandovi River"
    ],
    "hiddenGems": [
      "Butterfly Beach (only accessible by boat)",
      "Chorao Island and Salim Ali Bird Sanctuary",
      "Divar Island (vintage Portuguese homes)",
      "Cola Beach (lagoon)",
      "Arambol Sweet Lake"
    ],
    "luxuryHotels": [
      "Taj Exotica Goa",
      "The Leela Goa",
      "W Goa (Vagator)"
    ],
    "budgetHotels": [
      "Zostel Goa",
      "Jungle Hostel Arambol",
      "People Hostel Palolem"
    ],
    "hotels": [
      "Taj Exotica Goa (Luxury)",
      "Alila Diwa Goa (Moderate)",
      "Zostel Goa (Budget)"
    ],
    "restaurants": [
      "Thalassa (Greek-Goan, Vagator)",
      "Gunpowder (South Indian, Assagao)",
      "Bhati's (South Goa seafood)",
      "Fisherman's Wharf (Cavelossim)"
    ],
    "streetFood": [
      "Fish Thali at any beach shack",
      "Prawn Balchão",
      "Beef Chilly Fry at local spots",
      "Bebinca at pastry shops"
    ],
    "localFoods": [
      "Goan Fish Curry Rice",
      "Bebinca (layered sweet)",
      "Prawn Balchão",
      "Chorizo Pão",
      "Chourissos",
      "Feni liqueur (cashew or coconut)"
    ],
    "shoppingAreas": [
      "Anjuna Flea Market",
      "Saturday Night Market (Arpora)",
      "Calangute shops",
      "Dilli Haat equivalent in Panaji",
      "Mapusa Friday Market"
    ],
    "nightlife": [
      "Curlies Beach Shack (Anjuna)",
      "Tito's Club (Baga)",
      "Club Cubana (Arpora Hilltop)",
      "Vagator & Chapora village bars",
      "Casino Royale cruise"
    ],
    "adventureActivities": [
      "Scuba diving & snorkeling at Grande Island",
      "Parasailing at Baga & Calangute",
      "White-water rafting on Mhadei River",
      "Kayaking in Mandovi backwaters",
      "Ziplining at Divar Island"
    ],
    "familyActivities": [
      "Dudhsagar Falls jeep tour",
      "Spice plantation tour",
      "Aguada Fort",
      "Goa Science Centre"
    ],
    "coupleActivities": [
      "Sunset cruise on Mandovi River",
      "Private beach at Butterfly Beach",
      "Romantic dinner at Thalassa",
      "Heritage walk in Old Goa"
    ],
    "soloTravelTips": "Renting a scooter is essential for solo travel in Goa. North Goa (Anjuna, Vagator) is the backpacker scene; South Goa (Palolem, Agonda) is peaceful. Beach shacks are the best value for food. Negotiate with taxi drivers upfront.",
    "safetyScore": 7,
    "averageRating": 4.6,
    "totalReviews": 18
  },
  {
    "name": "Bengaluru",
    "country": "India",
    "state": "Karnataka",
    "city": "Bengaluru",
    "category": "Tech Hub",
    "description": "India's Silicon Valley — the global epicenter of India's tech revolution. A garden city of startups, craft breweries, vibrant pub culture, and pleasant year-round climate.",
    "history": "Founded in 1537 by Kempe Gowda I, Bengaluru was a small settlement until the British cantonment transformed it into a strategic military hub. Post-1991 economic liberalization, it emerged as India's tech capital, housing the headquarters of Infosys, Wipro, and hundreds of global MNCs.",
    "culture": "Bengaluru is the most cosmopolitan Indian city — a true melting pot of cultures from across the country. Kannada pride, startup hustle, cricket passion, and a legendary craft beer scene define modern Bangalore. The city hosts India's largest new year celebrations.",
    "language": "Kannada, English, Hindi, Tamil",
    "currency": "Indian Rupee (INR)",
    "coordinates": {
      "lat": 12.9716,
      "lng": 77.5946
    },
    "latitude": 12.9716,
    "longitude": 77.5946,
    "imageUrl": "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=80",
    "gallery": [
      "https://images.unsplash.com/photo-1546961342-ea5f70b193b5?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1621971455048-74ea7c5ef6e7?auto=format&fit=crop&w=600&q=80"
    ],
    "climate": "Tropical savanna",
    "weather": "Pleasant year-round (15–30°C), mild monsoon Jun–Sep, cool evenings year round",
    "avgTemperature": "24°C average (the most pleasant among Indian metros)",
    "bestTime": "Year-round (ideal: October to February)",
    "nearbyAirport": "Kempegowda International Airport (BLR) — 40 km from city center",
    "metroAvailable": true,
    "publicTransport": "Namma Metro (expanding rapidly), BMTC buses, Uber/Ola (heavy traffic), Rapido bikes",
    "budget": "Moderate",
    "estimatedBudgetMin": 2500,
    "estimatedBudgetMax": 10000,
    "attractions": [
      "Lalbagh Botanical Garden",
      "Cubbon Park",
      "Bangalore Palace",
      "ISKCON Temple",
      "Tipu Sultan's Summer Palace",
      "Vidhana Soudha",
      "Nandi Hills (day trip)"
    ],
    "hiddenGems": [
      "Innovative Film City (quirky day trip)",
      "Manchanabele Reservoir (kayaking)",
      "Hessarghatta Lake (birding)",
      "Gavipuram Cave Temple",
      "Bheemeshwari fishing camp"
    ],
    "luxuryHotels": [
      "ITC Windsor",
      "The Leela Palace Bengaluru",
      "Taj West End"
    ],
    "budgetHotels": [
      "Zostel Bangalore",
      "Treebo Trend Hotels",
      "Hotel Empire"
    ],
    "hotels": [
      "The Leela Palace Bengaluru (Luxury)",
      "Sheraton Grand Bengaluru (Moderate)",
      "Zostel Bangalore (Budget)"
    ],
    "restaurants": [
      "Karavalli (coastal cuisine)",
      "Meghana Foods (Biryani)",
      "The Only Place (steakhouse, rare in India)",
      "MTR 1924 (South Indian breakfast institution)"
    ],
    "streetFood": [
      "Masala Dosa at MTR",
      "Obbattu (sweet flatbread)",
      "Ghee Roast Dosa at Anand Sweets",
      "Darshinis (quick South Indian meals)"
    ],
    "localFoods": [
      "Ragi Mudde (local grain balls)",
      "Bisi Bele Bath",
      "Masala Dosa",
      "Filter Coffee",
      "Avalakki (poha variant)",
      "Dharwad Pedha"
    ],
    "shoppingAreas": [
      "Commercial Street",
      "Brigade Road",
      "MG Road",
      "UB City (luxury)",
      "Phoenix Marketcity",
      "Chickpet (wholesale textiles)"
    ],
    "nightlife": [
      "Indiranagar 100 Feet Road (pub street)",
      "Koramangala bar scene",
      "Toit Brewpub",
      "Hard Rock Café",
      "Arbor Brewing Co."
    ],
    "adventureActivities": [
      "Rock climbing at Ramanagara (Sholay caves)",
      "Trekking to Nandi Hills at sunrise",
      "Skydiving at Devanahalli",
      "Rappelling at Shivagange",
      "White water rafting at Coorg/Dandeli"
    ],
    "familyActivities": [
      "Bannerghatta Biological Park (safari)",
      "HAL Aerospace Museum",
      "Wonderla Amusement Park",
      "National Science Gallery"
    ],
    "coupleActivities": [
      "Sunset at Nandi Hills",
      "Brewery hopping in Indiranagar",
      "Rooftop dining at UB City"
    ],
    "soloTravelTips": "Traffic in Bengaluru is notorious — plan your day around Namma Metro routes. Koramangala and Indiranagar are the startup/young professional hubs. The city is extremely safe for solo travelers, including women.",
    "safetyScore": 8,
    "averageRating": 4.3,
    "totalReviews": 8
  },
  {
    "name": "Hyderabad",
    "country": "India",
    "state": "Telangana",
    "city": "Hyderabad",
    "category": "Tech Hub",
    "description": "The City of Pearls and Pixels — a dynamic blend of Nizam-era grandeur, world-famous Biryani, and India's fastest growing tech ecosystem. Home to Cyberabad, HITEC City, and Golconda Fort.",
    "history": "Founded in 1591 by Muhammad Quli Qutb Shah, Hyderabad was the seat of one of India's richest princely states under the Nizam rulers. Famous for the Kohinoor diamond (which passed through here) and its pearl trade. Post-1947, it joined India and has transformed into a major IT and pharmaceutical hub.",
    "culture": "A unique Muslim Nawabi culture (Dakhni Urdu, Biryani, pearls) blended with Telugu Hindu traditions. The Eid celebrations on Charminar are legendary. Kuchipudi dance from Andhra and Perini Sivatandavam are classical traditions from the region.",
    "language": "Telugu, Urdu, Hindi, English",
    "currency": "Indian Rupee (INR)",
    "coordinates": {
      "lat": 17.385,
      "lng": 78.4867
    },
    "latitude": 17.385,
    "longitude": 78.4867,
    "imageUrl": "https://images.unsplash.com/photo-1605640840605-14ac1855827b?auto=format&fit=crop&w=800&q=80",
    "gallery": [
      "https://images.unsplash.com/photo-1605640840605-14ac1855827b?auto=format&fit=crop&w=600&q=80"
    ],
    "climate": "Semi-arid",
    "weather": "Hot summers (40°C), mild monsoon, pleasant winters (15–25°C)",
    "avgTemperature": "26°C average",
    "bestTime": "October to February",
    "nearbyAirport": "Rajiv Gandhi International Airport (HYD) — 35 km",
    "metroAvailable": true,
    "publicTransport": "Hyderabad Metro (3 lines), TSRTC buses, Ola/Uber, autos",
    "budget": "Moderate",
    "estimatedBudgetMin": 2000,
    "estimatedBudgetMax": 8000,
    "attractions": [
      "Charminar",
      "Golconda Fort (sound and light show)",
      "Ramoji Film City (world's largest)",
      "Hussain Sagar Lake",
      "Salar Jung Museum",
      "Mecca Masjid",
      "Chowmahalla Palace"
    ],
    "hiddenGems": [
      "Paigah Tombs (rarely visited)",
      "Taramati Baradari (heritage complex)",
      "Durgam Cheruvu Cable Bridge at night",
      "Laad Bazaar (bangle market)",
      "Ananthagiri Hills waterfalls (day trip)"
    ],
    "luxuryHotels": [
      "Taj Falaknuma Palace (former Nizam palace!)",
      "ITC Kohenur",
      "Park Hyatt Hyderabad"
    ],
    "budgetHotels": [
      "Zostel Hyderabad",
      "Hotel Sitara Grand",
      "OYO rooms HITEC City"
    ],
    "hotels": [
      "Taj Falaknuma Palace (Luxury)",
      "Novotel HITEC City (Moderate)",
      "Zostel Hyderabad (Budget)"
    ],
    "restaurants": [
      "Paradise Biryani (original since 1953)",
      "Bawarchi (Biryani)",
      "Hotel Shadab (Old City)",
      "Chutneys (South Indian breakfasts)"
    ],
    "streetFood": [
      "Haleem at Shah Ghouse Café (Ramzan special)",
      "Pav Bhaji at Ameerpet",
      "Irani Chai and Osmania Biscuits at Old City cafes",
      "Mirchi Bajji at Charminar"
    ],
    "localFoods": [
      "Hyderabadi Dum Biryani",
      "Haleem (Ramzan)",
      "Lukhmi (fried pastry)",
      "Qubani ka Meetha (apricot dessert)",
      "Irani Chai with Osmania biscuits"
    ],
    "shoppingAreas": [
      "Laad Bazaar (bangles & pearls)",
      "Charminar bazaars",
      "Begum Bazaar",
      "Banjara Hills (upscale shopping)",
      "Inorbit Mall HITEC City"
    ],
    "nightlife": [
      "HITEC City bar scene",
      "Banjara Hills restaurants",
      "Lamakaan cultural space",
      "Hard Rock Café Hyderabad"
    ],
    "adventureActivities": [
      "Trekking at Bhongir Fort (day trip)",
      "Rock climbing at Hampi or Raichur",
      "Water sports at Hussain Sagar",
      "Go-karting at MSR Circuit"
    ],
    "familyActivities": [
      "Ramoji Film City (full day)",
      "Nehru Zoological Park",
      "Snow World",
      "Golconda Fort with light show"
    ],
    "coupleActivities": [
      "Sunset at Hussain Sagar tank bund",
      "Dinner at Taj Falaknuma Palace restaurant",
      "Night walk through Charminar bazaars"
    ],
    "soloTravelTips": "Use the Hyderabad Metro for HITEC City to Charminar. Old City (Charminar area) is best explored on foot or cycle-rickshaw. Hyderabad Biryani must be eaten at Paradise or Bawarchi — not hotel variants.",
    "safetyScore": 7,
    "averageRating": 4.4,
    "totalReviews": 9
  },
  {
    "name": "Rishikesh",
    "country": "India",
    "state": "Uttarakhand",
    "city": "Rishikesh",
    "category": "Adventure",
    "description": "The Yoga Capital of the World, situated along the holy Ganges in the Himalayan foothills. A major hub for adventure sports and spiritual tourism.",
    "history": "A sacred town since ancient times, associated with sages, meditation, and the Ganges river. Famous globally after the Beatles visited in 1968.",
    "culture": "Deeply spiritual, filled with ashrams, yoga studios, and daily Ganga Aarti ceremonies at dusk.",
    "language": "Hindi, Garhwali, English",
    "currency": "Indian Rupee (INR)",
    "coordinates": {
      "lat": 30.0869,
      "lng": 78.2676
    },
    "latitude": 30.0869,
    "longitude": 78.2676,
    "imageUrl": "https://images.unsplash.com/photo-1598977123418-45f04b01fe1e?auto=format&fit=crop&w=800&q=80",
    "gallery": [
      "https://images.unsplash.com/photo-1545638191-1dfb0066bde0?auto=format&fit=crop&w=600&q=80"
    ],
    "climate": "Humid subtropical",
    "weather": "Hot summers (40°C), heavy monsoons, cold winters (5-20°C)",
    "avgTemperature": "22°C average",
    "bestTime": "September to November, March to May",
    "nearbyAirport": "Jolly Grant Airport Dehradun (DED) — 20 km",
    "metroAvailable": false,
    "publicTransport": "Vikrams (shared autos), auto-rickshaws, private taxis",
    "budget": "Budget",
    "estimatedBudgetMin": 1200,
    "estimatedBudgetMax": 4500,
    "attractions": [
      "Laxman Jhula",
      "Ram Jhula",
      "Triveni Ghat (Ganga Aarti)",
      "Beatles Ashram",
      "Neer Garh Waterfall",
      "Parmarth Niketan Ashram"
    ],
    "hiddenGems": [
      "Vashishta Gufa (meditation cave)",
      "Phool Chatti waterfall",
      "Kunjapuri Temple sunrise trek"
    ],
    "luxuryHotels": [
      "The Roseate Ganges",
      "Taj Rishikesh Resort & Spa",
      "Ananda in the Himalayas (nearby Luxury Wellness Spa)"
    ],
    "budgetHotels": [
      "Zostel Rishikesh",
      "Live Free Hostel",
      "Skyard Rishikesh"
    ],
    "hotels": [
      "Taj Rishikesh (Luxury)",
      "Aloha on the Ganges (Moderate)",
      "Zostel Rishikesh (Budget)"
    ],
    "restaurants": [
      "Chotiwala (traditional)",
      "Little Buddha Cafe",
      "Freedom Cafe"
    ],
    "streetFood": [
      "Aloo Poori at Triveni Ghat",
      "Jalebi",
      "Samosa",
      "Lassi"
    ],
    "localFoods": [
      "Garhwali cuisine (Kafuli, Phaanu)",
      "Aloo Poori",
      "Ayurvedic meals"
    ],
    "shoppingAreas": [
      "Laxman Jhula Market",
      "Rishikesh Main Market"
    ],
    "nightlife": [
      "Alcohol is banned. Evening Ganga Aarti is the main night activity, along with quiet cafes."
    ],
    "adventureActivities": [
      "White-water rafting in Ganges",
      "Bungee jumping at Mohan Chatti (highest in India)",
      "Cliff jumping",
      "Giant Swing"
    ],
    "familyActivities": [
      "Ganga Aarti at Triveni Ghat",
      "Camping in Shivpuri",
      "Visiting historic temples"
    ],
    "coupleActivities": [
      "Sunrise trek to Kunjapuri Temple",
      "Spa sessions at wellness retreats"
    ],
    "soloTravelTips": "Very safe for solo travelers, especially spiritual seekers. Rishikesh is fully vegetarian and alcohol-free.",
    "safetyScore": 9,
    "averageRating": 4.6,
    "totalReviews": 12
  },
  {
    "name": "Amritsar",
    "country": "India",
    "state": "Punjab",
    "city": "Amritsar",
    "category": "Heritage",
    "description": "Home to the legendary Golden Temple, the spiritual and cultural center of the Sikh religion. Celebrated for its historic heritage and Punjabi food.",
    "history": "Founded in 1577 by Guru Ram Das, the fourth Sikh Guru. The city is named after the holy pool (Amritsar = pool of nectar) surrounding the Golden Temple.",
    "culture": "Warm Punjabi hospitality, rich military history, traditional folk dances (Bhangra, Giddha), and community service (Langar).",
    "language": "Punjabi, Hindi, English",
    "currency": "Indian Rupee (INR)",
    "coordinates": {
      "lat": 31.634,
      "lng": 74.8723
    },
    "latitude": 31.634,
    "longitude": 74.8723,
    "imageUrl": "https://images.unsplash.com/photo-1588158011674-3f73cd34cecc?auto=format&fit=crop&w=800&q=80",
    "gallery": [
      "https://images.unsplash.com/photo-1605833556294-ea5c7774f40d?auto=format&fit=crop&w=600&q=80"
    ],
    "climate": "Semiarid",
    "weather": "Hot summers (45°C), wet monsoons, very cold winters (0-15°C)",
    "avgTemperature": "23°C average",
    "bestTime": "October to March",
    "nearbyAirport": "Sri Guru Ram Dass Jee International Airport (ATQ) — 11 km",
    "metroAvailable": false,
    "publicTransport": "Auto-rickshaws, cycle-rickshaws, HOP-ON HOP-OFF tourist buses, Ola/Uber",
    "budget": "Budget",
    "estimatedBudgetMin": 1500,
    "estimatedBudgetMax": 5000,
    "attractions": [
      "Golden Temple (Harmandir Sahib)",
      "Jallianwala Bagh",
      "Wagah Border Ceremony",
      "Partition Museum",
      "Gobindgarh Fort",
      "Durgiana Temple"
    ],
    "hiddenGems": [
      "Harike Wetland (bird sanctuary day trip)",
      "Sarhad (Wagah border restaurant celebrating Indo-Pak food)"
    ],
    "luxuryHotels": [
      "Taj Swarna",
      "Radisson Blu Hotel Amritsar",
      "Hyatt Regency Amritsar"
    ],
    "budgetHotels": [
      "Backpackers Nest",
      "Sava Hostel",
      "Hotel Golden Tulip"
    ],
    "hotels": [
      "Taj Swarna (Luxury)",
      "Hyatt Regency (Moderate)",
      "Sava Hostel (Budget)"
    ],
    "restaurants": [
      "Kesar Da Dhaba (since 1916)",
      "Bharawan Da Dhaba",
      "Beera Chicken House"
    ],
    "streetFood": [
      "Amritsari Kulcha (buttery flatbread)",
      "Lassi in giant brass glasses",
      "Amritsari Fish",
      "Pinni (sweet)"
    ],
    "localFoods": [
      "Amritsari Kulcha",
      "Dal Makhani with Lachha Paratha",
      "Sarson ka Saag & Makki di Roti (winter)",
      "Langar Prasad"
    ],
    "shoppingAreas": [
      "Hall Bazaar",
      "Katra Jaimal Singh Market (Phulkari embroidery & Punjabi juttis)"
    ],
    "nightlife": [
      "Walking around the illuminated Golden Temple plaza at night is serene and magical."
    ],
    "adventureActivities": [
      "Farm tours in rural Punjab (tractor rides, milking cows)"
    ],
    "familyActivities": [
      "Wagah Border retreat ceremony",
      "Gobindgarh Fort light and sound show",
      "Langar volunteering at Golden Temple"
    ],
    "coupleActivities": [
      "Romantic evening walks in the Heritage Street",
      "Fine dining at local Havelis"
    ],
    "soloTravelTips": "Extremely welcoming city. The Golden Temple is open 24/7, offers free community meals (Langar), and has free/affordable lodging options for backpackers.",
    "safetyScore": 9,
    "averageRating": 4.8,
    "totalReviews": 15
  },
  {
    "name": "Srinagar",
    "country": "India",
    "state": "Jammu and Kashmir",
    "city": "Srinagar",
    "category": "Hill Station",
    "description": "The summer capital of Jammu & Kashmir, famous for its houseboats, Mughal gardens, Dal Lake, and snow-clad mountain backdrops.",
    "history": "Dating back to the 3rd century BC, ruled by Emperor Ashoka, Mughal emperors, Afghan rulers, and Sikh governors. A historic trading post on the Silk Road.",
    "culture": "Kashmiri handicrafts (Pashmina shawls, carpets, wood carving), classical Sufi music, Kashmiri Wazwan feast, and houseboat lifestyle.",
    "language": "Kashmiri, Urdu, Dogri, Hindi, English",
    "currency": "Indian Rupee (INR)",
    "coordinates": {
      "lat": 34.0837,
      "lng": 74.7973
    },
    "latitude": 34.0837,
    "longitude": 74.7973,
    "imageUrl": "https://images.unsplash.com/photo-1566228015668-4c45dbc4e2f5?auto=format&fit=crop&w=800&q=80",
    "gallery": [
      "https://images.unsplash.com/photo-1598324421714-23327d442045?auto=format&fit=crop&w=600&q=80"
    ],
    "climate": "Humid subtropical/Continental",
    "weather": "Pleasant warm summers (15-30°C), monsoonal rains, snowy winters (-3 to 10°C)",
    "avgTemperature": "14°C average",
    "bestTime": "April to October",
    "nearbyAirport": "Srinagar Airport (SXR) — 12 km",
    "metroAvailable": false,
    "publicTransport": "Shikaras (water taxis on Dal Lake), local mini-buses, private taxis, auto-rickshaws",
    "budget": "Moderate",
    "estimatedBudgetMin": 2500,
    "estimatedBudgetMax": 8000,
    "attractions": [
      "Dal Lake (Shikara ride & floating markets)",
      "Shalimar Bagh (Mughal garden)",
      "Nishat Bagh",
      "Chashme Shahi",
      "Indira Gandhi Memorial Tulip Garden",
      "Hazratbal Shrine",
      "Shankaracharya Temple"
    ],
    "hiddenGems": [
      "Dachigam National Park (home of Hangul stag)",
      "Nigeen Lake (quieter than Dal Lake)",
      "Pari Mahal historic monument"
    ],
    "luxuryHotels": [
      "The Lalit Grand Palace Srinagar",
      "Taj Palace Srinagar",
      "Khyber Himalayan Resort (Gulmarg nearby)"
    ],
    "budgetHotels": [
      "Backpackers Inn Srinagar",
      "Hotel Dal Border",
      "Traditional Houseboats (Budget options)"
    ],
    "hotels": [
      "The Lalit Grand Palace (Luxury)",
      "WelcomeHotel Pine & Peak (Moderate)",
      "Houseboat Pride of Kashmir (Budget)"
    ],
    "restaurants": [
      "Mughal Darbar",
      "Ahdoos (traditional Wazwan)",
      "Stream Restaurant"
    ],
    "streetFood": [
      "Kashmiri Kebabs",
      "Tujji (barbecued meat)",
      "Nadru Monje (lotus stem fritters)",
      "Kahwa (saffron tea)"
    ],
    "localFoods": [
      "Rogan Josh",
      "Gustaaba (meatballs)",
      "Yakhni curry",
      "Haakh (collard greens)",
      "Kahwa tea",
      "Sheermal"
    ],
    "shoppingAreas": [
      "Lal Chowk",
      "Residency Road",
      "Floating vegetable market on Dal Lake (early morning)"
    ],
    "nightlife": [
      "Shikara ride at dusk",
      "Dinner on houseboats. Major establishments close early."
    ],
    "adventureActivities": [
      "Trekking in Sonamarg/Pahalgam (day trips)",
      "Skiing and Gondola ride in Gulmarg (50 km away)"
    ],
    "familyActivities": [
      "Shikara boat ride",
      "Exploring Mughal gardens",
      "Staying in a historic wooden houseboat"
    ],
    "coupleActivities": [
      "Tulip garden walk",
      "Shikara sunset ride",
      "Candlelit dinner in a premium houseboat"
    ],
    "soloTravelTips": "Check local news and travel advisories. Srinagar is very welcoming to tourists. Dal Lake houseboats are safe and offer a unique local experience.",
    "safetyScore": 8,
    "averageRating": 4.7,
    "totalReviews": 11
  },
  {
    "name": "Leh",
    "country": "India",
    "state": "Ladakh",
    "city": "Leh",
    "category": "Adventure",
    "description": "High-altitude desert capital of Ladakh, known for its dramatic mountain landscapes, Buddhist monasteries, and high passes.",
    "history": "A historic capital of the Himalayan kingdom of Ladakh. Centered on the Silk Road trade route connecting Tibet, China, and India.",
    "culture": "Tibetan Buddhist culture. Celebrates monastery festivals (Hemis, Spituk) with sacred masked dances (Cham), traditional archery, and polo.",
    "language": "Ladakhi, Tibetan, Hindi, English",
    "currency": "Indian Rupee (INR)",
    "coordinates": {
      "lat": 34.1526,
      "lng": 77.5771
    },
    "latitude": 34.1526,
    "longitude": 77.5771,
    "imageUrl": "https://images.unsplash.com/photo-1596700427387-a2f00a5a3a0e?auto=format&fit=crop&w=800&q=80",
    "gallery": [
      "https://images.unsplash.com/photo-1614522880655-0810b656a0c5?auto=format&fit=crop&w=600&q=80"
    ],
    "climate": "Cold desert",
    "weather": "Cool pleasant summers (15-28°C), freezing harsh winters (-15 to 5°C with heavy snow)",
    "avgTemperature": "6°C average",
    "bestTime": "June to September",
    "nearbyAirport": "Kushok Bakula Rimpochee Airport (IXL) — 4 km",
    "metroAvailable": false,
    "publicTransport": "Shared taxis/jeeps for regional routes, local mini-buses, rented motorbikes (Royal Enfield)",
    "budget": "Luxury",
    "estimatedBudgetMin": 3000,
    "estimatedBudgetMax": 12000,
    "attractions": [
      "Leh Palace",
      "Shanti Stupa",
      "Hemis Monastery",
      "Thiksey Monastery",
      "Magnetic Hill",
      "Confluence of Indus and Zanskar rivers",
      "Pangong Lake (day/overnight trip)"
    ],
    "hiddenGems": [
      "Tso Moriri Lake",
      "Diskit Monastery (Nubra Valley)",
      "Basgo Plains ruins"
    ],
    "luxuryHotels": [
      "The Grand Dragon Ladakh",
      "The Zen Ladakh",
      "Chamba Camp Thiksey"
    ],
    "budgetHotels": [
      "Zostel Leh",
      "Raybo Hostel",
      "Singge Palace"
    ],
    "hotels": [
      "The Grand Dragon (Luxury)",
      "Hotel Singge Palace (Moderate)",
      "Zostel Leh (Budget)"
    ],
    "restaurants": [
      "The Tibetan Kitchen",
      "Gesmo Restaurant",
      "Chopsticks Noodle Bar"
    ],
    "streetFood": [
      "Thukpa",
      "Momos",
      "Khambir (traditional Ladakhi bread)",
      "Butter Tea"
    ],
    "localFoods": [
      "Skyu (Ladakhi pasta-stew)",
      "Thukpa",
      "Momos",
      "Butter Tea",
      "Apricot jam"
    ],
    "shoppingAreas": [
      "Leh Main Bazaar",
      "Tibetan Handicraft Market"
    ],
    "nightlife": [
      "Stargazing (exceptionally clear skies)",
      "Strolls around Main Bazaar. Very peaceful and quiet."
    ],
    "adventureActivities": [
      "Motorcycling through Khardung La Pass (one of the highest motorable roads in the world)",
      "White-water rafting in Zanskar River",
      "Trekking (Spituk to Stok, Markha Valley)"
    ],
    "familyActivities": [
      "Monastery visits",
      "Sightseeing Confluence",
      "Double-humped Bactrian camel rides in Nubra Valley"
    ],
    "coupleActivities": [
      "Camping under starry skies at Pangong Lake",
      "Sunrise at Thiksey Monastery"
    ],
    "soloTravelTips": "Acclimatization is mandatory! Spend the first 24-48 hours completely resting in Leh to prevent Acute Mountain Sickness (AMS). Drink lots of water.",
    "safetyScore": 9,
    "averageRating": 4.8,
    "totalReviews": 14
  },
  {
    "name": "Pondicherry",
    "country": "India",
    "state": "Puducherry",
    "city": "Pondicherry",
    "category": "Beach",
    "description": "A charming coastal town with a rich French colonial heritage, yellow-washed buildings, quiet beaches, and Auroville.",
    "history": "A French colonial settlement in India until 1954, when it merged with the Indian Union. Designed in French grid layout with a canal dividing the French and Indian quarters.",
    "culture": "Unique Franco-Tamil cultural blend (Creole food, French spoken, petanque played, police wearing red kepis) alongside spiritual communities (Sri Aurobindo Ashram, Auroville).",
    "language": "Tamil, French, English, Telugu",
    "currency": "Indian Rupee (INR)",
    "coordinates": {
      "lat": 11.9416,
      "lng": 79.8083
    },
    "latitude": 11.9416,
    "longitude": 79.8083,
    "imageUrl": "https://images.unsplash.com/photo-1589793907316-f94015546115?auto=format&fit=crop&w=800&q=80",
    "gallery": [
      "https://images.unsplash.com/photo-1600100398017-d4fa28882522?auto=format&fit=crop&w=600&q=80"
    ],
    "climate": "Tropical wet and dry",
    "weather": "Hot and humid summers (38°C), monsoons (Oct-Dec), pleasant winters (20-28°C)",
    "avgTemperature": "28°C average",
    "bestTime": "October to March",
    "nearbyAirport": "Pondicherry Airport (PNY) or Chennai (MAA) — 150 km",
    "metroAvailable": false,
    "publicTransport": "Rented two-wheelers (scooters/bicycles are main tourist transit), auto-rickshaws, local buses",
    "budget": "Moderate",
    "estimatedBudgetMin": 1500,
    "estimatedBudgetMax": 5000,
    "attractions": [
      "Promenade Beach",
      "French Quarter (White Town)",
      "Auroville & Matrimandir",
      "Sri Aurobindo Ashram",
      "Paradise Beach",
      "Basilica of the Sacred Heart of Jesus"
    ],
    "hiddenGems": [
      "Auroville Forest paths",
      "Chunambar Boat House backwaters",
      "Serenity Beach surfing school"
    ],
    "luxuryHotels": [
      "Palais de Mahé - CGH Earth",
      "La Villa Pondicherry",
      "The Promenade"
    ],
    "budgetHotels": [
      "Micasa Hostels",
      "Zostel Pondicherry",
      "La Maison de Villa"
    ],
    "hotels": [
      "Palais de Mahe (Luxury)",
      "The Promenade (Moderate)",
      "Zostel Pondicherry (Budget)"
    ],
    "restaurants": [
      "Coromandel Cafe",
      "Villa Shanti",
      "Cafe des Arts",
      "Baker Street (French bakery)"
    ],
    "streetFood": [
      "Mutton rolls",
      "Samosa",
      "French croissants & baguettes",
      "Crepes"
    ],
    "localFoods": [
      "Pondicherrian French Creole cuisine",
      "Wood-fired pizzas at Auroville",
      "Fresh seafood",
      "Filter coffee"
    ],
    "shoppingAreas": [
      "Mission Street",
      "Jawaharlal Nehru Street",
      "Auroville boutique outlets (handcrafted soaps, incense, pottery)"
    ],
    "nightlife": [
      "Beachside bars in White Town",
      "Auroville quiet community events",
      "Pubs on Boulevard road"
    ],
    "adventureActivities": [
      "Scuba diving (Temple Reef, Danny's Eel garden)",
      "Surfing at Serenity Beach"
    ],
    "familyActivities": [
      "Boat ride at Chunambar to Paradise Beach",
      "Cycling tour of French Town",
      "Visiting Auroville"
    ],
    "coupleActivities": [
      "Sunrise walk on Promenade beach",
      "Candlelit dinner at Villa Shanti courtyard",
      "Strolling under Bougainvillea-covered French houses"
    ],
    "soloTravelTips": "Pondicherry is very safe and highly popular among solo female travelers. Rent a scooter for around Rs. 300/day to navigate easily.",
    "safetyScore": 9,
    "averageRating": 4.4,
    "totalReviews": 8
  },
  {
    "name": "Kochi",
    "country": "India",
    "state": "Kerala",
    "city": "Kochi",
    "category": "Heritage",
    "description": "A historic port city blending Portuguese, Dutch, British, and Chinese influences, famous for its giant Chinese fishing nets.",
    "history": "Known as the Queen of the Arabian Sea, Kochi was an important spice trading center since the 14th century. The first European settlement in India (Portuguese in 1503).",
    "culture": "Kathakali classical dance, Kalaripayattu martial arts, Syrian Christian culture, Jewish heritage at Jew Town, and Kochi-Muziris Biennale (art event).",
    "language": "Malayalam, English, Hindi",
    "currency": "Indian Rupee (INR)",
    "coordinates": {
      "lat": 9.9312,
      "lng": 76.2673
    },
    "latitude": 9.9312,
    "longitude": 76.2673,
    "imageUrl": "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=800&q=80",
    "gallery": [
      "https://images.unsplash.com/photo-1589984662646-e7b2e4962f18?auto=format&fit=crop&w=600&q=80"
    ],
    "climate": "Tropical monsoon",
    "weather": "Hot and humid year-round (25-35°C), heavy monsoons (June-September), pleasant winter breeze",
    "avgTemperature": "28°C average",
    "bestTime": "October to March",
    "nearbyAirport": "Cochin International Airport (COK) — 28 km",
    "metroAvailable": true,
    "publicTransport": "Kochi Metro, Water Metro (state-of-the-art catamaran ferries), local buses, auto-rickshaws, Uber/Ola",
    "budget": "Moderate",
    "estimatedBudgetMin": 1800,
    "estimatedBudgetMax": 6000,
    "attractions": [
      "Fort Kochi & Chinese Fishing Nets",
      "Mattancherry Palace (Dutch Palace)",
      "Paradesi Synagogue (Jew Town)",
      "St. Francis Church (Vasco da Gama's burial site)",
      "Kerala Kathakali Centre",
      "Marine Drive"
    ],
    "hiddenGems": [
      "Kumbalangi Integrated Tourism Village",
      "Cherai Beach quieter stretch",
      "Hill Palace Museum (Tripunithura)"
    ],
    "luxuryHotels": [
      "Brunton Boatyard - CGH Earth",
      "Grand Hyatt Kochi Bolgatty",
      "Taj Malabar Resort & Spa"
    ],
    "budgetHotels": [
      "Zostel Kochi (Fort Kochi)",
      "Happy Camper Hostel",
      "Soma Houseboat (nearby)"
    ],
    "hotels": [
      "Brunton Boatyard (Luxury)",
      "Casino Hotel (Moderate)",
      "Zostel Kochi (Budget)"
    ],
    "restaurants": [
      "Kashi Art Cafe",
      "Fort Cochin Seafood Restaurant",
      "Ginger House Restaurant"
    ],
    "streetFood": [
      "Banana fritters (Pazham Pori)",
      "Kappa & Meen Curry (tapioca and fish)",
      "Beef Fry with Malabar Parotta"
    ],
    "localFoods": [
      "Malabar Parotta with Beef Fry",
      "Karimeen Pollichathu (pearl spot fish baked in banana leaf)",
      "Sadya (traditional vegetarian feast served on banana leaf)"
    ],
    "shoppingAreas": [
      "Jew Town antique shops",
      "LuLu Mall (one of India's largest)",
      "Broadway spice markets"
    ],
    "nightlife": [
      "Sunset ferries, Kathakali evening shows, dining in Fort Kochi cafes."
    ],
    "adventureActivities": [
      "Kayaking in Kochi backwaters",
      "Scuba diving off Cochin coast"
    ],
    "familyActivities": [
      "Water Metro ride",
      "Fort Kochi beach stroll",
      "Kathakali cultural dance show"
    ],
    "coupleActivities": [
      "Sunset cruise on Cochin Harbor",
      "Seafood dining in Fort Kochi heritage properties"
    ],
    "soloTravelTips": "Kochi is very well-connected. The Kochi Water Metro is a cheap, scenic, and futuristic way to travel between islands.",
    "safetyScore": 9,
    "averageRating": 4.5,
    "totalReviews": 9
  },
  {
    "name": "Lakshadweep",
    "country": "India",
    "state": "Lakshadweep",
    "city": "Kavaratti",
    "category": "Beach",
    "description": "An archipelago of pristine coral atolls in the Laccadive Sea, famous for crystal-clear lagoons, scuba diving, and white sandy beaches.",
    "history": "Mentioned in ancient Sangam literature and traversed by Arab merchants. Remained isolated until incorporated as a Union Territory of India in 1956.",
    "culture": "Traditional Islamic island culture with Malayalam roots. Celebrates local dances like Lava, Parichakali, and traditional boat race festivals.",
    "language": "Jeseri (local dialect), Mahl (Minicoy), Malayalam, English",
    "currency": "Indian Rupee (INR)",
    "coordinates": {
      "lat": 10.5667,
      "lng": 72.6369
    },
    "latitude": 10.5667,
    "longitude": 72.6369,
    "imageUrl": "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80",
    "gallery": [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80"
    ],
    "climate": "Tropical warm",
    "weather": "Hot summers (28-36°C), heavy monsoons (June-October), pleasant winters (22-30°C)",
    "avgTemperature": "28°C average",
    "bestTime": "October to May",
    "nearbyAirport": "Agatti Airport (AGX) — connected via flights from Kochi",
    "metroAvailable": false,
    "publicTransport": "Passenger ferries between islands, private speedboats, walking, rented bicycles",
    "budget": "Luxury",
    "estimatedBudgetMin": 5000,
    "estimatedBudgetMax": 20000,
    "attractions": [
      "Bangaram Atoll",
      "Kavaratti Marine Aquarium",
      "Agatti Beach",
      "Kadmat Island (scuba diving center)",
      "Minicoy Island (Light house)"
    ],
    "hiddenGems": [
      "Thinnakara Island (uninhabited atoll)",
      "Suheli Par reef"
    ],
    "luxuryHotels": [
      "Bangaram Island Resort (Premium Government cottages)",
      "Agatti Island Beach Resort"
    ],
    "budgetHotels": [
      "Government Tourist Huts (Kavaratti/Kadmat)",
      "Homestays in Agatti"
    ],
    "hotels": [
      "Bangaram Island Resort (Luxury)",
      "Agatti Island Resort (Moderate)",
      "Kavaratti Tourist Huts (Budget)"
    ],
    "restaurants": [
      "Local resort dining halls (main food option on islands)",
      "Agatti local fish shacks"
    ],
    "streetFood": [
      "Fried fish",
      "Coconut sweet fritters",
      "Tender coconut water"
    ],
    "localFoods": [
      "Coconut-based seafood curries",
      "Fried Fish",
      "Rice with local coconut chutneys"
    ],
    "shoppingAreas": [
      "No commercial shopping malls. Local markets sell coconut handicrafts and seashells."
    ],
    "nightlife": [
      "Stargazing and night walks on pristine beaches. Extremely quiet and serene."
    ],
    "adventureActivities": [
      "Scuba diving in deep coral reefs",
      "Snorkeling with sea turtles",
      "Kayaking in shallow lagoons",
      "Windsurfing",
      "Glass bottom boat rides"
    ],
    "familyActivities": [
      "Glass bottom boat ride",
      "Lagoon swimming",
      "Turtle watching tour"
    ],
    "coupleActivities": [
      "Private candlelight beach dinners",
      "Visiting uninhabited atolls via speedboat"
    ],
    "soloTravelTips": "Special entry permits are mandatory for all tourists! Book your permit and flights well in advance through licensed operators or SPORTS (government tourism board). Bicycles are perfect for transport.",
    "safetyScore": 10,
    "averageRating": 4.7,
    "totalReviews": 6
  }
];

const seedDatabaseInline = async (shouldExit = false) => {
  try {
    console.log('🔍 Checking database collections status...');
    
    const userCount = await User.countDocuments({});
    if (userCount === 0) {
      console.log('👤 Seeding Users...');
      for (const u of users) {
        // Enforce hashed passwords during registration/seeding for production readiness
        const { password, ...userData } = u;
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        await User.create({
          ...userData,
          hashedPassword: hashedPassword,
          otpVerified: true,
          emailVerified: true
        });
      }
    } else {
      console.log('👤 User database already contains data. Skipping user seeding.');
    }

    const allDestinations = [...destinations, ...supplementaryDestinations];
    const destCount = await Destination.countDocuments({});
    const { getDestinationImageUrl } = require('./destinationImages');
    
    if (destCount === 0) {
      console.log(`🌍 Seeding ${allDestinations.length} Destinations...`);
      for (const d of allDestinations) {
        const correctImg = getDestinationImageUrl(d.name);
        await Destination.create({
          ...d,
          imageUrl: correctImg,
          gallery: [correctImg]
        });
      }
      console.log(`✅ Database seeded successfully with ${allDestinations.length} destinations!`);
    } else {
      console.log('🌍 Destinations are already seeded. Checking and updating image URLs...');
      let added = 0;
      let updated = 0;
      for (const d of allDestinations) {
        const exists = await Destination.findOne({ name: d.name });
        const correctImg = getDestinationImageUrl(d.name);
        if (!exists) {
          await Destination.create({
            ...d,
            imageUrl: correctImg,
            gallery: [correctImg]
          });
          added++;
        } else {
          exists.imageUrl = correctImg;
          exists.gallery = [correctImg];
          await exists.save();
          updated++;
        }
      }
      console.log(`✅ Seeded ${added} missing destinations and updated ${updated} existing destinations with correct unique images.`);
    }

    if (shouldExit) process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    if (shouldExit) process.exit(1);
  }
};

const runStandalone = async () => {
  try {
    const connString = process.env.MONGODB_URI;
    if (!connString) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }
    console.log('Connecting to database for seeding...');
    await mongoose.connect(connString);
    await seedDatabaseInline(true);
  } catch (error) {
    console.error('Standalone seeding failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  runStandalone();
}

module.exports = { seedDatabaseInline };
