const employeeRepo = require("../repositories/employee.repository");
const pool         = require("../../config/db");

class EmployeeService {
  async getAllEmployees(query) {
    return await employeeRepo.findAll(query);
  }

  async getEmployeeById(id) {
    const emp = await employeeRepo.findById(id);
    if (!emp) throw { status: 404, message: "Employee not found" };
    return emp;
  }

  async createEmployee({ user_id, department_id, phone, address, designation, salary, skills }, currentUserId) {
    const empUserId = user_id || currentUserId;

    const result = await employeeRepo.create({ empUserId, department_id, phone, address, designation, salary });
    const employeeId = result.rows[0].id;

    if (skills && skills.length > 0) {
      for (const skillId of skills) {
        await pool.query(
          "INSERT INTO employee_skills(employee_id, skill_id) VALUES($1,$2)",
          [employeeId, skillId]
        );
      }
    }

    // Auto initialize leave balance
    const leaveTypes = await pool.query("SELECT * FROM leave_types");
    for (const lt of leaveTypes.rows) {
      await pool.query(
        `INSERT INTO leave_balance(employee_id, leave_type_id, available_days)
         VALUES($1,$2,$3) ON CONFLICT DO NOTHING`,
        [empUserId, lt.id, lt.total_days]
      );
    }

    return result.rows[0];
  }

  async updateEmployee(id, data) {
    const result = await employeeRepo.update(id, data);
    if (result.rows.length === 0) throw { status: 404, message: "Employee not found" };

    if (data.skills && data.skills.length > 0) {
      await pool.query("DELETE FROM employee_skills WHERE employee_id=$1", [id]);
      for (const skillId of data.skills) {
        await pool.query(
          "INSERT INTO employee_skills(employee_id, skill_id) VALUES($1,$2)",
          [id, skillId]
        );
      }
    }

    return result.rows[0];
  }

  async deleteEmployee(id) {
    await this.getEmployeeById(id);
    await employeeRepo.delete(id);
  }
}

module.exports = new EmployeeService();