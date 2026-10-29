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


//Using Populate to get the data of orders in customer collection not just the id of orders.
const findCustomer = async () => {
    let resultt = await Customer.findOne({}).populate("orders");
    console.log(resultt);
}
findCustomer();

customerSchema.post = ("findOneAndDelete", async (customer) => {
    if(customer.orders.length) {
        await Order.deleteMany({
            _id: {
                $in: customer.orders
            }
        });
    }
});

// const addCustomer = async () => {
//     let cust1 = new Customer({
//         name: "Bob",
//     });

//     let order1 = await Order.findOne({item: "Samosa"});
//     let order2 = await Order.findOne({item: "Pizza"});

//     cust1.orders.push(order1);
//     cust1.orders.push(order2);

//     let result = await cust1.save();

//     console.log(result);
// }
// addCustomer();

// const addOrders = async () => {
//     let res = await Order.insertMany([
//         {item: "Samosa" , price: 20},
//         {item: "Burger" , price: 50},
//         {item: "Pizza" , price: 100},
//     ]);
//     console.log(res);
// }

// addOrders();

const addCust = async () => {
    let newCust = new Customer({
        name: "Alice",
    });

    let newOrder = new Order({
        item: "Pasta",
        price: 80,
    })

    newCust.orders.push(newOrder);

    await newCust.save();
    await newOrder.save();

    console.log("Customer and Order added successfully");  
}

// addCust();

const delCust = async () => {
    let data = await Customer.findByIdAndDelete('6ae2ddc889cf7739e1c3e366');
    console.log(data);
}
delCust();
