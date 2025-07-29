import joi from 'joi'
export const validateRegistration = (data) =>{
    const schema = joi.object({
        name: joi.string().trim().min(3).max(50).required(),
        email: joi.string().email().required(),
        password: joi.string().min(6).required(),

    })
    return schema.validate(data)
}
export const validatelogin = (data) => {
  const schema = joi.object({
    email: joi.string().email().required(),
    password: joi.string().min(8).required(),
  });
  return schema.validate(data)
}
  