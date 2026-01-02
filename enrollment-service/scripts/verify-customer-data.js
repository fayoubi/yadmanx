import pool from '../src/config/database.js';

/**
 * Customer Data Verification Script
 * Run this after each migration phase to verify data integrity
 *
 * Usage: node scripts/verify-customer-data.js
 */

async function verifyData() {
  console.log('=====================================');
  console.log('Customer Data Verification');
  console.log('=====================================\n');

  try {
    // 1. Check total customers
    const totalResult = await pool.query('SELECT COUNT(*) FROM customers');
    const total = parseInt(totalResult.rows[0].count);
    console.log(`✓ Total customers: ${total}`);

    if (total === 0) {
      console.log('\n⚠️  No customers found in database');
      await pool.end();
      return;
    }

    // 2. Check customers with JSONB data
    const jsonbResult = await pool.query(
      "SELECT COUNT(*) FROM customers WHERE data IS NOT NULL AND data != '{}'::jsonb"
    );
    const withJsonb = parseInt(jsonbResult.rows[0].count);
    const jsonbPercentage = ((withJsonb / total) * 100).toFixed(1);
    console.log(`✓ Customers with JSONB data: ${withJsonb} (${jsonbPercentage}%)`);

    // 3. Check customers with old structure
    const oldResult = await pool.query(
      'SELECT COUNT(*) FROM customers WHERE date_of_birth IS NOT NULL'
    );
    const withOld = parseInt(oldResult.rows[0].count);
    const oldPercentage = ((withOld / total) * 100).toFixed(1);
    console.log(`✓ Customers with old structure (date_of_birth): ${withOld} (${oldPercentage}%)`);

    // 4. Check city column
    const cityResult = await pool.query(
      'SELECT COUNT(*) FROM customers WHERE city IS NOT NULL'
    );
    const withCity = parseInt(cityResult.rows[0].count);
    const cityPercentage = ((withCity / total) * 100).toFixed(1);
    console.log(`✓ Customers with city column: ${withCity} (${cityPercentage}%)`);

    // 5. Check for middle_name (should be removed eventually)
    try {
      const middleNameResult = await pool.query(
        'SELECT COUNT(*) FROM customers WHERE middle_name IS NOT NULL'
      );
      const withMiddleName = parseInt(middleNameResult.rows[0].count);
      if (withMiddleName > 0) {
        console.log(`⚠️  Customers with middle_name: ${withMiddleName} (column should be removed)`);
      } else {
        console.log(`✓ No customers with middle_name`);
      }
    } catch (error) {
      if (error.message.includes('column "middle_name" does not exist')) {
        console.log(`✓ Middle_name column removed (expected after migration 004)`);
      } else {
        throw error;
      }
    }

    // 6. Check JSONB data structure
    console.log('\n--- JSONB Data Structure ---');
    const jsonbFieldsResult = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE data->>'dateOfBirth' IS NOT NULL) as with_date_of_birth,
        COUNT(*) FILTER (WHERE data->'address' IS NOT NULL) as with_address,
        COUNT(*) FILTER (WHERE data->'address'->>'city' IS NOT NULL) as with_address_city,
        COUNT(*) FILTER (WHERE data->'usCitizen' IS NOT NULL) as with_us_citizen,
        COUNT(*) FILTER (WHERE data->'usCitizen'->>'tin' IS NOT NULL) as with_tin
      FROM customers
      WHERE data IS NOT NULL AND data != '{}'::jsonb
    `);

    if (jsonbFieldsResult.rows.length > 0 && withJsonb > 0) {
      const fields = jsonbFieldsResult.rows[0];
      console.log(`  - dateOfBirth: ${fields.with_date_of_birth}/${withJsonb}`);
      console.log(`  - address: ${fields.with_address}/${withJsonb}`);
      console.log(`  - address.city: ${fields.with_address_city}/${withJsonb}`);
      console.log(`  - usCitizen: ${fields.with_us_citizen}/${withJsonb}`);
      console.log(`  - tin (nested): ${fields.with_tin}/${withJsonb}`);
    }

    // 7. Data consistency check
    console.log('\n--- Data Consistency ---');
    const consistencyResult = await pool.query(`
      SELECT
        COUNT(*) FILTER (
          WHERE (data->>'dateOfBirth' IS NOT NULL AND date_of_birth IS NOT NULL)
          AND (data->>'dateOfBirth' = date_of_birth::text)
        ) as date_consistent,
        COUNT(*) FILTER (
          WHERE (data->'address'->>'city' IS NOT NULL AND city IS NOT NULL)
          AND (data->'address'->>'city' = city)
        ) as city_consistent,
        COUNT(*) FILTER (
          WHERE (data->>'dateOfBirth' IS NOT NULL AND date_of_birth IS NOT NULL)
          AND (data->>'dateOfBirth' != date_of_birth::text)
        ) as date_inconsistent,
        COUNT(*) FILTER (
          WHERE (data->'address'->>'city' IS NOT NULL AND city IS NOT NULL)
          AND (data->'address'->>'city' != city)
        ) as city_inconsistent
      FROM customers
      WHERE data IS NOT NULL AND data != '{}'::jsonb
    `);

    if (consistencyResult.rows.length > 0) {
      const consistency = consistencyResult.rows[0];
      console.log(`✓ Date of birth consistent: ${consistency.date_consistent}`);
      console.log(`✓ City consistent: ${consistency.city_consistent}`);

      if (parseInt(consistency.date_inconsistent) > 0) {
        console.log(`⚠️  Date of birth inconsistent: ${consistency.date_inconsistent}`);
      }
      if (parseInt(consistency.city_inconsistent) > 0) {
        console.log(`⚠️  City inconsistent: ${consistency.city_inconsistent}`);
      }
    }

    // 8. Sample data check
    console.log('\n--- Sample Customer Data (5 random) ---');
    const sampleResult = await pool.query(`
      SELECT
        id,
        cin,
        first_name,
        last_name,
        date_of_birth,
        city,
        data,
        created_at
      FROM customers
      ORDER BY RANDOM()
      LIMIT 5
    `);

    sampleResult.rows.forEach((row, idx) => {
      console.log(`\nCustomer ${idx + 1}:`);
      console.log(`  ID: ${row.id}`);
      console.log(`  Name: ${row.first_name} ${row.last_name}`);
      console.log(`  CIN: ${row.cin}`);
      console.log(`  Has JSONB: ${row.data && Object.keys(row.data).length > 0 ? 'Yes' : 'No'}`);
      console.log(`  Has date_of_birth column: ${row.date_of_birth ? 'Yes' : 'No'}`);
      console.log(`  Has city column: ${row.city ? 'Yes' : 'No'}`);
      if (row.data && Object.keys(row.data).length > 0) {
        console.log(`  JSONB keys: ${Object.keys(row.data).join(', ')}`);
      }
      console.log(`  Created: ${row.created_at}`);
    });

    // 9. Migration status summary
    console.log('\n=====================================');
    console.log('Migration Status Summary');
    console.log('=====================================');

    if (withJsonb === 0) {
      console.log('⏳ Phase: Pre-migration (no JSONB data yet)');
      console.log('   Next: Run migrations 001 and 002, deploy backend with dual-write');
    } else if (withJsonb < total) {
      console.log('⏳ Phase: Partial migration (dual-write mode)');
      console.log(`   Progress: ${jsonbPercentage}% of customers have JSONB data`);
      console.log('   Next: Run backfill migration (003) to migrate remaining customers');
    } else if (withOld > 0) {
      console.log('✓ Phase: Backfill complete, dual-read mode');
      console.log('   All customers have JSONB data');
      console.log('   Old columns still exist for safety');
      console.log('   Next: Monitor for 1+ week, then run migrations 004-005 to drop old columns');
    } else {
      console.log('✅ Phase: Migration complete');
      console.log('   All customers using JSONB structure');
      console.log('   Old columns removed');
    }

    console.log('\n=====================================\n');

  } catch (error) {
    console.error('❌ Error during verification:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run verification
verifyData().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
