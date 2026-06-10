const module = {}; (() => {
  const STORAGE_KEY = 'pathik_saved_routes_v1';
  const PROVIDER_KEY = 'pathik_provider_v1';
  const MODEL_CACHE_KEY = 'pathik_active_model_v3';
  const QUERY_CACHE_KEY = 'pathik_query_cache_v8';
  const FEEDBACK_KEY = 'pathik_route_feedback_v1';
  const QUERY_CACHE_TTL_MS = 1000 * 60 * 60 * 24;
  const GEOCODE_CACHE_KEY = 'pathik_geocode_cache_v1';
  const GEOCODE_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days
  const MY_LOCATION_LABEL = 'My Location';

  // ===================== Bangladesh Region System =====================
  const BANGLADESH_DIVISIONS = [
    { id: 'dhaka',    nameBn: 'ঢাকা',    nameEn: 'Dhaka',    hasData: true },
    { id: 'chattogram', nameBn: 'চট্টগ্রাম', nameEn: 'Chattogram', hasData: false },
    { id: 'rajshahi',   nameBn: 'রাজশাহী',   nameEn: 'Rajshahi',   hasData: false },
    { id: 'khulna',     nameBn: 'খুলনা',     nameEn: 'Khulna',     hasData: false },
    { id: 'barishal',   nameBn: 'বরিশাল',   nameEn: 'Barishal',   hasData: false },
    { id: 'sylhet',     nameBn: 'সিলেট',     nameEn: 'Sylhet',     hasData: false },
    { id: 'rangpur',    nameBn: 'রংপুর',    nameEn: 'Rangpur',    hasData: false },
    { id: 'mymensingh', nameBn: 'ময়মনসিংহ', nameEn: 'Mymensingh', hasData: false }
  ];

  const BANGLADESH_DISTRICTS = {
    dhaka: [
      { id: 'dhaka',     nameBn: 'ঢাকা',       nameEn: 'Dhaka',       hasData: true },
      { id: 'gazipur',   nameBn: 'গাজীপুর',    nameEn: 'Gazipur',     hasData: true },
      { id: 'narayanganj', nameBn: 'নারায়ণগঞ্জ', nameEn: 'Narayanganj', hasData: true },
      { id: 'tangail',   nameBn: 'টাঙ্গাইল',    nameEn: 'Tangail',     hasData: false },
      { id: 'kishoreganj', nameBn: 'কিশোরগঞ্জ',  nameEn: 'Kishoreganj', hasData: false },
      { id: 'manikganj', nameBn: 'মানিকগঞ্জ',   nameEn: 'Manikganj',   hasData: false },
      { id: 'munshiganj', nameBn: 'মুন্সিগঞ্জ',  nameEn: 'Munshiganj',  hasData: false },
      { id: 'narsingdi', nameBn: 'নরসিংদী',     nameEn: 'Narsingdi',   hasData: false },
      { id: 'faridpur',  nameBn: 'ফরিদপুর',     nameEn: 'Faridpur',    hasData: false },
      { id: 'rajbari',   nameBn: 'রাজবাড়ী',     nameEn: 'Rajbari',     hasData: false },
      { id: 'gopalganj', nameBn: 'গোপালগঞ্জ',   nameEn: 'Gopalganj',   hasData: false },
      { id: 'madaripur', nameBn: 'মাদারীপুর',   nameEn: 'Madaripur',   hasData: false },
      { id: 'shariatpur', nameBn: 'শরীয়তপুর',   nameEn: 'Shariatpur',  hasData: false }
    ],
    chattogram: [
      { id: 'chattogram', nameBn: 'চট্টগ্রাম',  nameEn: 'Chattogram',  hasData: false },
      { id: 'cox_bazar',  nameBn: 'কক্সবাজার',  nameEn: 'Cox\'s Bazar', hasData: false },
      { id: 'comilla',    nameBn: 'কুমিল্লা',    nameEn: 'Comilla',     hasData: false },
      { id: 'noakhali',   nameBn: 'নোয়াখালী',   nameEn: 'Noakhali',    hasData: false },
      { id: 'brahmanbaria', nameBn: 'ব্রাহ্মণবাড়িয়া', nameEn: 'Brahmanbaria', hasData: false },
      { id: 'chandpur',   nameBn: 'চাঁদপুর',     nameEn: 'Chandpur',    hasData: false },
      { id: 'lashmipur',   nameBn: 'লক্ষ্মীপুর',  nameEn: 'Lakshmipur',  hasData: false },
      { id: 'feni',       nameBn: 'ফেনী',        nameEn: 'Feni',        hasData: false },
      { id: 'khagrachari', nameBn: 'খাগড়াছড়ি',   nameEn: 'Khagrachari', hasData: false },
      { id: 'rangamati',  nameBn: 'রাঙ্গামাটি',   nameEn: 'Rangamati',   hasData: false },
      { id: 'bandarban',  nameBn: 'বান্দরবান',   nameEn: 'Bandarban',   hasData: false }
    ],
    rajshahi: [
      { id: 'rajshahi',  nameBn: 'রাজশাহী',    nameEn: 'Rajshahi',    hasData: false },
      { id: 'bogra',     nameBn: 'বগুড়া',      nameEn: 'Bogra',       hasData: false },
      { id: 'pabna',     nameBn: 'পাবনা',      nameEn: 'Pabna',       hasData: false },
      { id: 'sirajganj',  nameBn: 'সিরাজগঞ্জ',  nameEn: 'Sirajganj',   hasData: false },
      { id: 'naogaon',   nameBn: 'নওগাঁ',       nameEn: 'Naogaon',     hasData: false },
      { id: 'nawabganj', nameBn: 'নওয়াবগঞ্জ',  nameEn: 'Nawabganj',   hasData: false },
      { id: 'natore',    nameBn: 'নাটোর',       nameEn: 'Natore',      hasData: false },
      { id: 'joypurhat', nameBn: 'জয়পুরহাট',    nameEn: 'Joypurhat',   hasData: false }
    ],
    khulna: [
      { id: 'khulna',    nameBn: 'খুলনা',      nameEn: 'Khulna',      hasData: false },
      { id: 'jessore',   nameBn: 'যশোর',       nameEn: 'Jessore',     hasData: false },
      { id: 'kushtia',   nameBn: 'কুষ্টিয়া',    nameEn: 'Kushtia',     hasData: false },
      { id: 'satkhira',  nameBn: 'সাতক্ষীরা',   nameEn: 'Satkhira',    hasData: false },
      { id: 'bagerhat',  nameBn: 'বাগেরহাট',    nameEn: 'Bagerhat',    hasData: false },
      { id: 'jhenaidah', nameBn: 'ঝিনাইদহ',     nameEn: 'Jhenaidah',   hasData: false },
      { id: 'meherpur',  nameBn: 'মেহেরপুর',    nameEn: 'Meherpur',    hasData: false },
      { id: 'magura',    nameBn: 'মাগুরা',      nameEn: 'Magura',      hasData: false },
      { id: 'chuadanga', nameBn: 'চুয়াডাঙ্গা',  nameEn: 'Chuadanga',   hasData: false },
      { id: 'narsail',   nameBn: 'নড়াইল',       nameEn: 'Narail',      hasData: false }
    ],
    barishal: [
      { id: 'barishal',  nameBn: 'বরিশাল',     nameEn: 'Barishal',    hasData: false },
      { id: 'bhola',     nameBn: 'ভোলা',        nameEn: 'Bhola',       hasData: false },
      { id: 'patuakhali', nameBn: 'পটুয়াখালী',  nameEn: 'Patuakhali',  hasData: false },
      { id: 'perojpur',  nameBn: 'পিরোজপুর',    nameEn: 'Pirojpur',    hasData: false },
      { id: 'jhalokathi', nameBn: 'ঝালকাঠি',    nameEn: 'Jhalokathi',  hasData: false },
      { id: 'barguna',   nameBn: 'বরগুনা',      nameEn: 'Barguna',     hasData: false }
    ],
    sylhet: [
      { id: 'sylhet',    nameBn: 'সিলেট',       nameEn: 'Sylhet',      hasData: false },
      { id: 'moulvibazar', nameBn: 'মৌলভীবাজার', nameEn: 'Moulvibazar', hasData: false },
      { id: 'habiganj',  nameBn: 'হবিগঞ্জ',     nameEn: 'Habiganj',    hasData: false },
      { id: 'sunamganj', nameBn: 'সুনামগঞ্জ',   nameEn: 'Sunamganj',   hasData: false }
    ],
    rangpur: [
      { id: 'rangpur',   nameBn: 'রংপুর',       nameEn: 'Rangpur',     hasData: false },
      { id: 'dinajpur',  nameBn: 'দিনাজপুর',    nameEn: 'Dinajpur',    hasData: false },
      { id: 'kurigram',  nameBn: 'কুড়িগ্রাম',   nameEn: 'Kurigram',    hasData: false },
      { id: 'gaibandha', nameBn: 'গাইবান্ধা',    nameEn: 'Gaibandha',   hasData: false },
      { id: 'lalmonirhat', nameBn: 'লালমনিরহাট', nameEn: 'Lalmonirhat', hasData: false },
      { id: 'nilphamari', nameBn: 'নীলফামারী',   nameEn: 'Nilphamari',  hasData: false },
      { id: 'panchagarh', nameBn: 'পঞ্চগড়',      nameEn: 'Panchagarh',  hasData: false },
      { id: 'thakurgaon', nameBn: 'ঠাকুরগাঁও',   nameEn: 'Thakurgaon',  hasData: false }
    ],
    mymensingh: [
      { id: 'mymensingh',  nameBn: 'ময়মনসিংহ',   nameEn: 'Mymensingh',   hasData: false },
      { id: 'jamalpur',    nameBn: 'জামালপুর',    nameEn: 'Jamalpur',    hasData: false },
      { id: 'netrokona',   nameBn: 'নেত্রকোণা',   nameEn: 'Netrokona',   hasData: false },
      { id: 'sherpur',     nameBn: 'শেরপুর',      nameEn: 'Sherpur',     hasData: false }
    ]
  };

  const GROQ_BASE = 'https://api.groq.com/openai/v1';
  const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
  const GROQ_PREFERRED = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'gemma2-9b-it'];
  const OR_PREFERRED_FREE = [
    'meta-llama/llama-3.3-70b-instruct:free',
    'mistralai/mistral-small-3.1-24b-instruct:free',
    'google/gemini-2.0-flash-exp:free',
    'deepseek/deepseek-chat:free'
  ];

  const FARE_TABLE = {
    bus:      { perKm: 2.45, base: 0,  min: 10, max: null,  label: 'Non-AC bus (BRTA)' },
    ac_bus:   { perKm: 5.00, base: 0,  min: 20, max: null,  label: 'AC bus (BRTA)' },
    metro:    { perKm: 5.00, base: 20, min: 20, max: 100,   label: 'MRT-6 metro (DMTCL)' },
    rickshaw: { perKm: 15,   base: 20, min: 20, max: null,  label: 'Rickshaw (market)' },
    leguna:   { perKm: 3.5,  base: 5,  min: 10, max: 25,    label: 'Leguna (zone-based)' },
    walking:  { perKm: 0,    base: 0,  min: 0,  max: 0,     label: 'Walking' }
  };

  const METRO_STATIONS = [
    'uttara north','uttara center','uttara south','pallabi','mirpur 11','mirpur 10',
    'kazipara','shewrapara','agargaon','bijoy sarani','farmgate','karwan bazar',
    'shahbag','dhaka university','bangladesh secretariat','motijheel','kamalapur'
  ];

  let METRO_DATA = null;

  function haversineKm(p1, p2) {
    if (!p1 || !p2) return null;
    const toRad = d => d * Math.PI / 180;
    const [lat1, lon1] = p1, [lat2, lon2] = p2;
    const R = 6371;
    const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  function computeFareForLeg(mode, distanceKm) {
    const m = String(mode || 'bus').toLowerCase();
    const t = FARE_TABLE[m] || FARE_TABLE.bus;
    if (!Number.isFinite(distanceKm) || distanceKm <= 0) return { fare: t.min || 0, fare_range: `\u09f3${t.min}`, computed: false };
    let raw = t.base + t.perKm * distanceKm;
    if (Number.isFinite(t.min)) raw = Math.max(raw, t.min);
    if (Number.isFinite(t.max) && t.max !== null) raw = Math.min(raw, t.max);
    const center = Math.round(raw), lo = Math.max(t.min || 0, Math.round(raw * 0.85)), hi = Math.round(raw * 1.15);
    return { fare: center, fare_range: lo === hi ? `\u09f3${center}` : `\u09f3${lo}\u2013${hi}`, computed: true };
  }

  function estimateTimeMinutes(mode, distanceKm) {
    if (!Number.isFinite(distanceKm) || distanceKm <= 0) return 0;
    const speedKmh = { bus: 15, ac_bus: 18, metro: 35, rickshaw: 10, leguna: 18, walking: 4.5 }[String(mode || 'bus').toLowerCase()] || 15;
    return Math.round((distanceKm / speedKmh) * 60);
  }

  function getMetroFare(fromStation, toStation) {
    if (!METRO_DATA || !METRO_DATA.fares) return null;
    const f = METRO_DATA.fares[fromStation];
    if (!f) return null;
    const fare = f[toStation];
    return Number.isFinite(fare) ? fare : null;
  }

  function metroStationsBetween(s1, s2) {
    const idx1 = METRO_STATIONS.indexOf(s1.toLowerCase());
    const idx2 = METRO_STATIONS.indexOf(s2.toLowerCase());
    if (idx1 < 0 || idx2 < 0) return 0;
    return Math.abs(idx1 - idx2);
  }

  const REGION_STORAGE_KEY = 'pathik_region_v1';

  const dom = {
    queryInput: document.getElementById('queryInput'),
    divisionSelect: document.getElementById('divisionSelect'),
    districtSelect: document.getElementById('districtSelect'),
    regionBadge: document.getElementById('regionBadge'),
    mainTagline: document.getElementById('mainTagline'),
    mainHeader: document.getElementById('mainHeader'),
    comingSoonCard: document.getElementById('comingSoonCard'),
    comingSoonTitle: document.getElementById('comingSoonTitle'),
    comingSoonDesc: document.getElementById('comingSoonDesc'),
    dataStatusTitle: document.getElementById('dataStatusTitle'),
    dataStatusText: document.getElementById('dataStatusText'),
    dataSubmitBtn: document.getElementById('dataSubmitBtn'),
    dataSubmitText: document.getElementById('dataSubmitText'),
    dataSubmitStatus: document.getElementById('dataSubmitStatus'),
    ratingArea: document.getElementById('routeRatingArea'),
    starDisplay: document.getElementById('starDisplay'),
    ratingCount: document.getElementById('ratingCount'),
    ratingStatus: document.getElementById('ratingStatus'),
    // Crowdsource
    tabAddStop: document.getElementById('tabAddStop'),
    tabAddRoute: document.getElementById('tabAddRoute'),
    tabMyData: document.getElementById('tabMyData'),
    addStopForm: document.getElementById('addStopForm'),
    addRouteForm: document.getElementById('addRouteForm'),
    mySubmissionsArea: document.getElementById('mySubmissionsArea'),
    newStopName: document.getElementById('newStopName'),
    newStopArea: document.getElementById('newStopArea'),
    newStopLat: document.getElementById('newStopLat'),
    newStopLng: document.getElementById('newStopLng'),
    submitStopBtn: document.getElementById('submitStopBtn'),
    submitStopStatus: document.getElementById('submitStopStatus'),
    newRouteFrom: document.getElementById('newRouteFrom'),
    newRouteTo: document.getElementById('newRouteTo'),
    newRouteBusName: document.getElementById('newRouteBusName'),
    newRouteFare: document.getElementById('newRouteFare'),
    newRouteStops: document.getElementById('newRouteStops'),
    submitRouteBtn: document.getElementById('submitRouteBtn'),
    submitRouteStatus: document.getElementById('submitRouteStatus'),
    mySubmissionsList: document.getElementById('mySubmissionsList'),
    mySubmissionsEmpty: document.getElementById('mySubmissionsEmpty'),
    // Feed
    toggleFeedFormBtn: document.getElementById('toggleFeedFormBtn'),
    newPostForm: document.getElementById('newPostForm'),
    postFrom: document.getElementById('postFrom'),
    postTo: document.getElementById('postTo'),
    postType: document.getElementById('postType'),
    postMessage: document.getElementById('postMessage'),
    submitPostBtn: document.getElementById('submitPostBtn'),
    postSubmitStatus: document.getElementById('postSubmitStatus'),
    feedList: document.getElementById('feedList'),
    feedEmpty: document.getElementById('feedEmpty'),
    routeFeedCard: document.getElementById('routeFeedCard'),
    routeFeedTitle: document.getElementById('routeFeedTitle'),
    routeFeedCount: document.getElementById('routeFeedCount'),
    routeFeedList: document.getElementById('routeFeedList'),
    fromInput: document.getElementById('fromInput'),
    toInput: document.getElementById('toInput'),
    placeSuggestions: document.getElementById('placeSuggestions'),
    searchBtn: document.getElementById('searchBtn'),
    statusArea: document.getElementById('statusArea'),
    routesContainer: document.getElementById('routesContainer'),
    routeDetails: document.getElementById('routeDetails'),
    saveRouteBtn: document.getElementById('saveRouteBtn'),
    savedRoutes: document.getElementById('savedRoutes'),
    barPathik: document.getElementById('barPathik'),
    pathikLabel: document.getElementById('pathikLabel'),
    saveBadge: document.getElementById('saveBadge'),
    testKeyBtn: document.getElementById('testKeyBtn'),
    activeModel: document.getElementById('activeModel'),
    providerSelect: document.getElementById('providerSelect'),
    locateBtn: document.getElementById('locateBtn'),
    useLocationBtn: document.getElementById('useLocationBtn'),
    mapStatus: document.getElementById('mapStatus'),
    nearbyCard: document.getElementById('nearbyCard'),
    nearbyList: document.getElementById('nearbyList'),
    nearbyCount: document.getElementById('nearbyCount'),
    nearbyIntro: document.getElementById('nearbyIntro'),
    feedbackType: document.getElementById('feedbackType'),
    feedbackText: document.getElementById('feedbackText'),
    feedbackBtn: document.getElementById('feedbackBtn'),
    feedbackStatus: document.getElementById('feedbackStatus')
  };

  const knownCoords = {
    'dhaka': [23.8103, 90.4125], 'airport': [23.8510, 90.4005], 'uttara': [23.8759, 90.3795],
    'ashulia': [23.9007, 90.2933], 'ashulia bazar': [23.9050, 90.2945], 'abdullahpur': [23.8775, 90.4029],
    
    'agargaon': [23.7772, 90.3792],
    'motijheel': [23.7333, 90.4172], 'mirpur': [23.8042, 90.3664], 'mirpur 1': [23.7956, 90.3537],
    'mirpur 10': [23.8069, 90.3685], 'mirpur 12': [23.8260, 90.3650], 'mirpur 14': [23.8170, 90.3784],
    'farmgate': [23.7561, 90.3872], 'gulshan': [23.7925, 90.4078], 'dhanmondi': [23.7461, 90.3742],
    'mohakhali': [23.7787, 90.4054], 'gulistan': [23.7268, 90.4119], 'sayedabad': [23.7106, 90.4287],
    'jatrabari': [23.7100, 90.4347], 'mohammadpur': [23.7660, 90.3597], 'bosila': [23.7600, 90.3450],
    'ghatar char': [23.7548, 90.3275], 'banasree': [23.7565, 90.4310], 'rampura': [23.7635, 90.4258],
    'badda': [23.7807, 90.4257], 'notun bazar': [23.7937, 90.4253], 'bashundhara': [23.8136, 90.4254],
    'shahjadpur': [23.7895, 90.4233], 'khilkhet': [23.8295, 90.4204], 'kuril': [23.8203, 90.4193],
    'gabtoli': [23.7793, 90.3389], 'hemayetpur': [23.7833, 90.2614], 'savar': [23.8583, 90.2667],
    'baipayl': [23.9095, 90.2746], 'nobinagar': [23.8829, 90.2589], 'fantasy kingdom': [23.9106, 90.2762],
    'kamarpara': [23.8918, 90.3990], 'demra': [23.7155, 90.4710],
    'gazipur chourasta': [23.9999, 90.4203], 'tongi': [23.8917, 90.4067],
    'chittagong road': [23.7000, 90.4920], 'sadarghat': [23.7066, 90.4105],
    'azimpur': [23.7282, 90.3859], 'banani': [23.7937, 90.4066],
    'malibagh': [23.7484, 90.4143], 'kalshi': [23.8244, 90.3814],
    'shyamoli': [23.7740, 90.3622], 'keraniganj': [23.6850, 90.4006],
    'postagola': [23.7028, 90.4170], 'chandra': [24.0394, 90.2840],
    'vulta': [23.7700, 90.5430], 'narayanganj': [23.6238, 90.5000],
    'bashabo': [23.7470, 90.4350], 'kamalapur': [23.7372, 90.4250]
  };

  let map, originMarker = null, destinationMarker = null, routeLine = null, userMarker = null;
  let currentLocation = null;
  let geocodedPlaceCoords = {};
  let currentResult = null, selectedRouteIndex = 0;
  let activeModel = localStorage.getItem(MODEL_CACHE_KEY) || '';
  let orAvailableModels = [];
  let rateLimitedModels = new Set();
  let CORRIDOR_DATA = null;
  let STOP_INDEX = null;
  /** Pending search state when user enters a geocoded From place (not in local DB) */
  let pendingGeocodeFrom = null;

  init();

  function init() {
    initRegionSystem();
    initMap();
    loadCorridorData();
    loadMetroData();
    loadSavedRoutesDropdown();
    bindEvents();
    const savedProvider = localStorage.getItem(PROVIDER_KEY);
    if (savedProvider) dom.providerSelect.value = savedProvider;
    dom.providerSelect.addEventListener('change', () => {
      localStorage.setItem(PROVIDER_KEY, dom.providerSelect.value);
      activeModel = '';
      localStorage.removeItem(MODEL_CACHE_KEY);
      dom.activeModel.textContent = 'Click "Test API Key" to verify.';
    });
    dom.activeModel.textContent = activeModel ? `Active: ${activeModel}` : 'Click "Test API Key" to verify.';
  }

  /** Initialize the Bangladesh region (division/district) selector */
  function initRegionSystem() {
    if (!dom.divisionSelect || !dom.districtSelect) return;

    // Populate divisions
    dom.divisionSelect.innerHTML = '<option value="">— বিভাগ নির্বাচন করুন —</option>';
    BANGLADESH_DIVISIONS.forEach(div => {
      const opt = document.createElement('option');
      opt.value = div.id;
      opt.textContent = `${div.nameBn} (${div.nameEn})${!div.hasData ? ' 📋' : ''}`;
      dom.divisionSelect.appendChild(opt);
    });

    // Restore saved region
    const saved = localStorage.getItem(REGION_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        dom.divisionSelect.value = parsed.division || '';
        updateDistrictDropdown(parsed.division);
        dom.districtSelect.value = parsed.district || '';
        applyRegionChange(parsed.division, parsed.district);
      } catch (_) {}
    }

    // Bind events
    dom.divisionSelect.addEventListener('change', () => {
      const divId = dom.divisionSelect.value;
      updateDistrictDropdown(divId);
      dom.districtSelect.value = '';
      applyRegionChange(divId, '');
      saveRegionState(divId, '');
    });

    dom.districtSelect.addEventListener('change', () => {
      const divId = dom.divisionSelect.value;
      const distId = dom.districtSelect.value;
      applyRegionChange(divId, distId);
      saveRegionState(divId, distId);
    });

    if (dom.dataSubmitBtn) {
      dom.dataSubmitBtn.addEventListener('click', handleDataSubmit);
    }
  }

  /** Update district dropdown based on selected division */
  function updateDistrictDropdown(divisionId) {
    if (!dom.districtSelect) return;
    dom.districtSelect.innerHTML = '<option value="">— জেলা নির্বাচন করুন —</option>';
    if (!divisionId || !BANGLADESH_DISTRICTS[divisionId]) return;

    const districts = BANGLADESH_DISTRICTS[divisionId];
    districts.forEach(dist => {
      const opt = document.createElement('option');
      opt.value = dist.id;
      opt.textContent = `${dist.nameBn} (${dist.nameEn})${!dist.hasData ? ' 📋' : ''}`;
      dom.districtSelect.appendChild(opt);
    });
  }

  /** Save region state to localStorage */
  function saveRegionState(divisionId, districtId) {
    if (!divisionId) {
      localStorage.removeItem(REGION_STORAGE_KEY);
      return;
    }
    localStorage.setItem(REGION_STORAGE_KEY, JSON.stringify({ division: divisionId, district: districtId }));
  }

  /** Apply the UI changes based on selected region */
  function applyRegionChange(divisionId, districtId) {
    if (!divisionId) {
      // No selection - show default Dhaka
      dom.comingSoonCard.hidden = true;
      dom.regionBadge.textContent = 'ঢাকা';
      dom.mainTagline.textContent = 'Verified low-cost public transport routes for Dhaka Metro area';
      hideComingSoonSections(false);
      return;
    }

    const division = BANGLADESH_DIVISIONS.find(d => d.id === divisionId);
    if (!division) return;

    // Find the selected district
    let district = null;
    if (districtId && BANGLADESH_DISTRICTS[divisionId]) {
      district = BANGLADESH_DISTRICTS[divisionId].find(d => d.id === districtId);
    }

    // Update badge and tagline
    const regionName = district ? district.nameBn : division.nameBn;
    dom.regionBadge.textContent = regionName;

    // Check if this specific region has data
    const hasData = district ? district.hasData : division.hasData;

    if (hasData) {
      // Region has data - show the app normally
      dom.comingSoonCard.hidden = true;
      dom.mainTagline.textContent = `Verified low-cost public transport routes for ${division.nameEn} area`;
      hideComingSoonSections(false);
    } else {
      // Region has no data - show "Coming Soon" message
      dom.comingSoonCard.hidden = false;
      const displayName = district ? `${district.nameBn} (${district.nameEn})` : `${division.nameBn} (${division.nameEn})`;
      dom.comingSoonTitle.textContent = `🚧 পথিক শীঘ্রই ${district ? district.nameBn : division.nameBn}তে আসছে!`;
      dom.comingSoonDesc.innerHTML = `
        আমরা বর্তমানে শুধুমাত্র <b>ঢাকা বিভাগ</b>-এর জন্য রুট তথ্য সংগ্রহ করেছি। 
        আপনি <b>${displayName}</b> নির্বাচন করেছেন — এই এলাকার জন্য এখনও ডাটা সংগ্রহ করা হয়নি।
      `;
      const dataDiv = BANGLADESH_DIVISIONS.find(d => d.hasData);
      dom.dataStatusTitle.textContent = `${dataDiv.nameBn} বিভাগের জন্য সম্পূর্ণ ডাটা উপলব্ধ`;
      dom.dataStatusText.textContent = `ঢাকায় বাস রুট, মেট্রো লাইন, ভাড়ার তথ্য — সবকিছুই প্রস্তুত।`;
      dom.mainTagline.textContent = `${division.nameEn} data coming soon — help us collect it!`;
      hideComingSoonSections(true);
    }
  }

  /** Toggle visibility of Dhaka-only sections */
  function hideComingSoonSections(comingSoon) {
    // When coming soon is shown, keep map, header, search visible but hide route-specific sections
    const sections = [
      dom.nearbyCard,
      document.querySelector('.savings-card'),
      document.querySelector('.routes-card'),
      document.querySelector('.details-card'),
      document.querySelector('.feedback-card')
    ];
    sections.forEach(s => { if (s) s.hidden = comingSoon; });
  }

  /** Handle data submission from the coming-soon form */
  function handleDataSubmit() {
    if (!dom.dataSubmitText || !dom.dataSubmitStatus) return;
    const text = dom.dataSubmitText.value.trim();
    if (!text) {
      dom.dataSubmitStatus.textContent = 'দয়া করে আপনার এলাকার পরিবহন তথ্য লিখুন।';
      dom.dataSubmitStatus.style.color = '#b91c1c';
      return;
    }

    // Save data to localStorage for now
    const DATA_COLLECTION_KEY = 'pathik_data_submissions_v1';
    let submissions = [];
    try {
      const raw = localStorage.getItem(DATA_COLLECTION_KEY);
      if (raw) submissions = JSON.parse(raw);
    } catch (_) {}
    
    const divId = dom.divisionSelect.value || '';
    const distId = dom.districtSelect.value || '';
    const division = BANGLADESH_DIVISIONS.find(d => d.id === divId);
    const district = distId && BANGLADESH_DISTRICTS[divId] 
      ? BANGLADESH_DISTRICTS[divId].find(d => d.id === distId) 
      : null;

    submissions.unshift({
      id: `data_${Date.now()}`,
      division: division ? `${division.nameBn} (${division.nameEn})` : 'Unknown',
      district: district ? `${district.nameBn} (${district.nameEn})` : 'General',
      text,
      createdAt: new Date().toISOString()
    });
    localStorage.setItem(DATA_COLLECTION_KEY, JSON.stringify(submissions.slice(0, 50)));

    dom.dataSubmitText.value = '';
    dom.dataSubmitStatus.textContent = '✅ আপনার তথ্য সংগ্রহ করা হয়েছে। ধন্যবাদ! আমরা খুব শীঘ্রই এটি ভেরিফাই করে ডাটাবেসে যোগ করবো।';
    dom.dataSubmitStatus.style.color = '#047857';
  }

  async function loadCorridorData() {
    try {
      const res = await fetch('routes.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      CORRIDOR_DATA = await res.json();
      STOP_INDEX = buildStopIndex(CORRIDOR_DATA);
      populatePlaceSuggestions();
      const count = (CORRIDOR_DATA.corridors || []).length;
      const stopCount = STOP_INDEX ? Object.keys(STOP_INDEX).length : 0;
      console.log(`[Pathik] \u2705 Loaded local DB: ${count} corridors, ${stopCount} stops`);
    } catch (e) {
      console.warn('[Pathik] routes.json not loaded; LLM-only mode:', e.message);
      CORRIDOR_DATA = null; STOP_INDEX = null;
    }
  }

  async function loadMetroData() {
    try {
      const res = await fetch('metro.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      METRO_DATA = await res.json();
      console.log(`[Pathik] \u2705 Loaded metro fares: ${(METRO_DATA.stations || []).length} stations`);
    } catch (e) {
      console.warn('[Pathik] metro.json not loaded; using flat metro fares:', e.message);
      METRO_DATA = null;
    }
  }

  function buildStopIndex(data) {
    if (!data || !Array.isArray(data.corridors)) return null;
    const idx = {};
    const add = (name, ref) => {
      const k = String(name || '').trim().toLowerCase();
      if (!k) return;
      if (!idx[k]) idx[k] = [];
      idx[k].push(ref);
    };
    data.corridors.forEach((c, ci) => {
      if (c.direct && Array.isArray(c.direct.stops)) c.direct.stops.forEach((s, i) => add(s, { ci, leg: 'direct', pos: i }));
      if (c.interchange) {
        ['leg1','leg2'].forEach(lk => {
          const leg = c.interchange[lk];
          if (leg && Array.isArray(leg.stops)) leg.stops.forEach((s, i) => add(s, { ci, leg: `interchange.${lk}`, pos: i }));
        });
      }
      if (c.from) add(c.from, { ci, leg: 'from', pos: -1 });
      if (c.to) add(c.to, { ci, leg: 'to', pos: -2 });
    });
    return idx;
  }

  function getAllPlaceNames() {
    const names = new Set(Object.keys(knownCoords || {}));
    if (CORRIDOR_DATA) {
      Object.keys(CORRIDOR_DATA.places || {}).forEach(n => names.add(n));
      Object.values(CORRIDOR_DATA.places || {}).forEach(list => {
        if (Array.isArray(list)) list.forEach(n => names.add(String(n || '').trim()));
      });
      (CORRIDOR_DATA.corridors || []).forEach(c => {
        if (c.from) names.add(c.from);
        if (c.to) names.add(c.to);
        if (c.direct && Array.isArray(c.direct.stops)) c.direct.stops.forEach(n => names.add(n));
        if (c.interchange) {
          ['leg1', 'leg2'].forEach(k => {
            const leg = c.interchange[k];
            if (leg && Array.isArray(leg.stops)) leg.stops.forEach(n => names.add(n));
          });
        }
      });
    }
    METRO_STATIONS.forEach(n => names.add(n));
    return [...names]
      .map(n => String(n || '').trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }

  function populatePlaceSuggestions() {
    if (!dom.placeSuggestions) return;
    dom.placeSuggestions.innerHTML = '';
    getAllPlaceNames().slice(0, 700).forEach(name => {
      const option = document.createElement('option');
      option.value = titleCase(name);
      dom.placeSuggestions.appendChild(option);
    });
  }

  function stopMatchesPlace(stopName, placeName) {
    const s = String(stopName || '').toLowerCase().trim();
    const p = String(placeName || '').toLowerCase().trim();
    if (!s || !p) return false;
    if (s === p) return true;
    if (s.includes(p) || p.includes(s)) return true;
    const places = (CORRIDOR_DATA && CORRIDOR_DATA.places) || {};
    const aliases = places[p] || [];
    for (const a of aliases) { const al = String(a).toLowerCase(); if (s === al || s.includes(al) || al.includes(s)) return true; }
    for (const [canonical, al] of Object.entries(places)) {
      if (!Array.isArray(al)) continue;
      if (al.some(x => String(x).toLowerCase() === p)) { if (canonical === s) return true; }
    }
    return false;
  }

  function findRouteFromStops(originRaw, destRaw) {
    if (!CORRIDOR_DATA || !Array.isArray(CORRIDOR_DATA.corridors)) return null;
    const o = normalizePlace(originRaw), d = normalizePlace(destRaw);
    if (!o || !d || o === d) return null;
    const matches = [];
    const scan = (leg, corridor, legLabel) => {
      if (!leg || !Array.isArray(leg.stops) || leg.stops.length < 2) return;
      let oi = -1, di = -1;
      for (let i = 0; i < leg.stops.length; i++) {
        if (oi < 0 && stopMatchesPlace(leg.stops[i], o)) oi = i;
        if (di < 0 && stopMatchesPlace(leg.stops[i], d)) di = i;
      }
      if (oi < 0 || di < 0 || oi === di) return;
      const rev = oi > di;
      const lo = Math.min(oi, di), hi = Math.max(oi, di);
      const sub = leg.stops.slice(lo, hi + 1);
      matches.push({
        corridor, leg, legLabel, subStops: rev ? [...sub].reverse() : sub,
        stopsBetween: hi - lo,
        names: (Array.isArray(leg.names) && leg.names.length) ? leg.names : (Array.isArray(corridor.direct?.names) ? corridor.direct.names : []),
        mode: leg.mode || 'bus'
      });
    };
    CORRIDOR_DATA.corridors.forEach(c => {
      if (c.direct) scan(c.direct, c, 'direct');
      if (c.interchange) { if (c.interchange.leg1) scan(c.interchange.leg1, c, 'leg1'); if (c.interchange.leg2) scan(c.interchange.leg2, c, 'leg2'); }
    });
    if (!matches.length) return null;
    const seen = new Set(), unique = [];
    matches.forEach(m => { const k = (m.names.join('|') || m.mode) + '::' + m.stopsBetween; if (!seen.has(k)) { seen.add(k); unique.push(m); } });
    unique.sort((a, b) => a.stopsBetween - b.stopsBetween);
    return { matches: unique, origin: o, destination: d };
  }

  function normalizeStopName(name) {
    return String(name || '').toLowerCase().trim().replace(/\s+/g, ' ');
  }

  function routeOverlapScore(aStops, bStops) {
    const a = new Set((aStops || []).map(normalizeStopName).filter(Boolean));
    const b = new Set((bStops || []).map(normalizeStopName).filter(Boolean));
    if (!a.size || !b.size) return 0;
    let common = 0;
    a.forEach(s => { if (b.has(s)) common++; });
    return common / Math.max(a.size, b.size);
  }

  function groupSimilarMatches(matches) {
    const groups = [];
    (matches || []).forEach((m) => {
      const existing = groups.find(g => routeOverlapScore(g.rep.subStops, m.subStops) >= 0.35);
      if (existing) {
        existing.items.push(m);
        existing.rep.names = [...new Set([...existing.rep.names, ...m.names])];
        if (m.stopsBetween < existing.rep.stopsBetween) { const names = existing.rep.names; existing.rep = { ...m, names }; }
      } else {
        groups.push({ rep: { ...m, names: [...new Set(m.names || [])] }, items: [m] });
      }
    });
    return groups
      .map(g => ({ ...g.rep, names: [...new Set(g.items.flatMap(x => x.names || []))] }))
      .sort((a, b) => a.stopsBetween - b.stopsBetween);
  }

  function combinedTransferStops(transfer) {
    const first = transfer?.first?.subStops || [];
    const second = transfer?.second?.subStops || [];
    return [...first, ...second.slice(1)];
  }

  function groupSimilarTransfers(candidates) {
    const groups = [];
    (candidates || []).forEach((c) => {
      const existing = groups.find(g => {
        const sameHub = g.rep.hub === c.hub;
        const legsOverlap = routeOverlapScore(g.rep.first.subStops, c.first.subStops) >= 0.5 &&
                            routeOverlapScore(g.rep.second.subStops, c.second.subStops) >= 0.5;
        const sameFullRoute = routeOverlapScore(combinedTransferStops(g.rep), combinedTransferStops(c)) >= 0.5;
        return (sameHub && legsOverlap) || sameFullRoute;
      });
      if (existing) {
        existing.items.push(c);
        if (c.totalStops < existing.rep.totalStops) existing.rep = c;
      } else {
        groups.push({ rep: c, items: [c] });
      }
    });
    return groups.map(g => {
      const firstNames = [...new Set(g.items.flatMap(x => x.first.names || []))];
      const secondNames = [...new Set(g.items.flatMap(x => x.second.names || []))];
      return {
        ...g.rep,
        first: { ...g.rep.first, names: firstNames },
        second: { ...g.rep.second, names: secondNames }
      };
    }).sort((a, b) => a.totalStops - b.totalStops);
  }

  function findBestTransferRoutes(originRaw, destRaw, usedBusNames = new Set(), limit = 2) {
    if (!CORRIDOR_DATA || !Array.isArray(CORRIDOR_DATA.corridors)) return null;
    const o = normalizePlace(originRaw), d = normalizePlace(destRaw);
    const starts = [], ends = [];
    const scan = (leg, corridor, target, out, direction) => {
      if (!leg || !Array.isArray(leg.stops) || leg.stops.length < 3) return;
      const names = (Array.isArray(leg.names) && leg.names.length) ? leg.names : (Array.isArray(corridor.direct?.names) ? corridor.direct.names : []);
      if (names.some(n => usedBusNames.has(n))) return;
      let idx = -1;
      for (let i = 0; i < leg.stops.length; i++) if (idx < 0 && stopMatchesPlace(leg.stops[i], target)) idx = i;
      if (idx < 0) return;
      if (direction === 'from') {
        for (let j = 0; j < leg.stops.length; j++) {
          if (j === idx) continue;
          const lo = Math.min(idx, j), hi = Math.max(idx, j);
          const sub = leg.stops.slice(lo, hi + 1);
          out.push({ corridor, leg, names, mode: leg.mode || 'bus', hub: normalizeStopName(leg.stops[j]), subStops: idx > j ? [...sub].reverse() : sub, stopsBetween: Math.abs(idx - j) });
        }
      } else {
        for (let i = 0; i < leg.stops.length; i++) {
          if (i === idx) continue;
          const lo = Math.min(i, idx), hi = Math.max(i, idx);
          const sub = leg.stops.slice(lo, hi + 1);
          out.push({ corridor, leg, names, mode: leg.mode || 'bus', hub: normalizeStopName(leg.stops[i]), subStops: i > idx ? [...sub].reverse() : sub, stopsBetween: Math.abs(i - idx) });
        }
      }
    };
    CORRIDOR_DATA.corridors.forEach(c => {
      if (c.direct) {
        scan(c.direct, c, o, starts, 'from');
        scan(c.direct, c, d, ends, 'to');
      }
    });
    const candidates = [];
    const endByHub = new Map();
    ends.forEach(e => {
      if (!endByHub.has(e.hub)) endByHub.set(e.hub, []);
      endByHub.get(e.hub).push(e);
    });
    endByHub.forEach(list => list.sort((a, b) => a.stopsBetween - b.stopsBetween));
    starts.forEach(s => {
      const hubEnds = endByHub.get(s.hub) || [];
      hubEnds.forEach(e => {
        const sameBus = s.names.some(n => e.names.includes(n));
        if (sameBus) return;
        const totalStops = s.stopsBetween + e.stopsBetween;
        candidates.push({ first: s, second: e, hub: s.hub, totalStops });
      });
    });
    return groupSimilarTransfers(candidates).slice(0, limit);
  }

  function findBestTransferRoute(originRaw, destRaw, usedBusNames = new Set()) {
    const routes = findBestTransferRoutes(originRaw, destRaw, usedBusNames, 1);
    return routes && routes[0] ? routes[0] : null;
  }

  function normalizePlace(text) {
    const t = String(text || '').trim().toLowerCase();
    if (!t || !CORRIDOR_DATA) return t;
    const places = CORRIDOR_DATA.places || {};
    if (places[t]) return t;
    for (const [c, aliases] of Object.entries(places)) {
      if (c === t) return c;
      if (Array.isArray(aliases)) for (const a of aliases) if (t === String(a).toLowerCase()) return c;
    }
    for (const [c, aliases] of Object.entries(places)) {
      if (t.includes(c)) return c;
      if (Array.isArray(aliases)) for (const a of aliases) { const al = String(a).toLowerCase(); if (t.includes(al) || al.includes(t)) return c; }
    }
    return t;
  }

  function lookupCorridor(originRaw, destRaw) {
    if (!CORRIDOR_DATA || !Array.isArray(CORRIDOR_DATA.corridors)) return null;
    const o = normalizePlace(originRaw), d = normalizePlace(destRaw);
    if (!o || !d || o === d) return null;
    let c = CORRIDOR_DATA.corridors.find(x => x.from === o && x.to === d);
    if (c) return { corridor: c, reversed: false, origin: o, destination: d };
    c = CORRIDOR_DATA.corridors.find(x => x.from === d && x.to === o);
    if (c) return { corridor: c, reversed: true, origin: o, destination: d };
    return null;
  }

  function titleCase(s) { return String(s || '').split(' ').map(w => w ? w[0].toUpperCase() + w.slice(1) : '').join(' '); }
  function inferIcon(mode) { if (mode === 'rickshaw') return '\ud83d\udefa'; if (mode === 'leguna') return '\ud83d\ude90'; if (mode === 'walking') return '\ud83d\udeb6'; if (mode === 'metro') return '\ud83d\ude87'; return '\ud83d\ude8c'; }
  function tipForMode(mode) { switch(mode){ case 'metro': return '\u09ae\u09c7\u099f\u09cd\u09b0\u09cb\u09a4\u09c7 \u0985\u0997\u09cd\u09b0\u09bf\u09ae\u09c0\u09b0 \u09b8\u09be\u09ae\u09a8\u09c7 \u09ac\u09b8\u09be \u09af\u09be\u09a8\u0964'; case 'bus': return '\u09b8\u09b0\u09be\u09b8\u09b0\u09bf \u09ac\u09be\u09b8\u09c7 \u09a8\u09bf\u09a8, \u0995\u09a8\u09cd\u09a1\u09be\u0995\u09cd\u099f\u09b0\u0995\u09c7 \u09ad\u09be\u09a1\u09bc\u09be \u099c\u09bf\u099c\u09cd\u099e\u09be\u09b8\u09be \u0995\u09b0\u09c1\u09a8\u0964'; case 'rickshaw': return '\u099c\u09be\u09ae \u098f\u09a1\u09bc\u09be\u09b2\u09c7 \u09b0\u09bf\u0995\u09b6\u09be\u09af\u09bc \u0985\u09b2\u09cd\u09aa \u09b8\u09cd\u099f\u09c7\u09b6\u09a8\u09c7 \u09af\u09be\u09a8\u0964'; case 'walking': return '\u0995\u09be\u099b\u09be\u0995\u09be\u099b\u09bf \u09b8\u09cd\u099f\u09cd\u09af\u09be\u09a8\u09cd\u09a1 \u09aa\u09b0\u09cd\u09af\u09a8\u09cd\u09a4 \u09b9\u09c7\u0981\u099f\u09c7 \u09af\u09be\u09a8\u0964'; default: return ''; } }

  function getMetroStationName(place) {
    const p = normalizePlace(place);
    for (const s of METRO_STATIONS) { if (p === s) return titleCase(s); if (p.includes(s)) return titleCase(s); if (s.includes(p) && p.length > 3) return titleCase(s); }
    if (p === 'uttara') return 'Uttara North';
    if (p === 'du') return 'Dhaka University';
    if (p === 'secretariat') return 'Bangladesh Secretariat';
    return null;
  }

  function buildMetroOption(origin, destination, distKm, id) {
    const oStationRaw = getMetroStationName(origin);
    const dStationRaw = getMetroStationName(destination);
    if (!oStationRaw && !dStationRaw) return null;

    const oStation = oStationRaw || getMetroStationName(`${origin} metro`);
    const dStation = dStationRaw || getMetroStationName(`${destination} metro`);

    if (oStation && dStation) {
      const m = makeMetroStep(oStation, dStation);
      return { id, label: 'MRT-6 Metro Direct', total_cost: m.cost, total_cost_range: m.cost_range, total_time_minutes: m.time_minutes, total_time_range: m.time_range, steps: [m] };
    }
    return null;
  }

  function makeMetroStep(fromStation, toStation) {
    let metroCost = 60, metroTime = 25;
    if (METRO_DATA && METRO_DATA.fares && fromStation && toStation) {
      const fare = getMetroFare(fromStation, toStation);
      if (fare !== null) metroCost = fare;
      const stops = metroStationsBetween(fromStation, toStation);
      metroTime = Math.max(5, stops * 2 + 5);
    }
    return {
      mode: 'metro', icon: inferIcon('metro'), from: titleCase(fromStation), to: titleCase(toStation),
      bus_names: [], landmarks: [],
      cost: metroCost, cost_range: `\u09f3${metroCost}`,
      time_minutes: metroTime, time_range: `${Math.max(5, metroTime - 3)}\u2013${metroTime + 5} \u09ae\u09bf\u09a8\u09bf\u099f`,
      tip_bn: '\u09ae\u09c7\u099f\u09cd\u09b0\u09cb\u09a4\u09c7 \u0985\u0997\u09cd\u09b0\u09bf\u09ae\u09c0\u09b0 \u09b8\u09be\u09ae\u09a8\u09c7 \u09ac\u09b8\u09be \u09af\u09be\u09a8\u0964', fare_source: 'dmtcl_fare_matrix'
    };
  }

  function makePublicBusStep(match, fromLbl, toLbl) {
    const mode = match.mode || 'bus';
    const fromCoords = resolveCoords(fromLbl), toCoords = resolveCoords(toLbl);
    const distKm = haversineKm(fromCoords, toCoords);
    const calc = computeFareForLeg(mode, distKm);
    const time = estimateTimeMinutes(mode, distKm);
    const names = (Array.isArray(match.names) && match.names.length) ? match.names : (Array.isArray(match.corridor?.direct?.names) ? match.corridor.direct.names : []);
    return {
      mode, icon: inferIcon(mode), from: titleCase(fromLbl), to: titleCase(toLbl),
      bus_names: [...new Set(names)], landmarks: (match.subStops || []).slice(0, 8),
      cost: calc.fare, cost_range: calc.fare_range,
      time_minutes: time, time_range: `${Math.max(5, time - 5)}\u2013${time + 10} \u09ae\u09bf\u09a8\u09bf\u099f`,
      tip_bn: tipForMode(mode), fare_source: 'distance_calc', distance_km: distKm ? Number(distKm.toFixed(2)) : null
    };
  }

  function buildRoutesFromStopMatch(match, originDisplay, destinationDisplay) {
    const origin = titleCase(originDisplay || match.origin);
    const destination = titleCase(destinationDisplay || match.destination);
    const fromCoords = resolveCoords(origin), toCoords = resolveCoords(destination);
    const distKm = haversineKm(fromCoords, toCoords);
    const routes = [];
    const grouped = groupSimilarMatches(match.matches);
    // --- Merge all similar route groups into one "Direct Bus"
const best = grouped[0];
if (best) {
  // Find all groups that overlap significantly with the best group (same corridor)
  const similarGroups = grouped.filter(g => routeOverlapScore(g.subStops, best.subStops) >= 0.45);
  
  // Merge bus names from all similar groups
  const mergedDirect = {
    ...best,
    names: [...new Set(similarGroups.flatMap(g => g.names || []))]
  };
  
  const step = makePublicBusStep(mergedDirect, origin, destination);
  routes.push({
    id: 1,
    label: 'Direct Bus',
    total_cost: step.cost,
    total_cost_range: step.cost_range,
    total_time_minutes: step.time_minutes,
    total_time_range: step.time_range,
    steps: [step]
  });
}
// No separate "Alternative Bus" added here – alternatives come later from transfers/metro

    const metroUsed = routes.some(r => r.steps.some(s => s.mode === 'metro'));
    const metroOpt = buildMetroOption(origin, destination, distKm, routes.length + 1);
    if (metroOpt && !metroUsed) routes.push(metroOpt);

    const altPath = grouped.find((m, i) => i > 0 && routeOverlapScore(m.subStops, best.subStops) < 0.3);
    if (altPath && routes.length < 3) {
      const altStep = makePublicBusStep(altPath, origin, destination);
      routes.push({
        id: routes.length + 1,
        label: 'Alternative Path',
        total_cost: altStep.cost,
        total_cost_range: altStep.cost_range,
        total_time_minutes: altStep.time_minutes,
        total_time_range: altStep.time_range,
        steps: [altStep]
      });
    }

    const usedBusNames = new Set(routes.flatMap(r => r.steps.flatMap(s => s.bus_names || [])));
    const transfers = findBestTransferRoutes(match.origin, match.destination, usedBusNames, 12) || [];
    const usedHubs = new Set();
    transfers.forEach((transfer) => {
      if (routes.length >= 7) return;
      if (usedHubs.has(transfer.hub)) return;
      usedHubs.add(transfer.hub);
      const hub = titleCase(transfer.hub);
      const first = makePublicBusStep(transfer.first, origin, hub);
      const second = makePublicBusStep(transfer.second, hub, destination);
      const total = first.cost + second.cost;
      const totalTime = first.time_minutes + second.time_minutes;
      routes.push({
        id: routes.length + 1,
        label: 'Alternative Bus Change',
        total_cost: total,
        total_cost_range: `\u09f3${Math.max(10, total - 10)}\u2013${total + 15}`,
        total_time_minutes: totalTime,
        total_time_range: `${Math.max(10, totalTime - 8)}\u2013${totalTime + 15} \u09ae\u09bf\u09a8\u09bf\u099f`,
        steps: [first, second]
      });
    });

    routes.push(...buildMetroTransferRoutes(match.origin, match.destination, 3));
    routes.forEach((r, i) => { r.id = i + 1; });
    return { origin, destination, routes: routes.slice(0, 8), _source: 'stop_search' };
  }

  function buildRoutesFromTransfers(transfers, originDisplay, destinationDisplay) {
    const origin = titleCase(originDisplay);
    const destination = titleCase(destinationDisplay);
    const routes = [];
    const usedHubs = new Set();
    (transfers || []).forEach((transfer) => {
      if (routes.length >= 8) return;
      if (usedHubs.has(transfer.hub)) return;
      usedHubs.add(transfer.hub);
      const hub = titleCase(transfer.hub);
      const first = makePublicBusStep(transfer.first, origin, hub);
      const second = makePublicBusStep(transfer.second, hub, destination);
      const total = first.cost + second.cost;
      const totalTime = first.time_minutes + second.time_minutes;
      routes.push({
        id: routes.length + 1,
        label: routes.length === 0 ? `Bus Change via ${hub}` : `Alternative via ${hub}`,
        total_cost: total,
        total_cost_range: `\u09f3${Math.max(10, total - 10)}\u2013${total + 15}`,
        total_time_minutes: totalTime,
        total_time_range: `${Math.max(10, totalTime - 8)}\u2013${totalTime + 15} \u09ae\u09bf\u09a8\u09bf\u099f`,
        steps: [first, second]
      });
    });
    return { origin, destination, routes, _source: 'transfer_search' };
  }

  function buildMetroTransferRoutes(originDisplay, destinationDisplay, limit = 3) {
    if (!CORRIDOR_DATA || !Array.isArray(CORRIDOR_DATA.corridors)) return [];
    const origin = titleCase(originDisplay);
    const destination = titleCase(destinationDisplay);
    const originStation = getMetroStationName(originDisplay);
    const destStation = getMetroStationName(destinationDisplay);
    const routes = [];
    const addRoute = (label, steps) => {
      const total = sum(steps.map(s => Number(s.cost) || 0));
      const totalTime = sum(steps.map(s => Number(s.time_minutes) || 0));
      routes.push({
        id: routes.length + 1,
        label,
        total_cost: total,
        total_cost_range: `\u09f3${Math.max(10, total - 10)}\u2013${total + 15}`,
        total_time_minutes: totalTime,
        total_time_range: `${Math.max(10, totalTime - 8)}\u2013${totalTime + 15} \u09ae\u09bf\u09a8\u09bf\u099f`,
        steps
      });
    };
    const busToMetro = [];
    const metroToBus = [];

    CORRIDOR_DATA.corridors.forEach(c => {
      const leg = c.direct;
      if (!leg || !Array.isArray(leg.stops) || leg.stops.length < 3) return;
      const names = (Array.isArray(leg.names) && leg.names.length) ? leg.names : [];

      if (destStation) {
        let oi = -1;
        for (let i = 0; i < leg.stops.length; i++) if (oi < 0 && stopMatchesPlace(leg.stops[i], normalizePlace(originDisplay))) oi = i;
        if (oi >= 0) {
          leg.stops.forEach((stop, j) => {
            if (j === oi) return;
            const station = getMetroStationName(stop);
            if (!station || station === destStation) return;
            const lo = Math.min(oi, j), hi = Math.max(oi, j);
            const sub = leg.stops.slice(lo, hi + 1);
            busToMetro.push({ corridor: c, leg, names, mode: leg.mode || 'bus', station, hub: stop, subStops: oi > j ? [...sub].reverse() : sub, stopsBetween: Math.abs(oi - j) });
          });
        }
      }

      if (originStation) {
        let di = -1;
        for (let i = 0; i < leg.stops.length; i++) if (di < 0 && stopMatchesPlace(leg.stops[i], normalizePlace(destinationDisplay))) di = i;
        if (di >= 0) {
          leg.stops.forEach((stop, i) => {
            if (i === di) return;
            const station = getMetroStationName(stop);
            if (!station || station === originStation) return;
            const lo = Math.min(i, di), hi = Math.max(i, di);
            const sub = leg.stops.slice(lo, hi + 1);
            metroToBus.push({ corridor: c, leg, names, mode: leg.mode || 'bus', station, hub: stop, subStops: i > di ? [...sub].reverse() : sub, stopsBetween: Math.abs(i - di) });
          });
        }
      }
    });

    groupSimilarMatches(busToMetro).slice(0, limit).forEach(match => {
      if (routes.length >= limit) return;
      const hub = titleCase(match.hub);
      const busStep = makePublicBusStep(match, origin, hub);
      const metroStep = makeMetroStep(match.station, destStation);
      addRoute(`Bus + Metro via ${hub}`, [busStep, metroStep]);
    });

    groupSimilarMatches(metroToBus).slice(0, limit).forEach(match => {
      if (routes.length >= limit) return;
      const hub = titleCase(match.hub);
      const metroStep = makeMetroStep(originStation, match.station);
      const busStep = makePublicBusStep(match, hub, destination);
      addRoute(`Metro + Bus via ${hub}`, [metroStep, busStep]);
    });

    return routes;
  }

  function buildStepFromLeg(leg, from, to, reversed, fallbackNames) {
    const stops = Array.isArray(leg.stops) ? (reversed ? [...leg.stops].reverse() : leg.stops) : [];
    const mode = leg.mode || 'bus';
    const fromCoords = resolveCoords(from), toCoords = resolveCoords(to);
    const distKm = haversineKm(fromCoords, toCoords);
    let fare = Number(leg.fare), fareRange = leg.fare_range, computed = false;
    if (!fare || fare <= 0) { const calc = computeFareForLeg(mode, distKm); fare = calc.fare; fareRange = calc.fare_range; computed = calc.computed; }
    else if (!fareRange) fareRange = `\u09f3${fare}`;
    let time = Number(leg.time) || 0, timeRange = leg.time_range;
    if (!time) { time = estimateTimeMinutes(mode, distKm); timeRange = `${Math.max(5, time - 5)}\u2013${time + 10} \u09ae\u09bf\u09a8\u09bf\u099f`; }
    else if (!timeRange) timeRange = `${time} \u09ae\u09bf\u09a8\u09bf\u099f`;
    const names = (Array.isArray(leg.names) && leg.names.length) ? leg.names : (Array.isArray(fallbackNames) ? fallbackNames : []);
    return { mode, icon: inferIcon(mode), from: titleCase(from), to: titleCase(to), bus_names: names, landmarks: stops.slice(0, 4), cost: fare, cost_range: fareRange, time_minutes: time, time_range: timeRange, tip_bn: tipForMode(mode), fare_source: computed ? 'distance_calc' : (leg.fare ? 'curated' : 'unknown'), distance_km: distKm ? Number(distKm.toFixed(2)) : null };
  }

  function buildRoutesFromCorridor(match, originDisplay, destinationDisplay) {
    const c = match.corridor, reversed = match.reversed;
    const origin = titleCase(originDisplay || match.origin);
    const destination = titleCase(destinationDisplay || match.destination);
    const fromCoords = resolveCoords(origin), toCoords = resolveCoords(destination);
    const distKm = haversineKm(fromCoords, toCoords);
    const routes = [];
    if (c.direct) {
      const dir = c.direct;
      const fastStep = buildStepFromLeg(dir, origin, destination, reversed, c.direct?.names);
      routes.push({ id: 1, label: 'Direct Bus', total_cost: fastStep.cost, total_cost_range: fastStep.cost_range, total_time_minutes: fastStep.time_minutes, total_time_range: fastStep.time_range, steps: [fastStep] });
      const metroOpt = buildMetroOption(origin, destination, distKm, routes.length + 1);
      if (metroOpt) routes.push(metroOpt);

      const usedBusNames = new Set(routes.flatMap(r => r.steps.flatMap(s => s.bus_names || [])));
      const transfers = findBestTransferRoutes(match.origin, match.destination, usedBusNames, 8 - routes.length) || [];
      transfers.forEach((transfer) => {
        if (routes.length >= 8) return;
        const hub = titleCase(transfer.hub);
        const first = makePublicBusStep(transfer.first, origin, hub);
        const second = makePublicBusStep(transfer.second, hub, destination);
        const total = first.cost + second.cost;
        const totalTime = first.time_minutes + second.time_minutes;
        routes.push({
          id: routes.length + 1,
          label: 'Alternative Bus Change',
          total_cost: total,
          total_cost_range: `\u09f3${Math.max(10, total - 10)}\u2013${total + 15}`,
          total_time_minutes: totalTime,
          total_time_range: `${Math.max(10, totalTime - 8)}\u2013${totalTime + 15} \u09ae\u09bf\u09a8\u09bf\u099f`,
          steps: [first, second]
        });
      });
      routes.push(...buildMetroTransferRoutes(match.origin, match.destination, 3));
      routes.forEach((r, i) => { r.id = i + 1; });
    }
    return { origin, destination, routes: routes.slice(0, 8), _source: 'local_db_distance_calc' };
  }

  function bindEvents() {
    dom.searchBtn.addEventListener('click', onSearch);
    [dom.queryInput, dom.fromInput, dom.toInput].filter(Boolean).forEach(input => {
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') onSearch(); });
    });
    dom.saveRouteBtn.addEventListener('click', saveCurrentRoute);
    dom.testKeyBtn.addEventListener('click', testApiKey);
    if (dom.feedbackBtn) dom.feedbackBtn.addEventListener('click', saveFeedback);
    if (dom.locateBtn) dom.locateBtn.addEventListener('click', locateUser);
    if (dom.useLocationBtn) dom.useLocationBtn.addEventListener('click', useMyLocation);
    dom.savedRoutes.addEventListener('change', (e) => {
      const id = e.target.value; if (!id) return;
      const saved = getSavedRoutes();
      const found = saved.find((r) => r.id === id);
      if (!found) return;
      currentResult = found.payload;
      selectedRouteIndex = Math.max(0, (found.payload.routes || []).findIndex(r => r.id === found.selectedRouteId));
      if (selectedRouteIndex < 0) selectedRouteIndex = 0;
      renderAll();
      setStatus('Saved route loaded.', 'success');
    });
  }

  function initMap() {
    map = L.map('map').setView([23.8103, 90.4125], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
  }

  function getProvider() {
    const val = dom.providerSelect.value || 'groq';
    if (val === 'groq') return { name: 'groq', model: null };
    const m = val.match(/^openrouter:(.+)$/);
    if (m) return { name: 'openrouter', model: m[1] };
    return { name: 'groq', model: null };
  }

  function getKey(provider) {
    const cfg = window.PATHIK_CONFIG || {};
    if (provider.name === 'groq') { const k = cfg.GROQ_API_KEY || ''; return (k && k !== 'YOUR_GROQ_API_KEY') ? k : ''; }
    const k = cfg.OPENROUTER_API_KEY || '';
    return (k && k !== 'YOUR_OPENROUTER_API_KEY') ? k : '';
  }

  function isRateLimitError(err) { return /HTTP 429|rate limit|too many requests/i.test(err.message || ''); }
  function isNotFoundError(err) { return /HTTP 404|No endpoints|not found/i.test(err.message || ''); }
  function isEmptyResponseError(err) { return /Empty response/i.test(err.message || ''); }

  async function testApiKey() {
    const provider = getProvider();
    const key = getKey(provider);
    if (!key) { setStatus(`Missing ${provider.name.toUpperCase()} key in config.js.`, 'error'); return; }
    dom.testKeyBtn.disabled = true;
    setStatus('<span class="spinner"></span>Testing key...');
    try {
      let model;
      if (provider.name === 'groq') model = await pickGroqModel(key);
      else model = await resolveOpenRouterModel(key, provider.model);
      await tryWithFallback(provider, key, model, 'Reply OK only.', { maxTokens: 16, json: false });
      setStatus(`\u2705 Key OK. Using ${provider.name}: ${activeModel}`, 'success');
    } catch (err) {
      console.error(err);
      setStatus(isRateLimitError(err) ? `\u23f3 Rate limited. Try Groq or wait.` : `API key test failed:\n${err.message}`, 'error');
    } finally { dom.testKeyBtn.disabled = false; }
  }

  async function tryWithFallback(provider, key, model, prompt, opts) {
    const tried = new Set();
    let current = model, lastErr = null;
    const maxAttempts = provider.name === 'openrouter' ? 4 : 1;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (tried.has(current)) break;
      tried.add(current);
      try {
        const raw = await callLLM(provider, key, current, prompt, opts);
        activeModel = current;
        localStorage.setItem(MODEL_CACHE_KEY, activeModel);
        dom.activeModel.textContent = `Active: ${provider.name} \u2022 ${current}`;
        return raw;
      } catch (err) {
        lastErr = err;
        if (provider.name !== 'openrouter') throw err;
        if (!isRateLimitError(err) && !isNotFoundError(err)) throw err;
        if (isRateLimitError(err)) rateLimitedModels.add(current);
        const models = await listOpenRouterModels(key).catch(() => []);
        const next = [...OR_PREFERRED_FREE.filter(m => models.includes(m)), ...models.filter(m => m.endsWith(':free'))].find(m => !tried.has(m) && !rateLimitedModels.has(m));
        if (!next) break;
        current = next;
      }
    }
    throw lastErr || new Error('All free models exhausted');
  }

  async function pickGroqModel(key) {
    const res = await fetch(`${GROQ_BASE}/models`, { headers: { 'Authorization': `Bearer ${key}` } });
    if (!res.ok) throw new Error(`Groq ListModels HTTP ${res.status}`);
    const data = await res.json();
    const ids = (data.data || []).map(m => m.id).filter(id => id && !/whisper|tts|guard/i.test(id));
    for (const p of GROQ_PREFERRED) if (ids.includes(p)) return p;
    return ids.find(i => /llama/i.test(i)) || ids[0];
  }

  async function listOpenRouterModels(key) {
    if (orAvailableModels.length) return orAvailableModels;
    const res = await fetch(`${OPENROUTER_BASE}/models`, { headers: { 'Authorization': `Bearer ${key}` } });
    if (!res.ok) throw new Error(`OpenRouter ListModels HTTP ${res.status}`);
    const data = await res.json();
    orAvailableModels = (data.data || []).map(m => m.id);
    return orAvailableModels;
  }

  async function resolveOpenRouterModel(key, requested) {
    if (!requested || requested === 'auto') {
      const models = await listOpenRouterModels(key);
      for (const p of OR_PREFERRED_FREE) if (models.includes(p) && !rateLimitedModels.has(p)) return p;
      const anyFree = models.find(m => m.endsWith(':free') && !rateLimitedModels.has(m));
      if (anyFree) return anyFree;
      throw new Error('No free OpenRouter models available.');
    }
    try {
      const models = await listOpenRouterModels(key);
      if (models.includes(requested)) return requested;
      for (const p of OR_PREFERRED_FREE) if (models.includes(p)) return p;
      const anyFree = models.find(m => m.endsWith(':free'));
      if (anyFree) return anyFree;
    } catch (e) {}
    return requested;
  }

  async function callLLM(provider, key, model, prompt, opts = {}) {
    const base = provider.name === 'groq' ? GROQ_BASE : OPENROUTER_BASE;
    const body = { model, messages: [{ role: 'user', content: prompt }], temperature: opts.temperature ?? 0.2, max_tokens: opts.maxTokens ?? 4096 };
    if (opts.json) body.response_format = { type: 'json_object' };
    const headers = { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };
    if (provider.name === 'openrouter') { headers['HTTP-Referer'] = window.location.origin || 'http://localhost'; headers['X-Title'] = 'Pathik Dhaka Transit'; }
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 45000);
    try {
      const res = await fetch(`${base}/chat/completions`, { method: 'POST', headers, body: JSON.stringify(body), signal: ctrl.signal });
      if (!res.ok) { const t = await res.text(); throw new Error(`HTTP ${res.status}: ${shortenJsonError(t)}`); }
      const data = await res.json();
      const finishReason = data?.choices?.[0]?.finish_reason || 'unknown';
      const raw = (data?.choices?.[0]?.message?.content || '').trim();
      if (!raw) { console.warn('LLM empty. finish_reason=', finishReason, data); throw new Error(`Empty response (finish_reason=${finishReason})`); }
      return raw;
    } finally { clearTimeout(tid); }
  }

  function shortenJsonError(text) { try { const j = JSON.parse(text); return j?.error?.message || JSON.stringify(j?.error || j).slice(0, 250); } catch (_) { return text.slice(0, 250); } }

  async function getTransitData(query) {
    const cfg = window.PATHIK_CONFIG || {};
    if (cfg.AI_PROXY_URL) return getTransitDataFromProxy(query, cfg.AI_PROXY_URL);
    const provider = getProvider();
    const key = getKey(provider);
    if (!key) throw new Error(`Missing ${provider.name.toUpperCase()} key in config.js.`);
    let model = activeModel;
    if (!model) model = provider.name === 'groq' ? await pickGroqModel(key) : await resolveOpenRouterModel(key, provider.model);
    const prompt = buildPrompt(query);
    let raw;
    try { raw = await tryWithFallback(provider, key, model, prompt, { json: true, maxTokens: 4096, temperature: 0.2 }); }
    catch (err) {
      if (isEmptyResponseError(err)) { raw = await tryWithFallback(provider, key, activeModel || model, prompt + '\n\nReturn ONLY the JSON object, nothing else.', { json: false, maxTokens: 4096, temperature: 0.2 }); }
      else throw err;
    }
    try { return safeParseJson(raw); }
    catch (err) {
      const strict = buildStrictPrompt(query);
      try { raw = await tryWithFallback(provider, key, activeModel || model, strict, { json: true, maxTokens: 4096, temperature: 0.1 }); }
      catch (e2) { if (isEmptyResponseError(e2)) raw = await tryWithFallback(provider, key, activeModel || model, strict + '\n\nReturn ONLY the JSON object.', { json: false, maxTokens: 4096, temperature: 0.1 }); else throw e2; }
      return safeParseJson(raw);
    }
  }

  async function getTransitDataFromProxy(query, proxyUrl) {
    const res = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`AI proxy HTTP ${res.status}: ${shortenJsonError(text)}`);
    }
    const data = await res.json();
    return { ...data, _source: data._source || 'ai_proxy' };
  }

  function buildPrompt(query) {
    return `You are PATHIK, a Dhaka public-transport expert. Output STRICT JSON only \u2014 no prose, no markdown, no comments, no trailing commas.

QUERY: "${query}"

2025 BRTA OFFICIAL FARES (use these):
- Non-AC bus: \u09f32.45/km, min \u09f310
- AC bus: \u09f35/km, min \u09f320
- Rickshaw: \u09f320 base + \u09f325/km
- Leguna: \u09f310\u201325 fixed (zone)
- Metro MRT-6 (Uttara North \u2194 Motijheel): \u09f320\u2013100
- Walking: free

MRT-6 STATIONS: Uttara North, Uttara Center, Uttara South, Pallabi, Mirpur 11, Mirpur 10, Kazipara, Shewrapara, Agargaon, Bijoy Sarani, Farmgate, Karwan Bazar, Shahbag, Dhaka University, Bangladesh Secretariat, Motijheel.

Return EXACTLY 3 alternative public-transport routes using ONLY: bus, ac_bus, metro. NO rickshaw, walking, leguna, CNG, UBER, Pathao car/bike.
Group ALL bus services that use a similar road/path into ONE single route option. Put ALL those bus names together in bus_names.
Each of the 3 routes must represent a DIFFERENT physical path or transport method (e.g. Path A, Path B via Hub X, Metro). DO NOT list multiple buses for the same path as separate alternatives.

Route 1 "Direct Bus" \u2014 main direct bus corridor; group same-corridor buses together
Route 2 "Alternative Bus / Metro" \u2014 different road/corridor, metro direct, or bus+metro
Route 3 "Bus Change Alternative" \u2014 bus+bus transfer or bus+metro transfer if direct corridor has trouble

JSON schema:
{"origin":"","destination":"","routes":[{"id":1,"label":"Direct Bus","total_cost":50,"total_cost_range":"\u09f340\u201360","total_time_minutes":75,"total_time_range":"60\u201390 \u09ae\u09bf\u09a8\u09bf\u099f","steps":[{"mode":"bus","icon":"\ud83d\ude8c","from":"","to":"","bus_names":[],"landmarks":["A","B","C"],"cost":50,"cost_range":"\u09f340\u201360","time_minutes":75,"time_range":"","tip_bn":"\u09b8\u09b0\u09be\u09b8\u09b0\u09bf \u09ac\u09be\u09b8\u09c7 \u09af\u09be\u09a8\u0964"}]}]}

icons: bus=\ud83d\ude8c ac_bus=\ud83d\ude8c metro=\ud83d\ude87. STRICT VALID JSON.`;
  }

  function buildStrictPrompt(query) {
    return `Return ONLY valid JSON for Dhaka transit query: "${query}". Provide 3 alternatives using ONLY bus, ac_bus, metro. No rickshaw, walking, leguna, CNG, Uber, or Pathao. Group same-corridor buses in bus_names. Schema: {"origin":"","destination":"","routes":[{"id":1,"label":"","total_cost":0,"total_cost_range":"","total_time_minutes":0,"total_time_range":"","steps":[{"mode":"","icon":"","from":"","to":"","bus_names":[],"landmarks":[],"cost":0,"cost_range":"","time_minutes":0,"time_range":"","tip_bn":""}]}]}. STRICT VALID JSON.`;
  }

  function isMyLocationInput(value) {
    const v = String(value || '').trim().toLowerCase();
    return v === MY_LOCATION_LABEL.toLowerCase() || v === 'current location' || v.includes('\u0986\u09ae\u09be\u09b0 \u0985\u09ac\u09b8\u09cd\u09a5\u09be\u09a8');
  }

  function getVerifiedCoords(placeName) {
    const key = String(placeName || '').trim().toLowerCase();
    if (!key) return null;
    if (knownCoords[key]) return knownCoords[key];
    const matched = Object.keys(knownCoords).find(k => key.includes(k) || k.includes(key));
    return matched ? knownCoords[matched] : null;
  }

  function isSamePlace(a, b) {
    if (!a || !b) return false;
    const al = String(a).trim().toLowerCase();
    const bl = String(b).trim().toLowerCase();
    if (al === bl) return true;
    return stopMatchesPlace(a, b) || stopMatchesPlace(b, a);
  }

  function findStopsOnRoutesToDestination(destRaw) {
    if (!CORRIDOR_DATA || !Array.isArray(CORRIDOR_DATA.corridors)) return [];
    const d = normalizePlace(destRaw);
    const stops = new Set();
    const scan = (leg) => {
      if (!leg || !Array.isArray(leg.stops) || leg.stops.length < 2) return;
      if (!leg.stops.some(s => stopMatchesPlace(s, d))) return;
      leg.stops.forEach(s => {
        const name = String(s || '').trim().toLowerCase();
        if (name) stops.add(name);
      });
    };
    CORRIDOR_DATA.corridors.forEach(c => {
      if (c.direct) scan(c.direct);
      if (c.interchange) {
        if (c.interchange.leg1) scan(c.interchange.leg1);
        if (c.interchange.leg2) scan(c.interchange.leg2);
      }
    });
    return [...stops];
  }

  function findNearestTransitPoint(userCoords, destRaw = null, excludeName = '') {
    return findNearestRouteAwareTransitPoint(userCoords, {
      destRaw,
      excludeName,
      minDistanceKm: 0
    });
  }

  function isPlaceInCorridorDb(placeName) {
    const p = normalizePlace(placeName);
    if (!p || !CORRIDOR_DATA) return false;
    if (STOP_INDEX && STOP_INDEX[p] && STOP_INDEX[p].length > 0) return true;
    const hasStop = (leg) => leg?.stops?.some(s => stopMatchesPlace(s, p));
    for (const c of CORRIDOR_DATA.corridors || []) {
      if (c.from === p || c.to === p) return true;
      if (hasStop(c.direct)) return true;
      if (c.interchange) {
        if (hasStop(c.interchange.leg1)) return true;
        if (hasStop(c.interchange.leg2)) return true;
      }
    }
    return false;
  }

  function getRouteAwareTransitCandidates(destRaw = null) {
    const candidates = new Set();
    const destNorm = destRaw ? normalizePlace(destRaw) : null;

    if (destNorm) {
      findStopsOnRoutesToDestination(destNorm).forEach((name) => {
        if (isSamePlace(name, destNorm)) return;
        if (getVerifiedCoords(name)) candidates.add(name);
      });
    }

    if (candidates.size === 0 && CORRIDOR_DATA && Array.isArray(CORRIDOR_DATA.corridors)) {
      CORRIDOR_DATA.corridors.forEach((c) => {
        const addStop = (s) => {
          const name = String(s || '').trim().toLowerCase();
          if (!name || (destNorm && isSamePlace(name, destNorm))) return;
          if (getVerifiedCoords(name)) candidates.add(name);
        };
        if (c.from) addStop(c.from);
        if (c.to) addStop(c.to);
        if (c.direct && Array.isArray(c.direct.stops)) c.direct.stops.forEach(addStop);
        if (c.interchange) {
          if (c.interchange.leg1 && Array.isArray(c.interchange.leg1.stops)) c.interchange.leg1.stops.forEach(addStop);
          if (c.interchange.leg2 && Array.isArray(c.interchange.leg2.stops)) c.interchange.leg2.stops.forEach(addStop);
        }
      });
    }

    Object.keys(knownCoords).forEach((name) => {
      if (destNorm && isSamePlace(name, destNorm)) return;
      candidates.add(name);
    });
    METRO_STATIONS.forEach((name) => {
      if (destNorm && isSamePlace(name, destNorm)) return;
      if (getVerifiedCoords(name)) candidates.add(name);
    });
    return [...candidates];
  }

  function findNearestRouteAwareTransitPoint(coords, options = {}) {
    if (!coords) return null;
    const { destRaw = null, excludeName = '', minDistanceKm = 0 } = options;
    let nearest = null, minDist = Infinity;

    // First try: find transit points that are on routes to the destination
    if (destRaw) {
      const destCandidates = getRouteAwareTransitCandidates(destRaw);
      destCandidates.forEach((name) => {
        if (excludeName && isSamePlace(name, excludeName)) return;
        const pCoords = getVerifiedCoords(name);
        if (!pCoords) return;
        const dist = haversineKm(coords, pCoords);
        if (dist === null || dist < minDistanceKm) return;
        if (dist < minDist) {
          minDist = dist;
          nearest = { name, coords: pCoords, distKm: Number(dist.toFixed(2)) };
        }
      });
    }

    // If no destination-aware candidate found within reasonable distance, 
    // fall back to ALL transit points (not just destination-route ones)
    if (!nearest || minDist > 5) {
      const allCandidates = getRouteAwareTransitCandidates(null);
      allCandidates.forEach((name) => {
        if (excludeName && isSamePlace(name, excludeName)) return;
        if (nearest && isSamePlace(name, nearest.name)) return; // already checked
        const pCoords = getVerifiedCoords(name);
        if (!pCoords) return;
        const dist = haversineKm(coords, pCoords);
        if (dist === null || dist < minDistanceKm) return;
        if (dist < minDist) {
          minDist = dist;
          nearest = { name, coords: pCoords, distKm: Number(dist.toFixed(2)) };
        }
      });
    }

    return nearest;
  }

  function pickLastMileMode(distKm) {
    if (!Number.isFinite(distKm) || distKm <= 0.8) return 'walking';
    if (distKm <= 4) return 'rickshaw';
    return 'rickshaw';
  }

  function buildLastMileStep(fromLabel, nearest, mode) {
    const calc = computeFareForLeg(mode, nearest.distKm);
    const time = estimateTimeMinutes(mode, nearest.distKm);
    const toName = titleCase(nearest.name);
    const vehicleBn = mode === 'walking' ? '\u09b9\u09be\u0981\u099f\u09be' : (mode === 'leguna' ? '\u09b2\u09c7\u0997\u09c1\u09a8\u09be' : '\u09b0\u09bf\u0995\u09b6\u09be');
    return {
      mode, icon: inferIcon(mode),
      from: fromLabel, to: toName,
      bus_names: [], landmarks: [],
      cost: calc.fare, cost_range: calc.fare_range,
      time_minutes: time,
      time_range: `${Math.max(3, time - 3)}\u2013${time + 5} \u09ae\u09bf\u09a8\u09bf\u099f`,
      tip_bn: mode === 'walking'
        ? `\u0986\u09aa\u09a8\u09be\u09b0 \u0985\u09ac\u09b8\u09cd\u09a5\u09be\u09a8 \u09a5\u09c7\u0995\u09c7 ${toName} \u09aa\u09b0\u09cd\u09af\u09a8\u09cd\u09a4 ${nearest.distKm} km \u09b9\u09be\u0981\u099f\u09c1\u09a8 \u2014 \u098f\u099f\u09be\u0987 \u09a8\u09bf\u0995\u099f\u09ac\u09b0\u09cd\u09a4\u09c0 \u09ac\u09be\u09b8/\u09b0\u09c1\u099f \u09aa\u09df\u09c7\u09a8\u09cd\u099f\u0964`
        : `${toName} (${nearest.distKm} km) \u098f \u09af\u09c7\u09a4\u09c7 ${vehicleBn} \u09a8\u09bf\u09a8 \u2014 \u09b8\u09c7\u0996\u09be\u09a8 \u09a5\u09c7\u0995\u09c7 \u09a8\u09bf\u099a\u09c7\u09b0 \u09aa\u09be\u09ac\u09b2\u09bf\u0995 \u099f\u09cd\u09b0\u09be\u09a8\u09cd\u09b8\u09aa\u09cb\u09b0\u09cd\u099f \u09a7\u09b0\u09c1\u09a8\u0964`,
      fare_source: 'distance_calc',
      distance_km: nearest.distKm,
      is_last_mile: true
    };
  }

  function buildLocationAccessNote(nearest, mode, destRaw = '') {
    const point = titleCase(nearest.name);
    const vehicleBn = mode === 'walking' ? '\u09b9\u09be\u0981\u099f\u09be' : '\u09b0\u09bf\u0995\u09b6\u09be';
    const destPart = destRaw ? `, \u09b8\u09c7\u0996\u09be\u09a8 \u09a5\u09c7\u0995\u09c7 <b>${titleCase(destRaw)}</b> \u09af\u09be\u09a8` : '';
    return `\u0986\u09aa\u09a8\u09be\u09b0 \u09ac\u09b0\u09cd\u09a4\u09ae\u09be\u09a8 \u0985\u09ac\u09b8\u09cd\u09a5\u09be\u09a8 \u09a5\u09c7\u0995\u09c7 \u09b8\u09b0\u09be\u09b8\u09b0\u09bf \u09ac\u09be\u09b8/\u09ae\u09c7\u099f\u09cd\u09b0\u09cb \u09a8\u09c7\u0987\u0964 \u09aa\u09cd\u09b0\u09a5\u09ae\u09c7 <b>${point}</b> (${nearest.distKm} km) \u098f ${vehicleBn} \u0995\u09b0\u09c7 \u09af\u09be\u09a8${destPart} \u2014 \u09a4\u09be\u09b0\u09aa\u09b0 \u09a8\u09bf\u099a\u09c7\u09b0 \u09aa\u09be\u09ac\u09b2\u09bf\u0995 \u099f\u09cd\u09b0\u09be\u09a8\u09cd\u09b8\u09aa\u09cb\u09b0\u09cd\u099f \u09b0\u09c1\u099f \u0985\u09a8\u09c1\u09b8\u09b0\u09a3 \u0995\u09b0\u09c1\u09a8\u0964`;
  }

  function buildPlaceAccessNote(originalName, nearest, mode, destRaw = '', isDestination = false) {
    const point = titleCase(nearest.name);
    const vehicleBn = mode === 'walking' ? '\u09b9\u09c7\u0981\u099f\u09c7' : '\u09b0\u09bf\u0995\u09b6\u09be\u09af\u09bc';
    if (isDestination) {
      return `<b>${escapeHtml(titleCase(originalName))}</b> local DB-\u09a4\u09c7 \u09a8\u09c7\u0987 \u2014 map \u09a6\u09bf\u09df\u09c7 \u0996\u09c1\u0981\u099c\u09c7 \u09aa\u09be\u0993\u09df\u09be \u0997\u09c7\u099b\u09c7\u0964 \u09b6\u09c7\u09b7\u09c7 <b>${point}</b> (${nearest.distKm} km) \u09a5\u09c7\u0995\u09c7 ${vehicleBn} <b>${escapeHtml(titleCase(originalName))}</b> \u09af\u09be\u09a8\u0964`;
    }
    const destPart = destRaw ? ` \u09a4\u09be\u09b0\u09aa\u09b0 <b>${titleCase(destRaw)}</b> \u09af\u09be\u0993\u09df\u09be\u09b0 \u09aa\u09be\u09ac\u09b2\u09bf\u0995 \u099f\u09cd\u09b0\u09be\u09a8\u09cd\u09b8\u09aa\u09cb\u09b0\u09cd\u099f \u09a7\u09b0\u09c1\u09a8\u0964` : ' \u09a4\u09be\u09b0\u09aa\u09b0 \u09aa\u09be\u09ac\u09b2\u09bf\u0995 \u099f\u09cd\u09b0\u09be\u09a8\u09cd\u09b8\u09aa\u09cb\u09b0\u09cd\u099f \u09a7\u09b0\u09c1\u09a8\u0964';
    return `<b>${escapeHtml(titleCase(originalName))}</b> local DB-\u09a4\u09c7 \u09a8\u09c7\u0987 \u2014 OpenStreetMap \u09a6\u09bf\u09df\u09c7 \u0985\u09ac\u09b8\u09cd\u09a5\u09be\u09a8 \u09ac\u09c7\u09b0 \u0995\u09b0\u09be \u09b9\u09df\u09c7\u099b\u09c7\u0964 \u09aa\u09cd\u09b0\u09a5\u09ae\u09c7 <b>${point}</b> (${nearest.distKm} km) \u09aa\u09b0\u09cd\u09af\u09a8\u09cd\u09a4 ${vehicleBn} \u09af\u09be\u09a8,${destPart}`;
  }

  function buildEndpointAccess(originalName, nearest, mode, otherEndValue, role) {
    const displayName = isMyLocationInput(originalName) ? MY_LOCATION_LABEL : titleCase(originalName);
    if (nearest.distKm <= 0.2) {
      return {
        role,
        originalName,
        displayName,
        nearest,
        step: null,
        note_bn: role === 'from'
          ? (isMyLocationInput(originalName)
            ? `\u0986\u09aa\u09a8\u09bf ${titleCase(nearest.name)} \u098f\u09b0 \u0996\u09c1\u09ac \u0995\u09be\u099b\u09c7 (${nearest.distKm} km) \u2014 \u09b8\u09b0\u09be\u09b8\u09b0\u09bf \u09a8\u09bf\u099a\u09c7\u09b0 \u09b0\u09c1\u099f \u09a7\u09b0\u09c1\u09a8\u0964`
            : `${displayName} \u09a5\u09c7\u0995\u09c7 ${titleCase(nearest.name)} (${nearest.distKm} km) \u2014 \u09b8\u09b0\u09be\u09b8\u09b0\u09bf \u09a8\u09bf\u099a\u09c7\u09b0 \u09b0\u09c1\u099f \u09a7\u09b0\u09c1\u09a8\u0964`)
          : `${displayName} \u098f\u09b0 \u0995\u09be\u099b\u09c7 ${titleCase(nearest.name)} (${nearest.distKm} km) \u2014 \u09b8\u09c7\u0996\u09be\u09a8 \u09a5\u09c7\u0995\u09c7 \u09b6\u09c7\u09b7 \u09ae\u09be\u0987\u09b2\u09c7 \u09af\u09be\u09a8\u0964`
      };
    }
    const step = role === 'to'
      ? buildDestinationLastMileStep(nearest, displayName, mode)
      : buildLastMileStep(displayName, nearest, mode);
    const note_bn = role === 'from'
      ? (isMyLocationInput(originalName)
        ? buildLocationAccessNote(nearest, mode, otherEndValue)
        : buildPlaceAccessNote(originalName, nearest, mode, otherEndValue))
      : buildPlaceAccessNote(originalName, nearest, mode, '', true);
    return { role, originalName, displayName, nearest, step, note_bn, mode };
  }

  function buildDestinationLastMileStep(nearest, destLabel, mode) {
    const calc = computeFareForLeg(mode, nearest.distKm);
    const time = estimateTimeMinutes(mode, nearest.distKm);
    const fromName = titleCase(nearest.name);
    const vehicleBn = mode === 'walking' ? '\u09b9\u09be\u0981\u099f\u09be' : '\u09b0\u09bf\u0995\u09b6\u09be';
    return {
      mode, icon: inferIcon(mode),
      from: fromName, to: destLabel,
      bus_names: [], landmarks: [],
      cost: calc.fare, cost_range: calc.fare_range,
      time_minutes: time,
      time_range: `${Math.max(3, time - 3)}\u2013${time + 5} \u09ae\u09bf\u09a8\u09bf\u099f`,
      tip_bn: `${fromName} \u09a5\u09c7\u0995\u09c7 ${destLabel} (${nearest.distKm} km) \u2014 ${vehicleBn} \u09a8\u09bf\u09a8\u0964`,
      fare_source: 'distance_calc',
      distance_km: nearest.distKm,
      is_last_mile: true,
      is_dest_last_mile: true
    };
  }

  function rememberGeocodedPlace(placeName, coords) {
    const key = String(placeName || '').trim().toLowerCase();
    if (key && coords) geocodedPlaceCoords[key] = coords;
  }

  async function resolveEndpointAccess(placeValue, otherEndValue = '', options = {}) {
    const role = options.role || 'from';
    const originalName = String(placeValue || '').trim();
    if (!originalName) return { error: '\u0996\u09be\u09b2\u09bf \u099c\u09be\u09af\u09bc\u0997\u09be\u09b0 \u09a8\u09be\u09ae \u09a6\u09c7\u0993\u09df\u09be \u09af\u09be\u09df \u09a8\u09bf\u0982\u0964' };

    if (isMyLocationInput(originalName)) {
      if (!currentLocation) {
        return { error: '\u0986\u0997\u09c7 "\u200d\u09f3 Use my location" \u09ac\u09be\u099f\u09a8\u09c7 \u0995\u09cd\u09b2\u09bf\u0995 \u0995\u09b0\u09c7 \u0986\u09aa\u09a8\u09be\u09b0 \u0985\u09ac\u09b8\u09cd\u09a5\u09be\u09a8 \u09b8\u09c7\u099f \u0995\u09b0\u09c1\u09a8\u0964' };
      }
      const destHint = role === 'from' ? otherEndValue : '';
      const nearest = findNearestRouteAwareTransitPoint(currentLocation, {
        destRaw: destHint,
        excludeName: otherEndValue
      });
      if (!nearest) {
        return { error: destHint
          ? `"${otherEndValue}" \u09af\u09be\u0993\u09df\u09be\u09b0 \u09b0\u09c1\u099f\u09c7 \u0986\u09b6\u09c7\u09aa\u09be\u09b6\u09c7 \u0995\u09cb\u09a8\u09cb \u09ac\u09be\u09b8 \u09b8\u09cd\u099f\u09aa \u0996\u09c1\u0981\u099c\u09c7 \u09aa\u09be\u0993\u09df\u09be \u09af\u09be\u09df\u09a8\u09bf\u0964`
          : '\u0986\u09b6\u09c7\u09aa\u09be\u09b6\u09c7 \u0995\u09cb\u09a8\u09cb \u09ac\u09be\u09b8/\u09b0\u09c1\u099f \u09aa\u09df\u09c7\u09a8\u09cd\u099f \u0996\u09c1\u0981\u099c\u09c7 \u09aa\u09be\u0993\u09df\u09be \u09af\u09be\u09df\u09a8\u09bf\u0964' };
      }
      if (otherEndValue && isSamePlace(nearest.name, otherEndValue)) {
        return { error: `\u0986\u09aa\u09a8\u09bf \u0987\u09a4\u09bf\u09ae\u09a7\u09cd\u09af\u09c7 ${titleCase(otherEndValue)} \u098f\u09b0 \u0996\u09c1\u09ac \u0995\u09be\u099b\u09c7 (${nearest.distKm} km)\u0964` };
      }
      const mode = pickLastMileMode(nearest.distKm);
      return {
        searchName: nearest.name,
        displayName: MY_LOCATION_LABEL,
        coords: currentLocation,
        source: 'gps',
        access: buildEndpointAccess(originalName, nearest, mode, otherEndValue, role),
        skipCache: true
      };
    }

    if (isPlaceInCorridorDb(originalName)) {
      const p = normalizePlace(originalName);
      return {
        searchName: p,
        displayName: titleCase(originalName),
        coords: getVerifiedCoords(originalName) || getVerifiedCoords(p),
        source: 'local_db',
        access: null,
        skipCache: false
      };
    }

    let geoCoords = null;
    let geoMeta = null;
    const geo = await geocodeNominatim(originalName);
    if (geo) {
      geoCoords = [geo.lat, geo.lon];
      geoMeta = geo;
      rememberGeocodedPlace(originalName, geoCoords);
    } else {
      const fallback = getVerifiedCoords(originalName) || getVerifiedCoords(normalizePlace(originalName));
      if (fallback) {
        geoCoords = fallback;
        rememberGeocodedPlace(originalName, fallback);
      } else {
        return { error: `"${originalName}" map-\u098f \u0996\u09c1\u0981\u099c\u09c7 \u09aa\u09be\u0993\u09df\u09be \u09af\u09be\u09df\u09a8\u09bf\u0964 \u0995\u09be\u099b\u09c7\u09b0 \u09aa\u09b0\u09bf\u099a\u09bf\u09a4 \u098f\u09b2\u09be\u0995\u09be \u09ac\u09be \u09b2\u09cd\u09af\u09be\u09a8\u09cd\u09a1\u09ae\u09be\u09b0\u09cd\u0995 \u09b2\u09bf\u0996\u09c1\u09a8\u0964` };
      }
    }

    const nearest = findNearestRouteAwareTransitPoint(geoCoords, {
      destRaw: role === 'from' ? otherEndValue : null,
      excludeName: originalName,
      minDistanceKm: 0.15
    });
    if (!nearest) {
      return { error: `"${originalName}" \u098f\u09b0 \u0995\u09be\u099b\u09c7 \u0995\u09cb\u09a8\u09cb \u09ac\u09be\u09b8/\u09b0\u09c1\u099f \u09aa\u09df\u09c7\u09a8\u09cd\u099f \u0996\u09c1\u0981\u099c\u09c7 \u09aa\u09be\u0993\u09df\u09be \u09af\u09be\u09df\u09a8\u09bf\u0964` };
    }
    if (otherEndValue && isSamePlace(nearest.name, otherEndValue)) {
      return { error: `"${originalName}" \u098f\u09ac\u0982 "${otherEndValue}" \u098f\u0995\u0987 \u098f\u09b2\u09be\u0995\u09be\u09df (${nearest.distKm} km)\u0964` };
    }

    const mode = pickLastMileMode(nearest.distKm);
    const access = buildEndpointAccess(originalName, nearest, mode, otherEndValue, role);
    if (geoMeta) access.geoDisplayName = geoMeta.displayName;
    access.geoCoords = geoCoords;

    return {
      searchName: nearest.name,
      displayName: titleCase(originalName),
      coords: geoCoords,
      source: 'geocode',
      access,
      skipCache: true
    };
  }

  function applyFromLastMile(data, access, displayOrigin) {
    if (!data || !access || !access.step) return data;
    const step = access.step;
    const routes = (data.routes || []).map((route) => {
      const steps = [step, ...(route.steps || [])];
      const totalCost = (Number(route.total_cost) || 0) + step.cost;
      const totalTime = (Number(route.total_time_minutes) || 0) + step.time_minutes;
      const lo = Math.max(10, totalCost - 10), hi = totalCost + 15;
      return {
        ...route,
        steps,
        total_cost: totalCost,
        total_cost_range: route.total_cost_range ? `${step.cost_range} + ${route.total_cost_range}` : `\u09f3${lo}\u2013${hi}`,
        total_time_minutes: totalTime,
        total_time_range: route.total_time_range
          ? `${Math.max(5, totalTime - 8)}\u2013${totalTime + 15} \u09ae\u09bf\u09a8\u09bf\u099f`
          : `${totalTime} \u09ae\u09bf\u09a8\u09bf\u099f`
      };
    });
    return {
      ...data,
      origin: displayOrigin || access.displayName || data.origin,
      routes,
      locationAccess: {
        nearest: access.nearest,
        mode: access.mode || step.mode,
        note_bn: access.note_bn,
        source: access.geoDisplayName ? 'geocode' : 'gps'
      }
    };
  }

  function applyDestinationLastMile(data, access, displayDestination) {
    if (!data || !access || !access.step) return data;
    const step = access.step;
    const routes = (data.routes || []).map((route) => {
      const steps = [...(route.steps || []), step];
      const totalCost = (Number(route.total_cost) || 0) + step.cost;
      const totalTime = (Number(route.total_time_minutes) || 0) + step.time_minutes;
      const lo = Math.max(10, totalCost - 10), hi = totalCost + 15;
      return {
        ...route,
        steps,
        total_cost: totalCost,
        total_cost_range: route.total_cost_range ? `${route.total_cost_range} + ${step.cost_range}` : `\u09f3${lo}\u2013${hi}`,
        total_time_minutes: totalTime,
        total_time_range: route.total_time_range
          ? `${Math.max(5, totalTime - 8)}\u2013${totalTime + 15} \u09ae\u09bf\u09a8\u09bf\u099f`
          : `${totalTime} \u09ae\u09bf\u09a8\u09bf\u099f`
      };
    });
    return {
      ...data,
      destination: displayDestination || access.displayName || data.destination,
      routes,
      locationAccessDest: {
        nearest: access.nearest,
        mode: access.mode || step.mode,
        note_bn: access.note_bn,
        source: 'geocode'
      }
    };
  }

  function tryLocalSearch(origin, destination) {
    const localMatch = lookupCorridor(origin, destination);
    if (localMatch) {
      const data = buildRoutesFromCorridor(localMatch, origin, destination);
      // Also add crowd-sourced routes for this route
      const crowd = findMatchingCrowdRoutes(origin, destination);
      crowd.forEach((cr, i) => {
        const step = {
          mode: 'bus', icon: '\ud83d\ude8c',
          from: titleCase(cr.fromDisplay || cr.from),
          to: titleCase(cr.toDisplay || cr.to),
          bus_names: cr.busName ? [cr.busName] : ['Community Bus'],
          landmarks: cr.stops || [],
          cost: cr.fare || 30,
          cost_range: cr.fare ? `\u09f3${cr.fare}` : '\u09f330',
          time_minutes: 60,
          time_range: '45\u201375 \u09ae\u09bf\u09a8\u09bf\u099f',
          tip_bn: '\u0995\u09ae\u09bf\u0989\u09a8\u09bf\u099f\u09bf \u09b0\u09c1\u099f \u2014 \u09af\u09be\u09a4\u09cd\u09b0\u09be\u09b0\u09be \u09af\u09cb\u0997 \u0995\u09b0\u09c7\u099b\u09c7\u0964',
          fare_source: 'community',
          _crowdRoute: cr
        };
        const totalCost = step.cost;
        const totalTime = step.time_minutes;
        data.routes.push({
          id: data.routes.length + 1,
          label: `\ud83d\udc65 Community: ${titleCase(cr.fromDisplay || cr.from)} \u2192 ${titleCase(cr.toDisplay || cr.to)}`,
          total_cost: totalCost,
          total_cost_range: `\u09f3${Math.max(10, totalCost - 5)}\u2013${totalCost + 10}`,
          total_time_minutes: totalTime,
          total_time_range: `45\u201390 \u09ae\u09bf\u09a8\u09bf\u099f`,
          steps: [step],
          _crowdRoute: cr
        });
      });
      return { data, status: '\u2705 Local DB exact match \u2022 BRTA 2025 rates.' };
    }
    const stopMatch = findRouteFromStops(origin, destination);
    if (stopMatch && stopMatch.matches.length > 0) {
      const data = buildRoutesFromStopMatch(stopMatch, origin, destination);
      // Also add crowd-sourced routes for this route
      const crowd = findMatchingCrowdRoutes(origin, destination);
      crowd.forEach((cr, i) => {
        const step = {
          mode: 'bus', icon: '\ud83d\ude8c',
          from: titleCase(cr.fromDisplay || cr.from),
          to: titleCase(cr.toDisplay || cr.to),
          bus_names: cr.busName ? [cr.busName] : ['Community Bus'],
          landmarks: cr.stops || [],
          cost: cr.fare || 30,
          cost_range: cr.fare ? `\u09f3${cr.fare}` : '\u09f330',
          time_minutes: 60,
          time_range: '45\u201375 \u09ae\u09bf\u09a8\u09bf\u099f',
          tip_bn: '\u0995\u09ae\u09bf\u0989\u09a8\u09bf\u099f\u09bf \u09b0\u09c1\u099f \u2014 \u09af\u09be\u09a4\u09cd\u09b0\u09be\u09b0\u09be \u09af\u09cb\u0997 \u0995\u09b0\u09c7\u099b\u09c7\u0964',
          fare_source: 'community',
          _crowdRoute: cr
        };
        const totalCost = step.cost;
        const totalTime = step.time_minutes;
        data.routes.push({
          id: data.routes.length + 1,
          label: `\ud83d\udc65 Community: ${titleCase(cr.fromDisplay || cr.from)} \u2192 ${titleCase(cr.toDisplay || cr.to)}`,
          total_cost: totalCost,
          total_cost_range: `\u09f3${Math.max(10, totalCost - 5)}\u2013${totalCost + 10}`,
          total_time_minutes: totalTime,
          total_time_range: `45\u201390 \u09ae\u09bf\u09a8\u09bf\u099f`,
          steps: [step],
          _crowdRoute: cr
        });
      });
      const allNames = [...new Set(stopMatch.matches.flatMap(m => m.names))].slice(0, 5);
      return {
        data,
        status: `\u2705 Found via stop search \u2022 ${stopMatch.matches.length} route(s)${allNames.length ? ' \u2022 Buses: ' + allNames.join(', ') : ''}`
      };
    }
    const transferMatches = findBestTransferRoutes(origin, destination, new Set(), 8) || [];
    const metroTransferRoutes = buildMetroTransferRoutes(origin, destination, 3);
    if (transferMatches.length > 0 || metroTransferRoutes.length > 0) {
      const data = buildRoutesFromTransfers(transferMatches, origin, destination);
      data.routes.push(...metroTransferRoutes);
      data.routes.forEach((r, i) => { r.id = i + 1; });
      const hubs = [...new Set(transferMatches.map(t => titleCase(t.hub)))].slice(0, 3);
      return {
        data,
        status: `\u2705 Found local transfer route${hubs.length ? ' \u2022 Change at: ' + hubs.join(', ') : ''}`
      };
    }
    // Last resort: check if any crowd routes exist for this search
    const crowd = findMatchingCrowdRoutes(origin, destination);
    if (crowd.length > 0) {
      const origin = titleCase(crowd[0].fromDisplay || crowd[0].from);
      const destination = titleCase(crowd[0].toDisplay || crowd[0].to);
      const routes = crowd.map((cr, i) => {
        const step = {
          mode: 'bus', icon: '\ud83d\ude8c',
          from: titleCase(cr.fromDisplay || cr.from),
          to: titleCase(cr.toDisplay || cr.to),
          bus_names: cr.busName ? [cr.busName] : ['Community Bus'],
          landmarks: cr.stops || [],
          cost: cr.fare || 30,
          cost_range: cr.fare ? `\u09f3${cr.fare}` : '\u09f330',
          time_minutes: 60,
          time_range: '45\u201375 \u09ae\u09bf\u09a8\u09bf\u099f',
          tip_bn: '\u0995\u09ae\u09bf\u0989\u09a8\u09bf\u099f\u09bf \u09b0\u09c1\u099f \u2014 \u09af\u09be\u09a4\u09cd\u09b0\u09be\u09b0\u09be \u09af\u09cb\u0997 \u0995\u09b0\u09c7\u099b\u09c7\u0964',
          fare_source: 'community',
          _crowdRoute: cr
        };
        return {
          id: i + 1,
          label: `\ud83d\udc65 Community: ${titleCase(cr.fromDisplay || cr.from)} \u2192 ${titleCase(cr.toDisplay || cr.to)}`,
          total_cost: step.cost,
          total_cost_range: `\u09f3${Math.max(10, step.cost - 5)}\u2013${step.cost + 10}`,
          total_time_minutes: step.time_minutes,
          total_time_range: `45\u201390 \u09ae\u09bf\u09a8\u09bf\u099f`,
          steps: [step],
          _crowdRoute: cr
        };
      });
      const data = { origin, destination, routes, _source: 'community' };
      return { data, status: `\ud83d\udc65 ${crowd.length} community route(s) found for this route` };
    }
    return null;
  }

  /**
   * Show nearby transit points when a geocoded From place is entered (not in local DB)
   */
  async function showNearbyFromPoints(fromCtx) {
    if (!fromCtx || !fromCtx.coords || fromCtx.source === 'local_db') {
      // If it's in local DB, no need to show nearby points
      return;
    }

    pendingGeocodeFrom = fromCtx;
    const toValue = dom.toInput ? dom.toInput.value.trim() : '';

    setStatus(`<span class="spinner"></span>\u09a8\u09bf\u0995\u099f\u09ac\u09b0\u09cd\u09a4\u09c0 Transit Points \u0996\u09c1\u0981\u099c\u099b\u09bf...`);

    const nearbyPoints = await findAllNearbyPoints(fromCtx.coords, 15);

    // Update nearby card heading and intro
    if (dom.nearbyIntro) {
      dom.nearbyIntro.innerHTML = `\u0986\u09aa\u09a8\u09be\u09b0 "${escapeHtml(fromCtx.displayName)}" \u098f\u09b0 \u09a8\u09bf\u0995\u099f\u09ac\u09b0\u09cd\u09a4\u09c0 \u09aa\u09be\u09ac\u09b2\u09bf\u0995 \u099f\u09cd\u09b0\u09be\u09a8\u09cd\u09b8\u09aa\u09cb\u09b0\u09cd\u099f \u09aa\u09df\u09c7\u09a8\u09cd\u099f\u0997\u09c1\u09b2\u09cb \u09a8\u09bf\u099a\u09c7 \u09a6\u09c7\u0993\u09df\u09be \u09b9\u09b2\u09cb\u0964 \u098f\u0995\u099f\u09bf \u09aa\u09df\u09c7\u09a8\u09cd\u099f \u09b8\u09bf\u09b2\u09c7\u0995\u09cd\u099f \u0995\u09b0\u09b2\u09c7 \u09b8\u09c7\u099f\u09bf "From" \u09b9\u09bf\u09b8\u09c7\u09ac\u09c7 \u09b8\u09c7\u099f \u09b9\u09ac\u09c7 \u0993 \u09b8\u09c7\u0996\u09be\u09a8 \u09a5\u09c7\u0995\u09c7 \u09b0\u09c1\u099f \u09a6\u09c7\u0996\u09be\u09ac\u09c7\u0964`;
    }

    renderNearbyPoints(nearbyPoints);

    if (nearbyPoints.length > 0) {
      const nearest = nearbyPoints[0];
      const mode = pickLastMileMode(nearest.distKm);
      const modeBn = mode === 'walking' ? '\u09b9\u09be\u0981\u099f\u09be' : '\u09b0\u09bf\u0995\u09b6\u09be';
      const destNote = toValue ? ` (${titleCase(toValue)} \u09af\u09be\u0993\u09df\u09be\u09b0 \u09b0\u09c1\u099f\u09c7)` : '';
      setStatus(
        `\u09aa\u09cd\u09b0\u09a5\u09ae\u09c7 \u098f\u0995\u099f\u09bf Transit Point \u09a8\u09bf\u09b0\u09cd\u09ac\u09be\u099a\u09a8 \u0995\u09b0\u09c1\u09a8 \u2014 \u09a8\u09bf\u0995\u099f\u09ac\u09b0\u09cd\u09a4\u09c0: <b>${titleCase(nearest.name)}</b> (${nearest.distKm} km) \u2014 ${modeBn}` +
        ` | ${nearbyPoints.length}\u099f\u09bf \u09aa\u09df\u09c7\u09a8\u09cd\u099f \u09aa\u09be\u0993\u09df\u09be \u0997\u09c7\u099b\u09c7`,
        'success'
      );
    } else {
      setStatus(`"${fromCtx.displayName}" \u098f\u09b0 \u0995\u09be\u099b\u09c7 \u0995\u09cb\u09a8\u09cb Transit Point \u0996\u09c1\u0981\u099c\u09c7 \u09aa\u09be\u0993\u09df\u09be \u09af\u09be\u09df\u09a8\u09bf\u0964`, 'error');
    }
  }

  function finalizeSearchResult(data, query, fromCtx = null, toCtx = null) {
    let result = { ...data };
    if (fromCtx?.access) {
      if (fromCtx.access.step) result = applyFromLastMile(result, fromCtx.access, fromCtx.displayName);
      else {
        result.origin = fromCtx.displayName;
        result.locationAccess = { nearest: fromCtx.access.nearest, note_bn: fromCtx.access.note_bn };
      }
    }
    if (toCtx?.access) {
      if (toCtx.access.step) result = applyDestinationLastMile(result, toCtx.access, toCtx.displayName);
      else {
        result.destination = toCtx.displayName;
        result.locationAccessDest = { nearest: toCtx.access.nearest, note_bn: toCtx.access.note_bn };
      }
    }
    if (fromCtx?.coords) result.fromCoords = fromCtx.coords;
    if (toCtx?.coords) result.toCoords = toCtx.coords;
    currentResult = normalizeTransitData(result, query);
    selectedRouteIndex = 0;
    renderAll();
    return currentResult;
  }

  function endpointStatusSuffix(ctx, label) {
    if (!ctx?.access?.nearest) return '';
    const point = titleCase(ctx.access.nearest.name);
    const modeBn = ctx.access.step
      ? (ctx.access.step.mode === 'walking' ? '\u09b9\u09be\u0981\u099f\u09be' : '\u09b0\u09bf\u0995\u09b6\u09be')
      : '\u09b8\u09b0\u09be\u09b8\u09b0\u09bf';
    const mapNote = ctx.source === 'geocode' && ctx.access.geoDisplayName
      ? `\n\ud83d\uddfa\ufe0f Map: ${ctx.access.geoDisplayName}`
      : '';
    return `\n\ud83d\udccd ${label}: ${ctx.displayName} \u2192 ${point} (${ctx.access.nearest.distKm} km, ${modeBn})${mapNote}`;
  }

  async function onSearch() {
    const fromValue = dom.fromInput ? dom.fromInput.value.trim() : '';
    const toValue = dom.toInput ? dom.toInput.value.trim() : '';
    const query = (fromValue || toValue) ? `${fromValue} to ${toValue}` : (dom.queryInput ? dom.queryInput.value.trim() : '');
    if (!fromValue && !toValue && !query) { setStatus('Please enter from and to.', 'error'); return; }
    if ((fromValue || toValue) && (!fromValue || !toValue)) { setStatus('Please fill both from and to.', 'error'); return; }

    setLoading(true);
    setStatus('<span class="spinner"></span>\u099c\u09be\u09af\u09bc\u0997\u09be \u0996\u09c1\u0981\u099c\u099b\u09bf (local DB + map)...');

    const fromCtx = await resolveEndpointAccess(fromValue, toValue, { role: 'from' });
    if (fromCtx.error) { setStatus(fromCtx.error, 'error'); setLoading(false); return; }

    const toCtx = await resolveEndpointAccess(toValue, fromValue, { role: 'to' });
    if (toCtx.error) { setStatus(toCtx.error, 'error'); setLoading(false); return; }

    // If From is not in local DB (geocoded), show nearby transit points for user to select
    if (fromCtx.source !== 'local_db') {
      setLoading(false);
      await showNearbyFromPoints(fromCtx);
      return;
    }

    const searchOrigin = fromCtx.searchName;
    const searchDest = toCtx.searchName;

    console.log('[Pathik] Query:', query, '| Resolved:', searchOrigin, '\u2192', searchDest, '| From:', fromCtx.source, '| To:', toCtx.source);

    const local = tryLocalSearch(searchOrigin, searchDest);
    if (local) {
      const resultData = { ...local.data, origin: fromCtx.displayName, destination: toCtx.displayName };
      finalizeSearchResult(resultData, query, fromCtx, toCtx);
      setStatus(local.status + endpointStatusSuffix(fromCtx, '\u09b6\u09c1\u09b0\u09c1') + endpointStatusSuffix(toCtx, '\u0997\u09a8\u09cd\u09a4\u09ac\u09cd\u09af'), 'success');
      setLoading(false);
      return;
    }

    if (fromCtx.access?.step) {
      // We have a geocoded origin with a nearest transit point.
      // Try to find a route from that transit point to the destination
      const transitOrigin = fromCtx.access.nearest.name;
      const localFromTransit = tryLocalSearch(transitOrigin, searchDest);
      
      if (localFromTransit) {
        // Found a route from the transit point to destination
        const resultData = { 
          ...localFromTransit.data, 
          origin: fromCtx.displayName, 
          destination: toCtx.displayName 
        };
        finalizeSearchResult(resultData, query, fromCtx, toCtx);
        setStatus(
          `\u2705 \u09a8\u09bf\u0995\u099f\u09ac\u09b0\u09cd\u09a4\u09c0 \u09ac\u09be\u09b8 \u09b8\u09cd\u099f\u09aa: ${titleCase(transitOrigin)}` +
          endpointStatusSuffix(fromCtx, '\u09b6\u09c1\u09b0\u09c1') +
          endpointStatusSuffix(toCtx, '\u0997\u09a8\u09cd\u09a4\u09ac\u09cd\u09af'),
          'success'
        );
      } else {
        // No route from transit point either - show just the access step
        const step = fromCtx.access.step;
        const route = {
          id: 1,
          label: `${titleCase(transitOrigin)} \u09aa\u09b0\u09cd\u09af\u09a8\u09cd\u09a4 \u09af\u09be\u09a8`,
          total_cost: step.cost,
          total_cost_range: step.cost_range,
          total_time_minutes: step.time_minutes,
          total_time_range: step.time_range,
          steps: [step]
        };
        const data = {
          origin: fromCtx.displayName,
          destination: toCtx.displayName,
          routes: [route],
          _source: 'geocode_search'
        };
        finalizeSearchResult(data, query, fromCtx, toCtx);
        setStatus(
          `\u2705 \u09a8\u09bf\u0995\u099f\u09ac\u09b0\u09cd\u09a4\u09c0 \u09ac\u09be\u09b8 \u09b8\u09cd\u099f\u09aa: ${titleCase(transitOrigin)}` +
          endpointStatusSuffix(fromCtx, '\u09b6\u09c1\u09b0\u09c1') +
          `\n\u26a0\ufe0f ${transitOrigin} \u2192 ${searchDest} \u098f\u09b0 \u099c\u09a8\u09cd\u09af local DB-\u09a4\u09c7 \u09b8\u09b0\u09be\u09b8\u09b0\u09bf \u09b0\u09c1\u099f \u09a8\u09c7\u0987\u0964` +
          endpointStatusSuffix(toCtx, '\u0997\u09a8\u09cd\u09a4\u09ac\u09cd\u09af'),
          'success'
        );
      }
      setLoading(false);
      return;
    }

    setLoading(false);
    setStatus(
      `\u274c "${fromValue}" \u09a5\u09c7\u0995\u09c7 "${toValue}" \u2014 local DB-\u09a4\u09c7 \u09b0\u09c1\u099f \u09aa\u09be\u0993\u09df\u09be \u09af\u09be\u09df\u09a8\u09bf\u0964` +
      endpointStatusSuffix(fromCtx, '\u09b6\u09c1\u09b0\u09c1') +
      endpointStatusSuffix(toCtx, '\u0997\u09a8\u09cd\u09a4\u09ac\u09cd\u09af') +
      '\n\ud83d\udca1 \u0995\u09be\u099b\u09c7\u09b0 \u09aa\u09b0\u09bf\u099a\u09bf\u09a4 \u09ac\u09be\u09b8 \u09b8\u09cd\u099f\u09aa \u09ac\u09be "\u200d\u09f3 Use my location" \u09ac\u09cd\u09af\u09ac\u09b9\u09be\u09b0 \u0995\u09b0\u09c1\u09a8\u0964',
      'error'
    );
  }

  function getCachedResult(query) {
    try {
      const raw = localStorage.getItem(QUERY_CACHE_KEY);
      if (!raw) return null;
      const map = JSON.parse(raw);
      const k = `${dom.providerSelect.value}::${query.trim().toLowerCase()}`;
      const entry = map[k];
      if (!entry) return null;
      if (Date.now() - entry.ts > QUERY_CACHE_TTL_MS) return null;
      return entry;
    } catch (_) { return null; }
  }

  function saveCachedResult(query, data) {
    try {
      const raw = localStorage.getItem(QUERY_CACHE_KEY);
      const map = raw ? JSON.parse(raw) : {};
      const k = `${dom.providerSelect.value}::${query.trim().toLowerCase()}`;
      map[k] = { ts: Date.now(), data };
      const keys = Object.keys(map);
      if (keys.length > 50) { keys.sort((a, b) => map[a].ts - map[b].ts); for (let i = 0; i < keys.length - 50; i++) delete map[keys[i]]; }
      localStorage.setItem(QUERY_CACHE_KEY, JSON.stringify(map));
    } catch (_) {}
  }

  function safeParseJson(text) {
    let cleaned = String(text).replace(/```json/gi, '').replace(/```/g, '').trim();
    const firstBrace = cleaned.indexOf('{');
    if (firstBrace < 0) throw new Error('No JSON object found in response');
    cleaned = cleaned.slice(firstBrace);
    try { return JSON.parse(cleaned); } catch (_) {}
    const noTrailing = cleaned.replace(/,(\s*[}\]])/g, '$1');
    try { return JSON.parse(noTrailing); } catch (_) {}
    const repaired = repairJson(cleaned);
    if (repaired) { try { return JSON.parse(repaired); } catch (_) {} }
    throw new Error('Unable to parse JSON');
  }

  function repairJson(text) {
    const stack = [];
    let inString = false, escape = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (escape) { escape = false; continue; }
      if (c === '\\') { escape = true; continue; }
      if (c === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (c === '{' || c === '[') stack.push(c);
      else if (c === '}') { if (stack[stack.length - 1] === '{') stack.pop(); }
      else if (c === ']') { if (stack[stack.length - 1] === '[') stack.pop(); }
    }
    let trimmed = text;
    if (inString) { const lastQuote = text.lastIndexOf('"'); if (lastQuote > 0) trimmed = text.slice(0, lastQuote); }
    trimmed = trimmed.replace(/,(\s*)$/, '$1');
    let suffix = '';
    if (inString) suffix += '"';
    while (stack.length) { const o = stack.pop(); suffix += (o === '{' ? '}' : ']'); }
    return trimmed + suffix;
  }

  function normalizeTransitData(payload, originalQuery = '') {
    const parsed = payload || {};
    const source = parsed._source || 'ai_estimate';
    const meta = sourceMeta(source);
    const pd = parseQuerySimple(originalQuery);
    const origin = parsed.origin || pd.origin || 'Unknown';
    const destination = parsed.destination || pd.destination || 'Unknown';
    const labels = ['Direct Bus', 'Alternative Bus / Metro', 'Bus Change Alternative'];
    let routes = Array.isArray(parsed.routes) ? parsed.routes : [];
    routes = routes.map((r, i) => ({
      id: Number.isFinite(Number(r.id)) ? Number(r.id) : i + 1,
      label: r.label || labels[i] || `Route ${i+1}`,
      total_cost: Number(r.total_cost ?? sum((r.steps || []).map(s => Number(s.cost) || 0))) || 0,
      total_cost_range: r.total_cost_range || '',
      total_time_minutes: Number(r.total_time_minutes ?? sum((r.steps || []).map(s => Number(s.time_minutes) || 0))) || 0,
      total_time_range: r.total_time_range || '',
      steps: Array.isArray(r.steps) ? r.steps.map((s) => ({
        mode: String(s.mode || 'bus').toLowerCase(), from: s.from || 'Start', to: s.to || 'End',
        bus_names: Array.isArray(s.bus_names) ? s.bus_names : [], landmarks: Array.isArray(s.landmarks) ? s.landmarks : [],
        cost: Number(s.cost || 0), cost_range: s.cost_range || '', time_minutes: Number(s.time_minutes || 0), time_range: s.time_range || '',
        icon: s.icon || inferIcon(String(s.mode || '').toLowerCase()), tip_bn: s.tip_bn || '', fare_source: s.fare_source || 'unknown', distance_km: s.distance_km || null,
        is_last_mile: !!s.is_last_mile, is_dest_last_mile: !!s.is_dest_last_mile
      })) : []
    })).filter(r => r.steps.length > 0);
    if (routes.length < 1) { const mock = getMockData(`${origin} to ${destination}`); routes = mock.routes; }
    const localSources = new Set(['local_db_distance_calc', 'stop_search', 'transfer_search', 'geocode_search']);
    const maxRoutes = localSources.has(source) ? 8 : 3;
    return {
      origin, destination,
      routes: routes.slice(0, maxRoutes),
      source, confidence: meta.confidence, sourceLabel: meta.label,
      locationAccess: parsed.locationAccess || null,
      locationAccessDest: parsed.locationAccessDest || null,
      fromCoords: parsed.fromCoords || null,
      toCoords: parsed.toCoords || null
    };
  }

  function sourceMeta(source) {
    switch (source) {
      case 'local_db_distance_calc':
        return { label: 'Verified Local DB', confidence: 'High' };
      case 'stop_search':
        return { label: 'Verified Stop Match', confidence: 'High' };
      case 'transfer_search':
        return { label: 'Verified Local Transfer', confidence: 'High' };
      case 'geocode_search':
        return { label: 'Geocoded + Local DB', confidence: 'High' };
      case 'community':
        return { label: '👥 Community Route', confidence: 'Medium' };
      case 'ai_proxy':
        return { label: 'Backend AI Assist', confidence: 'Medium' };
      case 'ai_estimate':
        return { label: 'AI Estimate', confidence: 'Medium' };
      case 'distance_estimate':
      default:
        return { label: 'Distance Estimate', confidence: 'Low' };
    }
  }

  function renderAll() { if (!currentResult) return; renderRouteCards(); renderSelectedRouteDetails(); updateSavingsWidget(); updateMap(); dom.saveRouteBtn.disabled = false; }

  function renderRouteCards() {
    const routes = currentResult.routes || [];
    dom.routesContainer.innerHTML = '';
    routes.forEach((route, i) => {
      const card = document.createElement('article');
      card.className = `route-card ${i === selectedRouteIndex ? 'active' : ''}`;
      const stepsModes = route.steps.map(s => s.icon || inferIcon(s.mode)).join(' \u2192 ');
      const cost = route.total_cost_range || ('\u09f3' + route.total_cost);
      const tm = route.total_time_range || (route.total_time_minutes + ' min');
      const allBusNames = [...new Set(route.steps.flatMap(s => s.bus_names || []).filter(Boolean))];
      const busLine = allBusNames.length ? `<div style="margin-top:6px; font-size:0.9rem; color:#166534; font-weight:600;">\ud83d\ude8c ${escapeHtml(allBusNames.join(', '))}</div>` : '';
      const sourceClass = currentResult.confidence === 'Low' ? ' estimate' : '';
      
      // Check if this is a community route - show creator info and voting
      const crowdRoute = route._crowdRoute;
      let communityHtml = '';
      if (crowdRoute) {
        const verdict = getCrowdRouteVerdict(crowdRoute);
        const verdictLabel = verdict === 'verified' ? '<span class="crowd-verdict-tag verdict-verified">✅ Community Verified</span>' :
                           verdict === 'disputed' ? '<span class="crowd-verdict-tag verdict-disputed">⚠️ Disputed</span>' :
                           '<span class="crowd-verdict-tag verdict-neutral">◐ New (awaiting votes)</span>';
        const userVote = crowdRoute.userVote;
        communityHtml = `
          <div class="community-route-info">
            <div class="community-creator-info">👤 Created by a fellow passenger</div>
            <div class="community-votes-row">
              ${verdictLabel}
              <div class="community-vote-btns">
                <button class="crowd-vote-btn vote-btn agree ${userVote === 'agree' ? 'voted' : ''}" data-crowd-route="${crowdRoute.id}" data-vote="agree">
                  👍 <span class="vote-count">${crowdRoute.votes?.agree || 0}</span>
                </button>
                <button class="crowd-vote-btn vote-btn disagree ${userVote === 'disagree' ? 'voted' : ''}" data-crowd-route="${crowdRoute.id}" data-vote="disagree">
                  👎 <span class="vote-count">${crowdRoute.votes?.disagree || 0}</span>
                </button>
              </div>
            </div>
          </div>`;
      }
      
      card.innerHTML = `<p class="route-title">${escapeHtml(route.label)}</p><div class="source-row"><span class="source-pill${sourceClass}">${escapeHtml(currentResult.sourceLabel)}</span><span class="source-pill${sourceClass}">Confidence: ${escapeHtml(currentResult.confidence)}</span></div><div class="route-meta"><span>\ud83d\udcb0 ${escapeHtml(cost)}</span><span>\u23f1 ${escapeHtml(tm)}</span></div><div class="step-sub" style="margin-top:8px; font-size:1.05rem;">${escapeHtml(stepsModes)}</div>${busLine}${communityHtml}`;
      card.addEventListener('click', () => { selectedRouteIndex = i; renderRouteCards(); renderSelectedRouteDetails(); updateSavingsWidget(); });
      
      // Bind vote buttons for crowd routes
      if (crowdRoute) {
        card.querySelectorAll('.crowd-vote-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            voteOnCrowdRoute(btn.dataset.crowdRoute, btn.dataset.vote);
          });
        });
      }
      
      dom.routesContainer.appendChild(card);
    });
  }

  function renderSelectedRouteDetails() {
    const route = currentResult.routes[selectedRouteIndex];
    if (!route) { dom.routeDetails.className = 'route-details empty'; dom.routeDetails.textContent = 'No route selected.'; return; }
    const wrap = document.createElement('div'); wrap.className = 'route-details';
    const header = document.createElement('div'); header.style.cssText = 'margin-bottom:12px; font-weight:700;';
    const costStr = route.total_cost_range || ('\u09f3' + route.total_cost);
    const tmStr = route.total_time_range || (route.total_time_minutes + ' \u09ae\u09bf\u09a8\u09bf\u099f');
    header.innerHTML = `${escapeHtml(currentResult.origin)} \u2192 ${escapeHtml(currentResult.destination)} | \u09ae\u09cb\u099f \u0996\u09b0\u099a: ${escapeHtml(costStr)} | \u09b8\u09ae\u09af\u09bc: ${escapeHtml(tmStr)}`;
    const sourceClass = currentResult.confidence === 'Low' ? ' estimate' : '';
    const sourceRow = document.createElement('div');
    sourceRow.className = 'source-row';
    sourceRow.innerHTML = `<span class="source-pill${sourceClass}">${escapeHtml(currentResult.sourceLabel)}</span><span class="source-pill${sourceClass}">Confidence: ${escapeHtml(currentResult.confidence)}</span><span class="source-pill">Fare logic: BRTA/DMTCL</span>`;
    wrap.appendChild(sourceRow);
    wrap.appendChild(header);
    if (currentResult.locationAccess && currentResult.locationAccess.note_bn) {
      const accessBox = document.createElement('div');
      accessBox.className = 'location-access-box';
      accessBox.innerHTML = `\ud83d\udccd \u09b6\u09c1\u09b0\u09c1: ${currentResult.locationAccess.note_bn}`;
      wrap.appendChild(accessBox);
    }
    if (currentResult.locationAccessDest && currentResult.locationAccessDest.note_bn) {
      const accessBox = document.createElement('div');
      accessBox.className = 'location-access-box';
      accessBox.style.background = '#eff6ff';
      accessBox.style.borderColor = '#93c5fd';
      accessBox.style.color = '#1e3a8a';
      accessBox.innerHTML = `\ud83c\udfaf \u0997\u09a8\u09cd\u09a4\u09ac\u09cd\u09af: ${currentResult.locationAccessDest.note_bn}`;
      wrap.appendChild(accessBox);
    }
    const list = document.createElement('ul'); list.className = 'steps';
    route.steps.forEach((step, idx) => {
      const li = document.createElement('li'); li.className = 'step';
      const bus = step.bus_names && step.bus_names.length ? `<div class="step-sub" style="margin-top:4px;"><b>\u09ac\u09be\u09b8:</b> ${step.bus_names.map(b => `<span class="bus-chip">${escapeHtml(b)}</span>`).join(' ')}</div>` : '';
      const landmarks = step.landmarks && step.landmarks.length ? `<div class="step-sub" style="margin-top:4px;"><b>Route:</b> ${step.landmarks.map(escapeHtml).join(' \u2192 ')}</div>` : '';
      const cost = step.cost_range || ('\u09f3' + step.cost);
      const tm = step.time_range || (step.time_minutes + ' \u09ae\u09bf\u09a8\u09bf\u099f');
      const tip = step.tip_bn ? `<div class="step-sub" style="margin-top:6px;"><b>Tip:</b> ${escapeHtml(step.tip_bn)}</div>` : '';
      const fareNote = step.fare_source === 'distance_calc' && step.distance_km ? `<div class="step-sub" style="margin-top:4px; font-style:italic; opacity:0.8;">\ud83d\udccf ${step.distance_km} km \u2022 BRTA 2025 rate</div>` : '';
      const metroNote = step.fare_source === 'dmtcl_fare_matrix' ? `<div class="step-sub" style="margin-top:4px; font-style:italic; opacity:0.8;">\ud83d\ude87 DMTCL MRT-6 official fare</div>` : '';
      const lastMileTag = step.is_dest_last_mile
        ? `<span class="last-mile-tag">\u0997\u09a8\u09cd\u09a4\u09ac\u09cd\u09af\u09c7 \u09af\u09be\u0993\u09df\u09be\u09b0 \u09a7\u09be\u09aa</span>`
        : (step.is_last_mile ? `<span class="last-mile-tag">\u09a8\u09bf\u0995\u099f\u09ac\u09b0\u09cd\u09a4\u09c0 \u09aa\u09df\u09c7\u09a8\u09cd\u099f\u09c7 \u09af\u09be\u0993\u09df\u09be\u09b0 \u09a7\u09be\u09aa</span>` : '');
      li.innerHTML = `<div class="step-top">${escapeHtml(step.icon || inferIcon(step.mode))} \u09a7\u09be\u09aa ${idx+1}: ${escapeHtml(step.from)} \u2192 ${escapeHtml(step.to)} ${lastMileTag}</div><div class="step-sub">${escapeHtml(step.mode.toUpperCase())} \u2022 \u09ad\u09be\u09a1\u09bc\u09be: ${escapeHtml(cost)} \u2022 \u09b8\u09ae\u09af\u09bc: ${escapeHtml(tm)}</div>${bus}${landmarks}${fareNote}${metroNote}${tip}`;
      list.appendChild(li);
    });
    wrap.appendChild(list);
    dom.routeDetails.innerHTML = ''; dom.routeDetails.className = 'route-details'; dom.routeDetails.appendChild(wrap);
    if (!document.getElementById('pathik-chip-style')) {
      const st = document.createElement('style'); st.id = 'pathik-chip-style';
      st.textContent = `.bus-chip{display:inline-block;background:#ecfdf3;color:#166534;border:1px solid #bbf7d0;padding:2px 8px;border-radius:999px;font-size:.78rem;margin:2px 4px 2px 0;}.location-access-box{background:#ecfdf5;border:1px solid #86efac;border-radius:10px;padding:12px 14px;margin-bottom:14px;font-size:.92rem;line-height:1.5;color:#14532d;}.last-mile-tag{display:inline-block;background:#fef3c7;color:#92400e;border:1px solid #fcd34d;padding:2px 8px;border-radius:999px;font-size:.72rem;font-weight:700;margin-left:6px;}`;
      document.head.appendChild(st);
    }
    if (dom.feedbackBtn) dom.feedbackBtn.disabled = false;
  }

  function updateSavingsWidget() {
    const route = currentResult.routes[selectedRouteIndex]; if (!route) return;
    const uberCost = 800, pathikCost = Math.max(1, Number(route.total_cost) || 45);
    const pct = Math.max(4, Math.min(100, Math.round((pathikCost / uberCost) * 100)));
    const savePct = Math.max(1, Math.round(((uberCost - pathikCost) / uberCost) * 100));
    dom.pathikLabel.textContent = `Pathik AI (\u09f3${pathikCost})`;
    dom.barPathik.style.width = `${pct}%`;
    dom.saveBadge.textContent = `Save ${savePct}%`;
  }

  async function updateMap() {
    const o = currentResult.fromCoords || resolveCoords(currentResult.origin, currentLocation);
    const d = currentResult.toCoords || resolveCoords(currentResult.destination);
    if (originMarker) map.removeLayer(originMarker);
    if (destinationMarker) map.removeLayer(destinationMarker);
    if (routeLine) map.removeLayer(routeLine);
    originMarker = L.marker(o).addTo(map).bindPopup(`Origin: ${escapeHtml(currentResult.origin)}`);
    destinationMarker = L.marker(d).addTo(map).bindPopup(`Destination: ${escapeHtml(currentResult.destination)}`);
    setMapStatus('Loading road route...');
    try {
      const road = await fetchRoadRoute(o, d);
      routeLine = L.polyline(road.coords, { color: '#2E7D32', weight: 5, opacity: 0.92 }).addTo(map);
      map.fitBounds(routeLine.getBounds().pad(0.18));
      setMapStatus(`Road preview only: ${road.distanceKm} km \u2022 ${road.durationMin} min by road. Not the exact public transit path.`);
    } catch (err) {
      console.warn('[Pathik] Road route failed, using straight line:', err.message);
      routeLine = L.polyline([o, d], { color: '#2E7D32', weight: 4, opacity: 0.9, dashArray: '8 8' }).addTo(map);
      map.fitBounds(L.latLngBounds([o, d]).pad(0.25));
      setMapStatus('Road preview unavailable. Showing approximate line.');
    }
  }

  async function fetchRoadRoute(originCoords, destCoords) {
    const [olat, olng] = originCoords;
    const [dlat, dlng] = destCoords;
    const url = `https://router.project-osrm.org/route/v1/driving/${olng},${olat};${dlng},${dlat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);
    const data = await res.json();
    const route = data.routes && data.routes[0];
    if (!route || !route.geometry || !Array.isArray(route.geometry.coordinates)) throw new Error('No road route found');
    return {
      coords: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
      distanceKm: (route.distance / 1000).toFixed(1),
      durationMin: Math.max(1, Math.round(route.duration / 60))
    };
  }

  // ===================== Nearby Transit Points System =====================

  /** Fetch road distance from OSRM for a single point from user location */
  async function fetchRoadDistanceForPoint(userCoords, pointName) {
    const pCoords = getVerifiedCoords(pointName);
    if (!pCoords) return null;
    const [ulat, ulng] = userCoords;
    const [plat, plng] = pCoords;
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${ulng},${ulat};${plng},${plat}?overview=false`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const route = data.routes && data.routes[0];
      if (!route) throw new Error('No route');
      return { name: pointName, coords: pCoords, distKm: Number((route.distance / 1000).toFixed(2)), durationMin: Math.round(route.duration / 60) };
    } catch (err) {
      // Fallback to straight-line
      const dist = haversineKm(userCoords, pCoords);
      if (dist === null) return null;
      return { name: pointName, coords: pCoords, distKm: Number(dist.toFixed(2)), durationMin: Math.ceil(dist / 10 * 60) };
    }
  }

  /** Exact-match check: only return coords if placeName is an EXACT knownCoords key */
  function getExactCoords(placeName) {
    const key = String(placeName || '').trim().toLowerCase();
    if (!key) return null;
    if (knownCoords[key]) return knownCoords[key];
    // Also check metro stations
    if (METRO_STATIONS.includes(key)) {
      const stationIdx = METRO_STATIONS.indexOf(key);
      const stationNames = ['uttara north','uttara center','uttara south','pallabi','mirpur 11','mirpur 10',
        'kazipara','shewrapara','agargaon','bijoy sarani','farmgate','karwan bazar',
        'shahbag','dhaka university','bangladesh secretariat','motijheel','kamalapur'];
      // These metro stations have no separate knownCoords entries, use approximate Dhaka offsets
      if (key === 'farmgate') return knownCoords['farmgate'];
      if (key === 'motijheel') return knownCoords['motijheel'];
      if (key === 'agargaon') return knownCoords['agargaon'];
    }
    return null;
  }

  /** Find ALL transit points sorted by road distance from user (EXACT coords only) */
  async function findAllNearbyPoints(userCoords, limit = 15) {
    if (!userCoords) return [];
    if (!CORRIDOR_DATA) return []; // Can't show nearby points without corridor data

    const candidates = new Set();
    
    // Include ALL knownCoords places (these are the most reliable)
    Object.keys(knownCoords).forEach(name => candidates.add(name));
    
    // Also add stops from corridors that match our knownCoords exactly
    CORRIDOR_DATA.corridors.forEach(c => {
      if (c.direct && Array.isArray(c.direct.stops)) {
        c.direct.stops.forEach(s => {
          const key = String(s).trim().toLowerCase();
          // Only add if it has an exact match in knownCoords (so we can calculate distance)
          if (knownCoords[key]) candidates.add(key);
        });
      }
    });

    // Add metro stations that have known coordinates
    METRO_STATIONS.forEach(name => {
      if (knownCoords[name] || knownCoords[name.replace(' ', '')]) {
        candidates.add(name);
      }
    });

    // Fetch road distances (in larger pool, but skip OSRM for nearby estimation to avoid rate limits)
    // Use haversine straight-line distance multiplied by 1.4 (road factor for Dhaka)
    // This is faster and avoids OSRM rate limiting entirely
    const nameList = [...candidates].slice(0, 50); // Check up to 50 candidates
    const results = [];
    
    nameList.forEach(name => {
      const pCoords = getVerifiedCoords(name);
      if (!pCoords) return;
      const dist = haversineKm(userCoords, pCoords);
      if (dist === null) return;
      // Multiply straight-line distance by road factor (1.4) for Dhaka roads
      const roadDist = Number((dist * 1.4).toFixed(2));
      const durationMin = Math.ceil(roadDist / 10 * 60);
      results.push({ name, coords: pCoords, distKm: roadDist, durationMin });
    });

    // Sort by distance, filter to nearby (within 30km), take top N
    return results
      .filter(p => p.distKm <= 30)
      .sort((a, b) => a.distKm - b.distKm)
      .slice(0, limit);
  }

  /** Render the nearby transit points list */
  function renderNearbyPoints(points) {
    if (!dom.nearbyCard || !dom.nearbyList) return;
    if (!points || points.length === 0) {
      dom.nearbyCard.hidden = true;
      return;
    }
    dom.nearbyCard.hidden = false;
    if (dom.nearbyCount) dom.nearbyCount.textContent = `${points.length} points`;
    dom.nearbyList.innerHTML = '';

    points.forEach((point, idx) => {
      const mode = pickLastMileMode(point.distKm);
      const calc = computeFareForLeg(mode, point.distKm);
      const modeIcon = mode === 'walking' ? '\ud83d\udeb6' : '\ud83d\udefa';
      const modeBn = mode === 'walking' ? '\u09b9\u09be\u0981\u099f\u09be' : '\u09b0\u09bf\u0995\u09b6\u09be';
      const rickshawFare = `\u09f3${calc.fare}`;
      const walkTime = mode === 'walking' ? `${point.durationMin} min` : `${estimateTimeMinutes(mode, point.distKm)} min`;
      const distLabel = point.distKm < 1 ? `${Math.round(point.distKm * 1000)}m` : `${point.distKm} km`;

      const item = document.createElement('div');
      item.className = 'nearby-item';
      if (idx === 0) item.classList.add('selected');
      item.innerHTML = `
        <div class="name">${titleCase(point.name)}</div>
        <div class="dist-info">
          <span class="dist-badge">\ud83d\udccd ${distLabel}</span>
          <div class="mode-tags" style="margin-top:4px;">
            <span class="${mode === 'walking' ? 'walk-tag' : 'rickshaw-tag'}">${modeIcon} ${modeBn} ${rickshawFare} (${walkTime})</span>
          </div>
        </div>
        <button type="button" class="action-badge" data-point="${escapeHtml(point.name)}">Select as Start</button>
      `;

      // Click to select this point as From
      const btn = item.querySelector('.action-badge');
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        selectNearbyPoint(point.name);
      });
      // Also click on the whole item
      item.addEventListener('click', () => {
        selectNearbyPoint(point.name);
      });

      dom.nearbyList.appendChild(item);
    });
  }

  /** Called when user selects a nearby point as start location */
  function selectNearbyPoint(pointName) {
    if (!dom.fromInput) return;
    const displayName = titleCase(pointName);
    dom.fromInput.value = displayName;
    // Highlight selection
    const items = dom.nearbyList.querySelectorAll('.nearby-item');
    items.forEach(item => {
      const btn = item.querySelector('.action-badge');
      const nameAttr = btn ? btn.getAttribute('data-point') : '';
      item.classList.toggle('selected', nameAttr && nameAttr.toLowerCase() === pointName.toLowerCase());
    });

    // If there's a pending geocode from (user entered a geocoded place), complete the search
    if (pendingGeocodeFrom) {
      const fromCtx = pendingGeocodeFrom;
      pendingGeocodeFrom = null;
      // Now auto-trigger search from the selected point
      const toValue = dom.toInput ? dom.toInput.value.trim() : '';
      setStatus(`<span class="spinner"></span>"${displayName}" \u09a5\u09c7\u0995\u09c7 \u09b0\u09c1\u099f \u0996\u09c1\u0981\u099c\u099b\u09bf...`);
      // Hide nearby card since user made a selection
      if (dom.nearbyCard) dom.nearbyCard.hidden = true;
      // Now do the actual search using the selected transit point as origin
      performSearchFromPoint(displayName, toValue, fromCtx);
      return;
    }

    setStatus(`\u2705 "${displayName}" \u09b8\u09c7\u099f \u0995\u09b0\u09be \u09b9\u09df\u09c7\u099b\u09c7 "From" \u09b9\u09bf\u09b8\u09c7\u09ac\u09c7\u0964 \u098f\u0996\u09a8 "To" \u09b2\u09bf\u0996\u09c7 Search \u0995\u09b0\u09c1\u09a8\u0964`, 'success');
  }

  /** Perform the actual route search using a selected transit point */
  async function performSearchFromPoint(fromPlace, toPlace, originalFromCtx) {
    setLoading(true);

    // Resolve the new FROM (which is now a local DB place name)
    const fromCtx = await resolveEndpointAccess(fromPlace, toPlace, { role: 'from' });
    if (fromCtx.error) {
      setStatus(fromCtx.error, 'error');
      setLoading(false);
      return;
    }

    const toCtx = await resolveEndpointAccess(toPlace, fromPlace, { role: 'to' });
    if (toCtx.error) {
      setStatus(toCtx.error, 'error');
      setLoading(false);
      return;
    }

    const searchOrigin = fromCtx.searchName;
    const searchDest = toCtx.searchName;

    console.log('[Pathik] Selected point search:', searchOrigin, '\u2192', searchDest);

    const local = tryLocalSearch(searchOrigin, searchDest);
    if (local) {
      const resultData = { ...local.data, origin: fromCtx.displayName, destination: toCtx.displayName };
      finalizeSearchResult(resultData, `${fromPlace} to ${toPlace}`, fromCtx, toCtx);
      setStatus(
        `${local.status}` +
        `\n\ud83d\udccd \u09b6\u09c1\u09b0\u09c1: ${originalFromCtx.displayName} \u2192 ${fromPlace} (selected)` +
        endpointStatusSuffix(toCtx, '\u0997\u09a8\u09cd\u09a4\u09ac\u09cd\u09af'),
        'success'
      );
      setLoading(false);
      return;
    }

    // If still no route found, show fallback
    setStatus(
      `\u274c "${fromPlace}" \u09a5\u09c7\u0995\u09c7 "${toPlace}" \u2014 local DB-\u09a4\u09c7 \u09b0\u09c1\u099f \u09aa\u09be\u0993\u09df\u09be \u09af\u09be\u09df\u09a8\u09bf\u0964`,
      'error'
    );
    setLoading(false);
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setStatus('\u0986\u09aa\u09a8\u09be\u09b0 \u09ac\u09cd\u09b0\u09be\u0989\u099c\u09be\u09b0 \u09b2\u09cb\u0995\u09c7\u09b6\u09a8 \u09b8\u09be\u09aa\u09cb\u09b0\u09cd\u099f \u0995\u09b0\u09c7 \u09a8\u09be\u0964', 'error');
      return;
    }
    if (dom.useLocationBtn) {
      dom.useLocationBtn.disabled = true;
      dom.useLocationBtn.textContent = '\u23f3 Locating...';
    }
    setStatus('<span class="spinner"></span>\u0986\u09aa\u09a8\u09be\u09b0 \u0985\u09ac\u09b8\u09cd\u09a5\u09be\u09a8 \u0996\u09cb\u0981\u099c\u09be \u09b9\u099a\u09cd\u099b\u09c7...');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        currentLocation = [pos.coords.latitude, pos.coords.longitude];
        if (userMarker) map.removeLayer(userMarker);
        userMarker = L.marker(currentLocation).addTo(map).bindPopup('\ud83d\udccd \u0986\u09aa\u09a8\u09bf \u098f\u0996\u09be\u09a8\u09c7').openPopup();
        map.setView(currentLocation, 15);
        if (dom.fromInput) dom.fromInput.value = MY_LOCATION_LABEL;
        const toPreview = dom.toInput ? dom.toInput.value.trim() : '';
        const nearest = findNearestTransitPoint(currentLocation, toPreview);

        // Show nearby transit points list sorted by road distance
        setStatus('<span class="spinner"></span>Finding nearby transit points...');
        const nearbyPoints = await findAllNearbyPoints(currentLocation, 15);
        // Update nearby card heading for location mode
        if (dom.nearbyIntro) {
          dom.nearbyIntro.innerHTML = '\u0986\u09aa\u09a8\u09be\u09b0 \u0985\u09ac\u09b8\u09cd\u09a5\u09be\u09a8 \u09a5\u09c7\u0995\u09c7 \u09a8\u09bf\u0995\u099f\u09ac\u09b0\u09cd\u09a4\u09c0 \u09aa\u09be\u09ac\u09b2\u09bf\u0995 \u099f\u09cd\u09b0\u09be\u09a8\u09cd\u09b8\u09aa\u09cb\u09b0\u09cd\u099f \u09aa\u09df\u09c7\u09a8\u09cd\u099f\u0997\u09c1\u09b2\u09cb \u09a8\u09bf\u099a\u09c7 \u09a6\u09c7\u0993\u09df\u09be \u09b9\u09b2\u09cb\u0964 \u098f\u0995\u099f\u09bf \u09aa\u09df\u09c7\u09a8\u09cd\u099f \u09b8\u09bf\u09b2\u09c7\u0995\u09cd\u099f \u0995\u09b0\u09b2\u09c7 \u09b8\u09c7\u099f\u09bf "From" \u09b9\u09bf\u09b8\u09c7\u09ac\u09c7 \u09b8\u09c7\u099f \u09b9\u09ac\u09c7 \u0993 \u09b8\u09c7\u0996\u09be\u09a8 \u09a5\u09c7\u0995\u09c7 \u09b0\u09c1\u099f \u09a6\u09c7\u0996\u09be\u09ac\u09c7\u0964';
        }
        renderNearbyPoints(nearbyPoints);

        if (nearest) {
          const mode = pickLastMileMode(nearest.distKm);
          const modeBn = mode === 'walking' ? '\u09b9\u09be\u0981\u099f\u09be' : '\u09b0\u09bf\u0995\u09b6\u09be';
          const destNote = toPreview ? ` (${titleCase(toPreview)} \u09af\u09be\u0993\u09df\u09be\u09b0 \u09b0\u09c1\u099f\u09c7)` : '';
          const countNote = nearbyPoints.length > 0 ? ` | ${nearbyPoints.length}\u099f\u09bf \u09aa\u09df\u09c7\u09a8\u09cd\u099f \u09aa\u09be\u0993\u09df\u09be \u0997\u09c7\u099b\u09c7` : '';
          setStatus(`\ud83d\udccd \u0985\u09ac\u09b8\u09cd\u09a5\u09be\u09a8 \u09aa\u09be\u0993\u09df\u09be \u0997\u09c7\u099b\u09c7! \u09a8\u09bf\u0995\u099f\u09ac\u09b0\u09cd\u09a4\u09c0 \u09ac\u09be\u09b8 \u09b8\u09cd\u099f\u09aa${destNote}: ${titleCase(nearest.name)} (${nearest.distKm} km) \u2014 ${modeBn} \u0995\u09b0\u09c7 \u09af\u09be\u09ac\u09c7\u09a8\u0964${countNote}`, 'success');
          setMapStatus(`Your location set. Nearest bus stop${destNote}: ${titleCase(nearest.name)} (${nearest.distKm} km).`);
        } else {
          setStatus(nearbyPoints.length > 0
            ? `\ud83d\udccd \u0985\u09ac\u09b8\u09cd\u09a5\u09be\u09a8 \u09aa\u09be\u0993\u09df\u09be \u0997\u09c7\u099b\u09c7! ${nearbyPoints.length}\u099f\u09bf \u09a8\u09bf\u0995\u099f\u09ac\u09b0\u09cd\u09a4\u09c0 \u09aa\u09df\u09c7\u09a8\u09cd\u099f \u09aa\u09be\u0993\u09df\u09be \u0997\u09c7\u099b\u09c7\u0964 \u09a8\u09bf\u099a\u09c7 \u09a5\u09c7\u0995\u09c7 \u098f\u0995\u099f\u09bf \u09aa\u09df\u09c7\u09a8\u09cd\u099f \u09a8\u09bf\u09b0\u09cd\u09ac\u09be\u099a\u09a8 \u0995\u09b0\u09c1\u09a8\u0964`
            : '\ud83d\udccd \u0985\u09ac\u09b8\u09cd\u09a5\u09be\u09a8 \u09aa\u09be\u0993\u09df\u09be \u0997\u09c7\u099b\u09c7, \u0995\u09bf\u09a8\u09cd\u09a4\u09c1 \u09a8\u09bf\u0995\u099f\u09ac\u09b0\u09cd\u09a4\u09c0 \u09aa\u09df\u09c7\u09a8\u09cd\u099f \u0996\u09c1\u0981\u099c\u09c7 \u09aa\u09be\u0993\u09df\u09be \u09af\u09be\u09df\u09a8\u09bf\u0964', 'error');
          setMapStatus('Location found but no nearby transit point.');
        }
        if (dom.useLocationBtn) {
          dom.useLocationBtn.disabled = false;
          dom.useLocationBtn.textContent = '\ud83d\udccd Use my location';
        }
      },
      (err) => {
        const msg = err.code === 1 ? '\u09b2\u09cb\u0995\u09c7\u09b6\u09a8 \u09aa\u09be\u09b0\u09ae\u09bf\u09b6\u09a8 \u09a6\u09c7\u0993\u09df\u09be \u09b9\u09df\u09a8\u09bf\u0964' : '\u0986\u09aa\u09a8\u09be\u09b0 \u0985\u09ac\u09b8\u09cd\u09a5\u09be\u09a8 \u0996\u09c1\u0981\u099c\u09c7 \u09aa\u09be\u0993\u09df\u09be \u09af\u09be\u09df\u09a8\u09bf\u0964';
        setStatus(msg, 'error');
        if (dom.useLocationBtn) {
          dom.useLocationBtn.disabled = false;
          dom.useLocationBtn.textContent = '\ud83d\udccd Use my location';
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  function locateUser() {
    if (!navigator.geolocation) { setMapStatus('Your browser does not support location.'); return; }
    if (dom.locateBtn) dom.locateBtn.disabled = true;
    setMapStatus('Finding your location...');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        currentLocation = coords;
        if (userMarker) map.removeLayer(userMarker);
        userMarker = L.marker(coords).addTo(map).bindPopup('You are here').openPopup();
        map.setView(coords, 15);
        // Show nearby points
        const nearbyPoints = await findAllNearbyPoints(currentLocation, 15);
        renderNearbyPoints(nearbyPoints);
        const countNote = nearbyPoints.length > 0 ? `Found ${nearbyPoints.length} nearby transit points.` : 'No nearby transit points found.';
        setMapStatus(`Current location shown on map. ${countNote}`);
        if (dom.locateBtn) dom.locateBtn.disabled = false;
      },
      (err) => {
        setMapStatus(err.code === 1 ? 'Location permission denied.' : 'Could not find your location.');
        if (dom.locateBtn) dom.locateBtn.disabled = false;
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  function setMapStatus(message) {
    if (dom.mapStatus) dom.mapStatus.textContent = message;
  }

  function resolveCoords(placeName, fallbackCoords = null) {
    const key = String(placeName || '').trim().toLowerCase();
    if (isMyLocationInput(placeName) && (currentLocation || fallbackCoords)) return currentLocation || fallbackCoords;
    if (geocodedPlaceCoords[key]) return geocodedPlaceCoords[key];
    if (knownCoords[key]) return knownCoords[key];
    const matched = Object.keys(knownCoords).find(k => key.includes(k) || k.includes(key));
    if (matched) return knownCoords[matched];
    return hashToDhakaOffset(key);
  }

  function hashToDhakaOffset(s) {
    const baseLat = 23.8103, baseLng = 90.4125;
    let h = 0; for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i);
    return [baseLat + ((h % 1000) / 1000) * 0.18 - 0.09, baseLng + ((((h / 7) % 1000) / 1000) * 0.22) - 0.11];
  }

  function saveCurrentRoute() {
    if (!currentResult || !currentResult.routes?.length) { setStatus('No route to save.', 'error'); return; }
    const route = currentResult.routes[selectedRouteIndex];
    const saved = getSavedRoutes();
    saved.unshift({ id: `route_${Date.now()}`, title: `${currentResult.origin} \u2192 ${currentResult.destination} (\u09f3${route.total_cost})`, selectedRouteId: route.id, payload: currentResult, createdAt: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved.slice(0, 25)));
    loadSavedRoutesDropdown(saved[0].id);
    setStatus('Route saved.', 'success');
  }

  function loadSavedRoutesDropdown(selectId = '') {
    const saved = getSavedRoutes();
    dom.savedRoutes.innerHTML = '<option value="">Select a saved route</option>';
    saved.forEach((item) => { const opt = document.createElement('option'); opt.value = item.id; opt.textContent = `${item.title} \u2022 ${new Date(item.createdAt).toLocaleDateString()}`; dom.savedRoutes.appendChild(opt); });
    if (selectId) dom.savedRoutes.value = selectId;
  }

  function getSavedRoutes() { try { const raw = localStorage.getItem(STORAGE_KEY); const data = raw ? JSON.parse(raw) : []; return Array.isArray(data) ? data : []; } catch (_) { return []; } }

  async function saveFeedback() {
    if (!currentResult || !currentResult.routes?.length) {
      if (dom.feedbackStatus) dom.feedbackStatus.textContent = 'Search and select a route first.';
      return;
    }
    const route = currentResult.routes[selectedRouteIndex];
    const item = {
      id: `feedback_${Date.now()}`,
      type: dom.feedbackType ? dom.feedbackType.value : 'correct',
      note: dom.feedbackText ? dom.feedbackText.value.trim() : '',
      origin: currentResult.origin,
      destination: currentResult.destination,
      routeLabel: route.label,
      source: currentResult.source,
      confidence: currentResult.confidence,
      createdAt: new Date().toISOString()
    };
    const saved = getFeedbackItems();
    saved.unshift(item);
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(saved.slice(0, 100)));
    if (dom.feedbackText) dom.feedbackText.value = '';
    if (dom.feedbackStatus) dom.feedbackStatus.textContent = 'Feedback saved locally.';
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      if (res.ok && dom.feedbackStatus) dom.feedbackStatus.textContent = 'Feedback saved and synced to server.';
    } catch (_) {}
  }

  function getFeedbackItems() {
    try {
      const raw = localStorage.getItem(FEEDBACK_KEY);
      const data = raw ? JSON.parse(raw) : [];
      return Array.isArray(data) ? data : [];
    } catch (_) { return []; }
  }

  function normalizeQueryText(query) {
    return String(query || '')
      .replace(/\s+/g, ' ')
      .replace(/\u09a5\u09c7\u0995\u09c7|\u09b9\u09a4\u09c7|\u099f\u09c1|\u27a1/gi, ' to ')
      .replace(/\btheke\b|\bhote\b|\bfrom\b/gi, ' to ')
      .replace(/\u09a2\u09be\u0995\u09be/gi, 'dhaka')
      .replace(/\u098f\u09af\u09bc\u09be\u09b0\u09aa\u09cb\u09b0\u09cd\u099f|\u098f\u09df\u09be\u09b0\u09aa\u09cb\u09b0\u09cd\u099f|\u09ac\u09bf\u09ae\u09be\u09a8\u09ac\u09a8\u09cd\u09a6\u09b0/gi, 'airport')
      .replace(/\u0989\u09a4\u09cd\u09a4\u09b0\u09be/gi, 'uttara')
      .replace(/\u09ae\u09bf\u09b0\u09aa\u09c1\u09b0/gi, 'mirpur')
      .replace(/\u09ae\u09a4\u09bf\u099d\u09bf\u09b2/gi, 'motijheel')
      .replace(/\u09ab\u09be\u09b0\u09cd\u09ae\u0997\u09c7\u099f/gi, 'farmgate')
      .replace(/\u0986\u09b6\u09c1\u09b2\u09bf\u09af\u09bc\u09be|\u0986\u09b6\u09c1\u09b2\u09bf\u09df\u09be/gi, 'ashulia')
      .replace(/\u09b8\u09be\u09ad\u09be\u09b0/gi, 'savar')
      .replace(/\u09a1\u09bf\u0986\u0987\u0987\u0987|\u09a1\u09cd\u09af\u09be\u09ab\u09cb\u09a1\u09bf\u09b2/gi, 'diu')
      .trim();
  }

  function parseQuerySimple(query) {
    const q = normalizeQueryText(query);
    if (!q) return { origin: 'Dhaka', destination: 'Airport' };
    const lower = q.toLowerCase();
    if (lower.includes(' to ')) { const parts = q.split(/\bto\b/i).map(s => s.trim()).filter(Boolean); return { origin: parts[0] || 'Dhaka', destination: parts[parts.length - 1] || 'Airport' }; }
    return { origin: q, destination: 'Airport' };
  }

  // ===================== Geocoding System (Nominatim / OpenStreetMap) =====================

  /** Get geocode cache from localStorage */
  function getGeocodeCache() {
    try {
      const raw = localStorage.getItem(GEOCODE_CACHE_KEY);
      if (!raw) return {};
      const data = JSON.parse(raw);
      return typeof data === 'object' && data !== null ? data : {};
    } catch (_) { return {}; }
  }

  /** Set geocode cache in localStorage (with TTL cleanup) */
  function setGeocodeCache(query, result) {
    try {
      const cache = getGeocodeCache();
      const key = String(query).trim().toLowerCase();
      cache[key] = { result, ts: Date.now() };
      // Clean old entries
      const now = Date.now();
      const keys = Object.keys(cache);
      let cleaned = 0;
      for (const k of keys) {
        if (now - cache[k].ts > GEOCODE_CACHE_TTL_MS) {
          delete cache[k];
          cleaned++;
        }
      }
      // Keep max 200 entries
      const remaining = Object.keys(cache);
      if (remaining.length > 200) {
        remaining.sort((a, b) => cache[a].ts - cache[b].ts);
        for (let i = 0; i < remaining.length - 200; i++) delete cache[remaining[i]];
      }
      localStorage.setItem(GEOCODE_CACHE_KEY, JSON.stringify(cache));
    } catch (_) {}
  }

  const GEOCODE_ALIASES = {
    'daffodil university': 'Daffodil International University Ashulia Savar',
    'daffodil international university': 'Daffodil International University Ashulia Savar',
    'diu': 'Daffodil International University Ashulia Savar',
    'diu ashulia': 'Daffodil International University Ashulia Savar',
    'fantasy kingdom': 'Fantasy Kingdom Ashulia Savar',
    'brac university': 'BRAC University Mohakhali Dhaka',
    'nsu': 'North South University Bashundhara Dhaka',
    'iub': 'Independent University Bangladesh Bashundhara Dhaka',
    'uiu': 'United International University Badda Dhaka'
  };

  function geocodeSearchQueries(placeName) {
    const query = String(placeName || '').trim();
    if (!query) return [];
    const key = query.toLowerCase();
    const alias = GEOCODE_ALIASES[key] || GEOCODE_ALIASES[normalizePlace(query)];
    const queries = [alias || query, query];
    return [...new Set(queries.map(q => `${q}, Dhaka, Bangladesh`).concat(alias ? [] : [`${query}, Bangladesh`]))];
  }

  /** Geocode a place name using Nominatim (OpenStreetMap free API) */
  async function geocodeNominatim(placeName) {
    const query = String(placeName || '').trim();
    if (!query) return null;

    // Check cache first
    const cache = getGeocodeCache();
    const cacheKey = query.toLowerCase();
    const cached = cache[cacheKey];
    if (cached && Date.now() - cached.ts < GEOCODE_CACHE_TTL_MS) {
      return cached.result;
    }

    const searchQueries = geocodeSearchQueries(query);

    try {
      for (const searchText of searchQueries) {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchText)}&format=json&limit=1&addressdetails=0`;
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'PathikDhakaTransit/1.0 (transit app; contact@pathik.app)',
            'Accept': 'application/json'
          }
        });
        if (!res.ok) continue;
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) continue;
        const result = {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon),
          displayName: data[0].display_name,
          type: data[0].type || 'unknown'
        };
        setGeocodeCache(query, result);
        return result;
      }
      setGeocodeCache(query, null);
      return null;
    } catch (err) {
      console.warn('[Pathik] Geocoding failed for', query, err.message);
      return null;
    }
  }

  function getMockData(query) {
    const p = parseQuerySimple(query);
    const dist = haversineKm(resolveCoords(p.origin), resolveCoords(p.destination));
    const calc = computeFareForLeg('bus', dist);
    return { origin: p.origin, destination: p.destination, _source: 'distance_estimate', routes: [
      { id: 1, label: 'Direct Bus (calculated)', total_cost: calc.fare, total_cost_range: calc.fare_range, total_time_minutes: estimateTimeMinutes('bus', dist), total_time_range: '', steps: [{ mode: 'bus', icon: '\ud83d\ude8c', from: p.origin, to: p.destination, bus_names: ['Local Bus'], landmarks: [], cost: calc.fare, cost_range: calc.fare_range, time_minutes: estimateTimeMinutes('bus', dist), time_range: '', tip_bn: '\u09b8\u09b0\u09be\u09b8\u09b0\u09bf \u09ac\u09be\u09b8\u09c7 \u09a8\u09bf\u09a8\u0964', fare_source: 'distance_calc', distance_km: dist ? Number(dist.toFixed(2)) : null }] }
    ] };
  }

  function setLoading(b) {
    dom.searchBtn.disabled = b;
    [dom.queryInput, dom.fromInput, dom.toInput].filter(Boolean).forEach(input => { input.disabled = b; });
  }
  function setStatus(message, type = '') { dom.statusArea.className = `status-area ${type}`.trim(); dom.statusArea.innerHTML = message; }
  function sum(arr) { return arr.reduce((a, b) => a + b, 0); }
  function escapeHtml(str) { return String(str).replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"').replace(/'/g, '&#39;'); }

  // ===================== ⭐ RATING SYSTEM =====================
  const RATING_STORAGE_KEY = 'pathik_ratings_v1';

  function getRouteRatings() {
    try {
      const raw = localStorage.getItem(RATING_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_) { return {}; }
  }

  function getRouteRatingKey(origin, destination, routeLabel) {
    return `${String(origin).toLowerCase()}::${String(destination).toLowerCase()}::${String(routeLabel).toLowerCase()}`;
  }

  function initRatingSystem() {
    if (!dom.starDisplay || !dom.ratingArea) return;
    dom.starDisplay.querySelectorAll('.star').forEach(star => {
      star.addEventListener('click', onStarClick);
      star.addEventListener('mouseenter', onStarHover);
      star.addEventListener('mouseleave', onStarLeave);
    });
  }

  function onStarHover(e) {
    const val = parseInt(e.target.dataset.value);
    dom.starDisplay.querySelectorAll('.star').forEach(s => {
      if (parseInt(s.dataset.value) <= val) s.classList.add('hover-active');
    });
  }

  function onStarLeave() {
    dom.starDisplay.querySelectorAll('.star').forEach(s => s.classList.remove('hover-active'));
  }

  function onStarClick(e) {
    const val = parseInt(e.target.dataset.value);
    if (!currentResult || !currentResult.routes[selectedRouteIndex]) return;
    const route = currentResult.routes[selectedRouteIndex];
    const key = getRouteRatingKey(currentResult.origin, currentResult.destination, route.label);
    const ratings = getRouteRatings();
    if (!ratings[key]) ratings[key] = { entries: [], avg: 0 };
    ratings[key].entries.push({ rating: val, timestamp: Date.now() });
    // Keep only last 100 entries
    if (ratings[key].entries.length > 100) ratings[key].entries = ratings[key].entries.slice(-100);
    const sum = ratings[key].entries.reduce((a, b) => a + b.rating, 0);
    ratings[key].avg = Math.round((sum / ratings[key].entries.length) * 10) / 10;
    localStorage.setItem(RATING_STORAGE_KEY, JSON.stringify(ratings));
    renderRatingDisplay(key, val);
  }

  function renderRatingDisplay(key, userRating) {
    if (!dom.starDisplay || !dom.ratingCount) return;
    const ratings = getRouteRatings();
    const data = ratings[key] || { entries: [], avg: 0 };
    const avg = data.avg;
    dom.starDisplay.querySelectorAll('.star').forEach(s => {
      const val = parseInt(s.dataset.value);
      s.classList.toggle('active', val <= Math.round(avg));
    });
    dom.ratingCount.textContent = data.entries.length ? `${data.avg} ⭐ (${data.entries.length} votes)` : 'No ratings yet';
    if (dom.ratingStatus) dom.ratingStatus.textContent = userRating ? `You rated ${userRating} ⭐` : '';
  }

  function showRatingForCurrentRoute() {
    if (!dom.ratingArea || !currentResult || !currentResult.routes[selectedRouteIndex]) {
      if (dom.ratingArea) dom.ratingArea.hidden = true;
      return;
    }
    dom.ratingArea.hidden = false;
    const route = currentResult.routes[selectedRouteIndex];
    const key = getRouteRatingKey(currentResult.origin, currentResult.destination, route.label);
    renderRatingDisplay(key, 0);
  }

  // ===================== 🌍 CROWDSOURCE SYSTEM =====================
  const CROWD_STOPS_KEY = 'pathik_crowd_stops_v1';
  const CROWD_ROUTES_KEY = 'pathik_crowd_routes_v1';

  function initCrowdsourceSystem() {
    if (dom.tabAddStop) dom.tabAddStop.addEventListener('click', () => switchCrowdTab('stop'));
    if (dom.tabAddRoute) dom.tabAddRoute.addEventListener('click', () => switchCrowdTab('route'));
    if (dom.tabMyData) dom.tabMyData.addEventListener('click', () => switchCrowdTab('mine'));
    if (dom.submitStopBtn) dom.submitStopBtn.addEventListener('click', submitCrowdStop);
    if (dom.submitRouteBtn) dom.submitRouteBtn.addEventListener('click', submitCrowdRoute);
    // Map click to fill lat/lng
    if (map) {
      map.on('click', (e) => {
        if (dom.newStopLat && dom.newStopLng) {
          dom.newStopLat.value = e.latlng.lat.toFixed(6);
          dom.newStopLng.value = e.latlng.lng.toFixed(6);
        }
      });
    }
  }

  function switchCrowdTab(tab) {
    if (dom.addStopForm) dom.addStopForm.hidden = tab !== 'stop';
    if (dom.addRouteForm) dom.addRouteForm.hidden = tab !== 'route';
    if (dom.mySubmissionsArea) dom.mySubmissionsArea.hidden = tab !== 'mine';
    // Tab button styles
    [dom.tabAddStop, dom.tabAddRoute, dom.tabMyData].forEach(btn => {
      if (btn) btn.classList.toggle('active-tab', 
        (tab === 'stop' && btn === dom.tabAddStop) ||
        (tab === 'route' && btn === dom.tabAddRoute) ||
        (tab === 'mine' && btn === dom.tabMyData)
      );
    });
    if (tab === 'mine') renderMySubmissions();
  }

  function submitCrowdStop() {
    if (!dom.newStopName || !dom.submitStopStatus) return;
    const name = dom.newStopName.value.trim();
    const area = dom.newStopArea ? dom.newStopArea.value.trim() : '';
    const lat = dom.newStopLat ? parseFloat(dom.newStopLat.value) : null;
    const lng = dom.newStopLng ? parseFloat(dom.newStopLng.value) : null;
    if (!name) { dom.submitStopStatus.textContent = 'Please enter a stop name.'; dom.submitStopStatus.style.color = '#b91c1c'; return; }
    let stops = [];
    try { const raw = localStorage.getItem(CROWD_STOPS_KEY); if (raw) stops = JSON.parse(raw); } catch (_) {}
    stops.unshift({
      id: `stop_${Date.now()}`,
      name, area, lat, lng,
      createdAt: new Date().toISOString()
    });
    localStorage.setItem(CROWD_STOPS_KEY, JSON.stringify(stops.slice(0, 50)));
    dom.newStopName.value = ''; if (dom.newStopArea) dom.newStopArea.value = '';
    if (dom.newStopLat) dom.newStopLat.value = ''; if (dom.newStopLng) dom.newStopLng.value = '';
    dom.submitStopStatus.textContent = '✅ Stop submitted! Thank you.';
    dom.submitStopStatus.style.color = '#047857';
  }

  function submitCrowdRoute() {
    if (!dom.newRouteFrom || !dom.newRouteTo || !dom.submitRouteStatus) return;
    const from = dom.newRouteFrom.value.trim();
    const to = dom.newRouteTo.value.trim();
    const busName = dom.newRouteBusName ? dom.newRouteBusName.value.trim() : '';
    const fare = dom.newRouteFare ? parseFloat(dom.newRouteFare.value) : null;
    const stopsText = dom.newRouteStops ? dom.newRouteStops.value.trim() : '';
    if (!from || !to) { dom.submitRouteStatus.textContent = 'Please enter from and to stops.'; dom.submitRouteStatus.style.color = '#b91c1c'; return; }
    let routes = [];
    try { const raw = localStorage.getItem(CROWD_ROUTES_KEY); if (raw) routes = JSON.parse(raw); } catch (_) {}
    const stopsList = stopsText.split(',').map(s => s.trim()).filter(Boolean);
    const newRoute = {
      id: `crowdroute_${Date.now()}`,
      from: from.toLowerCase(), to: to.toLowerCase(),
      fromDisplay: titleCase(from), toDisplay: titleCase(to),
      busName, fare, stops: stopsList,
      authorId: getUserId(),
      votes: { agree: 0, disagree: 0 },
      status: 'active',
      createdAt: new Date().toISOString()
    };
    routes.unshift(newRoute);
    localStorage.setItem(CROWD_ROUTES_KEY, JSON.stringify(routes.slice(0, 50)));
    
    // Also try to save permanently to routes.json via server API (works on local server)
    const saveToRoutesJson = async () => {
      try {
        const res = await fetch('/api/routes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ from, to, busName, fare, stops: stopsList })
        });
        if (res.ok) {
          console.log(`[Pathik] Route saved to routes.json: ${from} → ${to}`);
          dom.submitRouteStatus.textContent = '✅ Route saved permanently database-wide!';
          dom.submitRouteStatus.style.color = '#047857';
        } else if (res.status === 409) {
          dom.submitRouteStatus.textContent = '✅ Route already exists in database. It will appear in searches.';
          dom.submitRouteStatus.style.color = '#047857';
        } else {
          const err = await res.json();
          console.warn('[Pathik] Failed to save to routes.json:', err);
          dom.submitRouteStatus.textContent = '✅ Route submitted! (saved locally, will appear for you)';
          dom.submitRouteStatus.style.color = '#047857';
        }
      } catch (err) {
        // Server not available (e.g. Vercel or server not running) - fall back to localStorage
        console.warn('[Pathik] Server API not available, route saved locally only:', err.message);
        // On Vercel, filesystem is read-only, so routes.json can't be updated.
        // The route is saved in localStorage and will appear in searches for this user.
        const isVercel = window.location.hostname.includes('vercel.app');
        dom.submitRouteStatus.textContent = isVercel
          ? '✅ Route saved locally! (Vercel: routes are per-browser. To share, add to routes.json locally & re-deploy.)'
          : '✅ Route saved locally! Start the server (node server.js) to make it permanent database-wide.';
        dom.submitRouteStatus.style.color = '#047857';
      }
    };
    saveToRoutesJson();
    
    dom.newRouteFrom.value = ''; dom.newRouteTo.value = '';
    if (dom.newRouteBusName) dom.newRouteBusName.value = '';
    if (dom.newRouteFare) dom.newRouteFare.value = '';
    if (dom.newRouteStops) dom.newRouteStops.value = '';
    if (!dom.submitRouteStatus.textContent) {
      dom.submitRouteStatus.textContent = '✅ Route submitted! Thank you. It will now appear in search results.';
      dom.submitRouteStatus.style.color = '#047857';
    }
  }

  /** Get all crowd-submitted routes */
  function getCrowdRoutes() {
    try { const raw = localStorage.getItem(CROWD_ROUTES_KEY); return raw ? JSON.parse(raw) : []; } catch (_) { return []; }
  }

  /** Check if a crowd route matches given from/to */
  function crowdRouteMatches(crowdRoute, searchFrom, searchTo) {
    const cf = String(crowdRoute.from || '').toLowerCase().trim();
    const ct = String(crowdRoute.to || '').toLowerCase().trim();
    const sf = String(searchFrom || '').toLowerCase().trim();
    const st = String(searchTo || '').toLowerCase().trim();
    if (!cf || !ct || !sf || !st) return false;
    // Exact match
    if (cf === sf && ct === st) return true;
    // Partial match (from contains searchFrom OR searchFrom contains from)
    if ((cf.includes(sf) || sf.includes(cf)) && (ct.includes(st) || st.includes(ct))) return true;
    // Reverse match (user searched B→A but route is A→B)
    if (cf === st && ct === sf) return true;
    return false;
  }

  /** Vote on a crowd route (agree/disagree) */
  function voteOnCrowdRoute(routeId, voteType) {
    const CROWD_ROUTE_VOTES_KEY = 'pathik_crowd_route_votes_v1';
    const routes = getCrowdRoutes();
    const route = routes.find(r => r.id === routeId);
    if (!route) return;
    
    let votes = {};
    try { const raw = localStorage.getItem(CROWD_ROUTE_VOTES_KEY); if (raw) votes = JSON.parse(raw); } catch (_) {}
    
    const uid = getUserId();
    const key = `${routeId}::${uid}`;
    
    // If already voted this way, undo
    if (votes[key] === voteType) {
      delete votes[key];
      route.votes[voteType] = Math.max(0, (route.votes[voteType] || 0) - 1);
    } else {
      // Remove previous vote if any
      if (votes[key]) { const prev = votes[key]; route.votes[prev] = Math.max(0, (route.votes[prev] || 0) - 1); }
      votes[key] = voteType;
      route.votes[voteType] = (route.votes[voteType] || 0) + 1;
    }
    
    localStorage.setItem(CROWD_ROUTE_VOTES_KEY, JSON.stringify(votes));
    localStorage.setItem(CROWD_ROUTES_KEY, JSON.stringify(routes));
    
    // Re-render if showing relevant routes
    if (currentResult) renderAll();
  }

  /** Get verdict for a crowd route */
  function getCrowdRouteVerdict(route) {
    const total = (route.votes?.agree || 0) + (route.votes?.disagree || 0);
    if (total < 2) return 'neutral';
    if ((route.votes?.agree || 0) / total >= 0.7) return 'verified';
    if ((route.votes?.disagree || 0) / total >= 0.6) return 'disputed';
    return 'neutral';
  }

  /** Find matching crowd routes for a search query */
  function findMatchingCrowdRoutes(searchFrom, searchTo) {
    const routes = getCrowdRoutes();
    const CROWD_ROUTE_VOTES_KEY = 'pathik_crowd_route_votes_v1';
    let votes = {};
    try { const raw = localStorage.getItem(CROWD_ROUTE_VOTES_KEY); if (raw) votes = JSON.parse(raw); } catch (_) {}
    const uid = getUserId();
    
    return routes
      .filter(r => crowdRouteMatches(r, searchFrom, searchTo) && r.status === 'active')
      .map(r => ({
        ...r,
        userVote: votes[`${r.id}::${uid}`] || null,
        verdict: getCrowdRouteVerdict(r)
      }))
      .sort((a, b) => {
        // Sort by vote count (most voted first)
        const totalA = (a.votes?.agree || 0) + (a.votes?.disagree || 0);
        const totalB = (b.votes?.agree || 0) + (b.votes?.disagree || 0);
        return totalB - totalA;
      });
  }

  function renderMySubmissions() {
    if (!dom.mySubmissionsList || !dom.mySubmissionsEmpty) return;
    let stops = [], routes = [];
    try { const rs = localStorage.getItem(CROWD_STOPS_KEY); if (rs) stops = JSON.parse(rs); } catch (_) {}
    try { const rr = localStorage.getItem(CROWD_ROUTES_KEY); if (rr) routes = JSON.parse(rr); } catch (_) {}
    if (!stops.length && !routes.length) {
      dom.mySubmissionsList.innerHTML = '';
      dom.mySubmissionsEmpty.hidden = false;
      return;
    }
    dom.mySubmissionsEmpty.hidden = true;
    dom.mySubmissionsList.innerHTML = '';
    [...stops.map(s => ({ ...s, _type: 'stop' })), ...routes.map(r => ({ ...r, _type: 'route' }))].forEach(item => {
      const div = document.createElement('div');
      div.className = 'my-sub-item';
      if (item._type === 'stop') {
        div.innerHTML = `<div class="sub-type">📍 Stop: ${escapeHtml(item.name)}${item.area ? ` (${escapeHtml(item.area)})` : ''}</div>
          <div class="sub-date">${new Date(item.createdAt).toLocaleString()}</div>`;
      } else {
        div.innerHTML = `<div class="sub-type">🚌 Route: ${escapeHtml(item.from)} → ${escapeHtml(item.to)}</div>
          <div class="sub-detail">Bus: ${escapeHtml(item.busName || 'N/A')} | Fare: ৳${item.fare || 'N/A'}</div>
          <div class="sub-date">${new Date(item.createdAt).toLocaleString()}</div>`;
      }
      dom.mySubmissionsList.appendChild(div);
    });
  }

  // ===================== 📰 NEWS FEED SYSTEM =====================
  const FEED_STORAGE_KEY = 'pathik_feed_v1';
  const FEED_VOTES_KEY = 'pathik_feed_votes_v1';
  const ANONYMOUS_USER_KEY = 'pathik_user_id_v1';

  function getUserId() {
    let uid = localStorage.getItem(ANONYMOUS_USER_KEY);
    if (!uid) { uid = 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8); localStorage.setItem(ANONYMOUS_USER_KEY, uid); }
    return uid;
  }

  function getFeedPosts() {
    try { const raw = localStorage.getItem(FEED_STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch (_) { return []; }
  }

  function getFeedVotes() {
    try { const raw = localStorage.getItem(FEED_VOTES_KEY); return raw ? JSON.parse(raw) : {}; } catch (_) { return {}; }
  }

  function initFeedSystem() {
    if (dom.toggleFeedFormBtn) dom.toggleFeedFormBtn.addEventListener('click', () => { if (dom.newPostForm) dom.newPostForm.hidden = !dom.newPostForm.hidden; });
    if (dom.submitPostBtn) dom.submitPostBtn.addEventListener('click', submitFeedPost);
    // Filter buttons
    document.querySelectorAll('.feed-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.feed-filter-btn').forEach(b => b.classList.remove('active-filter'));
        btn.classList.add('active-filter');
        renderFeed(btn.dataset.filter);
      });
    });
    renderFeed('all');
  }

  function submitFeedPost() {
    if (!dom.postFrom || !dom.postTo || !dom.postMessage || !dom.postSubmitStatus) return;
    const from = dom.postFrom.value.trim();
    const to = dom.postTo.value.trim();
    const type = dom.postType ? dom.postType.value : 'general';
    const message = dom.postMessage.value.trim();
    if (!from || !to || !message) { dom.postSubmitStatus.textContent = 'Please fill in all fields.'; dom.postSubmitStatus.style.color = '#b91c1c'; return; }
    const feed = getFeedPosts();
    feed.unshift({
      id: `post_${Date.now()}`,
      from: from.toLowerCase(), to: to.toLowerCase(),
      fromDisplay: titleCase(from), toDisplay: titleCase(to),
      type, message, authorId: getUserId(),
      votes: { agree: 0, disagree: 0 },
      status: 'active',
      createdAt: new Date().toISOString()
    });
    localStorage.setItem(FEED_STORAGE_KEY, JSON.stringify(feed.slice(0, 200)));
    dom.postFrom.value = ''; dom.postTo.value = ''; dom.postMessage.value = '';
    if (dom.newPostForm) dom.newPostForm.hidden = true;
    dom.postSubmitStatus.textContent = '✅ Post published!';
    dom.postSubmitStatus.style.color = '#047857';
    renderFeed('all');
  }

  function voteOnPost(postId, voteType) {
    const votes = getFeedVotes();
    const uid = getUserId();
    const key = `${postId}::${uid}`;
    const feed = getFeedPosts();
    const post = feed.find(p => p.id === postId);
    if (!post) return;
    // If already voted this way, undo
    if (votes[key] === voteType) {
      delete votes[key];
      post.votes[voteType] = Math.max(0, post.votes[voteType] - 1);
    } else {
      // Remove previous vote if any
      if (votes[key]) { const prev = votes[key]; post.votes[prev] = Math.max(0, post.votes[prev] - 1); }
      votes[key] = voteType;
      post.votes[voteType] = (post.votes[voteType] || 0) + 1;
    }
    localStorage.setItem(FEED_VOTES_KEY, JSON.stringify(votes));
    localStorage.setItem(FEED_STORAGE_KEY, JSON.stringify(feed));
    // Re-render current filter
    const activeFilter = document.querySelector('.feed-filter-btn.active-filter');
    renderFeed(activeFilter ? activeFilter.dataset.filter : 'all');
    renderRouteRelatedFeed();
  }

  function getVerdict(post) {
    const total = post.votes.agree + post.votes.disagree;
    if (total < 3) return 'neutral';
    if (post.votes.agree / total >= 0.7) return 'verified';
    if (post.votes.disagree / total >= 0.6) return 'disputed';
    return 'neutral';
  }

  function renderFeed(filter = 'all') {
    if (!dom.feedList || !dom.feedEmpty) return;
    let posts = getFeedPosts();
    const uid = getUserId();
    const votes = getFeedVotes();

    if (filter === 'my') posts = posts.filter(p => p.authorId === uid);
    else if (filter !== 'all') posts = posts.filter(p => p.type === filter);

    if (!posts.length) {
      dom.feedList.innerHTML = `<div class="feed-empty">${filter === 'my' ? 'You haven\'t posted any updates yet.' : 'Be the first to post a transport update! 🚌'}</div>`;
      return;
    }

    dom.feedList.innerHTML = '';
    posts.slice(0, 30).forEach(post => {
      const verdict = getVerdict(post);
      const voted = votes[`${post.id}::${uid}`];
      const item = document.createElement('div');
      item.className = `feed-item ${verdict === 'verified' ? 'verified' : ''} ${verdict === 'disputed' ? 'disputed' : ''}`;
      const typeLabels = { traffic_jam: '🚦 Traffic Jam', road_closure: '🚧 Road Closure', accident: '🚑 Accident', alternative: '🔄 Alternative', bus_delay: '⏰ Bus Delay', general: '📢 Update' };
      const verdictBadges = { verified: '<span class="feed-item-verdict verdict-verified">✅ Verified by community</span>', disputed: '<span class="feed-item-verdict verdict-disputed">⚠️ Disputed</span>', neutral: '<span class="feed-item-verdict verdict-neutral">◐ Awaiting votes</span>' };
      item.innerHTML = `
        <div class="feed-item-header">
          <span class="feed-item-type ${post.type}">${typeLabels[post.type] || '📢 Update'}</span>
          ${verdictBadges[verdict]}
        </div>
        <div class="feed-item-body">${escapeHtml(post.message)}</div>
        <div class="feed-item-route">
          <span class="route-badge">📍 ${escapeHtml(post.fromDisplay)} → ${escapeHtml(post.toDisplay)}</span>
        </div>
        <div class="feed-item-meta">
          <span>🕐 ${timeAgo(post.createdAt)}</span>
          <div class="feed-item-votes">
            <button class="vote-btn agree ${voted === 'agree' ? 'voted' : ''}" data-post="${post.id}" data-vote="agree">
              👍 Agree <span class="vote-count">${post.votes.agree}</span>
            </button>
            <button class="vote-btn disagree ${voted === 'disagree' ? 'voted' : ''}" data-post="${post.id}" data-vote="disagree">
              👎 Disagree <span class="vote-count">${post.votes.disagree}</span>
            </button>
          </div>
        </div>
      `;
      item.querySelectorAll('.vote-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          voteOnPost(btn.dataset.post, btn.dataset.vote);
        });
      });
      dom.feedList.appendChild(item);
    });
  }

  function timeAgo(isoString) {
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  // ===================== 📌 ROUTE-RELATED FEED =====================
  function renderRouteRelatedFeed() {
    if (!dom.routeFeedCard || !dom.routeFeedList || !dom.routeFeedCount) return;
    if (!currentResult) { dom.routeFeedCard.hidden = true; return; }
    const origin = String(currentResult.origin || '').toLowerCase();
    const destination = String(currentResult.destination || '').toLowerCase();
    const posts = getFeedPosts();
    const related = posts.filter(p => {
      const pf = String(p.from || '').toLowerCase();
      const pt = String(p.to || '').toLowerCase();
      return (pf === origin || pf === destination || pt === origin || pt === destination ||
              pf.includes(origin) || origin.includes(pf) ||
              pf.includes(destination) || destination.includes(pf) ||
              pt.includes(origin) || origin.includes(pt) ||
              pt.includes(destination) || destination.includes(pt));
    });
    if (!related.length) { dom.routeFeedCard.hidden = true; return; }
    dom.routeFeedCard.hidden = false;
    dom.routeFeedTitle.textContent = `📍 Related Updates for ${titleCase(origin)} → ${titleCase(destination)}`;
    dom.routeFeedCount.textContent = `${related.length} update${related.length > 1 ? 's' : ''}`;
    dom.routeFeedList.innerHTML = '';
    const votes = getFeedVotes();
    const uid = getUserId();
    related.slice(0, 5).forEach(post => {
      const verdict = getVerdict(post);
      const voted = votes[`${post.id}::${uid}`];
      const typeLabels = { traffic_jam: '🚦 Traffic Jam', road_closure: '🚧 Road Closure', accident: '🚑 Accident', alternative: '🔄 Alternative', bus_delay: '⏰ Bus Delay', general: '📢 Update' };
      const verdictBadges = { verified: '<span class="feed-item-verdict verdict-verified">✅ Verified</span>', disputed: '<span class="feed-item-verdict verdict-disputed">⚠️ Disputed</span>', neutral: '' };
      const item = document.createElement('div');
      item.className = `feed-item`;
      item.innerHTML = `
        <div class="feed-item-header">
          <span class="feed-item-type ${post.type}">${typeLabels[post.type] || '📢 Update'}</span>
          ${verdictBadges[verdict]}
        </div>
        <div class="feed-item-body">${escapeHtml(post.message)}</div>
        <div class="feed-item-route">
          <span class="route-badge">📍 ${escapeHtml(post.fromDisplay)} → ${escapeHtml(post.toDisplay)}</span>
        </div>
        <div class="feed-item-meta">
          <span>🕐 ${timeAgo(post.createdAt)}</span>
          <div class="feed-item-votes">
            <button class="vote-btn agree ${voted === 'agree' ? 'voted' : ''}" data-post="${post.id}" data-vote="agree">
              👍 ${post.votes.agree}
            </button>
            <button class="vote-btn disagree ${voted === 'disagree' ? 'voted' : ''}" data-post="${post.id}" data-vote="disagree">
              👎 ${post.votes.disagree}
            </button>
          </div>
        </div>
      `;
      item.querySelectorAll('.vote-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          voteOnPost(btn.dataset.post, btn.dataset.vote);
        });
      });
      dom.routeFeedList.appendChild(item);
    });
  }

  // ===================== Init new systems =====================
  // Patch init to add new systems
  const origRenderAll = renderAll;
  renderAll = function() {
    if (!currentResult) return;
    origRenderAll();
    showRatingForCurrentRoute();
    renderRouteRelatedFeed();
  };

  // Init all new systems after DOM ready (called from existing init)
  // We use a micro-check to ensure dom is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initRatingSystem();
      initCrowdsourceSystem();
      initFeedSystem();
    });
  } else {
    initRatingSystem();
    initCrowdsourceSystem();
    initFeedSystem();
  }
})();
