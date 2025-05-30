/**
 * Módulo del controlador de usuarios
 * Maneja todas las operaciones relacionadas con usuarios incluyendo creación y gestión de roles
 */

const { response, request } = require('express');
const User = require('../models/user');
const Student = require('../models/student');
const bcrypt = require('bcryptjs');

/**
 * GET /api/users
 * Obtiene la lista de usuarios (pendiente de implementar)
 */
/**
 * GET /api/users
 * Obtiene la lista de psicólogos
 * Solo accesible por administradores
 */
const userget = async(req = request, res = response) => {
    try {
        // Verificar que sea admin
        if (req.user.role !== 'ADMIN') {
            return res.status(401).json({
                msg: 'No tienes permisos para ver la lista de psicólogos'
            });
        }

        // Construir query para psicólogos activos
        const query = { 
            role: 'PSYCHOLOGIST',
            status: true
        };

        // Obtener psicólogos y total
        const [total, psychologists] = await Promise.all([
            User.countDocuments(query),
            User.find(query, {
                firstName: 1,
                lastName: 1,
                email: 1,
                role: 1,
                status: 1
            })
        ]);

        // Obtener el conteo de estudiantes para cada psicólogo
        const psychologistsWithStudentCount = await Promise.all(
            psychologists.map(async (psychologist) => {
                const studentCount = await Student.countDocuments({
                    assignedPsychologist: psychologist._id,
                    status: true
                });
                return {
                    ...psychologist.toObject(),
                    studentCount
                };
            })
        );

        res.json({
            total,
            psychologists: psychologistsWithStudentCount
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            msg: 'Error al obtener psicólogos'
        });
    }
}

/**
 * POST /api/users
 * Crea un nuevo usuario con manejo de roles y permisos
 * 
 * Jerarquía de roles:
 * - ADMIN: Puede crear psicólogos y estudiantes
 * - PSYCHOLOGIST: Puede crear estudiantes
 * - STUDENT: No puede crear usuarios
 * 
 * Flujo de creación:
 * 1. Si no existe admin, permite crear el primer admin sin token
 * 2. Para crear psicólogos, requiere token de admin
 * 3. Para crear estudiantes, requiere token de admin o psicólogo
 * 
 * @param {Object} req.body - Datos del usuario a crear
 * @param {string} req.body.name - Nombre del usuario
 * @param {string} req.body.email - Email del usuario
 * @param {string} req.body.password - Contraseña del usuario
 * @param {string} req.body.role - Rol del usuario (ADMIN|PSYCHOLOGIST|STUDENT)
 * @param {Object} req.user - Datos del usuario autenticado (disponible después de validar token)
 */
const userpost = async(req = request, res = response) => {
    const { firstName, lastName, email, password, role } = req.body;
    
    try {
        // 1. Validación inicial del rol
        if (!['ADMIN', 'PSYCHOLOGIST', 'STUDENT'].includes(role)) {
            return res.status(400).json({
                msg: 'Rol no válido'
            });
        }

        // 2. Caso especial: Creación del primer administrador
        // No requiere token ya que es el primer usuario del sistema
        const adminExists = await User.findOne({ role: 'ADMIN' });
        
        if (!adminExists && role === 'ADMIN') {
            const user = new User({ firstName, lastName, email, password, role });
            const encrypt = bcrypt.genSaltSync(10);
            user.password = bcrypt.hashSync(password, encrypt);
            await user.save();
            return res.json({
                msg: 'Primer administrador creado exitosamente',
                user
            });
        }

        // 3. Para cualquier otra creación, verificar autenticación
        // Aquí es donde el middleware de autenticación debe haber establecido req.user
        if (!req.user) {
            return res.status(401).json({
                msg: 'No autorizado - Token necesario'
            });
        }

        //extra agregar administrador por defecto..

        // 4. Validaciones basadas en el rol del usuario autenticado
        const requestingUserRole = req.user.role;

        // No permitir crear más administradores
        if (role === 'ADMIN') {
            return res.status(400).json({
                msg: 'No se pueden crear más administradores'
            });
        }
        
        // Solo admin puede crear psicólogos
        if (role === 'PSYCHOLOGIST' && requestingUserRole !== 'ADMIN') {
            return res.status(401).json({
                msg: 'Solo los administradores pueden crear psicólogos'
            });
        }
        
        // Admin y psicólogos pueden crear estudiantes
        if (role === 'STUDENT' && !['ADMIN', 'PSYCHOLOGIST'].includes(requestingUserRole)) {
            return res.status(401).json({
                msg: 'Solo los administradores y psicólogos pueden crear estudiantes'
            });
        }

        // 5. Crear y guardar el nuevo usuario
        const user = new User({ firstName, lastName, email, password, role });
        const encrypt = bcrypt.genSaltSync(10);
        user.password = bcrypt.hashSync(password, encrypt);
        
        await user.save();
        
        res.json({
            msg: 'Usuario creado exitosamente',
            user
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            msg: 'Error al crear usuario'
        });
    }
}
/**
 * PUT /api/users/:id
 * Actualiza los datos de un usuario
 * - Admin puede actualizar todos los datos de los psicólogos
 * - Usuarios pueden actualizar sus propios datos excepto el rol
 */
const userput = async(req = request, res = response) => {
    const { id } = req.params;
    const { role, status, google, ...data } = req.body;

    try {
        // 1. Verificar que el usuario a actualizar existe
        const userToUpdate = await User.findById(id);
        if (!userToUpdate) {
            return res.status(404).json({
                msg: 'Usuario no encontrado'
            });
        }

        // 2. Verificar permisos
        const isAdmin = req.user.role === 'ADMIN';
        const isOwnUser = req.user._id.toString() === id;

        // Solo admin puede actualizar psicólogos
        if (userToUpdate.role === 'PSYCHOLOGIST' && !isAdmin) {
            return res.status(401).json({
                msg: 'Solo los administradores pueden actualizar datos de psicólogos'
            });
        }

        // No se puede actualizar el rol
        if (role && role !== userToUpdate.role) {
            return res.status(400).json({
                msg: 'No se puede cambiar el rol de un usuario'
            });
        }

        // Solo puede actualizar sus propios datos (excepto admin)
        if (!isAdmin && !isOwnUser) {
            return res.status(401).json({
                msg: 'No puedes actualizar datos de otros usuarios'
            });
        }

        // 3. Si hay contraseña nueva, encriptarla
        if (data.password) {
            const salt = bcrypt.genSaltSync(10);
            data.password = bcrypt.hashSync(data.password, salt);
        }
        // 4. Actualizar usuario
        const updatedUser = await User.findByIdAndUpdate(id, data, { new: true });

        res.json({
            msg: 'Usuario actualizado exitosamente',
            user: updatedUser
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            msg: 'Error al actualizar usuario'
        });
    }
}
/**
 * DELETE /api/users/:id
 * Desactiva un usuario (soft delete)
 * - Admin puede desactivar a cualquier usuario
 * - Admin puede desactivarse a sí mismo
 */
const userdelete = async(req = request, res = response) => {
    const { id } = req.params;

    try {
        // 1. Verificar que el usuario existe
        const userToDelete = await User.findById(id);
        if (!userToDelete) {
            return res.status(404).json({
                msg: 'Usuario no encontrado'
            });
        }

        // 2. Verificar permisos
        const isAdmin = req.user.role === 'ADMIN';
        const isSelfDelete = req.user._id.toString() === id;

        // Solo admin puede eliminar usuarios
        if (!isAdmin) {
            return res.status(401).json({
                msg: 'No tienes permisos para desactivar usuarios'
            });
        }

        // 3. Verificar que no sea el único admin activo si se está desactivando un admin
        if (userToDelete.role === 'ADMIN') {
            const activeAdmins = await User.countDocuments({ 
                role: 'ADMIN', 
                status: true,
                _id: { $ne: id } // No contar el usuario que se va a desactivar
            });

            if (activeAdmins === 0) {
                return res.status(400).json({
                    msg: 'No se puede desactivar el único administrador activo'
                });
            }
        }

        // 4. Desactivar usuario (soft delete)
        const updatedUser = await User.findByIdAndUpdate(id, 
            { status: false },
            { new: true }
        );

        res.json({
            msg: 'Usuario desactivado exitosamente',
            user: updatedUser
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            msg: 'Error al desactivar usuario'
        });
    }
}
  
/**
 * GET /api/users/admin
 * Obtiene los datos del administrador
 */
const getAdmin = async(req = request, res = response) => {
    try {
        const admin = await User.findOne({ role: 'ADMIN' })
            .select('-password'); // Excluimos la contraseña de la respuesta

        if (!admin) {
            return res.status(404).json({
                msg: 'No se encontró ningún administrador'
            });
        }

        res.json(admin);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            msg: 'Error al obtener datos del administrador'
        });
    }
};

module.exports={
    userget,
    userpost,
    userput,
    userdelete,
    getAdmin
}
