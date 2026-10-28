const mongoose = require("mongoose");

main()
    .then(() => console.log("connection successful"))
    .catch((err) => console.log(err));

async function main() {
    await mongoose.connect("mongodb://127.0.0.1:27017/relationDemo");
}

const orderSchema = new mongoose.Schema({
    item: String,
    price: Number,
})

const customerSchema = new mongoose.Schema({
    name: String,
    orders: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order"
        }
    ]
})

const Order = mongoose.model("Order", orderSchema);
const Customer = mongoose.model("Customer", customerSchema);

const addCustomer = async () => {
    let cust1 = new Customer({
        name: "Bob",
    });

    let order1 = await Order.findOne({item: "Samosa"});
    let order2 = await Order.findOne({item: "Pizza"});

    cust1.orders.push(order1);
    cust1.orders.push(order2);

    let result = await cust1.save();

    console.log(result);
}
addCustomer();

// const addOrders = async () => {
//     let res = await Order.insertMany([
//         {item: "Samosa" , price: 20},
//         {item: "Burger" , price: 50},
//         {item: "Pizza" , price: 100},
//     ]);
//     console.log(res);
// }

// addOrders();