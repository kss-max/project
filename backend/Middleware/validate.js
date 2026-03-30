// Generic validation middleware

const validate = (requiredFields) => {
  return (req, res, next) => {
    const errors = [];

    requiredFields.forEach((field) => {
      if (!req.body[field] || req.body[field].toString().trim() === "") {
        errors.push({
          field,
          message: `${field} is required`,
        });
      }
    });

    if (errors.length > 0) {
      return res.status(422).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    next();
  };
};

module.exports = validate;