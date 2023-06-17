/*
 * assignment schema and data accessor methods
 */

const { ObjectId } = require("mongodb");

const { getDbReference } = require("../lib/mongo");
const { extractValidFields } = require("../lib/validation");

/*
 * Schema describing required/optional fields of a assignment object.
 */
const AssignmentSchema = {
  courseId: {required: true},
  title: {required: true},
  points: {required: true},
  due: {required: true}
};
exports.AssignmentSchema = AssignmentSchema;

const SubmissionSchema = {
  assignmentId: {required: true},
  studentId: {required: true},
  timestamp: {required: true},
  grade: {required: true},
  file: {required: true}
};
exports.SubmissionSchema = SubmissionSchema;

/*
 * Insert new assignment into `assignments` collection
 */
exports.insertNewAssignment = async function (assignment) {
  const assignmentToInsert = extractValidFields(assignment, AssignmentSchema)

  const db = getDbReference()
  const collection = db.collection('assignments')
  const result = await collection.insertOne(assignmentToInsert)
  
  return result.insertedId
}

exports.insertNewSubmission = async function(submission){
  const submissionToInsert = extractValidFields(submission, SubmissionSchema)
  const db = getDbReference()
  const collection = db.collection('submissions')
  const result = await collection.insertOne(submissionToInsert)

  return result.insertedId
}

/*
 * Executes a DB query to fetch detailed information about a single
 * specified assignment based on its ID, including photo data for
 * the assignment.  Returns a Promise that resolves to an object containing
 * information about the requested assignment.  If no assignment with the
 * specified ID exists, the returned Promise will resolve to null.
 */
async function getAssignmentById(id) {
  const db = getDbReference()
  const collection = db.collection('assignments')
  
  const results = await collection
    .find({_id: new ObjectId(id)})
    .toArray()
  
  return results[0]
}

exports.getAssignmentById = getAssignmentById;


/*
 * Executes a DB query to return a single page of businesses.  Returns a
 * Promise that resolves to an array containing the fetched page of businesses.
 */
async function getSubmissionPage(page) {
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
exports.getSubmissionPage = getSubmissionPage;


/*
 * Executes a DB query to fetch detailed information about a single
 * specified assignment based on its ID, including photo data for
 * the assignment.  Returns a Promise that resolves to an object containing
 * information about the requested assignment.  If no assignment with the
 * specified ID exists, the returned Promise will resolve to null.
 */
async function getSubmissionsById(id) {
  const db = getDbReference()
  const collection = db.collection('submissions')
  if (!ObjectId.isValid(id)) {
    return null
  } else {
    const results = await collection
      .aggregate([
        { $match: { assignmentId: id}},
        { $lookup: {
          from: "assignments",
          localField: "assignmentId",
          foreignField: "_id",
          as: "assignments"
        }}
      ])
      .toArray();
    console.log(" == results:", results)
    return results[0]
  }

  // const results = await collection
  //   .aggregate([
  //     {$match: {_id: new ObjectId(id)}},
  //     {$lookup: {
  //       from: "submissions",
  //       localField: "_id",
  //       foreignField: "assignmentId",
  //       as: "submissions"
  //       }
  //     }
  //   ]).toArray()
  
  // return results[0]
}
exports.getSubmissionsById = getSubmissionsById;

/*
 * Not yet working Patch Endpoint
 */
async function updateAssignmentById(id, updateData){
  const db = getDbReference()
  const collection = db.collection("assignments")
  if(!ObjectId.isValid(id)){
    return null
  } else {
    const results = await collection.updateOne(
      {_id: new ObjectId(id)},
      { $set: updateData}
    )
  }
}
exports.updateAssignmentById = updateAssignmentById

async function deleteAssignmentById(id) {
  const db = getDbReference()
  const collection = db.collection('assignments')

  const results = await collection
    .deleteOne({_id: new ObjectId(id)})
  
  return results
}
exports.deleteAssignmentById = deleteAssignmentById