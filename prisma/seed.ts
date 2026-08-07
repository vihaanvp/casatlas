import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Seeding database...")

  const admin = await prisma.user.upsert({
    where: { email: "admin@casatlas.local" },
    update: { role: "ADMIN", name: "Admin" },
    create: { email: "admin@casatlas.local", name: "Admin", role: "ADMIN" },
  })

  const teacher = await prisma.user.upsert({
    where: { email: "teacher@casatlas.local" },
    update: { role: "TEACHER", name: "Teacher" },
    create: { email: "teacher@casatlas.local", name: "Teacher", role: "TEACHER" },
  })

  const student = await prisma.user.upsert({
    where: { email: "student@casatlas.local" },
    update: { role: "STUDENT", name: "Student" },
    create: { email: "student@casatlas.local", name: "Student", role: "STUDENT" },
  })

  // Assign the student to the teacher so the teacher workflow is testable
  await prisma.teacherStudent.upsert({
    where: { teacherId_studentId: { teacherId: teacher.id, studentId: student.id } },
    update: {},
    create: { teacherId: teacher.id, studentId: student.id },
  })

  console.log(
    `Seeded ${student.email} (STUDENT), ${teacher.email} (TEACHER), ${admin.email} (ADMIN)`
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
