/*
 * submission schema and data accessor methods
 */

const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");

const { getDbReference } = require("../lib/mongo");
const { extractValidFields } = require("../lib/validation");

/*
 * Schema describing required/optional fields of a submission object.
 */
const SubmissionSchema = ({
  assignmentId: {required: true},
  studentId: {required: true},
  timestamp: {required: true},
  grade: {required: true},
  file: {required: true}
});
exports.SubmissionSchema = SubmissionSchema;

/*
 * Executes a DB query to return a single page of submissions.  Returns a
 * Promise that resolves to an array containing the fetched page of submissions.
 */
async function getSubmissionsPage(page) {
  const db = getDbReference();
  const collection = db.collection("submissions");
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
    .find({})
    .sort({ _id: 1 })
    .skip(offset)
    .limit(pageSize)
    .toArray();

  return {
    submissions: results,
    page: page,
    totalPages: lastPage,
    pageSize: pageSize,
    count: count,
  };
}
exports.getSubmissionsPage = getSubmissionsPage;

/*
 * Executes a DB query to insert a new submission into the database.  Returns
 * a Promise that resolves to the ID of the newly-created submission entry.
 */
async function insertNewSubmission(submission) {
  submission = extractValidFields(submission, submissionschema);
  const db = getDbReference();
  const collection = db.collection("submissions");
  const result = await collection.insertOne(submission);
  return result.insertedId;
}
exports.insertNewSubmission = insertNewSubmission;

/*
 * Executes a DB query to fetch detailed information about a single
 * specified submission based on its ID, including photo data for
 * the submission.  Returns a Promise that resolves to an object containing
 * information about the requested submission.  If no submission with the
 * specified ID exists, the returned Promise will resolve to null.
 */
async function getSubmissionById(id) {
  const db = getDbReference();
  const collection = db.collection("submissions");
  
}
exports.getSubmissionById = getSubmissionById;

/*
 * Executes a DB query to bulk insert an array new submission into the database.
 * Returns a Promise that resolves to a map of the IDs of the newly-created
 * submission entries.
 */
async function bulkInsertNewSubmissions(submissions) {}
exports.bulkInsertNewSubmissions = bulkInsertNewSubmissions;
