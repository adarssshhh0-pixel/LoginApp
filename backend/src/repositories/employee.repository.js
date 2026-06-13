const pool = require("../../config/db");

class EmployeeRepository {
  async findAll({ page = 1, limit = 10, search = "", department = "", sortBy = "ep.id", order = "DESC" }) {
    const offset = (page - 1) * limit;
    const params = [];
    let idx = 1;

    let where = "WHERE 1=1";
    if (search) {
      where += ` AND (u.name ILIKE $${idx} OR u.email ILIKE $${idx})`;
      params.push(`%${search}%`);
      idx++;
    }
    if (department) {
      where += ` AND d.department_name = $${idx}`;
      params.push(department);
      idx++;
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM employee_profiles ep
       INNER JOIN users u ON ep.user_id = u.id
       INNER JOIN departments d ON ep.department_id = d.id ${where}`,
      params
    );

    const result = await pool.query(
      `SELECT ep.id, u.name, u.email, u.role, u.avatar,
              d.department_name, ep.phone, ep.designation,
              ep.salary, ep.created_at
       FROM employee_profiles ep
       INNER JOIN users u ON ep.user_id = u.id
       INNER JOIN departments d ON ep.department_id = d.id
       ${where}
       ORDER BY ${sortBy} ${order}
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    return {
      data:        result.rows,
      total:       parseInt(countResult.rows[0].count),
      page:        parseInt(page),
      limit:       parseInt(limit),
      totalPages:  Math.ceil(countResult.rows[0].count / limit),
    };
  }

  async findById(id) {
    const emp = await pool.query(`
      SELECT ep.*, u.name, u.email, u.role, u.avatar, d.department_name
      FROM employee_profiles ep
      INNER JOIN users u ON ep.user_id = u.id
      INNER JOIN departments d ON ep.department_id = d.id
      WHERE ep.id = $1
    `, [id]);

    if (emp.rows.length === 0) return null;

    const skills = await pool.query(`
      SELECT s.id, s.skill_name FROM employee_skills es
      INNER JOIN skills s ON es.skill_id = s.id
      WHERE es.employee_id = $1
    `, [id]);

    const images = await pool.query(
      "SELECT * FROM employee_images WHERE employee_id=$1", [id]
    );

    return { ...emp.rows[0], skills: skills.rows, images: images.rows };
  }

  async create({ empUserId, department_id, phone, address, designation, salary }) {
    return await pool.query(
      `INSERT INTO employee_profiles(user_id, department_id, phone, address, designation, salary)
       VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
      [empUserId, department_id, phone, address, designation, salary]
    );
  }

  async update(id, { department_id, phone, address, designation, salary }) {
    return await pool.query(`
      UPDATE employee_profiles
      SET department_id=$1, phone=$2, address=$3, designation=$4, salary=$5
      WHERE id=$6 RETURNING *
    `, [department_id, phone, address, designation, salary, id]);
  }

  async delete(id) {
    await pool.query("DELETE FROM employee_skills WHERE employee_id=$1", [id]);
    await pool.query("DELETE FROM employee_images WHERE employee_id=$1", [id]);
    await pool.query("DELETE FROM employee_profiles WHERE id=$1", [id]);
  }
}

module.exports = new EmployeeRepository();