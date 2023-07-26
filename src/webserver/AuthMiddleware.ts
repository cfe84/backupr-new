import { NextFunction, Request, Response } from "express";

export class AuthMiddleware {
  private validateAuth(authorization: string) {
    return true;
  }

  public authorize() {
    return (req: Request, res: Response, next: NextFunction) => {
      const authorization = req.headers["authorization"];
      if (!authorization) {
        res.statusCode = 401; // Unauthorized
        res.end();
      } else if (!this.validateAuth(authorization)) {
        res.statusCode = 403; // Forbidden
      } else {
        next();
      }
    }
  }
}