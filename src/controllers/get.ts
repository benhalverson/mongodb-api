import { Request, Response } from "express";
import userModel from "../models/userModel";
import CError from "../error/CError";
import { IUser } from "../interfaces";
import { formatParamsToNumbers } from "../functions/format";
import companyModel from "../models/companyModel";
import { addQueries, Order } from "../config/mongodb/availableQueries";

/**Getting all the companies and the users who own them */
export const getAll = async (req: Request, res: Response) => {
  const companies = await companyModel.find().populate("founders", "name");
  const filteredCompanies = companies.map((company) => {
    return {
      Company: company.name,
      // @ts-ignore
      Founders: company.founders.map((founder: IUser) => founder.name),
    };
  });
  res.status(200).json(filteredCompanies);
};

/**Getting all the users */
export const getUsers = async (req: Request, res: Response) => {
  const { order, limit, offset } = addQueries(req);

  const users = await userModel
    .find()
    .sort({ id: order as Order })
    .limit(limit)
    .skip(offset);

  if (!users || users.length < 1) throw new CError("No users found", 404);
  res.status(200).json(users);
};

/**Getting all the companies */
export const getCompanies = async (req: Request, res: Response) => {
  const companies = await companyModel.find();
  if (!companies || companies.length < 1) throw new CError("No companies found", 404);
  res.status(200).json(companies);
};

/**Getting users by given Ids */
export const getUsersById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const ids = formatParamsToNumbers(id);
  const users = await userModel.find({ id: { $in: ids } });
  if (!users || users.length < 1) throw new CError("No users found", 404);
  res.status(200).json(users);
};

/**Getting companies by given Ids */
export const getCompaniesById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const ids = formatParamsToNumbers(id);
  const companies = await companyModel.find({ id: { $in: ids } });
  if (!companies || companies.length < 1) throw new CError("No companies found", 404);
  res.status(200).json(companies);
};
