// src/validators/resource.validators.js
import { body } from "express-validator";

// Validation rules for POST /api/resources
export const resourceValidators = [
  body("action")
    .exists({ checkFalsy: true })
    .withMessage("action is required")
    .trim()
    .isIn(["create"])
    .withMessage("action must be 'create'"),

  body("resourceName")
    .exists({ checkFalsy: true })
    .withMessage("Name is required")
    .isString()
    .withMessage("Name must be a string")
    .trim()
    .matches(/^[A-Za-z0-9 ]+$/)
    .withMessage("Name can only contain letters, numbers, and spaces")
    .isLength({ min: 5, max: 30 })
    .withMessage("Name must be 5-30 characters"),

  body("resourceDescription")
    .exists({ checkFalsy: true })
    .withMessage("Description is required")
    .isString()
    .withMessage("Description must be a string")
    .trim()
    .matches(/^[A-Za-z0-9 ]+$/)
    .withMessage("Description can only contain letters, numbers, and spaces")
    .isLength({ min: 10, max: 50 })
    .withMessage("Description must be 10-50 characters"),

  body("resourceAvailable")
    .exists()
    .withMessage("Available is required")
    .isBoolean()
    .withMessage("Available must be boolean"),

  body("resourcePrice")
    .exists()
    .withMessage("Price is required")
    .isFloat({ min: 0 })
    .withMessage("Price must be a non-negative number"),

  body("resourcePriceUnit")
    .exists({ checkFalsy: true })
    .withMessage("Price Unit is required")
    .isString()
    .withMessage("Price Unit must be a string")
    .trim()
    .isIn(["hour", "day", "week", "month"])
    .withMessage("Price Unit must be 'hour', 'day', 'week', or 'month'"),
];