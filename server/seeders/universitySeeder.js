// Purpose: Creates initial Ethiopian academic data.
const mongoose = require('mongoose');
const { connectDatabase } = require('../config/database');
const University = require('../models/University');
const College = require('../models/College');
const Department = require('../models/Department');
const Program = require('../models/Program');

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

const defaultCollegeTemplates = [
  'College of Business and Economics',
  'College of Social Sciences and Humanities',
  'College of Natural and Computational Sciences',
  'College of Engineering',
  'College of Health Sciences',
];

const defaultDepartmentTemplates = [
  'Business Administration',
  'Economics',
  'Computer Science',
  'Civil Engineering',
  'Nursing',
  'Psychology',
  'Biology',
  'Mathematics',
];

const academicStructure = {
  'Addis Ababa University': {
    colleges: ['College of Business and Economics', 'College of Social Sciences', 'College of Health Sciences', 'College of Natural and Computational Sciences', 'College of Education and Behavioral Studies'],
    departments: ['Business Administration', 'Economics', 'Accounting', 'Psychology', 'Sociology', 'Computer Science', 'Statistics', 'Biology', 'Chemistry', 'Nursing', 'Public Health'],
  },
  'Addis Ababa Science and Technology University': {
    colleges: ['College of Engineering', 'College of Applied Sciences', 'College of Architecture and Construction', 'College of Business and Management'],
    departments: ['Civil Engineering', 'Mechanical Engineering', 'Computer Engineering', 'Architecture', 'Construction Management', 'Electrical Engineering'],
  },
  'Adama Science and Technology University': {
    colleges: ['College of Engineering', 'College of Agriculture', 'College of Natural Sciences', 'College of Business and Economics'],
    departments: ['Computer Science', 'Civil Engineering', 'Electrical Engineering', 'Agricultural Economics', 'Soil Science', 'Business Administration'],
  },
  'Aksum University': {
    colleges: ['College of Business and Economics', 'College of Social Sciences and Humanities', 'College of Health Sciences', 'College of Engineering'],
    departments: ['Marketing Management', 'Economics', 'English Language', 'Sociology', 'Public Health', 'Civil Engineering'],
  },
  'Ambo University': {
    colleges: ['College of Natural and Computational Sciences', 'College of Education and Behavioral Studies', 'College of Agriculture and Veterinary Sciences'],
    departments: ['Mathematics', 'Biology', 'Chemistry', 'Physics', 'Education', 'Animal Science'],
  },
  'Arba Minch University': {
    colleges: ['College of Natural Sciences', 'College of Business and Economics', 'College of Social Sciences and Humanities', 'College of Engineering'],
    departments: ['Computer Science', 'Business Administration', 'Economics', 'Civil Engineering', 'Geology', 'English Language'],
  },
  'Bahir Dar University': {
    colleges: ['College of Agriculture and Environmental Sciences', 'College of Science', 'College of Business and Economics', 'College of Education'],
    departments: ['Agronomy', 'Plant Science', 'Biology', 'Chemistry', 'Economics', 'Accounting', 'Mathematics'],
  },
  'Hawassa University': {
    colleges: ['College of Agriculture', 'College of Social Sciences and Humanities', 'College of Medicine and Health Sciences', 'College of Natural and Computational Sciences'],
    departments: ['Agricultural Extension', 'Sociology', 'Public Health', 'Computer Science', 'Biology', 'Chemistry'],
  },
  'Jimma University': {
    colleges: ['College of Agriculture and Veterinary Medicine', 'College of Business and Economics', 'College of Health Sciences', 'College of Natural Sciences'],
    departments: ['Veterinary Medicine', 'Agronomy', 'Business Administration', 'Economics', 'Nursing', 'Biology'],
  },
  'Mekelle University': {
    colleges: ['College of Engineering', 'College of Health Sciences', 'College of Business and Economics', 'College of Natural and Computational Sciences'],
    departments: ['Civil Engineering', 'Mechanical Engineering', 'Nursing', 'Public Health', 'Business Administration', 'Computer Science'],
  },
  'University of Gondar': {
    colleges: ['College of Medicine and Health Sciences', 'College of Social Sciences and Humanities', 'College of Natural and Computational Sciences'],
    departments: ['Medicine', 'Nursing', 'Public Health', 'Psychology', 'Chemistry', 'Physics'],
  },
  'Wollo University': {
    colleges: ['College of Business and Economics', 'College of Social Sciences and Humanities', 'College of Science and Technology'],
    departments: ['Business Administration', 'Accounting', 'Economics', 'English Language', 'Computer Science', 'Mathematics'],
  },
};

async function seedUniversities() {
  await connectDatabase();
  const uniqueNames = [...new Set(universities)];
  for (const name of uniqueNames) {
    const exists = await University.findOne({ name });
    if (!exists) {
      await University.create({ name, country: 'Ethiopia' });
    }
  }

  for (const universityName of uniqueNames) {
    const university = await University.findOne({ name: universityName });
    if (!university) continue;

    const structure = academicStructure[universityName] || {};
    const collegeNames = Array.isArray(structure?.colleges) && structure.colleges.length
      ? structure.colleges
      : defaultCollegeTemplates;
    const departmentNames = Array.isArray(structure?.departments) && structure.departments.length
      ? structure.departments
      : defaultDepartmentTemplates;

    for (const collegeName of collegeNames) {
      const college = await College.findOne({ name: collegeName, university: university._id });
      if (!college) {
        const createdCollege = await College.create({ name: collegeName, university: university._id, description: `College in ${universityName}` });

        for (const departmentName of departmentNames.slice(0, Math.min(departmentNames.length, 6))) {
          const department = await Department.findOne({ name: departmentName, college: createdCollege._id });
          if (!department) {
            const createdDepartment = await Department.create({ name: departmentName, college: createdCollege._id, university: university._id });
            const programName = `${departmentName} Program`;
            const program = await Program.findOne({ name: programName, department: createdDepartment._id });
            if (!program) {
              await Program.create({ name: programName, department: createdDepartment._id, degree: 'Bachelor' });
            }
          }
        }
      }
    }
  }

  console.log(`Seeded ${uniqueNames.length} Ethiopian universities and academic structures.`);
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
