import { Request, Response } from "express";
import db from "../database/connection";
import Utils from "../utils/Utils";

export default class ConnectionsController {
  async index(request: Request, response: Response) {
    try {
      const totalConnections = await db("connections").count("* as total");

      const { total } = totalConnections[0];

      response.json({ total });
    } catch (err) {
      response.send(err);
    }
  }

  async create(request: Request, response: Response) {
    const { user_id } = request.body;

    const transaction = await db.transaction();

    try {
      await transaction("connections").insert({ user_id });
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
