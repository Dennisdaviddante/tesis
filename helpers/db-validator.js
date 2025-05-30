/**
 * Módulo de validadores para la base de datos
 * Contiene funciones de validación para roles y emails
 */

const Role = require('../models/role');
const User = require('../models/user');

/**
 * Valida si un rol es válido
 * Esta función se usa como validador personalizado en express-validator
 * 
 * @param {string} role - El rol a validar
 * @returns {boolean} - true si el rol es válido
 * @throws {Error} - Si el rol no está en la lista de roles válidos
 */
const esRoleValid = async (role = '') => {
    // Lista de roles válidos del sistema
    const validRoles = ['ADMIN', 'PSYCHOLOGIST', 'STUDENT'];
    
    if (!validRoles.includes(role)) {
        throw new Error(`El rol ${role} no es válido. Roles válidos: ${validRoles.join(', ')}`);
    }
    
    return true;
}

/**
 * Valida si un email ya existe en la base de datos
 * Esta función se usa como validador personalizado en express-validator
 * 
 * @param {string} email - El email a validar
 * @throws {Error} - Si el email ya existe en la base de datos
 */
const esEmailValid = async (email = '') => {
    const EmailValidation = await User.findOne({ email })
    if (EmailValidation) {
        throw new Error(`El email ${email} ya existe en la base de datos`);
    }
}
module.exports = { esRoleValid, esEmailValid };