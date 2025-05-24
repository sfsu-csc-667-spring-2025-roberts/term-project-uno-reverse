import { Request, Response, NextFunction } from "express";

export function authenticate(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }

  req.flash("error_message", "Please log in to view that resource");
  res.redirect("/login");
}

export function forwardAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.isAuthenticated()) {
    return next();
  }

  res.redirect("/lobby"); // User is already logged in
}
