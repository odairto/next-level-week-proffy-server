import express from "express";
import db from "./database/connection";
import Utils from "./utils/Utils";

const routes = express.Router();

interface ScheduleItem {
  week_day: string;
  from: string;
  to: string;
}

routes.post("/classes", async (request, response) => {
  const { name, avatar, whatsapp, bio, subject, cost, schedule } = request.body;

  const insertedUsersIds = await db("users")
    .insert({
      name,
      avatar,
      whatsapp,
      bio,
    })
    .catch((err) => {
      throw err;
    });

  const user_id = insertedUsersIds[0];

  await db("classes").insert({
    subject,
    cost,
    user_id,
  });

  const insertedClassesIds = await db("classes").insert({
    subject,
    cost,
    user_id,
  });

  const class_id = insertedClassesIds[0];

  const classSchedule = schedule.map((scheduleItem: ScheduleItem) => {
    return {
      class_id: class_id,
      week_day: scheduleItem.week_day,
      from: Utils.convertHourToMinutes(scheduleItem.from),
      to: Utils.convertHourToMinutes(scheduleItem.to),
    };
  });

  await db("class_schedule").insert(classSchedule);

  response.send();
});

export default routes;
