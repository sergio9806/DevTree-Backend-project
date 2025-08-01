
import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import router from './router';
import { connectDB } from './Config/db';
import { corsConfig } from './Config/cors';


connectDB()
const app = express()

//cors 
app.use(cors(corsConfig))

app.use(express.json())
app.use('/', router)


    export default app;