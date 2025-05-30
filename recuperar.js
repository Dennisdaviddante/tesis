const bcrypt = require('bcrypt');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function recuperarContraseña(usuario) {
  // Obtén el valor del campo password del documento del usuario
  const passwordHash = usuario.password;

  // Pregúntale al usuario por una contraseña que conozca
  rl.question('Ingrese una contraseña que conozca: ', (contraseñaConocida) => {
    // Utiliza bcrypt para comparar la contraseña conocida con el hash
    if (bcrypt.compareSync(contraseñaConocida, passwordHash)) {
      // Si la contraseña coincide, devuelve la contraseña original
      console.log(contraseñaConocida);
    } else {
      // Si la contraseña no coincide, devuelve un mensaje de error
      console.log("La contraseña no coincide");
    }
    rl.close();
  });
}

// Ejemplo de uso
const usuario = { id: 1, password: '$2b$10$xaHDZ3o8.oSpNy2JWPEXLuZHwwErxcb6yZDbDUsFMv/PBPKutuilu' }; // Reemplaza con el ID y el hash de la contraseña del usuario administrador
recuperarContraseña(usuario);