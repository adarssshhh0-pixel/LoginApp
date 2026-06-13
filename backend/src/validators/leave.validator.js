const Joi = require("joi");

const applyLeaveSchema = Joi.object({
  leave_type_id: Joi.number().required(),
  from_date:     Joi.date().iso().required(),
  to_date:       Joi.date().iso().min(Joi.ref("from_date")).required().messages({
    "date.min": "To date must be after from date",
  }),
  reason: Joi.string().min(5).max(500).required(),
});

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) return next(error);
  next();
};

module.exports = { validateApply: validate(applyLeaveSchema) };