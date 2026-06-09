module.exports = (...roles) => {
  return (req, res, next) => {
    console.log("User role:", req.user.role);
    console.log("Required roles:", roles);
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Your role is not sufficient for this task.",
      });
    }
    next();
  };
};