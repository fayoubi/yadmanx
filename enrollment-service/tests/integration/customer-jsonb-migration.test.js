import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import pool from '../../src/config/database.js';
import customerService from '../../src/services/customer.service.js';
import customerJsonbService from '../../src/services/customer.jsonb.service.js';

describe('Customer JSONB Migration Tests', () => {
  let testCustomerIds = [];

  beforeEach(() => {
    testCustomerIds = [];
  });

  afterAll(async () => {
    // Clean up test customers
    if (testCustomerIds.length > 0) {
      await pool.query('DELETE FROM customers WHERE id = ANY($1)', [testCustomerIds]);
    }
    await pool.end();
  });

  describe('Dual-Write Mode', () => {
    it('should create customer with dual-write to old and new structure', async () => {
      const customerData = {
        cin: 'TEST123456',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '+212612345678',
        salutation: 'M.',
        dateOfBirth: '1990-01-01',
        birthPlace: 'Casablanca',
        address: '123 Rue Mohammed V',
        city: 'Casablanca',
        country: 'Maroc',
        nationality: 'Marocaine',
        occupation: 'Engineer',
        usCitizen: 'Oui',
        tin: '123-45-6789'
      };

      const customer = await customerService.findOrCreate(customerData);
      testCustomerIds.push(customer.id);

      // Verify flattened response
      expect(customer.first_name).toBe('John');
      expect(customer.last_name).toBe('Doe');
      expect(customer.cin).toBe('TEST123456');
      expect(customer.date_of_birth).toBe('1990-01-01');
      expect(customer.city).toBe('Casablanca');
      expect(customer.us_citizen).toBe('Oui');
      expect(customer.tin).toBe('123-45-6789');

      // Verify database structure
      const result = await pool.query('SELECT * FROM customers WHERE id = $1', [customer.id]);
      const row = result.rows[0];

      // Check JSONB data is populated
      expect(row.data).toBeDefined();
      expect(row.data.dateOfBirth).toBe('1990-01-01');
      expect(row.data.address).toBeDefined();
      expect(row.data.address.city).toBe('Casablanca');
      expect(row.data.usCitizen).toBeDefined();
      expect(row.data.usCitizen.value).toBe('Oui');
      expect(row.data.usCitizen.tin).toBe('123-45-6789');

      // Check old columns still populated (dual-write)
      expect(row.date_of_birth).toBeDefined();
      expect(row.city).toBe('Casablanca');
      expect(row.address).toBeDefined();
    });

    it('should handle usCitizen=Oui with tin nesting', async () => {
      const customerData = {
        cin: 'TEST999991',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
        usCitizen: 'Oui',
        tin: '987-65-4321'
      };

      const customer = await customerService.findOrCreate(customerData);
      testCustomerIds.push(customer.id);

      const result = await pool.query('SELECT * FROM customers WHERE id = $1', [customer.id]);

      expect(result.rows[0].data.usCitizen.value).toBe('Oui');
      expect(result.rows[0].data.usCitizen.tin).toBe('987-65-4321');

      // Verify flattened response
      expect(customer.us_citizen).toBe('Oui');
      expect(customer.tin).toBe('987-65-4321');
    });

    it('should handle usCitizen=Non without tin', async () => {
      const customerData = {
        cin: 'TEST999992',
        first_name: 'Ahmed',
        last_name: 'Benali',
        email: 'ahmed@example.com',
        usCitizen: 'Non'
      };

      const customer = await customerService.findOrCreate(customerData);
      testCustomerIds.push(customer.id);

      const result = await pool.query('SELECT * FROM customers WHERE id = $1', [customer.id]);

      expect(result.rows[0].data.usCitizen.value).toBe('Non');
      expect(result.rows[0].data.usCitizen.tin).toBeUndefined();

      // Verify flattened response
      expect(customer.us_citizen).toBe('Non');
      expect(customer.tin).toBeNull();
    });

    it('should handle address as nested object', async () => {
      const customerData = {
        cin: 'TEST999993',
        first_name: 'Sara',
        last_name: 'Alami',
        email: 'sara@example.com',
        address: {
          street: '456 Avenue Hassan II',
          city: 'Rabat',
          country: 'Maroc'
        }
      };

      const customer = await customerService.findOrCreate(customerData);
      testCustomerIds.push(customer.id);

      const result = await pool.query('SELECT * FROM customers WHERE id = $1', [customer.id]);

      expect(result.rows[0].data.address.street).toBe('456 Avenue Hassan II');
      expect(result.rows[0].data.address.city).toBe('Rabat');
      expect(result.rows[0].data.address.country).toBe('Maroc');

      // Verify flattened response
      expect(customer.address).toBe('456 Avenue Hassan II');
      expect(customer.city).toBe('Rabat');
      expect(customer.country).toBe('Maroc');
    });

    it('should update customer with dual-write', async () => {
      // Create customer
      const createData = {
        cin: 'TEST999994',
        first_name: 'Omar',
        last_name: 'Idrissi',
        email: 'omar@example.com',
        city: 'Fes'
      };

      const created = await customerService.findOrCreate(createData);
      testCustomerIds.push(created.id);

      // Update customer
      const updateData = {
        first_name: 'Omar',
        last_name: 'Idrissi',
        email: 'omar.new@example.com',
        city: 'Marrakech',
        occupation: 'Doctor'
      };

      const updated = await customerService.update(created.id, updateData);

      expect(updated.email).toBe('omar.new@example.com');
      expect(updated.city).toBe('Marrakech');
      expect(updated.occupation).toBe('Doctor');

      // Verify database
      const result = await pool.query('SELECT * FROM customers WHERE id = $1', [created.id]);
      expect(result.rows[0].city).toBe('Marrakech');
      expect(result.rows[0].data.occupation).toBe('Doctor');
    });
  });

  describe('JSONB Service Utilities', () => {
    it('should correctly map Person object from frontend', async () => {
      const person = {
        idNumber: 'AB123456',
        firstName: 'Fatima',
        lastName: 'Zahra',
        email: 'fatima@example.com',
        phone: '+212611111111',
        birthDate: '1985-05-15',
        birthPlace: 'Tangier',
        salutation: 'Mme.',
        address: '789 Boulevard Zerktouni',
        city: 'Casablanca',
        country: 'Maroc',
        occupation: 'Teacher',
        usCitizen: 'Non'
      };

      const { coreFields, jsonbData } = customerJsonbService.mapPersonToDb(person);

      expect(coreFields.cin).toBe('AB123456');
      expect(coreFields.first_name).toBe('Fatima');
      expect(coreFields.last_name).toBe('Zahra');
      expect(coreFields.email).toBe('fatima@example.com');

      expect(jsonbData.dateOfBirth).toBe('1985-05-15');
      expect(jsonbData.birthPlace).toBe('Tangier');
      expect(jsonbData.salutation).toBe('Mme.');
      expect(jsonbData.address.street).toBe('789 Boulevard Zerktouni');
      expect(jsonbData.address.city).toBe('Casablanca');
      expect(jsonbData.usCitizen.value).toBe('Non');
    });

    it('should correctly flatten customer row for API', () => {
      const dbRow = {
        id: 'uuid-123',
        cin: 'CD789012',
        first_name: 'Youssef',
        last_name: 'Benjelloun',
        email: 'youssef@example.com',
        phone: '+212622222222',
        date_of_birth: new Date('1992-03-20'),
        city: 'Agadir',
        data: {
          salutation: 'M.',
          dateOfBirth: '1992-03-20',
          birthPlace: 'Agadir',
          address: {
            street: '321 Rue de la Plage',
            city: 'Agadir',
            country: 'Maroc'
          },
          occupation: 'Architect',
          usCitizen: {
            value: 'Oui',
            tin: '555-66-7777'
          }
        },
        created_at: new Date(),
        updated_at: new Date()
      };

      const flattened = customerJsonbService.flattenCustomerRow(dbRow);

      expect(flattened.first_name).toBe('Youssef');
      expect(flattened.last_name).toBe('Benjelloun');
      expect(flattened.date_of_birth).toBe('1992-03-20'); // From JSONB
      expect(flattened.birth_place).toBe('Agadir');
      expect(flattened.address).toBe('321 Rue de la Plage');
      expect(flattened.city).toBe('Agadir');
      expect(flattened.occupation).toBe('Architect');
      expect(flattened.us_citizen).toBe('Oui');
      expect(flattened.tin).toBe('555-66-7777');
    });

    it('should identify same person correctly', () => {
      const person1 = {
        idNumber: 'AB123456',
        firstName: 'Ali',
        lastName: 'Hassan'
      };

      const person2 = {
        cin: 'AB123456',
        firstName: 'Ali',
        lastName: 'Hassan'
      };

      const person3 = {
        idNumber: 'CD789012',
        firstName: 'Ali',
        lastName: 'Hassan'
      };

      expect(customerJsonbService.isSamePerson(person1, person2)).toBe(true);
      expect(customerJsonbService.isSamePerson(person1, person3)).toBe(false);
    });
  });

  describe('Data Integrity', () => {
    it('should not lose data during flattening round-trip', async () => {
      const originalData = {
        cin: 'TEST999995',
        first_name: 'Laila',
        last_name: 'Amrani',
        email: 'laila@example.com',
        phone: '+212633333333',
        salutation: 'Mlle.',
        dateOfBirth: '1995-12-10',
        birthPlace: 'Meknes',
        passportNumber: 'PS111222',
        residencePermit: 'RP333444',
        address: '555 Avenue Moulay Ismail',
        city: 'Meknes',
        country: 'Maroc',
        nationality: 'Marocaine',
        occupation: 'Lawyer',
        maritalStatus: 'Célibataire',
        widowed: false,
        numberOfChildren: '0',
        usCitizen: 'Non'
      };

      const customer = await customerService.findOrCreate(originalData);
      testCustomerIds.push(customer.id);

      // Verify all fields are preserved
      expect(customer.salutation).toBe('Mlle.');
      expect(customer.date_of_birth).toBe('1995-12-10');
      expect(customer.birth_place).toBe('Meknes');
      expect(customer.passport_number).toBe('PS111222');
      expect(customer.residence_permit).toBe('RP333444');
      expect(customer.nationality).toBe('Marocaine');
      expect(customer.occupation).toBe('Lawyer');
      expect(customer.marital_status).toBe('Célibataire');
      expect(customer.widowed).toBe(false);
      expect(customer.number_of_children).toBe('0');
    });

    it('should handle null and undefined values gracefully', async () => {
      const customerData = {
        cin: 'TEST999996',
        first_name: 'Karim',
        last_name: 'Tazi',
        email: null,
        phone: undefined,
        occupation: null
      };

      const customer = await customerService.findOrCreate(customerData);
      testCustomerIds.push(customer.id);

      expect(customer.email).toBeNull();
      expect(customer.phone).toBeNull();
      expect(customer.occupation).toBeNull();
    });
  });
});
