#!/usr/bin/env node
/**
 * Verification script for Subscriber/Insured separation implementation
 * Checks database schema, migration status, and data integrity
 */

import pool from '../src/config/database.js';

const VERIFICATION_QUERIES = {
  // 1. Check if subscriber_id and insured_id columns exist
  checkColumns: `
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'enrollments'
    AND column_name IN ('subscriber_id', 'insured_id', 'customer_id')
    ORDER BY column_name;
  `,

  // 2. Check if customer_id column still exists (should not)
  checkCustomerIdDropped: `
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'enrollments'
      AND column_name = 'customer_id'
    ) as customer_id_exists;
  `,

  // 3. Verify all enrollments have subscriber_id
  checkSubscriberIdPopulated: `
    SELECT 
      COUNT(*) as total_enrollments,
      COUNT(subscriber_id) as enrollments_with_subscriber_id,
      COUNT(*) FILTER (WHERE subscriber_id IS NULL) as missing_subscriber_id
    FROM enrollments
    WHERE deleted_at IS NULL;
  `,

  // 4. Verify insured_id consistency
  checkInsuredIdConsistency: `
    SELECT
      COUNT(*) FILTER (
        WHERE data->'personalInfo'->>'insuredSameAsSubscriber' = 'true'
        AND insured_id IS NOT NULL
      ) as wrong_self_insured,
      COUNT(*) FILTER (
        WHERE data->'personalInfo'->>'insuredSameAsSubscriber' = 'false'
        AND insured_id IS NULL
      ) as wrong_separate_insured,
      COUNT(*) FILTER (
        WHERE data->'personalInfo'->>'insuredSameAsSubscriber' = 'false'
        AND insured_id IS NOT NULL
      ) as correct_separate_insured,
      COUNT(*) FILTER (
        WHERE data->'personalInfo'->>'insuredSameAsSubscriber' = 'true'
        AND insured_id IS NULL
      ) as correct_self_insured
    FROM enrollments
    WHERE deleted_at IS NULL;
  `,

  // 5. Check if JSONB still contains subscriber/insured (should be cleaned for new enrollments)
  checkJsonbCleanup: `
    SELECT 
      COUNT(*) as total_enrollments,
      COUNT(*) FILTER (
        WHERE data->'personalInfo'->'subscriber' IS NOT NULL
        OR data->'personalInfo'->'insured' IS NOT NULL
      ) as still_has_subscriber_insured_in_jsonb
    FROM enrollments
    WHERE deleted_at IS NULL;
  `,

  // 6. Verify customer records exist for subscriber_id
  checkSubscriberCustomers: `
    SELECT
      COUNT(DISTINCT e.subscriber_id) as unique_subscriber_ids,
      COUNT(DISTINCT c.id) as matching_customer_records,
      COUNT(DISTINCT e.subscriber_id) - COUNT(DISTINCT c.id) as missing_customer_records
    FROM enrollments e
    LEFT JOIN customers c ON e.subscriber_id = c.id AND c.deleted_at IS NULL
    WHERE e.deleted_at IS NULL AND e.subscriber_id IS NOT NULL;
  `,

  // 7. Verify customer records exist for insured_id
  checkInsuredCustomers: `
    SELECT
      COUNT(DISTINCT e.insured_id) as unique_insured_ids,
      COUNT(DISTINCT c.id) as matching_customer_records,
      COUNT(DISTINCT e.insured_id) - COUNT(DISTINCT c.id) as missing_customer_records
    FROM enrollments e
    LEFT JOIN customers c ON e.insured_id = c.id AND c.deleted_at IS NULL
    WHERE e.deleted_at IS NULL AND e.insured_id IS NOT NULL;
  `,

  // 8. Sample enrollment data
  sampleEnrollments: `
    SELECT
      e.id,
      e.subscriber_id,
      cs.first_name || ' ' || cs.last_name as subscriber_name,
      e.insured_id,
      ci.first_name || ' ' || ci.last_name as insured_name,
      e.data->'personalInfo'->>'insuredSameAsSubscriber' as insured_same_as_subscriber
    FROM enrollments e
    LEFT JOIN customers cs ON e.subscriber_id = cs.id
    LEFT JOIN customers ci ON e.insured_id = ci.id
    WHERE e.deleted_at IS NULL
    ORDER BY e.created_at DESC
    LIMIT 10;
  `
};

async function runQuery(name, query) {
  try {
    const result = await pool.query(query);
    return { name, success: true, data: result.rows };
  } catch (error) {
    return { name, success: false, error: error.message };
  }
}

async function verifyImplementation() {
  console.log('🔍 Verifying Subscriber/Insured Implementation...\n');

  const results = {};

  // Run all verification queries
  for (const [key, query] of Object.entries(VERIFICATION_QUERIES)) {
    const result = await runQuery(key, query);
    results[key] = result;
  }

  // Display results
  console.log('='.repeat(80));
  console.log('VERIFICATION RESULTS');
  console.log('='.repeat(80));

  // 1. Column existence check
  console.log('\n1. Column Existence Check:');
  if (results.checkColumns.success) {
    const columns = results.checkColumns.data;
    const columnNames = columns.map(c => c.column_name);
    
    if (columnNames.includes('subscriber_id')) {
      console.log('   ✅ subscriber_id column exists');
    } else {
      console.log('   ❌ subscriber_id column MISSING');
    }
    
    if (columnNames.includes('insured_id')) {
      console.log('   ✅ insured_id column exists');
    } else {
      console.log('   ❌ insured_id column MISSING');
    }
    
    if (columnNames.includes('customer_id')) {
      console.log('   ⚠️  customer_id column still exists (should be dropped)');
    } else {
      console.log('   ✅ customer_id column has been dropped');
    }
  } else {
    console.log('   ❌ Error checking columns:', results.checkColumns.error);
  }

  // 2. Customer ID dropped check
  console.log('\n2. Customer ID Column Status:');
  if (results.checkCustomerIdDropped.success) {
    const exists = results.checkCustomerIdDropped.data[0].customer_id_exists;
    if (exists) {
      console.log('   ⚠️  customer_id column still exists');
    } else {
      console.log('   ✅ customer_id column has been dropped');
    }
  } else {
    console.log('   ❌ Error checking customer_id:', results.checkCustomerIdDropped.error);
  }

  // 3. Subscriber ID populated check
  console.log('\n3. Subscriber ID Population:');
  if (results.checkSubscriberIdPopulated.success) {
    const data = results.checkSubscriberIdPopulated.data[0];
    console.log(`   Total enrollments: ${data.total_enrollments}`);
    console.log(`   With subscriber_id: ${data.enrollments_with_subscriber_id}`);
    console.log(`   Missing subscriber_id: ${data.missing_subscriber_id}`);
    
    if (data.missing_subscriber_id === 0) {
      console.log('   ✅ All enrollments have subscriber_id');
    } else {
      console.log(`   ⚠️  ${data.missing_subscriber_id} enrollments missing subscriber_id`);
    }
  } else {
    console.log('   ❌ Error checking subscriber_id:', results.checkSubscriberIdPopulated.error);
  }

  // 4. Insured ID consistency check
  console.log('\n4. Insured ID Consistency:');
  if (results.checkInsuredIdConsistency.success) {
    const data = results.checkInsuredIdConsistency.data[0];
    console.log(`   Correct self-insured (insured_id = NULL): ${data.correct_self_insured}`);
    console.log(`   Correct separate-insured (insured_id set): ${data.correct_separate_insured}`);
    console.log(`   Wrong self-insured (should be NULL but isn't): ${data.wrong_self_insured}`);
    console.log(`   Wrong separate-insured (should be set but isn't): ${data.wrong_separate_insured}`);
    
    if (data.wrong_self_insured === 0 && data.wrong_separate_insured === 0) {
      console.log('   ✅ All enrollments have correct insured_id values');
    } else {
      console.log('   ⚠️  Some enrollments have incorrect insured_id values');
    }
  } else {
    console.log('   ❌ Error checking insured_id consistency:', results.checkInsuredIdConsistency.error);
  }

  // 5. JSONB cleanup check
  console.log('\n5. JSONB Cleanup Status:');
  if (results.checkJsonbCleanup.success) {
    const data = results.checkJsonbCleanup.data[0];
    console.log(`   Total enrollments: ${data.total_enrollments}`);
    console.log(`   Still have subscriber/insured in JSONB: ${data.still_has_subscriber_insured_in_jsonb}`);
    
    if (data.still_has_subscriber_insured_in_jsonb === 0) {
      console.log('   ✅ All enrollments have cleaned JSONB (no subscriber/insured objects)');
    } else {
      console.log(`   ⚠️  ${data.still_has_subscriber_insured_in_jsonb} enrollments still have subscriber/insured in JSONB`);
      console.log('      (This is expected for old enrollments, but new ones should be clean)');
    }
  } else {
    console.log('   ❌ Error checking JSONB cleanup:', results.checkJsonbCleanup.error);
  }

  // 6. Subscriber customer records check
  console.log('\n6. Subscriber Customer Records:');
  if (results.checkSubscriberCustomers.success) {
    const data = results.checkSubscriberCustomers.data[0];
    console.log(`   Unique subscriber_ids: ${data.unique_subscriber_ids}`);
    console.log(`   Matching customer records: ${data.matching_customer_records}`);
    console.log(`   Missing customer records: ${data.missing_customer_records}`);
    
    if (data.missing_customer_records === 0) {
      console.log('   ✅ All subscriber_ids have matching customer records');
    } else {
      console.log(`   ⚠️  ${data.missing_customer_records} subscriber_ids missing customer records`);
    }
  } else {
    console.log('   ❌ Error checking subscriber customers:', results.checkSubscriberCustomers.error);
  }

  // 7. Insured customer records check
  console.log('\n7. Insured Customer Records:');
  if (results.checkInsuredCustomers.success) {
    const data = results.checkInsuredCustomers.data[0];
    console.log(`   Unique insured_ids: ${data.unique_insured_ids}`);
    console.log(`   Matching customer records: ${data.matching_customer_records}`);
    console.log(`   Missing customer records: ${data.missing_customer_records}`);
    
    if (data.missing_customer_records === 0) {
      console.log('   ✅ All insured_ids have matching customer records');
    } else {
      console.log(`   ⚠️  ${data.missing_customer_records} insured_ids missing customer records`);
    }
  } else {
    console.log('   ❌ Error checking insured customers:', results.checkInsuredCustomers.error);
  }

  // 8. Sample enrollments
  console.log('\n8. Sample Enrollments:');
  if (results.sampleEnrollments.success) {
    const enrollments = results.sampleEnrollments.data;
    if (enrollments.length === 0) {
      console.log('   No enrollments found');
    } else {
      console.log(`   Showing ${enrollments.length} recent enrollments:`);
      enrollments.forEach((e, idx) => {
        console.log(`\n   Enrollment ${idx + 1}:`);
        console.log(`     ID: ${e.id}`);
        console.log(`     Subscriber: ${e.subscriber_name || 'N/A'} (${e.subscriber_id || 'NULL'})`);
        console.log(`     Insured: ${e.insured_name || 'N/A'} (${e.insured_id || 'NULL'})`);
        console.log(`     Same as subscriber: ${e.insured_same_as_subscriber}`);
      });
    }
  } else {
    console.log('   ❌ Error fetching sample enrollments:', results.sampleEnrollments.error);
  }

  console.log('\n' + '='.repeat(80));
  console.log('Verification Complete');
  console.log('='.repeat(80));

  // Summary
  let allPassed = true;
  if (results.checkColumns.success) {
    const columns = results.checkColumns.data.map(c => c.column_name);
    if (!columns.includes('subscriber_id') || !columns.includes('insured_id')) {
      allPassed = false;
    }
    if (columns.includes('customer_id')) {
      allPassed = false;
    }
  }

  if (results.checkSubscriberIdPopulated.success) {
    const missing = results.checkSubscriberIdPopulated.data[0].missing_subscriber_id;
    if (missing > 0) {
      allPassed = false;
    }
  }

  if (results.checkInsuredIdConsistency.success) {
    const data = results.checkInsuredIdConsistency.data[0];
    if (data.wrong_self_insured > 0 || data.wrong_separate_insured > 0) {
      allPassed = false;
    }
  }

  console.log('\n📊 Overall Status:', allPassed ? '✅ PASSED' : '⚠️  ISSUES FOUND');
  
  await pool.end();
  process.exit(allPassed ? 0 : 1);
}

// Run verification
verifyImplementation().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

