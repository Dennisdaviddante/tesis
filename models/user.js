const { Schema, model }= require('mongoose');

const UserSchema = Schema({
    firstName: {
        type: String,
        required: [true, 'El nombre es requerido']
    },
    lastName: {
        type: String,
        required: [true, 'El apellido es requerido']
    },
    email:{
        type: String,
        required: [true, 'El correo es obligatorio'],
        unique: true
    },
    password:{
        type: String,
        required: [true, 'El password es obligatorio'],
    },
    img:{
        type: String,
    },
    role:{
        type: String, 
        required: true,
        enum: ['ADMIN', 'PSYCHOLOGIST', 'STUDENT'],
    },
    status:{
        type: Boolean,
        default: true
    },
    google:{
        type: Boolean,
        default: false
    } 
});

UserSchema.methods.toJSON = function(){
    const {__v, password, _id, ...user} = this.toObject();
    user.uid = _id;
    user.name = `${this.firstName} ${this.lastName}`; 
    return user;
}
module.exports = model('User', UserSchema);