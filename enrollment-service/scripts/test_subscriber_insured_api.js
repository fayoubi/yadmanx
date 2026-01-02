#!/usr/bin/env node
/**
 * API Testing Script for Subscriber/Insured Implementation
 * Tests GET and PUT endpoints to verify correct behavior
 */

const BASE_URL = process.env.ENROLLMENT_API_URL || 'http://localhost:3002';
const AGENT_ID = '8ab743b2-e9df-4035-8f29-968be5928100'; // From seed data

async function makeRequest(method, path, body = null) {
  const url = `${BASE_URL}${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-agent-id': AGENT_ID
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return { status: response.status, ok: response.ok, data };
  } catch (error) {
    return { error: error.message };
  }
}

async function testAPI() {
  console.log('🧪 Testing Subscriber/Insured API Implementation\n');
  console.log('='.repeat(80));

  // Test 1: Create new enrollment
  console.log('\n1. Creating new enrollment...');
  const createResult = await makeRequest('POST', '/api/v1/enrollments');
  if (createResult.error) {
    console.log('   ❌ Error:', createResult.error);
    return;
  }
  if (!createResult.ok) {
    console.log('   ❌ Failed:', createResult.status, createResult.data);
    return;
  }
  const enrollmentId = createResult.data.enrollment.id;
  console.log('   ✅ Enrollment created:', enrollmentId);
  console.log('   Subscriber ID:', createResult.data.enrollment.subscriber_id);
  console.log('   Insured ID:', createResult.data.enrollment.insured_id);

  // Test 2: Update with subscriber data (self-insured)
  console.log('\n2. Updating with subscriber data (self-insured)...');
  const subscriberData = {
    personalInfo: {
      subscriber: {
        firstName: 'Test',
        lastName: 'User',
        idNumber: 'TEST123',
        email: 'test@example.ma',
        phone: '0600000000',
        birthDate: '1990-01-01',
        address: {
          street: 'Test St',
          city: 'Casablanca',
          postalCode: '20000'
        }
      },
      insuredSameAsSubscriber: true
    }
  };

  const updateResult1 = await makeRequest('PUT', `/api/v1/enrollments/${enrollmentId}`, subscriberData);
  if (!updateResult1.ok) {
    console.log('   ❌ Update failed:', updateResult1.status, updateResult1.data);
    return;
  }
  console.log('   ✅ Updated successfully');
  console.log('   Subscriber ID:', updateResult1.data.enrollment.subscriber_id);
  console.log('   Insured ID:', updateResult1.data.enrollment.insured_id);

  // Test 3: Get enrollment and verify structure
  console.log('\n3. Getting enrollment and verifying structure...');
  const getResult = await makeRequest('GET', `/api/v1/enrollments/${enrollmentId}`);
  if (!getResult.ok) {
    console.log('   ❌ Get failed:', getResult.status, getResult.data);
    return;
  }

  const enrollment = getResult.data.enrollment;
  console.log('   ✅ Retrieved enrollment');
  console.log('   Has subscriber:', !!enrollment.subscriber);
  console.log('   Has insured:', !!enrollment.insured);
  console.log('   Has customer (backward compat):', !!enrollment.customer);
  
  if (enrollment.subscriber) {
    console.log('   Subscriber name:', `${enrollment.subscriber.first_name} ${enrollment.subscriber.last_name}`);
    console.log('   Subscriber CIN:', enrollment.subscriber.cin);
  }
  if (enrollment.insured) {
    console.log('   Insured name:', `${enrollment.insured.first_name} ${enrollment.insured.last_name}`);
  } else {
    console.log('   Insured: NULL (self-insured)');
  }

  // Test 4: Check JSONB cleanup
  console.log('\n4. Checking JSONB cleanup...');
  const data = enrollment.data || {};
  const hasSubscriberInJsonb = data.personalInfo?.subscriber !== undefined;
  const hasInsuredInJsonb = data.personalInfo?.insured !== undefined;
  console.log('   Has subscriber in JSONB:', hasSubscriberInJsonb);
  console.log('   Has insured in JSONB:', hasInsuredInJsonb);
  if (!hasSubscriberInJsonb && !hasInsuredInJsonb) {
    console.log('   ✅ JSONB cleaned (no subscriber/insured objects)');
  } else {
    console.log('   ⚠️  JSONB still contains subscriber/insured');
  }
  console.log('   Has insuredSameAsSubscriber flag:', !!data.personalInfo?.insuredSameAsSubscriber);

  // Test 5: Get enrollment step (personal_info)
  console.log('\n5. Getting enrollment step (personal_info)...');
  const stepResult = await makeRequest('GET', `/api/v1/enrollments/${enrollmentId}/steps/personal_info`);
  if (!stepResult.ok) {
    console.log('   ❌ Get step failed:', stepResult.status, stepResult.data);
    return;
  }
  const stepData = stepResult.data.data.step_data;
  console.log('   ✅ Retrieved step data');
  console.log('   Has subscriber data:', !!stepData.subscriber);
  console.log('   Has insured data:', !!stepData.insured);
  console.log('   insuredSameAsSubscriber:', stepData.insuredSameAsSubscriber);
  if (stepData.subscriber) {
    console.log('   Subscriber from step:', `${stepData.subscriber.firstName} ${stepData.subscriber.lastName}`);
  }

  // Test 6: Update with separate insured
  console.log('\n6. Updating with separate insured...');
  const separateInsuredData = {
    personalInfo: {
      subscriber: {
        firstName: 'Parent',
        lastName: 'User',
        idNumber: 'PARENT123',
        email: 'parent@example.ma',
        phone: '0611111111',
        birthDate: '1980-01-01',
        address: {
          street: 'Test St',
          city: 'Casablanca',
          postalCode: '20000'
        }
      },
      insured: {
        firstName: 'Child',
        lastName: 'User',
        idNumber: 'CHILD123',
        birthDate: '2010-01-01'
      },
      insuredSameAsSubscriber: false
    }
  };

  const updateResult2 = await makeRequest('PUT', `/api/v1/enrollments/${enrollmentId}`, separateInsuredData);
  if (!updateResult2.ok) {
    console.log('   ❌ Update failed:', updateResult2.status, updateResult2.data);
    return;
  }
  console.log('   ✅ Updated with separate insured');
  console.log('   Subscriber ID:', updateResult2.data.enrollment.subscriber_id);
  console.log('   Insured ID:', updateResult2.data.enrollment.insured_id);
  console.log('   IDs are different:', updateResult2.data.enrollment.subscriber_id !== updateResult2.data.enrollment.insured_id);

  // Test 7: Verify separate insured in GET
  console.log('\n7. Verifying separate insured in GET response...');
  const getResult2 = await makeRequest('GET', `/api/v1/enrollments/${enrollmentId}`);
  if (!getResult2.ok) {
    console.log('   ❌ Get failed:', getResult2.status, getResult2.data);
    return;
  }
  const enrollment2 = getResult2.data.enrollment;
  console.log('   ✅ Retrieved enrollment');
  if (enrollment2.subscriber && enrollment2.insured) {
    console.log('   Subscriber:', `${enrollment2.subscriber.first_name} ${enrollment2.subscriber.last_name}`);
    console.log('   Insured:', `${enrollment2.insured.first_name} ${enrollment2.insured.last_name}`);
    console.log('   ✅ Both subscriber and insured populated');
  } else {
    console.log('   ⚠️  Missing subscriber or insured');
  }

  // Test 8: Switch back to self-insured
  console.log('\n8. Switching back to self-insured...');
  const selfInsuredData = {
    personalInfo: {
      subscriber: {
        firstName: 'Test',
        lastName: 'User',
        idNumber: 'TEST123',
        email: 'test@example.ma',
        phone: '0600000000',
        birthDate: '1990-01-01',
        address: {
          street: 'Test St',
          city: 'Casablanca',
          postalCode: '20000'
        }
      },
      insuredSameAsSubscriber: true
    }
  };

  const updateResult3 = await makeRequest('PUT', `/api/v1/enrollments/${enrollmentId}`, selfInsuredData);
  if (!updateResult3.ok) {
    console.log('   ❌ Update failed:', updateResult3.status, updateResult3.data);
    return;
  }
  console.log('   ✅ Switched back to self-insured');
  console.log('   Subscriber ID:', updateResult3.data.enrollment.subscriber_id);
  console.log('   Insured ID:', updateResult3.data.enrollment.insured_id);
  if (updateResult3.data.enrollment.insured_id === null) {
    console.log('   ✅ Insured ID correctly set to NULL');
  } else {
    console.log('   ⚠️  Insured ID should be NULL but is:', updateResult3.data.enrollment.insured_id);
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ All API tests completed successfully!');
  console.log('='.repeat(80));
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.error('❌ This script requires Node.js 18+ with native fetch support');
  console.error('   Or install node-fetch: npm install node-fetch');
  process.exit(1);
}

testAPI().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

