// Purpose: Creates initial university data.
const mongoose = require('mongoose');
const { connectDatabase } = require('../config/database');
const University = require('../models/University');

const universities = [
  'Addis Ababa University',
  'Addis Ababa Science and Technology University',
  'Adama Science and Technology University',
  'Afar Region University',
  'Aksum University',
  'Ambo University',
  'Arba Minch University',
  'Asosa University',
  'Bahir Dar University',
  'Bule Hora University',
  'Debre Berhan University',
  'Debre Markos University',
  'Dilla University',
  'Dire Dawa University',
  'Ethiopian Civil Service University',
  'Ethiopian Institute of Architecture, Building Construction and City Development',
  'Ethiopian Management Institute',
  'Gambella University',
  'Haramaya University',
  'Hawassa University',
  'Jimma University',
  'Jinka University',
  'Kotebe University of Education',
  'Madda Walabu University',
  'Mekelle University',
  'Metu University',
  'Mizan-Tepi University',
  'Oda Bultum University',
  'Rift Valley University',
  'Samara University',
  'Semera University',
  'St. Mary University',
  'Sodo University',
  'University of Gondar',
  'Unity University',
  'Wachemo University',
  'Wolaita Sodo University',
  'Wollo University',
  'Wollega University',
  'Wolkite University',
];

async function seedUniversities() {
  await connectDatabase();
  const uniqueNames = [...new Set(universities)];
  for (const name of uniqueNames) {
    const exists = await University.findOne({ name });
    if (!exists) {
      await University.create({ name, country: 'Ethiopia' });
    }
  }
  console.log(`Seeded ${uniqueNames.length} Ethiopian universities.`);
}

if (require.main === module) {
  seedUniversities()
    .catch((error) => {
      console.error('Unable to seed universities:', error.message);
      process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
}

module.exports = { seedUniversities, universities };
