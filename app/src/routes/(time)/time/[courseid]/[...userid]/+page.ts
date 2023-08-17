import type { PageLoad } from "./$types";
import { courseService } from "$lib/services/course";
import { fetchAllUsers, fetchUserById } from "$lib/utils/metrics";
import type { Course } from "$lib/models/course";
import type { UserMetric } from "$lib/types/metrics";
import { getKeys } from "$lib/environment";
import { initFirebase } from "$lib/utils/firebase";

export const ssr = false;

const isStringArray = (test: any[]): boolean => {
  return Array.isArray(test) && !test.some((value) => typeof value !== "string");
};

export const load: PageLoad = async ({ parent, params }) => {
  const data = await parent();

  if (data.session) {
    initFirebase(getKeys().firebase);
    const course: Course = await courseService.readCourse(params.courseid);
    const allLabs = course.walls.get("lab");
    const user: UserMetric = await fetchUserById(params.courseid, data.session, allLabs);
    const users: Map<string, UserMetric> = await fetchAllUsers(params.courseid, allLabs);
    const enrolledUsers: Map<string, UserMetric> = new Map<string, UserMetric>();
    if (course.hasEnrollment()) {
      const students = course.getEnrolledStudentIds();
      if (isStringArray(students)) {
        for (const githubId of users.keys()) {
          if (students.includes(githubId)) {
            const enrolledUser = users.get(githubId);
            if (enrolledUser) {
              enrolledUsers.set(githubId, enrolledUser);
            }
          }
        }
      }
    }
    return {
      user: user,
      course: course,
      allLabs: course.walls.get("lab"),
      calendar: course.calendar,
      ignorePin: course.lo.properties?.ignorepin?.toString(),
      users: users,
      enrolledUsers
    };
  }
};
