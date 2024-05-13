import { db } from "$lib/services/utils/db/client";
import type { Session } from "@supabase/supabase-js";
import type { Course, LearningRecord } from "../models/lo-types";

export async function fetchLearningRecords(course: Course, session: Session): Promise<void> {
  const { data: metrics, error: studentsError } = await db.rpc('get_all_learner_records', {
    course_base: course.courseId
  });
// return a map or array of studentids instead of void (Set) of strings
  if (metrics && metrics.length > 0 && course.loIndex) {
    course.loIndex.forEach((lo) => {
      let learningRecord = metrics.find((m: { loid: string; }) => m.loid === lo.route);
      if (learningRecord) {
        const filteredLearningRecord: LearningRecord = {
          date: learningRecord.date,
          pageLoads: learningRecord.pageloads,
          timeActive: learningRecord.timeactive
        };
        if (!lo.learningRecords) {
          lo.learningRecords = new Map<string, LearningRecord>();
        }
        // Associate the filtered learning record with the user's student ID
        lo.learningRecords.set(session.user.user_metadata.user_name, filteredLearningRecord);
      }
    });
    course.loIndex = new Map(course.los.map((lo) => [lo.route, lo]));
  }
};
