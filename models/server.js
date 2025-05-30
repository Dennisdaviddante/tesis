const express = require('express');
const cors = require('cors');
const userRoute = require('../routes/user.route');
const authRoute = require('../routes/auth.route');
const studentRoute = require('../routes/student.route');
const appointmentRoute = require('../routes/appointment.route');
const suicideAssessmentRoute = require('../routes/suicideAssessment.routes');
const statisticsRoute = require('../routes/statistics.route');
const dbConection = require('../database/config');
const initRoles = require('../helpers/init-roles');

class Server {
  constructor() {
    this.app = express();
    this.port = process.env.PORT;
    this.paths = {
      auth: '/api/auth',
      users: '/api/users',
      students: '/api/students',
      appointments: '/api/appointments',
      suicideAssessments: '/api/suicide-assessments',
      statistics: '/api/statistics'
    };
    this.conectarDB();
    this.middleware();
    this.routes();
  }


  async conectarDB(){
    await dbConection();
    await initRoles(); // Inicializar roles después de conectar a la DB
  }
  middleware() {
    this.app.use(cors());
    this.app.use( express.json() );
    this.app.use(express.static('public'));
  }
  routes() {
    this.app.use(this.paths.auth, authRoute);
    this.app.use(this.paths.users, userRoute);
    this.app.use(this.paths.students, studentRoute);
    this.app.use(this.paths.appointments, appointmentRoute);
    this.app.use(this.paths.suicideAssessments, suicideAssessmentRoute);
    this.app.use(this.paths.statistics, statisticsRoute);
  }

  listen() {
    this.app.listen(this.port, () => {
      console.log(`Example app listening on port ${this.port}`)
    })
  }

}

module.exports = Server;
