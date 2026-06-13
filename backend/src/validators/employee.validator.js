const Joi = require("joi");

const createEmployeeSchema = Joi.object({
  user_id:       Joi.number().optional(),
  department_id: Joi.number().required(),
  phone:         Joi.string().pattern(/^[0-9]{10}$/).required().messages({
    "string.pattern.base": "Phone must be a 10-digit number",
  }),
  address:       Joi.string().min(5).max(200).required(),
  designation:   Joi.string().min(2).max(100).required(),
  salary:        Joi.number().min(1000).max(10000000).required(),
  skills:        Joi.array().items(Joi.number()).optional(),
});

const updateEmployeeSchema = Joi.object({
  department_id: Joi.number().optional(),
  phone:         Joi.string().pattern(/^[0-9]{10}$/).optional(),
  address:       Joi.string().min(5).max(200).optional(),
  designation:   Joi.string().min(2).max(100).optional(),
  salary:        Joi.number().min(1000).max(10000000).optional(),
  skills:        Joi.array().items(Joi.number()).optional(),
});

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) return next(error);
  next();
};

module.exports = {
  validateCreate: validate(createEmployeeSchema),
  validateUpdate: validate(updateEmployeeSchema),
};