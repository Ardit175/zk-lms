import { PrismaClient, Role, CourseLevel, CourseStatus, LessonType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/eduai';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function main() {
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_PROD_SEED) {
    throw new Error(
      'Refusing to seed in production (this wipes all data). Set ALLOW_PROD_SEED=1 to override.'
    );
  }

  console.log('🌱 Starting database seed...\n');

  // Clean existing data
  await prisma.lessonProgress.deleteMany();
  await prisma.quizAnswer.deleteMany();
  await prisma.quizAttempt.deleteMany();
  await prisma.quizOption.deleteMany();
  await prisma.quizQuestion.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.assignmentSubmission.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.liveQuestion.deleteMany();
  await prisma.liveSession.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.module.deleteMany();
  await prisma.course.deleteMany();
  await prisma.category.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.instructorProfile.deleteMany();
  await prisma.user.deleteMany();

  console.log('✓ Cleaned existing data\n');

  const defaultPassword = await hashPassword('password123');

  // ─── ADMIN ─────────────────────────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: {
      email: 'admin@eduai.com',
      passwordHash: defaultPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: Role.ADMIN,
      isActive: true,
      isEmailVerified: true,
    },
  });
  console.log(`✓ Created admin: ${admin.email}`);

  // ─── INSTRUCTORS ───────────────────────────────────────────────────────────
  const instructor1 = await prisma.user.create({
    data: {
      email: 'john.doe@eduai.com',
      passwordHash: defaultPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: Role.INSTRUCTOR,
      isActive: true,
      isEmailVerified: true,
      instructorProfile: {
        create: {
          bio: 'Senior Web Developer with 10+ years of experience in React, Node.js, and cloud technologies.',
          expertise: ['React', 'Node.js', 'TypeScript', 'AWS'],
          websiteUrl: 'https://johndoe.dev',
          socialLinks: {
            twitter: 'johndoe',
            linkedin: 'johndoe',
            github: 'johndoe',
          },
        },
      },
    },
  });
  console.log(`✓ Created instructor: ${instructor1.email}`);

  const instructor2 = await prisma.user.create({
    data: {
      email: 'jane.smith@eduai.com',
      passwordHash: defaultPassword,
      firstName: 'Jane',
      lastName: 'Smith',
      role: Role.INSTRUCTOR,
      isActive: true,
      isEmailVerified: true,
      instructorProfile: {
        create: {
          bio: 'Data Scientist and AI enthusiast. Former ML Engineer at Google.',
          expertise: ['Python', 'Machine Learning', 'TensorFlow', 'Data Analysis'],
          websiteUrl: 'https://janesmith.ai',
          socialLinks: {
            twitter: 'janesmith_ai',
            linkedin: 'janesmith',
            github: 'janesmith',
          },
        },
      },
    },
  });
  console.log(`✓ Created instructor: ${instructor2.email}`);

  // ─── STUDENTS ──────────────────────────────────────────────────────────────
  const student1 = await prisma.user.create({
    data: {
      email: 'alice@student.com',
      passwordHash: defaultPassword,
      firstName: 'Alice',
      lastName: 'Johnson',
      role: Role.STUDENT,
      isActive: true,
      isEmailVerified: true,
      studentProfile: {
        create: {
          learningGoals: 'Become a full-stack developer and land my first tech job.',
          completedHours: 24.5,
          streakDays: 7,
          lastStudiedAt: new Date(),
        },
      },
    },
  });
  console.log(`✓ Created student: ${student1.email}`);

  const student2 = await prisma.user.create({
    data: {
      email: 'bob@student.com',
      passwordHash: defaultPassword,
      firstName: 'Bob',
      lastName: 'Williams',
      role: Role.STUDENT,
      isActive: true,
      isEmailVerified: true,
      studentProfile: {
        create: {
          learningGoals: 'Transition from marketing to data science.',
          completedHours: 12.0,
          streakDays: 3,
          lastStudiedAt: new Date(),
        },
      },
    },
  });
  console.log(`✓ Created student: ${student2.email}`);

  const student3 = await prisma.user.create({
    data: {
      email: 'charlie@student.com',
      passwordHash: defaultPassword,
      firstName: 'Charlie',
      lastName: 'Brown',
      role: Role.STUDENT,
      isActive: true,
      isEmailVerified: true,
      studentProfile: {
        create: {
          learningGoals: 'Learn programming as a hobby and build personal projects.',
          completedHours: 5.0,
          streakDays: 1,
          lastStudiedAt: new Date(),
        },
      },
    },
  });
  console.log(`✓ Created student: ${student3.email}`);

  // ─── CATEGORIES ────────────────────────────────────────────────────────────
  const webDevCategory = await prisma.category.create({
    data: {
      name: 'Web Development',
      slug: 'web-development',
    },
  });

  const dataCategory = await prisma.category.create({
    data: {
      name: 'Data Science',
      slug: 'data-science',
    },
  });
  console.log('✓ Created categories\n');

  // ─── COURSE 1: Web Development ─────────────────────────────────────────────
  const course1 = await prisma.course.create({
    data: {
      title: 'Modern Web Development with React & TypeScript',
      description: 'Master modern web development by building real-world applications with React, TypeScript, and Next.js. This comprehensive course covers everything from fundamentals to advanced patterns.',
      slug: 'modern-web-development-react-typescript',
      level: CourseLevel.INTERMEDIATE,
      status: CourseStatus.PUBLISHED,
      price: 49.99,
      totalDuration: 720,
      enrollmentCount: 2,
      averageRating: 4.8,
      instructorId: instructor1.id,
      categoryId: webDevCategory.id,
      modules: {
        create: [
          {
            title: 'Getting Started with React',
            description: 'Learn the fundamentals of React and set up your development environment.',
            orderIndex: 0,
            isPublished: true,
            lessons: {
              create: [
                {
                  title: 'Introduction to React',
                  content: `# Welcome to React

React is a JavaScript library for building user interfaces. It was developed by Facebook and is now maintained by Meta and a community of developers.

## Why React?

- **Component-Based**: Build encapsulated components that manage their own state
- **Declarative**: Design simple views for each state in your application
- **Learn Once, Write Anywhere**: Develop new features without rewriting existing code

## What You'll Learn

In this course, we'll cover:
1. React fundamentals and JSX
2. Components and Props
3. State and Lifecycle
4. Hooks
5. Context API
6. And much more!

Let's get started!`,
                  orderIndex: 0,
                  type: LessonType.TEXT,
                  duration: 600,
                  isPreview: true,
                  isPublished: true,
                },
                {
                  title: 'Setting Up Your Development Environment',
                  content: `# Development Environment Setup

Before we start coding, let's set up our development environment.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A code editor (VS Code recommended)

## Creating a New React Project

\`\`\`bash
npx create-react-app my-app --template typescript
cd my-app
npm start
\`\`\`

## Project Structure

After creating the project, you'll see:

- \`src/\` - Your source code
- \`public/\` - Static assets
- \`package.json\` - Dependencies and scripts

## Recommended VS Code Extensions

1. ES7+ React/Redux/React-Native snippets
2. Prettier - Code formatter
3. ESLint
4. TypeScript Importer`,
                  orderIndex: 1,
                  type: LessonType.TEXT,
                  duration: 900,
                  isPreview: false,
                  isPublished: true,
                },
                {
                  title: 'Understanding JSX',
                  content: `# JSX: JavaScript XML

JSX is a syntax extension for JavaScript that looks similar to HTML.

## Basic JSX

\`\`\`jsx
const element = <h1>Hello, World!</h1>;
\`\`\`

## Embedding Expressions

\`\`\`jsx
const name = 'Alice';
const element = <h1>Hello, {name}!</h1>;
\`\`\`

## JSX Rules

1. Return a single root element
2. Close all tags
3. Use camelCase for attributes (className, onClick)

## Example Component

\`\`\`tsx
function Welcome({ name }: { name: string }) {
  return (
    <div className="welcome">
      <h1>Welcome, {name}!</h1>
      <p>We're glad to have you here.</p>
    </div>
  );
}
\`\`\``,
                  orderIndex: 2,
                  type: LessonType.TEXT,
                  duration: 720,
                  isPreview: false,
                  isPublished: true,
                },
              ],
            },
          },
          {
            title: 'Components and Props',
            description: 'Deep dive into React components and how to pass data with props.',
            orderIndex: 1,
            isPublished: true,
            lessons: {
              create: [
                {
                  title: 'Functional Components',
                  content: `# Functional Components

Functional components are the modern way to write React components.

## Basic Syntax

\`\`\`tsx
function Greeting() {
  return <h1>Hello!</h1>;
}

// Arrow function syntax
const Greeting = () => {
  return <h1>Hello!</h1>;
};
\`\`\`

## With TypeScript

\`\`\`tsx
interface GreetingProps {
  name: string;
  age?: number;
}

const Greeting: React.FC<GreetingProps> = ({ name, age }) => {
  return (
    <div>
      <h1>Hello, {name}!</h1>
      {age && <p>You are {age} years old.</p>}
    </div>
  );
};
\`\`\``,
                  orderIndex: 0,
                  type: LessonType.TEXT,
                  duration: 840,
                  isPreview: false,
                  isPublished: true,
                },
                {
                  title: 'Props and PropTypes',
                  content: `# Understanding Props

Props (short for properties) are how we pass data from parent to child components.

## Passing Props

\`\`\`tsx
// Parent component
function App() {
  return <UserCard name="Alice" role="Developer" />;
}

// Child component
function UserCard({ name, role }: { name: string; role: string }) {
  return (
    <div className="card">
      <h2>{name}</h2>
      <p>{role}</p>
    </div>
  );
}
\`\`\`

## Children Prop

\`\`\`tsx
function Card({ children }: { children: React.ReactNode }) {
  return <div className="card">{children}</div>;
}

// Usage
<Card>
  <h1>Title</h1>
  <p>Content goes here</p>
</Card>
\`\`\``,
                  orderIndex: 1,
                  type: LessonType.TEXT,
                  duration: 900,
                  isPreview: false,
                  isPublished: true,
                },
              ],
            },
          },
          {
            title: 'State and Hooks',
            description: 'Learn how to manage state in React using hooks.',
            orderIndex: 2,
            isPublished: true,
            lessons: {
              create: [
                {
                  title: 'useState Hook',
                  content: `# The useState Hook

useState is the most fundamental hook for managing state in functional components.

## Basic Usage

\`\`\`tsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}
\`\`\`

## With TypeScript

\`\`\`tsx
const [user, setUser] = useState<User | null>(null);
const [items, setItems] = useState<string[]>([]);
\`\`\`

## Updating State Based on Previous Value

\`\`\`tsx
setCount(prevCount => prevCount + 1);
\`\`\``,
                  orderIndex: 0,
                  type: LessonType.TEXT,
                  duration: 960,
                  isPreview: false,
                  isPublished: true,
                },
                {
                  title: 'useEffect Hook',
                  content: `# The useEffect Hook

useEffect lets you perform side effects in functional components.

## Basic Usage

\`\`\`tsx
import { useEffect, useState } from 'react';

function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch(\`/api/users/\${userId}\`)
      .then(res => res.json())
      .then(data => setUser(data));
  }, [userId]);

  return user ? <div>{user.name}</div> : <p>Loading...</p>;
}
\`\`\`

## Cleanup Function

\`\`\`tsx
useEffect(() => {
  const subscription = someAPI.subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, []);
\`\`\``,
                  orderIndex: 1,
                  type: LessonType.TEXT,
                  duration: 1020,
                  isPreview: false,
                  isPublished: true,
                },
              ],
            },
          },
        ],
      },
    },
  });
  console.log(`✓ Created course: ${course1.title}`);

  // ─── COURSE 2: Data Science ────────────────────────────────────────────────
  const course2 = await prisma.course.create({
    data: {
      title: 'Python for Data Science: From Zero to Hero',
      description: 'Learn Python programming and data science fundamentals. This course covers pandas, NumPy, data visualization, and introduces machine learning concepts.',
      slug: 'python-data-science-zero-to-hero',
      level: CourseLevel.BEGINNER,
      status: CourseStatus.PUBLISHED,
      price: 39.99,
      totalDuration: 600,
      enrollmentCount: 1,
      averageRating: 4.9,
      instructorId: instructor2.id,
      categoryId: dataCategory.id,
      modules: {
        create: [
          {
            title: 'Python Fundamentals',
            description: 'Get started with Python programming basics.',
            orderIndex: 0,
            isPublished: true,
            lessons: {
              create: [
                {
                  title: 'Welcome to Python',
                  content: `# Welcome to Python!

Python is one of the most popular programming languages for data science.

## Why Python?

- Easy to learn and read
- Huge ecosystem of libraries
- Great for data manipulation and analysis
- Excellent for machine learning

## Your First Python Code

\`\`\`python
print("Hello, Data Science!")

# Variables
name = "Alice"
age = 25
is_student = True

# Basic operations
x = 10
y = 3
print(x + y)  # 13
print(x / y)  # 3.333...
\`\`\``,
                  orderIndex: 0,
                  type: LessonType.TEXT,
                  duration: 600,
                  isPreview: true,
                  isPublished: true,
                },
                {
                  title: 'Data Types and Structures',
                  content: `# Python Data Types and Structures

## Basic Types

\`\`\`python
# Numbers
integer_num = 42
float_num = 3.14

# Strings
text = "Hello, World!"

# Booleans
is_active = True
\`\`\`

## Collections

\`\`\`python
# Lists (mutable, ordered)
fruits = ["apple", "banana", "cherry"]

# Tuples (immutable, ordered)
coordinates = (10, 20)

# Dictionaries (key-value pairs)
person = {
    "name": "Alice",
    "age": 25,
    "city": "Tirana"
}

# Sets (unique values)
unique_numbers = {1, 2, 3, 3, 4}  # {1, 2, 3, 4}
\`\`\``,
                  orderIndex: 1,
                  type: LessonType.TEXT,
                  duration: 720,
                  isPreview: false,
                  isPublished: true,
                },
              ],
            },
          },
          {
            title: 'Working with Pandas',
            description: 'Master data manipulation with the pandas library.',
            orderIndex: 1,
            isPublished: true,
            lessons: {
              create: [
                {
                  title: 'Introduction to Pandas',
                  content: `# Introduction to Pandas

Pandas is the most popular data manipulation library in Python.

## Installation

\`\`\`bash
pip install pandas
\`\`\`

## Creating DataFrames

\`\`\`python
import pandas as pd

# From dictionary
data = {
    'Name': ['Alice', 'Bob', 'Charlie'],
    'Age': [25, 30, 35],
    'City': ['Tirana', 'London', 'Paris']
}
df = pd.DataFrame(data)

# From CSV
df = pd.read_csv('data.csv')
\`\`\`

## Basic Operations

\`\`\`python
# View first rows
df.head()

# Get info about DataFrame
df.info()
df.describe()

# Select columns
df['Name']
df[['Name', 'Age']]
\`\`\``,
                  orderIndex: 0,
                  type: LessonType.TEXT,
                  duration: 840,
                  isPreview: false,
                  isPublished: true,
                },
                {
                  title: 'Data Cleaning with Pandas',
                  content: `# Data Cleaning

Real-world data is messy. Let's learn how to clean it!

## Handling Missing Values

\`\`\`python
# Check for missing values
df.isnull().sum()

# Drop rows with missing values
df.dropna()

# Fill missing values
df.fillna(0)
df.fillna(df.mean())
\`\`\`

## Removing Duplicates

\`\`\`python
# Check for duplicates
df.duplicated().sum()

# Remove duplicates
df.drop_duplicates()
\`\`\`

## Data Type Conversion

\`\`\`python
# Convert to numeric
df['Age'] = pd.to_numeric(df['Age'])

# Convert to datetime
df['Date'] = pd.to_datetime(df['Date'])
\`\`\``,
                  orderIndex: 1,
                  type: LessonType.TEXT,
                  duration: 900,
                  isPreview: false,
                  isPublished: true,
                },
              ],
            },
          },
          {
            title: 'Data Visualization',
            description: 'Create beautiful visualizations with matplotlib and seaborn.',
            orderIndex: 2,
            isPublished: true,
            lessons: {
              create: [
                {
                  title: 'Matplotlib Basics',
                  content: `# Data Visualization with Matplotlib

Matplotlib is the foundation of data visualization in Python.

## Basic Plot

\`\`\`python
import matplotlib.pyplot as plt

x = [1, 2, 3, 4, 5]
y = [2, 4, 6, 8, 10]

plt.plot(x, y)
plt.xlabel('X axis')
plt.ylabel('Y axis')
plt.title('My First Plot')
plt.show()
\`\`\`

## Different Plot Types

\`\`\`python
# Bar chart
plt.bar(categories, values)

# Scatter plot
plt.scatter(x, y)

# Histogram
plt.hist(data, bins=10)

# Pie chart
plt.pie(sizes, labels=labels)
\`\`\``,
                  orderIndex: 0,
                  type: LessonType.TEXT,
                  duration: 780,
                  isPreview: false,
                  isPublished: true,
                },
              ],
            },
          },
        ],
      },
    },
  });
  console.log(`✓ Created course: ${course2.title}`);

  // ─── ENROLLMENTS ───────────────────────────────────────────────────────────
  await prisma.enrollment.create({
    data: {
      studentId: student1.id,
      courseId: course1.id,
      progressPercent: 75,
      lastAccessedAt: new Date(),
    },
  });

  await prisma.enrollment.create({
    data: {
      studentId: student1.id,
      courseId: course2.id,
      progressPercent: 45,
      lastAccessedAt: new Date(),
    },
  });

  await prisma.enrollment.create({
    data: {
      studentId: student2.id,
      courseId: course1.id,
      progressPercent: 20,
      lastAccessedAt: new Date(),
    },
  });

  await prisma.enrollment.create({
    data: {
      studentId: student3.id,
      courseId: course2.id,
      progressPercent: 10,
      lastAccessedAt: new Date(),
    },
  });
  console.log('✓ Created enrollments\n');

  // ─── NOTIFICATIONS ─────────────────────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      {
        userId: student1.id,
        type: 'ENROLLMENT_NEW',
        title: 'Welcome to the course!',
        body: 'You have successfully enrolled in Modern Web Development with React & TypeScript.',
        isRead: true,
      },
      {
        userId: instructor1.id,
        type: 'ENROLLMENT_NEW',
        title: 'New student enrolled',
        body: 'Alice Johnson has enrolled in your course.',
        isRead: false,
      },
    ],
  });
  console.log('✓ Created notifications');

  console.log('\n✅ Database seeded successfully!\n');
  console.log('Demo credentials (password: password123):');
  console.log('─────────────────────────────────────────');
  console.log('Admin:      admin@eduai.com');
  console.log('Instructor: john.doe@eduai.com');
  console.log('Instructor: jane.smith@eduai.com');
  console.log('Student:    alice@student.com');
  console.log('Student:    bob@student.com');
  console.log('Student:    charlie@student.com');
  console.log('─────────────────────────────────────────\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
