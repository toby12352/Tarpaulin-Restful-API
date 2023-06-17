const { Router } = require("express");
const { getDbReference } = require("../lib/mongo");
const { validateAgainstSchema } = require("../lib/validation");
const { rateLimit } = require('../lib/rateLimit')

const { AssignmentSchema, SubmissionSchema, insertNewAssignment, insertNewSubmission, getAssignmentById, getSubmissionPage, getSubmissionsById, updateAssignmentById, deleteAssignmentById } = require("../models/assignment");
const { UserSchema, insertNewUser, getUserById, getUserByEmail, insertCoursesToUser, validateUser, getUserIdManual } = require('../models/user')
const {
    getCoursePage,
    insertNewCourse,
    CourseSchema,
    getCourseById,
    updateCourseById,
    deleteCourseById,
  } = require("../models/course");

const { generateAuthToken, requireAuthentication } = require("../lib/auth");
const { ObjectId } = require("bson");
const { getSubmissionsPage } = require("../models/submission");
const router = Router();

/*
 * Route to create a new assignment.
 */
router.post("/", rateLimit, requireAuthentication, async function (req, res, next) {

    //Check the role of user based on token
    const user = await getUserById(req.user)
    const idCheck = await getCourseById(req.body.courseId)
    
    if(user.role === "admin" || (user.role === "instructor" && user._id.toString() === idCheck.instructorId)){
        if(validateAgainstSchema(req.body, AssignmentSchema)){
            try{
                const id = await insertNewAssignment(req.body)
                res.status(201).send({
                    id: id
                })
            } catch (e) {
                next(e)
            }
        } else {
            res.status(400).send({
                error: "Requested body does not contain a valid Assignment."
            })
        }
    } else {
        res.status(403).send({
            error: "Need to be either admin or user of the course to post an assignment."
        })
    }
});

/*
 * Route to fetch info about a specific photo.
 */
router.get("/:assignmentId", async function (req, res, next) {
    try{
        const assignment = await getAssignmentById(req.params.assignmentId)
        if(assignment){
            res.status(200).send({
                courseId : assignment.courseId,
                title : assignment.title,
                points: assignment.points,
                due: assignment.due
            })
        } else {
            next()
        }
    } catch (e) {
        next (e)
    }
});

/*
 * Route to update an assignment based on assignmentId
 */
router.patch("/:assignmentId", rateLimit, requireAuthentication, async function (req, res, next) {
    //Check user role
    const user = await getUserById(req.user)
    const getInstructorId = await getAssignmentById(req.params.assignmentId)
    const idCheck = await getCourseById(getInstructorId.courseId)

    if(user.role === "admin" || (user.role === "instructor" && user._id.toString() == idCheck.instructorId)){
        try{
            const result = await updateAssignmentById(req.params.assignmentId, req.body)
            res.status(200).send({
                msg: "Patch Succeeded."
            })
        } catch(e) {
            next(e)
        }
    } else {
        res.status(403).send({
            msg : "Need to be either admin or instructor of the course to edit assignment information."
        })
    }
});

/*
 * Route to delete an assignment based on assignmentId
 */
router.delete("/:assignmentId", rateLimit, requireAuthentication, async function (req, res, next) {
    //Check user role and/or Id for course
    const user = await getUserById(req.user)
    const getinstructorId = await getAssignmentById(req.params.assignmentId)
    const idCheck = await getCourseById(getinstructorId.courseId)

    if(user.role === "admin" || (user.role === "instructor" && user._id.toString() === idCheck.instructorId)){
        try{
            const assignment = await deleteAssignmentById(req.params.assignmentId)
            if(assignment){
                res.status(200).send({
                    msg: "SUCCEEDED"
                })
            } else {
                next()
            }
        } catch (e) {
            next(e)
        }
    } else {
        res.status(403).send({
            error: "Need to be either admin or instructor of course to edit assignment information."
        })
    }
});

/*
 * Route to get submission based on assignmentId
 */
router.get("/:assignmentId/submissions", rateLimit, requireAuthentication, async function (req, res, next) {
    //Check the role of user based on token
    const user = await getUserById(req.user)
    const submissionPage = await getSubmissionsPage(parseInt(req.query.page) || 1)
    submissionPage.links = {};

    if(user.role === "admin" || user.role === "instructor"){
        try{
            const submissionPage = await getSubmissionsPage(parseInt(req.query.page) || 1)
            submissionPage.links = {};
            if (submissionPage.page < submissionPage.totalPages) {
                submissionPage.links.nextPage = `/courses?page=${submissionPage.page + 1}`;
                submissionPage.links.lastPage = `/courses?page=${submissionPage.totalPages}`;
            }
            if (submissionPage.page > 1) {
                submissionPage.links.prevPage = `/courses?page=${submissionPage.page - 1}`;
                submissionPage.links.firstPage = "/courses?page=1";
            }
          
            const submission = await getSubmissionsById(req.params.assignmentId)
            if(submission){
                // const resBody = {
                //     submissions: submission,
                //     submissionPage: submissionPage
                // }
                res.status(200).send(submissionPage)
            } else {
                res.status(404).send({
                    err: "No submission exists."
                })
            }
        } catch (e) {
            next (e)
        }
    } else {
        res.status(403).send({
            error : "Unable to access the specified resource."
        })
    }
});

/*
 * Route to post a submission for assignment
 * This functions prob need to be a child of assignments and need to be created based on parent.
 * Function is partially done but still need a lot of work
 */
router.post("/:assignmentId/submissions", rateLimit, requireAuthentication, async function (req, res, next) {
    //check user role
    const user = await getUserById(req.user)
    const cousreIDGrab = await getAssignmentById(req.params.assignmentId)
    const studentEnrolledCheck = await getCourseById(cousreIDGrab.courseId)

    if(user.role === "student" && studentEnrolledCheck.student.includes(user._id.toString())){
        if(validateAgainstSchema(req.body, SubmissionSchema)){
            try{
                const id = await insertNewSubmission(req.body)
                res.status(201).send({
                    id: id
                })
            } catch (e) {
                next(e)
            }
        } else {
            res.status(400).send({
                error: "Requested body does not contain a valid Assignment."
            })
        }
    } else {
        res.status(403).send({
            error: "Need to be student of the course to submit assignment."
        })
    }
});
module.exports = router;