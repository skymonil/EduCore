import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/user.model.js';
import { Course } from '../models/course.model.js';
import { Lecture } from '../models/lecture.model.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/myapp';

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clean old data
    await User.deleteMany({});
    await Course.deleteMany({});
    await Lecture.deleteMany({});

    // Step 1: Create 5 users
    const users = await User.insertMany([
      { name: 'Alice', email: 'alice@example.com', password: 'password', role: 'student' },
      { name: 'Bob', email: 'bob@example.com', password: 'password', role: 'student' },
      { name: 'Charlie', email: 'charlie@example.com', password: 'password', role: 'student' },
      { name: 'Diana', email: 'diana@example.com', password: 'password', role: 'student' },
      { name: 'Eve', email: 'eve@example.com', password: 'password', role: 'student' },
    ]);

    const [u1, u2, u3, u4, u5] = users;

    // Step 2: Create 5 courses by user1 (instructor)
    const courses = await Promise.all(
      Array.from({ length: 5 }).map((_, i) =>
        Course.create({
          courseTitle: `Docker Mastery Course ${i + 1}`,
          subTitle: `Hands-on Course Subtitle ${i + 1}`,
          description: `Learn Docker from scratch in course ${i + 1}`,
          category: 'DevOps',
          courseLevel: ['Beginner', 'Medium', 'Advance'][i % 3],
          coursePrice: 49 + i * 10,
          courseThumbnail: `https://picsum.photos/200?course=${i + 1}`,
          creator: u1._id,
          isPublished: true,
        })
      )
    );

    // Step 3: Create 5 lectures per course
    for (const course of courses) {
      const lectures = await Promise.all(
        Array.from({ length: 5 }).map((_, j) =>
          Lecture.create({
            lectureTitle: `Lecture ${j + 1} - ${course.courseTitle}`,
            videoUrl: `https://videos.example.com/${course._id}/lecture${j + 1}`,
            publicId: `publicId-${course._id}-${j + 1}`,
            isPreviewFree: j === 0, // First lecture is free
          })
        )
      );

      course.lectures = lectures.map((l) => l._id);
      await course.save();
    }

    // Step 4: Enroll users 1, 2, 3 into all courses
    for (const user of [u1, u2, u3]) {
      user.enrolledCourses = courses.map((c) => c._id);
      await user.save();
    }

    // Step 5: Add users 1, 2, 3 to enrolledStudents of each course
    for (const course of courses) {
      course.enrolledStudents = [u1._id, u2._id, u3._id];
      await course.save();
    }

    console.log('🎉 Seed completed successfully');
  } catch (err) {
    console.error('❌ Error during seeding:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from DB');
  }
};

seed();
