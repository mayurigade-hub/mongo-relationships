# MongoDB Relationships with Mongoose

## Short description

This project demonstrates how to model relationships in MongoDB with Mongoose,
including referenced documents, `populate()`, one-to-many relationships, and
embedded subdocuments.

This repository is a small, runnable collection of examples showing how to model
relationships in MongoDB using [Mongoose](https://mongoosejs.com/).

The examples use a local MongoDB database named `relationDemo` and demonstrate
three common modeling patterns:

1. **One-to-many references** - a customer stores references to many orders.
2. **Many-to-one references** - a post stores a reference to its author.
3. **Embedded subdocuments** - a user stores addresses directly inside the user
   document.

The code is intentionally kept in separate scripts so each relationship can be
studied and run independently.

## Repository structure

```text
mongo-relationships/
├── models/
│   ├── customer.js   # Customer -> Order references and populate()
│   ├── posts.js      # Post -> User reference
│   └── user.js       # User with embedded address subdocuments
├── package.json
├── package-lock.json
└── .gitignore
```

## Prerequisites

- Node.js 18 or newer
- npm
- MongoDB Community Server running locally

The examples connect to:

```text
mongodb://127.0.0.1:27017/relationDemo
```

Make sure the MongoDB service is running before executing a script. The
application creates the `relationDemo` database and its collections when data
is first written.

## Installation

Clone the repository, enter the project directory, and install dependencies:

```bash
git clone <repository-url>
cd mongo-relationships
npm install
```

The project uses:

- **Mongoose** - schemas, models, validation, references, and queries.
- **Express** - included as a dependency for future web/API examples; the
  current examples are standalone scripts and do not start an Express server.

## Running the examples

There are currently no npm scripts for the examples, so run each file directly:

```bash
node models/user.js
node models/posts.js
node models/customer.js
```

Run the scripts one at a time. Each file opens its own MongoDB connection and
executes its example immediately.

### Recommended order

The examples are independent, but this order makes the data flow easiest to
follow:

1. `models/user.js` - creates a user with embedded addresses.
2. `models/posts.js` - creates or finds the same `Alice` user and creates a
   related post.
3. `models/customer.js` - creates orders and a customer, then demonstrates
   `populate()`.

The write operations in `models/posts.js` and `models/customer.js` are partly
commented out to prevent duplicate data on every run. Uncomment the relevant
seed function when you want to create its sample data.

## Concepts demonstrated

### 1. Referencing documents with ObjectId

MongoDB does not require foreign keys like a relational database. A document can
store the `_id` of another document instead:

```js
const postSchema = new mongoose.Schema({
  content: String,
  likes: Number,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});
```

`user` contains an ObjectId that points to a document in the `users`
collection. The `ref: "User"` value tells Mongoose which model should be used
when the reference is populated.

A reference stores only the relationship identifier. It does not automatically
copy the related document into the current document.

### 2. Populating references

`populate()` replaces a stored ObjectId with the related document when reading:

```js
const customer = await Customer.findOne({}).populate("orders");
console.log(customer);
```

Without `populate("orders")`, the result contains an array of order ObjectIds.
With it, Mongoose queries the `orders` collection and returns the matching
order documents in that array.

Conceptually:

```text
Customer
  orders: [orderId1, orderId2]

populate("orders")

Customer
  orders: [
    { item: "Samosa", price: 20, ... },
    { item: "Pizza", price: 100, ... }
  ]
```

Population is a Mongoose feature, not a native MongoDB join. For large or
complex read operations, MongoDB aggregation with `$lookup` may be a better
choice.

### 3. One customer with many orders

`models/customer.js` models a one-to-many relationship:

```js
const orderSchema = new mongoose.Schema({
  item: String,
  price: Number,
});

const customerSchema = new mongoose.Schema({
  name: String,
  orders: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
  ],
});
```

The customer document owns an array of references. Orders remain separate
documents, which is useful when:

- An order needs to be queried independently.
- Orders can grow without making the customer document unnecessarily large.
- An order has its own lifecycle or fields.
- The same related document may be referenced from more than one place.

The relationship is assembled by finding orders and adding them to the
customer:

```js
const customer = new Customer({ name: "Bob" });

const order1 = await Order.findOne({ item: "Samosa" });
const order2 = await Order.findOne({ item: "Pizza" });

customer.orders.push(order1);
customer.orders.push(order2);
await customer.save();
```

The commented `addOrders()` function inserts the sample orders:

```js
await Order.insertMany([
  { item: "Samosa", price: 20 },
  { item: "Burger", price: 50 },
  { item: "Pizza", price: 100 },
]);
```

### 4. A post belonging to one user

`models/posts.js` models a many-to-one relationship from posts to users:

```js
const userSchema = new Schema({
  username: String,
  email: String,
});

const postSchema = new Schema({
  content: String,
  likes: Number,
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});
```

Many posts can reference the same user:

```text
User: Alice
  _id: 64...

Post 1 -> user: 64...
Post 2 -> user: 64...
Post 3 -> user: 64...
```

The active example finds Alice and creates a second post:

```js
const user = await User.findOne({ username: "Alice" });

const post = new Post({
  content: "This is my second post",
  likes: 10,
  user,
});

await post.save();
```

The initial `addData()` example, which is commented out, shows how to create a
user and a first post together:

```js
const user = new User({
  username: "Alice",
  email: "alice@gmail.com",
});

const post = new Post({
  content: "This is my first post",
  likes: 10,
  user,
});

await user.save();
await post.save();
```

When assigning a full Mongoose document to a reference field, Mongoose stores
the referenced document's `_id`. For clarity, production code can assign
`user._id` explicitly.

### 5. Embedded address subdocuments

`models/user.js` embeds addresses directly inside a user document:

```js
const userSchema = new mongoose.Schema({
  username: String,
  addresses: [
    {
      _id: false,
      location: String,
      city: String,
    },
  ],
});
```

The resulting document has this shape:

```json
{
  "username": "Alice",
  "addresses": [
    {
      "location": "123 Main Streets",
      "city": "New York"
    },
    {
      "location": "456 Broadway",
      "city": "New York"
    }
  ]
}
```

By default, Mongoose gives every subdocument its own `_id`. The example uses
`_id: false` because an address does not need an independent identifier in this
model.

Embedding is a good choice when:

- The child data belongs exclusively to its parent.
- The child data is usually read with the parent.
- The child array has a reasonable maximum size.
- Separate queries for the child data are not required.

Use references instead when the child data is large, independently managed,
shared, or queried frequently on its own.

### 6. Pre and post middleware

Mongoose middleware, also called hooks, runs before or after a Mongoose
operation. Use **pre middleware** to prepare data or perform work before an
operation, and **post middleware** to react after the operation has completed.

For example, a pre-save hook can normalize a value before a document is saved:

```js
userSchema.pre("save", function (next) {
  this.username = this.username.trim();
  next();
});
```

Post middleware is useful for related-document cleanup. In the customer
example, deleting a customer can also delete the orders referenced by that
customer:

```js
customerSchema.post("findOneAndDelete", async (customer) => {
  if (customer?.orders?.length) {
    await Order.deleteMany({
      _id: { $in: customer.orders },
    });
  }
});
```

Register middleware **before** compiling the schema into a model:

```js
customerSchema.post("findOneAndDelete", cleanupOrders);
const Customer = mongoose.model("Customer", customerSchema);
```

Middleware applies to specific operation types. For example, `save` hooks
run for `document.save()`, while `findOneAndDelete` hooks run for
`Model.findOneAndDelete()`. They do not automatically run for every
operation, so choose the hook that matches the operation used by the
application. Use optional chaining or a null check in post-delete hooks
because a delete query may not find a matching document.

## Reference versus embedding

| Pattern | Example in this repository | Data location | Best suited for |
| --- | --- | --- | --- |
| Reference | `Customer.orders` | Separate collection | Large, independent, or shared data |
| Reference | `Post.user` | Separate collection | Many documents pointing to one owner |
| Embedded subdocument | `User.addresses` | Parent document | Small child data owned by one parent |

MongoDB modeling is driven by access patterns. Embedding can reduce the number
of queries, while references prevent documents from becoming too large and
allow related data to evolve independently.

## Database and collection names

Mongoose derives collection names from model names:

| Mongoose model | Typical MongoDB collection |
| --- | --- |
| `User` | `users` |
| `Post` | `posts` |
| `Customer` | `customers` |
| `Order` | `orders` |

All examples use the same `relationDemo` database. The `User` model is declared
in both `user.js` and `posts.js`; because these scripts are separate Node.js
processes, that duplication does not cause a model-registration conflict.

## Important implementation notes

- Each script has its own `mongoose.connect()` call.
- Each script logs a successful connection or the connection error.
- The scripts do not explicitly close the connection. For short-lived examples
  this is acceptable; a production application should close connections during
  shutdown.
- The scripts execute database work at module load time. In a larger
  application, move connection and seed logic into explicit application
  functions.
- The schemas currently use simple fields such as `String` and `Number`.
  Production schemas should normally add validation, required fields, indexes,
  timestamps, and error handling appropriate to the application.

## Troubleshooting

### `ECONNREFUSED 127.0.0.1:27017`

MongoDB is not running or is listening on another port. Start MongoDB and
confirm that the connection string matches your local setup.

### `Cannot read properties of null` in `posts.js`

The script expects a user named `Alice` to exist. Run `models/user.js` first, or
uncomment and run the initial user creation block in `models/posts.js`.

### `populate()` returns an empty or missing relationship

Confirm that:

1. The referenced document exists.
2. The ObjectId was saved in the reference field.
3. The `ref` value exactly matches the Mongoose model name.
4. The field passed to `populate()` matches the schema field name.

### Duplicate sample records

The example seed functions insert new documents each time they are run. Remove
old sample data in MongoDB, or change the seed code to use an upsert and a
stable unique field.

## Possible next steps

- Add a single entry point and npm scripts for each example.
- Add `try/catch/finally` handling and close the MongoDB connection cleanly.
- Add schema validation such as `required`, `min`, and `maxlength`.
- Add queries that populate a post's author and a user's posts.
- Add tests with an isolated MongoDB instance.
- Add an Express API demonstrating create, read, update, and delete operations.

## License

The `package.json` currently declares the `ISC` license.
