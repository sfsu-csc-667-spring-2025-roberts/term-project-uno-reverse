import { Request, Response, NextFunction } from "express";

export function authenticate(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    //   user has been logged out successfully
    // continue to the next route
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
  res.redirect("/lobby"); // Redirect authenticated users
}
