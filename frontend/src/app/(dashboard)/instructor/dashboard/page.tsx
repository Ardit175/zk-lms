'use client';

import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, Star, TrendingUp } from 'lucide-react';

const stats = [
  { label: 'Total Students', value: '342', icon: Users, change: '+8%' },
  { label: 'Active Courses', value: '5', icon: BookOpen, change: '' },
  { label: 'Avg. Rating', value: '4.8', icon: Star, change: '+0.2' },
  { label: 'Completion Rate', value: '78%', icon: TrendingUp, change: '+5%' },
];

const courses = [
  { title: 'Web Development Fundamentals', students: 156, rating: 4.9, status: 'PUBLISHED' },
  { title: 'React Advanced Patterns', students: 89, rating: 4.7, status: 'PUBLISHED' },
  { title: 'TypeScript Deep Dive', students: 67, rating: 4.8, status: 'PUBLISHED' },
  { title: 'Node.js Masterclass', students: 30, rating: 0, status: 'DRAFT' },
];

export default function InstructorDashboard() {
  return (
    <DashboardLayout role="INSTRUCTOR">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Instructor Dashboard</h1>
          <p className="text-slate-500 mt-1">Manage your courses and students</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  {stat.label}
                </CardTitle>
                <stat.icon className="h-5 w-5 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                {stat.change && (
                  <p className="text-xs text-green-600 mt-1">{stat.change} from last month</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>My Courses</CardTitle>
            <button className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
              Create Course
            </button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {courses.map((course) => (
                <div key={course.title} className="flex items-center justify-between p-4 rounded-lg border border-slate-200">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{course.title}</p>
                    <p className="text-sm text-slate-500">
                      {course.students} students enrolled
                      {course.rating > 0 && ` • ${course.rating} rating`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      course.status === 'PUBLISHED'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {course.status}
                    </span>
                    <button className="text-sm text-indigo-600 hover:underline">
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                    <div>
                      <p className="text-sm font-medium text-slate-900">Assignment {i}</p>
                      <p className="text-xs text-slate-500">Web Development • {5 - i} submissions</p>
                    </div>
                    <button className="text-sm text-indigo-600 hover:underline">
                      Review
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-200">
                  <p className="font-medium text-slate-900">React Q&A Session</p>
                  <p className="text-sm text-slate-500 mt-1">Tomorrow at 3:00 PM</p>
                  <button className="mt-3 text-sm text-indigo-600 hover:underline">
                    Start Session
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
