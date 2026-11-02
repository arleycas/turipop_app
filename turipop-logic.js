/* TuriPOP · lógica de personalización y recomendación.
 * Funciona en el navegador (window.TuriLogic) y en Node (module.exports) para las pruebas.
 * Sin dependencias externas. */
(function (root) {
  'use strict';

  var CATS = ['stay', 'food', 'activity', 'fun'];
  var DUR_RANK = { short: 0, mid: 1, long: 2 };
  /* Cupos por categoría según el tiempo disponible: siempre varias opciones de entretenimiento */
  var PER_CAT = {
    short: { stay: 1, food: 1, activity: 2, fun: 3 },
    mid: { stay: 1, food: 2, activity: 3, fun: 4 },
    long: { stay: 2, food: 3, activity: 4, fun: 5 }
  };
  var LIMIT = {};
  Object.keys(PER_CAT).forEach(function (d) {
    LIMIT[d] = CATS.reduce(function (s, k) { return s + PER_CAT[d][k]; }, 0);
  });

  var LANGS = ['es', 'en', 'pt'];
  /* Elige el texto según idioma (si falta portugués se usa español) */
  function tx(lang, es, en, pt) { return lang === 'en' ? en : lang === 'pt' ? (pt || es) : es; }

  var LABELS = {
    reason: {
      tourism: { es: 'Turismo', en: 'Tourism', pt: 'Turismo' },
      business: { es: 'Negocios', en: 'Business', pt: 'Negócios' },
      family: { es: 'Familia', en: 'Family', pt: 'Família' }
    },
    company: {
      solo: { es: 'Solo', en: 'Solo', pt: 'Sozinho' },
      couple: { es: 'Pareja', en: 'Couple', pt: 'Casal' },
      family: { es: 'Familia con niños', en: 'Family with kids', pt: 'Família com crianças' },
      friends: { es: 'Amigos', en: 'Friends', pt: 'Amigos' }
    },
    cat: {
      stay: { es: 'Alojamiento', en: 'Stay', pt: 'Hospedagem' },
      food: { es: 'Gastronomía', en: 'Food', pt: 'Gastronomia' },
      activity: { es: 'Cultura y paseos', en: 'Sightseeing', pt: 'Cultura e passeios' },
      fun: { es: 'Entretenimiento', en: 'Entertainment', pt: 'Entretenimento' }
    },
    type: {
      culture: { es: 'Cultura', en: 'Culture', pt: 'Cultura' },
      nature: { es: 'Naturaleza', en: 'Nature', pt: 'Natureza' },
      beach: { es: 'Playa', en: 'Beach', pt: 'Praia' },
      events: { es: 'Eventos', en: 'Events', pt: 'Eventos' },
      nightlife: { es: 'Vida nocturna', en: 'Nightlife', pt: 'Vida noturna' },
      show: { es: 'Espectáculo', en: 'Show', pt: 'Espetáculo' },
      park: { es: 'Parque y diversión', en: 'Theme park & fun', pt: 'Parque e diversão' },
      sport: { es: 'Deporte', en: 'Sports', pt: 'Esporte' },
      adventure: { es: 'Aventura', en: 'Adventure', pt: 'Aventura' },
      wellness: { es: 'Bienestar', en: 'Wellness', pt: 'Bem-estar' },
      game: { es: 'Juegos', en: 'Games', pt: 'Jogos' }
    },
    diet: {
      vegetarian: { es: 'Vegetariano', en: 'Vegetarian', pt: 'Vegetariano' },
      vegan: { es: 'Vegano', en: 'Vegan', pt: 'Vegano' },
      glutenfree: { es: 'Sin gluten', en: 'Gluten-free', pt: 'Sem glúten' },
      halal: { es: 'Halal', en: 'Halal', pt: 'Halal' }
    }
  };

  /* ---- Geografía ----
   * Origen: países frecuentes en El Dorado + "Otro". Cada país incluye "Otra ciudad".
   * c: [id, nombre_es, nombre_en?, nombre_pt?] (si falta un idioma se usa el nombre en español). */
  var OTHER_CITY = ['other', 'Otra ciudad', 'Other city', 'Outra cidade'];
  var ORIGINS = [
    { id: 'CO', es: 'Colombia', en: 'Colombia', pt: 'Colômbia', c: [['bog', 'Bogotá'], ['mde', 'Medellín'], ['clo', 'Cali'], ['baq', 'Barranquilla'], ['ctg', 'Cartagena'], ['bga', 'Bucaramanga'], ['pei', 'Pereira'], ['smr', 'Santa Marta'], ['cuc', 'Cúcuta']] },
    { id: 'US', es: 'Estados Unidos', en: 'United States', pt: 'Estados Unidos', c: [['mia', 'Miami'], ['nyc', 'Nueva York', 'New York', 'Nova York'], ['orl', 'Orlando'], ['fll', 'Fort Lauderdale'], ['hou', 'Houston'], ['atl', 'Atlanta'], ['lax', 'Los Ángeles', 'Los Angeles', 'Los Angeles']] },
    { id: 'MX', es: 'México', en: 'Mexico', pt: 'México', c: [['mex', 'Ciudad de México', 'Mexico City', 'Cidade do México'], ['cun', 'Cancún'], ['gdl', 'Guadalajara'], ['mty', 'Monterrey']] },
    { id: 'ES', es: 'España', en: 'Spain', pt: 'Espanha', c: [['mad', 'Madrid'], ['bcn', 'Barcelona']] },
    { id: 'PA', es: 'Panamá', en: 'Panama', pt: 'Panamá', c: [['pty', 'Ciudad de Panamá', 'Panama City', 'Cidade do Panamá']] },
    { id: 'PE', es: 'Perú', en: 'Peru', pt: 'Peru', c: [['lim', 'Lima']] },
    { id: 'EC', es: 'Ecuador', en: 'Ecuador', pt: 'Equador', c: [['uio', 'Quito'], ['gye', 'Guayaquil']] },
    { id: 'VE', es: 'Venezuela', en: 'Venezuela', pt: 'Venezuela', c: [['ccs', 'Caracas']] },
    { id: 'BR', es: 'Brasil', en: 'Brazil', pt: 'Brasil', c: [['sao', 'São Paulo'], ['rio', 'Río de Janeiro', 'Rio de Janeiro', 'Rio de Janeiro']] },
    { id: 'AR', es: 'Argentina', en: 'Argentina', pt: 'Argentina', c: [['bue', 'Buenos Aires']] },
    { id: 'CL', es: 'Chile', en: 'Chile', pt: 'Chile', c: [['scl', 'Santiago']] },
    { id: 'CR', es: 'Costa Rica', en: 'Costa Rica', pt: 'Costa Rica', c: [['sjo', 'San José']] },
    { id: 'DO', es: 'República Dominicana', en: 'Dominican Republic', pt: 'República Dominicana', c: [['sdq', 'Santo Domingo'], ['puj', 'Punta Cana']] },
    { id: 'CA', es: 'Canadá', en: 'Canada', pt: 'Canadá', c: [['yyz', 'Toronto'], ['yul', 'Montreal']] },
    { id: 'GB', es: 'Reino Unido', en: 'United Kingdom', pt: 'Reino Unido', c: [['lon', 'Londres', 'London', 'Londres']] },
    { id: 'FR', es: 'Francia', en: 'France', pt: 'França', c: [['par', 'París', 'Paris', 'Paris']] },
    { id: 'DE', es: 'Alemania', en: 'Germany', pt: 'Alemanha', c: [['fra', 'Fráncfort', 'Frankfurt', 'Frankfurt']] },
    { id: 'OT', es: 'Otro país', en: 'Other country', pt: 'Outro país', c: [] }
  ];
  ORIGINS.forEach(function (o) { o.c.push(OTHER_CITY); });

  /* Destino: ciudades de Colombia con catálogo propio. airport = aeropuerto de referencia para "mins". */
  var DESTINATIONS = [
    { id: 'CO', es: 'Colombia', en: 'Colombia', pt: 'Colômbia', c: [
      ['bog', 'Bogotá'], ['mde', 'Medellín'], ['ctg', 'Cartagena'], ['clo', 'Cali'],
      ['smr', 'Santa Marta'], ['eje', 'Eje Cafetero (Pereira · Armenia)', 'Coffee Region (Pereira · Armenia)', 'Eixo Cafeeiro (Pereira · Armenia)']] }
  ];
  var AIRPORTS = { bog: 'El Dorado', mde: 'José María Córdova', ctg: 'Rafael Núñez', clo: 'Alfonso Bonilla Aragón', smr: 'Simón Bolívar', eje: 'Matecaña' };

  function findCountry(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
  function countries(list, lang) { return list.map(function (o) { return { id: o.id, name: o[lang] || o.es }; }); }
  function cities(list, countryId, lang) {
    var co = findCountry(list, countryId);
    var col = { en: 2, pt: 3 }[lang];
    return co ? co.c.map(function (x) { return { id: x[0], name: (col && x[col]) || x[1] }; }) : [];
  }
  function cityName(list, countryId, cityId, lang) {
    var cs = cities(list, countryId, lang);
    for (var i = 0; i < cs.length; i++) if (cs[i].id === cityId) return cs[i].name;
    return '';
  }
  function destName(c, lang) {
    var n = cityName(DESTINATIONS, c.destCountry || 'CO', c.destCity, lang);
    return n.replace(/ \(.*\)$/, ''); // "Eje Cafetero (Pereira · Armenia)" -> "Eje Cafetero"
  }
  /* nacional / internacional se deriva del país de origen */
  function isInternational(c) {
    if (c.originCountry) return c.originCountry !== 'CO';
    return c.origin === 'international';
  }

  /* Catálogo (datos de referencia, inventados/aproximados: revisar antes de publicar).
   * cat: stay | food | activity (cultura y paseos) | fun (entretenimiento) · type: subtipo (ver LABELS.type)
   * price: 1=$ 2=$$ 3=$$$ · cost: COP por persona (alojamiento: por noche; 0 = gratis)
   * dur: minutos que toma la experiencia · h: horarios [[díaDesde, díaHasta, abre, cierra]] (0=lunes … 6=domingo)
   * mins: minutos aprox. desde el aeropuerto de la ciudad (sin tráfico) · adults: no apto para familias con niños
   * cin/cout: check-in / check-out (alojamiento) · city: id del destino (por defecto 'bog') */
  var ALL = ['solo', 'couple', 'family', 'friends'];
  var NOKIDS = ['solo', 'couple', 'friends'];
  var D24 = [[0, 6, '00:00', '24:00']];
  var PLACES = [
    // ================= BOGOTÁ · Alojamiento
    { id: 'selina', cat: 'stay', n: 'Selina La Candelaria', price: 1, cost: 70000, cin: '14:00', cout: '11:00', reasons: ['tourism'], company: ['solo', 'friends'], mins: 35, ic: 'bed',
      d_es: 'Hostal boutique en el centro histórico', d_en: 'Boutique hostel in the historic center' },
    { id: 'ghl', cat: 'stay', n: 'GHL Hotel Capital', price: 2, cost: 320000, reasons: ['business', 'tourism'], company: ['solo', 'couple', 'family'], nearAirport: true, mins: 10, ic: 'bed',
      d_es: 'Sobre la Av. El Dorado, cerca del aeropuerto', d_en: 'On Av. El Dorado, close to the airport' },
    { id: 'plaza', cat: 'stay', n: 'Hotel Bogotá Plaza', price: 2, cost: 280000, reasons: ['tourism', 'business'], company: ['solo', 'couple', 'friends'], mins: 30, ic: 'bed',
      d_es: 'Norte de la ciudad, cerca de Usaquén', d_en: 'North of the city, near Usaquén' },
    { id: 'estelar', cat: 'stay', n: 'Estelar Suites', price: 2, cost: 350000, reasons: ['family', 'tourism'], company: ['family', 'couple'], mins: 25, ic: 'bed',
      d_es: 'Suites amplias para familias', d_en: 'Spacious family suites' },
    { id: 'hilton', cat: 'stay', n: 'Hilton Garden Inn Bogotá Airport', price: 3, cost: 520000, reasons: ['business'], company: ['solo', 'couple'], nearAirport: true, mins: 8, ic: 'bed',
      d_es: 'Ideal para escalas y reuniones', d_en: 'Ideal for layovers and meetings' },
    { id: 'clickclack', cat: 'stay', n: 'Hotel Click Clack', price: 3, cost: 600000, reasons: ['business', 'tourism'], company: ['solo', 'couple', 'friends'], mins: 30, ic: 'bed',
      d_es: 'Hotel de diseño en la zona empresarial', d_en: 'Design hotel in the business district' },

    // ---- Gastronomía (diet: restricciones que atiende)
    { id: 'puertafalsa', cat: 'food', n: 'La Puerta Falsa', price: 1, cost: 25000, dur: 45, h: [[0, 6, '07:00', '22:00']], reasons: ['tourism', 'family'], company: ALL, diet: [], mins: 35, ic: 'food',
      d_es: 'Tamales y chocolate santafereño desde 1816', d_en: 'Tamales and hot chocolate since 1816' },
    { id: 'quinua', cat: 'food', n: 'Quinua y Amaranto', price: 1, cost: 22000, dur: 60, h: [[0, 5, '12:00', '16:00']], reasons: ['tourism'], company: NOKIDS, diet: ['vegetarian', 'vegan', 'glutenfree'], mins: 35, ic: 'food',
      d_es: 'Cocina vegetariana casera en La Candelaria', d_en: 'Homestyle vegetarian food in La Candelaria' },
    { id: 'crepes', cat: 'food', n: 'Crepes & Waffles', price: 2, cost: 45000, dur: 75, h: [[0, 6, '11:30', '21:30']], reasons: ['family', 'tourism'], company: ALL, diet: ['vegetarian', 'glutenfree'], mins: 20, ic: 'food',
      d_es: 'Menú variado, ideal para niños', d_en: 'Varied menu, kid-friendly' },
    { id: 'wok', cat: 'food', n: 'Wok', price: 2, cost: 50000, dur: 75, h: [[0, 6, '12:00', '22:00']], reasons: ['tourism', 'business'], company: ALL, diet: ['vegetarian', 'vegan', 'glutenfree'], mins: 20, ic: 'food',
      d_es: 'Cocina asiática con opciones veganas', d_en: 'Asian food with vegan options' },
    { id: 'andres', cat: 'food', n: 'Andrés D.C.', price: 3, cost: 120000, dur: 180, h: [[0, 2, '12:00', '23:00'], [3, 6, '12:00', '03:00']], reasons: ['tourism'], company: ['friends', 'couple', 'family'], diet: ['vegetarian'], mins: 30, ic: 'food',
      d_es: 'Comida típica y ambiente de fiesta', d_en: 'Typical food and party vibe' },
    { id: 'criterion', cat: 'food', n: 'Criterión', price: 3, cost: 180000, dur: 120, h: [[0, 5, '12:00', '23:00']], reasons: ['business'], company: ['solo', 'couple'], diet: [], mins: 30, ic: 'food',
      d_es: 'Alta cocina para comidas de negocios', d_en: 'Fine dining for business meals' },

    // ---- Cultura y paseos
    { id: 'monserrate', cat: 'activity', type: 'nature', n: 'Monserrate', price: 1, cost: 30000, dur: 180, h: [[0, 5, '06:00', '22:00'], [6, 6, '05:30', '18:00']], reasons: ['tourism'], company: ALL, mins: 40, ic: 'leaf',
      d_es: 'Vista panorámica en teleférico o funicular', d_en: 'Panoramic view by cable car or funicular' },
    { id: 'museooro', cat: 'activity', type: 'culture', n: 'Museo del Oro', price: 1, cost: 5000, dur: 120, h: [[1, 5, '09:00', '18:00'], [6, 6, '10:00', '16:00']], reasons: ['tourism', 'family'], company: ALL, mins: 30, ic: 'star',
      d_es: 'La mayor colección de orfebrería prehispánica', d_en: 'Largest pre-Hispanic goldwork collection' },
    { id: 'simonbolivar', cat: 'activity', type: 'nature', n: 'Parque Simón Bolívar', price: 1, cost: 0, dur: 180, h: [[0, 6, '06:00', '18:00']], reasons: ['family', 'tourism'], company: ['family', 'friends', 'couple'], mins: 20, ic: 'family',
      d_es: 'Gran parque urbano con lago y ciclorrutas', d_en: 'Large urban park with a lake and bike paths' },
    { id: 'grafiti', cat: 'activity', type: 'culture', n: 'Tour de grafiti · La Candelaria', price: 1, cost: 40000, dur: 150, h: [[0, 6, '10:00', '14:00']], reasons: ['tourism'], company: NOKIDS, mins: 35, ic: 'star',
      d_es: 'Arte urbano a pie con guía', d_en: 'Guided street-art walk' },
    { id: 'maloka', cat: 'activity', type: 'culture', n: 'Maloka', price: 2, cost: 35000, dur: 180, h: [[1, 6, '09:00', '17:00']], reasons: ['family'], company: ['family'], mins: 20, ic: 'family',
      d_es: 'Museo interactivo de ciencia', d_en: 'Interactive science museum' },
    { id: 'agora', cat: 'activity', type: 'events', n: 'Ágora Bogotá', price: 2, cost: 0, dur: 240, h: [[0, 4, '07:00', '19:00']], reasons: ['business'], company: ['solo'], nearAirport: true, mins: 15, ic: 'brief',
      d_es: 'Centro de convenciones y ferias', d_en: 'Convention and trade-fair center' },
    { id: 'zipaquira', cat: 'activity', type: 'culture', n: 'Catedral de Sal de Zipaquirá', price: 2, cost: 120000, dur: 480, h: [[0, 6, '09:00', '17:30']], reasons: ['tourism', 'family'], company: ALL, mins: 75, minDuration: 'long', ic: 'star',
      d_es: 'Excursión de día completo fuera de Bogotá', d_en: 'Full-day trip outside Bogotá' },

    // ---- Entretenimiento
    { id: 'zonat', cat: 'fun', type: 'nightlife', n: 'Zona T / Parque 93', price: 2, cost: 80000, dur: 180, h: [[0, 6, '11:00', '02:00']], reasons: ['tourism', 'business'], company: NOKIDS, mins: 30, ic: 'music',
      d_es: 'Restaurantes, bares y compras', d_en: 'Restaurants, bars and shopping' },
    { id: 'bog-theatron', cat: 'fun', type: 'nightlife', n: 'Theatron', price: 2, cost: 50000, dur: 240, h: [[3, 5, '21:00', '03:00']], reasons: ['tourism'], company: ['friends', 'solo', 'couple'], adults: true, mins: 30, ic: 'music',
      d_es: 'Discoteca gigante con más de 10 ambientes', d_en: 'Huge nightclub with 10+ themed rooms' },
    { id: 'bog-salitre', cat: 'fun', type: 'park', n: 'Salitre Mágico', price: 2, cost: 75000, dur: 300, h: [[4, 6, '10:00', '18:00']], reasons: ['family', 'tourism'], company: ['family', 'friends', 'couple'], nearAirport: true, mins: 15, ic: 'ticket',
      d_es: 'Parque de diversiones con atracciones para todas las edades', d_en: 'Amusement park with rides for all ages' },
    { id: 'bog-colon', cat: 'fun', type: 'show', n: 'Teatro Colón', price: 2, cost: 60000, dur: 150, h: [[2, 5, '19:30', '22:00'], [6, 6, '16:00', '18:30']], reasons: ['tourism', 'business'], company: ALL, mins: 35, ic: 'music',
      d_es: 'Ópera, conciertos y danza en un teatro de 1892', d_en: 'Opera, concerts and dance in an 1892 theater' },
    { id: 'bog-ciclovia', cat: 'fun', type: 'sport', n: 'Ciclovía dominical', price: 1, cost: 15000, dur: 180, h: [[6, 6, '07:00', '14:00']], reasons: ['tourism', 'family'], company: ALL, mins: 25, ic: 'bolt',
      d_es: 'Más de 100 km de vías cerradas para bici (alquiler incluido)', d_en: '100+ km of car-free roads for biking (rental included)' },
    { id: 'bog-tejo', cat: 'fun', type: 'game', n: 'Juego de tejo · La Candelaria', price: 1, cost: 30000, dur: 120, h: [[1, 5, '16:00', '23:00']], reasons: ['tourism', 'business'], company: NOKIDS, adults: true, mins: 35, ic: 'ticket',
      d_es: 'El deporte nacional: lanza el tejo y explota la mecha', d_en: 'The national sport: throw the puck and pop the gunpowder' },

    // ================= MEDELLÍN (aeropuerto en Rionegro, ~45 min de la ciudad)
    { id: 'mde-viajero', city: 'mde', cat: 'stay', n: 'Viajero Medellín Hostel', price: 1, cost: 65000, cin: '14:00', cout: '11:00', reasons: ['tourism'], company: ['solo', 'friends'], mins: 50, ic: 'bed',
      d_es: 'Hostal social en Laureles', d_en: 'Social hostel in Laureles' },
    { id: 'mde-dann', city: 'mde', cat: 'stay', n: 'Hotel Dann Carlton Medellín', price: 2, cost: 340000, reasons: ['business', 'family', 'tourism'], company: ['solo', 'couple', 'family'], mins: 45, ic: 'bed',
      d_es: 'Clásico en El Poblado', d_en: 'Classic hotel in El Poblado' },
    { id: 'mde-charlee', city: 'mde', cat: 'stay', n: 'The Charlee Hotel', price: 3, cost: 650000, reasons: ['tourism', 'business'], company: ['couple', 'friends', 'solo'], mins: 45, ic: 'bed',
      d_es: 'Hotel de diseño con terraza en Provenza', d_en: 'Design hotel with rooftop in Provenza' },
    { id: 'mde-hatoviejo', city: 'mde', cat: 'food', n: 'Hatoviejo', price: 2, cost: 60000, dur: 90, h: [[0, 6, '12:00', '22:00']], reasons: ['tourism', 'family'], company: ALL, diet: [], mins: 45, ic: 'food',
      d_es: 'Bandeja paisa y comida antioqueña', d_en: 'Bandeja paisa and Antioquian food' },
    { id: 'mde-verdeo', city: 'mde', cat: 'food', n: 'Verdeo', price: 1, cost: 35000, dur: 60, h: [[0, 5, '12:00', '21:00']], reasons: ['tourism'], company: NOKIDS, diet: ['vegetarian', 'vegan'], mins: 45, ic: 'food',
      d_es: 'Restaurante 100% vegetal', d_en: '100% plant-based restaurant' },
    { id: 'mde-elcielo', city: 'mde', cat: 'food', n: 'El Cielo', price: 3, cost: 450000, dur: 180, h: [[1, 5, '19:00', '23:00']], reasons: ['business', 'tourism'], company: ['couple', 'solo'], diet: ['vegetarian'], mins: 45, ic: 'food',
      d_es: 'Menú degustación de alta cocina colombiana', d_en: 'Colombian fine-dining tasting menu' },
    { id: 'mde-comuna13', city: 'mde', cat: 'activity', type: 'culture', n: 'Comuna 13 · Graffitour', price: 1, cost: 60000, dur: 180, h: [[0, 6, '09:00', '17:00']], reasons: ['tourism'], company: NOKIDS, mins: 60, ic: 'star',
      d_es: 'Arte urbano y escaleras eléctricas con guía local', d_en: 'Street art and outdoor escalators with a local guide' },
    { id: 'mde-arvi', city: 'mde', cat: 'activity', type: 'nature', n: 'Metrocable y Parque Arví', price: 1, cost: 25000, dur: 300, h: [[1, 6, '09:00', '17:00']], reasons: ['tourism', 'family'], company: ALL, mins: 50, ic: 'leaf',
      d_es: 'Teleférico y bosque sobre la ciudad', d_en: 'Cable car and forest above the city' },
    { id: 'mde-explora', city: 'mde', cat: 'activity', type: 'culture', n: 'Parque Explora', price: 2, cost: 45000, dur: 180, h: [[1, 6, '09:00', '17:00']], reasons: ['family'], company: ['family'], mins: 50, ic: 'family',
      d_es: 'Museo interactivo y acuario', d_en: 'Interactive museum and aquarium' },
    { id: 'mde-pueblito', city: 'mde', cat: 'activity', type: 'culture', n: 'Pueblito Paisa · Cerro Nutibara', price: 1, cost: 0, dur: 90, h: [[0, 6, '06:00', '22:00']], reasons: ['tourism', 'family', 'business'], company: ALL, mins: 45, ic: 'star',
      d_es: 'Réplica de pueblo antioqueño con mirador', d_en: 'Replica Antioquian village with a viewpoint' },
    { id: 'mde-botanico', city: 'mde', cat: 'activity', type: 'nature', n: 'Jardín Botánico', price: 1, cost: 0, dur: 120, h: [[0, 6, '09:00', '17:00']], reasons: ['tourism', 'family'], company: ALL, mins: 50, ic: 'leaf',
      d_es: 'Orquideorama y senderos, entrada libre', d_en: 'Orchid house and trails, free entry' },
    { id: 'mde-guatape', city: 'mde', cat: 'activity', type: 'nature', n: 'Guatapé y Piedra del Peñol', price: 2, cost: 150000, dur: 600, h: [[0, 6, '07:00', '19:00']], reasons: ['tourism', 'family'], company: ALL, mins: 75, minDuration: 'long', ic: 'leaf',
      d_es: 'Excursión de día completo con 740 escalones', d_en: 'Full-day trip with 740 steps to climb' },
    { id: 'mde-provenza', city: 'mde', cat: 'fun', type: 'nightlife', n: 'Provenza y Parque Lleras', price: 2, cost: 90000, dur: 240, h: [[3, 5, '20:00', '03:00']], reasons: ['tourism', 'business'], company: NOKIDS, adults: true, mins: 45, ic: 'music',
      d_es: 'Bares, terrazas y discotecas en El Poblado', d_en: 'Bars, rooftops and clubs in El Poblado' },
    { id: 'mde-sonhavana', city: 'mde', cat: 'fun', type: 'nightlife', n: 'Son Havana', price: 1, cost: 20000, dur: 180, h: [[2, 5, '21:00', '02:00']], reasons: ['tourism'], company: NOKIDS, adults: true, mins: 50, ic: 'music',
      d_es: 'Salsa y son cubano en vivo en Laureles', d_en: 'Live salsa and Cuban son in Laureles' },
    { id: 'mde-parquenorte', city: 'mde', cat: 'fun', type: 'park', n: 'Parque Norte', price: 1, cost: 45000, dur: 240, h: [[4, 6, '10:00', '18:00']], reasons: ['family', 'tourism'], company: ['family', 'friends'], mins: 50, ic: 'ticket',
      d_es: 'Parque de diversiones con montaña rusa', d_en: 'Amusement park with a roller coaster' },
    { id: 'mde-atanasio', city: 'mde', cat: 'fun', type: 'sport', n: 'Fútbol en el Atanasio Girardot', price: 2, cost: 80000, dur: 180, h: [[5, 6, '18:00', '21:00']], reasons: ['tourism', 'business'], company: ['friends', 'solo', 'couple'], mins: 50, ic: 'bolt',
      d_es: 'Partido de liga con hinchada paisa (según calendario)', d_en: 'League match with local fans (per fixture list)' },
    { id: 'mde-parapente', city: 'mde', cat: 'fun', type: 'adventure', n: 'Parapente en San Félix', price: 3, cost: 250000, dur: 180, h: [[0, 6, '09:00', '17:00']], reasons: ['tourism'], company: NOKIDS, mins: 60, minDuration: 'mid', ic: 'bolt',
      d_es: 'Vuelo en tándem sobre el valle de Aburrá', d_en: 'Tandem flight over the Aburrá Valley' },

    // ================= CARTAGENA (aeropuerto a ~15 min del centro)
    { id: 'ctg-selina', city: 'ctg', cat: 'stay', n: 'Selina Cartagena', price: 1, cost: 90000, cin: '14:00', cout: '11:00', reasons: ['tourism'], company: ['solo', 'friends'], nearAirport: true, mins: 15, ic: 'bed',
      d_es: 'Hostal en Getsemaní', d_en: 'Hostel in Getsemaní' },
    { id: 'ctg-caribe', city: 'ctg', cat: 'stay', n: 'Hotel Caribe by Faranda', price: 2, cost: 420000, reasons: ['family', 'tourism', 'business'], company: ['family', 'couple', 'solo'], mins: 25, ic: 'bed',
      d_es: 'Frente al mar en Bocagrande', d_en: 'Beachfront in Bocagrande' },
    { id: 'ctg-sanagustin', city: 'ctg', cat: 'stay', n: 'Casa San Agustín', price: 3, cost: 1200000, reasons: ['tourism'], company: ['couple'], nearAirport: true, mins: 15, ic: 'bed',
      d_es: 'Hotel boutique en la Ciudad Amurallada', d_en: 'Boutique hotel in the Walled City' },
    { id: 'ctg-cevicheria', city: 'ctg', cat: 'food', n: 'La Cevichería', price: 2, cost: 80000, dur: 75, h: [[0, 6, '12:00', '23:00']], reasons: ['tourism'], company: NOKIDS, diet: ['glutenfree'], mins: 15, ic: 'food',
      d_es: 'Ceviches y cocina de mar', d_en: 'Ceviche and seafood' },
    { id: 'ctg-crepes', city: 'ctg', cat: 'food', n: 'Crepes & Waffles', price: 2, cost: 45000, dur: 75, h: [[0, 6, '11:30', '22:00']], reasons: ['family', 'tourism', 'business'], company: ALL, diet: ['vegetarian', 'glutenfree'], mins: 20, ic: 'food',
      d_es: 'Menú variado, ideal para niños', d_en: 'Varied menu, kid-friendly' },
    { id: 'ctg-celele', city: 'ctg', cat: 'food', n: 'Celele', price: 3, cost: 250000, dur: 150, h: [[0, 5, '18:00', '23:00']], reasons: ['tourism', 'business'], company: NOKIDS, diet: ['vegetarian'], mins: 15, ic: 'food',
      d_es: 'Cocina caribeña de autor', d_en: 'Signature Caribbean cuisine' },
    { id: 'ctg-amurallada', city: 'ctg', cat: 'activity', type: 'culture', n: 'Ciudad Amurallada', price: 1, cost: 0, dur: 180, h: D24, reasons: ['tourism', 'family', 'business'], company: ALL, nearAirport: true, mins: 15, ic: 'star',
      d_es: 'Recorrido a pie por el centro histórico', d_en: 'Walking tour of the historic center' },
    { id: 'ctg-sanfelipe', city: 'ctg', cat: 'activity', type: 'culture', n: 'Castillo San Felipe', price: 1, cost: 30000, dur: 90, h: [[0, 6, '08:00', '18:00']], reasons: ['tourism', 'family'], company: ALL, mins: 15, ic: 'star',
      d_es: 'Fortaleza colonial con vista a la ciudad', d_en: 'Colonial fortress with city views' },
    { id: 'ctg-getsemani', city: 'ctg', cat: 'activity', type: 'culture', n: 'Plaza de la Trinidad · Getsemaní', price: 1, cost: 0, dur: 120, h: [[0, 6, '18:00', '23:00']], reasons: ['tourism', 'business', 'family'], company: ALL, nearAirport: true, mins: 15, ic: 'star',
      d_es: 'Murales, bailarines y música callejera al atardecer', d_en: 'Murals, dancers and street music at sunset' },
    { id: 'ctg-rosario', city: 'ctg', cat: 'activity', type: 'beach', n: 'Islas del Rosario', price: 2, cost: 220000, dur: 540, h: [[0, 6, '08:00', '16:00']], reasons: ['tourism', 'family'], company: ALL, mins: 60, minDuration: 'mid', ic: 'leaf',
      d_es: 'Día de playa en lancha con almuerzo', d_en: 'Beach day by boat with lunch' },
    { id: 'ctg-cafehavana', city: 'ctg', cat: 'fun', type: 'nightlife', n: 'Café Havana', price: 2, cost: 40000, dur: 180, h: [[2, 6, '20:00', '04:00']], reasons: ['tourism'], company: NOKIDS, adults: true, mins: 15, ic: 'music',
      d_es: 'Salsa en vivo en Getsemaní', d_en: 'Live salsa in Getsemaní' },
    { id: 'ctg-chiva', city: 'ctg', cat: 'fun', type: 'show', n: 'Chiva rumbera', price: 2, cost: 70000, dur: 180, h: [[0, 6, '20:00', '23:00']], reasons: ['tourism'], company: ['friends', 'couple', 'family'], mins: 20, ic: 'music',
      d_es: 'Bus típico con música, recorrido nocturno y fiesta', d_en: 'Colorful party bus with music on a night tour' },
    { id: 'ctg-cafedelmar', city: 'ctg', cat: 'fun', type: 'nightlife', n: 'Atardecer en Café del Mar', price: 3, cost: 90000, dur: 120, h: [[0, 6, '17:00', '02:00']], reasons: ['tourism', 'business'], company: NOKIDS, mins: 15, ic: 'music',
      d_es: 'Cócteles sobre las murallas frente al mar', d_en: 'Cocktails on the city walls facing the sea' },
    { id: 'ctg-kite', city: 'ctg', cat: 'fun', type: 'adventure', n: 'Kitesurf en La Boquilla', price: 3, cost: 280000, dur: 180, h: [[0, 6, '09:00', '17:00']], reasons: ['tourism'], company: NOKIDS, mins: 20, minDuration: 'mid', ic: 'bolt',
      d_es: 'Clase de iniciación con instructor', d_en: 'Beginner lesson with an instructor' },
    { id: 'ctg-totumo', city: 'ctg', cat: 'fun', type: 'wellness', n: 'Volcán del Totumo', price: 2, cost: 150000, dur: 300, h: [[0, 6, '08:00', '16:00']], reasons: ['tourism', 'family'], company: ALL, mins: 60, minDuration: 'mid', ic: 'leaf',
      d_es: 'Baño de lodo en un volcán con traslado', d_en: 'Mud bath in a volcano, transfer included' },

    // ================= CALI (aeropuerto a ~35 min)
    { id: 'clo-viajero', city: 'clo', cat: 'stay', n: 'Viajero Cali Hostel', price: 1, cost: 60000, cin: '14:00', cout: '11:00', reasons: ['tourism'], company: ['solo', 'friends'], mins: 35, ic: 'bed',
      d_es: 'Hostal con clases de salsa en San Antonio', d_en: 'Hostel with salsa classes in San Antonio' },
    { id: 'clo-spiwak', city: 'clo', cat: 'stay', n: 'Hotel Spiwak Chipichape', price: 2, cost: 330000, reasons: ['family', 'business', 'tourism'], company: ['family', 'couple', 'solo'], mins: 30, ic: 'bed',
      d_es: 'Junto al centro comercial Chipichape', d_en: 'Next to Chipichape mall' },
    { id: 'clo-intercontinental', city: 'clo', cat: 'stay', n: 'InterContinental Cali', price: 3, cost: 480000, reasons: ['business'], company: ['solo', 'couple'], mins: 35, ic: 'bed',
      d_es: 'Hotel ejecutivo junto al río Cali', d_en: 'Executive hotel by the Cali river' },
    { id: 'clo-zaguan', city: 'clo', cat: 'food', n: 'El Zaguán de San Antonio', price: 1, cost: 35000, dur: 75, h: [[0, 6, '12:00', '23:00']], reasons: ['tourism', 'family'], company: ALL, diet: [], mins: 35, ic: 'food',
      d_es: 'Comida vallecaucana con vista', d_en: 'Valle del Cauca food with a view' },
    { id: 'clo-crepes', city: 'clo', cat: 'food', n: 'Crepes & Waffles', price: 2, cost: 45000, dur: 75, h: [[0, 6, '11:30', '21:30']], reasons: ['family', 'tourism', 'business'], company: ALL, diet: ['vegetarian', 'glutenfree'], mins: 30, ic: 'food',
      d_es: 'Menú variado, ideal para niños', d_en: 'Varied menu, kid-friendly' },
    { id: 'clo-platillos', city: 'clo', cat: 'food', n: 'Platillos Voladores', price: 3, cost: 150000, dur: 120, h: [[0, 5, '12:00', '23:00']], reasons: ['business', 'tourism'], company: NOKIDS, diet: ['vegetarian'], mins: 35, ic: 'food',
      d_es: 'Cocina de autor del Pacífico', d_en: 'Signature Pacific cuisine' },
    { id: 'clo-cristorey', city: 'clo', cat: 'activity', type: 'nature', n: 'Cristo Rey', price: 1, cost: 20000, dur: 150, h: [[0, 6, '08:00', '17:00']], reasons: ['tourism', 'family'], company: ALL, mins: 50, ic: 'leaf',
      d_es: 'Mirador sobre la ciudad', d_en: 'Viewpoint over the city' },
    { id: 'clo-ermita', city: 'clo', cat: 'activity', type: 'culture', n: 'La Ermita y Bulevar del Río', price: 1, cost: 0, dur: 60, h: D24, reasons: ['tourism', 'business', 'family'], company: ALL, mins: 35, ic: 'star',
      d_es: 'Paseo por el centro junto al río Cali', d_en: 'Downtown walk along the Cali river' },
    { id: 'clo-pance', city: 'clo', cat: 'activity', type: 'nature', n: 'Río Pance', price: 1, cost: 0, dur: 240, h: [[0, 6, '08:00', '17:00']], reasons: ['tourism', 'family'], company: ['family', 'friends', 'couple'], mins: 45, ic: 'leaf',
      d_es: 'Charcos naturales y sancocho a la orilla del río', d_en: 'Natural pools and riverside stew' },
    { id: 'clo-tintindeo', city: 'clo', cat: 'fun', type: 'nightlife', n: 'Tin Tin Deo', price: 1, cost: 15000, dur: 180, h: [[3, 5, '21:00', '03:00']], reasons: ['tourism'], company: NOKIDS, adults: true, mins: 35, ic: 'music',
      d_es: 'Salsa en vivo, la capital de la salsa', d_en: 'Live salsa in the salsa capital' },
    { id: 'clo-delirio', city: 'clo', cat: 'fun', type: 'show', n: 'Delirio', price: 3, cost: 200000, dur: 240, h: [[4, 4, '20:00', '01:00']], reasons: ['tourism', 'business'], company: ['couple', 'friends', 'solo'], mins: 30, ic: 'music',
      d_es: 'Espectáculo de salsa, circo y orquesta', d_en: 'Salsa, circus and big-band show' },
    { id: 'clo-clasesalsa', city: 'clo', cat: 'fun', type: 'sport', n: 'Clase de salsa caleña', price: 1, cost: 40000, dur: 90, h: [[0, 5, '10:00', '20:00']], reasons: ['tourism', 'business', 'family'], company: ALL, mins: 35, ic: 'bolt',
      d_es: 'Aprende los pasos básicos con bailarines profesionales', d_en: 'Learn the basic steps with professional dancers' },
    { id: 'clo-zoo', city: 'clo', cat: 'fun', type: 'park', n: 'Zoológico de Cali', price: 2, cost: 30000, dur: 240, h: [[0, 6, '09:00', '16:30']], reasons: ['family', 'tourism'], company: ['family', 'couple', 'friends'], mins: 40, ic: 'family',
      d_es: 'Uno de los mejores zoológicos del país', d_en: 'One of the best zoos in the country' },
    { id: 'clo-acuaparque', city: 'clo', cat: 'fun', type: 'park', n: 'Acuaparque de la Caña', price: 1, cost: 25000, dur: 300, h: [[2, 6, '09:00', '17:00']], reasons: ['family'], company: ['family', 'friends'], mins: 30, ic: 'ticket',
      d_es: 'Piscinas de olas y toboganes', d_en: 'Wave pools and water slides' },

    // ================= SANTA MARTA (aeropuerto a ~20 min)
    { id: 'smr-masaya', city: 'smr', cat: 'stay', n: 'Masaya Santa Marta', price: 1, cost: 75000, cin: '14:00', cout: '11:00', reasons: ['tourism'], company: NOKIDS, mins: 25, ic: 'bed',
      d_es: 'Hostal con piscina en el centro histórico', d_en: 'Hostel with pool in the historic center' },
    { id: 'smr-zuana', city: 'smr', cat: 'stay', n: 'Hotel Zuana', price: 2, cost: 380000, reasons: ['family', 'tourism', 'business'], company: ['family', 'couple'], nearAirport: true, mins: 10, ic: 'bed',
      d_es: 'Resort frente al mar cerca del aeropuerto', d_en: 'Beach resort near the airport' },
    { id: 'smr-lulo', city: 'smr', cat: 'food', n: 'Lulo Café Bar', price: 1, cost: 30000, dur: 60, h: [[0, 6, '07:30', '22:00']], reasons: ['tourism', 'family'], company: ALL, diet: ['vegetarian', 'vegan'], mins: 25, ic: 'food',
      d_es: 'Arepas, jugos y opciones vegetarianas', d_en: 'Arepas, juices and vegetarian options' },
    { id: 'smr-ouzo', city: 'smr', cat: 'food', n: 'Ouzo', price: 2, cost: 85000, dur: 90, h: [[0, 5, '18:00', '23:00']], reasons: ['tourism', 'business'], company: NOKIDS, diet: ['vegetarian'], mins: 25, ic: 'food',
      d_es: 'Cocina mediterránea en el Parque de los Novios', d_en: 'Mediterranean food at Parque de los Novios' },
    { id: 'smr-rodadero', city: 'smr', cat: 'activity', type: 'beach', n: 'Playa El Rodadero', price: 1, cost: 0, dur: 240, h: [[0, 6, '06:00', '18:00']], reasons: ['tourism', 'family'], company: ALL, nearAirport: true, mins: 15, ic: 'leaf',
      d_es: 'Playa urbana con servicios', d_en: 'Urban beach with services' },
    { id: 'smr-quinta', city: 'smr', cat: 'activity', type: 'culture', n: 'Quinta de San Pedro Alejandrino', price: 1, cost: 30000, dur: 120, h: [[0, 6, '09:00', '16:30']], reasons: ['tourism', 'family', 'business'], company: ALL, mins: 20, ic: 'star',
      d_es: 'Hacienda donde murió Simón Bolívar, con jardín botánico', d_en: 'Hacienda where Simón Bolívar died, with botanical garden' },
    { id: 'smr-minca', city: 'smr', cat: 'activity', type: 'nature', n: 'Minca', price: 1, cost: 80000, dur: 480, h: [[0, 6, '07:00', '17:00']], reasons: ['tourism'], company: NOKIDS, mins: 50, minDuration: 'mid', ic: 'leaf',
      d_es: 'Cascadas y café en la Sierra Nevada', d_en: 'Waterfalls and coffee in the Sierra Nevada' },
    { id: 'smr-tayrona', city: 'smr', cat: 'activity', type: 'nature', n: 'Parque Nacional Tayrona', price: 2, cost: 90000, dur: 600, h: [[0, 6, '08:00', '17:00']], reasons: ['tourism', 'family'], company: ALL, mins: 60, minDuration: 'mid', ic: 'leaf',
      d_es: 'Playas vírgenes y selva (ingreso hasta las 14:00)', d_en: 'Pristine beaches and jungle (entry until 2 pm)' },
    { id: 'smr-novios', city: 'smr', cat: 'fun', type: 'nightlife', n: 'Parque de los Novios', price: 2, cost: 60000, dur: 180, h: [[0, 6, '18:00', '02:00']], reasons: ['tourism', 'business'], company: NOKIDS, mins: 25, ic: 'music',
      d_es: 'Bares y terrazas en el centro histórico', d_en: 'Bars and terraces in the historic center' },
    { id: 'smr-acuario', city: 'smr', cat: 'fun', type: 'park', n: 'Acuario Mundo Marino', price: 2, cost: 35000, dur: 150, h: [[0, 6, '08:30', '17:00']], reasons: ['family', 'tourism'], company: ['family', 'couple', 'friends'], nearAirport: true, mins: 15, ic: 'ticket',
      d_es: 'Tiburones, tortugas y especies del Caribe', d_en: 'Sharks, turtles and Caribbean species' },
    { id: 'smr-buceo', city: 'smr', cat: 'fun', type: 'adventure', n: 'Buceo en Taganga', price: 3, cost: 250000, dur: 240, h: [[0, 6, '08:00', '14:00']], reasons: ['tourism'], company: NOKIDS, mins: 25, minDuration: 'mid', ic: 'bolt',
      d_es: 'Inmersión guiada para principiantes, equipo incluido', d_en: 'Guided beginner dive, gear included' },
    { id: 'smr-kayak', city: 'smr', cat: 'fun', type: 'adventure', n: 'Kayak y snorkel en Bahía Concha', price: 2, cost: 120000, dur: 240, h: [[1, 6, '08:00', '15:00']], reasons: ['tourism', 'family'], company: ALL, mins: 35, ic: 'bolt',
      d_es: 'Remada por la bahía y snorkel entre corales', d_en: 'Paddle the bay and snorkel among corals' },
    { id: 'smr-bici', city: 'smr', cat: 'fun', type: 'sport', n: 'Tour en bici por el centro histórico', price: 1, cost: 60000, dur: 150, h: [[0, 6, '08:00', '17:00']], reasons: ['tourism', 'business'], company: ALL, mins: 25, ic: 'bolt',
      d_es: 'La ciudad más antigua de Colombia en dos ruedas', d_en: "Colombia's oldest city on two wheels" },

    // ================= EJE CAFETERO (aeropuerto Matecaña, Pereira)
    { id: 'eje-movich', city: 'eje', cat: 'stay', n: 'Movich Hotel de Pereira', price: 2, cost: 310000, reasons: ['business', 'tourism'], company: ['solo', 'couple'], nearAirport: true, mins: 15, ic: 'bed',
      d_es: 'Hotel ejecutivo en Pereira', d_en: 'Executive hotel in Pereira' },
    { id: 'eje-sanjose', city: 'eje', cat: 'stay', n: 'Hacienda San José', price: 3, cost: 550000, reasons: ['tourism', 'family'], company: ['couple', 'family'], mins: 20, ic: 'bed',
      d_es: 'Hacienda cafetera tradicional', d_en: 'Traditional coffee hacienda' },
    { id: 'eje-jesusmartin', city: 'eje', cat: 'food', n: 'Café Jesús Martín', price: 1, cost: 20000, dur: 45, h: [[0, 6, '08:00', '20:00']], reasons: ['tourism'], company: ALL, diet: ['vegetarian'], mins: 50, ic: 'food',
      d_es: 'Café de especialidad en Salento', d_en: 'Specialty coffee in Salento' },
    { id: 'eje-helena', city: 'eje', cat: 'food', n: 'Helena Adentro', price: 2, cost: 70000, dur: 90, h: [[2, 6, '12:00', '22:00']], reasons: ['tourism', 'business'], company: NOKIDS, diet: ['vegetarian'], mins: 60, ic: 'food',
      d_es: 'Cocina creativa en Filandia', d_en: 'Creative cuisine in Filandia' },
    { id: 'eje-cocora', city: 'eje', cat: 'activity', type: 'nature', n: 'Valle del Cocora', price: 1, cost: 20000, dur: 360, h: [[0, 6, '06:00', '17:00']], reasons: ['tourism'], company: ALL, mins: 60, minDuration: 'mid', ic: 'leaf',
      d_es: 'Palmas de cera, el árbol nacional', d_en: 'Wax palms, the national tree' },
    { id: 'eje-salento', city: 'eje', cat: 'activity', type: 'culture', n: 'Salento y su mirador', price: 1, cost: 0, dur: 180, h: D24, reasons: ['tourism', 'family'], company: ALL, mins: 50, ic: 'star',
      d_es: 'Pueblo de casas coloridas y artesanías', d_en: 'Town of colorful houses and crafts' },
    { id: 'eje-finca', city: 'eje', cat: 'activity', type: 'culture', n: 'Tour de café en finca', price: 2, cost: 70000, dur: 150, h: [[0, 6, '09:00', '16:00']], reasons: ['tourism', 'business', 'family'], company: ALL, mins: 40, ic: 'star',
      d_es: 'Del grano a la taza, con degustación', d_en: 'From bean to cup, with tasting' },
    { id: 'eje-parquecafe', city: 'eje', cat: 'fun', type: 'park', n: 'Parque del Café', price: 2, cost: 110000, dur: 480, h: [[2, 6, '09:00', '18:00']], reasons: ['family', 'tourism'], company: ['family', 'friends', 'couple'], mins: 60, ic: 'ticket',
      d_es: 'Parque temático con montañas rusas y show cafetero', d_en: 'Theme park with roller coasters and coffee show' },
    { id: 'eje-panaca', city: 'eje', cat: 'fun', type: 'park', n: 'PANACA', price: 2, cost: 95000, dur: 360, h: [[1, 6, '09:00', '18:00']], reasons: ['family'], company: ['family', 'couple'], mins: 60, ic: 'family',
      d_es: 'Parque agropecuario con animales y shows', d_en: 'Farm park with animals and shows' },
    { id: 'eje-termales', city: 'eje', cat: 'fun', type: 'wellness', n: 'Termales de Santa Rosa', price: 2, cost: 65000, dur: 240, h: [[0, 6, '09:00', '23:00']], reasons: ['tourism', 'family'], company: ['couple', 'family', 'friends'], mins: 40, ic: 'leaf',
      d_es: 'Aguas termales entre cascadas', d_en: 'Hot springs among waterfalls' },
    { id: 'eje-canopy', city: 'eje', cat: 'fun', type: 'adventure', n: 'Canopy y columpio extremo', price: 2, cost: 80000, dur: 90, h: [[0, 6, '08:00', '17:00']], reasons: ['tourism'], company: NOKIDS, mins: 50, ic: 'bolt',
      d_es: 'Tirolesa sobre cafetales y montañas', d_en: 'Zip line over coffee fields and mountains' },
    { id: 'eje-tejo', city: 'eje', cat: 'fun', type: 'game', n: 'Tejo en Salento', price: 1, cost: 30000, dur: 120, h: [[0, 6, '14:00', '22:00']], reasons: ['tourism'], company: NOKIDS, adults: true, mins: 50, ic: 'ticket',
      d_es: 'Prueba el deporte nacional con los locales', d_en: 'Try the national sport with locals' }
  ];
  /* Descripciones en portugués (por id de lugar) */
  var D_PT = {
    // Bogotá
    'selina': 'Hostel boutique no centro histórico',
    'ghl': 'Na Av. El Dorado, perto do aeroporto',
    'plaza': 'Norte da cidade, perto de Usaquén',
    'estelar': 'Suítes amplas para famílias',
    'hilton': 'Ideal para escalas e reuniões',
    'clickclack': 'Hotel de design na zona empresarial',
    'puertafalsa': 'Tamales e chocolate santafereño desde 1816',
    'quinua': 'Comida vegetariana caseira em La Candelaria',
    'crepes': 'Cardápio variado, ideal para crianças',
    'wok': 'Comida asiática com opções veganas',
    'andres': 'Comida típica e clima de festa',
    'criterion': 'Alta gastronomia para refeições de negócios',
    'monserrate': 'Vista panorâmica de teleférico ou funicular',
    'museooro': 'A maior coleção de ourivesaria pré-hispânica',
    'simonbolivar': 'Grande parque urbano com lago e ciclovias',
    'grafiti': 'Arte de rua a pé com guia',
    'maloka': 'Museu interativo de ciência',
    'agora': 'Centro de convenções e feiras',
    'zipaquira': 'Passeio de dia inteiro fora de Bogotá',
    'zonat': 'Restaurantes, bares e compras',
    'bog-theatron': 'Balada gigante com mais de 10 ambientes',
    'bog-salitre': 'Parque de diversões com atrações para todas as idades',
    'bog-colon': 'Ópera, concertos e dança em um teatro de 1892',
    'bog-ciclovia': 'Mais de 100 km de vias fechadas para bicicleta (aluguel incluído)',
    'bog-tejo': 'O esporte nacional: lance o tejo e estoure a pólvora',
    // Medellín
    'mde-viajero': 'Hostel social em Laureles',
    'mde-dann': 'Clássico em El Poblado',
    'mde-charlee': 'Hotel de design com terraço em Provenza',
    'mde-hatoviejo': 'Bandeja paisa e comida antioquenha',
    'mde-verdeo': 'Restaurante 100% vegetal',
    'mde-elcielo': 'Menu degustação de alta gastronomia colombiana',
    'mde-comuna13': 'Arte de rua e escadas rolantes com guia local',
    'mde-arvi': 'Teleférico e floresta acima da cidade',
    'mde-explora': 'Museu interativo e aquário',
    'mde-pueblito': 'Réplica de vilarejo antioquenho com mirante',
    'mde-botanico': 'Orquidário e trilhas, entrada gratuita',
    'mde-guatape': 'Passeio de dia inteiro com 740 degraus',
    'mde-provenza': 'Bares, terraços e baladas em El Poblado',
    'mde-sonhavana': 'Salsa e son cubano ao vivo em Laureles',
    'mde-parquenorte': 'Parque de diversões com montanha-russa',
    'mde-atanasio': 'Jogo do campeonato com a torcida local (conforme calendário)',
    'mde-parapente': 'Voo duplo sobre o vale de Aburrá',
    // Cartagena
    'ctg-selina': 'Hostel em Getsemaní',
    'ctg-caribe': 'De frente para o mar em Bocagrande',
    'ctg-sanagustin': 'Hotel boutique na Cidade Amuralhada',
    'ctg-cevicheria': 'Ceviches e frutos do mar',
    'ctg-crepes': 'Cardápio variado, ideal para crianças',
    'ctg-celele': 'Cozinha caribenha autoral',
    'ctg-amurallada': 'Passeio a pé pelo centro histórico',
    'ctg-sanfelipe': 'Fortaleza colonial com vista para a cidade',
    'ctg-getsemani': 'Murais, dançarinos e música de rua ao pôr do sol',
    'ctg-rosario': 'Dia de praia de lancha com almoço',
    'ctg-cafehavana': 'Salsa ao vivo em Getsemaní',
    'ctg-chiva': 'Ônibus típico com música em passeio noturno',
    'ctg-cafedelmar': 'Coquetéis sobre as muralhas de frente para o mar',
    'ctg-kite': 'Aula de iniciação com instrutor',
    'ctg-totumo': 'Banho de lama em um vulcão, com traslado',
    // Cali
    'clo-viajero': 'Hostel com aulas de salsa em San Antonio',
    'clo-spiwak': 'Ao lado do shopping Chipichape',
    'clo-intercontinental': 'Hotel executivo junto ao rio Cali',
    'clo-zaguan': 'Comida do Valle del Cauca com vista',
    'clo-crepes': 'Cardápio variado, ideal para crianças',
    'clo-platillos': 'Cozinha autoral do Pacífico',
    'clo-cristorey': 'Mirante sobre a cidade',
    'clo-ermita': 'Passeio pelo centro junto ao rio Cali',
    'clo-pance': 'Poços naturais e sancocho à beira do rio',
    'clo-tintindeo': 'Salsa ao vivo na capital da salsa',
    'clo-delirio': 'Espetáculo de salsa, circo e orquestra',
    'clo-clasesalsa': 'Aprenda os passos básicos com dançarinos profissionais',
    'clo-zoo': 'Um dos melhores zoológicos do país',
    'clo-acuaparque': 'Piscinas de ondas e toboáguas',
    // Santa Marta
    'smr-masaya': 'Hostel com piscina no centro histórico',
    'smr-zuana': 'Resort de frente para o mar perto do aeroporto',
    'smr-lulo': 'Arepas, sucos e opções vegetarianas',
    'smr-ouzo': 'Cozinha mediterrânea no Parque de los Novios',
    'smr-rodadero': 'Praia urbana com serviços',
    'smr-quinta': 'Fazenda onde morreu Simón Bolívar, com jardim botânico',
    'smr-minca': 'Cachoeiras e café na Sierra Nevada',
    'smr-tayrona': 'Praias selvagens e floresta (entrada até as 14h)',
    'smr-novios': 'Bares e terraços no centro histórico',
    'smr-acuario': 'Tubarões, tartarugas e espécies do Caribe',
    'smr-buceo': 'Mergulho guiado para iniciantes, equipamento incluído',
    'smr-kayak': 'Remada pela baía e snorkel entre corais',
    'smr-bici': 'A cidade mais antiga da Colômbia sobre duas rodas',
    // Eje Cafetero
    'eje-movich': 'Hotel executivo em Pereira',
    'eje-sanjose': 'Fazenda cafeeira tradicional',
    'eje-jesusmartin': 'Café especial em Salento',
    'eje-helena': 'Cozinha criativa em Filandia',
    'eje-cocora': 'Palmeiras-de-cera, a árvore nacional',
    'eje-salento': 'Cidadezinha de casas coloridas e artesanato',
    'eje-finca': 'Do grão à xícara, com degustação',
    'eje-parquecafe': 'Parque temático com montanhas-russas e show do café',
    'eje-panaca': 'Parque agropecuário com animais e shows',
    'eje-termales': 'Águas termais entre cachoeiras',
    'eje-canopy': 'Tirolesa sobre cafezais e montanhas',
    'eje-tejo': 'Experimente o esporte nacional com os moradores'
  };
  PLACES.forEach(function (p) {
    if (!p.city) p.city = 'bog';
    if (p.cat === 'stay') { p.cin = p.cin || '15:00'; p.cout = p.cout || '12:00'; }
    if (D_PT[p.id]) p.d_pt = D_PT[p.id];
  });

  function emptyChoice() {
    return { originCountry: null, originCity: null, destCountry: 'CO', destCity: null,
      origin: null, reason: null, duration: null, company: null, budget: null, diet: [], interests: [] };
  }

  /* ¿La pantalla tiene todas sus respuestas? (todo es obligatorio) */
  function isStepComplete(c, step) {
    switch (step) {
      case 'route': return !!(c.originCountry && c.originCity && c.destCountry && c.destCity);
      case 'trip': return !!(c.reason && c.duration);
      case 'profile': return !!(c.company && c.budget);
      case 'diet': return !!(c.diet && c.diet.length);
      case 'interests': return !!(c.interests && c.interests.length);
      default: return true;
    }
  }

  /* Selección múltiple genérica */
  function toggleValue(list, val) {
    return list.indexOf(val) >= 0 ? list.filter(function (v) { return v !== val; }) : list.concat([val]);
  }

  /* "Ninguna" es excluyente con las demás restricciones */
  function toggleDiet(list, val) {
    if (val === 'none') return list.indexOf('none') >= 0 ? [] : ['none'];
    return toggleValue(list.filter(function (v) { return v !== 'none'; }), val);
  }

  function score(p, c) {
    var s = 0;
    if (p.reasons.indexOf(c.reason) >= 0) s += 3;
    if (p.company.indexOf(c.company) >= 0) s += 2;
    var diff = Math.abs(p.price - (c.budget || 2));
    if (diff === 0) s += 2; else if (diff === 1) s += 1;
    if (c.duration === 'short' && p.nearAirport) s += 3;
    return s;
  }

  /* Devuelve { items, noMatch, limit, perCat }.
   * 1) Filtros estrictos: ciudad de destino, interés, dieta (solo comida), duración mínima,
   *    y nada "solo adultos" para familias con niños.
   * 2) Puntaje y orden (empates: menos minutos primero, luego orden del catálogo).
   * 3) Cupo por categoría según duración (PER_CAT). En cultura y entretenimiento se buscan
   *    subtipos distintos (vida nocturna, parque, aventura…) antes de repetir uno.
   *    Los resultados salen agrupados por categoría, en el orden de CATS. */
  function recommend(c, places) {
    places = places || PLACES;
    var city = c.destCity || 'bog';
    var cats = CATS.filter(function (k) { return c.interests.indexOf(k) >= 0; });
    var diets = (c.diet || []).filter(function (d) { return d !== 'none'; });
    var dr = DUR_RANK.hasOwnProperty(c.duration) ? DUR_RANK[c.duration] : 1;
    var quota = PER_CAT[c.duration] || PER_CAT.mid;
    var kids = c.company === 'family';

    var items = [], noMatch = [], limit = 0;
    cats.forEach(function (k) {
      var pool = places
        .map(function (p, i) { return { p: p, i: i }; })
        .filter(function (x) {
          var p = x.p;
          if ((p.city || 'bog') !== city) return false;
          if (p.cat !== k) return false;
          if (DUR_RANK[p.minDuration || 'short'] > dr) return false;
          if (dr === 0 && p.dur >= 480) return false; // < 1 día: nada de planes de día completo
          if (kids && p.adults) return false;
          if (k === 'food' && !diets.every(function (d) { return (p.diet || []).indexOf(d) >= 0; })) return false;
          return true;
        })
        .map(function (x) { return { p: x.p, i: x.i, s: score(x.p, c) }; })
        .sort(function (a, b) { return (b.s - a.s) || (a.p.mins - b.p.mins) || (a.i - b.i); });

      limit += quota[k];
      if (!pool.length) { noMatch.push(k); return; }
      var picked = [], usedTypes = {};
      while (picked.length < quota[k] && pool.length) {
        var j = 0;
        if (k === 'activity' || k === 'fun') {
          for (var t = 0; t < pool.length; t++) if (!usedTypes[pool[t].p.type]) { j = t; break; }
        }
        var x = pool.splice(j, 1)[0];
        usedTypes[x.p.type] = true;
        picked.push(x.p);
      }
      items = items.concat(picked);
    });
    return { items: items, noMatch: noMatch, limit: limit, perCat: quota };
  }

  /* ---- Ficha de cada lugar: duración, precio y horario ---- */
  var WEEK = { es: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'], en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], pt: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'] };

  /* 90 -> "1 h 30 min"; 480 o más -> "Día completo" */
  function fmtDuration(min, lang) {
    if (!min) return '';
    if (min >= 480) return tx(lang, 'Día completo', 'Full day', 'Dia inteiro') + ' (~' + Math.round(min / 60) + ' h)';
    if (min < 60) return min + ' min';
    var h = Math.floor(min / 60), m = min % 60;
    return h + ' h' + (m ? ' ' + m + ' min' : '');
  }

  /* 45000 -> "COP 45.000" (es/pt) / "COP 45,000" (en); 0 -> "Gratis" */
  function fmtCOP(n, lang) {
    if (!n) return tx(lang, 'Gratis', 'Free', 'Grátis');
    var s = String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, lang === 'en' ? ',' : '.');
    return 'COP ' + s;
  }

  /* [[1,6,'09:00','17:00']] -> "Mar–Dom 09:00–17:00" */
  function fmtHours(h, lang) {
    if (!h || !h.length) return '';
    var W = WEEK[lang] || WEEK.es;
    return h.map(function (r) {
      var days = (r[0] === 0 && r[1] === 6) ? tx(lang, 'Todos los días', 'Every day', 'Todos os dias')
        : r[0] === r[1] ? W[r[0]] : W[r[0]] + '–' + W[r[1]];
      var time = (r[2] === '00:00' && r[3] === '24:00') ? tx(lang, '24 horas', '24 hours', '24 horas') : r[2] + '–' + r[3];
      return days + ' ' + time;
    }).join(' · ');
  }

  /* Textos listos para la tarjeta: { time, price, hours } */
  function placeFacts(p, lang) {
    if (p.cat === 'stay') {
      return {
        time: 'Check-in ' + p.cin + ' · Check-out ' + p.cout,
        price: fmtCOP(p.cost, lang) + tx(lang, ' por noche', ' per night', ' por noite'),
        hours: tx(lang, 'Recepción 24 horas', 'Front desk 24 hours', 'Recepção 24 horas')
      };
    }
    var per = !p.cost ? '' : p.cat === 'food'
      ? tx(lang, ' por persona (promedio)', ' per person (average)', ' por pessoa (média)')
      : tx(lang, ' por persona', ' per person', ' por pessoa');
    return { time: fmtDuration(p.dur, lang), price: fmtCOP(p.cost, lang) + per, hours: fmtHours(p.h, lang) };
  }

  function L(group, key, lang) {
    var g = LABELS[group] && LABELS[group][key];
    return g ? g[lang] || g.es : '';
  }

  /* Resumen del perfil para el título, ej. "Medellín · Turismo · Pareja · $$" */
  function summary(c, lang) {
    var parts = [];
    if (c.destCity) parts.push(destName(c, lang));
    if (c.reason) parts.push(L('reason', c.reason, lang));
    if (c.company) parts.push(L('company', c.company, lang));
    if (c.budget) parts.push(new Array(c.budget + 1).join('$'));
    return parts.join(' · ');
  }

  function noMatchText(cat, c, lang) {
    var diets = (c.diet || []).filter(function (d) { return d !== 'none'; });
    if (cat === 'food' && diets.length) {
      var names = diets.map(function (d) { return L('diet', d, lang); }).join(', ');
      return tx(lang,
        'No encontramos restaurantes que cumplan: ' + names + '. Pregunta en el punto de información turística del aeropuerto.',
        'We found no restaurants matching: ' + names + '. Ask at the airport tourist information desk.',
        'Não encontramos restaurantes que atendam: ' + names + '. Pergunte no posto de informação turística do aeroporto.');
    }
    var cl = L('cat', cat, lang).toLowerCase();
    return tx(lang, 'No hay opciones de ' + cl + ' para este perfil.', 'No ' + cl + ' options for this profile.',
      'Não há opções de ' + cl + ' para este perfil.');
  }

  var TIPS = {
    currency: { es: 'La moneda es el peso colombiano (COP). Retira en cajeros dentro de bancos o del aeropuerto.',
      en: 'The currency is the Colombian peso (COP). Use ATMs inside banks or the airport.',
      pt: 'A moeda é o peso colombiano (COP). Saque em caixas eletrônicos dentro de bancos ou do aeroporto.' },
    phrases: { es: 'Frases útiles: «¿Cuánto cuesta?», «La cuenta, por favor», «¿Dónde queda…?».',
      en: 'Useful phrases: «¿Cuánto cuesta?» (How much?), «La cuenta, por favor» (The bill, please), «¿Dónde queda…?» (Where is…?).',
      pt: 'Frases úteis: «¿Cuánto cuesta?» (Quanto custa?), «La cuenta, por favor» (A conta, por favor), «¿Dónde queda…?» (Onde fica…?).' },
    short: { es: 'Con menos de un día, calcula bien el regreso: en hora pico los trayectos pueden tardar el doble.',
      en: 'With less than a day, plan your return: rush-hour trips can take twice as long.',
      pt: 'Com menos de um dia, calcule bem a volta: no horário de pico os trajetos podem levar o dobro do tempo.' },
    vegetarian: { es: 'Di «soy vegetariano(a), sin carne ni pollo»: algunas sopas típicas llevan caldo de carne.',
      en: 'Say «soy vegetariano(a), sin carne ni pollo»: some typical soups use meat broth.',
      pt: 'Diga «soy vegetariano(a), sin carne ni pollo»: algumas sopas típicas levam caldo de carne.' },
    vegan: { es: 'Pide «sin lácteos, huevo ni miel»: muchas arepas llevan queso o mantequilla.',
      en: 'Ask «sin lácteos, huevo ni miel» (no dairy, egg or honey): many arepas contain cheese or butter.',
      pt: 'Peça «sin lácteos, huevo ni miel» (sem laticínios, ovo nem mel): muitas arepas levam queijo ou manteiga.' },
    glutenfree: { es: 'La arepa de maíz suele ser sin gluten, pero confirma que no se prepare junto a harinas de trigo.',
      en: 'Corn arepas are usually gluten-free, but check they are not cooked alongside wheat flour.',
      pt: 'A arepa de milho costuma ser sem glúten, mas confirme que não é preparada junto com farinha de trigo.' },
    halal: { es: 'Las opciones halal certificadas son escasas: consulta en el punto de información turística del aeropuerto.',
      en: 'Certified halal options are scarce: ask at the airport tourist information desk.',
      pt: 'As opções halal certificadas são escassas: consulte o posto de informação turística do aeroporto.' },
    // Consejos por ciudad de destino
    city_bog: { es: 'Bogotá está a 2.600 m de altura: lleva abrigo, toma agua y ve con calma el primer día.',
      en: 'Bogotá sits at 2,600 m: bring a jacket, drink water and take it easy on day one.',
      pt: 'Bogotá fica a 2.600 m de altitude: leve agasalho, beba água e vá com calma no primeiro dia.' },
    city_mde: { es: 'El aeropuerto está en Rionegro, a unos 45 min de Medellín. El Metro y el Metrocable son la forma más fácil de moverse.',
      en: 'The airport is in Rionegro, about 45 min from Medellín. The Metro and Metrocable are the easiest way around.',
      pt: 'O aeroporto fica em Rionegro, a uns 45 min de Medellín. O Metrô e o Metrocable são a forma mais fácil de se locomover.' },
    city_ctg: { es: 'Hace calor todo el año: usa bloqueador, hidrátate y acuerda el precio con vendedores y lancheros antes del servicio.',
      en: 'It is hot all year: wear sunscreen, stay hydrated and agree prices with vendors and boatmen beforehand.',
      pt: 'Faz calor o ano todo: use protetor solar, hidrate-se e combine o preço com vendedores e barqueiros antes do serviço.' },
    city_clo: { es: 'Cali es la capital mundial de la salsa: las mejores noches son de jueves a sábado.',
      en: 'Cali is the world salsa capital: the best nights are Thursday to Saturday.',
      pt: 'Cali é a capital mundial da salsa: as melhores noites são de quinta a sábado.' },
    city_smr: { es: 'El Parque Tayrona cierra algunas temporadas al año: confirma fechas y compra la entrada con anticipación.',
      en: 'Tayrona Park closes some periods each year: check dates and buy tickets in advance.',
      pt: 'O Parque Tayrona fecha em algumas temporadas do ano: confirme as datas e compre a entrada com antecedência.' },
    city_eje: { es: 'Llueve con frecuencia: lleva impermeable. Desde Salento salen jeeps «Willys» hacia el Valle del Cocora.',
      en: 'It rains often: bring a rain jacket. «Willys» jeeps leave from Salento to Cocora Valley.',
      pt: 'Chove com frequência: leve capa de chuva. De Salento saem jipes «Willys» para o Vale do Cocora.' }
  };

  function getTips(c, lang) {
    var keys = [];
    if (c.destCity && TIPS['city_' + c.destCity]) keys.push('city_' + c.destCity);
    if (isInternational(c)) keys.push('currency', 'phrases');
    if (c.duration === 'short') keys.push('short');
    ['vegetarian', 'vegan', 'glutenfree', 'halal'].forEach(function (d) {
      if ((c.diet || []).indexOf(d) >= 0) keys.push(d);
    });
    return keys.map(function (k) { return TIPS[k][lang] || TIPS[k].es; });
  }

  /* ================= SEGURIDAD =================
   * Consejos generales + según origen, acompañantes y ciudad de destino. */
  var EMERGENCY = '123'; // Línea única de emergencias en Colombia (policía, ambulancia, bomberos)
  var SAFETY = {
    emergency: { es: 'Ante cualquier emergencia marca el 123 (policía, ambulancia y bomberos). Es gratis desde cualquier celular.',
      en: 'In any emergency dial 123 (police, ambulance and fire). It is free from any phone.',
      pt: 'Em qualquer emergência ligue 123 (polícia, ambulância e bombeiros). É gratuito de qualquer celular.' },
    taxi: { es: 'Toma solo taxis de la fila oficial del aeropuerto o apps de transporte. Confirma la placa y la tarifa antes de subir.',
      en: 'Only take taxis from the official airport line or ride-hailing apps. Check the plate and fare before getting in.',
      pt: 'Pegue apenas táxis da fila oficial do aeroporto ou aplicativos de transporte. Confira a placa e a tarifa antes de entrar.' },
    belongings: { es: '«No dar papaya»: no muestres el celular, joyas ni dinero en la calle, y lleva la mochila al frente en lugares concurridos.',
      en: '«No dar papaya» (don\'t make yourself a target): keep your phone, jewelry and cash out of sight, and wear your backpack in front in crowds.',
      pt: '«No dar papaya» (não dê bobeira): não exiba celular, joias nem dinheiro na rua, e leve a mochila na frente em lugares cheios.' },
    drinks: { es: 'No aceptes bebidas, dulces ni volantes de desconocidos, y no dejes tu bebida sola.',
      en: 'Do not accept drinks, sweets or flyers from strangers, and never leave your drink unattended.',
      pt: 'Não aceite bebidas, doces nem panfletos de desconhecidos, e nunca deixe sua bebida sozinha.' },
    atm: { es: 'Usa cajeros dentro de bancos o centros comerciales, de día, y cubre el teclado al digitar tu clave.',
      en: 'Use ATMs inside banks or malls, during the day, and cover the keypad when entering your PIN.',
      pt: 'Use caixas eletrônicos dentro de bancos ou shoppings, de dia, e cubra o teclado ao digitar a senha.' },
    airport: { es: 'En el aeropuerto no pierdas de vista tu equipaje y no aceptes cuidar maletas de otras personas.',
      en: 'At the airport keep an eye on your luggage and never agree to watch someone else\'s bags.',
      pt: 'No aeroporto não perca sua bagagem de vista e não aceite cuidar de malas de outras pessoas.' },
    passport: { es: 'Guarda el pasaporte en la caja fuerte del hotel y lleva contigo una foto o copia.',
      en: 'Keep your passport in the hotel safe and carry a photo or copy with you.',
      pt: 'Guarde o passaporte no cofre do hotel e leve com você uma foto ou cópia.' },
    solo: { es: 'Comparte tu itinerario y ubicación en tiempo real con alguien de confianza, y evita caminar solo de noche por calles vacías.',
      en: 'Share your itinerary and live location with someone you trust, and avoid walking alone at night on empty streets.',
      pt: 'Compartilhe seu roteiro e localização em tempo real com alguém de confiança, e evite andar sozinho à noite por ruas vazias.' },
    family: { es: 'Acuerda un punto de encuentro con los niños y ponles una manilla o nota con tu número de teléfono.',
      en: 'Agree on a meeting point with your kids and give them a wristband or note with your phone number.',
      pt: 'Combine um ponto de encontro com as crianças e coloque nelas uma pulseira ou bilhete com seu telefone.' },
    friends: { es: 'Si salen de rumba, regresen juntos y pidan el transporte por app desde el lugar.',
      en: 'If you go out partying, head back together and order a ride-hailing car from the venue.',
      pt: 'Se forem para a balada, voltem juntos e peçam o transporte por aplicativo direto do local.' },
    couple: { es: 'De noche prefiere zonas concurridas y transporte por app en lugar de caminar largas distancias.',
      en: 'At night stick to busy areas and use ride-hailing apps instead of walking long distances.',
      pt: 'À noite prefira áreas movimentadas e transporte por aplicativo em vez de caminhar longas distâncias.' },
    city_bog: { es: 'En La Candelaria y el centro camina de día; de noche muévete en taxi por app. En TransMilenio cuida tus bolsillos.',
      en: 'Walk around La Candelaria and downtown by day; at night use a ride-hailing app. Watch your pockets on TransMilenio.',
      pt: 'Em La Candelaria e no centro caminhe de dia; à noite use táxi por aplicativo. No TransMilenio cuide dos bolsos.' },
    city_mde: { es: 'Visita la Comuna 13 con un tour guiado y de día. Pide permiso antes de fotografiar a los residentes.',
      en: 'Visit Comuna 13 on a guided tour during the day. Ask before photographing residents.',
      pt: 'Visite a Comuna 13 com um tour guiado e de dia. Peça permissão antes de fotografar os moradores.' },
    city_ctg: { es: 'Contrata los paseos a las islas solo con operadores autorizados en el muelle La Bodeguita y exige chaleco salvavidas.',
      en: 'Book island trips only with authorized operators at La Bodeguita pier and insist on a life jacket.',
      pt: 'Contrate passeios às ilhas só com operadores autorizados no píer La Bodeguita e exija colete salva-vidas.' },
    city_clo: { es: 'Sube a Cristo Rey y recorre San Antonio de día y en grupo; de noche usa taxi por app.',
      en: 'Visit Cristo Rey and San Antonio by day and in a group; at night use a ride-hailing app.',
      pt: 'Suba ao Cristo Rey e passeie por San Antonio de dia e em grupo; à noite use táxi por aplicativo.' },
    city_smr: { es: 'Respeta las banderas de las playas: en Tayrona varias playas tienen corrientes fuertes y no son aptas para nadar.',
      en: 'Respect beach flags: several Tayrona beaches have strong currents and are not safe for swimming.',
      pt: 'Respeite as bandeiras das praias: no Tayrona várias praias têm correntezas fortes e não são próprias para nadar.' },
    city_eje: { es: 'En el Valle del Cocora no te salgas de los senderos y regresa antes de que oscurezca. Usa los jeeps oficiales de Salento.',
      en: 'In Cocora Valley stay on the trails and come back before dark. Use the official jeeps from Salento.',
      pt: 'No Vale do Cocora não saia das trilhas e volte antes de escurecer. Use os jipes oficiais de Salento.' }
  };

  function safetyTips(c, lang) {
    var keys = ['emergency', 'taxi', 'belongings', 'drinks', 'atm'];
    if (c.destCity && SAFETY['city_' + c.destCity]) keys.splice(1, 0, 'city_' + c.destCity);
    if (c.company && SAFETY[c.company]) keys.push(c.company);
    if (isInternational(c)) keys.push('passport');
    if (c.duration === 'short') keys.push('airport');
    return keys.map(function (k) { return SAFETY[k][lang] || SAFETY[k].es; });
  }

  /* ================= CLIMA =================
   * Pronóstico en vivo: Open-Meteo (gratis, sin clave, solo se envían las coordenadas de la ciudad).
   * Si no hay internet se muestra el clima típico (promedios aproximados). */
  var CLIMATE = {
    bog: { lat: 4.711, lon: -74.072, min: 7, max: 19,
      es: 'Templado frío todo el año. Lluvias más fuertes en abril-mayo y octubre-noviembre.',
      en: 'Cool all year round. Heavier rain in April-May and October-November.',
      pt: 'Clima fresco o ano todo. Chuvas mais fortes em abril-maio e outubro-novembro.' },
    mde: { lat: 6.244, lon: -75.581, min: 17, max: 28,
      es: '«Eterna primavera»: templado todo el año, con aguaceros por la tarde.',
      en: '«Eternal spring»: mild all year, with afternoon showers.',
      pt: '«Eterna primavera»: ameno o ano todo, com pancadas de chuva à tarde.' },
    ctg: { lat: 10.391, lon: -75.479, min: 25, max: 31,
      es: 'Cálido y húmedo. Temporada de lluvias de septiembre a noviembre.',
      en: 'Hot and humid. Rainy season from September to November.',
      pt: 'Quente e úmido. Temporada de chuvas de setembro a novembro.' },
    clo: { lat: 3.452, lon: -76.532, min: 19, max: 30,
      es: 'Cálido, con brisa por la tarde. Lluvias en abril-mayo y octubre-noviembre.',
      en: 'Warm, with an afternoon breeze. Rain in April-May and October-November.',
      pt: 'Quente, com brisa à tarde. Chuvas em abril-maio e outubro-novembro.' },
    smr: { lat: 11.240, lon: -74.199, min: 24, max: 32,
      es: 'Caluroso y más seco que Cartagena. Lluvias de septiembre a noviembre.',
      en: 'Hot and drier than Cartagena. Rain from September to November.',
      pt: 'Calor e mais seco que Cartagena. Chuvas de setembro a novembro.' },
    eje: { lat: 4.813, lon: -75.696, min: 16, max: 26,
      es: 'Templado y lluvioso; en Salento y Cocora hace más frío.',
      en: 'Mild and rainy; Salento and Cocora are colder.',
      pt: 'Ameno e chuvoso; em Salento e Cocora faz mais frio.' }
  };

  function weatherUrl(cityId) {
    var c = CLIMATE[cityId];
    if (!c) return null;
    return 'https://api.open-meteo.com/v1/forecast?latitude=' + c.lat + '&longitude=' + c.lon +
      '&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code' +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
      '&timezone=America%2FBogota&forecast_days=3';
  }

  /* Convierte la respuesta de Open-Meteo a un objeto simple. Devuelve null si no es válida. */
  function parseWeather(j) {
    if (!j || !j.current || !j.daily || !j.daily.time) return null;
    var cur = j.current, d = j.daily;
    if (typeof cur.temperature_2m !== 'number') return null;
    return {
      temp: Math.round(cur.temperature_2m),
      feels: Math.round(cur.apparent_temperature),
      humidity: cur.relative_humidity_2m,
      code: cur.weather_code,
      days: d.time.map(function (t, i) {
        return { date: t, code: d.weather_code[i], max: Math.round(d.temperature_2m_max[i]),
          min: Math.round(d.temperature_2m_min[i]), rain: d.precipitation_probability_max[i] };
      })
    };
  }

  /* Código WMO -> ícono y texto */
  function weatherInfo(code, lang) {
    var W = [
      [[0], '☀️', 'Despejado', 'Clear', 'Céu limpo'],
      [[1, 2], '⛅', 'Parcialmente nublado', 'Partly cloudy', 'Parcialmente nublado'],
      [[3], '☁️', 'Nublado', 'Cloudy', 'Nublado'],
      [[45, 48], '🌫️', 'Niebla', 'Fog', 'Neblina'],
      [[51, 53, 55, 56, 57], '🌦️', 'Llovizna', 'Drizzle', 'Garoa'],
      [[61, 63, 65, 66, 67], '🌧️', 'Lluvia', 'Rain', 'Chuva'],
      [[71, 73, 75, 77, 85, 86], '❄️', 'Nieve', 'Snow', 'Neve'],
      [[80, 81, 82], '🌦️', 'Aguaceros', 'Showers', 'Pancadas de chuva'],
      [[95, 96, 99], '⛈️', 'Tormenta', 'Thunderstorm', 'Tempestade']
    ];
    for (var i = 0; i < W.length; i++) {
      if (W[i][0].indexOf(code) >= 0) return { icon: W[i][1], text: tx(lang, W[i][2], W[i][3], W[i][4]) };
    }
    return { icon: '🌡️', text: tx(lang, 'Clima', 'Weather', 'Clima') };
  }

  /* Consejos según el pronóstico (o el clima típico si w es null) */
  function weatherTips(w, cityId, lang) {
    var c = CLIMATE[cityId] || {};
    var max = w ? Math.max.apply(null, w.days.map(function (d) { return d.max; })) : c.max;
    var min = w ? Math.min.apply(null, w.days.map(function (d) { return d.min; })) : c.min;
    var rain = w ? Math.max.apply(null, w.days.map(function (d) { return d.rain || 0; })) : 0;
    var out = [];
    if (rain >= 60) out.push(tx(lang, 'Alta probabilidad de lluvia: lleva paraguas o impermeable.', 'High chance of rain: bring an umbrella or rain jacket.', 'Alta probabilidade de chuva: leve guarda-chuva ou capa de chuva.'));
    if (max >= 30) out.push(tx(lang, 'Mucho calor: usa bloqueador y toma bastante agua.', 'Very hot: use sunscreen and drink plenty of water.', 'Muito calor: use protetor solar e beba bastante água.'));
    if (min <= 10) out.push(tx(lang, 'Noches frías: lleva una chaqueta abrigada.', 'Cold nights: pack a warm jacket.', 'Noites frias: leve um casaco quente.'));
    return out;
  }

  var DAYS = { es: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'], en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], pt: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] };
  /* "2026-11-02" -> "Lun" (sin depender de la zona horaria del equipo) */
  function dayName(iso, lang, index) {
    if (index === 0) return tx(lang, 'Hoy', 'Today', 'Hoje');
    var p = iso.split('-');
    var d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])).getUTCDay();
    return (DAYS[lang] || DAYS.es)[d];
  }

  var api = {
    CLIMATE: CLIMATE, weatherUrl: weatherUrl, parseWeather: parseWeather,
    weatherInfo: weatherInfo, weatherTips: weatherTips, dayName: dayName,
    PLACES: PLACES, LABELS: LABELS, LIMIT: LIMIT, PER_CAT: PER_CAT, CATS: CATS, LANGS: LANGS,
    fmtDuration: fmtDuration, fmtCOP: fmtCOP, fmtHours: fmtHours, placeFacts: placeFacts,
    ORIGINS: ORIGINS, DESTINATIONS: DESTINATIONS, AIRPORTS: AIRPORTS,
    countries: countries, cities: cities, cityName: cityName, destName: destName, isInternational: isInternational,
    emptyChoice: emptyChoice, isStepComplete: isStepComplete,
    toggleValue: toggleValue, toggleDiet: toggleDiet,
    score: score, recommend: recommend, summary: summary,
    noMatchText: noMatchText, getTips: getTips, label: L,
    SAFETY: SAFETY, EMERGENCY: EMERGENCY, safetyTips: safetyTips
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TuriLogic = api;
})(this);
