const axios = require('axios');
const NodeGeocoder = require('node-geocoder');
require('dotenv').config();

let googleKey = process.env.GOOGLE_KEY;

const geocoder = NodeGeocoder({
  provider: 'google',
  apiKey: googleKey,
});

const googlePlacesApiKey = googleKey;

const searchNearbyPlaces = async (latitude, longitude, keyword, radius) => {
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json`;
  const params = {
    location: `${latitude},${longitude}`,
    radius: radius, // Raio em metros do local do cep
    keyword: keyword, // Palavra-chave para buscar locais específicos, como delegacia da mulher
    key: googlePlacesApiKey 
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

    // Aqui estou buscando os locais próximos
    const keyword = 'delegacia da mulher'; // Palavra-chave pra pesquisar o lugar
    const radius = 15000; // Raio de 15 km em metros do CEP informado
    const locais = await searchNearbyPlaces(latitude, longitude, keyword, radius);

    res.json(locais);
  } catch (error) {
    console.error('Erro ao buscar dados do CEP ou coordenadas:', error.message);
    res.status(500).json({ error: 'Erro ao buscar dados do CEP ou coordenadas' });
  }
};
