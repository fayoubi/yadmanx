/**
 * Screenshot Generator for Agent Header Mockups
 *
 * This script uses Puppeteer to generate PNG screenshots from the HTML mockup file.
 *
 * Installation:
 *   npm install puppeteer
 *
 * Usage:
 *   node generate-screenshots.js
 *
 * Output:
 *   Creates PNG files in the mockups directory
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function generateScreenshots() {
  console.log('🚀 Starting screenshot generation...');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const htmlPath = path.join(__dirname, 'header-preview.html');
  const fileUrl = `file://${htmlPath}`;

  console.log(`📄 Loading ${fileUrl}`);
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });

  // Screenshot 1: Full page
  console.log('📸 Capturing full page...');
  await page.screenshot({
    path: path.join(__dirname, '01-full-mockup-page.png'),
    fullPage: true
  });

  // Screenshot 2-6: Individual mockup sections
  const sections = await page.$$('.mockup-section');
  console.log(`📸 Found ${sections.length} mockup sections`);

  for (let i = 0; i < sections.length; i++) {
    console.log(`📸 Capturing section ${i + 1}...`);
    await sections[i].screenshot({
      path: path.join(__dirname, `0${i + 2}-mockup-section-${i + 1}.png`)
    });
  }

  await browser.close();

  console.log('✅ Screenshot generation complete!');
  console.log(`📁 Screenshots saved to: ${__dirname}`);
  console.log('\nGenerated files:');
  console.log('  01-full-mockup-page.png - Complete mockup page');
  console.log('  02-mockup-section-1.png - Dashboard Before');
  console.log('  03-mockup-section-2.png - Dashboard After');
  console.log('  04-mockup-section-3.png - Enrollment Before');
  console.log('  05-mockup-section-4.png - Enrollment After');
  console.log('  06-mockup-section-5.png - Side-by-Side Comparison');
  console.log('  07-mockup-section-6.png - Authentication State Transitions');
  console.log('  08-mockup-section-7.png - Implementation Summary');
}

// Run the script
generateScreenshots().catch(error => {
  console.error('❌ Error generating screenshots:', error);
  process.exit(1);
});
