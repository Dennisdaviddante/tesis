/**
 * Módulo de inicialización de roles
 * Se encarga de crear los roles predefinidos en la base de datos si no existen
 */

const Role = require('../models/role');

/**
 * Inicializa los roles del sistema en la base de datos
 * Esta función se ejecuta al iniciar el servidor
 * 
 * Roles del sistema:
 * - ADMIN: Administrador del sistema
 * - PSYCHOLOGIST: Psicólogo
 * - STUDENT: Estudiante
 * 
 * Flujo:
 * 1. Verifica si ya existen roles en la BD
 * 2. Si no hay roles, crea los roles predefinidos
 * 3. Si hay error, lo registra en consola
 * 
 * @returns {Promise<void>}
 */
const initRoles = async () => {
    try {
        // 1. Verificar si ya existen roles en la BD
        const count = await Role.estimatedDocumentCount();
        
        // Si ya hay roles, no hacer nada
        if (count > 0) return;

        // 2. Crear los roles predefinidos del sistema
        const roles = await Promise.all([
            new Role({ role: 'ADMIN' }).save(),
            new Role({ role: 'PSYCHOLOGIST' }).save(),
            new Role({ role: 'STUDENT' }).save()
        ]);

        console.log('Roles inicializados exitosamente:', roles);
    } catch (error) {
        // 3. Si hay error, registrarlo
        console.error('Error al inicializar roles:', error);
    }
};

module.exports = initRoles;
