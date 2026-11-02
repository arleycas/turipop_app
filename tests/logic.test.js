// Ejecutar con: node --test tests/
const test = require('node:test');
const assert = require('node:assert/strict');
const T = require('../turipop-logic.js');

function mk(over) {
  return Object.assign(T.emptyChoice(), {
    originCountry: 'CO', originCity: 'mde', destCountry: 'CO', destCity: 'bog',
    reason: 'tourism', duration: 'mid',
    company: 'couple', budget: 2, diet: ['none'], interests: ['stay', 'food', 'activity', 'fun']
  }, over);
}
const byId = (id) => T.PLACES.find((p) => p.id === id);
const DEST_IDS = T.cities(T.DESTINATIONS, 'CO', 'es').map((c) => c.id);

test('isStepComplete: ruta requiere país y ciudad de origen y destino', () => {
  const c = T.emptyChoice();
  assert.equal(c.destCountry, 'CO');
  assert.equal(T.isStepComplete(c, 'route'), false);
  c.originCountry = 'US'; c.originCity = 'mia';
  assert.equal(T.isStepComplete(c, 'route'), false);
  c.destCity = 'ctg';
  assert.equal(T.isStepComplete(c, 'route'), true);
});

test('isStepComplete: trip requiere motivo y duración', () => {
  const c = T.emptyChoice();
  assert.equal(T.isStepComplete(c, 'trip'), false);
  c.reason = 'tourism';
  assert.equal(T.isStepComplete(c, 'trip'), false);
  c.duration = 'short';
  assert.equal(T.isStepComplete(c, 'trip'), true);
});

test('geografía: países, ciudades y "Otra ciudad" en ambos idiomas', () => {
  const us = T.cities(T.ORIGINS, 'US', 'en').map((c) => c.name);
  assert.ok(us.includes('New York') && us.includes('Other city'));
  assert.ok(T.cities(T.ORIGINS, 'US', 'es').map((c) => c.name).includes('Nueva York'));
  assert.deepEqual(T.cities(T.ORIGINS, 'OT', 'es').map((c) => c.id), ['other']);
  assert.deepEqual(T.cities(T.ORIGINS, 'XX', 'es'), []);
  assert.equal(T.countries(T.DESTINATIONS, 'es').length, 1);
  assert.equal(T.destName(mk({ destCity: 'eje' }), 'es'), 'Eje Cafetero');
  assert.equal(T.destName(mk({ destCity: 'eje' }), 'en'), 'Coffee Region');
});

test('isInternational: se deriva del país de origen', () => {
  assert.equal(T.isInternational(mk({ originCountry: 'CO' })), false);
  assert.equal(T.isInternational(mk({ originCountry: 'ES' })), true);
  assert.equal(T.isInternational(mk({ originCountry: 'OT' })), true);
});

test('catálogo: cada destino tiene alojamiento, comida, cultura y entretenimiento', () => {
  DEST_IDS.forEach((city) => {
    ['stay', 'food', 'activity', 'fun'].forEach((cat) => {
      assert.ok(T.PLACES.some((p) => p.city === city && p.cat === cat), city + '/' + cat);
    });
    // varias opciones de entretenimiento por destino, de distintos tipos
    const fun = T.PLACES.filter((p) => p.city === city && p.cat === 'fun');
    assert.ok(fun.length >= 5, city + ': ' + fun.length + ' opciones de entretenimiento');
    assert.ok(new Set(fun.map((p) => p.type)).size >= 3, city + ': tipos de entretenimiento');
  });
  const ids = T.PLACES.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length, 'ids únicos');
});

test('catálogo: todo lugar tiene precio, duración y horario válidos', () => {
  T.PLACES.forEach((p) => {
    assert.equal(typeof p.cost, 'number', p.id + ' cost');
    if (p.cat === 'stay') {
      assert.match(p.cin, /^\d\d:\d\d$/, p.id);
      assert.match(p.cout, /^\d\d:\d\d$/, p.id);
      return;
    }
    assert.ok(p.dur > 0, p.id + ' dur');
    assert.ok(Array.isArray(p.h) && p.h.length, p.id + ' h');
    p.h.forEach((r) => {
      assert.ok(r[0] >= 0 && r[1] <= 6 && r[0] <= r[1], p.id + ' días');
      assert.match(r[2] + r[3], /^\d\d:\d\d\d\d:\d\d$/, p.id + ' horas');
    });
    if (p.cat === 'activity' || p.cat === 'fun') assert.ok(T.LABELS.type[p.type], p.id + ' type');
  });
});

test('formato: duración, precio en COP y horarios en ambos idiomas', () => {
  assert.equal(T.fmtDuration(45, 'es'), '45 min');
  assert.equal(T.fmtDuration(90, 'es'), '1 h 30 min');
  assert.equal(T.fmtDuration(120, 'en'), '2 h');
  assert.equal(T.fmtDuration(600, 'es'), 'Día completo (~10 h)');
  assert.equal(T.fmtCOP(0, 'es'), 'Gratis');
  assert.equal(T.fmtCOP(1200000, 'es'), 'COP 1.200.000');
  assert.equal(T.fmtCOP(45000, 'en'), 'COP 45,000');
  assert.equal(T.fmtHours([[1, 6, '09:00', '17:00']], 'es'), 'Mar–Dom 09:00–17:00');
  assert.equal(T.fmtHours([[0, 6, '00:00', '24:00']], 'en'), 'Every day 24 hours');
  assert.equal(T.fmtHours([[3, 5, '21:00', '03:00'], [6, 6, '16:00', '18:30']], 'en'), 'Thu–Sat 21:00–03:00 · Sun 16:00–18:30');

  const f = T.placeFacts(byId('bog-theatron'), 'es');
  assert.deepEqual(f, { time: '4 h', price: 'COP 50.000 por persona', hours: 'Jue–Sáb 21:00–03:00' });
  const s = T.placeFacts(byId('selina'), 'en');
  assert.equal(s.time, 'Check-in 14:00 · Check-out 11:00');
  assert.equal(s.price, 'COP 70,000 per night');
  assert.equal(T.placeFacts(byId('simonbolivar'), 'es').price, 'Gratis');
});

test('recommend: solo lugares de la ciudad de destino', () => {
  DEST_IDS.forEach((city) => {
    const r = T.recommend(mk({ destCity: city, duration: 'long' }));
    assert.ok(r.items.length > 0, city);
    assert.ok(r.items.every((p) => p.city === city), city);
  });
});

test('recommend: Islas del Rosario no sale con < 1 día', () => {
  const ids = (d) => T.recommend(mk({ destCity: 'ctg', duration: d, interests: ['activity'] })).items.map((p) => p.id);
  assert.ok(!ids('short').includes('ctg-rosario'));
  assert.ok(ids('long').includes('ctg-rosario'));
});

test('recommend: con < 1 día no salen planes de día completo', () => {
  DEST_IDS.forEach((city) => {
    ['solo', 'family'].forEach((company) => {
      const r = T.recommend(mk({ destCity: city, company, duration: 'short' }));
      assert.ok(r.items.every((p) => p.cat === 'stay' || p.dur < 480), city + '/' + company);
    });
  });
});

test('isStepComplete: perfil, dieta e intereses', () => {
  const c = T.emptyChoice();
  assert.equal(T.isStepComplete(c, 'profile'), false);
  c.company = 'solo';
  assert.equal(T.isStepComplete(c, 'profile'), false);
  c.budget = 1;
  assert.equal(T.isStepComplete(c, 'profile'), true);
  assert.equal(T.isStepComplete(c, 'diet'), false);
  c.diet = ['vegan'];
  assert.equal(T.isStepComplete(c, 'diet'), true);
  assert.equal(T.isStepComplete(c, 'interests'), false);
  c.interests = ['food'];
  assert.equal(T.isStepComplete(c, 'interests'), true);
});

test('toggleDiet: "ninguna" es excluyente', () => {
  assert.deepEqual(T.toggleDiet(['vegan', 'halal'], 'none'), ['none']);
  assert.deepEqual(T.toggleDiet(['none'], 'vegan'), ['vegan']);
  assert.deepEqual(T.toggleDiet(['none'], 'none'), []);
  assert.deepEqual(T.toggleDiet(['vegan'], 'glutenfree'), ['vegan', 'glutenfree']);
  assert.deepEqual(T.toggleDiet(['vegan', 'glutenfree'], 'vegan'), ['glutenfree']);
});

test('recommend: la dieta excluye restaurantes que no cumplen', () => {
  const r = T.recommend(mk({ diet: ['vegan', 'glutenfree'], interests: ['food'], duration: 'long' }));
  assert.ok(r.items.length > 0);
  r.items.forEach((p) => {
    assert.ok(p.diet.includes('vegan') && p.diet.includes('glutenfree'), p.n);
  });
});

test('recommend: solo categorías elegidas como interés', () => {
  const r = T.recommend(mk({ interests: ['activity'], duration: 'long' }));
  assert.ok(r.items.every((p) => p.cat === 'activity'));
});

test('recommend: cantidad según duración (cupos por categoría)', () => {
  ['short', 'mid', 'long'].forEach((d) => {
    assert.equal(T.recommend(mk({ duration: d })).items.length, T.LIMIT[d], d);
  });
  assert.deepEqual(T.LIMIT, { short: 7, mid: 10, long: 14 });
});

test('recommend: agrupado por categoría y con más entretenimiento que hoteles/restaurantes', () => {
  const r = T.recommend(mk({ duration: 'long' }));
  const cats = r.items.map((p) => p.cat);
  assert.deepEqual(cats, ['stay', 'stay', 'food', 'food', 'food', 'activity', 'activity', 'activity', 'activity', 'fun', 'fun', 'fun', 'fun', 'fun']);
  ['short', 'mid', 'long'].forEach((d) => {
    const q = T.PER_CAT[d];
    assert.ok(q.fun >= 3 && q.fun > q.stay && q.fun > q.food, d);
  });
});

test('recommend: entretenimiento variado en todos los destinos y perfiles', () => {
  DEST_IDS.forEach((city) => {
    ['solo', 'couple', 'family', 'friends'].forEach((company) => {
      const fun = T.recommend(mk({ destCity: city, company, duration: 'mid' })).items.filter((p) => p.cat === 'fun');
      assert.ok(fun.length >= 3, city + '/' + company + ': ' + fun.length);
      assert.ok(new Set(fun.map((p) => p.type)).size >= 2, city + '/' + company + ' tipos');
    });
  });
});

test('recommend: familias con niños no reciben planes solo para adultos', () => {
  DEST_IDS.forEach((city) => {
    const r = T.recommend(mk({ destCity: city, company: 'family', reason: 'family', duration: 'long' }));
    assert.ok(r.items.every((p) => !p.adults), city);
  });
  const friends = T.recommend(mk({ company: 'friends', interests: ['fun'], duration: 'long' })).items;
  assert.ok(friends.some((p) => p.adults), 'amigos sí ven planes de adultos');
  assert.equal(new Set(friends.map((p) => p.type)).size, friends.length, 'sin repetir tipo si hay alternativas');
});

test('recommend: con < 1 día salen primero lugares cerca del aeropuerto', () => {
  const r = T.recommend(mk({ duration: 'short', interests: ['stay'] }));
  assert.ok(r.items[0].nearAirport, r.items[0].n);
});

test('recommend: Zipaquirá solo con +3 días', () => {
  const ids = (d) => T.recommend(mk({ duration: d, interests: ['activity'] })).items.map((p) => p.id);
  assert.ok(!ids('short').includes('zipaquira'));
  assert.ok(!ids('mid').includes('zipaquira'));
  // con +3 días entra al grupo de candidatos
  const all = T.recommend(mk({ duration: 'long', interests: ['activity'] }), [byId('zipaquira')]);
  assert.equal(all.items[0].id, 'zipaquira');
});

test('recommend: el presupuesto ordena los resultados', () => {
  const cheap = T.recommend(mk({ budget: 1, company: 'solo', interests: ['stay'] })).items[0];
  const premium = T.recommend(mk({ budget: 3, reason: 'business', company: 'solo', interests: ['stay'] })).items[0];
  assert.equal(cheap.price, 1);
  assert.equal(premium.price, 3);
});

test('recommend: resultado determinista', () => {
  const c = mk({ reason: 'family', company: 'family', budget: 3, duration: 'long' });
  assert.deepEqual(T.recommend(c), T.recommend(c));
});

test('recommend: perfiles distintos dan resultados distintos', () => {
  const a = T.recommend(mk({ diet: ['vegan'], budget: 1, duration: 'short', company: 'solo' })).items.map((p) => p.id);
  const b = T.recommend(mk({ reason: 'family', company: 'family', budget: 3, duration: 'long' })).items.map((p) => p.id);
  assert.notDeepEqual(a, b);
});

test('recommend: marca sin coincidencias (halal)', () => {
  const r = T.recommend(mk({ diet: ['halal'] }));
  assert.deepEqual(r.noMatch, ['food']);
  assert.ok(r.items.every((p) => p.cat !== 'food'));
  assert.match(T.noMatchText('food', mk({ diet: ['halal'] }), 'es'), /Halal/);
  assert.match(T.noMatchText('food', mk({ diet: ['halal'] }), 'en'), /Halal/);
});

test('getTips: por destino, origen, duración y dieta en ambos idiomas', () => {
  const nat = T.getTips(mk({}), 'es');
  assert.equal(nat.length, 1);
  assert.match(nat[0], /2\.600 m/);
  assert.match(T.getTips(mk({ destCity: 'ctg' }), 'en')[0], /sunscreen/);
  const intl = T.getTips(mk({ originCountry: 'US', originCity: 'mia' }), 'en');
  assert.equal(intl.length, 3);
  assert.match(intl[1], /COP/);
  const es = T.getTips(mk({ originCountry: 'FR', originCity: 'par', duration: 'short', diet: ['vegan', 'halal'] }), 'es');
  assert.equal(es.length, 6);
  assert.match(es.join(' '), /halal/);
});

test('safetyTips: generales + ciudad, acompañantes, origen y duración', () => {
  const nat = T.safetyTips(mk({}), 'es');
  assert.match(nat[0], /123/);
  assert.match(nat[1], /La Candelaria/);          // consejo de la ciudad va segundo
  assert.ok(nat.some((x) => /taxis/.test(x)));
  assert.ok(!nat.some((x) => /pasaporte/.test(x)));  // nacional: sin consejo de pasaporte
  const intl = T.safetyTips(mk({ originCountry: 'US', originCity: 'mia', company: 'family', duration: 'short', destCity: 'smr' }), 'en');
  const all = intl.join(' ');
  assert.match(all, /Tayrona/);
  assert.match(all, /passport/);
  assert.match(all, /meeting point/);
  assert.match(all, /luggage/);
  assert.equal(intl.length, nat.length + 2);
  // cada destino tiene su consejo de seguridad en ambos idiomas
  DEST_IDS.forEach((city) => {
    const s = T.SAFETY['city_' + city];
    assert.ok(s && s.es && s.en, city);
  });
  assert.equal(T.EMERGENCY, '123');
});

test('summary: resumen del perfil con destino', () => {
  assert.equal(T.summary(mk({}), 'es'), 'Bogotá · Turismo · Pareja · $$');
  assert.equal(T.summary(mk({ destCity: 'mde', reason: 'business', company: 'solo', budget: 3 }), 'en'), 'Medellín · Business · Solo · $$$');
});

// ---- Clima
const SAMPLE = { // respuesta real de Open-Meteo (Cartagena), recortada
  current: { time: '2026-11-02T10:15', temperature_2m: 27.7, apparent_temperature: 33.5, relative_humidity_2m: 87, weather_code: 51 },
  daily: { time: ['2026-11-02', '2026-11-03', '2026-11-04'], weather_code: [95, 81, 80],
    temperature_2m_max: [29.0, 29.1, 28.6], temperature_2m_min: [25.2, 24.1, 24.6], precipitation_probability_max: [100, 80, 91] }
};

test('clima: cada destino tiene coordenadas, clima típico y URL', () => {
  DEST_IDS.forEach((city) => {
    const c = T.CLIMATE[city];
    assert.ok(c && typeof c.lat === 'number' && c.es && c.en, city);
    const u = T.weatherUrl(city);
    assert.match(u, /^https:\/\/api\.open-meteo\.com\/v1\/forecast\?latitude=/);
    assert.match(u, /forecast_days=3/);
  });
  assert.equal(T.weatherUrl('xxx'), null);
});

test('parseWeather: convierte la respuesta y rechaza datos inválidos', () => {
  const w = T.parseWeather(SAMPLE);
  assert.equal(w.temp, 28);
  assert.equal(w.feels, 34);
  assert.equal(w.humidity, 87);
  assert.equal(w.days.length, 3);
  assert.deepEqual(w.days[0], { date: '2026-11-02', code: 95, max: 29, min: 25, rain: 100 });
  assert.equal(T.parseWeather(null), null);
  assert.equal(T.parseWeather({}), null);
  assert.equal(T.parseWeather({ current: {}, daily: { time: [] } }), null);
});

test('weatherInfo: códigos WMO en ambos idiomas', () => {
  assert.deepEqual(T.weatherInfo(0, 'es'), { icon: '☀️', text: 'Despejado' });
  assert.equal(T.weatherInfo(95, 'en').text, 'Thunderstorm');
  assert.equal(T.weatherInfo(63, 'es').text, 'Lluvia');
  assert.equal(T.weatherInfo(2, 'en').text, 'Partly cloudy');
  assert.equal(T.weatherInfo(999, 'es').text, 'Clima');
});

test('weatherTips: lluvia, calor y frío', () => {
  const w = T.parseWeather(SAMPLE);
  const tips = T.weatherTips(w, 'ctg', 'es');
  assert.equal(tips.length, 1);
  assert.match(tips[0], /paraguas/);
  // sin pronóstico: usa clima típico (Bogotá mínima 7 °C -> frío)
  assert.match(T.weatherTips(null, 'bog', 'en').join(' '), /warm jacket/);
  assert.match(T.weatherTips(null, 'smr', 'es').join(' '), /bloqueador/);
});

test('dayName: Hoy y día de la semana sin depender de la zona horaria', () => {
  assert.equal(T.dayName('2026-11-02', 'es', 0), 'Hoy');
  assert.equal(T.dayName('2026-11-03', 'es', 1), 'Mar');
  assert.equal(T.dayName('2026-11-04', 'en', 2), 'Wed');
});

// ---- Portugués
test('portugués: todas las etiquetas, consejos, seguridad y clima tienen texto pt', () => {
  assert.deepEqual(T.LANGS, ['es', 'en', 'pt']);
  Object.keys(T.LABELS).forEach((g) => {
    Object.keys(T.LABELS[g]).forEach((k) => assert.ok(T.LABELS[g][k].pt, 'LABELS.' + g + '.' + k));
  });
  Object.keys(T.SAFETY).forEach((k) => assert.ok(T.SAFETY[k].pt, 'SAFETY.' + k));
  Object.keys(T.CLIMATE).forEach((k) => assert.ok(T.CLIMATE[k].pt, 'CLIMATE.' + k));
  T.ORIGINS.concat(T.DESTINATIONS).forEach((o) => assert.ok(o.pt, 'país ' + o.id));
  // los consejos en pt no son los mismos textos en español
  const c = mk({ originCountry: 'BR', originCity: 'sao', duration: 'short', diet: ['vegan'], company: 'solo' });
  const es = T.getTips(c, 'es').concat(T.safetyTips(c, 'es'));
  const pt = T.getTips(c, 'pt').concat(T.safetyTips(c, 'pt'));
  assert.equal(pt.length, es.length);
  pt.forEach((x, i) => assert.notEqual(x, es[i], x));
  assert.match(pt.join(' '), /passaporte/);
});

test('portugués: cada lugar tiene descripción pt', () => {
  T.PLACES.forEach((p) => assert.ok(p.d_pt, p.id));
  // algunas frases son iguales en ambos idiomas (p. ej. "Restaurante 100% vegetal"), pero deben ser excepción
  const same = T.PLACES.filter((p) => p.d_pt === p.d_es).map((p) => p.id);
  assert.ok(same.length <= 2, 'iguales al español: ' + same.join(', '));
});

test('portugués: geografía, formatos y clima', () => {
  assert.equal(T.cityName(T.ORIGINS, 'US', 'nyc', 'pt'), 'Nova York');
  assert.equal(T.cityName(T.ORIGINS, 'US', 'mia', 'pt'), 'Miami');           // sin traducción -> nombre original
  assert.equal(T.cityName(T.ORIGINS, 'OT', 'other', 'pt'), 'Outra cidade');
  assert.equal(T.countries(T.ORIGINS, 'pt').find((x) => x.id === 'DE').name, 'Alemanha');
  assert.equal(T.destName(mk({ destCity: 'eje' }), 'pt'), 'Eixo Cafeeiro');
  assert.equal(T.summary(mk({ company: 'family', reason: 'business' }), 'pt'), 'Bogotá · Negócios · Família com crianças · $$');
  assert.equal(T.fmtDuration(600, 'pt'), 'Dia inteiro (~10 h)');
  assert.equal(T.fmtCOP(0, 'pt'), 'Grátis');
  assert.equal(T.fmtCOP(45000, 'pt'), 'COP 45.000');
  assert.equal(T.fmtHours([[0, 6, '00:00', '24:00']], 'pt'), 'Todos os dias 24 horas');
  assert.equal(T.fmtHours([[3, 5, '21:00', '03:00']], 'pt'), 'Qui–Sáb 21:00–03:00');
  assert.deepEqual(T.placeFacts(byId('selina'), 'pt'), { time: 'Check-in 14:00 · Check-out 11:00', price: 'COP 70.000 por noite', hours: 'Recepção 24 horas' });
  assert.equal(T.placeFacts(byId('crepes'), 'pt').price, 'COP 45.000 por pessoa (média)');
  assert.equal(T.weatherInfo(95, 'pt').text, 'Tempestade');
  assert.equal(T.dayName('2026-11-02', 'pt', 0), 'Hoje');
  assert.equal(T.dayName('2026-11-03', 'pt', 1), 'Ter');
  assert.match(T.weatherTips(null, 'bog', 'pt').join(' '), /casaco/);
  assert.match(T.noMatchText('food', mk({ diet: ['halal'] }), 'pt'), /Não encontramos restaurantes/);
  assert.match(T.noMatchText('fun', mk({}), 'pt'), /entretenimento/);
});

test('portugués: la interfaz (index.html) tiene data-pt y t() con 3 idiomas', () => {
  const html = require('fs').readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8');
  const withEs = (html.match(/data-es="/g) || []).length;
  const withPt = (html.match(/data-es="[^"]*" data-en="[^"]*" data-pt="[^"]+"/g) || []).length;
  assert.ok(withEs > 50);
  assert.equal(withPt, withEs, 'cada data-es tiene data-pt');
  const calls = html.match(/\bt\('(?:[^'\\]|\\.)*'(?:,'(?:[^'\\]|\\.)*')*\)/g) || [];
  assert.ok(calls.length >= 29);
  calls.forEach((c) => assert.match(c, /^t\('(?:[^'\\]|\\.)*','(?:[^'\\]|\\.)*','(?:[^'\\]|\\.)+'\)$/, c));
  assert.match(html, /setLang\('pt'\)[^>]*>Português</);
});
