const Joi = require("joi");

module.exports = {
    // Form login
    formLoginSchema : Joi.object({
        username : Joi.string().alphanum().min(3).max(16).required(),
        passwd : Joi.string().min(8).required()
    }),
    // Form register
    formRegisterSchema : Joi.object({
        key : Joi.string().alphanum().length(11).required(),
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
    formNewKey : Joi.object({
        role : Joi.string().allow("MEMBER", "ADMIN")
    }),
    // MongoDB id format
    dbIdSchema : Joi.object({
        id : Joi.string().pattern(new RegExp("^[0-9a-f]{24}$"))
    }),
    // User schema
    userSchema : Joi.object({

    })
};
