const axios = require('axios');
const NodeGeocoder = require('node-geocoder');
require('dotenv').config();

const googleKey = process.env.GOOGLE_KEY;

const geocoder = NodeGeocoder({
  provider: 'google',
  apiKey: googleKey,
});

const googlePlacesApiKey = googleKey;

// Aqui eu estou calculando a distância entre dois pontos (CEP informado e o local encontrado) para retornar no JSON dps
const calcularDistancia = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Raio da Terra em metros
  const φ1 = (lat1 * Math.PI) / 180; // φ, λ em radianos
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

const searchNearbyPlaces = async (latitude, longitude, keyword, radius) => {
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json`;
  const params = {
    location: `${latitude},${longitude}`,
    radius, // Raio de busca em metros (ele tá calculando +1, então colocar 15km, busca 16km ignorando float, então vai até 16,900)
    keyword, // Palavra-chave para busca, pode ser alterada mais abaixo, a idéia é mudar conforme solicitção do usuário no front
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
  const { cep } = req.query;

  if (!cep) {
    return res.status(400).json({ error: 'CEP não fornecido' });
  }

  try {
    const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
    const endereco = response.data;

    if (endereco.erro) {
      return res.status(404).json({ error: 'CEP não encontrado' });
    }

    const enderecoCompleto = `${endereco.logradouro}, ${endereco.bairro}, ${endereco.localidade}, ${endereco.uf}`;

    const resultadoGeocodificacao = await geocoder.geocode(enderecoCompleto);

    if (resultadoGeocodificacao.length === 0) {
      return res.status(404).json({ error: 'Coordenadas não encontradas' });
    }

    const coordenadas = resultadoGeocodificacao[0];
    const latitude = coordenadas.latitude;
    const longitude = coordenadas.longitude;

    const keyword = 'delegacia da mulher';
    const radius = 15000;
    const locais = await searchNearbyPlaces(latitude, longitude, keyword, radius);

    // Verifica se nenhum local foi encontrado
    if (locais.length === 0) {
      return res.status(200).json({ message: 'Não há locais próximos ao seu endereço' });
    }

    const locaisComDistanciaELink = locais.map(local => {
      const localLatitude = local.geometry.location.lat;
      const localLongitude = local.geometry.location.lng;

      const distancia = calcularDistancia(latitude, longitude, localLatitude, localLongitude);

      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${localLatitude},${localLongitude}`;

      return {
        ...local,
        distance: distancia.toFixed(2), // Distância dos dois pontos com duas casas decimais adicionadas no fim do JSON
        googleMapsUrl, // Adiciona o link do Google Maps para o endereço encontrado no JSON
      };
    });

    res.json(locaisComDistanciaELink);
  } catch (error) {
    console.error('Erro ao buscar dados do CEP ou coordenadas:', error.message);
    res.status(500).json({ error: 'Erro ao buscar dados do CEP ou coordenadas' });
  }
};
