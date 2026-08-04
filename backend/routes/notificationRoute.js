import express from "express"

import {
   getNotifications
} from "../controllers/notificationController.js"

const notificationRouter = express.Router()

notificationRouter.get("/", getNotifications)

export default notificationRouter