/**
 * Seed script — LinkedIn-based enrichment for yinjiasek@gmail.com
 *
 * Based on LinkedIn profile: https://www.linkedin.com/in/sekyinjia
 * UID: HhRZByjsOxRnk3nZ0GarlCxa55l2
 *
 * This script:
 * 1. Updates the user profile with richer bio/data
 * 2. Creates Events relevant to the user
 * 3. Creates EventMatches linking user to events
 * 4. Creates additional Posts showing varied activity
 * 5. Creates Matches for the new posts
 */

const { db, admin } = require('./config/firebase');

const MY_UID = 'HhRZByjsOxRnk3nZ0GarlCxa55l2';

// ── Enhanced profile based on LinkedIn ─────────────────────────────────────
const profileUpdate = {
  name: 'Yin Jia Sek',
  email: 'yinjiasek@gmail.com',
  portfolio_url: 'https://www.linkedin.com/in/sekyinjia',
  whatsapp_num: '+60134540120',
  matric_no: '23004122',
  major_id: 122, // Physics
  role: 'Student',
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
    { tag_id: 301, is_confirmed: true },  // Python — upgraded to confirmed
    { tag_id: 337, is_confirmed: true },  // MATLAB — upgraded to confirmed
    { tag_id: 322, is_confirmed: true },  // MySQL
    { tag_id: 306, is_confirmed: true },  // API Integration
  ],
  dev_tags: [402, 410, 419, 421, 427], // App Dev, Full-stack, Digital Media, EdTech, UI/UX Research
};

// ── Events data ────────────────────────────────────────────────────────────
const events = [
  {
    title: 'KitaHack 2025 — National Hackathon',
    organizer: 'Google Developer Student Clubs Malaysia',
    type: 'Competition',
    is_official: true,
    is_all_majors: true,
    target_majors: [],
    location: 'University of Malaya, Dewan Tunku Canselor',
    description: 'Malaysia\'s largest inter-university hackathon. Build innovative solutions using Google Cloud, Firebase, and AI. Open to all Malaysian university students. Grand prize: RM10,000 + Google Cloud credits.',
    event_date: admin.firestore.Timestamp.fromDate(new Date('2025-04-12T09:00:00+08:00')),
    related_tags: [302, 303, 316, 341, 301, 402, 410], // Flutter, Firebase, JS, Node, Python, App Dev, Full-stack
    action_links: {
      register_url: 'https://kitahack.gdsc.my',
      whatsapp_url: 'https://chat.whatsapp.com/kitahack2025',
    },
  },
  {
    title: 'UM Physics Colloquium — Quantum Computing Frontiers',
    organizer: 'Faculty of Science, University of Malaya',
    type: 'Talk',
    is_official: true,
    is_all_majors: false,
    target_majors: ['Faculty of Science'],
    location: 'Lecture Hall A, Physics Building, UM',
    description: 'Monthly colloquium featuring Prof. Dr. Ahmad Zainuddin presenting on quantum error correction and its implications for NISQ devices. Q&A session followed by networking.',
    event_date: admin.firestore.Timestamp.fromDate(new Date('2025-03-28T14:00:00+08:00')),
    related_tags: [337, 301], // MATLAB, Python
    action_links: {
      register_url: 'https://science.um.edu.my/colloquium',
    },
  },
  {
    title: 'Flutter Forward Extended KL — Building with Gemini',
    organizer: 'GDSC University of Malaya',
    type: 'Workshop',
    is_official: false,
    is_all_majors: true,
    target_majors: [],
    location: 'FSKTM Auditorium, UM',
    description: 'Hands-on workshop: integrate Google Gemini AI into Flutter apps. Learn multimodal prompts, streaming responses, and function calling. Bring your laptop with Flutter SDK installed.',
    event_date: admin.firestore.Timestamp.fromDate(new Date('2025-04-05T10:00:00+08:00')),
    related_tags: [302, 303, 306, 402], // Flutter, Firebase, API Integration, App Dev
    action_links: {
      register_url: 'https://gdsc.community.dev/flutter-forward-kl',
      whatsapp_url: 'https://chat.whatsapp.com/flutterkl',
    },
  },
  {
    title: 'UM Career Fair 2025 — Tech & Engineering',
    organizer: 'UM Career Centre',
    type: 'Other',
    is_official: true,
    is_all_majors: true,
    target_majors: [],
    location: 'Dewan Tunku Canselor, UM',
    description: 'Annual career exhibition featuring 50+ tech companies including Google, Grab, Petronas Digital, and startups. Resume review booth, mock interviews, and on-the-spot hiring.',
    event_date: admin.firestore.Timestamp.fromDate(new Date('2025-05-10T09:00:00+08:00')),
    related_tags: [335, 402, 410], // Project Management, App Dev, Full-stack
    action_links: {
      register_url: 'https://career.um.edu.my/fair2025',
    },
  },
  {
    title: 'UI/UX Design Sprint — Redesigning Campus Apps',
    organizer: 'UM Design Thinking Club',
    type: 'Workshop',
    is_official: false,
    is_all_majors: true,
    target_majors: [],
    location: 'Innovation Lab, UM Library',
    description: '48-hour design sprint! Work in teams to redesign an existing UM campus app. Learn user research, wireframing in Figma, and usability testing. Best design wins RM500.',
    event_date: admin.firestore.Timestamp.fromDate(new Date('2025-04-19T09:00:00+08:00')),
    related_tags: [324, 307, 346, 427], // Figma, UI Design, Canva, UI/UX Research
    action_links: {
      register_url: 'https://umdesignclub.my/sprint',
    },
  },
  {
    title: 'TransFinance — UM Student Financial System Launch',
    organizer: 'UMSU Finance Office',
    type: 'Other',
    is_official: true,
    is_all_majors: true,
    target_majors: [],
    location: 'UMSU Building, Level 3',
    description: 'Launch of TransFinance v2.0, the centralized financial management platform serving 120+ UM clubs. Demo session and call for student developers to join the maintenance team.',
    event_date: admin.firestore.Timestamp.fromDate(new Date('2025-03-15T15:00:00+08:00')),
    related_tags: [316, 341, 322, 331, 410], // JS, Node, MySQL, Git, Full-stack
    action_links: {
      register_url: 'https://umsu.um.edu.my/transfinance',
    },
  },
  {
    title: 'Python for Physics — Computational Methods Workshop',
    organizer: 'Physics Society UM',
    type: 'Workshop',
    is_official: false,
    is_all_majors: false,
    target_majors: ['Faculty of Science'],
    location: 'Computer Lab 2, Physics Building',
    description: 'Learn to solve physics problems computationally using Python, NumPy, and Matplotlib. Topics: numerical ODE solvers, Monte Carlo simulations, and data visualization for lab reports.',
    event_date: admin.firestore.Timestamp.fromDate(new Date('2025-04-26T10:00:00+08:00')),
    related_tags: [301, 337], // Python, MATLAB
    action_links: {
      register_url: 'https://physicsoc.um.edu.my/workshops',
    },
  },
  {
    title: 'Digital Media Production Bootcamp',
    organizer: 'Faculty of Arts and Social Sciences',
    type: 'Workshop',
    is_official: true,
    is_all_majors: true,
    target_majors: [],
    location: 'Media Lab, Ground Floor, FASS Building',
    description: 'Three-day intensive bootcamp covering video production, Adobe Premiere Pro, Photoshop compositing, and social media content strategy. Certificate provided upon completion.',
    event_date: admin.firestore.Timestamp.fromDate(new Date('2025-05-03T09:00:00+08:00')),
    related_tags: [325, 351, 346, 419], // Photoshop, Video Editing, Canva, Digital Media
    action_links: {
      register_url: 'https://fass.um.edu.my/bootcamp',
    },
  },
];

// ── Additional posts (beyond existing 4) ────────────────────────────────────
const newPosts = [
  {
    title: 'Figma Zero to Hero — UI/UX Study Group',
    type: 'Other',
    description: 'Starting a weekly Figma study group open to all faculties. We\'ll learn UI/UX design fundamentals, component libraries, auto-layout, prototyping, and build a portfolio piece together. Beginners welcome!',
    requirements: [324, 307, 346, 427], // Figma, UI Design, Canva, UI/UX Research
  },
  {
    title: 'Physics Lab Data Dashboard — Course Project',
    type: 'Coursework',
    description: 'Building an interactive data visualization dashboard for our physics lab experiments. Need teammates who can work with Python data processing and web frontend. Will use real experimental data from SIF2003.',
    requirements: [301, 316, 305, 337, 401], // Python, JavaScript, Tableau, MATLAB, Data Analysis
  },
];

// ── Main seed function ─────────────────────────────────────────────────────
async function seed() {
  console.log('═══════════════════════════════════════');
  console.log('  LinkedIn-Based Data Enrichment');
  console.log('  User: Yin Jia Sek (yinjiasek@gmail.com)');
  console.log('═══════════════════════════════════════\n');

  // ── Batch 1: Update user profile ──────────────────────────────────────────
  const batch1 = db.batch();

  console.log('1. Updating profile with enriched LinkedIn-based data...');
  batch1.update(db.collection('Users').doc(MY_UID), profileUpdate);

  await batch1.commit();
  console.log('✓ Profile updated\n');

  // ── Batch 2: Create Events ────────────────────────────────────────────────
  const batch2 = db.batch();
  const eventRefs = [];

  console.log('2. Creating events...');
  for (const ev of events) {
    const ref = db.collection('Events').doc();
    eventRefs.push(ref);
    console.log(`   + "${ev.title}"`);
    batch2.set(ref, {
      event_id: ref.id,
      ...ev,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  await batch2.commit();
  console.log(`✓ ${events.length} events created\n`);

  // ── Batch 3: Create EventMatches ──────────────────────────────────────────
  const batch3 = db.batch();

  const eventMatchData = [
    { idx: 0, score: 0.97, status: 'Joined',       reason: 'Perfect match — you\'re already building Teh Ais for KitaHack! Your Flutter + Firebase + Vertex AI stack directly aligns with this hackathon\'s goals.' },
    { idx: 1, score: 0.88, status: 'Joined',       reason: 'As a Physics major, this quantum computing colloquium is directly relevant to your academic path. Great networking opportunity with professors.' },
    { idx: 2, score: 0.95, status: 'Joined',       reason: 'Your Flutter and Firebase skills make this Gemini integration workshop a natural fit. Learn to add AI capabilities to your existing projects.' },
    { idx: 3, score: 0.82, status: 'Recommended',  reason: 'Your full-stack development skills and project management experience would impress tech recruiters. Consider attending the resume review booth.' },
    { idx: 4, score: 0.93, status: 'Joined',       reason: 'With your Figma and UI Design expertise, you\'d excel in this design sprint. A chance to apply your UI/UX Research interests in a competitive setting.' },
    { idx: 5, score: 0.91, status: 'Joined',       reason: 'You\'re already contributing to TransFinance as a developer! This launch event is essential for understanding the platform\'s next phase.' },
    { idx: 6, score: 0.86, status: 'Recommended',  reason: 'Combines your Physics background with Python skills — learn computational techniques that will boost your lab work and research potential.' },
    { idx: 7, score: 0.84, status: 'Recommended',  reason: 'Your Photoshop, Video Editing, and Canva skills show strong media interests. This bootcamp would formalize your digital media production abilities.' },
  ];

  console.log('3. Creating event matches...');
  for (const em of eventMatchData) {
    const ref = db.collection('EventMatches').doc();
    const ev = events[em.idx];
    console.log(`   • ${em.status}: "${ev.title}" (score: ${em.score})`);
    batch3.set(ref, {
      event_match_id: ref.id,
      event_id: eventRefs[em.idx].id,
      user_id: MY_UID,
      match_type: em.status === 'Joined' ? 'User_Prompt_Search' : 'Organizer_AI_Invite',
      score: em.score,
      status: em.status,
      ai_reason: em.reason,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  await batch3.commit();
  console.log(`✓ ${eventMatchData.length} event matches created\n`);

  // ── Batch 4: Create additional Posts + Matches ────────────────────────────
  const batch4 = db.batch();
  const newPostRefs = [];

  console.log('4. Creating additional posts...');
  for (const p of newPosts) {
    const ref = db.collection('Posts').doc();
    newPostRefs.push(ref);
    console.log(`   + "${p.title}"`);
    batch4.set(ref, {
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

  // Create matches for the new posts using existing demo friends
  const postMatchAssignments = [
    // Figma study group — design-oriented friends
    {
      postIdx: 0,
      friends: [
        { uid: 'demo_friend_001', name: 'Foo Jia Qian', score: 0.87, reason: 'Jia Qian\'s Canva and Photoshop skills provide a solid design foundation. Her Chinese Studies perspective could bring unique cultural design insights to UI/UX work.' },
        { uid: 'demo_friend_004', name: 'Lim Jing Jet', score: 0.83, reason: 'Jing Jet\'s Canva proficiency and project management skills would help organize the study group effectively. Cross-faculty collaboration enriches design thinking.' },
        { uid: 'demo_friend_013', name: 'Aiman Dhai', score: 0.90, reason: 'Aiman\'s Figma skills (learning) and Educational Technology background make this study group ideal for growth. His Canva expertise adds immediate value.' },
      ],
    },
    // Physics Lab Dashboard — data/science friends
    {
      postIdx: 1,
      friends: [
        { uid: 'demo_friend_009', name: 'Mok Zhen Yang', score: 0.94, reason: 'Same Physics cohort! Zhen Yang\'s Python and MATLAB skills are perfect for data processing. His quantum computing interest adds computational depth.' },
        { uid: 'demo_friend_006', name: 'Vincent Ng', score: 0.85, reason: 'Vincent\'s Python, Tableau, and PowerBI expertise would create impressive data visualizations. His Economics data analysis approach offers a fresh analytical perspective.' },
        { uid: 'demo_friend_015', name: 'Lau Jing Ying', score: 0.88, reason: 'Jing Ying\'s JavaScript and Python skills bridge the web frontend + data processing needs perfectly. Her CS background ensures robust implementation.' },
      ],
    },
  ];

  for (const assignment of postMatchAssignments) {
    const postRef = newPostRefs[assignment.postIdx];
    for (const friend of assignment.friends) {
      const matchRef = db.collection('Matches').doc();
      console.log(`   Match: ${friend.name} → "${newPosts[assignment.postIdx].title}" (${friend.score})`);
      batch4.set(matchRef, {
        match_id: matchRef.id,
        post_id: postRef.id,
        candidate_id: friend.uid,
        match_type: 'AI_Recommendation',
        score: friend.score,
        match_status: 'Recommended',
        reason: friend.reason,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }

  await batch4.commit();
  console.log(`✓ ${newPosts.length} posts + ${postMatchAssignments.reduce((s, a) => s + a.friends.length, 0)} matches created\n`);

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════');
  console.log('  LINKEDIN SEED COMPLETE!');
  console.log(`  • Updated: Profile (15 skills, 5 dev areas)`);
  console.log(`  • Created: ${events.length} events`);
  console.log(`  • Created: ${eventMatchData.length} event matches`);
  console.log(`  • Created: ${newPosts.length} posts`);
  console.log(`  • Created: ${postMatchAssignments.reduce((s, a) => s + a.friends.length, 0)} AI matches`);
  console.log('═══════════════════════════════════════');
}

seed()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('SEED ERROR:', err);
    process.exit(1);
  });
