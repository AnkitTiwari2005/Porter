// Single source of truth for cities, used by both the API and the web app.
export const CITIES = [
  {
    "id": "mumbai",
    "name": "Mumbai",
    "state": "Maharashtra",
    "isPopular": true
  },
  {
    "id": "bangalore",
    "name": "Bangalore",
    "state": "Karnataka",
    "isPopular": true
  },
  {
    "id": "delhi",
    "name": "Delhi NCR",
    "state": "Delhi",
    "isPopular": true
  },
  {
    "id": "hyderabad",
    "name": "Hyderabad",
    "state": "Telangana",
    "isPopular": true
  },
  {
    "id": "chennai",
    "name": "Chennai",
    "state": "Tamil Nadu",
    "isPopular": true
  },
  {
    "id": "pune",
    "name": "Pune",
    "state": "Maharashtra",
    "isPopular": true
  },
  {
    "id": "ahmedabad",
    "name": "Ahmedabad",
    "state": "Gujarat",
    "isPopular": true
  },
  {
    "id": "kolkata",
    "name": "Kolkata",
    "state": "West Bengal",
    "isPopular": true
  },
  {
    "id": "jaipur",
    "name": "Jaipur",
    "state": "Rajasthan",
    "isPopular": false
  },
  {
    "id": "surat",
    "name": "Surat",
    "state": "Gujarat",
    "isPopular": false
  },
  {
    "id": "lucknow",
    "name": "Lucknow",
    "state": "Uttar Pradesh",
    "isPopular": false
  },
  {
    "id": "chandigarh",
    "name": "Chandigarh",
    "state": "Punjab & Haryana",
    "isPopular": false
  },
  {
    "id": "coimbatore",
    "name": "Coimbatore",
    "state": "Tamil Nadu",
    "isPopular": false
  },
  {
    "id": "indore",
    "name": "Indore",
    "state": "Madhya Pradesh",
    "isPopular": false
  },
  {
    "id": "nagpur",
    "name": "Nagpur",
    "state": "Maharashtra",
    "isPopular": false
  }
];

// Known localities per city. Used by the offline ('local') geocoder and for sanity-checking coordinates.
export const CITY_COORDINATES = {
  "mumbai": {
    "center": [
      19.076,
      72.8777
    ],
    "locations": {
      "Andheri West": [
        19.1197,
        72.8464
      ],
      "Andheri East": [
        19.1136,
        72.8697
      ],
      "BKC (Bandra Kurla Complex)": [
        19.0664,
        72.8687
      ],
      "Bandra West": [
        19.0596,
        72.8295
      ],
      "Lower Parel": [
        18.9953,
        72.8242
      ],
      "Powai Hiranandani": [
        19.1197,
        72.9051
      ],
      "Dadar Western": [
        19.0178,
        72.8478
      ],
      "Vashi Sector 17": [
        19.0771,
        72.9986
      ],
      "Thane Majiwada": [
        19.2183,
        72.9781
      ],
      "Borivali IC Colony": [
        19.2307,
        72.8567
      ],
      "Bhiwandi Warehouses": [
        19.2967,
        73.0631
      ],
      "Goregaon West": [
        19.1636,
        72.8413
      ],
      "Malad Mindspace": [
        19.186,
        72.836
      ],
      "Ghatkopar East": [
        19.086,
        72.908
      ]
    }
  },
  "bangalore": {
    "center": [
      12.9716,
      77.5946
    ],
    "locations": {
      "Koramangala": [
        12.9344,
        77.6289
      ],
      "Indiranagar": [
        12.9784,
        77.6408
      ],
      "Whitefield": [
        12.9863,
        77.7337
      ],
      "HSR Layout": [
        12.9121,
        77.6446
      ],
      "Electronic City": [
        12.8452,
        77.6602
      ],
      "Jayanagar": [
        12.9308,
        77.5838
      ],
      "Marathahalli": [
        12.9591,
        77.6974
      ],
      "Hebbal": [
        13.0358,
        77.597
      ]
    }
  },
  "delhi": {
    "center": [
      28.6139,
      77.209
    ],
    "locations": {
      "Connaught Place": [
        28.6315,
        77.2167
      ],
      "DLF Cyber City Gurgaon": [
        28.4908,
        77.0898
      ],
      "Noida Sector 62": [
        28.628,
        77.3649
      ],
      "Lajpat Nagar": [
        28.57,
        77.2433
      ],
      "Rohini Sector 10": [
        28.7159,
        77.1147
      ],
      "Saket Select Citywalk": [
        28.5284,
        77.2195
      ]
    }
  },
  "pune": {
    "center": [
      18.5204,
      73.8567
    ],
    "locations": {
      "Hinjawadi IT Park": [
        18.5913,
        73.7389
      ],
      "Kothrud": [
        18.5074,
        73.8077
      ],
      "Viman Nagar": [
        18.5679,
        73.9143
      ],
      "Khadki / Shivaji Nagar": [
        18.5314,
        73.8446
      ],
      "Hadapsar Magarpatta": [
        18.5089,
        73.926
      ]
    }
  },
  "hyderabad": {
    "center": [
      17.385,
      78.4867
    ],
    "locations": {
      "Hitec City": [
        17.4474,
        78.3762
      ],
      "Gachibowli": [
        17.4401,
        78.3489
      ],
      "Banjara Hills": [
        17.4156,
        78.435
      ],
      "Secunderabad": [
        17.4399,
        78.4983
      ],
      "Madhapur": [
        17.4483,
        78.3915
      ]
    }
  },
  "chennai": {
    "center": [
      13.0827,
      80.2707
    ],
    "locations": {
      "T. Nagar": [
        13.0418,
        80.2341
      ],
      "Adyar": [
        13.0012,
        80.2565
      ],
      "Guindy Industrial": [
        13.0067,
        80.2023
      ],
      "Velachery": [
        12.9815,
        80.218
      ],
      "OMR IT Corridor": [
        12.915,
        80.2285
      ],
      "Anna Nagar": [
        13.085,
        80.2101
      ]
    }
  },
  "kolkata": {
    "center": [
      22.5726,
      88.3639
    ],
    "locations": {
      "Park Street": [
        22.551,
        88.3527
      ],
      "Salt Lake Sector V": [
        22.5804,
        88.4378
      ],
      "Howrah Station": [
        22.5841,
        88.3426
      ],
      "New Town Action Area 1": [
        22.593,
        88.465
      ],
      "Ballygunge": [
        22.528,
        88.365
      ]
    }
  },
  "ahmedabad": {
    "center": [
      23.0225,
      72.5714
    ],
    "locations": {
      "SG Highway": [
        23.048,
        72.512
      ],
      "Prahlad Nagar": [
        23.013,
        72.508
      ],
      "Ashram Road": [
        23.03,
        72.57
      ],
      "Maninagar": [
        22.998,
        72.602
      ],
      "Navrangpura": [
        23.037,
        72.553
      ]
    }
  },
  "jaipur": {
    "center": [
      26.9124,
      75.7873
    ],
    "locations": {
      "Malviya Nagar": [
        26.854,
        75.824
      ],
      "C-Scheme": [
        26.91,
        75.801
      ],
      "Mansarovar": [
        26.862,
        75.761
      ],
      "Vaishali Nagar": [
        26.905,
        75.741
      ],
      "Sitapura Industrial": [
        26.782,
        75.836
      ]
    }
  },
  "surat": {
    "center": [
      21.1702,
      72.8311
    ],
    "locations": {
      "Ring Road Textile Hub": [
        21.192,
        72.842
      ],
      "Adajan": [
        21.196,
        72.795
      ],
      "Varachha Diamond City": [
        21.215,
        72.862
      ],
      "Vesu": [
        21.141,
        72.775
      ]
    }
  },
  "lucknow": {
    "center": [
      26.8467,
      80.9462
    ],
    "locations": {
      "Hazratganj": [
        26.853,
        80.945
      ],
      "Gomti Nagar": [
        26.86,
        81
      ],
      "Alambagh": [
        26.818,
        80.908
      ],
      "Indira Nagar": [
        26.882,
        80.985
      ]
    }
  },
  "chandigarh": {
    "center": [
      30.7333,
      76.7794
    ],
    "locations": {
      "Sector 17 City Center": [
        30.741,
        76.782
      ],
      "Sector 35": [
        30.722,
        76.765
      ],
      "IT Park Kishangarh": [
        30.725,
        76.835
      ],
      "Mohali Phase 7": [
        30.708,
        76.712
      ]
    }
  },
  "indore": {
    "center": [
      22.7196,
      75.8577
    ],
    "locations": {
      "Vijay Nagar": [
        22.753,
        75.894
      ],
      "Palasia Square": [
        22.723,
        75.887
      ],
      "Rajwada Market": [
        22.718,
        75.855
      ],
      "Bhanwarkua": [
        22.692,
        75.867
      ]
    }
  },
  "coimbatore": {
    "center": [
      11.0168,
      76.9558
    ],
    "locations": {
      "RS Puram": [
        11.007,
        76.95
      ],
      "Gandhipuram": [
        11.0183,
        76.9725
      ],
      "Peelamedu": [
        11.023,
        77.02
      ]
    }
  },
  "nagpur": {
    "center": [
      21.1458,
      79.0882
    ],
    "locations": {
      "Sitabuldi": [
        21.14,
        79.083
      ],
      "Dharampeth": [
        21.135,
        79.065
      ],
      "Manish Nagar": [
        21.09,
        79.07
      ]
    }
  },
  "kochi": {
    "center": [
      9.9312,
      76.2673
    ],
    "locations": {
      "Marine Drive": [
        9.981,
        76.275
      ],
      "MG Road": [
        9.969,
        76.284
      ],
      "Kakkanad InfoPark": [
        10.015,
        76.362
      ],
      "Edappally Toll": [
        10.026,
        76.308
      ]
    }
  }
};

const toRad = (d) => (d * Math.PI) / 180;
export function haversineKm([lat1, lng1], [lat2, lng2]) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export const cityById = (id) => CITIES.find((c) => c.id === id);
