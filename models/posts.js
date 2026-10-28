const mongoose = require("mongoose");
const Schema = mongoose.Schema;

main()
    .then(() => console.log("connection successful"))
    .catch((err) => console.log(err));

async function main() {
    await mongoose.connect("mongodb://127.0.0.1:27017/relationDemo");
}

const userSchema = new Schema({
    username: String,
    email: String
});

const postSchema = new Schema({
    content: String,
    likes: Number,
    user:{
        type: Schema.Types.ObjectId,
        ref: "User"
    }
});

const User = mongoose.model("User", userSchema);
const Post = mongoose.model("Post", postSchema);

// const addData = async () => {
//     let user1 = new User({
//         username: "Alice",
//         email: "alice@gmail.com"
//     })

//         let post1 = new Post({
//             content: "This is my first post",
//             likes: 10
//         })
    
//         post1.user = user1;

//         await user1.save();
//         await post1.save();
// };

// addData();

const addData = async () => {
    let user1 = await User.findOne({username: "Alice"});

        let post2 = new Post({
            content: "This is my second post",
            likes: 10
        })
    
        post2.user = user1;
        await post2.save();
};

addData();


