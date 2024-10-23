const axios = require('axios');
const cache = require('memory-cache');
require('dotenv').config();

const googleKey = process.env.GOOGLE_KEY;
const googlePlacesApiKey = googleKey;

// Função para calcular a distância entre dois pontos
const calcularDistancia = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Raio da Terra em metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distancia = R * c; // Distância em metros
  return distancia;
};

// Função para buscar locais próximos usando a API do Google Places
const searchNearbyPlaces = async (latitude, longitude, keyword, radius) => {
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json`;
  const params = {
    location: `${latitude},${longitude}`,
    radius, // Raio de busca em metros
    keyword, // Palavra-chave para busca
    key: googlePlacesApiKey,
  };

  try {
    const response = await axios.get(url, { params });
    return response.data.results;
  } catch (error) {
    console.error('Erro ao buscar locais próximos:', error.message);
    throw new Error('Erro ao buscar locais próximos');
  }
};

exports.getNearbyPlaces = async (req, res) => {
  const { latitude, longitude, keyword = 'delegacia da mulher', radius = 15000 } = req.query;

  // Validação dos parâmetros
  if (!latitude || !longitude) {
    return res.status(400).json({ error: 'Latitude e longitude não fornecidas' });
  }

  const latNum = parseFloat(latitude);
  const lonNum = parseFloat(longitude);

  if (isNaN(latNum) || isNaN(lonNum)) {
    return res.status(400).json({ error: 'Latitude e longitude inválidas' });
  }

  // Chave de cache baseada nos parâmetros da requisição
  const cacheKey = `${latNum}-${lonNum}-${keyword}-${radius}`;
  const cachedData = cache.get(cacheKey);

  // Se os dados já estiverem em cache, retorne imediatamente
  if (cachedData) {
    console.log('Retornando dados do cache:', cachedData);
    return res.json(cachedData);
  }

  try {
    const locais = await searchNearbyPlaces(latNum, lonNum, keyword, radius);

    if (locais.length === 0) {
      return res.status(200).json({ message: 'Não há locais próximos à sua localização' });
    }

    const locaisComDistanciaELink = locais.map(local => {
      const localLatitude = local.geometry.location.lat;
      const localLongitude = local.geometry.location.lng;

      const distancia = calcularDistancia(latNum, lonNum, localLatitude, localLongitude);

      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${localLatitude},${localLongitude}`;

      return {
        ...local,
        distance: (distancia / 1000).toFixed(2),
        googleMapsUrl,
      };
    });

    // Armazena a resposta no cache por 1 minuto (60.000 ms)
    cache.put(cacheKey, locaisComDistanciaELink, 60 * 1000); 

    res.json(locaisComDistanciaELink);
  } catch (error) {
    console.error('Erro ao buscar locais:', error.message);
    res.status(500).json({ error: 'Erro ao buscar locais' });
  }
};
