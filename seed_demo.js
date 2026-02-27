/**
 * Seed script for demo video:
 * 1. Update Yin Jia Sek's profile with proper tags
 * 2. Create 15 friend user documents
 * 3. Create posts by the user
 * 4. Create AI-recommended matches linking friends to posts
 */

const { db, admin } = require('./config/firebase');

const MY_UID = 'HhRZByjsOxRnk3nZ0GarlCxa55l2';

// ── Tag reference ──────────────────────────────
// Majors (0): 101 Chinese Studies, 103 Economics, 119 Law, 122 Physics,
//   127 Actuarial Science, 132 Chemistry, 139 CS(InfoSys), 151 Mech Eng,
//   159 Quantity Surveying, 164 Biomedical Science
// We need "Education in Physics" → create as 172

// Skills (2): 301 Python, 302 Flutter, 303 Firebase, 304 SPSS, 305 Tableau,
//   306 API Integration, 307 UI Design, 316 JavaScript, 322 MySQL, 324 Figma,
//   325 Photoshop, 331 Git, 335 Project Management, 337 MATLAB, 338 AutoCAD,
//   341 Node.js, 345 PowerBI, 346 Canva, 351 Video Editing, 354 Firebase Firestore,
//   361 Adobe Premiere Pro, 365 Creative Writing, 366 Copywriting

// Dev Areas (3): 401 Data Analysis, 402 App Development, 419 Digital Media Production,
//   421 Educational Technology, 427 UI/UX Research

// ── Friends data ───────────────────────────────
const friends = [
  {
    name: 'Foo Jia Qian',
    major_id: 101, // Chinese Studies
    courses_id: [203, 204, 255, 256, 236],
    skill_tags: [
      { tag_id: 365, is_confirmed: true },  // Creative Writing
      { tag_id: 325, is_confirmed: true },  // Photoshop
      { tag_id: 346, is_confirmed: true },  // Canva
      { tag_id: 366, is_confirmed: false }, // Copywriting
    ],
    dev_tags: [403, 419], // Digital Humanities, Digital Media
    matric_no: '23005101',
    email: 'jiaqian@siswa.um.edu.my',
    whatsapp_num: '+60121110001',
  },
  {
    name: 'Tan Chin Shi',
    major_id: 103, // Economics
    courses_id: [207, 208, 210, 275, 227],
    skill_tags: [
      { tag_id: 304, is_confirmed: true },  // SPSS
      { tag_id: 333, is_confirmed: true },  // R Programming
      { tag_id: 305, is_confirmed: true },  // Tableau
      { tag_id: 345, is_confirmed: false }, // PowerBI
    ],
    dev_tags: [401, 405], // Data Analysis, Fintech
    matric_no: '23005102',
    email: 'chinshi@siswa.um.edu.my',
    whatsapp_num: '+60121110002',
  },
  {
    name: 'Abqari Annuar',
    major_id: 119, // Law
    courses_id: [252, 270, 271, 272, 254],
    skill_tags: [
      { tag_id: 365, is_confirmed: true },  // Creative Writing
      { tag_id: 335, is_confirmed: true },  // Project Management
      { tag_id: 334, is_confirmed: false }, // Public Relations
    ],
    dev_tags: [421], // Educational Technology
    matric_no: '23005103',
    email: 'abqari@siswa.um.edu.my',
    whatsapp_num: '+60121110003',
  },
  {
    name: 'Lim Jing Jet',
    major_id: 119, // Law
    courses_id: [252, 270, 271, 273, 240],
    skill_tags: [
      { tag_id: 335, is_confirmed: true },  // Project Management
      { tag_id: 366, is_confirmed: true },  // Copywriting
      { tag_id: 346, is_confirmed: true },  // Canva
    ],
    dev_tags: [421, 403], // Educational Technology, Digital Humanities
    matric_no: '23005104',
    email: 'jingjett@siswa.um.edu.my',
    whatsapp_num: '+60121110004',
  },
  {
    name: 'Caton Lim',
    major_id: 159, // Quantity Surveying
    courses_id: [286, 287, 288, 242],
    skill_tags: [
      { tag_id: 338, is_confirmed: true },  // AutoCAD
      { tag_id: 332, is_confirmed: true },  // Excel VBA
      { tag_id: 335, is_confirmed: true },  // Project Management
      { tag_id: 316, is_confirmed: true },  // JavaScript
      { tag_id: 341, is_confirmed: false }, // Node.js
    ],
    dev_tags: [402, 410], // App Dev, Full-stack
    matric_no: '23005105',
    email: 'catonlim@siswa.um.edu.my',
    whatsapp_num: '+60121110005',
  },
  {
    name: 'Vincent Ng',
    major_id: 103, // Economics
    courses_id: [207, 208, 275, 228, 209],
    skill_tags: [
      { tag_id: 301, is_confirmed: true },  // Python
      { tag_id: 305, is_confirmed: true },  // Tableau
      { tag_id: 345, is_confirmed: true },  // PowerBI
      { tag_id: 304, is_confirmed: false }, // SPSS
    ],
    dev_tags: [401, 405, 428], // Data Analysis, Fintech, Big Data
    matric_no: '23005106',
    email: 'vincentng@siswa.um.edu.my',
    whatsapp_num: '+60121110006',
  },
  {
    name: 'Chau Kai Lin',
    major_id: 164, // Biomedical Science
    courses_id: [284, 285, 245, 222],
    skill_tags: [
      { tag_id: 301, is_confirmed: true },  // Python
      { tag_id: 304, is_confirmed: true },  // SPSS
      { tag_id: 337, is_confirmed: true },  // MATLAB
      { tag_id: 333, is_confirmed: false }, // R Programming
    ],
    dev_tags: [418, 424, 401], // Health-tech, Bioinformatics, Data Analysis
    matric_no: '23005107',
    email: 'kailin@siswa.um.edu.my',
    whatsapp_num: '+60121110007',
  },
  {
    name: 'Khaw Cher Chun',
    major_id: 159, // Quantity Surveying
    courses_id: [286, 287, 288, 242, 269],
    skill_tags: [
      { tag_id: 338, is_confirmed: true },  // AutoCAD
      { tag_id: 332, is_confirmed: true },  // Excel VBA
      { tag_id: 345, is_confirmed: true },  // PowerBI
      { tag_id: 335, is_confirmed: false }, // Project Management
    ],
    dev_tags: [420], // Smart City Tech
    matric_no: '23005108',
    email: 'cherchun@siswa.um.edu.my',
    whatsapp_num: '+60121110008',
  },
  {
    name: 'Mok Zhen Yang',
    major_id: 122, // Physics
    courses_id: [289, 282, 232, 244],
    skill_tags: [
      { tag_id: 301, is_confirmed: true },  // Python
      { tag_id: 337, is_confirmed: true },  // MATLAB
      { tag_id: 331, is_confirmed: true },  // Git
      { tag_id: 317, is_confirmed: false }, // C++
    ],
    dev_tags: [401, 431, 430], // Data Analysis, Quantum Computing, Embedded Systems
    matric_no: '23005109',
    email: 'zhenyang@siswa.um.edu.my',
    whatsapp_num: '+60121110009',
  },
  {
    name: 'Abishek Prasad',
    major_id: 151, // Mechanical Engineering
    courses_id: [282, 283, 232, 244],
    skill_tags: [
      { tag_id: 338, is_confirmed: true },  // AutoCAD
      { tag_id: 337, is_confirmed: true },  // MATLAB
      { tag_id: 301, is_confirmed: true },  // Python
      { tag_id: 317, is_confirmed: false }, // C++
    ],
    dev_tags: [415, 430, 412], // Robotics, Embedded Systems, IoT
    matric_no: '23005110',
    email: 'abishek@siswa.um.edu.my',
    whatsapp_num: '+60121110010',
  },
  {
    name: 'Joel Wong',
    major_id: 127, // Actuarial Science
    courses_id: [209, 228, 232, 275, 222],
    skill_tags: [
      { tag_id: 333, is_confirmed: true },  // R Programming
      { tag_id: 301, is_confirmed: true },  // Python
      { tag_id: 304, is_confirmed: true },  // SPSS
      { tag_id: 332, is_confirmed: true },  // Excel VBA
    ],
    dev_tags: [401, 405, 428], // Data Analysis, Fintech, Big Data
    matric_no: '23005111',
    email: 'joelwong@siswa.um.edu.my',
    whatsapp_num: '+60121110011',
  },
  {
    name: 'Husna Nelly',
    major_id: 132, // Chemistry
    courses_id: [245, 282, 232, 244],
    skill_tags: [
      { tag_id: 301, is_confirmed: true },  // Python
      { tag_id: 337, is_confirmed: true },  // MATLAB
      { tag_id: 304, is_confirmed: true },  // SPSS
      { tag_id: 346, is_confirmed: false }, // Canva
    ],
    dev_tags: [401, 425], // Data Analysis, Renewable Energy Tech
    matric_no: '23005112',
    email: 'husna@siswa.um.edu.my',
    whatsapp_num: '+60121110012',
  },
  {
    name: 'Aiman Dhai',
    major_id: 172, // Education in Physics (to be created)
    courses_id: [289, 282, 238, 240],
    skill_tags: [
      { tag_id: 337, is_confirmed: true },  // MATLAB
      { tag_id: 346, is_confirmed: true },  // Canva
      { tag_id: 335, is_confirmed: true },  // Project Management
      { tag_id: 324, is_confirmed: false }, // Figma
    ],
    dev_tags: [421, 437], // Educational Technology
    matric_no: '23005113',
    email: 'aimandhai@siswa.um.edu.my',
    whatsapp_num: '+60121110013',
  },
  {
    name: 'Tan Shu Ting',
    major_id: 127, // Actuarial Science
    courses_id: [209, 228, 232, 276, 222],
    skill_tags: [
      { tag_id: 333, is_confirmed: true },  // R Programming
      { tag_id: 332, is_confirmed: true },  // Excel VBA
      { tag_id: 305, is_confirmed: true },  // Tableau
      { tag_id: 301, is_confirmed: false }, // Python
    ],
    dev_tags: [401, 405], // Data Analysis, Fintech
    matric_no: '23005114',
    email: 'shuting@siswa.um.edu.my',
    whatsapp_num: '+60121110014',
  },
  {
    name: 'Lau Jing Ying',
    major_id: 139, // Computer Science (Information Systems)
    courses_id: [202, 205, 265, 269, 222],
    skill_tags: [
      { tag_id: 301, is_confirmed: true },  // Python
      { tag_id: 316, is_confirmed: true },  // JavaScript
      { tag_id: 322, is_confirmed: true },  // MySQL
      { tag_id: 302, is_confirmed: true },  // Flutter
      { tag_id: 303, is_confirmed: false }, // Firebase
    ],
    dev_tags: [402, 410, 446], // App Dev, Full-stack, Microservices
    matric_no: '23005115',
    email: 'jingying@siswa.um.edu.my',
    whatsapp_num: '+60121110015',
  },
];

// ── My profile update (Yin Jia Sek) ───────────
const myProfile = {
  major_id: 122, // Physics
  courses_id: [289, 282, 232, 244], // Quantum Mechanics, Thermodynamics, Linear Algebra, Advanced Calculus
  skill_tags: [
    { tag_id: 302, is_confirmed: true },  // Flutter
    { tag_id: 303, is_confirmed: true },  // Firebase
    { tag_id: 316, is_confirmed: true },  // JavaScript
    { tag_id: 341, is_confirmed: true },  // Node.js
    { tag_id: 325, is_confirmed: true },  // Photoshop
    { tag_id: 324, is_confirmed: true },  // Figma
    { tag_id: 346, is_confirmed: true },  // Canva
    { tag_id: 351, is_confirmed: true },  // Video Editing
    { tag_id: 335, is_confirmed: true },  // Project Management
    { tag_id: 331, is_confirmed: true },  // Git
    { tag_id: 307, is_confirmed: true },  // UI Design
    { tag_id: 301, is_confirmed: false }, // Python
    { tag_id: 337, is_confirmed: false }, // MATLAB
  ],
  dev_tags: [402, 410, 419, 421, 427], // App Dev, Full-stack, Digital Media, EdTech, UI/UX Research
  matric_no: '23004122',
  whatsapp_num: '+60134540120',
  portfolio_url: 'https://www.linkedin.com/in/sekyinjia',
};

// ── Posts by the user (for matching) ───────────
const posts = [
  {
    title: 'Physics Department Open Day — Publicity Team',
    type: 'Coursework',
    description: 'Looking for creative teammates to help design publicity materials (posters, Instagram content, videos) for the Physics Department Open Day 2026. Ideal if you have design or media skills!',
    requirements: [325, 346, 351, 365, 419], // Photoshop, Canva, Video Editing, Creative Writing, Digital Media
  },
  {
    title: 'KitaHack — Full-stack Hackathon Team',
    type: 'Competition',
    description: 'Building Teh Ais, a student collaboration platform, for KitaHack. Need teammates with Flutter, Firebase, Node.js, or UI/UX skills. Cross-faculty welcome!',
    requirements: [302, 303, 316, 341, 307, 402], // Flutter, Firebase, JS, Node, UI Design, App Dev
  },
  {
    title: 'Research Assistant — IoT Sensor Data Analysis',
    type: 'Research',
    description: 'Prof. needs help analyzing IoT sensor data from CIUM lab. Python/MATLAB skills preferred. Physics or Engineering students welcome.',
    requirements: [301, 337, 304, 401, 412], // Python, MATLAB, SPSS, Data Analysis, IoT
  },
  {
    title: 'UMSU Finance Office — TransFinance Developer',
    type: 'Other',
    description: 'Continuing development of TransFinance, the centralized financial management platform for 120+ UM clubs. Need a web developer familiar with JavaScript and databases.',
    requirements: [316, 341, 322, 331, 410], // JS, Node, MySQL, Git, Full-stack
  },
];

// ── Match reasons (AI-style) ──────────────────
function generateReason(friendName, friendMajor, postTitle, sharedSkills) {
  const reasons = [
    `${friendName} from ${friendMajor} brings complementary expertise with ${sharedSkills}. Their cross-disciplinary background would strengthen this project.`,
    `Strong match — ${friendName} has verified skills in ${sharedSkills} and their ${friendMajor} perspective adds unique value to "${postTitle}".`,
    `${friendName}'s ${friendMajor} background combined with ${sharedSkills} capabilities makes them an excellent candidate for this collaboration.`,
    `Recommended based on ${friendName}'s proven skills in ${sharedSkills}. Cross-faculty collaboration between Physics and ${friendMajor} could yield innovative results.`,
  ];
  return reasons[Math.floor(Math.random() * reasons.length)];
}

// ── Main seed function ─────────────────────────
async function seed() {
  const batch1 = db.batch();

  // 0. Create missing tag: Education in Physics (172)
  console.log('Creating tag: Education in Physics (172)...');
  batch1.set(db.collection('Tags').doc('172'), {
    name: 'Education in Physics',
    category_id: 0,
  });

  // 1. Update my profile
  console.log('Updating Yin Jia Sek profile...');
  batch1.update(db.collection('Users').doc(MY_UID), myProfile);

  // 2. Create friend users
  const friendUIDs = [];
  for (let i = 0; i < friends.length; i++) {
    const f = friends[i];
    // Generate a deterministic UID for each friend
    const uid = `demo_friend_${String(i + 1).padStart(3, '0')}`;
    friendUIDs.push(uid);

    console.log(`Creating user: ${f.name} (${uid})...`);
    batch1.set(db.collection('Users').doc(uid), {
      uid,
      name: f.name,
      role: 'Student',
      major_id: f.major_id,
      courses_id: f.courses_id,
      skill_tags: f.skill_tags,
      dev_tags: f.dev_tags,
      matric_no: f.matric_no,
      email: f.email,
      whatsapp_num: f.whatsapp_num,
      portfolio_url: '',
    });
  }

  await batch1.commit();
  console.log('✓ Batch 1 committed (tag + user profile + 15 friends)\n');

  // 3. Create posts
  const batch2 = db.batch();
  const postRefs = [];
  for (const p of posts) {
    const ref = db.collection('Posts').doc();
    postRefs.push(ref);
    console.log(`Creating post: "${p.title}" (${ref.id})...`);
    batch2.set(ref, {
      post_id: ref.id,
      creator_id: MY_UID,
      type: p.type,
      title: p.title,
      description: p.description,
      status: 'Open',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      requirements: p.requirements,
    });
  }
  await batch2.commit();
  console.log('✓ Batch 2 committed (4 posts)\n');

  // 4. Create matches — assign friends to posts with AI recommendations
  // Mapping: which friends match which posts based on skill overlap
  const matchAssignments = [
    // Post 0: Physics Open Day Publicity — creative/media people
    { postIdx: 0, friendIdxs: [0, 3, 12], scores: [0.92, 0.85, 0.88] },
    // Post 1: KitaHack — dev people
    { postIdx: 1, friendIdxs: [4, 14, 5], scores: [0.94, 0.96, 0.82] },
    // Post 2: Research IoT — science/eng + Python/MATLAB
    { postIdx: 2, friendIdxs: [8, 9, 6, 11], scores: [0.97, 0.91, 0.89, 0.86] },
    // Post 3: TransFinance — web dev
    { postIdx: 3, friendIdxs: [4, 14, 10], scores: [0.93, 0.90, 0.84] },
  ];

  const majorNames = {
    101: 'Chinese Studies', 103: 'Economics', 119: 'Law', 122: 'Physics',
    127: 'Actuarial Science', 132: 'Chemistry', 139: 'Information Systems',
    151: 'Mechanical Engineering', 159: 'Quantity Surveying',
    164: 'Biomedical Science', 172: 'Education in Physics',
  };

  const skillNames = {
    301: 'Python', 302: 'Flutter', 303: 'Firebase', 304: 'SPSS',
    305: 'Tableau', 307: 'UI Design', 316: 'JavaScript', 317: 'C++',
    322: 'MySQL', 324: 'Figma', 325: 'Photoshop', 331: 'Git',
    332: 'Excel VBA', 333: 'R Programming', 334: 'Public Relations',
    335: 'Project Management', 337: 'MATLAB', 338: 'AutoCAD',
    341: 'Node.js', 345: 'PowerBI', 346: 'Canva', 351: 'Video Editing',
    354: 'Firebase Firestore', 365: 'Creative Writing', 366: 'Copywriting',
  };

  const batch3 = db.batch();
  for (const assignment of matchAssignments) {
    const post = posts[assignment.postIdx];
    const postRef = postRefs[assignment.postIdx];

    for (let j = 0; j < assignment.friendIdxs.length; j++) {
      const fi = assignment.friendIdxs[j];
      const friend = friends[fi];
      const friendUID = friendUIDs[fi];
      const score = assignment.scores[j];

      // Find shared skill names
      const friendSkillIds = friend.skill_tags.map(s => s.tag_id);
      const shared = post.requirements
        .filter(r => friendSkillIds.includes(r) || friend.dev_tags.includes(r))
        .map(r => skillNames[r] || `Tag ${r}`)
        .slice(0, 3);

      const sharedStr = shared.length > 0 ? shared.join(', ') : 'relevant background';
      const reason = generateReason(
        friend.name,
        majorNames[friend.major_id] || 'their faculty',
        post.title,
        sharedStr,
      );

      const matchRef = db.collection('Matches').doc();
      console.log(`  Match: ${friend.name} → "${post.title}" (score: ${score})`);
      batch3.set(matchRef, {
        match_id: matchRef.id,
        post_id: postRef.id,
        candidate_id: friendUID,
        match_type: 'AI_Recommendation',
        score,
        match_status: 'Recommended',
        reason,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }
  await batch3.commit();
  console.log('✓ Batch 3 committed (AI matches)\n');

  console.log('═══════════════════════════════════════');
  console.log('  DEMO SEED COMPLETE!');
  console.log('  • Updated: Yin Jia Sek profile');
  console.log('  • Created: 15 friend users');
  console.log('  • Created: 4 posts');
  console.log('  • Created: 13 AI matches');
  console.log('  • Created: 1 new tag (Education in Physics)');
  console.log('═══════════════════════════════════════');
}

seed()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('SEED ERROR:', err);
    process.exit(1);
  });
