
import type { Request, Response } from "express";
import {param, validationResult} from "express-validator"
import slug from "slug"
import formidable from "formidable"
import User from "../models/User";
import {v4 as uuid} from "uuid"
import { checkPassword, hashPassword } from "../utils/auth";
import { generateJWT } from "../utils/jwt";
import cloudinary from "../Config/cloudinary";


export const createAccount = async (req: Request,res: Response) => {
   
    //identificador email unico
   const {email, password} = req.body
   const userExists = await User.findOne({email})
   if (userExists) {
    const error = new Error('El usuario ya existe')
    res.status(409).json({error : error.message})
    return
   }
   //identificador nombre de usuario unico
   const handle = slug(req.body.handle,'')
   const handleExists = await User.findOne({handle})
   if (handleExists) {
    const error = new Error('nombre de usuario no disponible')
    res.status(409).json({error : error.message})
    return
   }

   const user = new User(req.body)
   user.password = await hashPassword(password)
   user.handle = handle
   await user.save()
   res.status(201).send('registro creado ')
}

export const login = async (req:Request, res: Response) =>{
      let errors = validationResult(req)
    if (!errors.isEmpty()) {
         res.status(400).json({errors: errors.array()})
         return
    }
   
      //validacion de usuario
   const {email, password} = req.body
   const user = await User.findOne({email})
   if (!user) {
    const error = new Error('El usuario no existe')
    res.status(404).json({error : error.message})
    return
   }
   //comprobar usuario
  const isPasswordCorrect= await checkPassword(password,user.password)
   if (!isPasswordCorrect) {
    const error = new Error('Password incorrecto')
    res.status(401).json({error : error.message})
    return
   }
   const token =  generateJWT({id : user._id})
   res.send(token)
}

export const getUser = async (req:Request, res: Response) => {
      res.json(req.user)
}

export const updateProfile = async (req:Request, res: Response) => {
      try {
         const {description, links} = req.body
          //identificador nombre de usuario unico
            const handle = slug(req.body.handle,'')
            const handleExists = await User.findOne({handle})
            if (handleExists && handleExists.email !== req.user.email) {
            const error = new Error('nombre de usuario no disponible')
            res.status(409).json({error : error.message})
            return
            }

            req.user.description = description
            req.user.handle = handle
            req.user.links = links
            await req.user.save()
            res.send('perfil actualizado correctamente')
      } catch (e) {
            const error = new Error('hubo un error')
           res.status(500).json({error: error.message})
           return 
      }
}

export const uploadImage = async (req:Request, res: Response) => {
      const form = formidable({multiples:false})
       
      try {
        form.parse(req, (error,fields, files) =>{
        cloudinary.uploader.upload(files.file[0].filepath, {public_id: uuid()}, async function (error, result) {
           if (error) {
             const error = new Error('hubo un error al subir la imagen')
                  res.status(500).json({error: error.message})
                  return 
           }
           if (result) {
             req.user.Image = result.secure_url
             await req.user.save()
             res.json({image: result.secure_url})
           }
           
        })
      })    
      } catch (e) {
             const error = new Error('hubo un error')
                  res.status(500).json({error: error.message})
                  return 
      }

}

export const getUserByHandle = async (req:Request, res: Response) => {
  try {
      const {handle} = req.params
    const user = await  User.findOne({handle}).select('-_id -__v -email -password')
    if (!user) {
      const error = new Error('El usuario no existe')
      res.status(404).json({error: error.message})
    }
    res.json(user)
  } catch (e) {
       const error = new Error('hubo un error')
                  res.status(500).json({error: error.message})
                  return 
  }
}

export const searchByHandle = async (req:Request, res: Response) => {
  try {
  const {handle} =  req.body
  const userExists = await User.findOne({handle})
  if (userExists) {
    const error = new Error(`${handle} ya está registrado`)
    res.status(409).json({error: error.message})
    return
  }
  res.send(`${handle} está disponible`)

 } catch (e) {
       const error = new Error('hubo un error')
                  res.status(500).json({error: error.message})
                  return 
  }
}