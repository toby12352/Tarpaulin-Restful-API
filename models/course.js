/*
 * Business schema and data accessor methods
 */

const { ObjectId } = require("mongodb");

const { getDbReference } = require("../lib/mongo");
const { extractValidFields } = require("../lib/validation");

/*
 * Schema describing required/optional fields of a business object.
 */
const CourseSchema = {
  description: { required: false },
  subject: { required: true },
  number: { required: true },
  title: { required: true },
  term: { required: true },
  instructorId: { required: true },
  student: { required: false },
};
exports.CourseSchema = CourseSchema;

/*
 * Executes a DB query to return a single page of businesses.  Returns a
 * Promise that resolves to an array containing the fetched page of businesses.
 */
async function getCoursePage(page) {
  const db = getDbReference();
  const collection = db.collection("courses");
  const count = await collection.countDocuments();

  /*
   * Compute last page number and make sure page is within allowed bounds.
   * Compute offset into collection.
   */
  const pageSize = 10;
  const lastPage = Math.ceil(count / pageSize);
  page = page > lastPage ? lastPage : page;
  page = page < 1 ? 1 : page;
  const offset = (page - 1) * pageSize;

  const results = await collection
    .find({}, { student: 0, assignment: 0 })
    .sort({ _id: 1 })
    .skip(offset)
    .limit(pageSize)
    .toArray();

  return {
    courses: results,
    page: page,
    totalPages: lastPage,
    pageSize: pageSize,
    count: count,
  };
}
exports.getCoursePage = getCoursePage;

/*
 * Executes a DB query to insert a new business into the database.  Returns
 * a Promise that resolves to the ID of the newly-created business entry.
 */
async function insertNewCourse(course) {
  course = extractValidFields(course, CourseSchema);
  const db = getDbReference();
  const collection = db.collection("courses");
  const result = await collection.insertOne(course);
  return result.insertedId;
}
exports.insertNewCourse = insertNewCourse;

/*
 * Executes a DB query to fetch detailed information about a single
 * specified business based on its ID, including photo data for
 * the business.  Returns a Promise that resolves to an object containing
 * information about the requested business.  If no business with the
 * specified ID exists, the returned Promise will resolve to null.
 */
async function getCourseById(id) {
  const db = getDbReference();
  const collection = db.collection("courses");
  if (!ObjectId.isValid(id)) {
    return null;
  } else {
    const results = await collection
      .aggregate([
        { $match: { _id: new ObjectId(id) } },
        {
          $project: {
            student: 0, // Exclude the "student" field
            assignment: 0, // Exclude the "assignment" field
          },
        },
      ])
      .toArray();
    return results[0];
  }
}
exports.getCourseById = getCourseById;

async function updateCourseById(id, updateData) {
  const db = getDbReference();
  const collection = db.collection("courses");
  if (!ObjectId.isValid(id)) {
    return null;
  } else {
    const results = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
  }
}
exports.updateCourseById = updateCourseById;

async function deleteCourseById(id) {
  const db = getDbReference();
  const collection = db.collection("courses");
  if (!ObjectId.isValid(id)) {
    return null;
  } else {
    const results = await collection.deleteOne({ _id: new ObjectId(id) });
  }
}
exports.deleteCourseById = deleteCourseById;

async function getStudentsByCourseId(id) {
  const db = getDbReference();
  const collection = db.collection("courses");
  if (!ObjectId.isValid(id)) {
    return null;
  } else {
    const results = await collection
      .aggregate([{ $match: { _id: new ObjectId(id) } }])
      .toArray();
    return results[0];
  }
}
exports.getStudentsByCourseId = getStudentsByCourseId;

async function insertNewStudentToCourse(courseId, studentId) {
  const db = getDbReference();
  const collection = db.collection("courses");
  await collection.updateOne(
    { _id: new ObjectId(courseId) },
    { $push: { student: { $each: studentId } } }
  );
}
exports.insertNewStudentToCourse = insertNewStudentToCourse;

async function deleteStudentFromCourse(courseId, studentId) {
  const db = getDbReference();
  const collection = db.collection("courses");
  await collection.updateOne(
    { _id: new ObjectId(courseId) },
    { $pull: { student: { $in: studentId } } }
  );
}
exports.deleteStudentFromCourse = deleteStudentFromCourse;

/*
 * Executes a DB query to fetch detailed information about a single
 * specified business based on its ID, including photo data for
 * the business.  Returns a Promise that resolves to an object containing
 * information about the requested business.  If no business with the
 * specified ID exists, the returned Promise will resolve to null.
 */
async function getAssignmentByCourseId(id) {
  const db = getDbReference();
  const collection = db.collection("assignments");
  if (!ObjectId.isValid(id)) {
    return null;
  } else {
    const results = await collection
      .aggregate([{ $match: { courseId: id } }])
      .toArray();
    return results;
  }
}
exports.getAssignmentByCourseId = getAssignmentByCourseId;

/*
 * Executes a DB query to bulk insert an array new business into the database.
 * Returns a Promise that resolves to a map of the IDs of the newly-created
 * business entries.
 */
async function bulkInsertNewCourses(courses) {
  const coursesToInsert = courses.map(function (course) {
    return extractValidFields(course, CourseSchema);
  });
  const db = getDbReference();
  const collection = db.collection("courses");
  const result = await collection.insertMany(coursesToInsert);
  return result.insertedIds;
}
exports.bulkInsertNewCourses = bulkInsertNewCourses;
