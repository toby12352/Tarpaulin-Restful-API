const { Router } = require("express");
const { connectToDb } = require("../lib/mongo");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const fs = require("fs");

const { generateAuthToken, requireAuthentication } = require("../lib/auth");
const { rateLimit } = require('../lib/rateLimit')
const {
  UserSchema,
  insertNewUser,
  getUserById,
  getUserByEmail,
  getUserCoursesById,
  insertCoursesToUser,
  deleteCourseFromUser,
  validateUser,
  getUserIdManual,
} = require("../models/user");

const {
  getCoursePage,
  insertNewCourse,
  CourseSchema,
  getCourseById,
  updateCourseById,
  deleteCourseById,
  insertNewStudentToCourse,
  deleteStudentFromCourse,
  getAssignmentByCourseId,
} = require("../models/course");

const {
  extractValidFields,
  validateAgainstSchema,
} = require("../lib/validation");

const router = Router();

/*
 * Route to return a list of courses.
 */
router.get("/", async function (req, res, next) {
  try {
    /*
     * Fetch page info, generate HATEOAS links for surrounding pages and then
     * send response.
     */
    const coursePage = await getCoursePage(parseInt(req.query.page) || 1);
    coursePage.links = {};
    if (coursePage.page < coursePage.totalPages) {
      coursePage.links.nextPage = `/courses?page=${coursePage.page + 1}`;
      coursePage.links.lastPage = `/courses?page=${coursePage.totalPages}`;
    }
    if (coursePage.page > 1) {
      coursePage.links.prevPage = `/courses?page=${coursePage.page - 1}`;
      coursePage.links.firstPage = "/courses?page=1";
    }
    res.status(200).send(coursePage);
  } catch (err) {
    next(err);
  }
});

/*
 * Route to create a new course.
 */
router.post("/", rateLimit, requireAuthentication, async function (req, res, next) {
  //Check the role of user based on token
  const user = await getUserById(req.user);

  if (user.role === "admin") {
    if (validateAgainstSchema(req.body, CourseSchema)) {
      try {
        const id = await insertNewCourse(req.body);
        await insertCoursesToUser(req.body.instructorId, id.toString());
        res.status(201).send({
          id: id,
        });
      } catch (err) {
        next(err);
      }
    } else {
      res.status(400).send({
        error: "Request body is not a valid course object.",
      });
    }
  } else {
    res.status(403).send({
      error: "Need to be admin to post course.",
    });
  }
});

/*
 * Route to fetch info about a specific course.
 */
router.get("/:courseId", async function (req, res, next) {
  try {
    const course = await getCourseById(req.params.courseId);
    if (course) {
      res.status(200).send(course);
    } else {
      next();
    }
  } catch (err) {
    next(err);
  }
});

/*
 * Route to update data for a course.
 */
router.patch(
  "/:courseId", 
  rateLimit,
  requireAuthentication,
  async function (req, res, next) {
    //check user role based on token
    const user = await getUserById(req.user);
    const idCheck = await getCourseById(req.params.courseId);
    console.log(" == role:", user.role)
    if (
      user.role === "admin" ||
      (user.role === "instructor" &&
        user._id.toString() === idCheck.instructorId)
    ) {
      try {
        const result = await updateCourseById(req.params.courseId, req.body);
        res.status(200).send(`Your data is modified`);
      } catch (err) {
        next(err);
      }
    } else {
      res.status(403).send({
        error:
          "Need to be either admin or instructor of the course to patch course information.",
      });
    }
  }
);

/*
 * Route to delete info about a specific course.
 */
router.delete(
  "/:courseId", 
  rateLimit,
  requireAuthentication,
  async function (req, res, next) {
    //Check user role based on token
    const user = await getUserById(req.user, true);
    
    if (user.role === "admin") {
      try {
        const roleChecker = await getCourseById(req.params.courseId)

        //Delete Instructors
        await deleteCourseFromUser(roleChecker.instructorId.toString(), req.params.courseId)

        if(roleChecker.student){
          //Delete Students
          for(let i = 0; i < roleChecker.student.length; i++){
            await deleteCourseFromUser(roleChecker.student[i].toString(), req.params.courseId)
          }
        }
        

        const course = await deleteCourseById(req.params.courseId);
        // await deleteCourseFromUser(courseId.instructorId.toString(), req.params.courseId);
        res.status(200).send(`Your data is deleted`);
      } catch (err) {
        next(err);
      }
    } else {
      res.status(403).send({
        error: "Need to be admin to delete courses.",
      });
    }
  }
);

/*
 * Route to fetch a list of students enrolled in the course.
 */
router.get(
  "/:courseId/students", 
  rateLimit,
  requireAuthentication,
  async function (req, res, next) {
    //check user role based on token
    const user = await getUserById(req.user, true);
    const idCheck = await getCourseById(req.params.courseId);

    if (
      user.role === "admin" ||
      (user.role === "instructor" &&
        user._id.toString() === idCheck.instructorId)
    ) {
      try {
        const course = await getCourseById(req.params.courseId);
        
        if (course.student) {
        const student = {
          student: course.student,
        };
        res.status(200).send({
          student: student
        });
        } else {
          res.status(403).send({
            student : []
          })
        }
      } catch (err) {
        next(err);
      }
    } else {
      res.status(403).send({
        error:
          "Need to be either admin or instructor of the course to access the student information.",
      });
    }
  }
);

/*
 * Route to post/enroll students in a course.
 */
router.post(
  "/:courseId/students", 
  rateLimit,
  requireAuthentication,
  async function (req, res, next) {
    //Check the role of user based on token
    const user = await getUserById(req.user, true);
    const idCheck = await getCourseById(req.params.courseId);
    
    if (
      user.role === "admin" ||
      (user.role === "instructor" &&
        user._id.toString() === idCheck.instructorId)
    ) {
      try {
        const courseInfo = await getCourseById(req.params.courseId);
        
        await insertNewStudentToCourse(req.params.courseId, req.body.add);

        for (let i = 0; i < req.body.add.length; i++) {
          await insertCoursesToUser(req.body.add[i], req.params.courseId);
        }
        await deleteStudentFromCourse(req.params.courseId, req.body.remove);
        for(let i = 0; i < req.body.remove.length; i++){
          await deleteCourseFromUser(req.body.remove[i], req.params.courseId)
        }
        res.status(201).send("Students added and removed from course");
      } catch (err) {
        next(err);
      }
    } else {
      res.status(403).send({
        error: "Need to be either admin or instructor of class to add/remove students"
      })
    }
  }
);

/*
 * Route to return a CSV file containing info about all students currently 
 * enrolled in the Course.
 * Route to download student information csvfile of respected course
 */
router.get(
  "/:courseId/roster",
  rateLimit,
  requireAuthentication,
  async function (req, res, next) {
    //Check the role of user based on token
    const user = await getUserById(req.user, true);
    const idCheck = await getCourseById(req.params.courseId);

    if (
      user.role === "admin" ||
      (user.role === "instructor" &&
        user._id.toString() === idCheck.instructorId)
    ) {
      try {
        const course = await getCourseById(req.params.courseId);
        if (course.student) {
          const transformedArray = await Promise.all(
            course.student.map(async (item) => {
              const user = await getUserById(item);
              return {
                id: item,
                name: user.name,
                email: user.email,
              };
            })
          );

          const csvWriter = createCsvWriter({
            path: "roster.csv",
            header: [
              { id: "id", title: "ID" },
              { id: "name", title: "Name" },
              { id: "email", title: "Email" },
            ],
          });
          csvWriter
            .writeRecords(transformedArray)
            .then(() =>
              fs.readFile("roster.csv", "utf8", (err, data) => {
                if (err) {
                  console.error(err);
                  return;
                }

                const lines = data.split("\n");
                const responseLines = [];
                lines.forEach((line) => {
                  if (line.trim() !== "") {
                    responseLines.push(line);
                  }
                });

                res.status(200).send(responseLines);
              })
            )
            .catch((err) => console.error(err));
        } else {
          next();
        }
      } catch (err) {
        next(err);
      }
    } else {
      res.status(403).send({
        error: "Need to be either admin or instructor of the course to download roster."
      })
    }
  }
);

/*
 * Route to delete a course.
 */
router.get("/:courseId/assignments", async function (req, res, next) {
  try {
    const assignment = await getAssignmentByCourseId(req.params.courseId);
    if (assignment) {
      res.status(200).send({ assignments: assignment });
    } else {
      next();
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;