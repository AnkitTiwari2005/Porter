export const CITIES = [
  { id: 'mumbai', name: 'Mumbai', state: 'Maharashtra', isPopular: true },
  { id: 'bangalore', name: 'Bangalore', state: 'Karnataka', isPopular: true },
  { id: 'delhi', name: 'Delhi NCR', state: 'Delhi', isPopular: true },
  { id: 'hyderabad', name: 'Hyderabad', state: 'Telangana', isPopular: true },
  { id: 'chennai', name: 'Chennai', state: 'Tamil Nadu', isPopular: true },
  { id: 'pune', name: 'Pune', state: 'Maharashtra', isPopular: true },
  { id: 'ahmedabad', name: 'Ahmedabad', state: 'Gujarat', isPopular: true },
  { id: 'kolkata', name: 'Kolkata', state: 'West Bengal', isPopular: true },
  { id: 'jaipur', name: 'Jaipur', state: 'Rajasthan', isPopular: false },
  { id: 'surat', name: 'Surat', state: 'Gujarat', isPopular: false },
  { id: 'lucknow', name: 'Lucknow', state: 'Uttar Pradesh', isPopular: false },
  { id: 'chandigarh', name: 'Chandigarh', state: 'Punjab & Haryana', isPopular: false },
  { id: 'coimbatore', name: 'Coimbatore', state: 'Tamil Nadu', isPopular: false },
  { id: 'indore', name: 'Indore', state: 'Madhya Pradesh', isPopular: false },
  { id: 'nagpur', name: 'Nagpur', state: 'Maharashtra', isPopular: false }
];

export const VEHICLES = [
  {
    id: 'two-wheeler',
    name: '2 Wheeler',
    category: 'bike',
    tag: 'Fastest Delivery',
    capacity: '20 kg',
    dimensions: '40 x 40 x 40 cm',
    basePrice: 49,
    baseKm: 2,
    ratePerKm: 9.5,
    etaMinutes: 12,
    icon: '/images/2_wheeler_5624a12e03_cd20b2a174.svg',
    image: '/images/Scooty_main_73fc0c16e1.png',
    description: 'Best suited for documents, medicines, food parcels, clothes & lightweight items.',
    popularFor: ['Instant courier', 'Gift delivery', 'Forgotten items', 'Daily business errands']
  },
  {
    id: 'two-wheeler-ev',
    name: '2 Wheeler EV',
    category: 'bike',
    tag: 'Eco Friendly ⚡',
    capacity: '20 kg',
    dimensions: '40 x 40 x 40 cm',
    basePrice: 42,
    baseKm: 2,
    ratePerKm: 8.5,
    etaMinutes: 15,
    icon: '/images/2_wheeler_5624a12e03_cd20b2a174.svg',
    image: '/images/2_Wheeler_Low_Speed_EV_detailed_3ba15b2fa3.png',
    description: 'Green, zero-emission city delivery at subsidized sustainable rates.',
    popularFor: ['Eco-conscious delivery', 'Small retail delivery', 'Sample distribution']
  },
  {
    id: 'three-wheeler',
    name: '3 Wheeler (Auto Cargo)',
    category: 'truck',
    tag: 'City Maneuverable',
    capacity: '500 kg',
    dimensions: '5.5 ft x 4.5 ft x 4 ft',
    basePrice: 189,
    baseKm: 2,
    ratePerKm: 18.0,
    etaMinutes: 18,
    icon: '/images/3_Wheeler_b9de267bde.svg',
    image: '/images/3_Wheeler_b9de267bde.svg',
    description: 'Perfect for mid-size boxes, electronics, event equipment, or small market deliveries.',
    popularFor: ['Grocery supply', 'Small furniture', 'Appliances', 'E-commerce logistics']
  },
  {
    id: 'tata-ace',
    name: 'Tata Ace (Chota Hathi)',
    category: 'truck',
    tag: 'Most Popular ⭐',
    capacity: '750 kg',
    dimensions: '7 ft x 4.5 ft x 5 ft',
    basePrice: 249,
    baseKm: 2,
    ratePerKm: 22.0,
    etaMinutes: 20,
    icon: '/images/Tata_Ace_5fd23cdaf0.svg',
    image: '/images/Tata_Ace_5fd23cdaf0.svg',
    description: 'India\'s favorite mini truck for 1 BHK house shifting, timber, metals, and commercial cargo.',
    popularFor: ['1 BHK Shifting', 'Wholesale deliveries', 'Furniture moving', 'Heavy parcels']
  },
  {
    id: 'pickup-8ft',
    name: 'Pickup 8ft',
    category: 'truck',
    tag: 'Heavy Load',
    capacity: '1,200 kg',
    dimensions: '8 ft x 4.8 ft x 4.5 ft',
    basePrice: 380,
    baseKm: 2,
    ratePerKm: 28.5,
    etaMinutes: 25,
    icon: '/images/trucks_india_a42dcdfc61.webp',
    image: '/images/trucks_india_a42dcdfc61.webp',
    description: 'Spacious flatbed truck for industrial equipment, larger consignments, and medium moves.',
    popularFor: ['Industrial cargo', 'Hardware & pipes', '2 BHK Shifting', 'Bulk orders']
  },
  {
    id: 'truck-14ft',
    name: '14ft Closed Truck',
    category: 'truck',
    tag: 'Maximum Capacity',
    capacity: '2,500 kg',
    dimensions: '14 ft x 6 ft x 6 ft',
    basePrice: 690,
    baseKm: 2,
    ratePerKm: 42.0,
    etaMinutes: 30,
    icon: '/images/trucks_india_a42dcdfc61.webp',
    image: '/images/trucks_india_a42dcdfc61.webp',
    description: 'Weatherproof container truck for full household shifting and factory goods.',
    popularFor: ['Full house relocation', 'Fragile bulk cargo', 'Inter-warehouse logistics']
  }
];

export const POPULAR_LOCATIONS = {
  mumbai: [
    { name: 'BKC (Bandra Kurla Complex)', area: 'Bandra East', lat: 19.0664, lng: 72.8687 },
    { name: 'Andheri West Metro Station', area: 'Andheri West', lat: 19.1197, lng: 72.8464 },
    { name: 'Lower Parel Phoenix Palladium', area: 'Lower Parel', lat: 18.9953, lng: 72.8242 },
    { name: 'Powai Hiranandani Gardens', area: 'Powai', lat: 19.1197, lng: 72.9051 },
    { name: 'Dadar Western Station', area: 'Dadar', lat: 19.0178, lng: 72.8478 },
    { name: 'Vashi Sector 17', area: 'Navi Mumbai', lat: 19.0771, lng: 72.9986 },
    { name: 'Thane Majiwada Junction', area: 'Thane West', lat: 19.2183, lng: 72.9781 },
    { name: 'Borivali IC Colony', area: 'Borivali West', lat: 19.2307, lng: 72.8567 }
  ],
  bangalore: [
    { name: 'Koramangala 4th Block', area: 'Koramangala', lat: 12.9344, lng: 77.6289 },
    { name: 'Indiranagar 100ft Road', area: 'Indiranagar', lat: 12.9784, lng: 77.6408 },
    { name: 'Whitefield ITPL Main Road', area: 'Whitefield', lat: 12.9863, lng: 77.7337 },
    { name: 'HSR Layout Sector 1', area: 'HSR Layout', lat: 12.9121, lng: 77.6446 },
    { name: 'Electronic City Phase 1', area: 'Electronic City', lat: 12.8452, lng: 77.6602 },
    { name: 'Jayanagar 4th Block', area: 'Jayanagar', lat: 12.9308, lng: 77.5838 }
  ],
  delhi: [
    { name: 'Connaught Place Inner Circle', area: 'Central Delhi', lat: 28.6315, lng: 77.2167 },
    { name: 'DLF Cyber City', area: 'Gurgaon', lat: 28.4908, lng: 77.0898 },
    { name: 'Noida Sector 62 Electronic City', area: 'Noida', lat: 28.6280, lng: 77.3649 },
    { name: 'Lajpat Nagar Central Market', area: 'South Delhi', lat: 28.5700, lng: 77.2433 }
  ],
  pune: [
    { name: 'Hinjawadi IT Park Phase 1', area: 'Hinjawadi', lat: 18.5913, lng: 73.7389 },
    { name: 'Kothrud Ashish Garden', area: 'Kothrud', lat: 18.5074, lng: 73.8077 },
    { name: 'Viman Nagar Phoenix Mall', area: 'Viman Nagar', lat: 18.5679, lng: 73.9143 },
    { name: 'Shivaji Nagar Bus Terminus', area: 'Shivaji Nagar', lat: 18.5314, lng: 73.8446 },
    { name: 'Hadapsar Magarpatta City', area: 'Hadapsar', lat: 18.5089, lng: 73.9260 }
  ],
  hyderabad: [
    { name: 'Hitec City Cyber Towers', area: 'Madhapur', lat: 17.4474, lng: 78.3762 },
    { name: 'Gachibowli Financial District', area: 'Gachibowli', lat: 17.4401, lng: 78.3489 },
    { name: 'Banjara Hills Road No 12', area: 'Banjara Hills', lat: 17.4156, lng: 78.4350 },
    { name: 'Secunderabad Clock Tower', area: 'Secunderabad', lat: 17.4399, lng: 78.4983 }
  ],
  chennai: [
    { name: 'T. Nagar Pondy Bazaar', area: 'T. Nagar', lat: 13.0418, lng: 80.2341 },
    { name: 'Adyar Signal', area: 'Adyar', lat: 13.0012, lng: 80.2565 },
    { name: 'Guindy Industrial Estate', area: 'Guindy', lat: 13.0067, lng: 80.2023 },
    { name: 'OMR Sholinganallur', area: 'OMR IT Corridor', lat: 12.9150, lng: 80.2285 }
  ],
  ahmedabad: [
    { name: 'SG Highway Iscon Cross Road', area: 'SG Highway', lat: 23.0480, lng: 72.5120 },
    { name: 'Prahlad Nagar Corporate Road', area: 'Prahlad Nagar', lat: 23.0130, lng: 72.5080 },
    { name: 'Ashram Road Vadaj', area: 'Ashram Road', lat: 23.0300, lng: 72.5700 },
    { name: 'Maninagar Railway Station', area: 'Maninagar', lat: 22.9980, lng: 72.6020 }
  ],
  kolkata: [
    { name: 'Park Street Metro', area: 'Park Street', lat: 22.5510, lng: 88.3527 },
    { name: 'Salt Lake Sector V College More', area: 'Salt Lake', lat: 22.5804, lng: 88.4378 },
    { name: 'New Town Eco Space', area: 'New Town', lat: 22.5930, lng: 88.4650 },
    { name: 'Howrah Goods Yard', area: 'Howrah', lat: 22.5841, lng: 88.3426 }
  ]
};

export const PROMO_CODES = [
  { code: 'PORTER50', discountPercent: 20, maxDiscount: 50, minFare: 99, description: 'Flat 20% off up to ₹50 on first 3 rides' },
  { code: 'FIRSTTRUCK', discountPercent: 15, maxDiscount: 150, minFare: 250, categories: ['truck'], description: '15% off up to ₹150 on mini truck bookings' },
  { code: 'FREEDEL', discountPercent: 50, maxDiscount: 40, minFare: 60, categories: ['bike'], description: '50% off up to ₹40 on 2-Wheeler delivery' }
];

export const TESTIMONIALS = [
  {
    id: 1,
    name: 'Rajesh Sharma',
    company: 'Apex Electronics, Mumbai',
    role: 'Business Owner',
    rating: 5,
    quote: 'Portex has been our reliable logistics partner for 3+ years. Whenever our store needs quick stock movement across Mumbai, a Tata Ace arrives in under 15 minutes!',
    vehicle: 'Tata Ace'
  },
  {
    id: 2,
    name: 'Priyanka Sen',
    company: 'Home Shifting Customer',
    role: 'Resident, Powai',
    rating: 5,
    quote: 'Shifted my 1 BHK from Powai to Bandra seamlessly. The driver helper was extremely courteous, on time, and handled my TV and couch with utmost care.',
    vehicle: 'Pickup 8ft'
  },
  {
    id: 3,
    name: 'Anand Kulkarni',
    company: 'Cloud Kitchen Network',
    role: 'Operations Head',
    rating: 5,
    quote: 'The 2-Wheeler courier service is a lifesaver. Urgent supplies and paperwork get delivered between our branches across the city without any stress.',
    vehicle: '2 Wheeler'
  }
];

export const FAQS = [
  {
    question: 'How do I book a mini truck or bike on Portex?',
    answer: 'Enter your pickup and drop location, choose your preferred vehicle (Bike, 3-Wheeler, Tata Ace, or 8ft Truck), review the upfront fare estimate, and hit "Book Now". A driver partner will be assigned in seconds!'
  },
  {
    question: 'Are there any hidden charges or toll fees?',
    answer: 'Portex provides transparent pricing. Your fare estimate covers base fare and distance charges. State taxes, parking, and highway tolls (if any) are billed directly based on actuals.'
  },
  {
    question: 'Can I track my goods and driver in real time?',
    answer: 'Yes! As soon as your booking is confirmed, you receive live GPS tracking with driver contact details, vehicle number, and live ETA updates.'
  },
  {
    question: 'Do driver partners help with loading and unloading?',
    answer: 'Drivers assist with ground-to-ground loading/unloading. For multi-floor carrying or heavy lifting, Portex offers dedicated Helper assistance options during booking.'
  },
  {
    question: 'What items can I send through Portex 2-Wheeler?',
    answer: 'You can send legal goods up to 20 kg including documents, keys, chargers, lunch boxes, clothes, electronic accessories, medical supplies, and retail parcels.'
  }
];
