import pool from '../config/database.js';
import customerJsonbService from './customer.jsonb.service.js';

class CustomerService {
  async findOrCreate(customerData) {
    const { coreFields, jsonbData } = customerJsonbService.mapToJsonbStructure(customerData);

    // Try to find existing customer by CIN
    const existingQuery = 'SELECT * FROM customers WHERE cin = $1';
    const existingResult = await pool.query(existingQuery, [coreFields.cin]);

    if (existingResult.rows.length > 0) {
      return customerJsonbService.flattenCustomerRow(existingResult.rows[0]);
    }

    // Create new customer - DUAL WRITE to old and new structure
    const insertQuery = `
      INSERT INTO customers (
        cin, first_name, last_name, email, phone,
        date_of_birth, address, city, data
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      coreFields.cin,
      coreFields.first_name,
      coreFields.last_name,
      coreFields.email,
      coreFields.phone || null,
      jsonbData.dateOfBirth || null, // Dual write to old column
      JSON.stringify(jsonbData.address || {}), // Dual write to old column
      jsonbData.address?.city || null, // Dual write to city column
      JSON.stringify(jsonbData) // New JSONB column
    ]);

    return customerJsonbService.flattenCustomerRow(result.rows[0]);
  }

  async getById(customerId) {
    const query = 'SELECT * FROM customers WHERE id = $1';
    const result = await pool.query(query, [customerId]);
    return customerJsonbService.flattenCustomerRow(result.rows[0]);
  }

  async update(customerId, customerData) {
    const { coreFields, jsonbData } = customerJsonbService.mapToJsonbStructure(customerData);

    const query = `
      UPDATE customers
      SET
        first_name = $1,
        last_name = $2,
        email = $3,
        phone = $4,
        date_of_birth = $5,
        address = $6,
        city = $7,
        data = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *
    `;

    const result = await pool.query(query, [
      coreFields.first_name,
      coreFields.last_name,
      coreFields.email,
      coreFields.phone || null,
      jsonbData.dateOfBirth || null, // Dual write
      JSON.stringify(jsonbData.address || {}), // Dual write
      jsonbData.address?.city || null, // Dual write
      JSON.stringify(jsonbData), // New JSONB
      customerId
    ]);

    return customerJsonbService.flattenCustomerRow(result.rows[0]);
  }
}

export default new CustomerService();