const { Router } = require("express");
const { connectToDb } = require("../lib/mongo");
const { rateLimit } = require('../lib/rateLimit')

const router = Router();

/*
 * Route to return a list of businesses.
 */
router.get("/", async function (req, res) {
});

/*
 * Route to create a new business.
 */
router.post("/", async function (req, res, next) {
});

/*
 * Route to fetch info about a specific business.
 */
router.get("/:submissionId", async function (req, res, next) {
});

/*
 * Route to update data for a business.
 */
router.patch("/:submissionId", async function (req, res, next) {
});

/*
 * Route to delete a business.
 */
router.get("/:submissionId/students", async function (req, res, next) {
});

/*
 * Route to delete a business.
 */
router.post("/:submissionId/students", async function (req, res, next) {
});

/*
 * Route to delete a business.
 */
router.get("/:submissionId/roster", async function (req, res, next) {
});

/*
 * Route to delete a business.
 */
router.get("/:submissionId/assignments", async function (req, res, next) {
});

module.exports = router;
