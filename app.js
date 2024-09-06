const express = require('express');
const app = express();
const morgan = require('morgan');

const rotaLocais = require('./routes/locais');

app.use(morgan('dev'));
app.use(express.json());


app.use('/locais', rotaLocais);

app.use((req, res, next) => {
    const erro = new Error('Não encontrado');
    erro.status = 404;
    next(erro);
});

app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        erro: {
            mensagem: error.message
        }
    });
});

module.exports = app;
