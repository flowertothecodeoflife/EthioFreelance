import { PrismaClient, Role, KycStatus, JobType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as bcrypt from "bcrypt";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Clear existing data
  await prisma.transaction.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.job.deleteMany();
  await prisma.freelancerProfile.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  // Create Clients
  const client1 = await prisma.user.create({
    data: {
      name: "TechEthio Solutions",
      email: "info@techethio.com",
      passwordHash,
      role: Role.CLIENT,
      kycStatus: KycStatus.APPROVED,
    },
  });

  const client2 = await prisma.user.create({
    data: {
      name: "UNICEF Ethiopia",
      email: "jobs@unicefethiopia.org",
      passwordHash,
      role: Role.CLIENT,
      kycStatus: KycStatus.APPROVED,
    },
  });

  const client3 = await prisma.user.create({
    data: {
      name: "LexEthio Law Firm",
      email: "contact@lexethio.com",
      passwordHash,
      role: Role.CLIENT,
      kycStatus: KycStatus.APPROVED,
    },
  });

  // Create Freelancers
  const freelancer1 = await prisma.user.create({
    data: {
      name: "Abebe Kebede",
      email: "abebe@gmail.com",
      passwordHash,
      role: Role.FREELANCER,
      kycStatus: KycStatus.APPROVED,
      profile: {
        create: {
          title: "Senior Full Stack Engineer",
          bio: "Specializing in React, Node.js, and PostgreSQL with 5+ years of experience.",
          skills: ["React", "Node.js", "PostgreSQL", "Next.js"],
          hourlyRate: 350,
        },
      },
    },
  });

  const freelancer2 = await prisma.user.create({
    data: {
      name: "Saba Girma",
      email: "saba@gmail.com",
      passwordHash,
      role: Role.FREELANCER,
      kycStatus: KycStatus.APPROVED,
      profile: {
        create: {
          title: "UI/UX Designer & Graphic Artist",
          bio: "Creating beautiful branding assets, logos, and UI designs.",
          skills: ["Illustrator", "Branding", "Logo", "Figma"],
          hourlyRate: 250,
        },
      },
    },
  });

  // Create Jobs
  const jobsData = [
    {
      title: "Full Stack Web Developer (React + Node.js)",
      description: "We are looking for a skilled developer to build a freelance marketplace. The application should be highly responsive and built with Next.js, React, Node.js, and PostgreSQL.",
      budget: 25000,
      type: JobType.FIXED,
      location: "Remote",
      category: "IT & Software",
      skills: ["React", "Node.js", "PostgreSQL"],
      clientId: client1.id,
    },
    {
      title: "Amharic to English Translator – Legal Documents",
      description: "Looking for a certified translator to translate a 20-page business contract from Amharic to English. Must have law background.",
      budget: 8000,
      type: JobType.FIXED,
      location: "Addis Ababa",
      category: "Translation",
      skills: ["Amharic", "English", "Legal"],
      clientId: client3.id,
    },
    {
      title: "Logo & Brand Identity Design for Startup",
      description: "We need a modern logo, curated color palette, and business cards for our new logistics startup in Addis Ababa.",
      budget: 5000,
      type: JobType.FIXED,
      location: "Remote",
      category: "Design",
      skills: ["Illustrator", "Branding", "Logo"],
      clientId: client1.id,
    },
    {
      title: "Data Entry Specialist – NGO Survey Data",
      description: "Need support compiling Excel survey data from local region projects. Hourly contract for roughly 2 weeks.",
      budget: 200,
      type: JobType.HOURLY,
      location: "Addis Ababa",
      category: "Data Entry",
      skills: ["Excel", "Data Entry"],
      clientId: client2.id,
    },
    {
      title: "Mobile App Developer – Android (Kotlin)",
      description: "FinTech company seeking a mobile app developer to wire up transactional screens in our local banking integration app.",
      budget: 45000,
      type: JobType.FIXED,
      location: "Remote",
      category: "IT & Software",
      skills: ["Kotlin", "Android", "Firebase"],
      clientId: client1.id,
    },
    {
      title: "Mathematics Tutor – Grade 10-12",
      description: "Looking for an experienced educator to tutor an high-school student in Calculus and Algebra twice a week.",
      budget: 150,
      type: JobType.HOURLY,
      location: "Addis Ababa",
      category: "Tutoring",
      skills: ["Mathematics", "Teaching"],
      clientId: client2.id,
    },
  ];

  for (const job of jobsData) {
    await prisma.job.create({
      data: job,
    });
  }

  console.log("Seeding complete! Successfully added users, freelancer profiles, and jobs.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
