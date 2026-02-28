/**
 * Seed script — Comprehensive Team & Pairing Data
 *
 * Goal: Cover 99% of team hiring scenarios so the AI always has
 * teammates to suggest. Creates posts by FRIENDS so that Yin Jia Sek
 * (and others) appear as recommended candidates.
 *
 * This script:
 * 1. Creates 10 new posts by 10 different friend users
 * 2. Creates AI matches linking the main user + other friends to those posts
 * 3. Creates matches for the 4 previously unmatched friends to existing posts
 *
 * Prerequisites: seed_demo.js and seed_linkedin.js must have been run first.
 */

const { db, admin } = require('./config/firebase');

const MY_UID = 'HhRZByjsOxRnk3nZ0GarlCxa55l2';

// ── Friend UIDs (from seed_demo.js) ─────────────────────────────────────────
// 0  demo_friend_001  Foo Jia Qian       Chinese Studies       Creative Writing, Photoshop, Canva, Copywriting
// 1  demo_friend_002  Tan Chin Shi       Economics             SPSS, R Programming, Tableau, PowerBI
// 2  demo_friend_003  Abqari Annuar      Law                   Creative Writing, Project Mgmt, Public Relations
// 3  demo_friend_004  Lim Jing Jet       Law                   Project Mgmt, Copywriting, Canva
// 4  demo_friend_005  Caton Lim          Quantity Surveying    AutoCAD, Excel VBA, PM, JavaScript, Node.js
// 5  demo_friend_006  Vincent Ng         Economics             Python, Tableau, PowerBI, SPSS
// 6  demo_friend_007  Chau Kai Lin       Biomedical Science    Python, SPSS, MATLAB, R Programming
// 7  demo_friend_008  Khaw Cher Chun     Quantity Surveying    AutoCAD, Excel VBA, PowerBI, PM
// 8  demo_friend_009  Mok Zhen Yang      Physics               Python, MATLAB, Git, C++
// 9  demo_friend_010  Abishek Prasad     Mech Engineering      AutoCAD, MATLAB, Python, C++
// 10 demo_friend_011  Joel Wong          Actuarial Science     R Programming, Python, SPSS, Excel VBA
// 11 demo_friend_012  Husna Nelly        Chemistry             Python, MATLAB, SPSS, Canva
// 12 demo_friend_013  Aiman Dhai         Education in Physics  MATLAB, Canva, PM, Figma
// 13 demo_friend_014  Tan Shu Ting       Actuarial Science     R Programming, Excel VBA, Tableau, Python
// 14 demo_friend_015  Lau Jing Ying      CS (InfoSys)          Python, JavaScript, MySQL, Flutter, Firebase

const F = (n) => `demo_friend_${String(n).padStart(3, '0')}`;

// ── Posts by friends ────────────────────────────────────────────────────────
const friendPosts = [
  // ── Post by Tan Chin Shi (Economics) ─────────────────────────
  {
    creator_uid: F(2),
    creator_name: 'Tan Chin Shi',
    title: 'Financial Data Dashboard — Semester Group Project',
    type: 'Coursework',
    description: 'Building an interactive financial analysis dashboard for our WQD2003 Data Visualization course. Need teammates who can handle data wrangling (R, Python) and create compelling visual stories with Tableau/PowerBI. Will analyze real UM student spending and financial literacy survey data. Open to all faculties!',
    requirements: [304, 333, 305, 345, 401], // SPSS, R Programming, Tableau, PowerBI, Data Analysis
    matches: [
      { uid: MY_UID,  name: 'Yin Jia Sek',   score: 0.84, reason: 'Yin Jia\'s Python and data processing skills complement the statistical analysis needs. His full-stack background could help build an interactive web frontend for the dashboard.' },
      { uid: F(6),    name: 'Vincent Ng',     score: 0.95, reason: 'Vincent has verified Python, Tableau, and PowerBI skills — a near-perfect match for this data visualization project. His Economics background ensures domain understanding.' },
      { uid: F(11),   name: 'Joel Wong',      score: 0.92, reason: 'Joel\'s R Programming and SPSS proficiency is ideal for statistical modeling. His Actuarial Science training means strong quantitative analysis capabilities.' },
      { uid: F(14),   name: 'Tan Shu Ting',   score: 0.90, reason: 'Shu Ting\'s R Programming, Excel VBA, and Tableau skills directly align with the project requirements. Great fit for data processing and visualization workflows.' },
      { uid: F(7),    name: 'Chau Kai Lin',   score: 0.83, reason: 'Kai Lin\'s Python and SPSS skills add statistical computing depth. Her Biomedical Science research methodology training brings rigorous analytical approaches.' },
    ],
  },

  // ── Post by Abqari Annuar (Law) ──────────────────────────────
  {
    creator_uid: F(3),
    creator_name: 'Abqari Annuar',
    title: 'UM Legal Clinic — Digital Case Management System',
    type: 'Other',
    description: 'The UM Legal Aid Centre needs a student-built case management system. We need writers for documentation, UI designers for an accessible interface, and project managers to coordinate with the law faculty. This is a high-impact real-world project that will serve actual clients.',
    requirements: [365, 335, 307, 324, 346], // Creative Writing, PM, UI Design, Figma, Canva
    matches: [
      { uid: MY_UID,  name: 'Yin Jia Sek',   score: 0.91, reason: 'Yin Jia\'s UI Design, Figma, and project management skills make him the ideal tech lead. His full-stack development experience ensures the system can be built end-to-end.' },
      { uid: F(1),    name: 'Foo Jia Qian',   score: 0.93, reason: 'Jia Qian\'s Creative Writing and Canva skills are perfect for documentation and interface copywriting. Her Chinese Studies perspective adds cultural sensitivity to the legal content.' },
      { uid: F(4),    name: 'Lim Jing Jet',   score: 0.89, reason: 'Jing Jet\'s Project Management, Copywriting, and Canva skills make him a strong coordinator. His Law background means he understands legal terminology and workflows.' },
      { uid: F(13),   name: 'Aiman Dhai',     score: 0.85, reason: 'Aiman\'s growing Figma skills and Project Management capabilities are well-suited. His Educational Technology background aligns with creating user-friendly instructional interfaces.' },
    ],
  },

  // ── Post by Khaw Cher Chun (Quantity Surveying) ──────────────
  {
    creator_uid: F(8),
    creator_name: 'Khaw Cher Chun',
    title: 'Smart Building Cost Estimator — BIM Hackathon Project',
    type: 'Competition',
    description: 'Entering the CIDB Smart Construction Hackathon. Building an AI-powered cost estimation tool that processes AutoCAD/BIM drawings and generates instant quantity takeoffs. Need a web developer for the frontend, someone with AutoCAD/BIM knowledge, and a data person for the ML model.',
    requirements: [338, 332, 345, 316, 402], // AutoCAD, Excel VBA, PowerBI, JavaScript, App Dev
    matches: [
      { uid: MY_UID,  name: 'Yin Jia Sek',   score: 0.87, reason: 'Yin Jia\'s JavaScript and app development expertise will power the web frontend. His hackathon experience (KitaHack) and project management skills ensure efficient team coordination.' },
      { uid: F(5),    name: 'Caton Lim',      score: 0.96, reason: 'Caton is the ideal teammate — verified AutoCAD, Excel VBA, JavaScript, and Project Management. His Quantity Surveying major means deep domain knowledge in cost estimation.' },
      { uid: F(15),   name: 'Lau Jing Ying',  score: 0.82, reason: 'Jing Ying\'s JavaScript and Python skills can handle the web interface and data processing pipeline. Her CS background brings software engineering best practices.' },
      { uid: F(10),   name: 'Abishek Prasad', score: 0.80, reason: 'Abishek\'s AutoCAD proficiency and Engineering background provide technical drawing expertise. His Python skills could help with the ML cost prediction model.' },
    ],
  },

  // ── Post by Tan Shu Ting (Actuarial Science) ─────────────────
  {
    creator_uid: F(14),
    creator_name: 'Tan Shu Ting',
    title: 'InsurTech Analytics — Predictive Risk Modeling',
    type: 'Research',
    description: 'Working on a research project with the Actuarial Science department to build predictive models for insurance risk assessment using Malaysian demographic data. Need R/Python programmers comfortable with statistical modeling, data visualization, and financial mathematics.',
    requirements: [333, 332, 301, 401, 305], // R Programming, Excel VBA, Python, Data Analysis, Tableau
    matches: [
      { uid: F(11),   name: 'Joel Wong',      score: 0.97, reason: 'Joel\'s R Programming, Python, SPSS, and Excel VBA form the complete toolkit for actuarial modeling. Fellow Actuarial Science student with aligned research interests.' },
      { uid: F(7),    name: 'Chau Kai Lin',   score: 0.86, reason: 'Kai Lin\'s Python and SPSS expertise supports the statistical analysis pipeline. Her Biomedical Science research training brings methodological rigor.' },
      { uid: F(6),    name: 'Vincent Ng',     score: 0.88, reason: 'Vincent\'s Python and Tableau skills bridge data analysis and visualization. His Economics background provides understanding of financial modeling concepts.' },
      { uid: F(2),    name: 'Tan Chin Shi',   score: 0.85, reason: 'Chin Shi\'s SPSS, R Programming, and Tableau proficiency aligns well. Her Economics major adds quantitative analysis perspective to the insurance domain.' },
      { uid: MY_UID,  name: 'Yin Jia Sek',   score: 0.78, reason: 'Yin Jia\'s Python skills and data processing experience would help automate the data pipeline. His JavaScript/Node.js skills could power a web-based results dashboard.' },
    ],
  },

  // ── Post by Lau Jing Ying (CS InfoSys) ───────────────────────
  {
    creator_uid: F(15),
    creator_name: 'Lau Jing Ying',
    title: 'UM Student Info Portal — Full-Stack Rebuild',
    type: 'Startup',
    description: 'Rebuilding the UM student information portal from scratch. The current system is outdated and frustrating. We\'re using Flutter + Firebase for the mobile app and Node.js for the API backend. Looking for Flutter developers, UI/UX designers, and backend engineers who want to make a real impact on campus.',
    requirements: [302, 303, 322, 301, 341], // Flutter, Firebase, MySQL, Python, Node.js
    matches: [
      { uid: MY_UID,  name: 'Yin Jia Sek',   score: 0.98, reason: 'Yin Jia is the PERFECT match — verified Flutter, Firebase, Node.js, and Git skills. He\'s already built Teh Ais using the exact same stack. His UI/UX design expertise completes the full picture.' },
      { uid: F(5),    name: 'Caton Lim',      score: 0.85, reason: 'Caton\'s JavaScript, Node.js, and Project Management skills make him a strong backend contributor. His cross-disciplinary perspective from Quantity Surveying adds unique insights.' },
      { uid: F(9),    name: 'Mok Zhen Yang',  score: 0.79, reason: 'Zhen Yang\'s Python, Git, and analytical skills can support data migration and testing. His Physics background shows strong logical thinking.' },
    ],
  },

  // ── Post by Mok Zhen Yang (Physics) ──────────────────────────
  {
    creator_uid: F(9),
    creator_name: 'Mok Zhen Yang',
    title: 'Quantum Simulation Toolkit — Physics Research FYP',
    type: 'Research',
    description: 'Final year research project: developing a Python-based toolkit for simulating quantum many-body systems. Need collaborators with strong computational physics skills (Python, MATLAB, C++), familiarity with Git for version control, and interest in quantum computing applications.',
    requirements: [301, 337, 317, 331, 401], // Python, MATLAB, C++, Git, Data Analysis
    matches: [
      { uid: MY_UID,  name: 'Yin Jia Sek',   score: 0.85, reason: 'Yin Jia\'s Python, MATLAB, and Git skills, combined with his Physics major background, make him a natural collaborator. His software engineering practices will improve code quality.' },
      { uid: F(10),   name: 'Abishek Prasad', score: 0.93, reason: 'Abishek\'s Python, MATLAB, and C++ skills are exactly what this project needs. His Mechanical Engineering computational methods experience translates directly to physics simulations.' },
      { uid: F(12),   name: 'Husna Nelly',    score: 0.87, reason: 'Husna\'s Python and MATLAB proficiency supports the computational toolkit. Her Chemistry research experience means familiarity with molecular modeling techniques.' },
      { uid: F(7),    name: 'Chau Kai Lin',   score: 0.81, reason: 'Kai Lin\'s Python skills and research methodology training from Biomedical Science bring cross-disciplinary computational thinking to quantum simulations.' },
    ],
  },

  // ── Post by Abishek Prasad (Mech Engineering) ────────────────
  {
    creator_uid: F(10),
    creator_name: 'Abishek Prasad',
    title: 'IoT Smart Lab Monitor — Engineering FYP Team',
    type: 'Research',
    description: 'Building a sensor network to monitor lab conditions (temperature, humidity, air quality, equipment status) across the Engineering faculty. Need embedded systems programmers, IoT platform developers, and someone for the data dashboard. Real IoT hardware provided by the faculty.',
    requirements: [338, 337, 301, 317, 316], // AutoCAD, MATLAB, Python, C++, JavaScript
    matches: [
      { uid: F(8),    name: 'Khaw Cher Chun', score: 0.88, reason: 'Cher Chun\'s AutoCAD and Excel VBA skills support the hardware design documentation and data logging. Fellow Built Environment student with complementary engineering knowledge.' },
      { uid: F(9),    name: 'Mok Zhen Yang',  score: 0.94, reason: 'Zhen Yang\'s Python, MATLAB, and C++ skills perfectly match the embedded programming needs. His Physics instrumentation lab experience is directly applicable.' },
      { uid: MY_UID,  name: 'Yin Jia Sek',   score: 0.83, reason: 'Yin Jia\'s JavaScript and full-stack skills can power the IoT dashboard web interface. His Firebase experience enables real-time data streaming from sensors.' },
      { uid: F(5),    name: 'Caton Lim',      score: 0.80, reason: 'Caton\'s JavaScript, Project Management, and AutoCAD skills cover the web frontend and technical documentation needs. His construction tech perspective adds practical IoT deployment insight.' },
    ],
  },

  // ── Post by Foo Jia Qian (Chinese Studies) ───────────────────
  {
    creator_uid: F(1),
    creator_name: 'Foo Jia Qian',
    title: 'UM Cultural Heritage — Digital Archive & Exhibition',
    type: 'Other',
    description: 'Creating a digital archive and virtual exhibition showcasing UM\'s multicultural heritage. Need designers for visual storytelling, writers for bilingual (BM/English/Chinese) content, video editors for interview footage, and someone who can build the web platform. Sponsored by the UM Cultural Centre.',
    requirements: [365, 325, 346, 351, 419], // Creative Writing, Photoshop, Canva, Video Editing, Digital Media
    matches: [
      { uid: MY_UID,  name: 'Yin Jia Sek',   score: 0.90, reason: 'Yin Jia\'s Photoshop, Canva, Video Editing, and full-stack skills make him ideal for both content creation and building the web platform. His Digital Media dev area aligns perfectly.' },
      { uid: F(3),    name: 'Abqari Annuar',  score: 0.84, reason: 'Abqari\'s Creative Writing skills and Public Relations knowledge are valuable for curating exhibition narratives and managing outreach to the campus community.' },
      { uid: F(4),    name: 'Lim Jing Jet',   score: 0.86, reason: 'Jing Jet\'s Copywriting and Canva skills support bilingual content creation. His Law background adds perspective on cultural heritage preservation policies.' },
      { uid: F(13),   name: 'Aiman Dhai',     score: 0.82, reason: 'Aiman\'s Canva proficiency and Educational Technology interests align with creating an engaging, interactive exhibition experience.' },
      { uid: F(12),   name: 'Husna Nelly',    score: 0.76, reason: 'Husna\'s Canva skills and Science background offer a unique interdisciplinary lens on UM\'s scientific heritage and achievements.' },
    ],
  },

  // ── Post by Joel Wong (Actuarial Science) ────────────────────
  {
    creator_uid: F(11),
    creator_name: 'Joel Wong',
    title: 'FinHack 2026 — Stock Trading Simulator Team',
    type: 'Competition',
    description: 'Forming a team for the FinHack national fintech competition. Building a real-time stock trading simulator with AI-driven market predictions. Need Python/JavaScript developers for the trading engine, data scientists for the ML models, and someone for the mobile frontend.',
    requirements: [301, 333, 316, 410, 302], // Python, R Programming, JavaScript, Full-stack, Flutter
    matches: [
      { uid: MY_UID,  name: 'Yin Jia Sek',   score: 0.93, reason: 'Yin Jia\'s JavaScript, Flutter, and full-stack expertise is exactly what the trading simulator frontend needs. His hackathon experience with KitaHack brings proven competition delivery skills.' },
      { uid: F(15),   name: 'Lau Jing Ying',  score: 0.91, reason: 'Jing Ying\'s Python, JavaScript, and Flutter skills cover both the trading backend and mobile app. Her CS (InfoSys) background ensures scalable architecture design.' },
      { uid: F(2),    name: 'Tan Chin Shi',   score: 0.86, reason: 'Chin Shi\'s R Programming and SPSS expertise powers the statistical analysis and market prediction models. Her Economics major provides financial market domain knowledge.' },
      { uid: F(6),    name: 'Vincent Ng',     score: 0.84, reason: 'Vincent\'s Python and data visualization tools (Tableau, PowerBI) can build real-time trading dashboards. His Economics and Fintech dev area is a strong domain match.' },
    ],
  },

  // ── Post by Caton Lim (Quantity Surveying) ───────────────────
  {
    creator_uid: F(5),
    creator_name: 'Caton Lim',
    title: 'Construction Project Planner — PropTech Startup MVP',
    type: 'Startup',
    description: 'Building an MVP for a PropTech startup idea: an AI-powered construction project planning tool. Auto-generates Gantt charts, tracks costs, and manages subcontractor schedules. Need web developers (JS/Node), data people for the AI scheduler, and someone with strong project management skills.',
    requirements: [316, 341, 332, 335, 338], // JavaScript, Node.js, Excel VBA, Project Management, AutoCAD
    matches: [
      { uid: MY_UID,  name: 'Yin Jia Sek',   score: 0.92, reason: 'Yin Jia\'s JavaScript, Node.js, and Project Management skills are a direct match. His Firebase and full-stack experience enables rapid MVP development with real-time features.' },
      { uid: F(8),    name: 'Khaw Cher Chun', score: 0.94, reason: 'Cher Chun\'s AutoCAD, Excel VBA, and PowerBI skills perfectly complement the construction planning domain. Fellow QS student with deep industry knowledge.' },
      { uid: F(15),   name: 'Lau Jing Ying',  score: 0.85, reason: 'Jing Ying\'s JavaScript, Python, and MySQL skills support the web platform and database layer. Her software engineering training ensures clean, maintainable code.' },
      { uid: F(13),   name: 'Aiman Dhai',     score: 0.78, reason: 'Aiman\'s Project Management skills and Canva proficiency can handle scheduling and marketing materials. His Education background helps with creating user-friendly tutorials.' },
    ],
  },
];

// ── Additional matches for previously unmatched friends to existing posts ────
// These friends had ZERO matches in the original seed data.
// We add them to the 6 existing posts (created by Yin Jia Sek) where they fit.
const backfillMatches = [
  // Tan Chin Shi → Physics Lab Data Dashboard (has Tableau + Data Analysis relevance)
  {
    friend_uid: F(2),
    friend_name: 'Tan Chin Shi',
    // This post_id must be looked up at runtime — we use the title to find it
    post_title: 'Physics Lab Data Dashboard — Course Project',
    score: 0.84,
    reason: 'Chin Shi\'s Tableau and SPSS skills directly support data visualization for lab results. Her R Programming proficiency adds statistical analysis capabilities beyond what the team currently has.',
  },
  // Abqari Annuar → Physics Department Open Day Publicity
  {
    friend_uid: F(3),
    friend_name: 'Abqari Annuar',
    post_title: 'Physics Department Open Day — Publicity Team',
    score: 0.81,
    reason: 'Abqari\'s Creative Writing and Public Relations skills are valuable for crafting compelling publicity narratives. His Project Management experience helps coordinate the Open Day logistics.',
  },
  // Khaw Cher Chun → TransFinance Developer (has some JavaScript/tech relevance)
  {
    friend_uid: F(8),
    friend_name: 'Khaw Cher Chun',
    post_title: 'UMSU Finance Office — TransFinance Developer',
    score: 0.77,
    reason: 'Cher Chun\'s Excel VBA and PowerBI expertise adds financial data processing capability to TransFinance. His Quantity Surveying cost analysis experience translates well to financial management systems.',
  },
  // Tan Shu Ting → Physics Lab Data Dashboard
  {
    friend_uid: F(14),
    friend_name: 'Tan Shu Ting',
    post_title: 'Physics Lab Data Dashboard — Course Project',
    score: 0.82,
    reason: 'Shu Ting\'s R Programming, Tableau, and Excel VBA skills align with the data analysis and visualization needs. Her quantitative training from Actuarial Science strengthens the analytics pipeline.',
  },
  // Tan Chin Shi → KitaHack team (weak match but shows AI considering cross-match)
  {
    friend_uid: F(2),
    friend_name: 'Tan Chin Shi',
    post_title: 'KitaHack — Full-stack Hackathon Team',
    score: 0.72,
    reason: 'While not a direct tech match, Chin Shi\'s strong data analysis skills could create compelling demo visualizations. Cross-faculty collaboration enriches the hackathon team diversity.',
  },
  // Khaw Cher Chun → IoT Sensor Data Analysis research
  {
    friend_uid: F(8),
    friend_name: 'Khaw Cher Chun',
    post_title: 'Research Assistant — IoT Sensor Data Analysis',
    score: 0.75,
    reason: 'Cher Chun\'s Excel VBA skills help with sensor data processing and logging. His engineering-adjacent Quantity Surveying background includes exposure to building sensor systems.',
  },
];

// ── Main seed function ─────────────────────────────────────────────────────
async function seed() {
  console.log('═══════════════════════════════════════');
  console.log('  Comprehensive Team & Pairing Seed');
  console.log('  Coverage target: 99% of scenarios');
  console.log('═══════════════════════════════════════\n');

  // ── Step 1: Create posts by friends + their matches ──────────────────────
  let totalPosts = 0;
  let totalMatches = 0;

  for (const fp of friendPosts) {
    const batch = db.batch();

    // Create the post
    const postRef = db.collection('Posts').doc();
    console.log(`📝 Post by ${fp.creator_name}: "${fp.title}"`);
    batch.set(postRef, {
      post_id: postRef.id,
      creator_id: fp.creator_uid,
      type: fp.type,
      title: fp.title,
      description: fp.description,
      status: 'Open',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      requirements: fp.requirements,
    });
    totalPosts++;

    // Create matches for this post
    for (const m of fp.matches) {
      const matchRef = db.collection('Matches').doc();
      console.log(`   ↳ Match: ${m.name} (score: ${m.score})`);
      batch.set(matchRef, {
        match_id: matchRef.id,
        post_id: postRef.id,
        candidate_id: m.uid,
        match_type: 'AI_Recommendation',
        score: m.score,
        match_status: 'Recommended',
        reason: m.reason,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      });
      totalMatches++;
    }

    await batch.commit();
  }

  console.log(`\n✓ Created ${totalPosts} posts + ${totalMatches} matches\n`);

  // ── Step 2: Backfill matches for previously unmatched friends ─────────────
  console.log('Backfilling matches for previously unmatched friends...');

  // Find existing posts by title
  const existingPosts = await db.collection('Posts')
    .where('creator_id', '==', MY_UID)
    .get();

  const postByTitle = {};
  existingPosts.forEach(doc => {
    const data = doc.data();
    postByTitle[data.title] = doc.id;
  });

  let backfilled = 0;
  const batchBackfill = db.batch();

  for (const bf of backfillMatches) {
    const postId = postByTitle[bf.post_title];
    if (!postId) {
      console.log(`   ⚠ Post not found: "${bf.post_title}" — skipping`);
      continue;
    }

    const matchRef = db.collection('Matches').doc();
    console.log(`   ↳ ${bf.friend_name} → "${bf.post_title}" (score: ${bf.score})`);
    batchBackfill.set(matchRef, {
      match_id: matchRef.id,
      post_id: postId,
      candidate_id: bf.friend_uid,
      match_type: 'AI_Recommendation',
      score: bf.score,
      match_status: 'Recommended',
      reason: bf.reason,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });
    backfilled++;
  }

  await batchBackfill.commit();
  console.log(`✓ Backfilled ${backfilled} matches\n`);

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════');
  console.log('  TEAM SEED COMPLETE!');
  console.log(`  • ${totalPosts} new posts by ${friendPosts.length} different friends`);
  console.log(`  • ${totalMatches} AI-recommended matches on friend posts`);
  console.log(`  • ${backfilled} backfill matches for prev. unmatched friends`);
  console.log(`  • Yin Jia Sek recommended in ${friendPosts.filter(p => p.matches.some(m => m.uid === MY_UID)).length}/10 friend posts`);
  console.log('');
  console.log('  Coverage summary:');
  console.log('  ─────────────────────────────────────');

  // Calculate per-user coverage
  const userMatches = {};
  userMatches[MY_UID] = { name: 'Yin Jia Sek', asCreator: 6, asCandidate: 0 };
  for (let i = 1; i <= 15; i++) {
    const uid = F(i);
    userMatches[uid] = { name: `Friend ${i}`, asCreator: 0, asCandidate: 0 };
  }

  // Count existing posts (by Yin Jia Sek — 6 posts)
  // Count matches from seed_demo (13) + seed_linkedin (6)
  // Original match assignments from seed_demo:
  const origMatches = {
    [F(1)]: 2, [F(4)]: 2, [F(5)]: 2, [F(6)]: 1, [F(7)]: 1,
    [F(9)]: 3, [F(10)]: 2, [F(11)]: 1, [F(12)]: 1, [F(13)]: 2,
    [F(14)]: 1, [F(15)]: 3,
  };
  for (const [uid, cnt] of Object.entries(origMatches)) {
    if (userMatches[uid]) userMatches[uid].asCandidate += cnt;
  }

  // New friend posts
  for (const fp of friendPosts) {
    if (userMatches[fp.creator_uid]) userMatches[fp.creator_uid].asCreator++;
    for (const m of fp.matches) {
      if (userMatches[m.uid]) userMatches[m.uid].asCandidate++;
    }
  }

  // Backfills
  for (const bf of backfillMatches) {
    if (userMatches[bf.friend_uid]) userMatches[bf.friend_uid].asCandidate++;
  }

  let coveredCount = 0;
  const allUserEntries = Object.entries(userMatches);
  for (const [uid, info] of allUserEntries) {
    const total = info.asCreator + info.asCandidate;
    const status = total > 0 ? '✓' : '✗';
    if (total > 0) coveredCount++;
    console.log(`  ${status} ${info.name.padEnd(18)} — ${info.asCreator} posts, ${info.asCandidate} candidate matches`);
  }

  const pct = ((coveredCount / allUserEntries.length) * 100).toFixed(0);
  console.log('  ─────────────────────────────────────');
  console.log(`  Coverage: ${coveredCount}/${allUserEntries.length} users (${pct}%)`);
  console.log('═══════════════════════════════════════');
}

seed()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('SEED ERROR:', err);
    process.exit(1);
  });
