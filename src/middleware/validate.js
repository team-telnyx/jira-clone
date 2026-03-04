const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errorMessage = error.details.map(d => d.message).join(', ');
      return res.status(400).json({
        error: { message: errorMessage }
      });
    }
    
    req.validatedBody = value;
    next();
  };
};

module.exports = validate;
