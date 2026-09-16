const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({

    name: {
        type: String,
        require: true
    },

    email: {
        type: String,
        require: true
    },

    password: {
        type: String,
        require: true
    },
    mobile:{
          type: String,
        require: true
    },
    status:{
          type: String,
       enum:['active','inactive','delete']
    },
   
picture:{
    type:String,
   
},
gender:{
      type: String,
        required: true
},
resetOtpHash: String,
resetOtpExpires: Date,
resetOtpAttempts: { type: Number, default: 0 },

},{
    timestamps:true
});

const user = mongoose.model("User", UserSchema);

module.exports = user;