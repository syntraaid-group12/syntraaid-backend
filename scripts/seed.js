// scripts/seed.js
// Run with: npm run seed
// Creates the first admin user and optional demo data.
// Safe to re-run: skips if admin already exists.
// ─────────────────────────────────────────────────────────────
require('dotenv').config();

const dns = require('node:dns');
dns.setServers(['1.1.1.1', '8.8.8.8']);

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Models
const User                   = require('../models/User');
const VolunteerProfile       = require('../models/VolunteerProfile');
const Project                = require('../models/Project');
const Task                   = require('../models/Task');
const AttendanceLog          = require('../models/AttendanceLog');
const NotificationPreference = require('../models/NotificationPreference');

// ── Config – edit before first run ───────────────────────────
const ADMIN_EMAIL    = process.env.SEED_ADMIN_EMAIL    || 'admin@syntraaid.org';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin1234!';
const SEED_DEMO_DATA = process.env.SEED_DEMO_DATA !== 'false'; // default true

const log = (msg) => console.log(`[seed] ${msg}`);

// ── Main ──────────────────────────────────────────────────────
const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  log('MongoDB connected');

  // ── 1. Admin user ─────────────────────────────────────────
  let admin = await User.findOne({ email: ADMIN_EMAIL });
  if (admin) {
    log(`Admin already exists: ${ADMIN_EMAIL} – skipping admin creation`);
  } else {
    admin = await User.create({
      email:        ADMIN_EMAIL,
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 12),
      role:         'admin',
      isActive:     true,
      inviteToken:  null,
      invitedBy:    null,
    });
    await NotificationPreference.create({ userId: String(admin._id) });
    log(`✅  Admin created: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}  ← CHANGE THIS IMMEDIATELY`);
  }

  if (!SEED_DEMO_DATA) {
    log('SEED_DEMO_DATA=false – skipping demo data');
    await mongoose.disconnect();
    return;
  }

  // ── 2. Demo coordinator ───────────────────────────────────
  let coordinator = await User.findOne({ email: 'coordinator@syntraaid.org' });
  if (!coordinator) {
    coordinator = await User.create({
      email:        'coordinator@syntraaid.org',
      passwordHash: await bcrypt.hash('Coord1234!', 12),
      role:         'coordinator',
      isActive:     true,
      invitedBy:    String(admin._id),
    });
    await NotificationPreference.create({ userId: String(coordinator._id) });
    log('✅  Demo coordinator created: coordinator@syntraaid.org / Coord1234!');
  }

  // ── 3. Demo volunteer ─────────────────────────────────────
  let volunteer = await User.findOne({ email: 'volunteer@syntraaid.org' });
  if (!volunteer) {
    volunteer = await User.create({
      email:        'volunteer@syntraaid.org',
      passwordHash: await bcrypt.hash('Vol12345!', 12),
      role:         'volunteer',
      isActive:     true,
      invitedBy:    String(admin._id),
    });
    await NotificationPreference.create({ userId: String(volunteer._id) });

    // Volunteer profile
    await VolunteerProfile.create({
      userId:            String(volunteer._id),
      firstName:         'Demo',
      lastName:          'Volunteer',
      bio:               'Seeded demo volunteer account.',
      skills:            ['teaching', 'logistics'],
      availabilityDays:  ['MON', 'WED', 'FRI'],
      availabilityTimes: ['morning', 'afternoon'],
    });
    log('✅  Demo volunteer created: volunteer@syntraaid.org / Vol12345!');
  }

  // ── 4. Demo donor ─────────────────────────────────────────
  let donor = await User.findOne({ email: 'donor@syntraaid.org' });
  if (!donor) {
    donor = await User.create({
      email:        'donor@syntraaid.org',
      passwordHash: await bcrypt.hash('Donor1234!', 12),
      role:         'donor',
      isActive:     true,
      invitedBy:    String(admin._id),
    });
    await NotificationPreference.create({ userId: String(donor._id) });
    log('✅  Demo donor created: donor@syntraaid.org / Donor1234!');
  }

  // ── 5. Demo project ───────────────────────────────────────
  let project = await Project.findOne({ title: 'Community Literacy Programme' });
  if (!project) {
    project = await Project.create({
      title:         'Community Literacy Programme',
      description:   'Seeded demo project for testing the SyntraAid platform.',
      goals:         'Improve reading and writing skills for 200 community members.',
      status:        'active',
      coordinatorId: String(coordinator._id),
      createdBy:     String(admin._id),
      startDate:     new Date(),
      endDate:       new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      volunteers:    [String(volunteer._id)],
      assignedAt:    [{ volunteerId: String(volunteer._id), assignedBy: String(admin._id), assignedAt: new Date() }],
      milestones: [
        { title: 'Needs Assessment Complete',   dueDate: new Date(Date.now() + 14 * 86400000), isCompleted: true,  completedAt: new Date(), sortOrder: 1 },
        { title: 'Curriculum Developed',        dueDate: new Date(Date.now() + 30 * 86400000), isCompleted: false, sortOrder: 2 },
        { title: 'Volunteer Training Session',  dueDate: new Date(Date.now() + 45 * 86400000), isCompleted: false, sortOrder: 3 },
        { title: 'Programme Launch',            dueDate: new Date(Date.now() + 60 * 86400000), isCompleted: false, sortOrder: 4 },
      ],
    });
    log(`✅  Demo project created: "${project.title}"`);
  }

  // ── 6. Demo tasks ─────────────────────────────────────────
  const taskCount = await Task.countDocuments({ projectId: String(project._id) });
  if (taskCount === 0) {
    await Task.insertMany([
      {
        projectId:   String(project._id),
        title:       'Prepare volunteer onboarding pack',
        description: 'Create materials and schedule for volunteer orientation.',
        status:      'completed',
        dueDate:     new Date(Date.now() - 7 * 86400000),
        assignees:   [String(volunteer._id)],
        createdBy:   String(coordinator._id),
        completedAt: new Date(),
      },
      {
        projectId:   String(project._id),
        title:       'Design literacy assessment tool',
        description: 'Build a simple pre/post assessment for participants.',
        status:      'in_progress',
        dueDate:     new Date(Date.now() + 7 * 86400000),
        assignees:   [String(volunteer._id)],
        createdBy:   String(coordinator._id),
      },
      {
        projectId:   String(project._id),
        title:       'Source reading materials',
        description: 'Identify and procure age-appropriate books and worksheets.',
        status:      'not_started',
        dueDate:     new Date(Date.now() + 21 * 86400000),
        assignees:   [],
        createdBy:   String(coordinator._id),
      },
    ]);
    log('✅  Demo tasks created');
  }

  // ── 7. Demo attendance logs ───────────────────────────────
  const attendanceCount = await AttendanceLog.countDocuments({ projectId: String(project._id) });
  if (attendanceCount === 0) {
    const entries = [];
    for (let i = 6; i >= 0; i--) {
      entries.push({
        volunteerId: String(volunteer._id),
        projectId:   String(project._id),
        sessionDate: new Date(Date.now() - i * 86400000),
        hoursLogged: 3,
        loggedBy:    String(volunteer._id),
      });
    }
    await AttendanceLog.insertMany(entries);
    log('✅  Demo attendance logs created (7 sessions × 3h = 21h)');
  }

  log('\n────────────────────────────────────────────');
  log('Seed complete. Login credentials:');
  log(`  Admin:       ${ADMIN_EMAIL}      / ${ADMIN_PASSWORD}`);
  log('  Coordinator: coordinator@syntraaid.org / Coord1234!');
  log('  Volunteer:   volunteer@syntraaid.org   / Vol12345!');
  log('  Donor:       donor@syntraaid.org       / Donor1234!');
  log('────────────────────────────────────────────\n');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
