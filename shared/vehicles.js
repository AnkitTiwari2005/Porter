// Default catalogue. The API seeds its database from this; live prices always come from the API.
export const VEHICLES = [
  {
    "id": "two-wheeler",
    "name": "2 Wheeler",
    "category": "bike",
    "tag": "Fastest Delivery",
    "capacity": "20 kg",
    "dimensions": "40 x 40 x 40 cm",
    "basePrice": 49,
    "baseKm": 2,
    "ratePerKm": 9.5,
    "etaMinutes": 12,
    "icon": "/images/2_wheeler_5624a12e03_cd20b2a174.svg",
    "image": "/images/Scooty_main_73fc0c16e1.png",
    "description": "Best suited for documents, medicines, food parcels, clothes & lightweight items.",
    "popularFor": [
      "Instant courier",
      "Gift delivery",
      "Forgotten items",
      "Daily business errands"
    ]
  },
  {
    "id": "two-wheeler-ev",
    "name": "2 Wheeler EV",
    "category": "bike",
    "tag": "Eco Friendly ⚡",
    "capacity": "20 kg",
    "dimensions": "40 x 40 x 40 cm",
    "basePrice": 42,
    "baseKm": 2,
    "ratePerKm": 8.5,
    "etaMinutes": 15,
    "icon": "/images/2_wheeler_5624a12e03_cd20b2a174.svg",
    "image": "/images/2_Wheeler_Low_Speed_EV_detailed_3ba15b2fa3.png",
    "description": "Green, zero-emission city delivery at subsidized sustainable rates.",
    "popularFor": [
      "Eco-conscious delivery",
      "Small retail delivery",
      "Sample distribution"
    ]
  },
  {
    "id": "three-wheeler",
    "name": "3 Wheeler (Auto Cargo)",
    "category": "truck",
    "tag": "City Maneuverable",
    "capacity": "500 kg",
    "dimensions": "5.5 ft x 4.5 ft x 4 ft",
    "basePrice": 189,
    "baseKm": 2,
    "ratePerKm": 18,
    "etaMinutes": 18,
    "icon": "/images/3_Wheeler_b9de267bde.svg",
    "image": "/images/3_Wheeler_b9de267bde.svg",
    "description": "Perfect for mid-size boxes, electronics, event equipment, or small market deliveries.",
    "popularFor": [
      "Grocery supply",
      "Small furniture",
      "Appliances",
      "E-commerce logistics"
    ]
  },
  {
    "id": "tata-ace",
    "name": "Tata Ace (Chota Hathi)",
    "category": "truck",
    "tag": "Most Popular ⭐",
    "capacity": "750 kg",
    "dimensions": "7 ft x 4.5 ft x 5 ft",
    "basePrice": 249,
    "baseKm": 2,
    "ratePerKm": 22,
    "etaMinutes": 20,
    "icon": "/images/Tata_Ace_5fd23cdaf0.svg",
    "image": "/images/Tata_Ace_5fd23cdaf0.svg",
    "description": "India's favorite mini truck for 1 BHK house shifting, timber, metals, and commercial cargo.",
    "popularFor": [
      "1 BHK Shifting",
      "Wholesale deliveries",
      "Furniture moving",
      "Heavy parcels"
    ]
  },
  {
    "id": "pickup-8ft",
    "name": "Pickup 8ft",
    "category": "truck",
    "tag": "Heavy Load",
    "capacity": "1,200 kg",
    "dimensions": "8 ft x 4.8 ft x 4.5 ft",
    "basePrice": 380,
    "baseKm": 2,
    "ratePerKm": 28.5,
    "etaMinutes": 25,
    "icon": "/images/trucks_india_a42dcdfc61.webp",
    "image": "/images/trucks_india_a42dcdfc61.webp",
    "description": "Spacious flatbed truck for industrial equipment, larger consignments, and medium moves.",
    "popularFor": [
      "Industrial cargo",
      "Hardware & pipes",
      "2 BHK Shifting",
      "Bulk orders"
    ]
  },
  {
    "id": "truck-14ft",
    "name": "14ft Closed Truck",
    "category": "truck",
    "tag": "Maximum Capacity",
    "capacity": "2,500 kg",
    "dimensions": "14 ft x 6 ft x 6 ft",
    "basePrice": 690,
    "baseKm": 2,
    "ratePerKm": 42,
    "etaMinutes": 30,
    "icon": "/images/trucks_india_a42dcdfc61.webp",
    "image": "/images/trucks_india_a42dcdfc61.webp",
    "description": "Weatherproof container truck for full household shifting and factory goods.",
    "popularFor": [
      "Full house relocation",
      "Fragile bulk cargo",
      "Inter-warehouse logistics"
    ]
  }
];
