export const ITB_CENTER = {
  latitude: -6.8915,
  longitude: 107.6107,
  latitudeDelta: 0.012,
  longitudeDelta: 0.012,
};

// ID diambil dari database (UUID), koordinat untuk marker di peta
export const RENTAL_SPOTS = [
  { name: 'Gerbang SBM',     latitude: -6.8892, longitude: 107.6094, umbrellas: 10 },
  { name: 'Gerbang Utara',   latitude: -6.8897, longitude: 107.6117, umbrellas: 8  },
  { name: 'CRCS / CAS',      latitude: -6.8898, longitude: 107.6155, umbrellas: 6  },
  { name: 'Labtek V',        latitude: -6.8927, longitude: 107.6103, umbrellas: 12 },
  { name: 'Campus Center',   latitude: -6.8935, longitude: 107.6118, umbrellas: 15 },
  { name: 'Labtek VIII',     latitude: -6.8927, longitude: 107.6118, umbrellas: 10 },
  { name: 'SIPIL',           latitude: -6.8948, longitude: 107.6103, umbrellas: 8  },
  { name: 'Gerbang Selatan', latitude: -6.8968, longitude: 107.6117, umbrellas: 12 },
];

export const RAIN_RISK_ZONES = [
  {
    id: 'rain-1',
    name: 'Area SBM - CADL',
    coordinates: [
      { latitude: -6.8885, longitude: 107.6085 },
      { latitude: -6.8885, longitude: 107.6125 },
      { latitude: -6.8905, longitude: 107.6125 },
      { latitude: -6.8905, longitude: 107.6085 },
    ],
  },
  {
    id: 'rain-2',
    name: 'Area CAS - CRCS',
    coordinates: [
      { latitude: -6.8885, longitude: 107.6140 },
      { latitude: -6.8885, longitude: 107.6165 },
      { latitude: -6.8910, longitude: 107.6165 },
      { latitude: -6.8910, longitude: 107.6140 },
    ],
  },
  {
    id: 'rain-3',
    name: 'Area Lapangan Basket',
    coordinates: [
      { latitude: -6.8930, longitude: 107.6108 },
      { latitude: -6.8930, longitude: 107.6130 },
      { latitude: -6.8945, longitude: 107.6130 },
      { latitude: -6.8945, longitude: 107.6108 },
    ],
  },
  {
    id: 'rain-4',
    name: 'Area Gerbang Selatan',
    coordinates: [
      { latitude: -6.8958, longitude: 107.6105 },
      { latitude: -6.8958, longitude: 107.6130 },
      { latitude: -6.8975, longitude: 107.6130 },
      { latitude: -6.8975, longitude: 107.6105 },
    ],
  },
];

export const SECURITY_POSTS = [
  { id: 'sec-1', name: 'Satpam Gerbang Barat',  latitude: -6.8930, longitude: 107.6082 },
  { id: 'sec-2', name: 'Satpam Gerbang Selatan', latitude: -6.8970, longitude: 107.6112 },
  { id: 'sec-3', name: 'Satpam FTSL',            latitude: -6.8958, longitude: 107.6118 },
  { id: 'sec-4', name: 'Satpam LFM',             latitude: -6.8950, longitude: 107.6130 },
  { id: 'sec-5', name: 'Satpam Campus Center',   latitude: -6.8935, longitude: 107.6122 },
];

export const RENTAL_PRICE_PER_HOUR = 2000;
export const OVERAGE_PRICE_PER_HOUR = 3000;

export const DURATION_OPTIONS = [
  { label: '1 Jam', hours: 1, price: 2000 },
  { label: '2 Jam', hours: 2, price: 4000 },
  { label: '3 Jam', hours: 3, price: 6000 },
];