/**
 * Customer JSONB Data Service
 * Handles conversion between flat customer objects and JSONB storage
 * This service enables dual-write migration and backward-compatible API responses
 */
class CustomerJsonbService {
  /**
   * Map flat customer data to JSONB structure
   * Splits data into core fields (table columns) and JSONB data
   *
   * @param {Object} customerData - Flat customer object
   * @returns {Object} - { coreFields, jsonbData }
   */
  mapToJsonbStructure(customerData) {
    const {
      // Core fields (stay as columns)
      cin,
      first_name,
      last_name,
      email,
      phone,

      // Fields to move to JSONB
      salutation,
      dateOfBirth,
      date_of_birth, // Handle both formats during transition
      birthPlace,
      birth_place,
      passportNumber,
      passport_number,
      residencePermit,
      residence_permit,
      address,
      city,
      country,
      nationality,
      occupation,
      maritalStatus,
      marital_status,
      widowed,
      numberOfChildren,
      number_of_children,
      usCitizen,
      us_citizen,
      tin,

      // Ignore these
      middle_name, // Being removed entirely
      ...rest
    } = customerData;

    // Build address object (handle various input formats)
    let addressObj = {};

    if (typeof address === 'object' && address !== null && !Array.isArray(address)) {
      // Address is already an object
      addressObj = {
        street: address.street || address.address || null,
        city: address.city || city || null,
        country: address.country || country || null
      };
    } else {
      // Address is a string or simple value
      addressObj = {
        street: address || null,
        city: city || null,
        country: country || null
      };
    }

    // Remove null values from address
    Object.keys(addressObj).forEach(key => {
      if (addressObj[key] === null || addressObj[key] === undefined) {
        delete addressObj[key];
      }
    });

    // Build usCitizen object with nested tin
    let usCitizenObj = null;
    const usCitizenValue = usCitizen || us_citizen;

    if (usCitizenValue) {
      usCitizenObj = { value: usCitizenValue };
      // Only include tin if US citizen is "Oui"
      if (usCitizenValue === 'Oui' && tin) {
        usCitizenObj.tin = tin;
      }
    }

    // Build JSONB data object
    const jsonbData = {
      salutation,
      dateOfBirth: dateOfBirth || date_of_birth,
      birthPlace: birthPlace || birth_place,
      passportNumber: passportNumber || passport_number,
      residencePermit: residencePermit || residence_permit,
      address: Object.keys(addressObj).length > 0 ? addressObj : null,
      nationality,
      occupation,
      maritalStatus: maritalStatus || marital_status,
      widowed: widowed === true || widowed === 'true' || widowed === 1,
      numberOfChildren: numberOfChildren || number_of_children,
      usCitizen: usCitizenObj
    };

    // Remove undefined/null values from JSONB data
    Object.keys(jsonbData).forEach(key => {
      if (jsonbData[key] === undefined || jsonbData[key] === null) {
        delete jsonbData[key];
      }
    });

    return {
      coreFields: {
        cin: cin || null,
        first_name: first_name || null,
        last_name: last_name || null,
        email: email || null,
        phone: phone || null
      },
      jsonbData
    };
  }

  /**
   * Flatten customer row (from DB) to API-compatible object
   * Maintains backward compatibility by returning flat structure
   *
   * @param {Object} customerRow - Database row
   * @returns {Object} - Flat customer object for API
   */
  flattenCustomerRow(customerRow) {
    if (!customerRow) return null;

    const data = customerRow.data || {};
    const address = data.address || customerRow.address || {};
    const usCitizen = data.usCitizen || {};

    // Handle address - could be string (old format) or object (new format)
    let addressStreet = null;
    let addressCity = null;
    let addressCountry = null;

    if (typeof address === 'object' && !Array.isArray(address)) {
      addressStreet = address.street;
      addressCity = address.city;
      addressCountry = address.country;
    } else if (typeof address === 'string') {
      addressStreet = address;
    }

    // Fallback to old city column if JSONB doesn't have it
    if (!addressCity && customerRow.city) {
      addressCity = customerRow.city;
    }

    return {
      id: customerRow.id,
      cin: customerRow.cin,
      first_name: customerRow.first_name,
      last_name: customerRow.last_name,
      email: customerRow.email,
      phone: customerRow.phone,

      // Flatten JSONB data
      salutation: data.salutation || null,
      date_of_birth: data.dateOfBirth || customerRow.date_of_birth || null,
      birth_place: data.birthPlace || null,
      passport_number: data.passportNumber || null,
      residence_permit: data.residencePermit || null,

      // Flatten address
      address: addressStreet,
      city: addressCity,
      country: addressCountry,

      nationality: data.nationality || null,
      occupation: data.occupation || null,
      marital_status: data.maritalStatus || null,
      widowed: data.widowed || false,
      number_of_children: data.numberOfChildren || null,

      // Flatten usCitizen
      us_citizen: usCitizen.value || null,
      tin: usCitizen.tin || null,

      // Audit fields
      created_at: customerRow.created_at,
      updated_at: customerRow.updated_at,
      deleted_at: customerRow.deleted_at
    };
  }

  /**
   * Map frontend Person object to database structure
   * Handles the specific structure from InsuranceForm.tsx
   *
   * @param {Object} person - Frontend Person object from insurance form
   * @returns {Object} - { coreFields, jsonbData }
   */
  mapPersonToDb(person) {
    if (!person) return { coreFields: {}, jsonbData: {} };

    return this.mapToJsonbStructure({
      cin: person.idNumber || person.cin,
      first_name: person.firstName,
      last_name: person.lastName,
      email: person.email,
      phone: person.phone,

      salutation: person.salutation,
      dateOfBirth: person.birthDate || person.dateOfBirth,
      birthPlace: person.birthPlace,
      passportNumber: person.passportNumber,
      residencePermit: person.residencePermit,
      address: person.address,
      city: person.city,
      country: person.country,
      nationality: person.nationality,
      occupation: person.occupation,
      maritalStatus: person.maritalStatus,
      widowed: person.widowed,
      numberOfChildren: person.numberOfChildren,
      usCitizen: person.usCitizen,
      tin: person.tin
    });
  }

  /**
   * Check if two persons are the same individual
   * Used to determine if subscriber and insured are the same person
   *
   * @param {Object} person1 - First person object
   * @param {Object} person2 - Second person object
   * @returns {Boolean} - True if same person
   */
  isSamePerson(person1, person2) {
    if (!person1 || !person2) return false;

    // Check CIN/idNumber first (most reliable)
    const cin1 = person1.cin || person1.idNumber;
    const cin2 = person2.cin || person2.idNumber;

    if (cin1 && cin2 && cin1 === cin2) {
      return true;
    }

    // Fallback to name comparison
    const firstName1 = person1.firstName || person1.first_name;
    const lastName1 = person1.lastName || person1.last_name;
    const firstName2 = person2.firstName || person2.first_name;
    const lastName2 = person2.lastName || person2.last_name;

    return (
      firstName1 &&
      lastName1 &&
      firstName1 === firstName2 &&
      lastName1 === lastName2
    );
  }
}

export default new CustomerJsonbService();
