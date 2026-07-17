export interface UserProfile {
  firstName: string;
  lastName: string;
  phone: string;
  avatarUrl: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user';
  profile: UserProfile;
  createdAt?: string;
  updatedAt?: string;
}

export interface BudgetBreakdown {
  hotelCost: number;
  foodCost: number;
  transportCost: number;
  attractionsCost: number;
  total: number;
}

export interface Trip {
  _id: string;
  user: string | User;
  destination: string;
  country: string;
  startDate: string;
  numberOfDays: number;
  budget: 'Budget' | 'Moderate' | 'Luxury';
  numberOfTravelers: number;
  interests: string[];
  transportPreference: 'Public Transit' | 'Car Rental' | 'Walking' | 'Flights' | 'Taxi';
  hotelPreference: 'Hostel' | 'Hotel' | 'Resort' | 'Airbnb' | 'None';
  foodPreference: 'Any' | 'Vegetarian' | 'Vegan' | 'Halal' | 'Kosher';
  tripType: 'Solo' | 'Family' | 'Couple' | 'Friends' | 'Business';
  isSaved: boolean;
  estimatedBudgetBreakdown: BudgetBreakdown;
  createdAt?: string;
  updatedAt?: string;
}

export interface DayPlan {
  _id?: string;
  dayNumber: number;
  morningPlan: string;
  afternoonPlan: string;
  eveningPlan: string;
  recommendedAttractions: string[];
  restaurants: string[];
  localFood: string[];
  transportationTips: string;
  estimatedDailyBudget: number;
}

export interface Itinerary {
  _id: string;
  trip: string;
  user: string;
  days: DayPlan[];
  travelTips: string[];
  packingList?: string[];
  hotels?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Destination {
  _id: string;
  name: string;
  country: string;
  state?: string;
  city?: string;
  category?: string;
  description: string;
  history?: string;
  culture?: string;
  language?: string;
  currency?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  latitude: number;
  longitude: number;
  gallery: string[];
  imageUrl: string;

  climate?: string;
  weather: string;
  avgTemperature?: string;
  bestTime: string;

  nearbyAirport?: string;
  metroAvailable?: boolean;
  publicTransport?: string;

  budget: string;
  estimatedBudgetMin?: number;
  estimatedBudgetMax?: number;

  hotels: string[];
  luxuryHotels?: string[];
  budgetHotels?: string[];

  restaurants: string[];
  streetFood?: string[];
  localFoods: string[];
  shoppingAreas?: string[];
  nightlife?: string[];

  attractions: string[];
  hiddenGems?: string[];
  adventureActivities?: string[];
  familyActivities?: string[];
  coupleActivities?: string[];
  soloTravelTips?: string;

  safetyScore?: number;
  averageRating: number;
  totalReviews: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Review {
  _id: string;
  user: {
    _id: string;
    username: string;
    profile: UserProfile;
  };
  destination: string;
  rating: number;
  comment: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Favorite {
  _id: string;
  user: string;
  trip: Trip;
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

export interface RefreshResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
  };
}

export interface TripDetailResponse {
  success: boolean;
  message: string;
  data: {
    trip: Trip;
    itinerary: Itinerary;
    isFavorited: boolean;
  };
}

export interface StatsResponse {
  success: boolean;
  message: string;
  data: {
    summary: {
      totalTrips: number;
    };
    charts: {
      budgetDistribution: { Budget: number; Moderate: number; Luxury: number };
      tripTypeDistribution: { Solo: number; Family: number; Couple: number; Friends: number; Business: number };
      tripsPerMonth: Array<{ label: string; count: number }>;
      popularDestinations: Array<{ destination: string; count: number }>;
    };
  };
}
