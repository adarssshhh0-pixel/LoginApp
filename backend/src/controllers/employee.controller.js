const employeeService = require("../services/employee.service");
const HTTP            = require("../constants/httpStatus");

class EmployeeController {
  async getAll(req, res, next) {
    try {
      const result = await employeeService.getAllEmployees(req.query);
      res.status(HTTP.OK).json(result);
    } catch (err) { next(err); }
  }

  async getOne(req, res, next) {
    try {
      const emp = await employeeService.getEmployeeById(req.params.id);
      res.status(HTTP.OK).json(emp);
    } catch (err) { next(err); }
  }

  async create(req, res, next) {
    try {
      const emp = await employeeService.createEmployee(req.body, req.user.id);
      res.status(HTTP.CREATED).json({ message: "Employee created", employee: emp });
    } catch (err) { next(err); }
  }

  async update(req, res, next) {
    try {
      const emp = await employeeService.updateEmployee(req.params.id, req.body);
      res.status(HTTP.OK).json({ message: "Employee updated", employee: emp });
    } catch (err) { next(err); }
  }

  async remove(req, res, next) {
    try {
      await employeeService.deleteEmployee(req.params.id);
      res.status(HTTP.OK).json({ message: "Employee deleted" });
    } catch (err) { next(err); }
  }
}

module.exports = new EmployeeController();