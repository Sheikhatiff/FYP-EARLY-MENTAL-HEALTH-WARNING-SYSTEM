import express from 'express';
import {classify, classifyController} from '../controllers/classify.controller.js'
const modelRouter = express.Router();

modelRouter.post('/classify',classifyController)
modelRouter.get('/classify',async (req,res)=>{
    res.status(200).json({result : await classify("so what if we are not together, atleast we share the same sky...")})
})

export default modelRouter;