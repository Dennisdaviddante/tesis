const mongoose = require('mongoose');

const dbConection =  async () =>{
    try {
        await mongoose.connect( process.env.MONGODB, { 
            useNewUrlParser: true,
            useUnifiedTopology: true,


        } );
        console.log('Base de datos conectada');
    } catch (error) {
        console.log(error);
        throw new Error('Error al iniciar la base de datos');
    }
};



module.exports = dbConection;