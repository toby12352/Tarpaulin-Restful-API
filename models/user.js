/*
 * Business schema and data accessor methods
 */

const { ObjectId } = require("mongodb");
const bcrypt = require("bcryptjs")

const { getDbReference } = require("../lib/mongo");
const { extractValidFields } = require("../lib/validation");

/*
 * Schema describing required/optional fields of a business object.
 */
const UserSchema = {
  name: {required: true},
  email: {required: true},
  password: {required: true},
  role: {required: true},
  courses: {required: false}
};
exports.UserSchema = UserSchema;

/*
 * Insert New User into `users` collection
 */
exports.insertNewUser = async function (user) {
  const userToInsert = extractValidFields(user, UserSchema)

  const hash = await bcrypt.hash(userToInsert.password, 8)
  userToInsert.password = hash

  const db = getDbReference()
  const collection = db.collection('users')
  const result = await collection.insertOne(userToInsert)
  return result.insertedId
}

/*
 * Fetch a user from the DB based on user ID.
 */
async function getUserById (id, includePassword) {
  const db = getDbReference()
  const collection = db.collection('users')

  if (!ObjectId.isValid(id)) {
      return null
  } else {
      const results = await collection
          .aggregate([{$match: {_id: new ObjectId(id.toString())}}])
          // .project(includePassword ? {} : { password: 0 })
          .toArray()
      return results[0]
  }
}
exports.getUserById = getUserById;

/*
 * Fetch a user from the DB based on user email.
 */
async function getUserByEmail(email, includePassword){
  const db = getDbReference()
  const collection = db.collection('users')
  
  const results = await collection
    .find({ email: email })
    .project(includePassword ? {} : { password: 0 })
    .toArray()
  return results[0]
}
exports.getUserByEmail = getUserByEmail;

/* 
* This function will add courses to user.body's course array.
*/
exports.insertCoursesToUser = async function(id, courseId){
  const db = getDbReference()
  const collection = db.collection('users')

  if(!ObjectId.isValid(id)){
    return null
  } else {
    await collection.updateOne(
      {_id: new ObjectId(id)},
      {$push: {courses: courseId}}
    )
  }
}

/* 
* This function will remove courses to user.body's course array.
*/
exports.deleteCourseFromUser = async function(id, courseId) {
  const db = getDbReference();
  const collection = db.collection("users");
 
  if(!ObjectId.isValid(id)){
    return null
  } else {
    await collection.updateOne(
      {_id: new ObjectId(id)},
      {$pull: {courses: courseId}}
    )
  }
}

exports.validateUser = async function (email, password) {
  const user = await getUserByEmail(email, true)
  return user && await bcrypt.compare(password, user.password)
}

/*
 * Fetch userId based on user email
 */
exports.getUserIdManual = async function(email, password){
  const user = await getUserByEmail(email, true)
  return user._id.toString()
}