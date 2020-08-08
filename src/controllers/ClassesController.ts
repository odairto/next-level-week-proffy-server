import { Request, Response } from "express";
import db from "../database/connection";
import Utils from "../utils/Utils";

interface ScheduleItem {
  week_day: string;
  from: string;
  to: string;
}

export default class ClassesController {
  async index(request: Request, response: Response) {
    try {
      const filters = request.query;
      const week_day = filters.week_day as string;
      const subject = filters.subject as string;
      const time = filters.time as string;

      if (!week_day || !subject || !time)
        return response.status(400).json({
          error: "Missing filters to search classes",
        });

      const timeInMinutes = Utils.convertHourToMinutes(time);
      const classes = await db("classes")
      .whereExists(function(){
          this.select('class_schedule.*')
          .from('class_schedule')
          .whereRaw('`class_schedule`.`class_id` = `classes`.`id`')
          .whereRaw('`class_schedule`.`week_day` = ??', [Number(week_day)])
          .whereRaw('`class_schedule`.`from` <= ??', [timeInMinutes])
          .whereRaw('`class_schedule`.`to` > ??', [timeInMinutes])
      })
        .where("classes.subject", "=", subject)
        .join("users", "classes.user_id", "=", "users.id")
        .select(["classes.*", "users.*"]);

      response.json(classes);
    } catch (err) {
      response.send(err);
    }
  }

  async create(request: Request, response: Response) {
    const {
      name,
      avatar,
      whatsapp,
      bio,
      subject,
      cost,
      schedule,
    } = request.body;

    const transaction = await db.transaction();

    try {
      const insertedUsersIds = await transaction("users")
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

      await transaction("classes").insert({
        subject,
        cost,
        user_id,
      });

      const insertedClassesIds = await transaction("classes").insert({
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

      await transaction("class_schedule").insert(classSchedule);

      await transaction.commit();
    } catch (err) {
      transaction.rollback();
      return response.status(400).json({
        error: "Erro",
      });
    }

    response.status(201).send();
  }
}
