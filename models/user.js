const mongoose = require("mongoose");

main()
    .then(() => console.log("connection successful"))
    .catch((err) => console.log(err));

async function main() {
    await mongoose.connect("mongodb://127.0.0.1:27017/relationDemo");
}

const userSchema = new mongoose.Schema({
    username: String,
    addresses: [
        {
            //Keeping id as false because we don't want to create a new id for each address.
            _id :false,
            location: String,
            city: String,
        },
    ],
})

const User = mongoose.model("User", userSchema);


const addUsers = async () => {
    let user1 = new User({
        username: "Alice",
        addresses: [
            {
                location: "123 Main Streets",
                city: "New York"
            },
            {
                location: "456 Broadway",
                city: "New York"
            }
        ]
    });
    await user1.save();
}

addUsers();
