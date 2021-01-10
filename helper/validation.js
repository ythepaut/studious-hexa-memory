const Joi = require("joi");

module.exports = {
    // Form login
    formLoginSchema : Joi.object({
        username : Joi.string().alphanum().min(3).max(16).required(),
        passwd : Joi.string().min(8).required(),
        next : Joi.string().optional()
    }),
    // Form register
    formRegisterSchema : Joi.object({
        key : Joi.string().alphanum().min(8).required(),
        username : Joi.string().alphanum().min(3).max(16).required(),
        passwd : Joi.string().min(8).required(),
        passwd2 : Joi.ref('passwd')
    }),
    // Form new exercise
    formNewExerciseSchema : Joi.object({
        title : Joi.string().max(256).required(),
        statement : Joi.string().max(16384).required(),
        response : Joi.string().max(16384).required(),
        time : Joi.number().min(1).max(14400).required(),
        tags : Joi.string().pattern(new RegExp("^[0-9a-zA-Z-_,]{0,128}$")).allow('')
    }),
    // Form edit exercise
    formEditExerciseSchema : Joi.object({
        id : Joi.string().pattern(new RegExp("^[0-9a-f]{24}$")),
        title : Joi.string().max(256).required(),
        statement : Joi.string().max(16384).required(),
        response : Joi.string().max(16384).required(),
        time : Joi.number().min(1).max(14400).required(),
        tags : Joi.string().pattern(new RegExp("^[0-9a-zA-Z-_,]{0,128}$")).allow('')
    }),
    // Form create account (key)
    formNewKey : Joi.object({
        role : Joi.string().valid("MEMBER", "ADMIN").required()
    }),
    // Form change own username / password or delete own account
    formEditProfile : Joi.object({
        action : Joi.string().valid("changeusername", "changepassword", "delete").required(),
        passwd : Joi.string().min(8).required(),
        username : Joi.string().when('action', {'is' : 'changeusername', then : Joi.string().alphanum().min(3).max(16).required()}),
        newpasswd : Joi.string().when('action', {'is' : 'changepassword', then : Joi.string().min(8).required()}),
        newpasswd2 : Joi.string().when('action', {'is' : 'changepassword', then : Joi.ref('newpasswd')})
    }),
    // Form edit user role/status from list
    formEditUser : Joi.object({
        id : Joi.string().pattern(new RegExp("^[0-9a-f]{24}$")),
        role : Joi.string().valid("MEMBER", "ADMIN"),
        status : Joi.string().valid("SUSPENDED", "ALIVE")
    }).or("role", "status"),
    // MongoDB id format
    dbIdSchema : Joi.object({
        id : Joi.string().pattern(new RegExp("^[0-9a-f]{24}$"))
    })
};
