const mongoose=require("mongoose")

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URL) {
      throw new Error('MONGODB_URL is not set in environment');
    }

    await mongoose.connect(process.env.MONGODB_URL, {
      // use the unified topology and new URL parser for stability
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('DB Connected');
    return mongoose.connection;
    
    console.error('Failed to connect to MongoDB:', error && error.message ? error.message : error);
    // Rethrow so the caller can decide to exit or retry. Prevents the app
    // from starting while mongoose is disconnected which leads to buffering timeouts.
    throw error;
     await mongoose.connect(process.env.MONGODB_URL)
     console.log("DB Connected") 
     
   } catch (error) {
    console.log("Failed to connect")
   }
}

module.exports=connectDB