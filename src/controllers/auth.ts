import { NextFunction, Request, Response } from "express";
import jsonwebtoken from "jsonwebtoken";
import userModel from "../models/userModel";
import CError from "../error/CError";
import {
  validateAuthorization,
  validateDecoded,
  validateEmail,
  validateName,
  validatePassword,
  validateToken,
} from "../functions/validate";
import { compareSalt, hashIt } from "../functions/encrypt";
import { isEmailTaken, isNameTaken } from "../functions/query";
import { secretKey } from "../config/secretKey";

/**Creating a new user */
export const createUser = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  validateName(name);
  validateEmail(email);
  validatePassword(password);
  if (await isEmailTaken(email)) throw new CError("Email already taken", 409);
  if (await isNameTaken(name)) throw new CError("Name already taken", 409);
  const newUser = new userModel({ name, email, password });
  await newUser.save();
  res.status(201).json({ message: "User created" });
};

/**Logging in existing user */
export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  validateEmail(email);
  validatePassword(password);
  const [user] = await userModel.find({ email: email });
  if (!user) throw new CError("User not found", 404);
  const comparedPasswords = compareSalt(user.password, password);
  if (!comparedPasswords) throw new CError("Invalid password", 401);
  const jwtKey = hashIt(secretKey);
  const token = jsonwebtoken.sign({ userId: user.id }, jwtKey, { expiresIn: "5m" });
  res.status(200).json({ token: token });
};

/**Authorizing the user */
export const authToken = (req: Request, res: Response, next: NextFunction) => {
  const { authorization } = req.headers;
  validateAuthorization(authorization);
  const authorizationStr = authorization as string;
  const token = authorizationStr.split(" ")[1];
  validateToken(token);
  const jwtKey = hashIt(secretKey);
  const decoded = jsonwebtoken.verify(token, jwtKey);
  validateDecoded(decoded);
  const { userId } = decoded as { userId: number };
  res.locals.userId = userId;
  next();
};
