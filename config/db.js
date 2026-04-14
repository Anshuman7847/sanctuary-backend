const mongoose=require("mongoose")

const connectDB=async()=>{
    
   try {
     await mongoose.connect(process.env.MONGODB_URL)
     console.log("DB Connected") 
     
   } catch (error) {
    console.log("Failed to connect")
   }
}

module.exports=connectDB